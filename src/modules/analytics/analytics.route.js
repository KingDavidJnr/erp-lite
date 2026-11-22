import express from "express";
import authmiddleware from "../../middlewares/auth.middleware.js";
import { analyticsController } from "./analytics.controller.js";

const router = express.Router();

// Profit & Loss Statement for timeframe
router.get(
  "/profit-loss/:branchId",
  authmiddleware.IsAuthenticated,
  authmiddleware.FinancialAccess,
  analyticsController.getProfitAndLoss,
);

// Cash flow summary for timeframe
router.get(
  "/cash-flow-summary/:branchId",
  authmiddleware.IsAuthenticated,
  authmiddleware.FinancialAccess,
  analyticsController.getCashFlowSummary,
);

// Category-wise spend analysis for timeframe
router.get(
  "/category-spend-analysis/:branchId",
  authmiddleware.IsAuthenticated,
  authmiddleware.FinancialAccess,
  analyticsController.getCategorySpend,
);

// Inventory valuation for current state
router.get(
  "/inventory-valuation/:branchId",
  authmiddleware.IsAuthenticated,
  authmiddleware.FinancialAccess,
  analyticsController.getInventoryValuation,
);

// Top selling items for timeframe
router.get(
  "/top-selling-items/:branchId",
  authmiddleware.IsAuthenticated,
  authmiddleware.FinancialAccess,
  analyticsController.getTopSellingItems,
);

// Dead stock report for current state
router.get(
  "/dead-stock-report/:branchId",
  authmiddleware.IsAuthenticated,
  authmiddleware.FinancialAccess,
  analyticsController.getDeadStockReport,
);

// Debts velocity report for timeframe
router.get(
  "/debts-velocity/:branchId",
  authmiddleware.IsAuthenticated,
  authmiddleware.FinancialAccess,
  analyticsController.getDebtVelocity,
);

// Staff performance report for timeframe
router.get(
  "/staff-performance/:branchId",
  authmiddleware.IsAuthenticated,
  authmiddleware.FinancialAccess,
  analyticsController.getStaffPerformance,
);

// Customer LTV
router.get(
  "/customer-ltv/:branchId",
  authmiddleware.IsAuthenticated,
  authmiddleware.FinancialAccess,
  analyticsController.getCustomerLTV,
);

// Loss Analysis for timeframe
router.get(
  "/loss-analysis/:branchId",
  authmiddleware.IsAuthenticated,
  authmiddleware.FinancialAccess,
  analyticsController.getLossAnalysis,
);

export const analyticsRoute = router;
