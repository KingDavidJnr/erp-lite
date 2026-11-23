import "dotenv/config";
import { test, afterAll } from "@jest/globals";
import assert from "node:assert/strict";


if (!process.env.DATABASE_URL) {
  throw new Error("Set DATABASE_URL to a dedicated test database");
}


process.env.DATABASE_URL = process.env.DATABASE_URL;


const { default: prisma } = await import("../src/lib/prisma.js");
const { salesService } = await import("../src/modules/sales/sales.service.js");


async function createFixture() {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;


  const branch = await prisma.branch.create({
    data: { name: `Return test ${suffix}` },
  });


  const user = await prisma.user.create({
    data: {
      branchId: branch.id,
      firstName: "Return",
      lastName: "Tester",
      username: `return-${suffix}`,
      password: "test-only",
      role: "BRANCH_ADMIN",
    },
  });


  const customer = await prisma.customer.create({
    data: {
      branchId: branch.id,
      name: "Test Customer",
      phone: `080${suffix.slice(-8)}`,
    },
  });


  const inventory = await prisma.inventoryItem.create({
    data: {
      branchId: branch.id,
      name: `Test Item ${suffix}`,
      sellingPrice: 10,
      quantity: 10,
      lowStockThreshold: 1,
    },
  });


  const sale = await prisma.sale.create({
    data: {
      branchId: branch.id,
      customerId: customer.id,
      saleDate: new Date(),
      totalAmount: 50,
      status: "COMPLETED",
      createdBy: user.id,
    },
  });


  const saleItem = await prisma.saleItem.create({
    data: {
      branchId: branch.id,
      saleId: sale.id,
      inventoryItemId: inventory.id,
      name: inventory.name,
      quantity: 5,
      unitPrice: 10,
      subtotal: 50,
    },
  });


  return {
    branchId: branch.id,
    userId: user.id,
    customerId: customer.id,
    inventoryItemId: inventory.id,
    saleId: sale.id,
    saleItemId: saleItem.id,
  };
}


async function cleanupFixture(f) {
  await prisma.returnTransaction.deleteMany({
    where: { saleItemId: f.saleItemId },
  });
  await prisma.inventoryMovement.deleteMany({
    where: { branchId: f.branchId },
  });
  await prisma.auditLog.deleteMany({
    where: { branchId: f.branchId },
  });
  await prisma.saleItem.deleteMany({
    where: { id: f.saleItemId },
  });
  await prisma.sale.deleteMany({
    where: { id: f.saleId },
  });
  await prisma.inventoryItem.deleteMany({
    where: { id: f.inventoryItemId },
  });
  await prisma.customer.deleteMany({
    where: { id: f.customerId },
  });
  await prisma.user.deleteMany({
    where: { id: f.userId },
  });
  await prisma.branch.deleteMany({
    where: { id: f.branchId },
  });
}


function returnData(quantity) {
  return {
    quantity,
    returnDate: new Date().toISOString(),
    note: "Integration test",
  };
}


async function recordReturn(f, quantity) {
  return salesService.recordReturn(
    f.saleItemId,
    f.branchId,
    f.userId,
    "Return Tester",
    returnData(quantity),
  );
}



afterAll(async () => {
  await prisma.$disconnect();
})