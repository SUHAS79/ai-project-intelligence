import { prisma } from "@/lib/prisma";
import { computeInsights } from "@/lib/insights";
import AppShell from "@/components/AppShell";
import { DashboardClient } from "@/components/DashboardClient";
import { getUserFromToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getUserFromToken();

  const projects = await prisma.project.findMany({
    include: {
      tasks: {
        include: {
          dependsOn: { include: { dependency: true } },
          dependedOnBy: { include: { dependent: true } },
        },
      },
      risks: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const projectsWithInsights = projects.map((p) => ({
    ...p,
    insights: computeInsights(p.tasks as any, p.risks),
  }));

  // Manager: fetch all open/responded escalations
  const openEscalations = await prisma.escalation.findMany({
    where: { status: { in: ["OPEN", "RESPONDED"] } },
    include: {
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true, status: true, priority: true } },
      createdBy: { select: { id: true, fullName: true, initials: true, role: true } },
      respondedBy: { select: { id: true, fullName: true, initials: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell>
      <DashboardClient
        initialProjects={projectsWithInsights}
        openEscalations={openEscalations as any}
        userId={user?.userId ?? ""}
      />
    </AppShell>
  );
}
