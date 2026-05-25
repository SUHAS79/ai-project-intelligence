import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeInsights } from "@/lib/insights";
import AppShell from "@/components/AppShell";
import { ProjectHub } from "@/components/ProjectHub";
import { getUserFromToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProjectPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab = "tasks" } = await searchParams;
  const tokenUser = await getUserFromToken();

  const [project, members, allUsers] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            dependsOn: { include: { dependency: true } },
            dependedOnBy: { include: { dependent: true } },
            assignedTo: {
              select: { id: true, fullName: true, initials: true },
            },
            reviewedBy: {
              select: { id: true, fullName: true, initials: true },
            },
            activities: {
              orderBy: { createdAt: "desc" as const },
              take: 10,
            },
          },
          orderBy: { startDate: "asc" },
        },
        risks: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.projectMember.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            status: true,
            initials: true,
          },
        },
      },
      orderBy: { addedAt: "asc" },
    }),
    prisma.user.findMany({
      where: { role: { not: "manager" }, status: "active" },
      select: { id: true, fullName: true, email: true, role: true, initials: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  if (!project) notFound();

  const insights = computeInsights(project.tasks as any, project.risks);

  // Serialize dates for client components
  const serializedMembers = members.map((m) => ({
    ...m,
    addedAt: m.addedAt.toISOString(),
  }));

  return (
    <AppShell>
      <ProjectHub
        project={project as any}
        insights={insights}
        activeTab={tab}
        members={serializedMembers}
        allUsers={allUsers}
        isManager={tokenUser?.role === "manager"}
        userRole={tokenUser?.role ?? "manager"}
        currentUserId={tokenUser?.userId ?? ""}
      />
    </AppShell>
  );
}
