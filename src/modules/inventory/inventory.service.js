// inventory.service.js
import prisma from "../../lib/prisma.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

class InventoryService {
  // List all inventory items for a branch
  async getAllInventory(branchId) {
    return prisma.inventoryItem.findMany({
      where: { branchId },
      orderBy: { createdAt: "asc" },
    });
  }

  // Get inventory item by ID
  async getInventoryById(id) {
    return prisma.inventoryItem.findUnique({
      where: { id },
    });
  }

  // Create inventory item with audit log
  async createInventoryItem(branchId, userId, userName, data) {
    const { name, costPrice, sellingPrice, quantity, lowStockThreshold } = data;

    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          branchId,
          name,
          costPrice,
          sellingPrice,
          quantity,
          lowStockThreshold,
        },
      });

      await tx.auditLog.create({
        data: {
          branchId,
          userId,
          module: "Inventory",
          action: `${userName} added a new inventory item: ${item.name}`,
          referenceType: "InventoryItem",
          referenceId: item.id,
        },
      });

      return item;
    });
  }

  // Update inventory item with audit log
  async updateInventoryItem(id, branchId, userId, userName, data) {
    return prisma.$transaction(async (tx) => {
      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data,
      });

      await tx.auditLog.create({
        data: {
          branchId,
          userId,
          module: "Inventory",
          action: `${userName} updated inventory item: ${updatedItem.name}`,
          referenceType: "InventoryItem",
          referenceId: updatedItem.id,
        },
      });

      return updatedItem;
    });
  }

  // Delete inventory item with audit log
  async deleteInventoryItem(id, branchId, userId, userName) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id },
      });

      if (!item) {
        return { deleted: false, message: "Inventory item not found" };
      }

      if (Number(item.quantity) !== 0) {
        return {
          deleted: false,
          message: `Cannot delete "${item.name}" because it still has ${item.quantity} in stock.`,
        };
      }

      await tx.inventoryMovement.updateMany({
        where: { inventoryItemId: id },
        data: { inventoryItemId: null },
      });

      await tx.saleItem.updateMany({
        where: { inventoryItemId: id },
        data: { inventoryItemId: null },
      });

      await tx.writeOff.deleteMany({
        where: { inventoryItemId: id },
      });

      const deletedItem = await tx.inventoryItem.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          branchId,
          userId,
          module: "Inventory",
          action: `${userName} deleted inventory item: ${deletedItem.name}`,
          referenceType: "InventoryItem",
          referenceId: deletedItem.id,
        },
      });

      return { deleted: true, message: "Inventory item deleted successfully" };
    });
  }

  // Add stock quantity to existing item with audit log
  async addStock(id, branchId, userId, userName, quantityToAdd, driverName, transactionDate) {
    const parsedQuantity = Number(quantityToAdd);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      throw new Error("Invalid quantity");
    }

    const txDate = transactionDate ? new Date(transactionDate) : new Date();

    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.update({
        where: { id },
        data: {
          quantity: {
            increment: parsedQuantity,
          },
        },
      });

      // Build narration: include driver name if provided
      const note = driverName && driverName.trim()
        ? `Received from ${driverName.trim()} (Added by ${userName})`
        : `Added by ${userName}`;

      // Create InventoryMovement record
      await tx.inventoryMovement.create({
        data: {
          branchId,
          inventoryItemId: id,
          type: "ADD",
          quantity: parsedQuantity,
          note,
          transactionDate: txDate,
        },
      });

      await tx.auditLog.create({
        data: {
          branchId,
          userId,
          module: "Inventory",
          action: `${userName} added ${parsedQuantity} to inventory item: ${item.name}`,
          referenceType: "InventoryItem",
          referenceId: item.id,
        },
      });

      return item;
    });
  }

  // Write off lost/damaged items with audit log
  async writeOffItem(id, branchId, userId, userName, quantity, reason) {
    const parsedQuantity = Number(quantity);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      throw new Error("Invalid quantity");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryItem.updateMany({
        where: {
          id,
          quantity: { gte: parsedQuantity },
        },
        data: { quantity: { decrement: parsedQuantity } },
      });

      if (updated.count === 0) {
        const item = await tx.inventoryItem.findUnique({
          where: { id },
          select: { name: true, quantity: true },
        });

        if (!item) {
          throw new Error("Inventory item not found");
        }

        throw new Error(
          `Insufficient stock to write off. Available: ${item.quantity}, Requested: ${parsedQuantity}`,
        );
      }

      const updatedItem = await tx.inventoryItem.findUnique({
        where: { id },
      });

      // Create WriteOff record
      await tx.writeOff.create({
        data: {
          branchId,
          inventoryItemId: id,
          quantity: parsedQuantity,
          reason,
          createdBy: userId,
        },
      });

      // Create InventoryMovement record
      await tx.inventoryMovement.create({
        data: {
          branchId,
          inventoryItemId: id,
          type: "WRITE_OFF",
          quantity: parsedQuantity,
          note: reason,
        },
      });

      // Create Audit log
      await tx.auditLog.create({
        data: {
          branchId,
          userId,
          module: "Inventory",
          action: `${userName} wrote off ${parsedQuantity} of inventory item: ${updatedItem.name} due to: ${reason}`,
          referenceType: "InventoryItem",
          referenceId: updatedItem.id,
        },
      });

      return updatedItem;
    });
  }

  // List low-stock items
  async getLowStockItems(branchId) {
    // Fetch all items for the branch
    const items = await prisma.inventoryItem.findMany({
      where: { branchId },
    });

    // Filter and sort in JavaScript
    const lowStockItems = items
      .filter((item) => Number(item.quantity) <= Number(item.lowStockThreshold))
      .sort((a, b) => Number(a.quantity) - Number(b.quantity));

    return lowStockItems;
  }

  // Get inventory movements for a specific item, with resolved customer/sale narration
  async getInventoryMovements(inventoryItemId) {
    const movements = await prisma.inventoryMovement.findMany({
      where: { inventoryItemId },
      orderBy: { transactionDate: "desc" },
    });

    // Collect all referenceIds (Sale IDs) from SALE/REDUCE/RETURN movements
    const saleIds = movements
      .filter((m) => m.referenceId && ["SALE", "REDUCE", "RETURN"].includes(m.type))
      .map((m) => m.referenceId);

    // Batch-fetch the linked sales with their customer names only
    // (transactionDate is now stored directly on the movement — no join needed for the date)
    const sales = saleIds.length
      ? await prisma.sale.findMany({
          where: { id: { in: saleIds } },
          include: { customer: { select: { name: true } } },
        })
      : [];

    const saleMap = Object.fromEntries(sales.map((s) => [s.id, s]));

    return movements.map((m) => {
      let narration = m.note;

      if (m.referenceId && saleMap[m.referenceId]) {
        const sale = saleMap[m.referenceId];
        const customerName = sale.customer?.name || "Walk-in Customer";

        if (m.type === "SALE") {
          narration = `Sale to ${customerName}`;
        } else if (m.type === "RETURN") {
          narration = `Return from ${customerName}`;
        } else if (m.type === "REDUCE") {
          narration = `Reduction — ${customerName}`;
        }
      }

      return { ...m, narration };
    });
  }

  // Export inventory movements as Excel (.xlsx)
  async exportMovementsExcel(inventoryItemId, itemName, res) {
    const movements = await this.getInventoryMovements(inventoryItemId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "B Bayo Continental";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Stock Movement");

    // Title row
    sheet.mergeCells("A1:D1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = `Stock Movement — ${itemName}`;
    titleCell.font = { bold: true, size: 13 };
    titleCell.alignment = { horizontal: "center" };

    // Generated date row
    sheet.mergeCells("A2:D2");
    const dateCell = sheet.getCell("A2");
    dateCell.value = `Generated: ${new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}`;
    dateCell.font = { italic: true, size: 10, color: { argb: "FF888888" } };
    dateCell.alignment = { horizontal: "center" };

    sheet.addRow([]); // blank spacer

    // Header row
    const headerRow = sheet.addRow(["Transaction Date", "Type", "Quantity", "Narration"]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1a1a2e" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Column widths
    sheet.columns = [
      { key: "date", width: 24 },
      { key: "type", width: 14 },
      { key: "quantity", width: 12 },
      { key: "narration", width: 42 },
    ];

    const inflowTypes = new Set(["ADD", "RETURN"]);

    // Data rows — oldest first for audit readability
    const ordered = [...movements].reverse();
    ordered.forEach((m) => {
      const isInflow = inflowTypes.has(m.type);
      const qty = `${isInflow ? "+" : "-"}${Number(m.quantity)}`;
      const date = new Date(m.transactionDate).toLocaleString("en-NG", { timeZone: "Africa/Lagos" });

      const row = sheet.addRow([date, m.type.replace(/_/g, " "), qty, m.narration || ""]);

      // Quantity colour: green for inflow, red for outflow
      const qtyCell = row.getCell(3);
      qtyCell.font = { color: { argb: isInflow ? "FF16a34a" : "FFdc2626" }, bold: true };
      qtyCell.alignment = { horizontal: "center" };

      row.getCell(1).alignment = { horizontal: "left" };
      row.getCell(2).alignment = { horizontal: "center" };
      row.getCell(4).alignment = { horizontal: "left" };

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFe5e7eb" } },
          left: { style: "thin", color: { argb: "FFe5e7eb" } },
          bottom: { style: "thin", color: { argb: "FFe5e7eb" } },
          right: { style: "thin", color: { argb: "FFe5e7eb" } },
        };
      });
    });

    // Freeze header
    sheet.views = [{ state: "frozen", ySplit: 4 }];

    const safeName = itemName.replace(/[^a-z0-9]/gi, "_");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="stock_movement_${safeName}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  }

  // Export inventory movements as PDF
  async exportMovementsPDF(inventoryItemId, itemName, res) {
    const movements = await this.getInventoryMovements(inventoryItemId);

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    const safeName = itemName.replace(/[^a-z0-9]/gi, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="stock_movement_${safeName}.pdf"`);
    doc.pipe(res);

    // ── Header ──
    doc.fontSize(16).font("Helvetica-Bold").text("B Bayo Continental", { align: "center" });
    doc.fontSize(12).font("Helvetica").text(`Stock Movement Report — ${itemName}`, { align: "center" });
    doc.fontSize(9).fillColor("#888888").text(
      `Generated: ${new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}`,
      { align: "center" }
    );
    doc.moveDown(0.8);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#cccccc").stroke();
    doc.moveDown(0.6);

    // ── Table header ──
    const colX = { date: 40, type: 190, qty: 290, narration: 345 };
    const rowH = 20;

    doc.fillColor("#1a1a2e").rect(40, doc.y, 515, rowH).fill();
    const headerY = doc.y + 5;
    doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
    doc.text("Transaction Date", colX.date, headerY, { width: 145 });
    doc.text("Type", colX.type, headerY, { width: 95 });
    doc.text("Qty", colX.qty, headerY, { width: 50 });
    doc.text("Narration", colX.narration, headerY, { width: 205 });
    doc.moveDown(0.2);
    doc.y += rowH - 14;

    // ── Data rows — oldest first ──
    const inflowTypes = new Set(["ADD", "RETURN"]);
    const ordered = [...movements].reverse();
    let rowIndex = 0;

    for (const m of ordered) {
      const isInflow = inflowTypes.has(m.type);
      const qty = `${isInflow ? "+" : "-"}${Number(m.quantity)}`;
      const date = new Date(m.transactionDate).toLocaleString("en-NG", { timeZone: "Africa/Lagos" });
      const type = m.type.replace(/_/g, " ");
      const narration = m.narration || "";

      // Alternating row background
      if (rowIndex % 2 === 0) {
        doc.fillColor("#f9fafb").rect(40, doc.y, 515, rowH).fill();
      }

      const rowY = doc.y + 5;
      doc.fillColor("#111111").fontSize(8).font("Helvetica");
      doc.text(date, colX.date, rowY, { width: 145 });
      doc.text(type, colX.type, rowY, { width: 95 });
      doc.fillColor(isInflow ? "#16a34a" : "#dc2626").font("Helvetica-Bold");
      doc.text(qty, colX.qty, rowY, { width: 50 });
      doc.fillColor("#111111").font("Helvetica");
      doc.text(narration, colX.narration, rowY, { width: 205, lineBreak: false });

      doc.y += rowH;
      rowIndex++;

      // Page break guard
      if (doc.y > 750) {
        doc.addPage();
        rowIndex = 0;
      }
    }

    // ── Footer line ──
    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#cccccc").stroke();
    doc.moveDown(0.4);
    doc.fillColor("#888888").fontSize(8).font("Helvetica")
      .text(`Total records: ${movements.length}`, { align: "right" });

    doc.end();
  }

  // Generate inventory report by date range
  async generateInventoryReport(branchId, startDate, endDate) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : undefined;

    // Fetch ONLY movements tied to real inventory items
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        branchId,
        inventoryItemId: {
          not: null, // ✅ exclude FIELD_SALE and any null relations
        },
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        inventoryItem: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const report = movements.reduce((acc, m) => {
      // Extra safety (in case of bad data)
      if (!m.inventoryItem) return acc;

      const itemId = m.inventoryItemId;

      if (!acc[itemId]) {
        acc[itemId] = {
          itemId,
          itemName: m.inventoryItem.name,
          totalAdded: 0,
          totalSold: 0,
          totalReduced: 0,
          totalReturned: 0,
          totalWrittenOff: 0,
          totalFieldSales: 0, // stays for format consistency
          closingStock: Number(m.inventoryItem.quantity),
        };
      }

      const qty = Number(m.quantity);

      switch (m.type) {
        case "ADD":
          acc[itemId].totalAdded += qty;
          break;
        case "SALE":
          acc[itemId].totalSold += qty;
          break;
        case "REDUCE":
          acc[itemId].totalReduced += qty;
          break;
        case "RETURN":
          acc[itemId].totalReturned += qty;
          break;
        case "WRITE_OFF":
          acc[itemId].totalWrittenOff += qty;
          break;
        case "FIELD_SALE":
          // technically shouldn't happen anymore, but keep safe
          acc[itemId].totalFieldSales += qty;
          break;
      }

      return acc;
    }, {});

    // Derive openingStock for each item:
    // opening = closing - added + sold - reduced - returned + writtenOff
    return Object.values(report).map((r) => ({
      ...r,
      openingStock:
        r.closingStock -
        r.totalAdded +
        r.totalSold -
        r.totalReduced -
        r.totalReturned +
        r.totalWrittenOff,
    }));
  }
}

export const inventoryService = new InventoryService();
