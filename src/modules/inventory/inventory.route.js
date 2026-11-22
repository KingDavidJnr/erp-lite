import express from "express";
import authMiddlewares from "../../middlewares/auth.middleware.js";
import { inventoryController } from "./inventory.controller.js";

const router = express.Router();

// Create inventory item
router.post(
  "/:branchId/inventory",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.SalesAccess,
  inventoryController.createInventoryItem,
);

// Get all inventory items for a branch
router.get(
  "/:branchId/inventory",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.SalesAccess,
  inventoryController.getAllInventory,
);

// Get inventory item by ID
router.get(
  "/:branchId/inventory/:inventoryId",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.SalesAccess,
  inventoryController.getInventoryById,
);

// Update inventory item
router.patch(
  "/:branchId/inventory/:inventoryId",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.IsBranchAdmin,
  inventoryController.updateInventoryItem,
);

// Delete inventory item
router.delete(
  "/:branchId/inventory/:inventoryId",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.IsBranchAdmin,
  inventoryController.deleteInventoryItem,
);

// Add stock to inventory item
router.post(
  "/:branchId/inventory/:inventoryId/add-stock",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.IsBranchAdmin,
  inventoryController.addStock,
);

// Write-off inventory item
router.post(
  "/:branchId/inventory/:inventoryId/write-off",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.IsBranchAdmin,
  inventoryController.writeOffItem,
);

// Get inventory movements for a specific item
router.get(
  "/:branchId/inventory/:inventoryId/movements",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.SalesAccess,
  inventoryController.getInventoryMovements,
);

// Export stock movements as Excel
router.get(
  "/:branchId/inventory/:inventoryId/movements/export/excel",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.SalesAccess,
  inventoryController.exportMovementsExcel,
);

// Export stock movements as PDF
router.get(
  "/:branchId/inventory/:inventoryId/movements/export/pdf",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.SalesAccess,
  inventoryController.exportMovementsPDF,
);

// Get low stock items
router.get(
  "/:branchId/inventory/low/stock",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.SalesAccess,
  inventoryController.getLowStockItems,
);

// Generate inventory report
router.get(
  "/:branchId/inventory/reports/stock",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.SalesAccess,
  inventoryController.generateInventoryReport,
);

//

export const inventoryRoute = router;
