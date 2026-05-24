import AppShell from "@/components/AppShell";
import { TeamManagement } from "@/components/TeamManagement";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  // Fetch all non-manager users for the team list
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

  // Serialize dates for client component
  const serialized = employees.map((e) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
    lastLogin: e.lastLogin?.toISOString() ?? null,
  }));

  return (
    <AppShell>
      <TeamManagement initialEmployees={serialized} />
    </AppShell>
  );
}
