// customer.service.js
import prisma from "../../lib/prisma.js";

class CustomerService {
  // Create a new customer
  async createCustomer(branchId, data) {
    const { name, phone, email, address } = data;

    const existing = await prisma.customer.findFirst({
      where: {
        branchId,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing) {
      return { duplicate: true, message: `A customer with the name "${name}" already exists in this branch` };
    }

    return prisma.customer.create({
      data: {
        branchId,
        name,
        phone,
        email,
        address,
      },
    });
  }

  // Get all customers for a branch
  async getAllCustomers(branchId) {
    return prisma.customer.findMany({
      where: { branchId },
      orderBy: { createdAt: "asc" }, // oldest first
    });
  }

  // Get a single customer by ID
  async getCustomerById(id) {
    return prisma.customer.findUnique({
      where: { id },
    });
  }

  // Update a customer
  async updateCustomer(id, data) {
    const { name, phone, email, address } = data;
    return prisma.customer.update({
      where: { id },
      data: { name, phone, email, address },
    });
  }

  // Delete a customer
  async deleteCustomer(id) {
    return prisma.customer.delete({
      where: { id },
    });
  }
}

export const customerService = new CustomerService();