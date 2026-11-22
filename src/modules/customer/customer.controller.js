// customer.controller.js
import { customerService } from "./customer.service.js";

class CustomerController {
  // Create a new customer
  async createCustomer(req, res) {
    try {
      const { branchId } = req.body;
      const { name, phone, email, address } = req.body;

      // Input validation
      if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ message: "Invalid customer name" });
      }

      if (!phone || typeof phone !== "string" || phone.trim() === "") {
        return res.status(400).json({ message: "Invalid phone number" });
      }

      if (email && typeof email !== "string") {
        return res.status(400).json({ message: "Invalid email" });
      }

      if (address && typeof address !== "string") {
        return res.status(400).json({ message: "Invalid address" });
      }

      const customer = await customerService.createCustomer(branchId, {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim(),
        address: address?.trim(),
      });

      if (customer?.duplicate) {
        return res.status(409).json({ message: customer.message });
      }

      return res
        .status(201)
        .json({ message: "Customer created successfully", data: customer });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get all customers
  async getAllCustomers(req, res) {
    try {
      const { branchId } = req.params;
      const customers = await customerService.getAllCustomers(branchId);
      return res
        .status(200)
        .json({ message: "Customers retrieved successfully", data: customers });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get customer by ID
  async getCustomerById(req, res) {
    try {
      const { customerId } = req.params;

      const customer = await customerService.getCustomerById(customerId);

      if (!customer)
        return res.status(404).json({ message: "Customer not found" });

      return res
        .status(200)
        .json({ message: "Customer retrieved successfully", data: customer });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Update customer
  async updateCustomer(req, res) {
    try {
      const { customerId } = req.params;
      const { name, phone, email, address } = req.body;

      // Input validation
      if (name && (typeof name !== "string" || name.trim() === "")) {
        return res.status(400).json({ message: "Invalid customer name" });
      }

      if (phone && (typeof phone !== "string" || phone.trim() === "")) {
        return res.status(400).json({ message: "Invalid phone number" });
      }

      if (email && typeof email !== "string") {
        return res.status(400).json({ message: "Invalid email" });
      }

      if (address && typeof address !== "string") {
        return res.status(400).json({ message: "Invalid address" });
      }

      const customer = await customerService.getCustomerById(customerId);

      if (!customer)
        return res.status(404).json({ message: "Customer not found" });

      const updatedCustomer = await customerService.updateCustomer(customerId, {
        name: name?.trim(),
        phone: phone?.trim(),
        email: email?.trim(),
        address: address?.trim(),
      });

      return res.status(200).json({
        message: "Customer updated successfully",
        data: updatedCustomer,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Delete customer
  async deleteCustomer(req, res) {
    try {
      const { customerId } = req.params;

      const customer = await customerService.getCustomerById(customerId);

      if (!customer)
        return res.status(404).json({ message: "Customer not found" });

      await customerService.deleteCustomer(customerId);
      return res.status(200).json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export const customerController = new CustomerController();
