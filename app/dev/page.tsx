import AppShell from "@/components/AppShell";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DevDashboardClient } from "@/components/DevDashboardClient";

export const dynamic = "force-dynamic";

export default async function DevDashboardPage() {
  const user = await getUserFromToken();
  if (!user) return null;

  const isSeniorDev = user.role === "senior_developer";

  // Fetch all tasks assigned to this user
  const tasks = await prisma.task.findMany({
    where: { assignedToId: user.userId },
    include: {
      project: {
        select: { id: true, name: true, status: true, endDate: true },
      },
    },
    orderBy: [{ status: "asc" }, { endDate: "asc" }],
  });

  // For senior devs: fetch IN_REVIEW tasks from their projects for the review queue
  let reviewQueue: any[] = [];
  if (isSeniorDev) {
    reviewQueue = await prisma.task.findMany({
      where: {
        status: "IN_REVIEW",
        project: {
          members: { some: { userId: user.userId } },
        },
      },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, fullName: true, initials: true } },
        activities: {
          where: { action: "submitted_for_review" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { submittedForReviewAt: "asc" },
    });
  }

  const ESCALATION_INCLUDE = {
    project: { select: { id: true, name: true } },
    task: { select: { id: true, title: true, status: true, priority: true } },
    createdBy: { select: { id: true, fullName: true, initials: true, role: true } },
    respondedBy: { select: { id: true, fullName: true, initials: true } },
  } as const;

  // My escalations (sent by this user)
  const myEscalations = await prisma.escalation.findMany({
    where: { createdById: user.userId },
    include: ESCALATION_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  // Incoming escalations (for senior dev: targeted at them)
  let incomingEscalations: any[] = [];
  if (isSeniorDev) {
    incomingEscalations = await prisma.escalation.findMany({
      where: {
        targetRole: { in: ["senior_developer", "both"] },
        project: { members: { some: { userId: user.userId } } },
      },
      include: ESCALATION_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  return (
    <AppShell>
      <DevDashboardClient
        user={user}
        tasks={tasks as any}
        reviewQueue={reviewQueue as any}
        myEscalations={myEscalations as any}
        incomingEscalations={incomingEscalations as any}
      />
    </AppShell>
  );
}
