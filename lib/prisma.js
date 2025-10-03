// lib/prisma.js
import { PrismaClient } from "/app/generated/prisma-client";

const globalForPrisma = globalThis;

let prisma = globalForPrisma.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

export default prisma;
