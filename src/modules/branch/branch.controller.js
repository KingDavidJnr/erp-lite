// branch.controller.js
import { branchService } from "./branch.service.js";

class BranchController {
  // Create a new branch
  async createBranch(req, res) {
    try {
      const { name, location } = req.body;

      // Input validation
      if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ message: "Invalid branch name" });
      }

      if (
        location &&
        (typeof location !== "string" || location.trim() === "")
      ) {
        return res.status(400).json({ message: "Invalid branch location" });
      }

      const branch = await branchService.createBranch({
        name: name.trim(),
        location: location?.trim(),
      });

      return res
        .status(201)
        .json({ message: "Branch created successfully", data: branch });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get all branches
  async getAllBranches(req, res) {
    try {
      const branches = await branchService.getAllBranches();
      return res
        .status(200)
        .json({ message: "Branches retrieved successfully", data: branches });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get a single branch by branchId
  async getBranchById(req, res) {
    try {
      const { branchId } = req.params;
      const branch = await branchService.getBranchById(branchId);
      if (!branch) return res.status(404).json({ message: "Branch not found" });
      return res
        .status(200)
        .json({ message: "Branch retrieved successfully", data: branch });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Update a branch
  async updateBranch(req, res) {
    try {
      const { branchId } = req.params;
      const { name, location } = req.body;

      // Input validation
      if (name && (typeof name !== "string" || name.trim() === "")) {
        return res.status(400).json({ message: "Invalid branch name" });
      }

      if (
        location &&
        (typeof location !== "string" || location.trim() === "")
      ) {
        return res.status(400).json({ message: "Invalid branch location" });
      }

      const branch = await branchService.getBranchById(branchId);
      if (!branch) return res.status(404).json({ message: "Branch not found" });

      const updatedBranch = await branchService.updateBranch(branchId, {
        name: name?.trim(),
        location: location?.trim(),
      });

      return res
        .status(200)
        .json({ message: "Branch updated successfully", data: updatedBranch });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Delete a branch
  async deleteBranch(req, res) {
    try {
      const { branchId } = req.params;

      const branch = await branchService.getBranchById(branchId);
      if (!branch) return res.status(404).json({ message: "Branch not found" });

      await branchService.deleteBranch(branchId);
      return res.status(200).json({ message: "Branch deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export const branchController = new BranchController();
