import prisma from "../../lib/prisma.js";

class BranchService {
  // Create a new branch
  async createBranch(data) {
    const { name, location } = data;
    return prisma.branch.create({
      data: { name, location },
    });
  }

  // Get all branches
  async getAllBranches() {
    return prisma.branch.findMany({
      orderBy: { createdAt: "asc" },
    });
  }

  // Get a branch by ID
  async getBranchById(id) {
    return prisma.branch.findUnique({
      where: { id },
    });
  }

  // Update a branch
  async updateBranch(id, data) {
    const { name, location } = data;
    return prisma.branch.update({
      where: { id },
      data: { name, location },
    });
  }

  // Delete a branch
  async deleteBranch(id) {
    return prisma.branch.delete({
      where: { id },
    });
  }
}

export const branchService = new BranchService();