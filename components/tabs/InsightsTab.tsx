"use client";

import { Task } from "@/app/generated/prisma/client";
import type { ProjectInsights } from "@/lib/insights";
import { Badge } from "../ui/Badge";
import {
  Brain,
  AlertTriangle,
  TrendingDown,
  GitBranch,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  ShieldAlert,
  Target,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface InsightsTabProps {
  insights: ProjectInsights;
  tasks: Task[];
}

const SEV = {
  CRITICAL: { dot: "bg-red-500", badge: "bg-red-100 text-red-700 border-red-200", banner: "bg-red-50 border-red-200", text: "text-red-700", icon: "🔴" },
  HIGH:     { dot: "bg-orange-400", badge: "bg-orange-100 text-orange-700 border-orange-200", banner: "bg-orange-50 border-orange-200", text: "text-orange-700", icon: "🟠" },
  MEDIUM:   { dot: "bg-amber-400", badge: "bg-amber-100 text-amber-700 border-amber-200", banner: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: "🟡" },
  LOW:      { dot: "bg-slate-300", badge: "bg-slate-100 text-slate-600 border-slate-200", banner: "bg-slate-50 border-slate-200", text: "text-slate-600", icon: "⚪" },
};

export function InsightsTab({ insights, tasks }: InsightsTabProps) {
  const { healthScore, healthLabel, delayedTasks, criticalPath, bottlenecks, riskFlags, suggestions, stats } = insights;

  const isHealthy = healthLabel === "Healthy";
  const isAtRisk = healthLabel === "At Risk";
  const isCritical = healthLabel === "Critical";

  const criticalSuggestions = suggestions.filter((s) => s.severity === "CRITICAL");
  const highSuggestions = suggestions.filter((s) => s.severity === "HIGH");
  const otherSuggestions = suggestions.filter((s) => s.severity !== "CRITICAL" && s.severity !== "HIGH");

  // Build "why at risk" narrative
  const whyAtRisk: string[] = [];
  if (delayedTasks.length > 0) whyAtRisk.push(`${delayedTasks.length} task${delayedTasks.length > 1 ? "s are" : " is"} overdue`);
  if (stats.blocked > 0) whyAtRisk.push(`${stats.blocked} task${stats.blocked > 1 ? "s" : ""} blocked`);
  if (riskFlags.filter((f) => f.severity === "CRITICAL" || f.severity === "HIGH").length > 0)
    whyAtRisk.push(`${riskFlags.filter((f) => f.severity === "CRITICAL" || f.severity === "HIGH").length} high-severity risk${riskFlags.length > 1 ? "s" : ""} unresolved`);
  if (criticalPath.some((t) => t.status === "BLOCKED")) whyAtRisk.push("critical path is blocked");

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Project Outlook — lead card */}
      <div className={cn(
        "rounded-xl border p-5",
        isCritical ? "bg-red-50 border-red-200" :
        isAtRisk   ? "bg-amber-50 border-amber-200" :
                     "bg-emerald-50 border-emerald-200"
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            isCritical ? "bg-red-100" : isAtRisk ? "bg-amber-100" : "bg-emerald-100"
          )}>
            <Brain className={cn(
              "w-5 h-5",
              isCritical ? "text-red-600" : isAtRisk ? "text-amber-600" : "text-emerald-600"
            )} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-base font-bold",
                isCritical ? "text-red-800" : isAtRisk ? "text-amber-800" : "text-emerald-800"
              )}>
                {isCritical ? "Project is at critical risk" : isAtRisk ? "Project needs attention" : "Project is on track"}
              </span>
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full",
                isCritical ? "bg-red-200 text-red-700" : isAtRisk ? "bg-amber-200 text-amber-700" : "bg-emerald-200 text-emerald-700"
              )}>
                {healthScore}/100
              </span>
            </div>
            {whyAtRisk.length > 0 ? (
              <p className={cn(
                "text-sm",
                isCritical ? "text-red-700" : isAtRisk ? "text-amber-700" : "text-emerald-700"
              )}>
                NAMO detected:{" "}
                {whyAtRisk.map((r, i) => (
                  <span key={i}>
                    <span className="font-semibold">{r}</span>
                    {i < whyAtRisk.length - 1 ? ", " : "."}
                  </span>
                ))}
              </p>
            ) : (
              <p className="text-sm text-emerald-700">No significant risks detected. Keep the current pace.</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Done",       val: stats.done,       color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "In Progress", val: stats.inProgress, color: "text-blue-600",    bg: "bg-blue-50" },
          { label: "Blocked",    val: stats.blocked,    color: stats.blocked > 0 ? "text-red-500" : "text-slate-400",    bg: stats.blocked > 0 ? "bg-red-50" : "bg-slate-50" },
          { label: "Overdue",    val: stats.overdue,    color: stats.overdue > 0 ? "text-orange-500" : "text-slate-400", bg: stats.overdue > 0 ? "bg-orange-50" : "bg-slate-50" },
          { label: "Completion", val: `${stats.completionRate}%`, color: "text-slate-900", bg: "bg-slate-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-slate-200/80`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Urgent recommendations */}
      {(criticalSuggestions.length > 0 || highSuggestions.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-900">Urgent Actions Required</h3>
          </div>
          <div className="space-y-2">
            {[...criticalSuggestions, ...highSuggestions].map((s, i) => {
              const cfg = SEV[s.severity];
              return (
                <div key={i} className={`flex gap-3 p-3 rounded-lg border ${cfg.banner}`}>
                  <div className={`w-1.5 rounded-full self-stretch ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${cfg.text}`}>{s.message}</p>
                      <Badge className={`${cfg.badge} shrink-0`}>{s.severity}</Badge>
                    </div>
                    {s.affectedTasks && s.affectedTasks.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {s.affectedTasks.slice(0, 3).map((t) => (
                          <span key={t} className="text-[11px] bg-white/80 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delayed tasks */}
      {delayedTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-slate-900">Overdue Tasks</h3>
            </div>
            <Badge className="bg-red-100 text-red-700 border-red-200">{delayedTasks.length} overdue</Badge>
          </div>
          <div className="space-y-2">
            {delayedTasks.map(({ task, daysOverdue, severity }) => {
              const cfg = SEV[severity];
              return (
                <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border ${cfg.banner}`}>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{task.title}</div>
                    <div className="text-xs text-slate-500">Was due {formatDate(task.endDate)} · {task.owner ?? "Unassigned"}</div>
                  </div>
                  <Badge className={cfg.badge}>{daysOverdue}d late</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Critical path */}
      {criticalPath.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-slate-900">Critical Dependency Chain</h3>
            </div>
            <Badge className="bg-violet-100 text-violet-700 border-violet-200">{criticalPath.length} tasks</Badge>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            This is the longest sequence of dependent tasks. Any delay here delays the entire project.
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {criticalPath.map((task, i) => (
              <div key={task.id} className="flex items-center gap-1.5">
                <div className={cn(
                  "px-2.5 py-1.5 rounded-lg border text-xs font-medium",
                  task.status === "DONE" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                  task.status === "BLOCKED" ? "bg-red-50 border-red-200 text-red-700" :
                  task.status === "IN_PROGRESS" ? "bg-blue-50 border-blue-200 text-blue-700" :
                  "bg-slate-50 border-slate-200 text-slate-600"
                )}>
                  {task.title}
                </div>
                {i < criticalPath.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                )}
              </div>
            ))}
          </div>
          {criticalPath.some((t) => t.status === "BLOCKED") && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              A task on the critical path is BLOCKED. This will delay the project end date.
            </div>
          )}
        </div>
      )}

      {/* Bottlenecks */}
      {bottlenecks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-slate-900">Dependency Bottlenecks</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            These tasks are prerequisites for many others. Delays cascade across the project.
          </p>
          <div className="space-y-2">
            {bottlenecks.map(({ task, totalDependents, blockedDependents }) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">{task.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Blocks {totalDependents} task{totalDependents !== 1 ? "s" : ""}
                    {blockedDependents > 0 && (
                      <span className="text-red-500 font-medium"> · {blockedDependents} currently blocked</span>
                    )}
                  </div>
                </div>
                <Badge className={
                  task.status === "DONE" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                  task.status === "BLOCKED" ? "bg-red-100 text-red-700 border-red-200" :
                  "bg-blue-100 text-blue-700 border-blue-200"
                }>
                  {task.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other suggestions */}
      {otherSuggestions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Other Recommendations</h3>
          </div>
          <div className="space-y-2">
            {otherSuggestions.map((s, i) => {
              const cfg = SEV[s.severity];
              return (
                <div key={i} className="flex items-start gap-2.5 text-sm text-slate-700 py-2 border-b border-slate-100 last:border-0">
                  <span className="mt-0.5 text-base">{cfg.icon}</span>
                  <span>{s.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All clear */}
      {!delayedTasks.length && !suggestions.length && !riskFlags.length && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-10 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="font-semibold text-emerald-800 mb-1">No issues detected</h3>
          <p className="text-sm text-emerald-600">NAMO found no significant risks or delays. The project is healthy.</p>
        </div>
      )}
    </div>
  );
}
