import express from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { branchController } from "./branch.controller.js";

const router = express.Router();

// Create a new branch
router.post(
  "/",
  authMiddleware.IsAuthenticated,
  authMiddleware.IsGeneralAdmin,
  branchController.createBranch,
);

// Get all branches
router.get(
  "/",
  authMiddleware.IsAuthenticated,
  branchController.getAllBranches,
);

// Get a single branch by branchId
router.get(
  "/:branchId",
  authMiddleware.IsAuthenticated,
  authMiddleware.BranchAccess,
  branchController.getBranchById,
);

// Update a branch
router.patch(
  "/:branchId",
  authMiddleware.IsAuthenticated,
  authMiddleware.IsGeneralAdmin,
  branchController.updateBranch,
);

// Delete a branch
router.delete(
  "/:branchId",
  authMiddleware.IsAuthenticated,
  authMiddleware.IsGeneralAdmin,
  branchController.deleteBranch,
);

export const branchRouter = router;
