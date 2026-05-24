"use client";

import { useState } from "react";
import { X, FileText, Copy, TrendingDown, CheckCircle2, AlertTriangle, ShieldAlert, Brain, Zap, Target } from "lucide-react";
import { toast } from "sonner";
import type { PortfolioReport, ReportPeriod } from "@/lib/report";
import { getHealthColor } from "@/lib/utils";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const HEALTH_BG: Record<string, string> = {
  Healthy: "bg-emerald-50 border-emerald-200",
  "At Risk": "bg-amber-50 border-amber-200",
  Critical: "bg-red-50 border-red-200",
};

const HEALTH_TEXT: Record<string, string> = {
  Healthy: "text-emerald-700",
  "At Risk": "text-amber-700",
  Critical: "text-red-700",
};

export function PortfolioReportModal({ onClose }: { onClose: () => void }) {
  const [period, setPeriod] = useState<ReportPeriod>("weekly");
  const [report, setReport] = useState<PortfolioReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchReport(p: ReportPeriod) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/portfolio?period=${p}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      setReport(await res.json());
    } catch {
      setError("Failed to generate portfolio report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePeriodChange(p: ReportPeriod) {
    setPeriod(p);
    fetchReport(p);
  }

  // Fetch on mount
  if (!report && !loading && !error) {
    fetchReport(period);
  }

  function handleCopy() {
    if (!report) return;
    const lines: string[] = [
      `# NAMO Portfolio ${report.periodLabel} Report`,
      `Period: ${report.reportPeriod}`,
      `Generated: ${report.generatedAt}`,
      "",
      `## Summary`,
      `Total Projects: ${report.totals.projects}`,
      `Total Tasks: ${report.totals.tasks}`,
      `Completed: ${report.totals.done}`,
      `Completed this period: ${report.totals.completedInPeriod}`,
      `Blocked: ${report.totals.blocked}`,
      `Overdue: ${report.totals.overdue}`,
      `Avg Portfolio Health: ${report.totals.avgHealth}/100`,
      "",
      "## Projects",
      ...report.projects.map(
        (p) =>
          `- ${p.name}: ${p.healthScore}/100 (${p.healthLabel}) — ${p.done}/${p.total} tasks done, ${p.blocked} blocked, ${p.overdue} overdue`
      ),
      "",
      "## NAMO Recommendations",
      ...report.topRecommendations.map((r) => `→ ${r}`),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Portfolio report copied to clipboard");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Portfolio Report</h2>
              <p className="text-xs text-slate-400">Cross-project summary — all projects</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Period toggle */}
        <div className="px-6 pt-4 pb-0 shrink-0">
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {loading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 animate-pulse">
                  <div className="h-3 bg-slate-200 rounded w-1/3 mb-3" />
                  <div className="h-2.5 bg-slate-200 rounded w-full mb-2" />
                  <div className="h-2.5 bg-slate-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {report && !loading && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-3">
                <StatTile
                  label="Projects"
                  value={report.totals.projects}
                  icon={<Target className="w-3.5 h-3.5" />}
                  color="text-slate-700"
                  bg="bg-slate-50"
                />
                <StatTile
                  label="Tasks done"
                  value={report.totals.done}
                  sub={`/ ${report.totals.tasks}`}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  color="text-emerald-600"
                  bg="bg-emerald-50"
                />
                <StatTile
                  label="Blocked"
                  value={report.totals.blocked}
                  icon={<AlertTriangle className="w-3.5 h-3.5" />}
                  color={report.totals.blocked > 0 ? "text-red-500" : "text-slate-400"}
                  bg={report.totals.blocked > 0 ? "bg-red-50" : "bg-slate-50"}
                />
                <StatTile
                  label="Avg health"
                  value={report.totals.avgHealth}
                  sub="/100"
                  icon={<Zap className="w-3.5 h-3.5" />}
                  color={getHealthColor(report.totals.avgHealth)}
                  bg="bg-violet-50"
                />
              </div>

              {/* This period */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {report.periodLabel === "Daily" ? "Today" : `This ${report.periodLabel.toLowerCase()}`}
                </p>
                <p className="text-sm text-slate-700">
                  <span className="text-2xl font-bold text-emerald-600 tabular-nums">{report.totals.completedInPeriod}</span>
                  {" "}tasks completed · {report.totals.overdue} overdue · {report.totals.inReview} in review
                </p>
                <p className="text-xs text-slate-400 mt-1">{report.reportPeriod}</p>
              </div>

              {/* Critical / at-risk callout */}
              {(report.criticalProjects.length > 0 || report.atRiskProjects.length > 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <p className="text-sm font-semibold text-amber-800">Projects needing attention</p>
                  </div>
                  <ul className="space-y-1">
                    {[...report.criticalProjects, ...report.atRiskProjects].map((p) => (
                      <li key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-amber-800">{p.name}</span>
                        <span className={`text-xs font-semibold ${HEALTH_TEXT[p.healthLabel] ?? "text-slate-600"}`}>
                          {p.healthLabel} ({p.healthScore}/100)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* All projects table */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">All Projects</p>
                <div className="space-y-2">
                  {report.projects.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border ${HEALTH_BG[p.healthLabel] ?? "bg-white border-slate-200"}`}
                    >
                      {/* Health score bar */}
                      <div className="w-8 shrink-0 text-center">
                        <span className={`text-sm font-bold tabular-nums ${getHealthColor(p.healthScore)}`}>
                          {p.healthScore}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {p.done}/{p.total} done · {p.blocked} blocked · {p.overdue} overdue
                          {p.completedInPeriod > 0 && ` · ${p.completedInPeriod} completed this ${report.period}`}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold shrink-0 ${HEALTH_TEXT[p.healthLabel] ?? "text-slate-600"}`}>
                        {p.healthLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {report.topRecommendations.length > 0 && (
                <div className="bg-white rounded-xl border border-violet-200/80 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                      <Brain className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">NAMO Recommendations</p>
                    <span className="ml-auto text-[11px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">AI-generated</span>
                  </div>
                  <ul className="space-y-2">
                    {report.topRecommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <Zap className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label, value, sub, icon, color, bg,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl p-3 ${bg}`}>
      <div className={`${color} mb-1`}>{icon}</div>
      <div className="flex items-baseline gap-0.5">
        <span className={`text-xl font-bold tabular-nums ${color}`}>{value}</span>
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
      </div>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
