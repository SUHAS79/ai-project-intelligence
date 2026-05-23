"use client";

import { Task } from "@/app/generated/prisma/client";
import { formatDate, STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/utils";
import { useMemo } from "react";
import { Calendar, GitBranch } from "lucide-react";

type TaskWithDeps = Task & {
  dependsOn: { dependencyId: string; dependency: Task }[];
  dependedOnBy: any[];
};

const STATUS_COLORS: Record<string, string> = {
  DONE: "#22c55e",
  IN_PROGRESS: "#3b82f6",
  BLOCKED: "#ef4444",
  TODO: "#94a3b8",
};

const PRIORITY_BORDER: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MEDIUM: "#ca8a04",
  LOW: "#64748b",
};

export function GanttTab({ tasks }: { tasks: TaskWithDeps[] }) {
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return { minDate: today, maxDate: today, totalDays: 30 };
    }
    const starts = tasks.map((t) => new Date(t.startDate).getTime());
    const ends = tasks.map((t) => new Date(t.endDate).getTime());
    const minDate = new Date(Math.min(...starts));
    const maxDate = new Date(Math.max(...ends));
    // Pad by 5 days on each side
    minDate.setDate(minDate.getDate() - 5);
    maxDate.setDate(maxDate.getDate() + 5);
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return { minDate, maxDate, totalDays };
  }, [tasks]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOffset = Math.max(0, Math.ceil(
    (today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
  ));
  const todayPct = (todayOffset / totalDays) * 100;

  // Build week headers
  const weeks = useMemo(() => {
    const weeks: { label: string; days: number }[] = [];
    const cursor = new Date(minDate);
    while (cursor < maxDate) {
      const weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weeks.push({
        label: cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        days: Math.min(7, Math.ceil((maxDate.getTime() - cursor.getTime()) / (1000 * 60 * 60 * 24))),
      });
      cursor.setDate(cursor.getDate() + 7);
    }
    return weeks;
  }, [minDate, maxDate]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
        <Calendar className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">No tasks to display</p>
        <p className="text-sm text-slate-400 mt-1">Add tasks in the Tasks tab to see the timeline</p>
      </div>
    );
  }

  const getBar = (task: Task) => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const startDay = Math.max(0, Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
    const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const leftPct = (startDay / totalDays) * 100;
    const widthPct = (duration / totalDays) * 100;
    return { leftPct, widthPct };
  };

  const taskIndex = new Map(tasks.map((t, i) => [t.id, i]));

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Legend */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-5">
        <span className="text-xs font-medium text-slate-500">Status:</span>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
            <span className="text-xs text-slate-600">
              {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label ?? status}
            </span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-0.5 h-4 bg-red-400" />
          <span className="text-xs text-slate-600">Today</span>
        </div>
      </div>

      <div className="flex overflow-x-auto">
        {/* Task names column */}
        <div className="shrink-0 w-56 border-r border-slate-200">
          <div className="h-10 px-4 border-b border-slate-200 flex items-center bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Task</span>
          </div>
          {tasks.map((task, i) => (
            <div
              key={task.id}
              className="h-12 px-4 border-b border-slate-100 flex items-center hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: PRIORITY_BORDER[task.priority] ?? "#94a3b8" }}
                />
                <span className="text-xs text-slate-700 truncate font-medium">{task.title}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          {/* Week headers */}
          <div className="h-10 border-b border-slate-200 flex bg-slate-50">
            {weeks.map((week, i) => (
              <div
                key={i}
                className="border-r border-slate-200 flex items-center px-2 shrink-0"
                style={{ width: `${(week.days / totalDays) * 100}%`, minWidth: `${(week.days / totalDays) * 800}px` }}
              >
                <span className="text-xs text-slate-500 whitespace-nowrap">{week.label}</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="relative" style={{ minWidth: "800px" }}>
            {/* Today line */}
            {todayPct >= 0 && todayPct <= 100 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                style={{ left: `${todayPct}%` }}
              />
            )}

            {/* Dependency arrows (SVG overlay) */}
            <svg
              className="absolute inset-0 pointer-events-none z-20"
              style={{ width: "100%", height: `${tasks.length * 48}px` }}
            >
              {tasks.map((task) =>
                task.dependsOn.map((dep) => {
                  const fromIdx = taskIndex.get(dep.dependencyId);
                  const toIdx = taskIndex.get(task.id);
                  if (fromIdx === undefined || toIdx === undefined) return null;

                  const fromBar = getBar(dep.dependency);
                  const toBar = getBar(task);

                  const x1 = `${fromBar.leftPct + fromBar.widthPct}%`;
                  const y1 = fromIdx * 48 + 24;
                  const x2 = `${toBar.leftPct}%`;
                  const y2 = toIdx * 48 + 24;

                  return (
                    <g key={`${dep.dependencyId}-${task.id}`}>
                      <path
                        d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        opacity="0.6"
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  );
                })
              )}
              <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M 0 0 L 6 3 L 0 6 Z" fill="#6366f1" opacity="0.6" />
                </marker>
              </defs>
            </svg>

            {/* Task bars */}
            {tasks.map((task) => {
              const { leftPct, widthPct } = getBar(task);
              const color = STATUS_COLORS[task.status] ?? "#94a3b8";

              return (
                <div
                  key={task.id}
                  className="h-12 border-b border-slate-100 relative group"
                >
                  {/* Grid lines */}
                  {weeks.map((week, wi) => (
                    <div
                      key={wi}
                      className="absolute top-0 bottom-0 border-r border-slate-100"
                      style={{ left: `${(weeks.slice(0, wi + 1).reduce((s, w) => s + w.days, 0) / totalDays) * 100}%` }}
                    />
                  ))}

                  {/* Bar */}
                  <div
                    className="absolute top-3 h-6 rounded-md flex items-center px-2 transition-all"
                    style={{
                      left: `${leftPct}%`,
                      width: `${Math.max(widthPct, 1)}%`,
                      background: color,
                      border: `2px solid ${PRIORITY_BORDER[task.priority] ?? "#94a3b8"}`,
                    }}
                    title={`${task.title} | ${task.status} | Due: ${formatDate(task.endDate)}`}
                  >
                    <span className="text-white text-xs font-medium truncate leading-none" style={{ textShadow: "0 0 4px rgba(0,0,0,0.3)" }}>
                      {task.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
