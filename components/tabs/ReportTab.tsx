"use client";

import { useQuery } from "@tanstack/react-query";
import type { WeeklyReport } from "@/lib/report";
import { HealthScore } from "../HealthScore";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { FileText, Copy, CheckCircle2, AlertTriangle, Clock, TrendingDown, ShieldAlert } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export function ReportTab({ projectId }: { projectId: string }) {
  const { data: report, isLoading, error } = useQuery<WeeklyReport>({
    queryKey: ["report", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/report`);
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
  });

  const handleCopy = () => {
    if (!report) return;
    const text = buildReportText(report);
    navigator.clipboard.writeText(text);
    toast.success("Report copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-500 text-sm">Generating weekly report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">Failed to generate report. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Weekly Status Report</h2>
            <p className="text-xs text-slate-500">
              Period: {report.reportPeriod} · Generated {report.generatedAt}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="w-3.5 h-3.5" />
          Copy Report
        </Button>
      </div>

      {/* Report Body */}
      <div className="space-y-5">
        {/* Executive Summary */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Executive Summary</h3>
          <div className="flex gap-4 items-start">
            <HealthScore score={report.healthScore} label={report.healthLabel} size="md" />
            <p className="text-sm text-slate-700 leading-relaxed flex-1">{report.executiveSummary}</p>
          </div>
        </section>

        {/* Completed This Week */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-semibold text-slate-700">Completed This Week</h3>
            <Badge className="bg-green-100 text-green-700 border-green-200 ml-auto">
              {report.completedThisWeek.length} tasks
            </Badge>
          </div>
          {report.completedThisWeek.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No tasks completed this week.</p>
          ) : (
            <ul className="space-y-1">
              {report.completedThisWeek.map((task) => (
                <li key={task.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-green-500">✓</span>
                  <span>{task.title}</span>
                  {task.owner && <span className="text-slate-400 text-xs ml-auto">{task.owner}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* In Progress */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-700">Currently In Progress</h3>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 ml-auto">
              {report.inProgressTasks.length} tasks
            </Badge>
          </div>
          {report.inProgressTasks.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No tasks in progress.</p>
          ) : (
            <ul className="space-y-1.5">
              {report.inProgressTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <span className="text-slate-700">{task.title}</span>
                  <span className="text-slate-400 text-xs ml-auto">Due {formatDate(task.endDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* At Risk / Blocked */}
        {(report.atRiskTasks.length > 0 || report.blockedTasks.length > 0) && (
          <section className="bg-red-50 rounded-xl border border-red-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-red-800">At Risk & Blocked</h3>
            </div>
            {report.blockedTasks.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1.5">Blocked</div>
                <ul className="space-y-1">
                  {report.blockedTasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-2 text-sm text-red-700">
                      <span>🚫</span>
                      <span>{task.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.atRiskTasks.length > 0 && (
              <div>
                <div className="text-xs font-medium text-orange-600 uppercase tracking-wide mb-1.5">Overdue</div>
                <ul className="space-y-1">
                  {report.atRiskTasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-2 text-sm text-orange-700">
                      <span>⚠️</span>
                      <span>{task.title}</span>
                      <span className="text-xs ml-auto">Was due {formatDate(task.endDate)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Top Risks */}
        {report.topRisks.length > 0 && (
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700">Top Risks</h3>
            </div>
            <ul className="space-y-2">
              {report.topRisks.map((risk) => (
                <li key={risk.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5">⚠️</span>
                  <div>
                    <span className="font-medium text-slate-800">{risk.title}</span>
                    <span className="text-slate-500 ml-2 text-xs">
                      P:{risk.probability} · I:{risk.impact} · {risk.status}
                    </span>
                    {risk.mitigation && (
                      <p className="text-xs text-slate-500 mt-0.5">Mitigation: {risk.mitigation}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* AI Recommendations */}
        <section className="bg-indigo-50 rounded-xl border border-indigo-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤖</span>
            <h3 className="text-sm font-semibold text-indigo-800">AI Recommendations</h3>
          </div>
          <ul className="space-y-2">
            {report.aiRecommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-indigo-700">
                <span className="mt-0.5 text-indigo-400">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function buildReportText(report: WeeklyReport): string {
  const lines: string[] = [
    `# Weekly Status Report — ${report.projectName}`,
    `Period: ${report.reportPeriod}`,
    `Generated: ${report.generatedAt}`,
    `Health Score: ${report.healthScore}/100 (${report.healthLabel})`,
    "",
    "## Executive Summary",
    report.executiveSummary,
    "",
    "## Completed This Week",
    ...(report.completedThisWeek.length > 0
      ? report.completedThisWeek.map((t) => `- ✓ ${t.title}${t.owner ? ` (${t.owner})` : ""}`)
      : ["- No tasks completed this week."]),
    "",
    "## In Progress",
    ...(report.inProgressTasks.length > 0
      ? report.inProgressTasks.map((t) => `- ${t.title}`)
      : ["- No tasks in progress."]),
    "",
    "## At Risk",
    ...(report.atRiskTasks.length > 0 ? report.atRiskTasks.map((t) => `- ⚠️ ${t.title}`) : ["- None."]),
    "",
    "## Blocked",
    ...(report.blockedTasks.length > 0 ? report.blockedTasks.map((t) => `- 🚫 ${t.title}`) : ["- None."]),
    "",
    "## Top Risks",
    ...(report.topRisks.length > 0
      ? report.topRisks.map((r) => `- ${r.title} (P:${r.probability} I:${r.impact} Status:${r.status})`)
      : ["- No active risks."]),
    "",
    "## AI Recommendations",
    ...report.aiRecommendations.map((r) => `→ ${r}`),
  ];
  return lines.join("\n");
}
