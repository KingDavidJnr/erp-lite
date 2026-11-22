import express from "express";
import authMiddlewares from "../../middlewares/auth.middleware.js";
import { customerController } from "./customer.controller.js";

const router = express.Router();

// create a new customer
router.post(
  "/",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.SalesAccess,
  customerController.createCustomer,
);

// get all customers for a branch
router.get(
  "/:branchId",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.SalesAccess,
  customerController.getAllCustomers,
);

// get a single customer by ID
router.get(
  "/single/:customerId",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.SalesAccess,
  customerController.getCustomerById,
);

// update a customer
router.patch(
  "/:customerId",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.SalesAccess,
  customerController.updateCustomer,
);

// delete a customer
router.delete(
  "/:customerId",
  authMiddlewares.IsAuthenticated,
  authMiddlewares.IsBranchAdmin,
  customerController.deleteCustomer,
);

export const customerRoute = router;
