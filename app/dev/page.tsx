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

  return (
    <AppShell>
      <DevDashboardClient
        user={user}
        tasks={tasks as any}
        reviewQueue={reviewQueue as any}
      />
    </AppShell>
  );
}
