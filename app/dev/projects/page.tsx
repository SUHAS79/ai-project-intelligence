import AppShell from "@/components/AppShell";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FolderOpen, Users, Calendar, ArrowRight, ShieldCheck,
  CheckSquare, Clock,
} from "lucide-react";
import { formatDate, daysFromNow, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DevProjectsPage() {
  const user = await getUserFromToken();
  if (!user) return null;
  if (user.role === "manager") redirect("/");

  // Fetch projects this user belongs to, with member + task data
  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.userId },
    include: {
      project: {
        include: {
          tasks: {
            select: {
              id: true,
              status: true,
              assignedToId: true,
            },
          },
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

    // My tasks only — scoped to current user
    const myTasks = p.tasks.filter((t) => t.assignedToId === user.userId);
    const myTotal = myTasks.length;
    const myDone = myTasks.filter((t) => t.status === "DONE").length;
    const myActive = myTasks.filter(
      (t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW"
    ).length;
    const myBlocked = myTasks.filter((t) => t.status === "BLOCKED").length;

    // Project manager
    const managerMember = p.members.find((mem) => mem.user.role === "manager");
    const managerName = managerMember?.user.fullName ?? "Unassigned";
    const teamCount = p.members.length;

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      managerName,
      teamCount,
      myTotal,
      myDone,
      myActive,
      myBlocked,
      daysLeft: daysFromNow(p.endDate),
    };
  });

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
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
            <p className="text-sm text-slate-400">Ask your manager to add you to a project.</p>
          </div>
        )}

        {/* Project cards */}
        <div className="grid gap-4">
          {projects.map((project) => {
            const isOverdue = project.daysLeft < 0;
            const isDueToday = project.daysLeft === 0;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group block bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-violet-200 transition-all duration-200"
              >
                <div className="p-6">
                  {/* Project name + status */}
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
                        <p className="text-xs text-slate-500 line-clamp-2">{project.description}</p>
                      )}
                    </div>

                    {/* My tasks summary badge */}
                    <div className="shrink-0 flex flex-col items-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-center min-w-[64px]">
                      <span className="text-lg font-bold tabular-nums text-slate-800">{project.myTotal}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wide leading-tight">My Tasks</span>
                    </div>
                  </div>

                  {/* My task status chips */}
                  {project.myTotal > 0 && (
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {project.myDone > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          <CheckSquare className="w-3 h-3" />
                          {project.myDone} done
                        </span>
                      )}
                      {project.myActive > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                          <Clock className="w-3 h-3" />
                          {project.myActive} in progress
                        </span>
                      )}
                      {project.myBlocked > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">
                          {project.myBlocked} blocked
                        </span>
                      )}
                      {project.myTotal - project.myDone - project.myActive - project.myBlocked > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                          {project.myTotal - project.myDone - project.myActive - project.myBlocked} to do
                        </span>
                      )}
                    </div>
                  )}

                  {project.myTotal === 0 && (
                    <p className="text-xs text-slate-400 mb-4">No tasks assigned to you yet.</p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-3 border-t border-slate-100">
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
                      Due {formatDate(project.endDate)}
                    </span>
                    <span className={cn(
                      "font-medium",
                      isOverdue ? "text-red-500" :
                      isDueToday ? "text-amber-500" :
                      project.daysLeft <= 7 ? "text-orange-500" : "text-slate-400"
                    )}>
                      {isOverdue
                        ? `${Math.abs(project.daysLeft)}d overdue`
                        : isDueToday
                        ? "Due today"
                        : `${project.daysLeft}d left`}
                    </span>

                    <span className="ml-auto flex items-center gap-1 text-violet-500 group-hover:gap-2 transition-all font-medium">
                      Open workspace
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
