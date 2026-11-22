import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { auditLogsController } from "./auditlog.controller.js";

const router = express.Router();

// Get audit logs for branch by optional timeframe
router.get(
  "/:branchId",
  authMiddleware.IsAuthenticated,
  auditLogsController.getAllAuditLogs,
);

// Get specific audit log by ID
router.get(
  "/:branchId/:id",
  authMiddleware.IsAuthenticated,
  auditLogsController.getAuditLogById,
);

// Get audit logs by user or module with optional time frame
router.get(
  "/report/filter/:branchId",
  authMiddleware.IsAuthenticated,
  auditLogsController.generateAuditReport,
);

export const auditLogRoutes = router;
