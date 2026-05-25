import AppShell from "@/components/AppShell";
import { PeopleManagement } from "@/components/PeopleManagement";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const [employeesRaw, allProjects] = await Promise.all([
    prisma.user.findMany({
      where: { role: { not: "manager" } },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        initials: true,
        createdAt: true,
        lastLogin: true,
        projectMemberships: {
          select: {
            project: { select: { id: true, name: true } },
          },
          orderBy: { addedAt: "asc" },
        },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.project.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const employees = employeesRaw.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    email: e.email,
    role: e.role,
    status: e.status,
    initials: e.initials,
    createdAt: e.createdAt.toISOString(),
    lastLogin: e.lastLogin?.toISOString() ?? null,
    projects: e.projectMemberships.map((m) => m.project),
  }));

  return (
    <AppShell>
      <PeopleManagement initialEmployees={employees} allProjects={allProjects} />
    </AppShell>
  );
}
