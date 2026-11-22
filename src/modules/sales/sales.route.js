import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { salesController } from "./sales.controller.js";

const router = express.Router();

// Create a sale record
router.post(
  "/:branchId",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  salesController.createSale,
);

// Get all sales for a branch
router.get(
  "/:branchId",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  salesController.getAllSales,
);

// Get sale details by ID
router.get(
  "/single/:id",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  salesController.getSaleById,
);

// Reduce sales item
router.patch(
  "/reduce/:branchId/:id",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  salesController.reduceSaleItem,
);

// Return sales items
router.patch(
  "/return/:branchId/:id",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  salesController.recordReturn,
);

// Delete sales record
router.delete(
  "/:branchId/:id",
  authMiddleware.IsAuthenticated,
  authMiddleware.IsBranchAdmin,
  salesController.deleteSale,
);

// Get sales reports
router.get(
  "/reports/:branchId",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  salesController.generateSalesReport,
);

// Get invoice data for sales record
router.get(
  "/invoice/:id",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  salesController.getInvoiceData,
);

export const salesRoute = router;
