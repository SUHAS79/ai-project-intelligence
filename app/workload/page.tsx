import AppShell from "@/components/AppShell";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkloadView } from "@/components/WorkloadView";
import { BarChart3 } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WorkloadPage() {
  const user = await getUserFromToken();
  if (!user) return null;
  if (user.role !== "manager") redirect("/dev");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  // Fetch all active users (non-manager)
  const users = await prisma.user.findMany({
    where: { status: "active", role: { not: "manager" } },
    select: { id: true, fullName: true, initials: true, role: true },
    orderBy: { fullName: "asc" },
  });

  // Fetch all active tasks with project info
  const tasks = await prisma.task.findMany({
    where: { status: { not: "DONE" } },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      estimatedHours: true,
      endDate: true,
      assignedToId: true,
      project: { select: { id: true, name: true } },
    },
  });

  // Fetch done tasks too (to show completion rate per dev)
  const doneTasks = await prisma.task.findMany({
    where: { status: "DONE", assignedToId: { not: null } },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      estimatedHours: true,
      endDate: true,
      assignedToId: true,
      project: { select: { id: true, name: true } },
    },
  });

  const allTasks = [...tasks, ...doneTasks];

  // Fetch today's availability to flag who's off
  const todayAvailability = await prisma.availability.findMany({
    where: {
      startDate: { lte: todayStr },
      endDate: { gte: todayStr },
      approved: true,
      type: { in: ["vacation", "sick", "holiday"] },
    },
    select: { userId: true, note: true, type: true },
  });

  const offTodayMap = new Map<string, string | null>();
  todayAvailability.forEach((a) => {
    if (a.userId) offTodayMap.set(a.userId, a.note);
    // company holiday: everyone's off
    if (a.userId === null) {
      users.forEach((u) => offTodayMap.set(u.id, a.note));
    }
  });

  // Build per-developer workload
  const developers = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    initials: u.initials,
    role: u.role,
    tasks: allTasks
      .filter((t) => t.assignedToId === u.id)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        estimatedHours: t.estimatedHours,
        endDate: t.endDate.toString(),
        project: t.project,
      })),
    isOffToday: offTodayMap.has(u.id),
    offNote: offTodayMap.get(u.id) ?? null,
  }));

  // Unassigned active tasks
  const unassigned = tasks
    .filter((t) => !t.assignedToId && t.status !== "DONE")
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      estimatedHours: t.estimatedHours,
      endDate: t.endDate.toString(),
      project: t.project,
    }));

  return (
    <AppShell>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workload</h1>
            <p className="text-sm text-slate-500">
              Team capacity overview — {developers.length} developer{developers.length !== 1 ? "s" : ""}, {tasks.filter((t) => t.assignedToId).length} active tasks assigned
            </p>
          </div>
        </div>

        <WorkloadView developers={developers} unassignedTasks={unassigned} />
      </div>
    </AppShell>
  );
}
