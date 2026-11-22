import prisma from "../../lib/prisma.js";

class PaymentsService {
  // --- PAYMENT CRUD ---

  async getAllPayments(branchId, { startDate, endDate }) {
    const where = { branchId };
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    return prisma.payment.findMany({
      where,
      include: {
        customer: { select: { name: true, phone: true } },
        user: { select: { username: true } },
      },
      orderBy: { paymentDate: "desc" },
    });
  }

  // GET /payments/:id - Get payment details
  async getPaymentById(id, branchId) {
    return prisma.payment.findFirst({
      where: { id, branchId },
      include: {
        customer: true,
        user: { select: { username: true } },
      },
    });
  }

  async recordPayment(branchId, userId, userName, data) {
    const { customerId, saleId, amount, paymentDate, note } = data;

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          branchId,
          customerId,
          saleId: saleId || null,
          amount: Number(amount),
          paymentDate: new Date(paymentDate),
          note,
          createdBy: BigInt(userId),
        },
      });

      await tx.auditLog.create({
        data: {
          branchId,
          userId: BigInt(userId),
          module: "Payments",
          action: `${userName} recorded payment: ${amount} (ID: ${payment.id})`,
          referenceType: "Payment",
          referenceId: payment.id,
        },
      });

      return payment;
    });
  }

  // PATCH /payments/:id - Update & Audit (Fixed Transaction)
  async updatePayment(id, branchId, userId, userName, data) {
    const { note } = data;
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id, branchId },
        data: { note },
      });

      await tx.auditLog.create({
        data: {
          branchId,
          userId: BigInt(userId),
          module: "Payments",
          action: `${userName} updated note on payment: ${id}`,
          referenceType: "Payment",
          referenceId: id,
        },
      });
      return payment;
    });
  }

  // DELETE /payments/:id - Delete & Audit
  async deletePayment(id, branchId, userId, userName) {
    return prisma.$transaction(async (tx) => {
      const deletedPayment = await tx.payment.delete({
        where: { id, branchId },
      });

      await tx.auditLog.create({
        data: {
          branchId,
          userId: BigInt(userId),
          module: "Payments",
          action: `${userName} deleted payment record: ${id} for amount ${deletedPayment.amount}`,
          referenceType: "Payment",
          referenceId: id,
        },
      });
      return deletedPayment;
    });
  }

  // --- ACCOUNTS & LEDGER LOGIC ---

  /**
   * GET /accounts/debtor-book
   * Lists customers who owe money (Total Sales > Total Payments)
   */
  async getDebtorBook(branchId) {
    // This aggregates sales and payments per customer to find the delta
    const customers = await prisma.customer.findMany({
      where: { branchId }, // Assuming customers belong to branches
      include: {
        sales: { select: { totalAmount: true } },
        payments: { select: { amount: true } },
      },
    });

    return customers
      .map((c) => {
        const totalInvoiced = c.sales.reduce(
          (sum, s) => sum + Number(s.totalAmount),
          0,
        );
        const totalPaid = c.payments.reduce(
          (sum, p) => sum + Number(p.amount),
          0,
        );
        const balance = totalInvoiced - totalPaid;

        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          totalInvoiced,
          totalPaid,
          balance, // Positive means they owe us money
        };
      })
      .filter((c) => c.balance > 0); // Only show people with debt
  }

  /**
   * GET /accounts/customer-balance/:customer_id
   * Returns a chronological list of all sales and payments for a statement
   */
  async getCustomerLedger(branchId, customerId) {
    const [sales, payments] = await Promise.all([
      prisma.sale.findMany({
        where: { branchId, customerId },
        orderBy: { saleDate: "asc" },
      }),
      prisma.payment.findMany({
        where: { branchId, customerId },
        orderBy: { paymentDate: "asc" },
      }),
    ]);

    // Combine and sort for a "Statement of Account" view
    const ledger = [
      ...sales.map((s) => ({
        date: s.saleDate,
        type: "SALE",
        amount: s.totalAmount,
        id: s.id,
      })),
      ...payments.map((p) => ({
        date: p.paymentDate,
        type: "PAYMENT",
        amount: p.amount,
        id: p.id,
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    return ledger;
  }

  /**
   * GET /accounts/report
   * Financial summary for the branch
   */
  async getFinancialReport(branchId, { startDate, endDate }) {
    const dateQuery = {};
    if (startDate) dateQuery.gte = new Date(startDate);
    if (endDate) dateQuery.lte = new Date(endDate);

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

    const totalRevenue = Number(salesSum._sum.totalAmount || 0);
    const totalCollected = Number(paymentsSum._sum.amount || 0);

    return {
      totalRevenue,
      totalCollected,
      outstandingDebt: totalRevenue - totalCollected,
    };
  }
}

export const paymentsService = new PaymentsService();
