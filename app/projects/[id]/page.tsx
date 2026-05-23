import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeInsights } from "@/lib/insights";
import AppShell from "@/components/AppShell";
import { ProjectHub } from "@/components/ProjectHub";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProjectPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab = "tasks" } = await searchParams;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        include: {
          dependsOn: { include: { dependency: true } },
          dependedOnBy: { include: { dependent: true } },
        },
        orderBy: { startDate: "asc" },
      },
      risks: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) notFound();

  const insights = computeInsights(project.tasks as any, project.risks);

  return (
    <AppShell>
      <ProjectHub project={project as any} insights={insights} activeTab={tab} />
    </AppShell>
  );
}
