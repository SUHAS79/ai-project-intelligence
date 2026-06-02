/**
 * scripts/wipe.ts — Delete ALL data from the database.
 *
 * Wipes every table (users, projects, tasks, demo/seed data — everything) so
 * the app starts completely empty for real sign-ups. Targets whatever
 * DATABASE_URL points at (local file or Turso), so double-check your .env
 * before running against production.
 *
 * Usage:  npm run db:wipe
 */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL environment variable is not set.");

const adapter = new PrismaLibSql({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log(`🧹 Wiping ALL data from: ${url}`);

  // Safe dependency order (mirrors prisma/seed.ts cleanup).
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.projectMessage.deleteMany();
  await prisma.taskActivity.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.task.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.templateTask.deleteMany();
  await prisma.templateRisk.deleteMany();
  await prisma.projectTemplate.deleteMany();
  await prisma.user.deleteMany();

  const users = await prisma.user.count();
  const projects = await prisma.project.count();
  console.log(`✅ Done. Users: ${users}, Projects: ${projects} (database is empty).`);
}

main()
  .catch((e) => {
    console.error("❌ Wipe failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
