import type { Project, Task, Risk } from "@/app/generated/prisma/client";
import type { ProjectInsights } from "./insights";
import { format, subDays } from "date-fns";

export type ReportPeriod = "daily" | "weekly" | "monthly";

export interface ProjectReport {
  generatedAt: string;
  projectName: string;
  reportPeriod: string;
  period: ReportPeriod;
  periodDays: number;
  executiveSummary: string;
  completedInPeriod: Task[];
  inProgressTasks: Task[];
  atRiskTasks: Task[];
  blockedTasks: Task[];
  inReviewTasks: Task[];
  topRisks: Risk[];
  aiRecommendations: string[];
  healthScore: number;
  healthLabel: string;
  stats: ProjectInsights["stats"];
}

// Legacy alias so existing imports don't break
export type WeeklyReport = ProjectReport;

const PERIOD_DAYS: Record<ReportPeriod, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

const PERIOD_LABEL: Record<ReportPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function generateReport(
  project: Project,
  tasks: Task[],
  risks: Risk[],
  insights: ProjectInsights,
  period: ReportPeriod = "weekly"
): ProjectReport {
  const now = new Date();
  const days = PERIOD_DAYS[period];
  const periodStart = subDays(now, days);

  const completedInPeriod = tasks.filter((t) => {
    if (t.status !== "DONE" || !t.completedAt) return false;
    return new Date(t.completedAt) >= periodStart;
  });

  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED");
  const inReviewTasks = tasks.filter((t) => t.status === "IN_REVIEW");
  const atRiskTasks = insights.delayedTasks
    .filter((d) => d.severity !== "LOW")
    .map((d) => d.task);

  const topRisks = risks
    .filter((r) => r.status !== "RESOLVED")
    .sort((a, b) => {
      const score = (p: string, i: string) => {
        const pv = p === "HIGH" ? 3 : p === "MEDIUM" ? 2 : 1;
        const iv = i === "HIGH" ? 3 : i === "MEDIUM" ? 2 : 1;
        return pv * iv;
      };
      return score(b.probability, b.impact) - score(a.probability, a.impact);
    })
    .slice(0, 3);

  // Executive summary
  const { stats, healthLabel, healthScore } = insights;
  const summaryParts: string[] = [];

  summaryParts.push(
    `Project "${project.name}" is currently ${healthLabel.toLowerCase()} with a health score of ${healthScore}/100.`
  );
  summaryParts.push(
    `${stats.completionRate}% of tasks are complete (${stats.done}/${stats.total}).`
  );

  const periodLabel = period === "daily" ? "today" : `this ${period === "weekly" ? "week" : "month"}`;

  if (completedInPeriod.length > 0) {
    summaryParts.push(
      `${completedInPeriod.length} task(s) were completed ${periodLabel}.`
    );
  } else {
    summaryParts.push(`No tasks completed ${periodLabel}.`);
  }

  if (inReviewTasks.length > 0) {
    summaryParts.push(`${inReviewTasks.length} task(s) are pending review.`);
  }

  if (stats.blocked > 0) {
    summaryParts.push(
      `⚠️ ${stats.blocked} task(s) are currently blocked and require immediate attention.`
    );
  }

  if (stats.overdue > 0) {
    summaryParts.push(`🔴 ${stats.overdue} task(s) are overdue.`);
  }

  const projectEnd = new Date(project.endDate);
  const daysUntilEnd = Math.floor(
    (projectEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysUntilEnd > 0) {
    summaryParts.push(
      `Project deadline: ${format(projectEnd, "MMM d, yyyy")} (${daysUntilEnd} days remaining).`
    );
  } else if (daysUntilEnd < 0) {
    summaryParts.push(
      `⚠️ Project deadline was ${format(projectEnd, "MMM d, yyyy")} — ${Math.abs(daysUntilEnd)} days ago.`
    );
  }

  const aiRecommendations = insights.suggestions.slice(0, 5).map((s) => s.message);
  if (aiRecommendations.length === 0) {
    aiRecommendations.push(
      "Project is on track. Continue current pace and monitor upcoming milestones."
    );
  }

  const periodLabel2 =
    period === "daily"
      ? format(now, "MMM d, yyyy")
      : `${format(periodStart, "MMM d")} – ${format(now, "MMM d, yyyy")}`;

  return {
    generatedAt: format(now, "MMMM d, yyyy 'at' h:mm a"),
    projectName: project.name,
    reportPeriod: periodLabel2,
    period,
    periodDays: days,
    executiveSummary: summaryParts.join(" "),
    completedInPeriod,
    inProgressTasks,
    atRiskTasks,
    blockedTasks,
    inReviewTasks,
    topRisks,
    aiRecommendations,
    healthScore,
    healthLabel,
    stats,
  };
}

// ─── Portfolio Report ────────────────────────────────────────────────────────

export interface PortfolioProjectSummary {
  id: string;
  name: string;
  healthScore: number;
  healthLabel: string;
  completionRate: number;
  done: number;
  total: number;
  blocked: number;
  overdue: number;
  inReview: number;
  completedInPeriod: number;
  status: string;
  endDate: string;
}

export interface PortfolioReport {
  generatedAt: string;
  reportPeriod: string;
  period: ReportPeriod;
  periodLabel: string;
  projects: PortfolioProjectSummary[];
  totals: {
    projects: number;
    tasks: number;
    done: number;
    blocked: number;
    overdue: number;
    inReview: number;
    completedInPeriod: number;
    avgHealth: number;
  };
  criticalProjects: PortfolioProjectSummary[];
  atRiskProjects: PortfolioProjectSummary[];
  topRecommendations: string[];
}

export function generatePortfolioReport(
  projectsWithData: Array<{
    project: Project;
    tasks: Task[];
    risks: Risk[];
    insights: ProjectInsights;
  }>,
  period: ReportPeriod = "weekly"
): PortfolioReport {
  const now = new Date();
  const days = PERIOD_DAYS[period];
  const periodStart = subDays(now, days);

  const summaries: PortfolioProjectSummary[] = projectsWithData.map(
    ({ project, tasks, insights }) => {
      const completedInPeriod = tasks.filter(
        (t) => t.status === "DONE" && t.completedAt && new Date(t.completedAt) >= periodStart
      ).length;

      return {
        id: project.id,
        name: project.name,
        healthScore: insights.healthScore,
        healthLabel: insights.healthLabel,
        completionRate: insights.stats.completionRate,
        done: insights.stats.done,
        total: insights.stats.total,
        blocked: insights.stats.blocked,
        overdue: insights.stats.overdue,
        inReview: insights.stats.inReview,
        completedInPeriod,
        status: project.status,
        endDate: project.endDate.toString(),
      };
    }
  );

  const totals = {
    projects: summaries.length,
    tasks: summaries.reduce((s, p) => s + p.total, 0),
    done: summaries.reduce((s, p) => s + p.done, 0),
    blocked: summaries.reduce((s, p) => s + p.blocked, 0),
    overdue: summaries.reduce((s, p) => s + p.overdue, 0),
    inReview: summaries.reduce((s, p) => s + p.inReview, 0),
    completedInPeriod: summaries.reduce((s, p) => s + p.completedInPeriod, 0),
    avgHealth:
      summaries.length > 0
        ? Math.round(summaries.reduce((s, p) => s + p.healthScore, 0) / summaries.length)
        : 0,
  };

  const criticalProjects = summaries.filter((p) => p.healthLabel === "Critical");
  const atRiskProjects = summaries.filter((p) => p.healthLabel === "At Risk");

  // Aggregate recommendations across all projects
  const allRecs: string[] = [];
  projectsWithData.forEach(({ project, insights }) => {
    insights.suggestions.slice(0, 2).forEach((s) => {
      allRecs.push(`[${project.name}] ${s.message}`);
    });
  });
  const topRecommendations = allRecs.slice(0, 6);
  if (topRecommendations.length === 0) {
    topRecommendations.push("All projects are on track. No immediate action required.");
  }

  const periodLabelStr =
    period === "daily"
      ? format(now, "MMM d, yyyy")
      : `${format(periodStart, "MMM d")} – ${format(now, "MMM d, yyyy")}`;

  return {
    generatedAt: format(now, "MMMM d, yyyy 'at' h:mm a"),
    reportPeriod: periodLabelStr,
    period,
    periodLabel: PERIOD_LABEL[period],
    projects: summaries.sort((a, b) => a.healthScore - b.healthScore),
    totals,
    criticalProjects,
    atRiskProjects,
    topRecommendations,
  };
}
