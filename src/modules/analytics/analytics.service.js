import prisma from "../../lib/prisma.js";

class AnalyticsService {
  // Helper to handle date ranges consistently with your 23:59:59 logic
  #getDateRange(startDate, endDate) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999))
      : undefined;
    return { gte: start, lte: end };
  }

  // 1. Profit & Loss Statement
  async getProfitAndLoss(branchId, startDate, endDate) {
    const dateQuery = this.#getDateRange(startDate, endDate);

    const [salesData, expenseData] = await Promise.all([
      // Revenue and COGS (Cost of Goods Sold)
      prisma.sale.findMany({
        where: { branchId, saleDate: dateQuery },
        include: { saleItems: { include: { inventoryItem: true } } },
      }),
      // Operating Expenses
      prisma.expense.aggregate({
        where: { branchId, expenseDate: dateQuery },
        _sum: { amount: true },
      }),
    ]);

    let totalRevenue = 0;
    let totalCOGS = 0;

    salesData.forEach((sale) => {
      totalRevenue += Number(sale.totalAmount);
      sale.saleItems.forEach((item) => {
        // COGS = quantity sold * cost price of item
        const costPrice = Number(item.inventoryItem?.costPrice || 0);
        totalCOGS += Number(item.quantity) * costPrice;
      });
    });

    const totalExpenses = Number(expenseData._sum.amount || 0);
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      totalExpenses,
      netProfit,
    };
  }

  // 2. Cash Flow Summary (Accrual vs Cash)
  async getCashFlowSummary(branchId, startDate, endDate) {
    const dateQuery = this.#getDateRange(startDate, endDate);

    const [salesSum, paymentsSum] = await Promise.all([
      prisma.sale.aggregate({
        where: { branchId, saleDate: dateQuery },
        _sum: { totalAmount: true },
      }),
      prisma.payment.aggregate({
        where: { branchId, paymentDate: dateQuery },
        _sum: { amount: true },
      }),
    ]);

    const totalInvoiced = Number(salesSum._sum.totalAmount || 0);
    const totalCollected = Number(paymentsSum._sum.amount || 0);

    return {
      totalInvoiced, // Accrual Revenue
      totalCollected, // Actual Cash In
      outstandingReceivables: totalInvoiced - totalCollected,
      collectionRate:
        totalInvoiced > 0
          ? ((totalCollected / totalInvoiced) * 100).toFixed(2)
          : 0,
    };
  }

  // 3. Category Spend Analysis
  async getCategorySpend(branchId, startDate, endDate) {
    const dateQuery = this.#getDateRange(startDate, endDate);

    return prisma.expense.groupBy({
      by: ["category"],
      where: { branchId, expenseDate: dateQuery },
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: "desc" } },
    });
  }

  // 4. Inventory Valuation (Current State)
  async getInventoryValuation(branchId) {
    const items = await prisma.inventoryItem.findMany({
      where: { branchId },
      select: { quantity: true, costPrice: true, sellingPrice: true },
    });

    return items.reduce(
      (acc, item) => {
        const qty = Number(item.quantity);
        acc.totalCostValue += qty * Number(item.costPrice || 0);
        acc.totalRetailValue += qty * Number(item.sellingPrice);
        return acc;
      },
      { totalCostValue: 0, totalRetailValue: 0 },
    );
  }

  // 5. Top Selling Items
  async getTopSellingItems(branchId, startDate, endDate) {
    const dateQuery = this.#getDateRange(startDate, endDate);

    const items = await prisma.saleItem.groupBy({
      by: ["inventoryItemId", "name"],
      where: {
        branchId,
        sale: { saleDate: dateQuery },
        isRemoved: false,
      },
      _sum: { quantity: true, subtotal: true },
      _count: { _all: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    return items.map((item) => ({
      name: item.name,
      quantitySold: Number(item._sum.quantity),
      totalRevenue: Number(item._sum.subtotal),
      transactionCount: item._count._all,
    }));
  }

  // 6. Dead Stock Report (Items not sold in X days)
  async getDeadStockReport(branchId, daysThreshold = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    // Find items where the last movement of type 'SALE' is older than threshold
    return prisma.inventoryItem.findMany({
      where: {
        branchId,
        quantity: { gt: 0 },
        inventoryMoves: {
          none: {
            type: "SALE",
            createdAt: { gte: thresholdDate },
          },
        },
      },
      select: { id: true, name: true, quantity: true, updatedAt: true },
    });
  }

  // 7. Debt Velocity (Avg Days to Pay)
  async getDebtVelocity(branchId, startDate, endDate) {
    const dateQuery = this.#getDateRange(startDate, endDate);

    // Get linked payments only
    const payments = await prisma.payment.findMany({
      where: {
        branchId,
        paymentDate: dateQuery,
        saleId: { not: null },
      },
      include: { sale: { select: { saleDate: true } } },
    });

    if (payments.length === 0) return { averageDaysToPay: 0, sampleSize: 0 };

    const totalDays = payments.reduce((acc, p) => {
      const diffTime = Math.abs(
        new Date(p.paymentDate) - new Date(p.sale.saleDate),
      );
      return acc + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, 0);

    return {
      averageDaysToPay: (totalDays / payments.length).toFixed(1),
      sampleSize: payments.length,
    };
  }

  // 8. Staff Performance
  async getStaffPerformance(branchId, startDate, endDate) {
    const dateQuery = this.#getDateRange(startDate, endDate);

    const performance = await prisma.sale.groupBy({
      by: ["createdBy"],
      where: { branchId, saleDate: dateQuery },
      _sum: { totalAmount: true },
      _count: { _all: true },
    });

    // Manually join with User names since groupBy doesn't support deep includes easily
    return Promise.all(
      performance.map(async (stat) => {
        const user = await prisma.user.findUnique({
          where: { id: stat.createdBy },
          select: { firstName: true, lastName: true },
        });
        return {
          staffName: `${user?.firstName} ${user?.lastName}`,
          totalSalesValue: Number(stat._sum.totalAmount),
          totalSalesCount: stat._count._all,
        };
      }),
    );
  }

  // 9. Customer Lifetime Value (LTV)
  async getCustomerLTV(branchId) {
    const ltv = await prisma.sale.groupBy({
      by: ["customerId"],
      where: { branchId, customerId: { not: null } },
      _sum: { totalAmount: true },
      _count: { _all: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 20,
    });

    return Promise.all(
      ltv.map(async (stat) => {
        const customer = await prisma.customer.findUnique({
          where: { id: stat.customerId },
          select: { name: true },
        });
        return {
          customerName: customer?.name,
          lifetimeValue: Number(stat._sum.totalAmount),
          totalOrders: stat._count._all,
        };
      }),
    );
  }

  // 10. Loss Analysis (Returns + Write-offs)
  async getLossAnalysis(branchId, startDate, endDate) {
    const dateQuery = this.#getDateRange(startDate, endDate);

    const [returns, writeOffs] = await Promise.all([
      prisma.returnTransaction.aggregate({
        where: { branchId, returnDate: dateQuery },
        _sum: { quantity: true },
        _count: { _all: true },
      }),
      prisma.writeOff.aggregate({
        where: { branchId, createdAt: dateQuery },
        _sum: { quantity: true },
        _count: { _all: true },
      }),
    ]);

    return {
      returns: {
        count: returns._count._all,
        totalQuantity: Number(returns._sum.quantity || 0),
      },
      writeOffs: {
        count: writeOffs._count._all,
        totalQuantity: Number(writeOffs._sum.quantity || 0),
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
