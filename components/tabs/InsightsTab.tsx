"use client";

import { Task } from "@/app/generated/prisma/client";
import type { ProjectInsights } from "@/lib/insights";
import { HealthScore } from "../HealthScore";
import { Badge } from "../ui/Badge";
import {
  Brain,
  AlertTriangle,
  TrendingDown,
  GitBranch,
  Lightbulb,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface InsightsTabProps {
  insights: ProjectInsights;
  tasks: Task[];
}

const SEVERITY_CONFIG = {
  CRITICAL: { color: "text-red-600", bg: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-700 border-red-200", icon: "🔴" },
  HIGH: { color: "text-orange-600", bg: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-700 border-orange-200", icon: "🟠" },
  MEDIUM: { color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "🟡" },
  LOW: { color: "text-slate-600", bg: "bg-slate-50 border-slate-200", badge: "bg-slate-100 text-slate-700 border-slate-200", icon: "⚪" },
};

export function InsightsTab({ insights, tasks }: InsightsTabProps) {
  const {
    healthScore,
    healthLabel,
    delayedTasks,
    criticalPath,
    bottlenecks,
    riskFlags,
    suggestions,
    stats,
  } = insights;

  const hasIssues =
    delayedTasks.length > 0 ||
    suggestions.length > 0 ||
    riskFlags.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">AI Insights</h2>
          <p className="text-sm text-slate-500">
            Rule-based heuristic analysis · Last computed now
          </p>
        </div>
      </div>

      {/* Health + Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col items-center justify-center">
          <HealthScore score={healthScore} label={healthLabel} size="lg" showBar={false} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Task Breakdown</div>
          <div className="space-y-2">
            {[
              { label: "Done", value: stats.done, color: "bg-green-500" },
              { label: "In Progress", value: stats.inProgress, color: "bg-blue-500" },
              { label: "Blocked", value: stats.blocked, color: "bg-red-500" },
              { label: "To Do", value: stats.todo, color: "bg-slate-300" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-xs text-slate-600 flex-1">{item.label}</span>
                <span className="text-xs font-medium text-slate-900">{item.value}</span>
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: stats.total > 0 ? `${(item.value / stats.total) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Completion</div>
          <div className="text-4xl font-bold text-slate-900 mb-1">{stats.completionRate}%</div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-700"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="text-xs text-slate-500 mt-2">{stats.done} of {stats.total} tasks done</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Risk Summary</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Overdue tasks</span>
              <span className={`font-semibold ${stats.overdue > 0 ? "text-red-500" : "text-green-600"}`}>{stats.overdue}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Blocked tasks</span>
              <span className={`font-semibold ${stats.blocked > 0 ? "text-red-500" : "text-green-600"}`}>{stats.blocked}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">AI risk flags</span>
              <span className={`font-semibold ${riskFlags.length > 0 ? "text-orange-500" : "text-green-600"}`}>{riskFlags.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-indigo-500" />
            <h3 className="font-semibold text-slate-900">AI Recommendations</h3>
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 ml-auto">
              {suggestions.length} insight{suggestions.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <div className="space-y-3">
            {suggestions.map((s, i) => {
              const cfg = SEVERITY_CONFIG[s.severity];
              return (
                <div key={i} className={`flex gap-3 p-3 rounded-lg border ${cfg.bg}`}>
                  <span className="text-base mt-0.5">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-800">{s.message}</div>
                    {s.affectedTasks && s.affectedTasks.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {s.affectedTasks.slice(0, 3).map((t) => (
                          <span key={t} className="text-xs bg-white/70 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                            {t}
                          </span>
                        ))}
                        {s.affectedTasks.length > 3 && (
                          <span className="text-xs text-slate-400">+{s.affectedTasks.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <Badge className={cfg.badge}>{s.severity}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delayed Tasks */}
      {delayedTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-slate-900">Overdue Tasks</h3>
            <Badge className="bg-red-100 text-red-700 border-red-200 ml-auto">
              {delayedTasks.length} overdue
            </Badge>
          </div>
          <div className="space-y-2">
            {delayedTasks.map(({ task, daysOverdue, severity }) => {
              const cfg = SEVERITY_CONFIG[severity];
              return (
                <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border ${cfg.bg}`}>
                  <AlertCircle className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm truncate">{task.title}</div>
                    <div className="text-xs text-slate-500">Was due {formatDate(task.endDate)}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge className={cfg.badge}>{daysOverdue}d overdue</Badge>
                    <div className="text-xs text-slate-500 mt-1">{task.owner ?? "Unassigned"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Critical Path */}
      {criticalPath.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-4 h-4 text-purple-500" />
            <h3 className="font-semibold text-slate-900">Critical Path</h3>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 ml-auto">
              {criticalPath.length} tasks
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mb-3">
            This is the longest dependency chain. Delays here affect the entire project.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {criticalPath.map((task, i) => (
              <div key={task.id} className="flex items-center gap-2">
                <div
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                    task.status === "DONE"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : task.status === "BLOCKED"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-purple-50 border-purple-200 text-purple-700"
                  }`}
                >
                  {task.title}
                </div>
                {i < criticalPath.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottlenecks */}
      {bottlenecks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-slate-900">Bottleneck Tasks</h3>
          </div>
          <p className="text-sm text-slate-500 mb-3">
            These tasks have the most dependents. Delays in these tasks cascade across the project.
          </p>
          <div className="space-y-2">
            {bottlenecks.map(({ task, totalDependents, blockedDependents }) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 text-sm">{task.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {totalDependents} dependent task{totalDependents !== 1 ? "s" : ""}
                    {blockedDependents > 0 && (
                      <span className="text-red-500 ml-1.5">· {blockedDependents} blocked</span>
                    )}
                  </div>
                </div>
                <Badge
                  className={
                    task.status === "DONE"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : task.status === "BLOCKED"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : "bg-blue-100 text-blue-700 border-blue-200"
                  }
                >
                  {task.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All clear */}
      {!hasIssues && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-green-800 mb-1">Project looks healthy!</h3>
          <p className="text-sm text-green-600">No significant risks or delays detected. Keep up the good work.</p>
        </div>
      )}
    </div>
  );
}
