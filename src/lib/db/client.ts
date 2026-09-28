import { PrismaClient } from "@prisma/client";
import mockPrisma, { clearMockData, generateId } from "./mock-client.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let realPrisma: PrismaClient | null = null;

function getRealPrisma(): PrismaClient {
  if (!realPrisma) {
    realPrisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  return realPrisma;
}

const USE_MOCK = process.env.USE_MOCK_DB === "true" || 
                 process.env.NODE_ENV === "test" || 
                 !process.env.DATABASE_URL ||
                 process.env.DATABASE_URL.includes("localhost");

const prisma = USE_MOCK ? mockPrisma : (globalForPrisma.prisma ?? getRealPrisma());

if (!USE_MOCK && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma as PrismaClient;
}

export { prisma as default, clearMockData, generateId, USE_MOCK };
export type { PrismaClient };