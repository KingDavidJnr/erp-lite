import { expensesService } from "./expense.service.js";
import { extractUserId, extractUserName } from "../../utils/auth.util.js";

class ExpensesController {
  // GET /expenses
  async getAllExpenses(req, res) {
    try {
      const { branchId } = req.params;
      const { start_date, end_date } = req.query;

      const expenses = await expensesService.getAllExpenses(
        branchId,
        start_date,
        end_date,
      );

      return res.status(200).json({
        message: "Expenses retrieved successfully",
        data: expenses,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // GET /expenses/:id
  async getExpenseById(req, res) {
    try {
      const { id, branchId } = req.params;
      const expense = await expensesService.getExpenseById(id);

      if (!expense || expense.branchId !== branchId) {
        return res.status(404).json({ message: "Expense record not found" });
      }

      return res.status(200).json({
        message: "Expense details retrieved successfully",
        data: expense,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // POST /expenses
  async createExpense(req, res) {
    try {
      const { branchId } = req.params;
      const userId = extractUserId(req);
      const userName = extractUserName(req);
      const { category, amount, note, expenseDate } = req.body;

      // Basic Validation
      if (!category || !amount || !expenseDate) {
        return res.status(400).json({
          message: "Category, amount, and expense date are required",
        });
      }

      if (isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({ message: "Invalid expense amount" });
      }

      const expense = await expensesService.createExpense(
        branchId,
        userId,
        userName,
        {
          category: category.trim(),
          amount,
          note: note?.trim(),
          expenseDate,
        },
      );

      return res.status(201).json({
        message: "Expense recorded successfully",
        data: expense,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // PATCH /expenses/:id
  async updateExpense(req, res) {
    try {
      const { id, branchId } = req.params;
      const userId = extractUserId(req);
      const userName = extractUserName(req);
      const { category, amount, note, expenseDate } = req.body;

      const updatedExpense = await expensesService.updateExpense(
        id,
        branchId,
        userId,
        userName,
        {
          category: category?.trim(),
          amount,
          note: note?.trim(),
          expenseDate,
        },
      );

      return res.status(200).json({
        message: "Expense updated successfully",
        data: updatedExpense,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // DELETE /expenses/:id
  async deleteExpense(req, res) {
    try {
      const { id, branchId } = req.params;
      const userId = extractUserId(req);
      const userName = extractUserName(req);

      await expensesService.deleteExpense(id, branchId, userId, userName);

      return res.status(200).json({
        message: "Expense deleted successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // GET /expenses/report
  async generateExpenseReport(req, res) {
    try {
      const { branchId } = req.params;
      const { start_date, end_date } = req.query;

      const expenses = await expensesService.generateExpenseReport(
        branchId,
        start_date,
        end_date,
      );

      return res.status(200).json({
        message: "Expense report retrieved successfully",
        data: expenses,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export const expensesController = new ExpensesController();
