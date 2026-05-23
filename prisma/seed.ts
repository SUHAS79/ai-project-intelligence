import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.project.deleteMany();

  // Dates relative to today for realistic demo
  const today = new Date();
  const d = (daysFromToday: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + daysFromToday);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // ─── Project 1: Mobile App Launch ───────────────────────────────────────────
  const project1 = await prisma.project.create({
    data: {
      name: "Mobile App Launch Q3",
      description:
        "Launch the consumer-facing iOS and Android app by end of Q3. Includes onboarding, core features, and App Store submission.",
      status: "ACTIVE",
      startDate: d(-42),
      endDate: d(28),
    },
  });

  const t1 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Finalize product requirements",
      description: "Lock down PRD with all stakeholders",
      status: "DONE",
      priority: "HIGH",
      owner: "Sarah Chen",
      startDate: d(-42),
      endDate: d(-35),
      completedAt: d(-36),
    },
  });

  const t2 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "UI/UX design — onboarding flow",
      description: "Design all screens for user onboarding",
      status: "DONE",
      priority: "HIGH",
      owner: "Alex Rivera",
      startDate: d(-35),
      endDate: d(-21),
      completedAt: d(-22),
    },
  });

  const t3 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Backend API — auth & user management",
      description: "JWT auth, registration, profile endpoints",
      status: "DONE",
      priority: "CRITICAL",
      owner: "Priya Patel",
      startDate: d(-35),
      endDate: d(-14),
      completedAt: d(-14),
    },
  });

  const t4 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Implement onboarding screens (iOS)",
      description: "Build onboarding flow per approved designs",
      status: "IN_PROGRESS",
      priority: "HIGH",
      owner: "James Kim",
      startDate: d(-21),
      endDate: d(-5),
    },
  });

  const t5 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Implement onboarding screens (Android)",
      description: "Mirror iOS onboarding in Kotlin",
      status: "BLOCKED",
      priority: "HIGH",
      owner: "Maria Santos",
      startDate: d(-14),
      endDate: d(-2),
    },
  });

  const t6 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Core feature: Home feed",
      description: "Build and wire up main content feed",
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      owner: "James Kim",
      startDate: d(-10),
      endDate: d(5),
    },
  });

  const t7 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Core feature: Push notifications",
      description: "Integrate push notification service (APNs + FCM)",
      status: "TODO",
      priority: "MEDIUM",
      owner: "Priya Patel",
      startDate: d(0),
      endDate: d(10),
    },
  });

  const t8 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "QA — regression testing",
      description: "Full regression test pass on iOS and Android",
      status: "TODO",
      priority: "HIGH",
      owner: "Lisa Tran",
      startDate: d(5),
      endDate: d(15),
    },
  });

  const t9 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "App Store submission (iOS)",
      description: "Prepare assets, screenshots, submit for review",
      status: "TODO",
      priority: "HIGH",
      owner: "Sarah Chen",
      startDate: d(15),
      endDate: d(20),
    },
  });

  const t10 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Google Play submission (Android)",
      description: "Prepare assets, screenshots, submit for review",
      status: "TODO",
      priority: "HIGH",
      owner: "Sarah Chen",
      startDate: d(15),
      endDate: d(20),
    },
  });

  const t11 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Beta launch to 100 users",
      description: "Soft launch with beta cohort and collect feedback",
      status: "TODO",
      priority: "MEDIUM",
      owner: "Alex Rivera",
      startDate: d(20),
      endDate: d(25),
    },
  });

  const t12 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Performance optimization",
      description: "Profile and fix any performance regressions",
      status: "TODO",
      priority: "LOW",
      owner: "Maria Santos",
      startDate: d(-7),
      endDate: d(3),
    },
  });

  // Dependencies for project 1
  await prisma.taskDependency.createMany({
    data: [
      { dependentId: t2.id, dependencyId: t1.id }, // Design depends on PRD
      { dependentId: t4.id, dependencyId: t2.id }, // iOS onboarding depends on Design
      { dependentId: t5.id, dependencyId: t2.id }, // Android onboarding depends on Design
      { dependentId: t4.id, dependencyId: t3.id }, // iOS onboarding depends on Auth API
      { dependentId: t5.id, dependencyId: t3.id }, // Android onboarding depends on Auth API
      { dependentId: t6.id, dependencyId: t4.id }, // Home feed depends on iOS onboarding
      { dependentId: t7.id, dependencyId: t6.id }, // Push notif depends on Home feed
      { dependentId: t8.id, dependencyId: t6.id }, // QA depends on Home feed
      { dependentId: t8.id, dependencyId: t5.id }, // QA depends on Android onboarding
      { dependentId: t8.id, dependencyId: t7.id }, // QA depends on push notif
      { dependentId: t9.id, dependencyId: t8.id }, // App Store depends on QA
      { dependentId: t10.id, dependencyId: t8.id }, // Play Store depends on QA
      { dependentId: t11.id, dependencyId: t9.id }, // Beta depends on App Store
      { dependentId: t11.id, dependencyId: t10.id }, // Beta depends on Play Store
    ],
  });

  // Risks for project 1
  await prisma.risk.createMany({
    data: [
      {
        projectId: project1.id,
        title: "App Store review rejection",
        description:
          "Apple may reject the app for guideline violations, causing 1-2 week delay.",
        probability: "MEDIUM",
        impact: "HIGH",
        mitigation:
          "Pre-review checklist against Apple guidelines. Allocate 2-week buffer.",
        status: "OPEN",
      },
      {
        projectId: project1.id,
        title: "Android dev resource bottleneck",
        description:
          "Maria is the only Android developer and is currently blocked on dependency.",
        probability: "HIGH",
        impact: "HIGH",
        mitigation:
          "Unblock dependency immediately. Consider contracting a second Android dev.",
        status: "MITIGATING",
      },
      {
        projectId: project1.id,
        title: "Push notification service outage",
        description: "Third-party push service (OneSignal/FCM) instability.",
        probability: "LOW",
        impact: "MEDIUM",
        mitigation: "Add retry logic and fallback to email notifications.",
        status: "OPEN",
      },
    ],
  });

  // ─── Project 2: Data Platform Migration ─────────────────────────────────────
  const project2 = await prisma.project.create({
    data: {
      name: "Data Platform Migration",
      description:
        "Migrate legacy data warehouse from on-prem to cloud. Zero-downtime cutover required.",
      status: "ACTIVE",
      startDate: d(-60),
      endDate: d(45),
    },
  });

  const dp1 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "Audit current data warehouse",
      status: "DONE",
      priority: "HIGH",
      owner: "Carlos Mendez",
      startDate: d(-60),
      endDate: d(-50),
      completedAt: d(-51),
    },
  });

  const dp2 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "Select cloud provider and architecture",
      status: "DONE",
      priority: "CRITICAL",
      owner: "Carlos Mendez",
      startDate: d(-50),
      endDate: d(-40),
      completedAt: d(-39),
    },
  });

  const dp3 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "Set up cloud environment and IAM",
      status: "DONE",
      priority: "HIGH",
      owner: "Nina Volkov",
      startDate: d(-40),
      endDate: d(-30),
      completedAt: d(-29),
    },
  });

  const dp4 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "ETL pipeline development",
      description: "Build pipelines for all 12 data sources",
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      owner: "Nina Volkov",
      startDate: d(-30),
      endDate: d(-8),
    },
  });

  const dp5 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "Data validation and reconciliation",
      status: "TODO",
      priority: "HIGH",
      owner: "Carlos Mendez",
      startDate: d(-8),
      endDate: d(5),
    },
  });

  const dp6 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "Cutover rehearsal (dry run)",
      status: "TODO",
      priority: "HIGH",
      owner: "Nina Volkov",
      startDate: d(5),
      endDate: d(15),
    },
  });

  const dp7 = await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "Production cutover",
      status: "TODO",
      priority: "CRITICAL",
      owner: "Carlos Mendez",
      startDate: d(20),
      endDate: d(25),
    },
  });

  await prisma.taskDependency.createMany({
    data: [
      { dependentId: dp2.id, dependencyId: dp1.id },
      { dependentId: dp3.id, dependencyId: dp2.id },
      { dependentId: dp4.id, dependencyId: dp3.id },
      { dependentId: dp5.id, dependencyId: dp4.id },
      { dependentId: dp6.id, dependencyId: dp5.id },
      { dependentId: dp7.id, dependencyId: dp6.id },
    ],
  });

  await prisma.risk.createMany({
    data: [
      {
        projectId: project2.id,
        title: "Data loss during migration",
        description: "Incorrect ETL transformation could corrupt or drop rows.",
        probability: "MEDIUM",
        impact: "HIGH",
        mitigation:
          "Row-count and checksum validation at every stage. Maintain hot standby for 72h post-cutover.",
        status: "MITIGATING",
      },
      {
        projectId: project2.id,
        title: "ETL pipeline delays",
        description:
          "Complex data sources may take longer than estimated to pipeline.",
        probability: "HIGH",
        impact: "MEDIUM",
        mitigation:
          "Prioritize highest-volume sources first. Add 10-day buffer before cutover.",
        status: "OPEN",
      },
    ],
  });

  // ─── Project 3: Internal Dashboard Redesign ──────────────────────────────────
  const project3 = await prisma.project.create({
    data: {
      name: "Internal Dashboard Redesign",
      description:
        "Modernize the internal analytics dashboard for the ops team. New design system, improved performance.",
      status: "ACTIVE",
      startDate: d(-20),
      endDate: d(40),
    },
  });

  const id1 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: "Stakeholder interviews and requirements",
      status: "DONE",
      priority: "HIGH",
      owner: "Emma Wilson",
      startDate: d(-20),
      endDate: d(-14),
      completedAt: d(-14),
    },
  });

  const id2 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: "Wireframes and design system setup",
      status: "IN_PROGRESS",
      priority: "HIGH",
      owner: "Alex Rivera",
      startDate: d(-14),
      endDate: d(-3),
    },
  });

  const id3 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: "Component library build",
      status: "TODO",
      priority: "MEDIUM",
      owner: "Emma Wilson",
      startDate: d(-3),
      endDate: d(10),
    },
  });

  const id4 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: "Dashboard views implementation",
      status: "TODO",
      priority: "HIGH",
      owner: "Emma Wilson",
      startDate: d(10),
      endDate: d(28),
    },
  });

  const id5 = await prisma.task.create({
    data: {
      projectId: project3.id,
      title: "User acceptance testing",
      status: "TODO",
      priority: "MEDIUM",
      owner: "Lisa Tran",
      startDate: d(28),
      endDate: d(38),
    },
  });

  await prisma.taskDependency.createMany({
    data: [
      { dependentId: id2.id, dependencyId: id1.id },
      { dependentId: id3.id, dependencyId: id2.id },
      { dependentId: id4.id, dependencyId: id3.id },
      { dependentId: id5.id, dependencyId: id4.id },
    ],
  });

  await prisma.risk.create({
    data: {
      projectId: project3.id,
      title: "Design approval delays",
      description:
        "Ops team stakeholders historically slow to review and approve designs.",
      probability: "MEDIUM",
      impact: "MEDIUM",
      mitigation:
        "Schedule weekly design review sessions. Get sign-off on each component before moving to next.",
      status: "OPEN",
    },
  });

  console.log("✅ Seed complete!");
  console.log(`   • Projects: 3`);
  console.log(`   • Tasks: 24`);
  console.log(`   • Dependencies: 23`);
  console.log(`   • Risks: 6`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
