import prisma from "../../lib/prisma.js";

class AuditLogsService {
  // List logs for a branch with optional timeframe
  async getAllAuditLogs(branchId, startDate, endDate) {
    const where = { branchId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    return prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // View single log details
  async getAuditLogById(id, branchId) {
    return prisma.auditLog.findFirst({
      where: { id, branchId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });
  }

  // Advanced filtering by module/user
  async generateAuditReport(branchId, filters) {
    const { startDate, endDate, moduleName, userId } = filters;

    const where = { branchId };

    // Filter by Module (e.g., "Sales", "Expenses")
    if (moduleName) {
      where.module = moduleName;
    }

    // Filter by specific User
    if (userId) {
      where.userId = BigInt(userId);
    }

    // Timeframe filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    return prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const auditLogsService = new AuditLogsService();
