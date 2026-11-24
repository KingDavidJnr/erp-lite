import prisma from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/index.js";

class SalesService {
  // List sales for a branch with optional date filtering
  async getAllSales(branchId, startDate, endDate) {
    const where = { branchId };

    // Apply date filters if provided
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        where.saleDate.gte = new Date(startDate);
      }
      if (endDate) {
        // Ensure the end date covers the full day up to 23:59:59
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.saleDate.lte = end;
      }
    }

    return prisma.sale.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        user: { select: { username: true } },
      },
      orderBy: { saleDate: "desc" }, // Ordering by saleDate makes more sense for the user
    });
  }

  // Get sale details (for invoice/view)
  async getSaleById(id) {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        saleItems: {
          include: { inventoryItem: true },
        },
        branch: true,
        user: { select: { firstName: true, lastName: true, username: true } },
      },
    });
  }

  // Create a new sale
  async createSale(branchId, userId, userName, data) {
    const { customerId, saleDate, items, note } = data;

    return prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      // Atomically check and deduct stock for all items first
      for (const item of items) {
        if (!item.inventoryItemId) continue;

        const qty = Number(item.quantity);

        const updated = await tx.inventoryItem.updateMany({
          where: {
            id: item.inventoryItemId,
            quantity: { gte: qty },
          },
          data: { quantity: { decrement: qty } },
        });

        if (updated.count === 0) {
          const inv = await tx.inventoryItem.findUnique({
            where: { id: item.inventoryItemId },
            select: { name: true, quantity: true },
          });

          if (!inv) {
            return {
              message: `Inventory item not found: ${item.inventoryItemId}`,
            };
          }

          return {
            message: `Insufficient stock for "${inv.name}". Available: ${inv.quantity}, Requested: ${qty}`,
          };
        }
      }

      // All stock checks passed — create the sale
      const sale = await tx.sale.create({
        data: {
          branchId,
          customerId,
          saleDate: new Date(saleDate),
          totalAmount: 0,
          status: "COMPLETED",
          note,
          createdBy: userId,
        },
      });

      // Create sale items and movements
      for (const item of items) {
        const qty = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const subtotal = Number(item.subtotal);

        totalAmount += subtotal;

        await tx.saleItem.create({
          data: {
            branchId,
            saleId: sale.id,
            inventoryItemId: item.inventoryItemId || null,
            name: item.name,
            quantity: qty,
            unitPrice: unitPrice,
            subtotal: subtotal,
          },
        });

        if (item.inventoryItemId) {
          await tx.inventoryMovement.create({
            data: {
              branchId,
              inventoryItemId: item.inventoryItemId,
              type: "SALE",
              quantity: qty,
              referenceId: sale.id,
              note: `Sale to customer: ${customerId || "Walk-in"}`,
              transactionDate: new Date(saleDate),
            },
          });
        } else {
          await tx.inventoryMovement.create({
            data: {
              branchId,
              inventoryItemId: null,
              type: "FIELD_SALE",
              quantity: qty,
              referenceId: sale.id,
              note: `Field sale: ${item.name}`,
              transactionDate: new Date(saleDate),
            },
          });
        }
      }

      // Update final totalAmount
      const completedSale = await tx.sale.update({
        where: { id: sale.id },
        data: { totalAmount },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          branchId,
          userId,
          module: "Sales",
          action: `${userName} recorded a new sale: ${completedSale.id}. Total: ${totalAmount}`,
          referenceType: "Sale",
          referenceId: completedSale.id,
        },
      });

      return completedSale;
    });
  }

  // Reduce items (Same-day)
  async reduceSaleItem(saleItemId, branchId, userId, userName) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.saleItem.findUnique({
        where: { id: saleItemId },
        include: { sale: true },
      });

      if (!item) throw new Error("Sale item not found");

      // Logic check for same-day is handled in the controller before calling this
      // Update item to crossed out state
      const updatedItem = await tx.saleItem.update({
        where: { id: saleItemId },
        data: { isRemoved: true },
      });

      // Add back to inventory if applicable
      if (item.inventoryItemId) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: { quantity: { increment: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            branchId,
            inventoryItemId: item.inventoryItemId,
            type: "REDUCE",
            quantity: item.quantity,
            referenceId: item.saleId,
            note: `Same-day reduction for sale item: ${item.id}`,
            transactionDate: item.sale.saleDate,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          branchId,
          userId,
          module: "Sales",
          action: `${userName} reduced (crossed out) item: ${item.name} from sale: ${item.saleId}`,
          referenceType: "SaleItem",
          referenceId: item.id,
        },
      });

      return updatedItem;
    });
  }

  // Record Return (Later date) - fixing
  async recordReturn(saleItemId, branchId, userId, userName, data) {
    const { quantity, returnDate, note } = data;
    const requestedQuantity = new Prisma.Decimal(quantity)

    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
      SELECT id from "SaleItem"
      WHERE id = ${saleItemId}::uuid
      FOR UPDATE`;

      const item = await tx.saleItem.findUnique({
        where: { id: saleItemId },
        include: { sale: true },
      });

      if (!item) throw new Error("Sale item not found");

      const previousReturns = await tx.returnTransaction.aggregate({
        where: {saleItemId},
        _sum: {quantity: true}
      })

      const alreadyReturned = previousReturns._sum.quantity ?? new Prisma.Decimal(0)

      if (requestedQuantity.lte(0) || alreadyReturned.plus(requestedQuantity).gt(item.quantity)) {
        throw new Error("Return quantity exceeds remaining quantity")
      }

      const returnTx = await tx.returnTransaction.create({
        data: {
          branchId,
          saleItemId,
          customerId: item.sale.customerId,
          returnDate: new Date(returnDate),
          quantity: requestedQuantity,
          note,
          createdBy: userId,
        },
      });

      // Add back to inventory
      if (item.inventoryItemId) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: { quantity: { increment: requestedQuantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            branchId,
            inventoryItemId: item.inventoryItemId,
            type: "RETURN",
            quantity: requestedQuantity,
            referenceId: returnTx.id,
            note: `Later-date return: ${note}`,
            transactionDate: new Date(returnDate),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          branchId,
          userId,
          module: "Sales",
          action: `${userName} recorded a return for item: ${item.name} from sale: ${item.saleId}`,
          referenceType: "ReturnTransaction",
          referenceId: returnTx.id,
        },
      });

      return returnTx;
    });
  }

  // Delete sale (Reverse stock & clean up relations)
  async deleteSale(id, branchId, userId, userName) {
    // 1. Check if sale exists first (Non-throwing)
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { saleItems: true },
    });

    if (!sale) {
      return { success: false, message: "Sale record not found" };
    }

    return prisma.$transaction(async (tx) => {
      // 2. Restore Inventory for active items
      for (const item of sale.saleItems) {
        // Only restore if it wasn't already "reduced" (crossed out)
        if (!item.isRemoved && item.inventoryItemId) {
          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }

      // CLEAN UP RELATIONS (The Manual Cascade)

      // Delete return transactions linked to this sale's items
      const saleItemIds = sale.saleItems.map((item) => item.id);
      await tx.returnTransaction.deleteMany({
        where: { saleItemId: { in: saleItemIds } },
      });

      // Delete inventory movements referencing this sale
      await tx.inventoryMovement.deleteMany({
        where: { referenceId: id },
      });

      // Delete the items first
      await tx.saleItem.deleteMany({
        where: { saleId: id },
      });

      // Finally, delete the sale itself
      const deletedSale = await tx.sale.delete({
        where: { id },
      });

      // 4. Audit Log (Using the BigInt userId)
      await tx.auditLog.create({
        data: {
          branchId,
          userId: BigInt(userId),
          module: "Sales",
          action: `${userName} deleted sale: ${id} and restored inventory stock.`,
          referenceType: "Sale",
          referenceId: id,
        },
      });

      return { success: true, data: deletedSale };
    });
  }

  // Generate sales report
  async generateSalesReport(branchId, startDate, endDate) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : undefined;

    return prisma.sale.findMany({
      where: {
        branchId,
        saleDate: { gte: start, lte: end },
      },
      include: {
        customer: { select: { name: true } },
        saleItems: true,
      },
      orderBy: { saleDate: "asc" },
    });
  }
}

export const salesService = new SalesService();
