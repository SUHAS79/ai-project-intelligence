import AppShell from "@/components/AppShell";
import { PeopleManagement } from "@/components/PeopleManagement";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const employees = await prisma.user.findMany({
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
    },
    orderBy: { fullName: "asc" },
  });

  const serialized = employees.map((e) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
    lastLogin: e.lastLogin?.toISOString() ?? null,
  }));

  return (
    <AppShell>
      <PeopleManagement initialEmployees={serialized} />
    </AppShell>
  );
}
