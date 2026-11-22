import { paymentsService } from "./payment.service.js";
import { extractUserId, extractUserName } from "../../utils/auth.util.js";

class PaymentsController {
  // --- PAYMENTS ENDPOINTS ---

  // GET /payments
  async listPayments(req, res) {
    const { branchId } = req.params; // From auth middleware
    const { start_date, end_date } = req.query;

    const payments = await paymentsService.getAllPayments(branchId, {
      startDate: start_date,
      endDate: end_date,
    });

    return res.status(200).json({
      message: "Payments retrieved successfully",
      data: payments,
    });
  }

  // POST /payments
  async recordPayment(req, res) {
    const { branchId } = req.params; // user object from auth middleware
    const { customerId, saleId, amount, paymentDate, note } = req.body;
    const userId = extractUserId(req);
    const userName = extractUserName(req);

    // Basic validation
    if (!customerId || !amount || !paymentDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const payment = await paymentsService.recordPayment(
      branchId,
      userId,
      userName,
      { customerId, saleId, amount, paymentDate, note },
    );

    return res.status(201).json({
      message: "Payment recorded successfully",
      data: payment,
    });
  }

  // GET /payments/:id
  async getPaymentDetails(req, res) {
    const { id, branchId } = req.params;

    const payment = await paymentsService.getPaymentById(id, branchId);

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    return res.status(200).json({ data: payment });
  }

  // PATCH /payments/:id
  async updatePayment(req, res) {
    const { id, branchId } = req.params;
    const { note } = req.body;

    const userId = extractUserId(req);
    const userName = extractUserName(req);

    const payment = await paymentsService.updatePayment(
      id,
      branchId,
      userId,
      userName,
      { note },
    );

    return res.status(200).json({
      message: "Payment updated successfully",
      data: payment,
    });
  }

  // DELETE /payments/:id
  async deletePayment(req, res) {
    const { id, branchId } = req.params;
    const userId = extractUserId(req);
    const userName = extractUserName(req);

    await paymentsService.deletePayment(id, branchId, userId, userName);

    return res.status(200).json({ message: "Payment record deleted" });
  }

  // --- ACCOUNTS ENDPOINTS ---

  // GET /accounts/debtor-book
  async getDebtorBook(req, res) {
    const { branchId } = req;
    const debtors = await paymentsService.getDebtorBook(branchId);

    return res.status(200).json({
      message: "Debtor book retrieved",
      data: debtors,
    });
  }

  // GET /accounts/customer-balance/:customer_id
  async getCustomerBalance(req, res) {
    const { branchId } = req;
    const { customer_id } = req.params;

    const ledger = await paymentsService.getCustomerLedger(
      branchId,
      customer_id,
    );

    return res.status(200).json({
      message: "Customer balance statement retrieved",
      data: ledger,
    });
  }

  // GET /accounts/report
  async getFinancialReport(req, res) {
    const { branchId } = req;
    const { start_date, end_date } = req.query;

    const report = await paymentsService.getFinancialReport(branchId, {
      startDate: start_date,
      endDate: end_date,
    });

    return res.status(200).json({
      message: "Financial report generated",
      data: report,
    });
  }
}

export const paymentsController = new PaymentsController();
