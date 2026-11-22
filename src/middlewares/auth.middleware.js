import dotenv from "dotenv";
import {
  extractUserId,
  extractUserRole,
  extractUserName,
  extractBranchId,
} from "../utils/auth.util.js";

dotenv.config();

class AuthMiddleware {
  /**
   * Ensure the request has a valid JWT and attach decoded pieces to req
   * - Must be run before other checks.
   */
  async IsAuthenticated(req, res, next) {
    const userId = extractUserId(req);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid or missing token" });
    }

    // Attach info to req for downstream middleware
    req.userId = userId;
    req.userRole = extractUserRole(req); // may be null if token minimal
    req.userBranchId = extractBranchId(req); // nullable for general_admin
    req.userName = extractUserName(req); // may be null if token minimal

    return next();
  }

  /**
   * Allow access only to the owner of a user profile
   */
  async UserProfile(req, res, next) {
    const userId = extractUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const profileId = req.params.userId || req.params.id;

    if (String(userId) !== String(profileId)) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not have access to this profile" });
    }

    return next();
  }

  /**
   * Only general_admin may pass
   */
  async IsGeneralAdmin(req, res, next) {
    const role = req.userRole || extractUserRole(req);
    if (role !== "GENERAL_ADMIN") {
      return res
        .status(403)
        .json({ message: "Forbidden: Only general admins are allowed" });
    }
    return next();
  }

  /**
   * Only general_admin or general_viewer may pass
   */
  async IsGeneralAdminOrViewer(req, res, next) {
    const role = req.userRole || extractUserRole(req);
    if (!["GENERAL_ADMIN", "GENERAL_VIEWER"].includes(role)) {
      return res.status(403).json({
        message: "Forbidden: Only general admins or viewers are allowed",
      });
    }
    return next();
  }

  /**
   * Branch admin or higher (branch_admin, general_admin)
   */
  async IsBranchAdmin(req, res, next) {
    const role = req.userRole || extractUserRole(req);
    const allowedRoles = ["GENERAL_ADMIN", "BRANCH_ADMIN"];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: "Forbidden: Only branch admins or general admins are allowed",
      });
    }
    return next();
  }

  /**
   * Branch-level scoping:
   * - general_admin/general_viewer -> unrestricted
   * - others (branch_admin, branch_member, branch_viewer) -> only their branch
   */
  async BranchAccess(req, res, next) {
    const role = req.userRole || extractUserRole(req);
    const tokenBranchId = req.userBranchId || extractBranchId(req);

    const branchIdRaw =
      req.params.branchId || req.params.branch_id || req.body.branch_id || req.body.branchId;
    const branchId = branchIdRaw || null;

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required" });
    }

    // General roles bypass branch checks
    if (["GENERAL_ADMIN", "GENERAL_VIEWER"].includes(role)) {
      return next();
    }

    if (!tokenBranchId) {
      return res.status(403).json({
        message: "Forbidden: You do not have a branch assigned in your token",
      });
    }

    if (tokenBranchId !== branchId) {
      return res.status(403).json({
        message: "Forbidden: You can only access records for your branch",
      });
    }

    return next();
  }

  /**
   * Financial operations (expenses, incomes, categories)
   */
  async FinancialAccess(req, res, next) {
    const role = req.userRole || extractUserRole(req);
    const rwAllowed = ["GENERAL_ADMIN", "BRANCH_ADMIN"];

    if (rwAllowed.includes(role)) {
      return next();
    }

    if (["GENERAL_VIEWER", "BRANCH_VIEWER"].includes(role)) {
      if (req.method === "GET") return next();
      return res.status(403).json({
        message: "Forbidden: Viewers have read-only financial access",
      });
    }

    return res
      .status(403)
      .json({ message: "Forbidden: You do not have financial access" });
  }

  /**
   * Sales operations
   */
  async SalesAccess(req, res, next) {
    const role = req.userRole || extractUserRole(req);
    const allowedRoles = ["GENERAL_ADMIN", "BRANCH_ADMIN", "BRANCH_MEMBER"];

    if (allowedRoles.includes(role)) {
      return next();
    }

    if (role === "BRANCH_VIEWER") {
      if (req.method === "GET") return next();
      return res.status(403).json({
        message: "Forbidden: Viewers have read-only sales access",
      });
    }

    return res
      .status(403)
      .json({ message: "Forbidden: You do not have Branch Sales access" });
  }

  /**
   * User management (create/update users for a branch)
   */
  async UserManagementAccess(req, res, next) {
    const role = req.userRole || extractUserRole(req);
    const allowedRoles = ["GENERAL_ADMIN", "BRANCH_ADMIN"];

    if (!allowedRoles.includes(role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: You cannot manage users" });
    }

    return next();
  }

  /**
   * Branch creation - only general_admin
   */
  async BranchCreation(req, res, next) {
    const role = req.userRole || extractUserRole(req);
    if (role !== "GENERAL_ADMIN") {
      return res.status(403).json({
        message: "Forbidden: Only general admins can create branches",
      });
    }
    return next();
  }
}

// Export a single instance (ES Module style)
const authMiddleware = new AuthMiddleware();
export default authMiddleware;
