import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { userController } from "./user.controller.js";

const router = express.Router();

// Create new user
router.post(
  "/",
  authMiddleware.IsAuthenticated,
  authMiddleware.IsBranchAdmin,
  userController.createUser,
);

// Create general admin via API key (no auth middleware, but checks API key in controller)
router.post("/general-admin", userController.createGeneralAdmin);

// Create new user by admin
router.post(
  "/admin-create",
  authMiddleware.IsAuthenticated,
  userController.createUserByAdmin,
);

// Get all the users in organization
router.get(
  "/",
  authMiddleware.IsAuthenticated,
  authMiddleware.IsGeneralAdmin,
  userController.getAllUsers,
);

// Get all the users in the branch
router.get(
  "/branch/:branchId",
  authMiddleware.IsAuthenticated,
  authMiddleware.IsBranchAdmin,
  userController.getUsersByBranch,
);

// Get user by id
router.get(
  "/:id",
  authMiddleware.IsAuthenticated,
  authMiddleware.UserProfile,
  userController.findUserById,
);

// Update user password
router.patch(
  "/:id/password",
  authMiddleware.IsAuthenticated,
  authMiddleware.UserProfile,
  userController.updatePassword,
);

// Update user role and branch
router.patch(
  "/:id/role-branch",
  authMiddleware.IsAuthenticated,
  authMiddleware.IsGeneralAdmin,
  userController.updateUser,
);

// Delete user
router.delete(
  "/:id",
  authMiddleware.IsAuthenticated,
  authMiddleware.IsBranchAdmin,
  userController.deleteUser,
);

// User login
router.post("/login", userController.login);

// User logout
router.post("/logout", authMiddleware.IsAuthenticated, userController.logout);

export const userRouter = router;
