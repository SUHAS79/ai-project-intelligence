/**
 * lib/prisma.ts — Prisma client singleton
 *
 * Uses @prisma/adapter-libsql so the same code works in all environments:
 *   - Local dev:  DATABASE_URL="file:./dev.db"           (no auth token needed)
 *   - Turso:      DATABASE_URL="libsql://[db].turso.io"  + DATABASE_AUTH_TOKEN="..."
 */

import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set.");

  const adapter = new PrismaLibSql({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
