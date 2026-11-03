import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Singleton PrismaClient instance to avoid connection pool exhaustion
 * during heavy load and reload events.
 */
export const prisma: PrismaClient =
  global.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    errorFormat: "minimal",
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export default prisma;

