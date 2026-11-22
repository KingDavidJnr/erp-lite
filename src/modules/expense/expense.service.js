import prisma from "../../lib/prisma.js";

class ExpensesService {
  // List expenses for a branch with optional date filtering
  async getAllExpenses(branchId, startDate, endDate) {
    const where = { branchId };

    // Apply date filters if provided
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) {
        where.expenseDate.gte = new Date(startDate);
      }
      if (endDate) {
        // Ensure the end date covers the full day up to 23:59:59
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    return prisma.expense.findMany({
      where,
      include: {
        user: { select: { username: true } },
      },
      orderBy: { expenseDate: "desc" },
    });
  }

  // Get expense details
  async getExpenseById(id) {
    return prisma.expense.findUnique({
      where: { id },
      include: {
        user: { select: { username: true } },
      },
    });
  }

  // Create a new expense
  async createExpense(branchId, userId, userName, data) {
    const { category, amount, note, expenseDate } = data;

    return prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          branchId,
          category,
          amount: Number(amount),
          note,
          expenseDate: new Date(expenseDate),
          createdBy: BigInt(userId),
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          branchId,
          userId: BigInt(userId),
          module: "Expenses",
          action: `${userName} recorded a new expense: ${category}. Amount: ${amount}`,
          referenceType: "Expense",
          referenceId: expense.id,
        },
      });

      return expense;
    });
  }

  // Update expense
  async updateExpense(id, branchId, userId, userName, data) {
    const { category, amount, note, expenseDate } = data;

    return prisma.$transaction(async (tx) => {
      const updatedExpense = await tx.expense.update({
        where: { id, branchId },
        data: {
          category,
          amount: amount ? Number(amount) : undefined,
          note,
          expenseDate: expenseDate ? new Date(expenseDate) : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          branchId,
          userId: BigInt(userId),
          module: "Expenses",
          action: `${userName} updated expense: ${id}`,
          referenceType: "Expense",
          referenceId: id,
        },
      });

      return updatedExpense;
    });
  }

  // Delete expense
  async deleteExpense(id, branchId, userId, userName) {
    return prisma.$transaction(async (tx) => {
      const deletedExpense = await tx.expense.delete({
        where: { id, branchId },
      });

      await tx.auditLog.create({
        data: {
          branchId,
          userId: BigInt(userId),
          module: "Expenses",
          action: `${userName} deleted expense: ${id} (${deletedExpense.category})`,
          referenceType: "Expense",
          referenceId: id,
        },
      });

      return deletedExpense;
    });
  }

  // Generate expense report
  async generateExpenseReport(branchId, startDate, endDate) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : undefined;

    const where = {
      branchId,
      expenseDate: { gte: start, lte: end },
    };

    // Run aggregations in parallel
    const [totals, categories] = await Promise.all([
      // 1. High-level Metrics
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: { _all: true },
        _avg: { amount: true },
        _max: { amount: true },
      }),

      // 2. Categorical Breakdown (Operational Insights)
      prisma.expense.groupBy({
        by: ["category"],
        where,
        _sum: { amount: true },
        _count: { _all: true },
        orderBy: {
          _sum: { amount: "desc" },
        },
      }),
    ]);

    const totalSpent = Number(totals._sum.amount || 0);

    return {
      summary: {
        totalSpent,
        transactionCount: totals._count._all,
        averageExpense: Number(totals._avg.amount || 0),
        highestSingleExpense: Number(totals._max.amount || 0),
      },
      categoricalBreakdown: categories.map((cat) => ({
        category: cat.category,
        total: Number(cat._sum.amount || 0),
        count: cat._count._all,
        percentage:
          totalSpent > 0
            ? ((Number(cat._sum.amount || 0) / totalSpent) * 100).toFixed(2)
            : "0.00",
      })),
    };
  }
}

export const expensesService = new ExpensesService();
