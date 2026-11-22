import { analyticsService } from "./analytics.service.js";
import { extractUserId, extractUserName } from "../../utils/auth.util.js";

class AnalyticsController {
  // 1. GET /analytics/p-and-l
  async getProfitAndLoss(req, res) {
    try {
      const { branchId } = req.params;
      const { start_date, end_date } = req.query;

      const report = await analyticsService.getProfitAndLoss(
        branchId,
        start_date,
        end_date,
      );

      return res.status(200).json({
        message: "Profit and Loss statement retrieved successfully",
        data: report,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 2. GET /analytics/cash-flow-summary
  async getCashFlowSummary(req, res) {
    try {
      const { branchId } = req.params;
      const { start_date, end_date } = req.query;

      const summary = await analyticsService.getCashFlowSummary(
        branchId,
        start_date,
        end_date,
      );

      return res.status(200).json({
        message: "Cash flow summary retrieved successfully",
        data: summary,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 3. GET /analytics/category-spend-analysis
  async getCategorySpend(req, res) {
    try {
      const { branchId } = req.params;
      const { start_date, end_date } = req.query;

      const analysis = await analyticsService.getCategorySpend(
        branchId,
        start_date,
        end_date,
      );

      return res.status(200).json({
        message: "Category spend analysis retrieved successfully",
        data: analysis,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 4. GET /analytics/inventory-valuation
  async getInventoryValuation(req, res) {
    try {
      const { branchId } = req.params;

      const valuation = await analyticsService.getInventoryValuation(branchId);

      return res.status(200).json({
        message: "Inventory valuation retrieved successfully",
        data: valuation,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 5. GET /analytics/top-selling-items
  async getTopSellingItems(req, res) {
    try {
      const { branchId } = req.params;
      const { start_date, end_date } = req.query;

      const items = await analyticsService.getTopSellingItems(
        branchId,
        start_date,
        end_date,
      );

      return res.status(200).json({
        message: "Top selling items retrieved successfully",
        data: items,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 6. GET /analytics/dead-stock-report
  async getDeadStockReport(req, res) {
    try {
      const { branchId } = req.params;
      const { days } = req.query;

      const report = await analyticsService.getDeadStockReport(
        branchId,
        days ? parseInt(days) : 30,
      );

      return res.status(200).json({
        message: "Dead stock report retrieved successfully",
        data: report,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 7. GET /analytics/debt-velocity
  async getDebtVelocity(req, res) {
    try {
      const { branchId } = req.params;
      const { start_date, end_date } = req.query;

      const velocity = await analyticsService.getDebtVelocity(
        branchId,
        start_date,
        end_date,
      );

      return res.status(200).json({
        message: "Debt velocity analysis retrieved successfully",
        data: velocity,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 8. GET /analytics/staff-performance
  async getStaffPerformance(req, res) {
    try {
      const { branchId } = req.params;
      const { start_date, end_date } = req.query;

      const performance = await analyticsService.getStaffPerformance(
        branchId,
        start_date,
        end_date,
      );

      return res.status(200).json({
        message: "Staff performance data retrieved successfully",
        data: performance,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 9. GET /analytics/customer-lifetime-value
  async getCustomerLTV(req, res) {
    try {
      const { branchId } = req.params;

      const ltv = await analyticsService.getCustomerLTV(branchId);

      return res.status(200).json({
        message: "Customer lifetime value analysis retrieved successfully",
        data: ltv,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 10. GET /analytics/loss-analysis
  async getLossAnalysis(req, res) {
    try {
      const { branchId } = req.params;
      const { start_date, end_date } = req.query;

      const analysis = await analyticsService.getLossAnalysis(
        branchId,
        start_date,
        end_date,
      );

      return res.status(200).json({
        message: "Loss analysis retrieved successfully",
        data: analysis,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export const analyticsController = new AnalyticsController();
