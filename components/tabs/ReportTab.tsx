"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ProjectReport, ReportPeriod } from "@/lib/report";
import { HealthScore } from "../HealthScore";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  FileText,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Brain,
  Zap,
  ClipboardCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function ReportTab({ projectId }: { projectId: string }) {
  const [period, setPeriod] = useState<ReportPeriod>("weekly");

  const { data: report, isLoading, error } = useQuery<ProjectReport>({
    queryKey: ["report", projectId, period],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/report?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
  });

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(buildReportText(report));
    toast.success("Report copied to clipboard");
  };

  const periodCompletedLabel =
    period === "daily" ? "Completed Today" : period === "weekly" ? "Completed This Week" : "Completed This Month";

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        {/* Period toggle skeleton */}
        <div className="flex gap-2 mb-5">
          {PERIODS.map((p) => (
            <div key={p.value} className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 animate-pulse">
            <div className="h-3 bg-slate-100 rounded w-32 mb-4" />
            <div className="space-y-2">
              <div className="h-2.5 bg-slate-100 rounded w-full" />
              <div className="h-2.5 bg-slate-100 rounded w-4/5" />
              <div className="h-2.5 bg-slate-100 rounded w-3/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 text-sm">Failed to generate report. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{report.period.charAt(0).toUpperCase() + report.period.slice(1)} Status Report</h2>
            <p className="text-xs text-slate-400">
              {report.reportPeriod} · Generated {report.generatedAt}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="w-3.5 h-3.5" />
          Copy
        </Button>
      </div>

      {/* Period toggle */}
      <div className="flex gap-1.5 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              period === p.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Executive Summary */}
        <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
          <SectionHeader label="Executive Summary" />
          <div className="flex gap-5 items-start">
            <HealthScore score={report.healthScore} label={report.healthLabel} size="md" />
            <p className="text-sm text-slate-600 leading-relaxed flex-1 mt-1">{report.executiveSummary}</p>
          </div>
        </section>

        {/* Completed in period */}
        <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900">{periodCompletedLabel}</h3>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 ml-auto">
              {report.completedInPeriod.length} tasks
            </Badge>
          </div>
          {report.completedInPeriod.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No tasks completed in this period.</p>
          ) : (
            <ul className="space-y-1.5">
              {report.completedInPeriod.map((task) => (
                <li key={task.id} className="flex items-center gap-2.5 text-sm">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  </div>
                  <span className="text-slate-700">{task.title}</span>
                  {task.owner && (
                    <span className="text-slate-400 text-xs ml-auto shrink-0">{task.owner}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* In Progress */}
        <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-900">In Progress</h3>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 ml-auto">
              {report.inProgressTasks.length} tasks
            </Badge>
          </div>
          {report.inProgressTasks.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No tasks in progress.</p>
          ) : (
            <ul className="space-y-1.5">
              {report.inProgressTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2.5 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <span className="text-slate-700">{task.title}</span>
                  <span className="text-slate-400 text-xs ml-auto shrink-0">Due {formatDate(task.endDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* In Review */}
        {report.inReviewTasks.length > 0 && (
          <section className="bg-purple-50 rounded-xl border border-purple-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-purple-800">Pending Review</h3>
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 ml-auto">
                {report.inReviewTasks.length} tasks
              </Badge>
            </div>
            <ul className="space-y-1.5">
              {report.inReviewTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2 text-sm text-purple-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  {task.title}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* At Risk / Blocked */}
        {(report.atRiskTasks.length > 0 || report.blockedTasks.length > 0) && (
          <section className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-red-800">At Risk & Blocked</h3>
            </div>
            <div className="space-y-4">
              {report.blockedTasks.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-2">Blocked</div>
                  <ul className="space-y-1">
                    {report.blockedTasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2 text-sm text-red-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        {task.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {report.atRiskTasks.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mb-2">Overdue</div>
                  <ul className="space-y-1">
                    {report.atRiskTasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2 text-sm text-orange-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                        <span>{task.title}</span>
                        <span className="text-xs ml-auto text-orange-500">Was due {formatDate(task.endDate)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Top Risks */}
        {report.topRisks.length > 0 && (
          <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-900">Top Risks</h3>
            </div>
            <ul className="space-y-3">
              {report.topRisks.map((risk) => (
                <li key={risk.id} className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div>
                    <div className="font-medium text-slate-800">{risk.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Probability: {risk.probability} · Impact: {risk.impact} · {risk.status}
                    </div>
                    {risk.mitigation && (
                      <p className="text-xs text-slate-500 mt-1 bg-slate-50 rounded px-2 py-1">
                        Mitigation: {risk.mitigation}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* NAMO Recommendations */}
        <section className="bg-white rounded-xl border border-violet-200/80 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">NAMO Recommendations</h3>
            <span className="ml-auto text-[11px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">
              AI-generated
            </span>
          </div>
          {report.aiRecommendations.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No recommendations at this time.</p>
          ) : (
            <ul className="space-y-2.5">
              {report.aiRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Zap className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">{label}</h3>
  );
}

function buildReportText(report: ProjectReport): string {
  const periodLabel = report.period.charAt(0).toUpperCase() + report.period.slice(1);
  const completedLabel =
    report.period === "daily" ? "Completed Today" : report.period === "weekly" ? "Completed This Week" : "Completed This Month";

  const lines: string[] = [
    `# ${periodLabel} Status Report — ${report.projectName}`,
    `Period: ${report.reportPeriod}`,
    `Generated: ${report.generatedAt}`,
    `Health Score: ${report.healthScore}/100 (${report.healthLabel})`,
    "",
    "## Executive Summary",
    report.executiveSummary,
    "",
    `## ${completedLabel}`,
    ...(report.completedInPeriod.length > 0
      ? report.completedInPeriod.map((t) => `- ✓ ${t.title}${t.owner ? ` (${t.owner})` : ""}`)
      : ["No tasks completed in this period."]),
    "",
    "## In Progress",
    ...(report.inProgressTasks.length > 0
      ? report.inProgressTasks.map((t) => `- ${t.title}`)
      : ["No tasks in progress."]),
  ];

  if (report.inReviewTasks.length > 0) {
    lines.push("", "## Pending Review");
    report.inReviewTasks.forEach((t) => lines.push(`- 🔍 ${t.title}`));
  }

  lines.push(
    "",
    "## At Risk",
    ...(report.atRiskTasks.length > 0 ? report.atRiskTasks.map((t) => `- ⚠️ ${t.title}`) : ["None."]),
    "",
    "## Blocked",
    ...(report.blockedTasks.length > 0 ? report.blockedTasks.map((t) => `- 🚫 ${t.title}`) : ["None."]),
    "",
    "## Top Risks",
    ...(report.topRisks.length > 0
      ? report.topRisks.map((r) => `- ${r.title} (P:${r.probability} I:${r.impact} ${r.status})`)
      : ["No active risks."]),
    "",
    "## NAMO Recommendations",
    ...report.aiRecommendations.map((r) => `→ ${r}`)
  );

  return lines.join("\n");
}
