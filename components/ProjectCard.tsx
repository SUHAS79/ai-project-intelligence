"use client";

import Link from "next/link";
import { Project, Risk } from "@/app/generated/prisma/client";
import { computeInsights } from "@/lib/insights";
import {
  PROJECT_STATUS_CONFIG,
  formatDate,
  daysFromNow,
  getHealthColor,
  getHealthBgColor,
} from "@/lib/utils";
import { ArrowRight, Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project & { tasks: any[]; risks: Risk[] };
}

const HEALTH_BORDER = {
  Healthy: "border-l-emerald-400",
  "At Risk": "border-l-amber-400",
  Critical: "border-l-red-400",
};

export function ProjectCard({ project }: ProjectCardProps) {
  const insights = computeInsights(project.tasks, project.risks);
  const { stats, healthScore, healthLabel } = insights;
  const statusCfg = PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG];
  const daysLeft = daysFromNow(project.endDate);
  const borderColor = HEALTH_BORDER[healthLabel] ?? "border-l-slate-300";

  const completionPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <div className={cn(
        "bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border-l-4",
        borderColor
      )}>
        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate group-hover:text-violet-700 transition-colors">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{project.description}</p>
              )}
            </div>
            {/* Health pill */}
            <div className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
              healthLabel === "Healthy" ? "bg-emerald-50 text-emerald-700" :
              healthLabel === "At Risk" ? "bg-amber-50 text-amber-700" :
              "bg-red-50 text-red-700"
            )}>
              {healthScore}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Progress</span>
              <span className="text-xs font-medium text-slate-700">{completionPct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  healthLabel === "Healthy" ? "bg-emerald-400" :
                  healthLabel === "At Risk" ? "bg-amber-400" :
                  "bg-red-400"
                )}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          {/* Task stats */}
          {stats.total === 0 ? (
            <div className="mb-4 py-2 text-center">
              <p className="text-xs text-slate-400 italic">No tasks yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: "Done", value: stats.done, color: "text-emerald-600" },
                { label: "Active", value: stats.inProgress, color: "text-blue-600" },
                { label: "Blocked", value: stats.blocked, color: stats.blocked > 0 ? "text-red-500" : "text-slate-400" },
                { label: "Overdue", value: stats.overdue, color: stats.overdue > 0 ? "text-orange-500" : "text-slate-400" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className={`text-base font-bold tabular-nums ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              {daysLeft > 0
                ? `${daysLeft}d left`
                : daysLeft === 0
                ? <span className="text-amber-500">Due today</span>
                : <span className="text-red-500">{Math.abs(daysLeft)}d overdue</span>}
            </div>
            <div className="flex items-center gap-3">
              {(stats.blocked > 0 || stats.overdue > 0) && (
                <div className="flex items-center gap-1 text-xs text-amber-500">
                  <AlertTriangle className="w-3 h-3" />
                  Needs attention
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-violet-600 transition-colors">
                Open
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
