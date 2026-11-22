import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { paymentsController } from "./payment.controller.js";

const router = express.Router();

// Crete a new payment record
router.post(
  "/:branchId",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  paymentsController.recordPayment,
);

// Get all payments for branch in custom timeframe
router.get(
  "/:branchId",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  paymentsController.listPayments,
);

// Get payment details
router.get(
  "/:branchId/:id",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  paymentsController.getPaymentDetails,
);

// Update payment note
router.patch(
  "/:branchId/:id",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  paymentsController.updatePayment,
);

// Delete payment record
router.delete(
  "/:branchId/:id",
  authMiddleware.IsAuthenticated,
  authMiddleware.IsBranchAdmin,
  paymentsController.deletePayment,
);

// Get debts per customer
router.get(
  "/debts/all/:branchId",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  paymentsController.getDebtorBook,
);

// Get customer balance
router.get(
  "/customer-balance/:branchId/:customerId",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  paymentsController.getCustomerBalance,
);

// Get financial report for branch
router.get(
  "/financial/report/:branchId",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  paymentsController.getFinancialReport,
);

export const paymentRoute = router;
