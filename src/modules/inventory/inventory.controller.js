// inventory.controller.js
import { inventoryService } from "./inventory.service.js";
import { extractUserId, extractUserName } from "../../utils/auth.util.js";

class InventoryController {
  // GET /inventory
  async getAllInventory(req, res) {
    try {
      const { branchId } = req.params;
      const items = await inventoryService.getAllInventory(branchId);

      return res.status(200).json({
        message: "Inventory retrieved successfully",
        data: items,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // GET /inventory/:id
  async getInventoryById(req, res) {
    try {
      const { inventoryId } = req.params;

      const item = await inventoryService.getInventoryById(inventoryId);
      if (!item) return res.status(404).json({ message: "Item not found" });

      return res.status(200).json({
        message: "Inventory item retrieved successfully",
        data: item,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // POST /inventory
  async createInventoryItem(req, res) {
    try {
      const { branchId } = req.params;
      const userId = extractUserId(req);
      const userName = extractUserName(req);

      const { name, costPrice, sellingPrice, quantity, lowStockThreshold } =
        req.body;

      // Validation
      if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ message: "Invalid item name" });
      }

      if (!sellingPrice || isNaN(sellingPrice)) {
        return res.status(400).json({ message: "Invalid selling price" });
      }

      if (quantity === undefined || isNaN(quantity)) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      if (lowStockThreshold === undefined || isNaN(lowStockThreshold)) {
        return res.status(400).json({ message: "Invalid low stock threshold" });
      }

      if (costPrice && isNaN(costPrice)) {
        return res.status(400).json({ message: "Invalid cost price" });
      }

      const item = await inventoryService.createInventoryItem(
        branchId,
        userId,
        userName,
        {
          name: name.trim(),
          costPrice,
          sellingPrice,
          quantity,
          lowStockThreshold,
        },
      );

      return res.status(201).json({
        message: "Inventory item created successfully",
        data: item,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // PATCH /inventory/:id
  async updateInventoryItem(req, res) {
    try {
      const { inventoryId } = req.params;
      const { branchId } = req.params;
      const userId = extractUserId(req);
      const userName = extractUserName(req);

      const { name, costPrice, sellingPrice, lowStockThreshold } = req.body;

      // Validation (only if provided)
      if (name && (typeof name !== "string" || name.trim() === "")) {
        return res.status(400).json({ message: "Invalid item name" });
      }

      if (costPrice && isNaN(costPrice)) {
        return res.status(400).json({ message: "Invalid cost price" });
      }

      if (sellingPrice && isNaN(sellingPrice)) {
        return res.status(400).json({ message: "Invalid selling price" });
      }

      if (lowStockThreshold && isNaN(lowStockThreshold)) {
        return res.status(400).json({ message: "Invalid low stock threshold" });
      }

      const updatedItem = await inventoryService.updateInventoryItem(
        inventoryId,
        branchId,
        userId,
        userName,
        {
          ...(name && { name: name.trim() }),
          ...(costPrice && { costPrice }),
          ...(sellingPrice && { sellingPrice }),
          ...(lowStockThreshold && { lowStockThreshold }),
        },
      );

      return res.status(200).json({
        message: "Inventory item updated successfully",
        data: updatedItem,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // DELETE /inventory/:id
  async deleteInventoryItem(req, res) {
    try {
      const { inventoryId } = req.params;
      const { branchId } = req.params;
      const userId = extractUserId(req);
      const userName = extractUserName(req);

      const result = await inventoryService.deleteInventoryItem(
        inventoryId,
        branchId,
        userId,
        userName,
      );

      if (!result || !result.deleted) {
        return res.status(400).json({ message: result.message });
      }

      return res.status(200).json({
        message: "Inventory item deleted successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // POST /inventory/:id/add-stock
  async addStock(req, res) {
    try {
      const { inventoryId } = req.params;
      const { branchId } = req.params;
      const userId = extractUserId(req);
      const userName = extractUserName(req);

      const { quantity, driverName, transactionDate } = req.body;

      if (quantity === undefined || isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const item = await inventoryService.addStock(
        inventoryId,
        branchId,
        userId,
        userName,
        quantity,
        driverName || "",
        transactionDate || null,
      );

      return res.status(200).json({
        message: "Stock added successfully",
        data: item,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // POST /inventory/:id/write-off
  async writeOffItem(req, res) {
    try {
      const { inventoryId } = req.params;
      const { branchId } = req.params;
      const userId = extractUserId(req);
      const userName = extractUserName(req);

      const { quantity, reason } = req.body;

      if (quantity === undefined || isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      if (!reason || typeof reason !== "string" || reason.trim() === "") {
        return res.status(400).json({ message: "Invalid reason" });
      }

      const item = await inventoryService.writeOffItem(
        inventoryId,
        branchId,
        userId,
        userName,
        quantity,
        reason.trim(),
      );

      return res.status(200).json({
        message: "Item written off successfully",
        data: item,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // GET /inventory/:inventoryId/movements
  async getInventoryMovements(req, res) {
    try {
      const { inventoryId } = req.params;

      const movements = await inventoryService.getInventoryMovements(inventoryId);

      return res.status(200).json({
        message: "Inventory movements retrieved successfully",
        data: movements,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // GET /inventory/:inventoryId/movements/export/excel
  async exportMovementsExcel(req, res) {
    try {
      const { inventoryId } = req.params;
      const item = await inventoryService.getInventoryById(inventoryId);
      if (!item) return res.status(404).json({ message: "Item not found" });

      await inventoryService.exportMovementsExcel(inventoryId, item.name, res);
    } catch (error) {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  // GET /inventory/:inventoryId/movements/export/pdf
  async exportMovementsPDF(req, res) {
    try {
      const { inventoryId } = req.params;
      const item = await inventoryService.getInventoryById(inventoryId);
      if (!item) return res.status(404).json({ message: "Item not found" });

      await inventoryService.exportMovementsPDF(inventoryId, item.name, res);
    } catch (error) {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  // GET /inventory/low-stock
  async getLowStockItems(req, res) {
    try {
      const { branchId } = req.params;
      const items = await inventoryService.getLowStockItems(branchId);

      return res.status(200).json({
        message: "Low stock items retrieved successfully",
        data: items,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // GET /inventory/report
  async generateInventoryReport(req, res) {
    try {
      const { branchId } = req.params;
      const { start_date, end_date } = req.query;

      const report = await inventoryService.generateInventoryReport(
        branchId,
        start_date,
        end_date,
      );

      return res.status(200).json({
        message: "Inventory report generated successfully",
        data: report,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export const inventoryController = new InventoryController();
