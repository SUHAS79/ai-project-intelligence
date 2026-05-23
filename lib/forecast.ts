import type { Task } from "@/app/generated/prisma/client";
import { addDays, format, parseISO, differenceInDays, startOfDay, eachDayOfInterval } from "date-fns";

export interface BurndownPoint {
  date: string;       // "May 24"
  planned: number;    // tasks remaining on plan
  actual: number | null;  // actual tasks remaining (null = future)
  forecast: number | null; // forecast remaining (null = past before cutover)
}

export interface ForecastSummary {
  velocityPerDay: number;       // tasks/day over last 14 days
  remainingTasks: number;       // tasks not yet DONE
  forecastCompletionDate: string | null;  // ISO date
  forecastDaysFromToday: number | null;  // negative = already past deadline
  plannedEndDate: string;
  isOnTrack: boolean;
  slippageDays: number;         // positive = late, negative = early
  confidenceLabel: "Low" | "Medium" | "High";
  completionPct: number;
}

export interface VelocityPoint {
  week: string;
  tasksCompleted: number;
}

export function computeBurndown(
  tasks: Task[],
  projectStart: Date,
  projectEnd: Date
): BurndownPoint[] {
  const today = startOfDay(new Date());
  const start = startOfDay(projectStart);
  const end = startOfDay(projectEnd);
  const total = tasks.length;

  if (total === 0) return [];

  // For each calendar day from start → end+buffer, compute planned & actual remaining
  const bufferDays = 10;
  const chartEnd = addDays(
    today > end ? today : end,
    bufferDays
  );

  const days = eachDayOfInterval({ start, end: chartEnd });
  if (days.length > 120) {
    // Only sample every N days if range is huge
    const step = Math.ceil(days.length / 60);
    const sampled = days.filter((_, i) => i % step === 0 || i === days.length - 1);
    return buildPoints(sampled, tasks, total, start, end, today);
  }
  return buildPoints(days, tasks, total, start, end, today);
}

function buildPoints(
  days: Date[],
  tasks: Task[],
  total: number,
  start: Date,
  end: Date,
  today: Date
): BurndownPoint[] {
  const projectDuration = differenceInDays(end, start) || 1;

  // Build actual burndown: for each day, how many tasks remained?
  // A task counts as done on its completedAt date
  const completedByDate = new Map<string, number>();
  tasks.forEach((t) => {
    if (t.status === "DONE" && t.completedAt) {
      const key = format(startOfDay(new Date(t.completedAt)), "yyyy-MM-dd");
      completedByDate.set(key, (completedByDate.get(key) ?? 0) + 1);
    }
  });

  // Compute velocity over last 14 days
  let recentCompleted = 0;
  for (let d = 0; d < 14; d++) {
    const key = format(addDays(today, -d), "yyyy-MM-dd");
    recentCompleted += completedByDate.get(key) ?? 0;
  }
  const velocity = recentCompleted / 14; // tasks per day

  // Remaining tasks today
  const doneSoFar = tasks.filter((t) => t.status === "DONE").length;
  const remainingToday = total - doneSoFar;

  return days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const label = format(day, "MMM d");
    const daysFromStart = differenceInDays(day, start);
    const isPast = day <= today;

    // Planned: linear burndown from total → 0 over project duration
    const planned = Math.max(0, total - Math.round((daysFromStart / projectDuration) * total));

    // Actual: only available for past/today
    let actual: number | null = null;
    if (isPast || format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
      let completedUpToDay = 0;
      tasks.forEach((t) => {
        if (t.status === "DONE" && t.completedAt) {
          if (startOfDay(new Date(t.completedAt)) <= day) {
            completedUpToDay++;
          }
        }
      });
      actual = Math.max(0, total - completedUpToDay);
    }

    // Forecast: from today forward using velocity
    let forecast: number | null = null;
    if (!isPast || format(dayStr, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
      const daysAhead = differenceInDays(day, today);
      if (daysAhead >= 0) {
        forecast = Math.max(0, remainingToday - Math.round(velocity * daysAhead));
      }
    }

    return { date: label, planned, actual, forecast };
  });
}

export function computeForecastSummary(
  tasks: Task[],
  projectEnd: Date
): ForecastSummary {
  const today = startOfDay(new Date());
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const remaining = total - done;
  const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Velocity: tasks completed in last 14 days
  let recentCompleted = 0;
  tasks.forEach((t) => {
    if (t.status === "DONE" && t.completedAt) {
      const daysAgo = differenceInDays(today, startOfDay(new Date(t.completedAt)));
      if (daysAgo >= 0 && daysAgo <= 14) recentCompleted++;
    }
  });
  const velocityPerDay = recentCompleted / 14;

  let forecastCompletionDate: string | null = null;
  let forecastDaysFromToday: number | null = null;
  let slippageDays = 0;
  let isOnTrack = true;
  let confidenceLabel: "Low" | "Medium" | "High" = "Low";

  if (remaining === 0) {
    forecastCompletionDate = format(today, "yyyy-MM-dd");
    forecastDaysFromToday = 0;
    isOnTrack = true;
    confidenceLabel = "High";
    slippageDays = -differenceInDays(startOfDay(projectEnd), today);
  } else if (velocityPerDay > 0) {
    const daysToFinish = Math.ceil(remaining / velocityPerDay);
    const fcDate = addDays(today, daysToFinish);
    forecastCompletionDate = format(fcDate, "yyyy-MM-dd");
    forecastDaysFromToday = daysToFinish;
    slippageDays = differenceInDays(fcDate, startOfDay(projectEnd));
    isOnTrack = slippageDays <= 0;
    // Confidence: higher if more data, lower if low velocity
    const totalDaysCompleted = tasks.filter((t) => t.status === "DONE").length;
    if (totalDaysCompleted >= 5 && recentCompleted >= 2) confidenceLabel = "High";
    else if (totalDaysCompleted >= 2 || recentCompleted >= 1) confidenceLabel = "Medium";
    else confidenceLabel = "Low";
  } else {
    // Zero velocity
    slippageDays = differenceInDays(today, startOfDay(projectEnd)) + remaining * 2;
    isOnTrack = false;
    confidenceLabel = "Low";
  }

  return {
    velocityPerDay: Math.round(velocityPerDay * 10) / 10,
    remainingTasks: remaining,
    forecastCompletionDate,
    forecastDaysFromToday,
    plannedEndDate: format(startOfDay(projectEnd), "yyyy-MM-dd"),
    isOnTrack,
    slippageDays,
    confidenceLabel,
    completionPct,
  };
}

export function computeVelocityByWeek(tasks: Task[]): VelocityPoint[] {
  const today = startOfDay(new Date());
  const points: VelocityPoint[] = [];
  for (let w = 5; w >= 0; w--) {
    const weekStart = addDays(today, -w * 7 - 6);
    const weekEnd = addDays(today, -w * 7);
    const label = `${format(weekStart, "MMM d")}`;
    let count = 0;
    tasks.forEach((t) => {
      if (t.status === "DONE" && t.completedAt) {
        const d = startOfDay(new Date(t.completedAt));
        if (d >= weekStart && d <= weekEnd) count++;
      }
    });
    points.push({ week: label, tasksCompleted: count });
  }
  return points;
}

export function computePlannedVsActual(
  tasks: Task[],
  projectStart: Date,
  projectEnd: Date
) {
  const today = startOfDay(new Date());
  const start = startOfDay(projectStart);
  const end = startOfDay(projectEnd);
  const total = tasks.length;
  const projectDuration = differenceInDays(end, start) || 1;

  // Sample at 8 evenly spaced points between start and max(today, end)
  const chartEnd = today > end ? today : end;
  const span = differenceInDays(chartEnd, start);
  const step = Math.max(1, Math.floor(span / 7));

  const points = [];
  let cursor = start;
  while (cursor <= chartEnd) {
    const daysIn = differenceInDays(cursor, start);
    const planned = Math.min(100, Math.round((daysIn / projectDuration) * 100));
    const isPast = cursor <= today;
    let actual = null;
    if (isPast) {
      let doneSoFar = 0;
      tasks.forEach((t) => {
        if (t.status === "DONE" && t.completedAt) {
          if (startOfDay(new Date(t.completedAt)) <= cursor) doneSoFar++;
        }
      });
      actual = total > 0 ? Math.round((doneSoFar / total) * 100) : 0;
    }
    points.push({ date: format(cursor, "MMM d"), planned, actual });
    cursor = addDays(cursor, step);
  }
  // Ensure we have the last point
  if (format(cursor, "yyyy-MM-dd") !== format(chartEnd, "yyyy-MM-dd")) {
    const daysIn = differenceInDays(chartEnd, start);
    const planned = Math.min(100, Math.round((daysIn / projectDuration) * 100));
    const doneSoFar = tasks.filter((t) => t.status === "DONE").length;
    const actual = today >= start ? (total > 0 ? Math.round((doneSoFar / total) * 100) : 0) : null;
    points.push({ date: format(chartEnd, "MMM d"), planned, actual });
  }
  return points;
}
