import { salesService } from "./sales.service.js";
import { extractUserId, extractUserName } from "../../utils/auth.util.js";

class SalesController {
  // GET /sales
  async getAllSales(req, res) {
    try {
      const { branchId } = req.params;
      const { start_date, end_date } = req.query;

      const sales = await salesService.getAllSales(
        branchId,
        start_date,
        end_date,
      );

      return res.status(200).json({
        message: "Sales retrieved successfully",
        data: sales,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // GET /sales/:id
  async getSaleById(req, res) {
    try {
      const { id } = req.params;
      const sale = await salesService.getSaleById(id);

      if (!sale) return res.status(404).json({ message: "Sale not found" });

      return res.status(200).json({
        message: "Sale details retrieved successfully",
        data: sale,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // POST /sales
  async createSale(req, res) {
    try {
      const { branchId } = req.params;
      const userId = extractUserId(req);
      const userName = extractUserName(req);
      const { customerId, saleDate, items, note } = req.body;

      // Basic Validation
      if (!saleDate || !items || !Array.isArray(items) || items.length === 0) {
        return res
          .status(400)
          .json({ message: "Invalid sale data or missing items" });
      }

      // Item Validation
      for (const item of items) {
        if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
          return res
            .status(400)
            .json({ message: `Invalid quantity for item: ${item.name}` });
        }
        if (!item.totalPrice || isNaN(item.totalPrice)) {
          return res
            .status(400)
            .json({ message: `Invalid total price for item: ${item.name}` });
        }
      }

      const sale = await salesService.createSale(branchId, userId, userName, {
        customerId,
        saleDate: saleDate,
        items,
        note: note?.trim(),
      });

      // Handle service-level business rule failure
      if (sale && sale.message) {
        return res.status(409).json({ message: sale.message });
      }

      return res.status(201).json({
        message: "Sale recorded successfully",
        data: sale,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // PATCH /sales/:id/reduce (Same-day)
  async reduceSaleItem(req, res) {
    try {
      const { id } = req.params; // saleId
      const { saleItemId } = req.body;
      const { branchId } = req.params;
      const userId = extractUserId(req);
      const userName = extractUserName(req);

      const sale = await salesService.getSaleById(id);
      if (!sale)
        return res.status(404).json({ message: "Sale record not found" });

      // Verify same-day restriction for "REDUCE" action
      const saleDate = new Date(sale.saleDate).toDateString();
      const today = new Date().toDateString();

      if (saleDate !== today) {
        return res.status(400).json({
          message:
            "Cannot perform 'REDUCE' on sales from previous days. Use 'RETURN' instead.",
        });
      }

      const updatedItem = await salesService.reduceSaleItem(
        saleItemId,
        branchId,
        userId,
        userName,
      );

      return res.status(200).json({
        message: "Item reduced (crossed out) from sale successfully",
        data: updatedItem,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // POST /sales/:id/return (Later-date)
  async recordReturn(req, res) {
    try {
      const { id } = req.params; // saleId
      const { saleItemId, quantity, returnDate, note } = req.body;
      const { branchId } = req.params;
      const userId = extractUserId(req);
      const userName = extractUserName(req);

      if (!quantity || isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: "Invalid return quantity" });
      }

      const sale = await salesService.getSaleById(id);
      if (!sale)
        return res.status(404).json({ message: "Sale record not found" });

      const returnTx = await salesService.recordReturn(
        saleItemId,
        branchId,
        userId,
        userName,
        {
          quantity,
          returnDate: returnDate || new Date(),
          note: note?.trim(),
        },
      );

      return res.status(201).json({
        message: "Return recorded and stock updated successfully",
        data: returnTx,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // DELETE /sales/:id
  async deleteSale(req, res) {
    try {
      const { id } = req.params;
      const { branchId } = req.params;
      const userId = extractUserId(req);
      const userName = extractUserName(req);

      const sale = await salesService.getSaleById(id);
      if (!sale)
        return res.status(404).json({ message: "Sale record not found" });

      await salesService.deleteSale(id, branchId, userId, userName);

      return res.status(200).json({
        message: "Sale deleted and stock restored successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // GET /sales/report
  async generateSalesReport(req, res) {
    try {
      const { branchId } = req.params;
      const { start_date, end_date } = req.query;

      const sales = await salesService.generateSalesReport(
        branchId,
        start_date,
        end_date,
      );

      return res.status(200).json({
        message: "Sales report retrieved successfully",
        data: sales,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // GET /sales/invoice/:id
  async getInvoiceData(req, res) {
    try {
      const { id } = req.params;
      const sale = await salesService.getSaleById(id);

      if (!sale)
        return res.status(404).json({ message: "Sale record not found" });

      return res.status(200).json({
        message: "Invoice data retrieved successfully",
        data: sale,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export const salesController = new SalesController();
