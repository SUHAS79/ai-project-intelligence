import { prisma } from "@/lib/prisma";
import { computeInsights } from "@/lib/insights";
import AppShell from "@/components/AppShell";
import { DashboardClient } from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  return (
    <AppShell>
      <DashboardClient initialProjects={projectsWithInsights} />
    </AppShell>
  );
}
