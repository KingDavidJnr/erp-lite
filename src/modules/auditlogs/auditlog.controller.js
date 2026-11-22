import { auditLogsService } from "./auditlog.service.js";

class AuditLogsController {
  // 1. GET /audit-logs/:branchId
  async getAllAuditLogs(req, res) {
    try {
      const { branchId } = req.params;
      const { start_date, end_date } = req.query;

      const logs = await auditLogsService.getAllAuditLogs(
        branchId,
        start_date,
        end_date,
      );

      return res.status(200).json({
        message: "Audit logs retrieved successfully",
        data: logs,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 2. GET /audit-logs/:branchId/:id
  async getAuditLogById(req, res) {
    try {
      const { branchId, id } = req.params;

      const log = await auditLogsService.getAuditLogById(id, branchId);

      if (!log) {
        return res.status(404).json({ message: "Audit log not found" });
      }

      return res.status(200).json({
        message: "Audit log details retrieved successfully",
        data: log,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // 3. GET /audit-logs/:branchId/report
  async generateAuditReport(req, res) {
    try {
      const { branchId } = req.params;
      const { start_date, end_date, module, userId } = req.query;

      const filters = {
        startDate: start_date,
        endDate: end_date,
        moduleName: module,
        userId: userId,
      };

      const report = await auditLogsService.generateAuditReport(
        branchId,
        filters,
      );

      return res.status(200).json({
        message: "Audit report generated successfully",
        data: report,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export const auditLogsController = new AuditLogsController();
