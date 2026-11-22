import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { expensesController } from "./expense.controller.js";

const router = express.Router();

// create a new expense
router.post(
  "/:branchId",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  expensesController.createExpense,
);

// get all expenses for a branch
router.get(
  "/:branchId",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  expensesController.getAllExpenses,
);

// get expense details
router.get(
  "/:branchId/:id",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  expensesController.getExpenseById,
);

// update an expense
router.patch(
  "/:branchId/:id",
  authMiddleware.IsAuthenticated,
  authMiddleware.IsBranchAdmin,
  expensesController.updateExpense,
);

// delete an expense
router.delete(
  "/:branchId/:id",
  authMiddleware.IsAuthenticated,
  authMiddleware.IsBranchAdmin,
  expensesController.deleteExpense,
);

// Get expense reports
router.get(
  "/reports/all/:branchId",
  authMiddleware.IsAuthenticated,
  authMiddleware.SalesAccess,
  expensesController.generateExpenseReport,
);

export const expenseRoute = router;
