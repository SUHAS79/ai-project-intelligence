import type { Project, Task, Risk } from "@/app/generated/prisma/client";
import type { ProjectInsights } from "./insights";
import { format } from "date-fns";

export interface WeeklyReport {
  generatedAt: string;
  projectName: string;
  reportPeriod: string;
  executiveSummary: string;
  completedThisWeek: Task[];
  inProgressTasks: Task[];
  atRiskTasks: Task[];
  blockedTasks: Task[];
  topRisks: Risk[];
  aiRecommendations: string[];
  healthScore: number;
  healthLabel: string;
  stats: ProjectInsights["stats"];
}

export function generateReport(
  project: Project,
  tasks: Task[],
  risks: Risk[],
  insights: ProjectInsights
): WeeklyReport {
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);

  const completedThisWeek = tasks.filter((t) => {
    if (t.status !== "DONE" || !t.completedAt) return false;
    return new Date(t.completedAt) >= oneWeekAgo;
  });

  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED");
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

  // Build executive summary
  const { stats, healthLabel, healthScore } = insights;
  const summaryParts: string[] = [];

  summaryParts.push(
    `Project "${project.name}" is currently ${healthLabel.toLowerCase()} with a health score of ${healthScore}/100.`
  );
  summaryParts.push(
    `${stats.completionRate}% of tasks are complete (${stats.done}/${stats.total}).`
  );

  if (completedThisWeek.length > 0) {
    summaryParts.push(
      `${completedThisWeek.length} task(s) were completed this week.`
    );
  }

  if (stats.blocked > 0) {
    summaryParts.push(
      `⚠️ ${stats.blocked} task(s) are currently blocked and require immediate attention.`
    );
  }

  if (stats.overdue > 0) {
    summaryParts.push(
      `🔴 ${stats.overdue} task(s) are overdue.`
    );
  }

  const projectEnd = new Date(project.endDate);
  const daysUntilEnd = Math.floor(
    (projectEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysUntilEnd > 0) {
    summaryParts.push(`Project deadline: ${format(projectEnd, "MMM d, yyyy")} (${daysUntilEnd} days remaining).`);
  } else if (daysUntilEnd < 0) {
    summaryParts.push(`⚠️ Project deadline was ${format(projectEnd, "MMM d, yyyy")} — ${Math.abs(daysUntilEnd)} days ago.`);
  }

  // AI recommendations from insights
  const aiRecommendations = insights.suggestions
    .slice(0, 5)
    .map((s) => s.message);

  if (aiRecommendations.length === 0) {
    aiRecommendations.push(
      "Project is on track. Continue current pace and monitor upcoming milestones."
    );
  }

  return {
    generatedAt: format(now, "MMMM d, yyyy 'at' h:mm a"),
    projectName: project.name,
    reportPeriod: `${format(oneWeekAgo, "MMM d")} – ${format(now, "MMM d, yyyy")}`,
    executiveSummary: summaryParts.join(" "),
    completedThisWeek,
    inProgressTasks,
    atRiskTasks,
    blockedTasks,
    topRisks,
    aiRecommendations,
    healthScore,
    healthLabel,
    stats,
  };
}
