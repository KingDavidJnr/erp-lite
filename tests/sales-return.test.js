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

test("sales returns enforce cumulative quantity limits", async () => {
  const f = await createFixture()

  try {
    await recordReturn(f, 2)

    let inventory = await prisma.inventoryItem.findUnique({
      where: {id: f.inventoryItemId}
    })

    assert.equal(Number(inventory.quantity), 12)

    await recordReturn(f, 3)

    inventory = await prisma.inventoryItem.findUnique({
      where: {id: f.inventoryItemId}
    })
    assert.equal(Number(inventory.quantity), 15)

    await assert.rejects(
      recordReturn(f, 0.001),
      /Return quantity exceeds remaining quantity/,
    )

    inventory = await prisma.inventoryItem.findUnique({
      where: {id: f.inventoryItemId}
    })
    assert.equal(Number(inventory.quantity), 15)

    assert.equal(
      await prisma.returnTransaction.count({
        where: {saleItemId: f.saleItemId}
      }), 2
    )
  } finally {
    await cleanupFixture(f)
  }
})

test("concurrent returns cannot exceed the original sold quantity", async () => {
  const f = await createFixture()

  try {
    const results = await Promise.allSettled([
      recordReturn(f, 3),
      recordReturn(f, 3)
    ])

    assert.equal(
      results.filter((result) => result.status === "fulfilled").length, 1
    )

    assert.equal(
      results.filter((result) => result.status === "rejected").length, 1
    )

    const inventory = await prisma.inventoryItem.findUnique({
      where: {id: f.inventoryItemId}
    })

    assert.equal(Number(inventory.quantity), 13)

    assert.equal(
      await prisma.returnTransaction.count({
        where: {saleItemId: f.saleItemId}
      }), 1
    )
  } finally {
    await cleanupFixture(f)
  }
})

afterAll(async () => {
  await prisma.$disconnect();
})