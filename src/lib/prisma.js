// src/lib/prisma.js
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import "dotenv/config";

const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  // Prisma 7 REQUIRES a driver adapter for the Rust-free runtime
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  globalForPrisma.prisma = new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma;

export default prisma;
