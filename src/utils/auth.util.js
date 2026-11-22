import { verifyToken } from "./jwt.util.js";

/**
 * Extracts the decoded payload from JWT token.
 */
const extractTokenPayload = (req) => {
  if (req.tokenPayload) return req.tokenPayload;

  const token = req.cookies?.jwt || req.headers.authorization?.split(" ")[1];

  if (!token) return null;

  const decoded = verifyToken(token);

  if (decoded?.status) return null;

  req.tokenPayload = decoded;

  return decoded;
};

/**
 * Extract user_id
 */
const extractUserId = (req) => {
  const decoded = extractTokenPayload(req);
  return decoded ? decoded.user_id : null;
};

/**
 * Extract role
 */
const extractUserRole = (req) => {
  const decoded = extractTokenPayload(req);
  return decoded ? decoded.role : null;
};

/**
 * Extract user_name
 */
const extractUserName = (req) => {
  const decoded = extractTokenPayload(req);
  return decoded ? decoded.user_name : null;
};

/**
 * Extract branch_id
 */
const extractBranchId = (req) => {
  const decoded = extractTokenPayload(req);
  return decoded ? decoded.branch_id : null;
};

/**
 * Check if user is GENERAL_VIEWER
 */
const isGeneralView = (req) => {
  const role = extractUserRole(req);
  return role === "GENERAL_VIEWER";
};

export {
  extractUserId,
  extractUserRole,
  extractUserName,
  extractBranchId,
  extractTokenPayload,
  isGeneralView,
};
