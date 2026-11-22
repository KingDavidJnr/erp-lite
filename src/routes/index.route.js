import express from "express";
import prisma from "../lib/prisma.js";

import { userRouter } from "../modules/user/user.route.js";
import { branchRouter } from "../modules/branch/branch.route.js";
import { customerRoute } from "../modules/customer/customer.route.js";
import { inventoryRoute } from "../modules/inventory/inventory.route.js";
import { salesRoute } from "../modules/sales/sales.route.js";
import { paymentRoute } from "../modules/payment/payment.route.js";
import { expenseRoute } from "../modules/expense/expense.route.js";
import { analyticsRoute } from "../modules/analytics/analytics.route.js";
import { auditLogRoutes } from "../modules/auditlogs/auditlog.route.js";

const router = express.Router();

// Health check / monitor endpoint
router.get("/monitor", async (req, res) => {
  try {
    // Use a simple findFirst to test DB connectivity
    await prisma.User.findFirst();

    res.status(200).json({ message: "Backend is running healthy" });
  } catch (error) {
    console.error("Monitor endpoint error:", error);
    res.status(500).json({ message: "Backend health check failed" });
  }
});

// Use user routes
router.use("/users", userRouter);

// Use branch routes
router.use("/branches", branchRouter);

// Use customer routes
router.use("/customers", customerRoute);

// Use inventory routes
router.use("/inventory", inventoryRoute);

// use sales routes
router.use("/sales", salesRoute);

// use payment routes
router.use("/payments", paymentRoute);

// use expense routes
router.use("/expenses", expenseRoute);

// use analytics routes
router.use("/analytics", analyticsRoute);

// use audit log routes
router.use("/audit-logs", auditLogRoutes);

export default router;
