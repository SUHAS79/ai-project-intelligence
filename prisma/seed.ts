import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL environment variable is not set.");

const adapter = new PrismaLibSql({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
const prisma = new PrismaClient({ adapter } as any);

function computeInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Cleanup (safe dependency order) ────────────────────────────────────────
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

  // ─── Date helpers ─────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const d = (days: number): Date => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + days);
    return dt;
  };

  const ds = (days: number): string => {
    const dt = d(days);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const dt = (days: number, hour: number): Date => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  // ─── Password hashes (batch) ──────────────────────────────────────────────
  console.log("  Hashing passwords...");
  const [managerHash, seniorHash, devHash] = await Promise.all([
    bcrypt.hash("manager123", 12),
    bcrypt.hash("senior123", 12),
    bcrypt.hash("dev123", 12),
  ]);

  // ─── Users ────────────────────────────────────────────────────────────────
  // 3 Managers
  const sarah = await prisma.user.create({
    data: { fullName: "Sarah Mitchell", email: "sarah@namo.dev", password: managerHash, role: "manager", status: "active", initials: "SM", lastLogin: d(-1) },
  });
  const marcus = await prisma.user.create({
    data: { fullName: "Marcus Johnson", email: "marcus@namo.dev", password: managerHash, role: "manager", status: "active", initials: "MJ", lastLogin: d(-3) },
  });
  const rachel = await prisma.user.create({
    data: { fullName: "Rachel Chen", email: "rachel@namo.dev", password: managerHash, role: "manager", status: "active", initials: "RC", lastLogin: d(-1) },
  });

  // 6 Senior Developers
  const alex = await prisma.user.create({
    data: { fullName: "Alex Rivera", email: "alex@namo.dev", password: seniorHash, role: "senior_developer", status: "active", initials: "AR", lastLogin: d(0) },
  });
  const nina = await prisma.user.create({
    data: { fullName: "Nina Volkov", email: "nina@namo.dev", password: seniorHash, role: "senior_developer", status: "active", initials: "NV", lastLogin: d(-2) },
  });
  const carlos = await prisma.user.create({
    data: { fullName: "Carlos Mendez", email: "carlos@namo.dev", password: seniorHash, role: "senior_developer", status: "active", initials: "CM", lastLogin: d(-4) },
  });
  const priya = await prisma.user.create({
    data: { fullName: "Priya Patel", email: "priya@namo.dev", password: seniorHash, role: "senior_developer", status: "active", initials: "PP", lastLogin: d(-1) },
  });
  const jordan = await prisma.user.create({
    data: { fullName: "Jordan Walsh", email: "jordan@namo.dev", password: seniorHash, role: "senior_developer", status: "active", initials: "JW", lastLogin: d(-2) },
  });
  const yuki = await prisma.user.create({
    data: { fullName: "Yuki Tanaka", email: "yuki@namo.dev", password: seniorHash, role: "senior_developer", status: "active", initials: "YT", lastLogin: d(-1) },
  });

  // 10 Developers
  const emma = await prisma.user.create({
    data: { fullName: "Emma Wilson", email: "emma@namo.dev", password: devHash, role: "developer", status: "active", initials: "EW", lastLogin: d(0) },
  });
  const james = await prisma.user.create({
    data: { fullName: "James Kim", email: "james@namo.dev", password: devHash, role: "developer", status: "active", initials: "JK", lastLogin: d(-1) },
  });
  const maria = await prisma.user.create({
    data: { fullName: "Maria Santos", email: "maria@namo.dev", password: devHash, role: "developer", status: "active", initials: "MS", lastLogin: d(-5) },
  });
  const lisa = await prisma.user.create({
    data: { fullName: "Lisa Tran", email: "lisa@namo.dev", password: devHash, role: "developer", status: "active", initials: "LT", lastLogin: d(-2) },
  });
  const david = await prisma.user.create({
    data: { fullName: "David Park", email: "david@namo.dev", password: devHash, role: "developer", status: "active", initials: "DP", lastLogin: d(-1) },
  });
  const sophie = await prisma.user.create({
    data: { fullName: "Sophie Brown", email: "sophie@namo.dev", password: devHash, role: "developer", status: "active", initials: "SB", lastLogin: d(-3) },
  });
  const tyler = await prisma.user.create({
    data: { fullName: "Tyler Wright", email: "tyler@namo.dev", password: devHash, role: "developer", status: "active", initials: "TW", lastLogin: d(-2) },
  });
  const aisha = await prisma.user.create({
    data: { fullName: "Aisha Okafor", email: "aisha@namo.dev", password: devHash, role: "developer", status: "active", initials: "AO", lastLogin: d(-1) },
  });
  const ben = await prisma.user.create({
    data: { fullName: "Ben Carter", email: "ben@namo.dev", password: devHash, role: "developer", status: "active", initials: "BC", lastLogin: d(-4) },
  });
  const zoe = await prisma.user.create({
    data: { fullName: "Zoe Adams", email: "zoe@namo.dev", password: devHash, role: "developer", status: "active", initials: "ZA", lastLogin: d(-3) },
  });

  // ─── Projects ─────────────────────────────────────────────────────────────
  const p1 = await prisma.project.create({
    data: {
      name: "Mobile App Launch Q3",
      description: "Launch the consumer-facing iOS and Android app by end of Q3. Includes onboarding, core features, push notifications, and App Store submission.",
      status: "ACTIVE",
      startDate: d(-42),
      endDate: d(28),
    },
  });

  const p2 = await prisma.project.create({
    data: {
      name: "Data Platform Migration",
      description: "Migrate legacy data warehouse from on-prem to AWS. Zero-downtime cutover required across 12 data sources.",
      status: "ACTIVE",
      startDate: d(-60),
      endDate: d(45),
    },
  });

  const p3 = await prisma.project.create({
    data: {
      name: "Internal Dashboard Redesign",
      description: "Modernize the internal analytics dashboard for the ops team. New design system, improved performance, and real-time data.",
      status: "ACTIVE",
      startDate: d(-20),
      endDate: d(40),
    },
  });

  // ─── Project Members ──────────────────────────────────────────────────────
  await prisma.projectMember.createMany({
    data: [
      // Project 1: Mobile App (Sarah manages, Alex+Nina senior, Emma+James+Maria+Lisa+David devs)
      { projectId: p1.id, userId: sarah.id },
      { projectId: p1.id, userId: alex.id },
      { projectId: p1.id, userId: nina.id },
      { projectId: p1.id, userId: emma.id },
      { projectId: p1.id, userId: james.id },
      { projectId: p1.id, userId: maria.id },
      { projectId: p1.id, userId: lisa.id },
      { projectId: p1.id, userId: david.id },
      // Project 2: Data Platform (Marcus manages, Carlos+Priya senior, Sophie+Tyler+Aisha devs)
      { projectId: p2.id, userId: marcus.id },
      { projectId: p2.id, userId: carlos.id },
      { projectId: p2.id, userId: priya.id },
      { projectId: p2.id, userId: sophie.id },
      { projectId: p2.id, userId: tyler.id },
      { projectId: p2.id, userId: aisha.id },
      // Project 3: Dashboard Redesign (Rachel manages, Jordan+Yuki senior, Emma+Ben+Zoe devs)
      { projectId: p3.id, userId: rachel.id },
      { projectId: p3.id, userId: jordan.id },
      { projectId: p3.id, userId: yuki.id },
      { projectId: p3.id, userId: emma.id },   // Emma is cross-project
      { projectId: p3.id, userId: ben.id },
      { projectId: p3.id, userId: zoe.id },
    ],
  });

  // ─── Project 1 Tasks ──────────────────────────────────────────────────────
  const t1 = await prisma.task.create({
    data: {
      projectId: p1.id,
      title: "Finalize product requirements",
      description: "Lock down PRD with all stakeholders, define scope, user stories, and acceptance criteria.",
      status: "DONE",
      priority: "HIGH",
      owner: alex.fullName,
      assignedToId: alex.id,
      estimatedHours: 16,
      actualHours: 18,
      reviewStatus: "APPROVED",
      workSummary: "PRD finalized with full stakeholder sign-off. Defined 24 user stories, 3 epics, and acceptance criteria for all core flows.",
      reviewedById: sarah.id,
      reviewedAt: d(-36),
      submittedForReviewAt: d(-37),
      startDate: d(-42),
      endDate: d(-35),
      completedAt: d(-36),
    },
  });

  const t2 = await prisma.task.create({
    data: {
      projectId: p1.id,
      title: "UI/UX design — onboarding flow",
      description: "Design all screens for user onboarding: welcome, signup, login, and tutorial.",
      status: "DONE",
      priority: "HIGH",
      owner: alex.fullName,
      assignedToId: alex.id,
      estimatedHours: 40,
      actualHours: 38,
      reviewStatus: "APPROVED",
      workSummary: "All 8 onboarding screens designed in Figma. Design tokens documented. Prototype approved in review session.",
      reviewedById: sarah.id,
      reviewedAt: d(-22),
      submittedForReviewAt: d(-23),
      startDate: d(-35),
      endDate: d(-21),
      completedAt: d(-22),
    },
  });

  const t3 = await prisma.task.create({
    data: {
      projectId: p1.id,
      title: "Backend API — auth & user management",
      description: "JWT auth, registration, profile endpoints, refresh tokens.",
      status: "DONE",
      priority: "CRITICAL",
      owner: nina.fullName,
      assignedToId: nina.id,
      estimatedHours: 32,
      actualHours: 30,
      reviewStatus: "APPROVED",
      workSummary: "Auth endpoints complete. JWT + refresh flow tested. All 18 unit tests passing. Rate limiting added.",
      reviewedById: alex.id,
      reviewedAt: d(-14),
      submittedForReviewAt: d(-15),
      startDate: d(-35),
      endDate: d(-14),
      completedAt: d(-14),
    },
  });

  const t4 = await prisma.task.create({
    data: {
      projectId: p1.id,
      title: "Implement onboarding screens (iOS)",
      description: "Build onboarding flow in SwiftUI per approved Figma designs.",
      status: "IN_REVIEW",
      priority: "HIGH",
      owner: james.fullName,
      assignedToId: james.id,
      estimatedHours: 24,
      actualHours: 22,
      reviewStatus: "PENDING",
      workSummary: "All 8 onboarding screens implemented in SwiftUI. Animations match spec. 100% unit test coverage on view models. Tested on iPhone 14/15 Pro.",
      submittedForReviewAt: d(-1),
      startDate: d(-21),
      endDate: d(-5),
    },
  });

  const t5 = await prisma.task.create({
    data: {
      projectId: p1.id,
      title: "Implement onboarding screens (Android)",
      description: "Mirror iOS onboarding in Kotlin / Jetpack Compose.",
      status: "BLOCKED",
      priority: "HIGH",
      owner: maria.fullName,
      assignedToId: maria.id,
      estimatedHours: 24,
      startDate: d(-14),
      endDate: d(-2),
    },
  });

  const t6 = await prisma.task.create({
    data: {
      projectId: p1.id,
      title: "Core feature: Home feed",
      description: "Build and wire up main content feed with pagination and pull-to-refresh.",
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      owner: emma.fullName,
      assignedToId: emma.id,
      estimatedHours: 40,
      startDate: d(-10),
      endDate: d(5),
    },
  });

  const t7 = await prisma.task.create({
    data: {
      projectId: p1.id,
      title: "Performance optimization",
      description: "Profile and fix performance regressions on both platforms.",
      status: "IN_PROGRESS",
      priority: "LOW",
      owner: david.fullName,
      assignedToId: david.id,
      estimatedHours: 20,
      reviewStatus: "REJECTED",
      rejectionReason: "Profiling was incomplete — only iOS paths were covered. Android cold start is still 4.2s. Please re-profile both platforms before resubmitting.",
      startDate: d(-7),
      endDate: d(3),
    },
  });

  const t8 = await prisma.task.create({
    data: {
      projectId: p1.id,
      title: "Core feature: Push notifications",
      description: "Integrate push notification service (APNs + FCM).",
      status: "TODO",
      priority: "MEDIUM",
      owner: emma.fullName,
      assignedToId: emma.id,
      estimatedHours: 16,
      startDate: d(0),
      endDate: d(10),
    },
  });

  const t9 = await prisma.task.create({
    data: {
      projectId: p1.id,
      title: "QA — regression testing",
      description: "Full regression test pass on iOS and Android builds.",
      status: "TODO",
      priority: "HIGH",
      owner: lisa.fullName,
      assignedToId: lisa.id,
      estimatedHours: 32,
      startDate: d(5),
      endDate: d(15),
    },
  });

  const t10 = await prisma.task.create({
    data: {
      projectId: p1.id,
      title: "App Store submission (iOS)",
      description: "Prepare screenshots, app description, and submit for Apple review.",
      status: "TODO",
      priority: "HIGH",
      owner: alex.fullName,
      assignedToId: alex.id,
      estimatedHours: 8,
      startDate: d(15),
      endDate: d(20),
    },
  });

  const t11 = await prisma.task.create({
    data: {
      projectId: p1.id,
      title: "Google Play submission (Android)",
      description: "Prepare store listing and submit for Google Play review.",
      status: "TODO",
      priority: "HIGH",
      owner: alex.fullName,
      assignedToId: alex.id,
      estimatedHours: 8,
      startDate: d(15),
      endDate: d(20),
    },
  });

  const t12 = await prisma.task.create({
    data: {
      projectId: p1.id,
      title: "Beta launch to 100 users",
      description: "Soft launch with beta cohort, collect feedback, monitor crash rates.",
      status: "TODO",
      priority: "MEDIUM",
      owner: david.fullName,
      assignedToId: david.id,
      estimatedHours: 16,
      startDate: d(20),
      endDate: d(25),
    },
  });

  // ─── Project 2 Tasks ──────────────────────────────────────────────────────
  const dp1 = await prisma.task.create({
    data: {
      projectId: p2.id,
      title: "Audit current data warehouse",
      description: "Document all 12 data sources, schemas, volumes, and dependencies.",
      status: "DONE",
      priority: "HIGH",
      owner: carlos.fullName,
      assignedToId: carlos.id,
      estimatedHours: 24,
      actualHours: 26,
      reviewStatus: "APPROVED",
      workSummary: "Full audit of 12 data sources complete. Schema docs, row counts, and data quality report delivered. 3 critical migration blockers identified.",
      reviewedById: marcus.id,
      reviewedAt: d(-51),
      submittedForReviewAt: d(-53),
      startDate: d(-60),
      endDate: d(-50),
      completedAt: d(-51),
    },
  });

  const dp2 = await prisma.task.create({
    data: {
      projectId: p2.id,
      title: "Select cloud provider and architecture",
      description: "Evaluate AWS vs GCP vs Azure. Produce architecture decision record.",
      status: "DONE",
      priority: "CRITICAL",
      owner: carlos.fullName,
      assignedToId: carlos.id,
      estimatedHours: 16,
      actualHours: 16,
      reviewStatus: "APPROVED",
      workSummary: "AWS selected. Architecture diagram complete. Cost estimate for 12 months approved by finance. ADR signed off.",
      reviewedById: marcus.id,
      reviewedAt: d(-39),
      submittedForReviewAt: d(-40),
      startDate: d(-50),
      endDate: d(-40),
      completedAt: d(-39),
    },
  });

  const dp3 = await prisma.task.create({
    data: {
      projectId: p2.id,
      title: "Set up cloud environment and IAM",
      description: "Provision VPC, subnets, S3 buckets, RDS, and IAM roles.",
      status: "DONE",
      priority: "HIGH",
      owner: priya.fullName,
      assignedToId: priya.id,
      estimatedHours: 20,
      actualHours: 22,
      reviewStatus: "APPROVED",
      workSummary: "VPC, subnets, IAM roles, S3 buckets, and RDS instance created. Team access verified. Terraform state committed.",
      reviewedById: carlos.id,
      reviewedAt: d(-29),
      submittedForReviewAt: d(-30),
      startDate: d(-40),
      endDate: d(-30),
      completedAt: d(-29),
    },
  });

  const dp4 = await prisma.task.create({
    data: {
      projectId: p2.id,
      title: "ETL pipeline — batch ingest",
      description: "Build Glue ETL pipelines for all 12 batch data sources.",
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      owner: aisha.fullName,
      assignedToId: aisha.id,
      estimatedHours: 60,
      startDate: d(-30),
      endDate: d(-8),   // overdue — still in progress
    },
  });

  const dp5 = await prisma.task.create({
    data: {
      projectId: p2.id,
      title: "ETL pipeline — streaming ingest",
      description: "Build Kinesis streaming pipeline for real-time data sources.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      owner: tyler.fullName,
      assignedToId: tyler.id,
      estimatedHours: 40,
      startDate: d(-20),
      endDate: d(5),
    },
  });

  const dp6 = await prisma.task.create({
    data: {
      projectId: p2.id,
      title: "Data validation and reconciliation",
      description: "Row-count and checksum validation across all migrated data.",
      status: "TODO",
      priority: "HIGH",
      owner: sophie.fullName,
      assignedToId: sophie.id,
      estimatedHours: 24,
      startDate: d(5),
      endDate: d(18),
    },
  });

  const dp7 = await prisma.task.create({
    data: {
      projectId: p2.id,
      title: "Monitoring and alerting setup",
      description: "Configure CloudWatch dashboards, alarms, and PagerDuty integration.",
      status: "TODO",
      priority: "MEDIUM",
      owner: sophie.fullName,
      assignedToId: sophie.id,
      estimatedHours: 16,
      startDate: d(-5),
      endDate: d(10),
    },
  });

  const dp8 = await prisma.task.create({
    data: {
      projectId: p2.id,
      title: "Security audit and compliance check",
      description: "Internal security review and GDPR/SOC2 compliance checklist.",
      status: "TODO",
      priority: "HIGH",
      owner: priya.fullName,
      assignedToId: priya.id,
      estimatedHours: 24,
      startDate: d(10),
      endDate: d(20),
    },
  });

  const dp9 = await prisma.task.create({
    data: {
      projectId: p2.id,
      title: "Cutover rehearsal (dry run)",
      description: "Full production cutover rehearsal with rollback test.",
      status: "TODO",
      priority: "CRITICAL",
      owner: carlos.fullName,
      assignedToId: carlos.id,
      estimatedHours: 16,
      startDate: d(18),
      endDate: d(25),
    },
  });

  const dp10 = await prisma.task.create({
    data: {
      projectId: p2.id,
      title: "Production cutover",
      description: "Execute zero-downtime cutover to cloud data platform.",
      status: "TODO",
      priority: "CRITICAL",
      owner: carlos.fullName,
      assignedToId: carlos.id,
      estimatedHours: 8,
      startDate: d(30),
      endDate: d(35),
    },
  });

  // ─── Project 3 Tasks ──────────────────────────────────────────────────────
  const p3t1 = await prisma.task.create({
    data: {
      projectId: p3.id,
      title: "Stakeholder interviews and requirements",
      description: "Interview ops team stakeholders, document must-have features and pain points.",
      status: "DONE",
      priority: "HIGH",
      owner: jordan.fullName,
      assignedToId: jordan.id,
      estimatedHours: 12,
      actualHours: 14,
      reviewStatus: "APPROVED",
      workSummary: "Interviewed 8 stakeholders across 3 departments. Requirements doc complete. 3 critical features, 5 nice-to-haves identified.",
      reviewedById: rachel.id,
      reviewedAt: d(-14),
      submittedForReviewAt: d(-15),
      startDate: d(-20),
      endDate: d(-14),
      completedAt: d(-14),
    },
  });

  const p3t2 = await prisma.task.create({
    data: {
      projectId: p3.id,
      title: "Wireframes and design system setup",
      description: "Design all dashboard wireframes and establish design tokens in Figma.",
      status: "IN_REVIEW",
      priority: "HIGH",
      owner: yuki.fullName,
      assignedToId: yuki.id,
      estimatedHours: 32,
      actualHours: 36,
      reviewStatus: "PENDING",
      workSummary: "All dashboard wireframes complete (12 views). Design tokens, spacing system, and color palette established in Figma. Component inventory documented.",
      submittedForReviewAt: d(-1),
      startDate: d(-14),
      endDate: d(-3),
    },
  });

  const p3t3 = await prisma.task.create({
    data: {
      projectId: p3.id,
      title: "Component library build",
      description: "Build reusable React component library based on the approved design system.",
      status: "TODO",
      priority: "MEDIUM",
      owner: zoe.fullName,
      assignedToId: zoe.id,
      estimatedHours: 40,
      startDate: d(2),
      endDate: d(12),
    },
  });

  const p3t4 = await prisma.task.create({
    data: {
      projectId: p3.id,
      title: "Dashboard views implementation",
      description: "Implement all 12 dashboard views using the component library.",
      status: "TODO",
      priority: "HIGH",
      owner: ben.fullName,
      assignedToId: ben.id,
      estimatedHours: 48,
      startDate: d(12),
      endDate: d(28),
    },
  });

  const p3t5 = await prisma.task.create({
    data: {
      projectId: p3.id,
      title: "API integration layer",
      description: "Connect dashboard views to backend APIs. Implement data fetching, caching, and error states.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      owner: emma.fullName,
      assignedToId: emma.id,
      estimatedHours: 24,
      startDate: d(-5),
      endDate: d(8),
    },
  });

  const p3t6 = await prisma.task.create({
    data: {
      projectId: p3.id,
      title: "Performance profiling and optimization",
      description: "Profile dashboard load times, optimize bundle size and query performance.",
      status: "TODO",
      priority: "MEDIUM",
      owner: yuki.fullName,
      assignedToId: yuki.id,
      estimatedHours: 16,
      startDate: d(28),
      endDate: d(35),
    },
  });

  const p3t7 = await prisma.task.create({
    data: {
      projectId: p3.id,
      title: "User acceptance testing",
      description: "UAT sessions with ops team stakeholders. Collect feedback and sign-off.",
      status: "TODO",
      priority: "MEDIUM",
      owner: zoe.fullName,
      assignedToId: zoe.id,
      estimatedHours: 24,
      startDate: d(28),
      endDate: d(38),
    },
  });

  const p3t8 = await prisma.task.create({
    data: {
      projectId: p3.id,
      title: "Documentation and handoff",
      description: "Write end-user documentation and conduct knowledge transfer to ops team.",
      status: "TODO",
      priority: "LOW",
      owner: jordan.fullName,
      assignedToId: jordan.id,
      estimatedHours: 8,
      startDate: d(35),
      endDate: d(40),
    },
  });

  // ─── Task Dependencies ────────────────────────────────────────────────────
  await prisma.taskDependency.createMany({
    data: [
      // Project 1
      { dependentId: t2.id, dependencyId: t1.id },   // Design after PRD
      { dependentId: t3.id, dependencyId: t1.id },   // Backend after PRD
      { dependentId: t4.id, dependencyId: t2.id },   // iOS after design
      { dependentId: t4.id, dependencyId: t3.id },   // iOS after backend
      { dependentId: t5.id, dependencyId: t2.id },   // Android after design
      { dependentId: t5.id, dependencyId: t3.id },   // Android after backend
      { dependentId: t6.id, dependencyId: t3.id },   // Home feed after backend
      { dependentId: t8.id, dependencyId: t6.id },   // Push notif after home feed
      { dependentId: t9.id, dependencyId: t4.id },   // QA after iOS
      { dependentId: t9.id, dependencyId: t5.id },   // QA after Android
      { dependentId: t9.id, dependencyId: t6.id },   // QA after home feed
      { dependentId: t9.id, dependencyId: t8.id },   // QA after push notif
      { dependentId: t10.id, dependencyId: t9.id },  // App Store after QA
      { dependentId: t11.id, dependencyId: t9.id },  // Play Store after QA
      { dependentId: t12.id, dependencyId: t10.id }, // Beta after App Store
      { dependentId: t12.id, dependencyId: t11.id }, // Beta after Play Store
      // Project 2
      { dependentId: dp2.id, dependencyId: dp1.id },
      { dependentId: dp3.id, dependencyId: dp2.id },
      { dependentId: dp4.id, dependencyId: dp3.id },
      { dependentId: dp5.id, dependencyId: dp3.id },
      { dependentId: dp6.id, dependencyId: dp4.id },
      { dependentId: dp6.id, dependencyId: dp5.id },
      { dependentId: dp7.id, dependencyId: dp3.id },
      { dependentId: dp8.id, dependencyId: dp3.id },
      { dependentId: dp9.id, dependencyId: dp6.id },
      { dependentId: dp10.id, dependencyId: dp9.id },
      { dependentId: dp10.id, dependencyId: dp8.id },
      // Project 3
      { dependentId: p3t2.id, dependencyId: p3t1.id },
      { dependentId: p3t3.id, dependencyId: p3t2.id },
      { dependentId: p3t4.id, dependencyId: p3t3.id },
      { dependentId: p3t5.id, dependencyId: p3t1.id },
      { dependentId: p3t6.id, dependencyId: p3t4.id },
      { dependentId: p3t6.id, dependencyId: p3t5.id },
      { dependentId: p3t7.id, dependencyId: p3t4.id },
      { dependentId: p3t7.id, dependencyId: p3t5.id },
      { dependentId: p3t8.id, dependencyId: p3t7.id },
      { dependentId: p3t8.id, dependencyId: p3t6.id },
    ],
  });

  // ─── Task Activities ──────────────────────────────────────────────────────
  await prisma.taskActivity.createMany({
    data: [
      // t1 — PRD: Alex submitted, Sarah approved
      { taskId: t1.id, userId: alex.id, userFullName: alex.fullName, action: "submitted_for_review", details: "Submitted PRD for manager review.", createdAt: d(-37) },
      { taskId: t1.id, userId: sarah.id, userFullName: sarah.fullName, action: "approved", details: "PRD approved. All stakeholders signed off.", createdAt: d(-36) },
      // t2 — UI/UX: Alex submitted, Sarah approved
      { taskId: t2.id, userId: alex.id, userFullName: alex.fullName, action: "submitted_for_review", details: "Onboarding designs ready for review.", createdAt: d(-23) },
      { taskId: t2.id, userId: sarah.id, userFullName: sarah.fullName, action: "approved", details: "Designs approved. Moving to implementation.", createdAt: d(-22) },
      // t3 — Backend: Nina submitted, Alex approved
      { taskId: t3.id, userId: nina.id, userFullName: nina.fullName, action: "submitted_for_review", details: "Auth API complete and tested.", createdAt: d(-15) },
      { taskId: t3.id, userId: alex.id, userFullName: alex.fullName, action: "approved", details: "Code review passed. All tests green.", createdAt: d(-14) },
      // t4 — iOS: James submitted (pending)
      { taskId: t4.id, userId: james.id, userFullName: james.fullName, action: "submitted_for_review", details: "iOS onboarding screens complete. Ready for senior dev review.", createdAt: d(-1) },
      // t7 — Performance opt: David submitted, Alex rejected
      { taskId: t7.id, userId: david.id, userFullName: david.fullName, action: "submitted_for_review", details: "Initial optimization pass complete.", createdAt: d(-5) },
      { taskId: t7.id, userId: alex.id, userFullName: alex.fullName, action: "rejected", details: "Only iOS profiled. Android cold start still 4.2s. Re-profile both platforms.", createdAt: d(-4) },
      // dp1 — Data audit: Carlos submitted, Marcus approved
      { taskId: dp1.id, userId: carlos.id, userFullName: carlos.fullName, action: "submitted_for_review", details: "Data warehouse audit complete.", createdAt: d(-53) },
      { taskId: dp1.id, userId: marcus.id, userFullName: marcus.fullName, action: "approved", details: "Audit report accepted. Proceeding to architecture selection.", createdAt: d(-51) },
      // dp2 — Cloud selection: Carlos submitted, Marcus approved
      { taskId: dp2.id, userId: carlos.id, userFullName: carlos.fullName, action: "submitted_for_review", details: "ADR complete. AWS recommended.", createdAt: d(-40) },
      { taskId: dp2.id, userId: marcus.id, userFullName: marcus.fullName, action: "approved", details: "AWS approved. Budget signed off.", createdAt: d(-39) },
      // dp3 — Cloud setup: Priya submitted, Carlos approved
      { taskId: dp3.id, userId: priya.id, userFullName: priya.fullName, action: "submitted_for_review", details: "Cloud environment provisioned and verified.", createdAt: d(-30) },
      { taskId: dp3.id, userId: carlos.id, userFullName: carlos.fullName, action: "approved", details: "Environment looks good. All access checks passed.", createdAt: d(-29) },
      // p3t1 — Interviews: Jordan submitted, Rachel approved
      { taskId: p3t1.id, userId: jordan.id, userFullName: jordan.fullName, action: "submitted_for_review", details: "Requirements doc complete with stakeholder input.", createdAt: d(-15) },
      { taskId: p3t1.id, userId: rachel.id, userFullName: rachel.fullName, action: "approved", details: "Requirements approved. Starting wireframes.", createdAt: d(-14) },
      // p3t2 — Wireframes: Yuki submitted (pending)
      { taskId: p3t2.id, userId: yuki.id, userFullName: yuki.fullName, action: "submitted_for_review", details: "All wireframes and design tokens submitted for review.", createdAt: d(-1) },
    ],
  });

  // ─── Risks ────────────────────────────────────────────────────────────────
  await prisma.risk.createMany({
    data: [
      // Project 1
      {
        projectId: p1.id, title: "App Store review rejection",
        description: "Apple may reject the app for guideline violations, causing 1–2 week delay.",
        probability: "MEDIUM", impact: "HIGH",
        mitigation: "Pre-review checklist against Apple guidelines. Allocate 2-week buffer in timeline.",
        status: "OPEN",
      },
      {
        projectId: p1.id, title: "Android onboarding blocked — resource bottleneck",
        description: "Maria is the only Android developer and is currently blocked waiting on design asset exports from iOS build.",
        probability: "HIGH", impact: "HIGH",
        mitigation: "Unblock immediately by exporting assets today. Consider contracting a second Android dev if delay exceeds 3 days.",
        status: "MITIGATING",
      },
      {
        projectId: p1.id, title: "Push notification service instability",
        description: "Third-party push provider (FCM) had 3 outages last quarter.",
        probability: "LOW", impact: "MEDIUM",
        mitigation: "Add retry logic and exponential backoff. Fallback to in-app notification badge.",
        status: "OPEN",
      },
      // Project 2
      {
        projectId: p2.id, title: "Data loss during ETL migration",
        description: "Incorrect ETL transformation could corrupt or silently drop rows across 12 data sources.",
        probability: "MEDIUM", impact: "HIGH",
        mitigation: "Row-count and checksum validation at every stage. Maintain warm standby for 72h post-cutover.",
        status: "MITIGATING",
      },
      {
        projectId: p2.id, title: "ETL pipeline overrunning deadline",
        description: "Batch ETL pipeline is already 8 days past its planned completion date due to 3 complex data sources.",
        probability: "HIGH", impact: "HIGH",
        mitigation: "Prioritize remaining 3 sources. Request temporary contractor to parallel-process. Update cutover date if needed.",
        status: "OPEN",
      },
      {
        projectId: p2.id, title: "Regulatory compliance gap",
        description: "GDPR data residency requirements may conflict with chosen AWS region configuration.",
        probability: "LOW", impact: "HIGH",
        mitigation: "Schedule compliance review with legal team before cutover rehearsal.",
        status: "OPEN",
      },
      // Project 3
      {
        projectId: p3.id, title: "Design approval delays from stakeholders",
        description: "Ops team stakeholders are historically slow to review designs, risking waterfall delay.",
        probability: "MEDIUM", impact: "MEDIUM",
        mitigation: "Schedule weekly design review sessions. Get incremental sign-off per component, not all at once.",
        status: "MITIGATING",
      },
      {
        projectId: p3.id, title: "Scope creep from stakeholder feedback",
        description: "UAT phase may surface significant change requests that expand scope beyond budget.",
        probability: "HIGH", impact: "MEDIUM",
        mitigation: "Document explicit change request process. All post-approval changes require manager sign-off.",
        status: "OPEN",
      },
    ],
  });

  // ─── Escalations ─────────────────────────────────────────────────────────
  await prisma.escalation.createMany({
    data: [
      // P1: Maria escalated Android blockage → open, to senior dev
      {
        projectId: p1.id,
        taskId: t5.id,
        createdById: maria.id,
        message: "Android onboarding is blocked. I'm waiting on the design asset exports that were supposed to come from the iOS build team. I've pinged James twice with no response. This is now 3 days overdue and threatens the whole mobile timeline.",
        status: "OPEN",
        targetRole: "senior_developer",
      },
      // P1: James escalated iOS deadline slip → responded by Sarah
      {
        projectId: p1.id,
        taskId: t4.id,
        createdById: james.id,
        message: "The iOS onboarding task is past its original deadline. I've submitted it for review but haven't received feedback. The Android team is blocked on my sign-off. Can we expedite the review?",
        status: "RESPONDED",
        targetRole: "manager",
        response: "Thanks for flagging. I've asked Alex to prioritize this review today. We'll adjust the timeline by 3 days — it won't impact the App Store submission date.",
        respondedById: sarah.id,
        respondedAt: d(-1),
      },
      // P2: Aisha escalated ETL overrun → open, to manager
      {
        projectId: p2.id,
        taskId: dp4.id,
        createdById: aisha.id,
        message: "The batch ETL pipeline is running significantly over estimate. Three data sources have non-standard schemas that require custom transform logic. I've spent 2 extra days on just these 3 sources and still have 2 to go. The deadline was 8 days ago — need guidance on whether to scope-cut or get additional help.",
        status: "OPEN",
        targetRole: "manager",
      },
      // P2: Sophie general architecture question → resolved by Carlos
      {
        projectId: p2.id,
        taskId: null,
        createdById: sophie.id,
        message: "Need architecture guidance on the data validation approach for reconciliation. Should we use schema-first validation or run statistical checks first? The approach affects the entire validation layer design.",
        status: "RESOLVED",
        targetRole: "senior_developer",
        response: "Use schema-first validation — it catches structural issues before we waste compute on stats. I'll set up a 30-min pairing session tomorrow at 2pm. I'll also update the ADR.",
        respondedById: carlos.id,
        respondedAt: d(-10),
      },
      // P3: Yuki escalated wireframe review delay → open, to manager
      {
        projectId: p3.id,
        taskId: p3t2.id,
        createdById: yuki.id,
        message: "Wireframe review has been pending for 2 days. Zoe cannot start the component library until this is approved — every day of delay pushes the entire delivery timeline. Can we schedule an emergency review session today?",
        status: "OPEN",
        targetRole: "manager",
      },
      // P3: Ben escalated unclear spec → responded by Jordan
      {
        projectId: p3.id,
        taskId: p3t4.id,
        createdById: ben.id,
        message: "The dashboard views implementation spec is ambiguous about real-time update requirements. Are we polling, using WebSockets, or SSE? This decision affects the entire data fetching architecture I need to build.",
        status: "RESPONDED",
        targetRole: "senior_developer",
        response: "No real-time for MVP — polling every 30 seconds is the agreed approach. WebSockets are Phase 2. I'll update the spec today so it's unambiguous. Use React Query with a 30s refetchInterval.",
        respondedById: jordan.id,
        respondedAt: d(-5),
      },
    ],
  });

  // ─── Availability ─────────────────────────────────────────────────────────
  await prisma.availability.createMany({
    data: [
      // Company holidays (null userId)
      { userId: null, startDate: ds(0), endDate: ds(0), type: "holiday", note: "Memorial Day — company closed", approved: true },
      { userId: null, startDate: "2026-07-04", endDate: "2026-07-04", type: "holiday", note: "Independence Day — company closed", approved: true },
      { userId: null, startDate: "2026-12-25", endDate: "2026-12-26", type: "holiday", note: "Christmas — company closed", approved: true },
      // Approved vacation
      { userId: alex.id, startDate: ds(21), endDate: ds(25), type: "vacation", note: "Summer break", approved: true },
      { userId: carlos.id, startDate: ds(30), endDate: ds(34), type: "vacation", note: "Family trip", approved: true },
      // Pending vacation requests
      { userId: emma.id, startDate: ds(7), endDate: ds(11), type: "vacation", note: "Holiday booking — please approve", approved: false },
      { userId: tyler.id, startDate: ds(14), endDate: ds(18), type: "vacation", note: "Conference + PTO", approved: false },
      // Sick leave (auto-approved)
      { userId: maria.id, startDate: ds(-5), endDate: ds(-5), type: "sick", note: "Unwell", approved: true },
      { userId: lisa.id, startDate: ds(-2), endDate: ds(-2), type: "sick", approved: true },
      // WFH (auto-approved)
      { userId: james.id, startDate: ds(0), endDate: ds(0), type: "wfh", approved: true },
      { userId: sophie.id, startDate: ds(0), endDate: ds(0), type: "wfh", note: "Home office day", approved: true },
      { userId: zoe.id, startDate: ds(2), endDate: ds(2), type: "wfh", approved: true },
      { userId: nina.id, startDate: ds(3), endDate: ds(3), type: "wfh", approved: true },
      // Partial day
      { userId: david.id, startDate: ds(1), endDate: ds(1), type: "partial", note: "Doctor appointment — back by noon", approved: true },
      { userId: ben.id, startDate: ds(4), endDate: ds(4), type: "partial", note: "Morning only", approved: true },
    ],
  });

  // ─── Meetings ─────────────────────────────────────────────────────────────
  // meetingType: "team" (full project team) | "individual" (1-on-1 with participantId)
  await prisma.meeting.createMany({
    data: [
      {
        title: "Mobile App Sprint Review",
        projectId: p1.id,
        meetingType: "team",
        roomName: "namo-sprint-review-a3f9k2",
        scheduledAt: dt(1, 14),
        createdById: sarah.id,
        status: "scheduled",
      },
      {
        title: "iOS Review — Onboarding Screens",
        projectId: p1.id,
        meetingType: "team",
        roomName: "namo-ios-review-b7m4x1",
        scheduledAt: dt(0, 11),
        createdById: alex.id,
        status: "scheduled",
      },
      {
        // 1-on-1: Sarah checks in with Alex on the blocked Android task
        title: "1-on-1 with Alex Rivera",
        projectId: p1.id,
        meetingType: "individual",
        participantId: alex.id,
        roomName: "namo-1on1-sarah-alex-h2j5n9",
        scheduledAt: dt(0, 16),
        createdById: sarah.id,
        status: "scheduled",
      },
      {
        title: "ETL Pipeline Retrospective",
        projectId: p2.id,
        meetingType: "team",
        roomName: "namo-etl-retro-c8p2z5",
        scheduledAt: null,
        createdById: carlos.id,
        status: "ended",
      },
      {
        title: "Data Migration Daily Standup",
        projectId: p2.id,
        meetingType: "team",
        roomName: "namo-data-standup-d5w3y6",
        scheduledAt: dt(1, 9),
        createdById: marcus.id,
        status: "scheduled",
      },
      {
        // 1-on-1: Marcus follows up with Sophie on overdue ETL work
        title: "1-on-1 with Sophie Brown",
        projectId: p2.id,
        meetingType: "individual",
        participantId: sophie.id,
        roomName: "namo-1on1-marcus-sophie-k7r3m1",
        scheduledAt: dt(1, 11),
        createdById: marcus.id,
        status: "scheduled",
      },
      {
        title: "Dashboard Design Review",
        projectId: p3.id,
        meetingType: "team",
        roomName: "namo-design-review-e1n8q4",
        scheduledAt: dt(0, 15),
        createdById: rachel.id,
        status: "scheduled",
      },
      {
        title: "Quick Sync — Android Blocker",
        projectId: p1.id,
        meetingType: "team",
        roomName: "namo-android-sync-g9k3v7",
        scheduledAt: null,
        createdById: maria.id,
        status: "ended",
      },
    ],
  });

  // ─── Project Chat Messages ────────────────────────────────────────────────
  // These are seeded after tasks/users are created so we have valid IDs
  await prisma.projectMessage.createMany({
    data: [
      // Project 1 — Mobile App Launch chat
      {
        projectId: p1.id,
        userId: sarah.id, userFullName: sarah.fullName, userRole: sarah.role, userInitials: sarah.initials,
        body: "Team, iOS review is first priority this week. Alex please wrap up the onboarding screens review by EOD today.",
        createdAt: dt(-2, 9),
      },
      {
        projectId: p1.id,
        userId: alex.id, userFullName: alex.fullName, userRole: alex.role, userInitials: alex.initials,
        body: "On it. I've already left comments in the PR. James, let's sync at 11am to go through the feedback together.",
        createdAt: dt(-2, 9),
      },
      {
        projectId: p1.id,
        userId: james.id, userFullName: james.fullName, userRole: james.role, userInitials: james.initials,
        body: "Works for me. I'll have the revised screens ready by then.",
        createdAt: dt(-2, 10),
      },
      {
        projectId: p1.id,
        userId: maria.id, userFullName: maria.fullName, userRole: maria.role, userInitials: maria.initials,
        body: "Any update on the design assets? I'm still blocked on the Android onboarding screens.",
        createdAt: dt(-1, 14),
      },
      {
        projectId: p1.id,
        userId: sarah.id, userFullName: sarah.fullName, userRole: sarah.role, userInitials: sarah.initials,
        body: "Maria — asset exports are going out today. Alex is packaging them now. You should have them by 3pm.",
        createdAt: dt(-1, 14),
      },
      // Project 2 — Data Platform Migration chat
      {
        projectId: p2.id,
        userId: marcus.id, userFullName: marcus.fullName, userRole: marcus.role, userInitials: marcus.initials,
        body: "Daily standup reminder: ETL status, blockers, ETA update. Aisha, Tyler — please give a quick status on your pipelines.",
        createdAt: dt(-3, 8),
      },
      {
        projectId: p2.id,
        userId: aisha.id, userFullName: aisha.fullName, userRole: aisha.role, userInitials: aisha.initials,
        body: "Batch ETL: 9 of 12 sources done. The last 3 have non-standard schemas. I'm building custom transforms. Estimate 2 more days.",
        createdAt: dt(-3, 8),
      },
      {
        projectId: p2.id,
        userId: tyler.id, userFullName: tyler.fullName, userRole: tyler.role, userInitials: tyler.initials,
        body: "Streaming pipeline: Kinesis consumers working. Working on the dead-letter queue and retry logic. On track for Friday.",
        createdAt: dt(-3, 8),
      },
      {
        projectId: p2.id,
        userId: carlos.id, userFullName: carlos.fullName, userRole: carlos.role, userInitials: carlos.initials,
        body: "Aisha, I'll pair with you on those 3 tricky sources this afternoon. I've seen this schema pattern before — should be solvable in a few hours.",
        createdAt: dt(-3, 9),
      },
      {
        projectId: p2.id,
        userId: aisha.id, userFullName: aisha.fullName, userRole: aisha.role, userInitials: aisha.initials,
        body: "That would be great, Carlos. Calendar invite sent for 2pm.",
        createdAt: dt(-3, 9),
      },
      // Project 3 — Dashboard Redesign chat
      {
        projectId: p3.id,
        userId: rachel.id, userFullName: rachel.fullName, userRole: rachel.role, userInitials: rachel.initials,
        body: "Wireframe review session is TODAY at 3pm. Everyone please join the Dashboard Design Review meeting. Yuki will walk us through the updated flows.",
        createdAt: dt(0, 9),
      },
      {
        projectId: p3.id,
        userId: yuki.id, userFullName: yuki.fullName, userRole: yuki.role, userInitials: yuki.initials,
        body: "I've exported the Figma frames to PDF. Sharing the link in Slack. Main changes: simplified nav, data-dense table view, and a new metrics sidebar.",
        createdAt: dt(0, 10),
      },
      {
        projectId: p3.id,
        userId: jordan.id, userFullName: jordan.fullName, userRole: jordan.role, userInitials: jordan.initials,
        body: "Looks great. The metrics sidebar is much cleaner than what we had before. One question — is the table view sortable or is that Phase 2?",
        createdAt: dt(0, 10),
      },
      {
        projectId: p3.id,
        userId: yuki.id, userFullName: yuki.fullName, userRole: yuki.role, userInitials: yuki.initials,
        body: "Sort by column is in scope for Phase 1. Search + filter is Phase 2.",
        createdAt: dt(0, 11),
      },
    ],
  });

  // ─── Task Comments ────────────────────────────────────────────────────────
  await prisma.taskComment.createMany({
    data: [
      // iOS onboarding task (t4) — James + Alex thread
      {
        taskId: t4.id,
        userId: alex.id, userFullName: alex.fullName, userRole: alex.role, userInitials: alex.initials,
        body: "James, I've reviewed the screens. Main feedback: the permission prompt for notifications fires too early. Move it after the first value moment (after user completes step 3).",
        createdAt: dt(-1, 11),
      },
      {
        taskId: t4.id,
        userId: james.id, userFullName: james.fullName, userRole: james.role, userInitials: james.initials,
        body: "Makes sense. I'll also fix the back button animation on step 2 — it currently slides in the wrong direction. Will have a new build by 4pm.",
        createdAt: dt(-1, 11),
      },
      {
        taskId: t4.id,
        userId: alex.id, userFullName: alex.fullName, userRole: alex.role, userInitials: alex.initials,
        body: "Perfect. Also cc Sarah on the build so she can sign off on the permission prompt placement.",
        createdAt: dt(-1, 12),
      },
      // Android onboarding (t5) — Maria + Alex
      {
        taskId: t5.id,
        userId: maria.id, userFullName: maria.fullName, userRole: maria.role, userInitials: maria.initials,
        body: "Alex — I'm still waiting on the asset exports from iOS. Can you get me the PNG exports at 3x for the welcome illustrations?",
        createdAt: dt(-2, 10),
      },
      {
        taskId: t5.id,
        userId: alex.id, userFullName: alex.fullName, userRole: alex.role, userInitials: alex.initials,
        body: "Packaging them now. Will drop a link in Slack by 3pm today.",
        createdAt: dt(-2, 14),
      },
      // ETL batch pipeline (dp4) — Aisha + Carlos
      {
        taskId: dp4.id,
        userId: aisha.id, userFullName: aisha.fullName, userRole: aisha.role, userInitials: aisha.initials,
        body: "Carlos — the legacy CRM export uses a non-standard date format (MM/DD/YY with no century). Any existing parser I can reuse?",
        createdAt: dt(-3, 16),
      },
      {
        taskId: dp4.id,
        userId: carlos.id, userFullName: carlos.fullName, userRole: carlos.role, userInitials: carlos.initials,
        body: "Yes — check `lib/legacy_parsers/crm_date.py`. I wrote it for the 2024 migration. It handles both 2-digit and 4-digit year formats.",
        createdAt: dt(-3, 17),
      },
      {
        taskId: dp4.id,
        userId: aisha.id, userFullName: aisha.fullName, userRole: aisha.role, userInitials: aisha.initials,
        body: "Perfect, exactly what I needed. That saved me an hour. Thanks!",
        createdAt: dt(-3, 17),
      },
      // Wireframes task (p3t2) — Yuki + Rachel
      {
        taskId: p3t2.id,
        userId: rachel.id, userFullName: rachel.fullName, userRole: rachel.role, userInitials: rachel.initials,
        body: "Yuki, the wireframes look great overall. Can you add a loading skeleton state for the data tables? The ops team specifically asked for that.",
        createdAt: dt(-1, 16),
      },
      {
        taskId: p3t2.id,
        userId: yuki.id, userFullName: yuki.fullName, userRole: yuki.role, userInitials: yuki.initials,
        body: "Will do — skeleton states for all table and chart components. I'll have an updated version in the morning.",
        createdAt: dt(-1, 16),
      },
    ],
  });

  // ─── Activity Log ─────────────────────────────────────────────────────────
  // Realistic audit trail entries reflecting events that "would have occurred" based on seed data.
  console.log("  Seeding activity log...");
  await prisma.activityLog.createMany({
    data: [
      // ── Project 1 — Mobile App Launch Q3 ─────────────────────────────────
      // Project and team setup
      {
        projectId: p1.id, entityType: "member", entityId: alex.id, entityTitle: alex.fullName,
        action: "member_added", actorId: sarah.id, actorName: sarah.fullName, actorRole: sarah.role,
        details: `Added ${alex.fullName} to the project`, createdAt: d(-43),
      },
      {
        projectId: p1.id, entityType: "member", entityId: emma.id, entityTitle: emma.fullName,
        action: "member_added", actorId: sarah.id, actorName: sarah.fullName, actorRole: sarah.role,
        details: `Added ${emma.fullName} to the project`, createdAt: d(-43),
      },
      {
        projectId: p1.id, entityType: "member", entityId: maria.id, entityTitle: maria.fullName,
        action: "member_added", actorId: sarah.id, actorName: sarah.fullName, actorRole: sarah.role,
        details: `Added ${maria.fullName} to the project`, createdAt: d(-43),
      },
      // Task: iOS core implementation
      {
        projectId: p1.id, entityType: "task", entityId: t1.id, entityTitle: "iOS core feature implementation",
        action: "created", actorId: sarah.id, actorName: sarah.fullName, actorRole: sarah.role,
        details: `Created task "iOS core feature implementation"`, createdAt: d(-40),
      },
      {
        projectId: p1.id, entityType: "task", entityId: t1.id, entityTitle: "iOS core feature implementation",
        action: "assigned", actorId: sarah.id, actorName: sarah.fullName, actorRole: sarah.role,
        details: `Assigned "iOS core feature implementation" to ${alex.fullName}`, createdAt: d(-40),
      },
      {
        projectId: p1.id, entityType: "task", entityId: t1.id, entityTitle: "iOS core feature implementation",
        action: "status_changed", actorId: alex.id, actorName: alex.fullName, actorRole: alex.role,
        details: `Changed status of "iOS core feature implementation" from To Do → In Progress`, createdAt: d(-38),
      },
      {
        projectId: p1.id, entityType: "task", entityId: t1.id, entityTitle: "iOS core feature implementation",
        action: "submitted_for_review", actorId: alex.id, actorName: alex.fullName, actorRole: alex.role,
        details: `Submitted "iOS core feature implementation" for review`, createdAt: d(-22),
      },
      {
        projectId: p1.id, entityType: "task", entityId: t1.id, entityTitle: "iOS core feature implementation",
        action: "approved", actorId: sarah.id, actorName: sarah.fullName, actorRole: sarah.role,
        details: `Approved "iOS core feature implementation"`, createdAt: d(-21),
      },
      // Task: iOS onboarding screens
      {
        projectId: p1.id, entityType: "task", entityId: t4.id, entityTitle: "iOS onboarding screens — permissions flow",
        action: "created", actorId: sarah.id, actorName: sarah.fullName, actorRole: sarah.role,
        details: `Created task "iOS onboarding screens — permissions flow"`, createdAt: d(-20),
      },
      {
        projectId: p1.id, entityType: "task", entityId: t4.id, entityTitle: "iOS onboarding screens — permissions flow",
        action: "assigned", actorId: sarah.id, actorName: sarah.fullName, actorRole: sarah.role,
        details: `Assigned "iOS onboarding screens — permissions flow" to ${james.fullName}`, createdAt: d(-20),
      },
      {
        projectId: p1.id, entityType: "task", entityId: t4.id, entityTitle: "iOS onboarding screens — permissions flow",
        action: "submitted_for_review", actorId: james.id, actorName: james.fullName, actorRole: james.role,
        details: `Submitted "iOS onboarding screens — permissions flow" for review`, createdAt: d(-4),
      },
      {
        projectId: p1.id, entityType: "task", entityId: t4.id, entityTitle: "iOS onboarding screens — permissions flow",
        action: "approved", actorId: alex.id, actorName: alex.fullName, actorRole: alex.role,
        details: `Approved "iOS onboarding screens — permissions flow"`, createdAt: d(-3),
      },
      // Task: Android onboarding blocked
      {
        projectId: p1.id, entityType: "task", entityId: t5.id, entityTitle: "Android onboarding — welcome screens",
        action: "status_changed", actorId: maria.id, actorName: maria.fullName, actorRole: maria.role,
        details: `Changed status of "Android onboarding — welcome screens" from In Progress → Blocked`, createdAt: d(-5),
      },
      // Escalation created
      {
        projectId: p1.id, entityType: "escalation", entityId: "esc-p1-1", entityTitle: `Escalation on "Android onboarding — welcome screens"`,
        action: "created", actorId: emma.id, actorName: emma.fullName, actorRole: emma.role,
        details: `Raised an escalation on "Android onboarding — welcome screens": Blocked for 5 days waiting on design assets...`, createdAt: d(-1),
      },
      // Meeting scheduled
      {
        projectId: p1.id, entityType: "meeting", entityId: "meeting-sprint-1", entityTitle: "Mobile App Sprint Review",
        action: "scheduled", actorId: sarah.id, actorName: sarah.fullName, actorRole: sarah.role,
        details: `Scheduled team meeting "Mobile App Sprint Review"`, createdAt: d(-2),
      },

      // ── Project 2 — Data Platform Migration ───────────────────────────────
      {
        projectId: p2.id, entityType: "member", entityId: carlos.id, entityTitle: carlos.fullName,
        action: "member_added", actorId: marcus.id, actorName: marcus.fullName, actorRole: marcus.role,
        details: `Added ${carlos.fullName} to the project`, createdAt: d(-50),
      },
      {
        projectId: p2.id, entityType: "member", entityId: sophie.id, entityTitle: sophie.fullName,
        action: "member_added", actorId: marcus.id, actorName: marcus.fullName, actorRole: marcus.role,
        details: `Added ${sophie.fullName} to the project`, createdAt: d(-50),
      },
      // Task: ETL batch pipeline
      {
        projectId: p2.id, entityType: "task", entityId: dp4.id, entityTitle: "Batch ETL pipeline build",
        action: "created", actorId: marcus.id, actorName: marcus.fullName, actorRole: marcus.role,
        details: `Created task "Batch ETL pipeline build"`, createdAt: d(-48),
      },
      {
        projectId: p2.id, entityType: "task", entityId: dp4.id, entityTitle: "Batch ETL pipeline build",
        action: "assigned", actorId: marcus.id, actorName: marcus.fullName, actorRole: marcus.role,
        details: `Assigned "Batch ETL pipeline build" to ${aisha.fullName}`, createdAt: d(-48),
      },
      {
        projectId: p2.id, entityType: "task", entityId: dp4.id, entityTitle: "Batch ETL pipeline build",
        action: "status_changed", actorId: aisha.id, actorName: aisha.fullName, actorRole: aisha.role,
        details: `Changed status of "Batch ETL pipeline build" from To Do → In Progress`, createdAt: d(-44),
      },
      {
        projectId: p2.id, entityType: "task", entityId: dp4.id, entityTitle: "Batch ETL pipeline build",
        action: "submitted_for_review", actorId: aisha.id, actorName: aisha.fullName, actorRole: aisha.role,
        details: `Submitted "Batch ETL pipeline build" for review`, createdAt: d(-8),
      },
      {
        projectId: p2.id, entityType: "task", entityId: dp4.id, entityTitle: "Batch ETL pipeline build",
        action: "approved", actorId: carlos.id, actorName: carlos.fullName, actorRole: carlos.role,
        details: `Approved "Batch ETL pipeline build"`, createdAt: d(-7),
      },
      // Task: Streaming pipeline
      {
        projectId: p2.id, entityType: "task", entityId: dp5.id, entityTitle: "Streaming pipeline setup",
        action: "assigned", actorId: marcus.id, actorName: marcus.fullName, actorRole: marcus.role,
        details: `Assigned "Streaming pipeline setup" to ${tyler.fullName}`, createdAt: d(-44),
      },
      // Escalation created + resolved
      {
        projectId: p2.id, entityType: "escalation", entityId: "esc-p2-1", entityTitle: "Escalation on \"Streaming pipeline setup\"",
        action: "created", actorId: tyler.id, actorName: tyler.fullName, actorRole: tyler.role,
        details: `Raised an escalation on "Streaming pipeline setup": Kinesis consumer config is missing IAM role permissions in staging...`, createdAt: d(-9),
      },
      {
        projectId: p2.id, entityType: "escalation", entityId: "esc-p2-1", entityTitle: "Escalation on \"Streaming pipeline setup\"",
        action: "resolved", actorId: carlos.id, actorName: carlos.fullName, actorRole: carlos.role,
        details: `Resolved escalation on "Streaming pipeline setup"`, createdAt: d(-7),
      },
      // Meeting
      {
        projectId: p2.id, entityType: "meeting", entityId: "meeting-p2-standup", entityTitle: "Data Migration Daily Standup",
        action: "scheduled", actorId: marcus.id, actorName: marcus.fullName, actorRole: marcus.role,
        details: `Scheduled team meeting "Data Migration Daily Standup"`, createdAt: d(-1),
      },

      // ── Project 3 — Internal Dashboard Redesign ───────────────────────────
      {
        projectId: p3.id, entityType: "member", entityId: jordan.id, entityTitle: jordan.fullName,
        action: "member_added", actorId: rachel.id, actorName: rachel.fullName, actorRole: rachel.role,
        details: `Added ${jordan.fullName} to the project`, createdAt: d(-35),
      },
      {
        projectId: p3.id, entityType: "member", entityId: yuki.id, entityTitle: yuki.fullName,
        action: "member_added", actorId: rachel.id, actorName: rachel.fullName, actorRole: rachel.role,
        details: `Added ${yuki.fullName} to the project`, createdAt: d(-35),
      },
      {
        projectId: p3.id, entityType: "member", entityId: ben.id, entityTitle: ben.fullName,
        action: "member_added", actorId: rachel.id, actorName: rachel.fullName, actorRole: rachel.role,
        details: `Added ${ben.fullName} to the project`, createdAt: d(-35),
      },
      // Task: Stakeholder interviews
      {
        projectId: p3.id, entityType: "task", entityId: p3t1.id, entityTitle: "Stakeholder interviews and requirements",
        action: "submitted_for_review", actorId: jordan.id, actorName: jordan.fullName, actorRole: jordan.role,
        details: `Submitted "Stakeholder interviews and requirements" for review`, createdAt: d(-16),
      },
      {
        projectId: p3.id, entityType: "task", entityId: p3t1.id, entityTitle: "Stakeholder interviews and requirements",
        action: "approved", actorId: rachel.id, actorName: rachel.fullName, actorRole: rachel.role,
        details: `Approved "Stakeholder interviews and requirements"`, createdAt: d(-14),
      },
      // Task: Wireframes submitted for review (currently pending)
      {
        projectId: p3.id, entityType: "task", entityId: p3t2.id, entityTitle: "Wireframes and design system setup",
        action: "created", actorId: rachel.id, actorName: rachel.fullName, actorRole: rachel.role,
        details: `Created task "Wireframes and design system setup"`, createdAt: d(-14),
      },
      {
        projectId: p3.id, entityType: "task", entityId: p3t2.id, entityTitle: "Wireframes and design system setup",
        action: "assigned", actorId: rachel.id, actorName: rachel.fullName, actorRole: rachel.role,
        details: `Assigned "Wireframes and design system setup" to ${yuki.fullName}`, createdAt: d(-14),
      },
      {
        projectId: p3.id, entityType: "task", entityId: p3t2.id, entityTitle: "Wireframes and design system setup",
        action: "submitted_for_review", actorId: yuki.id, actorName: yuki.fullName, actorRole: yuki.role,
        details: `Submitted "Wireframes and design system setup" for review`, createdAt: d(-1),
      },
      // Meeting
      {
        projectId: p3.id, entityType: "meeting", entityId: "meeting-p3-design", entityTitle: "Dashboard Design Review",
        action: "scheduled", actorId: rachel.id, actorName: rachel.fullName, actorRole: rachel.role,
        details: `Scheduled team meeting "Dashboard Design Review"`, createdAt: dt(0, 8),
      },
    ],
  });

  // ─── Notifications ────────────────────────────────────────────────────────
  // Realistic notifications reflecting events that "would have happened" based on seed data.
  console.log("  Seeding notifications...");
  await prisma.notification.createMany({
    data: [
      // ── Sarah (manager, p1 lead) ──────────────────────────────────────────
      // Yuki's wireframes submitted for review on p3 (cross-project visibility since sarah isn't on p3)
      // Emma escalated a blocker to managers
      {
        userId: sarah.id,
        type: "task_submitted_for_review",
        title: "Task submitted for review",
        body: "Alex Rivera submitted \"iOS onboarding screens — permissions flow\" for review.",
        link: `/projects/${p1.id}?tab=tasks`,
        read: true,
        createdAt: dt(-3, 10),
      },
      {
        userId: sarah.id,
        type: "escalation_received",
        title: "New escalation",
        body: "Emma Wilson raised an escalation on \"Android onboarding — welcome screens\": Blocked waiting on design assets...",
        link: `/projects/${p1.id}?tab=escalations`,
        read: false,
        createdAt: dt(-1, 14),
      },
      {
        userId: sarah.id,
        type: "escalation_received",
        title: "New escalation",
        body: "Maria Santos raised an escalation: Missing assets are causing a full stop on Android onboarding screens...",
        link: `/projects/${p1.id}?tab=escalations`,
        read: false,
        createdAt: dt(-1, 15),
      },
      {
        userId: sarah.id,
        type: "task_submitted_for_review",
        title: "Task submitted for review",
        body: "Lisa Tran submitted \"Push notifications integration\" for review.",
        link: `/projects/${p1.id}?tab=tasks`,
        read: false,
        createdAt: dt(0, 9),
      },
      // ── Marcus (manager, p2 lead) ─────────────────────────────────────────
      {
        userId: marcus.id,
        type: "task_submitted_for_review",
        title: "Task submitted for review",
        body: "Aisha Okafor submitted \"Batch ETL pipeline\" for review.",
        link: `/projects/${p2.id}?tab=tasks`,
        read: true,
        createdAt: dt(-4, 11),
      },
      {
        userId: marcus.id,
        type: "escalation_received",
        title: "New escalation",
        body: "Tyler Wright raised an escalation: Kinesis consumer config is missing IAM role permissions in staging...",
        link: `/projects/${p2.id}?tab=escalations`,
        read: false,
        createdAt: dt(-2, 16),
      },
      // ── Rachel (manager, p3 lead) ─────────────────────────────────────────
      {
        userId: rachel.id,
        type: "task_submitted_for_review",
        title: "Task submitted for review",
        body: "Yuki Tanaka submitted \"Wireframes and design system setup\" for review.",
        link: `/projects/${p3.id}?tab=tasks`,
        read: false,
        createdAt: dt(-1, 9),
      },
      {
        userId: rachel.id,
        type: "meeting_created",
        title: "New team meeting scheduled",
        body: "Jordan Walsh scheduled \"Dashboard Design Review\" for Internal Dashboard Redesign.",
        link: "/meetings",
        read: true,
        createdAt: dt(-2, 8),
      },
      // ── Alex (senior dev, p1) ─────────────────────────────────────────────
      {
        userId: alex.id,
        type: "task_assigned",
        title: "New task assigned to you",
        body: "\"App Store submission preparation\" in Mobile App Launch Q3 has been assigned to you.",
        link: `/projects/${p1.id}?tab=tasks`,
        read: true,
        createdAt: dt(-10, 9),
      },
      {
        userId: alex.id,
        type: "task_approved",
        title: "Task approved ✅",
        body: "Sarah Mitchell approved \"iOS core feature implementation\". Great work!",
        link: `/projects/${p1.id}?tab=tasks`,
        read: true,
        createdAt: dt(-8, 14),
      },
      {
        userId: alex.id,
        type: "meeting_created",
        title: "1-on-1 meeting scheduled",
        body: "Sarah Mitchell scheduled a 1-on-1 meeting with you: \"1-on-1 with Alex Rivera\".",
        link: "/meetings",
        read: false,
        createdAt: dt(0, 8),
      },
      // ── Jordan (senior dev, p3) ────────────────────────────────────────────
      {
        userId: jordan.id,
        type: "task_submitted_for_review",
        title: "Task submitted for review",
        body: "Yuki Tanaka submitted \"Wireframes and design system setup\" for review.",
        link: `/projects/${p3.id}?tab=tasks`,
        read: false,
        createdAt: dt(-1, 9),
      },
      {
        userId: jordan.id,
        type: "escalation_received",
        title: "New escalation",
        body: "Ben Carter raised an escalation on \"Dashboard views implementation\": The spec is ambiguous about real-time update requirements...",
        link: `/projects/${p3.id}?tab=escalations`,
        read: true,
        createdAt: dt(-6, 10),
      },
      // ── Emma (developer, p1 + p3) ─────────────────────────────────────────
      {
        userId: emma.id,
        type: "task_rejected",
        title: "Task needs revision",
        body: "Alex Rivera rejected \"Push notification deep linking\". Please review the feedback.",
        link: `/projects/${p1.id}?tab=tasks`,
        read: true,
        createdAt: dt(-5, 15),
      },
      {
        userId: emma.id,
        type: "task_approved",
        title: "Task approved ✅",
        body: "Rachel Chen approved \"Analytics event tracking setup\". Great work!",
        link: `/projects/${p3.id}?tab=tasks`,
        read: false,
        createdAt: dt(-1, 11),
      },
      {
        userId: emma.id,
        type: "project_assigned",
        title: "Added to a project",
        body: "Rachel Chen added you to \"Internal Dashboard Redesign\".",
        link: `/projects/${p3.id}`,
        read: true,
        createdAt: dt(-30, 9),
      },
      // ── James (developer, p1) ─────────────────────────────────────────────
      {
        userId: james.id,
        type: "task_approved",
        title: "Task approved ✅",
        body: "Alex Rivera approved \"iOS onboarding screens — permissions flow\". Great work!",
        link: `/projects/${p1.id}?tab=tasks`,
        read: false,
        createdAt: dt(-3, 16),
      },
      {
        userId: james.id,
        type: "meeting_created",
        title: "New team meeting scheduled",
        body: "Sarah Mitchell scheduled \"Mobile App Sprint Review\" for Mobile App Launch Q3.",
        link: "/meetings",
        read: false,
        createdAt: dt(-1, 8),
      },
      // ── Sophie (developer, p2) ────────────────────────────────────────────
      {
        userId: sophie.id,
        type: "meeting_created",
        title: "1-on-1 meeting scheduled",
        body: "Marcus Johnson scheduled a 1-on-1 meeting with you: \"1-on-1 with Sophie Brown\".",
        link: "/meetings",
        read: false,
        createdAt: dt(0, 7),
      },
      {
        userId: sophie.id,
        type: "escalation_responded",
        title: "Escalation response received",
        body: "Marcus Johnson responded to your escalation on \"Streaming pipeline setup\".",
        link: `/projects/${p2.id}?tab=escalations`,
        read: true,
        createdAt: dt(-3, 11),
      },
      // ── Yuki (senior dev, p3) — task status changed (blocked scenario) ────
      {
        userId: yuki.id,
        type: "task_status_changed",
        title: "Task blocked",
        body: "\"Frontend integration tests\" has been marked as blocked and may need attention.",
        link: `/projects/${p3.id}?tab=tasks`,
        read: false,
        createdAt: dt(0, 9),
      },
    ],
  });

  // ─── Project Templates ────────────────────────────────────────────────────
  console.log("  Seeding project templates...");

  await prisma.projectTemplate.create({
    data: {
      name: "Software Sprint",
      description: "Standard 2-week agile sprint: discovery, dev tasks, review, and deploy.",
      durationDays: 14,
      createdById: sarah.id,
      tasks: {
        create: [
          { title: "Sprint planning & backlog grooming",   priority: "HIGH",     startDayOffset: 0, durationDays: 1 },
          { title: "Environment setup & branch cut",       priority: "MEDIUM",   startDayOffset: 1, durationDays: 1 },
          { title: "Feature development — core logic",     priority: "HIGH",     startDayOffset: 2, durationDays: 5, estimatedHours: 20 },
          { title: "Unit tests & code review",             priority: "HIGH",     startDayOffset: 7, durationDays: 2, estimatedHours: 8 },
          { title: "QA testing & bug fixes",               priority: "MEDIUM",   startDayOffset: 9, durationDays: 2, estimatedHours: 6 },
          { title: "Staging deployment & smoke test",      priority: "MEDIUM",   startDayOffset: 11, durationDays: 1 },
          { title: "Production release & monitoring",      priority: "CRITICAL", startDayOffset: 13, durationDays: 1 },
        ],
      },
      risks: {
        create: [
          { title: "Scope creep mid-sprint", probability: "HIGH",   impact: "MEDIUM", mitigation: "Freeze scope after planning; log new requests for next sprint" },
          { title: "Flaky test environment",  probability: "MEDIUM", impact: "LOW",    mitigation: "Use dedicated CI runner; document known environment quirks" },
        ],
      },
    },
  });

  await prisma.projectTemplate.create({
    data: {
      name: "Product Launch",
      description: "End-to-end product launch workflow: research through go-live and post-launch review.",
      durationDays: 45,
      createdById: marcus.id,
      tasks: {
        create: [
          { title: "Market & competitor research",         priority: "HIGH",     startDayOffset: 0,  durationDays: 5,  estimatedHours: 16 },
          { title: "Requirements & scope definition",      priority: "HIGH",     startDayOffset: 5,  durationDays: 3,  estimatedHours: 10 },
          { title: "Design mockups & user flows",          priority: "HIGH",     startDayOffset: 8,  durationDays: 7,  estimatedHours: 24 },
          { title: "Design review & stakeholder sign-off", priority: "MEDIUM",   startDayOffset: 15, durationDays: 2 },
          { title: "Backend API development",              priority: "HIGH",     startDayOffset: 17, durationDays: 10, estimatedHours: 40 },
          { title: "Frontend implementation",              priority: "HIGH",     startDayOffset: 17, durationDays: 12, estimatedHours: 48 },
          { title: "Integration testing",                  priority: "HIGH",     startDayOffset: 29, durationDays: 5,  estimatedHours: 16 },
          { title: "Beta user testing & feedback",         priority: "MEDIUM",   startDayOffset: 34, durationDays: 4,  estimatedHours: 8 },
          { title: "Marketing assets & launch prep",       priority: "MEDIUM",   startDayOffset: 36, durationDays: 5 },
          { title: "Go-live deployment",                   priority: "CRITICAL", startDayOffset: 44, durationDays: 1 },
        ],
      },
      risks: {
        create: [
          { title: "Launch date slippage",         probability: "HIGH",   impact: "HIGH",   mitigation: "Track milestone velocity weekly; flag 2-week risk early and adjust scope" },
          { title: "Third-party API dependency",   probability: "MEDIUM", impact: "HIGH",   mitigation: "Identify external dependencies in week 1; build fallback stubs" },
          { title: "Beta feedback causes redesign", probability: "LOW",    impact: "HIGH",   mitigation: "Run design reviews early; treat beta as validation not discovery" },
          { title: "Insufficient QA time",         probability: "MEDIUM", impact: "MEDIUM", mitigation: "Allocate fixed QA buffer; do not compress test window to recover dev delays" },
        ],
      },
    },
  });

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("✅ Seed complete!");
  console.log(`   • Users: 19 (3 managers, 6 senior devs, 10 developers)`);
  console.log(`   • Projects: 3`);
  console.log(`   • Tasks: 30 (12 + 10 + 8)`);
  console.log(`   • Dependencies: 36`);
  console.log(`   • Task Activities: 18`);
  console.log(`   • Risks: 8`);
  console.log(`   • Escalations: 6`);
  console.log(`   • Availability entries: 15`);
  console.log(`   • Meetings: 8`);
  console.log(`   • Project chat messages: 14`);
  console.log(`   • Task comments: 9`);
  console.log(`   • Activity log entries: 36`);
  console.log(`   • Notifications: 21`);
  console.log(`   • Project templates: 2 (Software Sprint, Product Launch)`);
  console.log(``);
  console.log("🔑 Demo login credentials:");
  console.log("   Manager      → sarah@namo.dev   / manager123");
  console.log("   Manager      → marcus@namo.dev  / manager123");
  console.log("   Manager      → rachel@namo.dev  / manager123");
  console.log("   Senior Dev   → alex@namo.dev    / senior123");
  console.log("   Senior Dev   → nina@namo.dev    / senior123");
  console.log("   Senior Dev   → carlos@namo.dev  / senior123");
  console.log("   Developer    → emma@namo.dev    / dev123");
  console.log("   Developer    → james@namo.dev   / dev123");
  console.log("   Developer    → aisha@namo.dev   / dev123");
  console.log("   (+ 10 more — all devs use dev123, all senior devs use senior123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
