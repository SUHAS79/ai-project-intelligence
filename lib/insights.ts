import type { Task, TaskDependency, Risk } from "@/app/generated/prisma/client";

export type TaskWithDeps = Task & {
  dependsOn: (TaskDependency & { dependency: Task })[];
  dependedOnBy: (TaskDependency & { dependent: Task })[];
};

export type RiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface DelayedTask {
  task: Task;
  daysOverdue: number;
  severity: RiskSeverity;
}

export interface CriticalPathNode {
  task: Task;
  slack: number; // days of slack (0 = on critical path)
}

export interface BottleneckTask {
  task: Task;
  blockedDependents: number;
  totalDependents: number;
}

export interface RiskFlag {
  riskId: string;
  title: string;
  severity: RiskSeverity;
  message: string;
}

export interface Suggestion {
  type: "timeline" | "ownership" | "risk" | "blocking" | "general";
  severity: RiskSeverity;
  message: string;
  affectedTasks?: string[];
}

export interface ProjectInsights {
  healthScore: number; // 0-100
  healthLabel: "Healthy" | "At Risk" | "Critical";
  delayedTasks: DelayedTask[];
  criticalPath: Task[];
  criticalPathLength: number;
  bottlenecks: BottleneckTask[];
  riskFlags: RiskFlag[];
  suggestions: Suggestion[];
  stats: {
    total: number;
    done: number;
    inProgress: number;
    blocked: number;
    todo: number;
    inReview: number;
    overdue: number;
    completionRate: number;
  };
}

function getDelayedTasks(tasks: Task[]): DelayedTask[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return tasks
    .filter((t) => t.status !== "DONE" && t.status !== "IN_REVIEW" && new Date(t.endDate) < today)
    .map((t) => {
      const daysOverdue = Math.floor(
        (today.getTime() - new Date(t.endDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      let severity: RiskSeverity = "LOW";
      if (daysOverdue >= 14) severity = "CRITICAL";
      else if (daysOverdue >= 7) severity = "HIGH";
      else if (daysOverdue >= 3) severity = "MEDIUM";
      return { task: t, daysOverdue, severity };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

function findCriticalPath(tasks: TaskWithDeps[]): Task[] {
  // Build adjacency map: taskId -> list of tasks that depend on it
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Compute earliest finish time (EFT) via topological sort + DP
  const eft = new Map<string, number>();
  const duration = (t: Task) =>
    Math.max(
      1,
      Math.ceil(
        (new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

  // Topological order (Kahn's algorithm)
  const inDegree = new Map<string, number>();
  tasks.forEach((t) => inDegree.set(t.id, 0));
  tasks.forEach((t) => {
    t.dependsOn.forEach(() => {
      inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
    });
  });

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    topoOrder.push(id);
    const task = taskMap.get(id);
    if (!task) continue;
    task.dependedOnBy.forEach((dep) => {
      const newDeg = (inDegree.get(dep.dependentId) ?? 1) - 1;
      inDegree.set(dep.dependentId, newDeg);
      if (newDeg === 0) queue.push(dep.dependentId);
    });
  }

  // Forward pass: compute earliest finish
  topoOrder.forEach((id) => {
    const task = taskMap.get(id);
    if (!task) return;
    const maxDepEft = task.dependsOn.reduce((max, dep) => {
      return Math.max(max, eft.get(dep.dependencyId) ?? 0);
    }, 0);
    eft.set(id, maxDepEft + duration(task));
  });

  // Find the critical path by backtracking from the node with max EFT
  const maxEft = Math.max(...Array.from(eft.values()));
  const endNode = topoOrder.findLast((id) => eft.get(id) === maxEft);
  if (!endNode) return [];

  // Backtrack
  const criticalPath: Task[] = [];
  let current = endNode;
  while (current) {
    const task = taskMap.get(current);
    if (!task) break;
    criticalPath.unshift(task);

    const prevId = task.dependsOn.reduce(
      (best, dep) => {
        const depEft = eft.get(dep.dependencyId) ?? 0;
        const bestEft = best ? (eft.get(best) ?? 0) : -1;
        return depEft > bestEft ? dep.dependencyId : best;
      },
      null as string | null
    );

    if (!prevId) break;
    current = prevId;
  }

  return criticalPath;
}

function findBottlenecksFixed(tasks: TaskWithDeps[]): BottleneckTask[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  return tasks
    .map((t) => {
      const totalDependents = t.dependedOnBy.length;
      const blockedDependents = t.dependedOnBy.filter(
        (dep) => taskMap.get(dep.dependentId)?.status === "BLOCKED"
      ).length;
      return { task: t, blockedDependents, totalDependents };
    })
    .filter((b) => b.totalDependents > 1 && b.task.status !== "DONE")
    .sort(
      (a, b) =>
        b.blockedDependents - a.blockedDependents ||
        b.totalDependents - a.totalDependents
    )
    .slice(0, 5);
}

function generateRiskFlags(risks: Risk[]): RiskFlag[] {
  return risks
    .filter((r) => r.status !== "RESOLVED")
    .map((r) => {
      let severity: RiskSeverity = "LOW";
      const p = r.probability;
      const i = r.impact;
      if (p === "HIGH" && i === "HIGH") severity = "CRITICAL";
      else if (p === "HIGH" || i === "HIGH") severity = "HIGH";
      else if (p === "MEDIUM" || i === "MEDIUM") severity = "MEDIUM";

      const hasNoMitigation = !r.mitigation || r.mitigation.trim() === "";
      const message =
        r.status === "OPEN" && hasNoMitigation
          ? `⚠️ ${r.title} — No mitigation plan. Probability: ${p}, Impact: ${i}`
          : `${r.title} — ${r.status}. Probability: ${p}, Impact: ${i}`;

      return { riskId: r.id, title: r.title, severity, message };
    })
    .sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return order[a.severity] - order[b.severity];
    });
}

function generateSuggestions(
  tasks: Task[],
  delayedTasks: DelayedTask[],
  risks: Risk[],
  bottlenecks: BottleneckTask[]
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalActive = tasks.filter((t) => t.status !== "DONE").length;
  const overdueCount = delayedTasks.length;

  // 1. Timeline review if >30% tasks are overdue
  if (totalActive > 0 && overdueCount / totalActive > 0.3) {
    suggestions.push({
      type: "timeline",
      severity: "HIGH",
      message: `${Math.round((overdueCount / totalActive) * 100)}% of active tasks are overdue. Consider revising the project timeline or redistributing workload.`,
    });
  }

  // 2. Unowned tasks
  const unownedTasks = tasks.filter(
    (t) => !t.owner && t.status !== "DONE"
  );
  if (unownedTasks.length > 0) {
    suggestions.push({
      type: "ownership",
      severity: "MEDIUM",
      message: `${unownedTasks.length} task(s) have no assigned owner. Unowned tasks are 2x more likely to be delayed.`,
      affectedTasks: unownedTasks.map((t) => t.title),
    });
  }

  // 3. No risks logged
  if (risks.length === 0) {
    suggestions.push({
      type: "risk",
      severity: "MEDIUM",
      message:
        "No risks have been logged. Schedule a risk review session to surface hidden threats.",
    });
  }

  // 4. Critical + blocked tasks
  const criticalBlocked = tasks.filter(
    (t) => t.priority === "CRITICAL" && t.status === "BLOCKED"
  );
  criticalBlocked.forEach((t) => {
    suggestions.push({
      type: "blocking",
      severity: "CRITICAL",
      message: `CRITICAL task "${t.title}" is BLOCKED. This needs immediate attention to avoid cascading delays.`,
      affectedTasks: [t.title],
    });
  });

  // 5. High-priority blocked tasks
  const highBlocked = tasks.filter(
    (t) => t.priority === "HIGH" && t.status === "BLOCKED"
  );
  if (highBlocked.length > 0) {
    suggestions.push({
      type: "blocking",
      severity: "HIGH",
      message: `${highBlocked.length} HIGH priority task(s) are BLOCKED. Review and resolve blockers to maintain momentum.`,
      affectedTasks: highBlocked.map((t) => t.title),
    });
  }

  // 6. Bottleneck task not done but lots of dependents
  bottlenecks.slice(0, 2).forEach((b) => {
    if (b.totalDependents >= 3) {
      suggestions.push({
        type: "blocking",
        severity: "HIGH",
        message: `"${b.task.title}" is a bottleneck with ${b.totalDependents} dependent tasks. Prioritize completing it.`,
        affectedTasks: [b.task.title],
      });
    }
  });

  // 7. Upcoming deadline (tasks due in 3 days that are not done)
  const soonTasks = tasks.filter((t) => {
    if (t.status === "DONE") return false;
    const daysLeft = Math.floor(
      (new Date(t.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft >= 0 && daysLeft <= 3;
  });
  if (soonTasks.length > 0) {
    suggestions.push({
      type: "timeline",
      severity: "MEDIUM",
      message: `${soonTasks.length} task(s) are due within 3 days and not yet complete.`,
      affectedTasks: soonTasks.map((t) => t.title),
    });
  }

  return suggestions.sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return order[a.severity] - order[b.severity];
  });
}

function computeHealthScore(
  tasks: Task[],
  delayedTasks: DelayedTask[],
  risks: Risk[]
): number {
  if (tasks.length === 0) return 100;

  // Component 1: Task health (40%)
  const done = tasks.filter((t) => t.status === "DONE").length;
  const blocked = tasks.filter((t) => t.status === "BLOCKED").length;
  const overdue = delayedTasks.length;
  const total = tasks.length;

  const completionRate = done / total;
  const blockageRate = blocked / total;
  const overdueRate = overdue / total;
  const taskScore =
    Math.max(0, completionRate * 100 - blockageRate * 30 - overdueRate * 40) *
    0.4;

  // Component 2: Risk health (30%)
  const criticalRisks = risks.filter(
    (r) =>
      r.probability === "HIGH" && r.impact === "HIGH" && r.status !== "RESOLVED"
  ).length;
  const highRisks = risks.filter(
    (r) =>
      (r.probability === "HIGH" || r.impact === "HIGH") &&
      r.status !== "RESOLVED"
  ).length;
  const riskPenalty = Math.min(100, criticalRisks * 25 + highRisks * 10);
  const riskScore = Math.max(0, 100 - riskPenalty) * 0.3;

  // Component 3: Progress momentum (30%)
  // IN_REVIEW counts as near-done (weight 0.8) for momentum
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const inReview = tasks.filter((t) => t.status === "IN_REVIEW").length;
  const progressRate = (done + inReview * 0.8 + inProgress * 0.5) / total;
  const momentumScore = progressRate * 100 * 0.3;

  const total_score = Math.round(taskScore + riskScore + momentumScore);
  return Math.min(100, Math.max(0, total_score));
}

export function computeInsights(
  tasks: TaskWithDeps[],
  risks: Risk[]
): ProjectInsights {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const delayedTasks = getDelayedTasks(tasks);
  const criticalPath = findCriticalPath(tasks);
  const bottlenecks = findBottlenecksFixed(tasks);
  const riskFlags = generateRiskFlags(risks);
  const suggestions = generateSuggestions(tasks, delayedTasks, risks, bottlenecks);
  const healthScore = computeHealthScore(tasks, delayedTasks, risks);

  const healthLabel: ProjectInsights["healthLabel"] =
    healthScore >= 70 ? "Healthy" : healthScore >= 40 ? "At Risk" : "Critical";

  const done = tasks.filter((t) => t.status === "DONE").length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW").length;
  const blocked = tasks.filter((t) => t.status === "BLOCKED").length;
  const todo = tasks.filter((t) => t.status === "TODO").length;
  const inReview = tasks.filter((t) => t.status === "IN_REVIEW").length;

  return {
    healthScore,
    healthLabel,
    delayedTasks,
    criticalPath,
    criticalPathLength: criticalPath.length,
    bottlenecks,
    riskFlags,
    suggestions,
    stats: {
      total: tasks.length,
      done,
      inProgress,
      blocked,
      todo,
      inReview,
      overdue: delayedTasks.length,
      completionRate: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0,
    },
  };
}
