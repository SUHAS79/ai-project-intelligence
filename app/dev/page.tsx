import AppShell from "@/components/AppShell";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DevDashboardClient } from "@/components/DevDashboardClient";

export const dynamic = "force-dynamic";

export default async function DevDashboardPage() {
  const user = await getUserFromToken();
  if (!user) return null;

  // Fetch all tasks assigned to this user, grouped by project
  const tasks = await prisma.task.findMany({
    where: { assignedToId: user.userId },
    include: {
      project: {
        select: { id: true, name: true, status: true, endDate: true },
      },
    },
    orderBy: [{ status: "asc" }, { endDate: "asc" }],
  });

  return (
    <AppShell>
      <DevDashboardClient user={user} tasks={tasks as any} />
    </AppShell>
  );
}
