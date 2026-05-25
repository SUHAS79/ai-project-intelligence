import AppShell from "@/components/AppShell";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderOpen, Users, Calendar, TrendingUp, ArrowRight, ShieldCheck } from "lucide-react";
import { getHealthColor, formatDate, daysFromNow, cn } from "@/lib/utils";
import { computeInsights } from "@/lib/insights";

export const dynamic = "force-dynamic";

export default async function DevProjectsPage() {
  const user = await getUserFromToken();
  if (!user) return null;
  if (user.role === "manager") redirect("/");

  // Fetch projects this user belongs to, with full data for insights
  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.userId },
    include: {
      project: {
        include: {
          tasks: {
            include: {
              dependsOn: { include: { dependency: true } },
              dependedOnBy: { include: { dependent: true } },
            },
          },
          risks: true,
          members: {
            include: {
              user: {
                select: { id: true, fullName: true, role: true, initials: true },
              },
            },
          },
        },
      },
    },
    orderBy: { addedAt: "asc" },
  });

  const projects = memberships.map((m) => {
    const p = m.project;
    const insights = computeInsights(p.tasks as any, p.risks);
    const totalTasks = p.tasks.length;
    const doneTasks = p.tasks.filter((t) => t.status === "DONE").length;
    const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    // Find the project manager (member with manager role)
    const managerMember = p.members.find((m) => m.user.role === "manager");
    const managerName = managerMember?.user.fullName ?? "Unassigned";
    const teamCount = p.members.length;

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      healthScore: insights.healthScore,
      healthLabel: insights.healthLabel,
      progressPct,
      totalTasks,
      doneTasks,
      managerName,
      teamCount,
      daysLeft: daysFromNow(p.endDate),
    };
  });

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Projects</h1>
            <p className="text-sm text-slate-500">
              {projects.length === 0
                ? "You haven't been assigned to any projects yet"
                : `${projects.length} project${projects.length !== 1 ? "s" : ""} you're working on`}
            </p>
          </div>
        </div>

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-medium text-slate-700 mb-1">No projects assigned</p>
            <p className="text-sm text-slate-400">
              Ask your manager to add you to a project.
            </p>
          </div>
        )}

        {/* Project cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {projects.map((project) => {
            const healthColor = getHealthColor(project.healthScore);
            const isOverdue = project.daysLeft < 0;
            const isDueToday = project.daysLeft === 0;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group block bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-violet-200 transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-base font-semibold text-slate-900 group-hover:text-violet-700 transition-colors">
                          {project.name}
                        </h2>
                        <span className={cn(
                          "text-[11px] px-2 py-0.5 rounded-full border font-medium",
                          project.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                          {project.status}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>

                    {/* Health score */}
                    <div className="flex flex-col items-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                      <span className={`text-lg font-bold tabular-nums ${healthColor}`}>
                        {project.healthScore}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wide">Health</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Progress</span>
                      <span className="text-xs font-semibold text-slate-700">{project.progressPct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          project.progressPct >= 80 ? "bg-emerald-500" :
                          project.progressPct >= 50 ? "bg-blue-500" :
                          project.progressPct >= 20 ? "bg-amber-500" : "bg-slate-300"
                        )}
                        style={{ width: `${project.progressPct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {project.doneTasks} of {project.totalTasks} tasks complete
                    </p>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-violet-400" />
                      PM: {project.managerName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {project.teamCount} member{project.teamCount !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(project.endDate)}
                    </span>
                    <span className={cn(
                      "flex items-center gap-1 font-medium",
                      isOverdue ? "text-red-500" :
                      isDueToday ? "text-amber-500" :
                      project.daysLeft <= 7 ? "text-orange-500" : "text-slate-400"
                    )}>
                      <TrendingUp className="w-3 h-3" />
                      {isOverdue
                        ? `${Math.abs(project.daysLeft)}d overdue`
                        : isDueToday
                        ? "Due today"
                        : `${project.daysLeft}d remaining`}
                    </span>

                    <span className="ml-auto flex items-center gap-1 text-violet-500 group-hover:gap-2 transition-all font-medium">
                      Open
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
