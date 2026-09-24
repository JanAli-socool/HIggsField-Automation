import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const isNode = typeof globalThis !== "undefined" && typeof (globalThis as any).process?.versions?.node !== "undefined";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isNode && (globalThis as any).process?.env?.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (isNode && (globalThis as any).process?.env?.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;