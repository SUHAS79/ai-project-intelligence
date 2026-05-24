"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, CheckCircle2, Clock, AlertCircle, Minus,
  ClipboardCheck, Timer, TrendingUp, Users, ArrowRight, Filter,
} from "lucide-react";
import { cn, STATUS_CONFIG, PRIORITY_CONFIG, formatDate, formatHours } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DevTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimatedHours: number | null;
  endDate: string;
  project: { id: string; name: string };
}

interface DeveloperWorkload {
  id: string;
  fullName: string;
  initials: string;
  role: string;
  tasks: DevTask[];
  isOffToday: boolean;
  offNote: string | null;
}

interface UnassignedTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimatedHours: number | null;
  endDate: string;
  project: { id: string; name: string };
}

interface WorkloadViewProps {
  developers: DeveloperWorkload[];
  unassignedTasks: UnassignedTask[];
}

// ─── Workload scoring ────────────────────────────────────────────────────────

type WorkloadLevel = "overloaded" | "heavy" | "balanced" | "light" | "idle";

function getWorkloadLevel(dev: DeveloperWorkload): WorkloadLevel {
  const active = dev.tasks.filter((t) => t.status !== "DONE");
  const inProgress = active.filter((t) => t.status === "IN_PROGRESS").length;
  const blocked = active.filter((t) => t.status === "BLOCKED").length;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdue = active.filter((t) => new Date(t.endDate) < today).length;
  const estHours = active.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);

  if (inProgress >= 4 || overdue >= 3 || estHours >= 50) return "overloaded";
  if (inProgress >= 2 || overdue >= 1 || estHours >= 25) return "heavy";
  if (active.length === 0) return "idle";
  if (inProgress === 0) return "light";
  return "balanced";
}

const WORKLOAD_CONFIG: Record<WorkloadLevel, { label: string; color: string; bg: string; border: string; dot: string }> = {
  overloaded: { label: "Overloaded", color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     dot: "bg-red-500" },
  heavy:      { label: "Heavy",      color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200",  dot: "bg-orange-400" },
  balanced:   { label: "Balanced",   color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  light:      { label: "Light",      color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    dot: "bg-blue-400" },
  idle:       { label: "Idle",       color: "text-slate-500",   bg: "bg-slate-50",   border: "border-slate-200",   dot: "bg-slate-300" },
};

const ROLE_LABEL: Record<string, string> = {
  manager: "Manager",
  senior_developer: "Senior Dev",
  developer: "Developer",
};

// ─── Main component ──────────────────────────────────────────────────────────

export function WorkloadView({ developers, unassignedTasks }: WorkloadViewProps) {
  const [filter, setFilter] = useState<WorkloadLevel | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...developers].sort((a, b) => {
    const order: WorkloadLevel[] = ["overloaded", "heavy", "balanced", "light", "idle"];
    return order.indexOf(getWorkloadLevel(a)) - order.indexOf(getWorkloadLevel(b));
  });

  const filtered = filter === "all" ? sorted : sorted.filter((d) => getWorkloadLevel(d) === filter);

  const overloadedCount = developers.filter((d) => getWorkloadLevel(d) === "overloaded").length;
  const heavyCount = developers.filter((d) => getWorkloadLevel(d) === "heavy").length;
  const idleCount = developers.filter((d) => getWorkloadLevel(d) === "idle").length;
  const totalActive = developers.reduce(
    (s, d) => s + d.tasks.filter((t) => t.status !== "DONE").length, 0
  );
  const totalEstHours = developers.reduce(
    (s, d) => s + d.tasks.filter((t) => t.status !== "DONE").reduce((ss, t) => ss + (t.estimatedHours ?? 0), 0), 0
  );

  if (developers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Users className="w-6 h-6 text-slate-400" />
        </div>
        <p className="font-medium text-slate-700 mb-1">No developers yet</p>
        <p className="text-sm text-slate-400">Add team members from the People page to see workload here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Team Members" value={developers.length} icon={<Users className="w-4 h-4" />} color="text-slate-700" bg="bg-slate-50" />
        <SummaryCard label="Active Tasks" value={totalActive} icon={<Clock className="w-4 h-4" />} color="text-blue-600" bg="bg-blue-50" />
        <SummaryCard
          label="Overloaded"
          value={overloadedCount}
          icon={<AlertTriangle className="w-4 h-4" />}
          color={overloadedCount > 0 ? "text-red-600" : "text-slate-400"}
          bg={overloadedCount > 0 ? "bg-red-50" : "bg-slate-50"}
        />
        <SummaryCard
          label="Est. Hours Remaining"
          value={`${Math.round(totalEstHours)}h`}
          icon={<Timer className="w-4 h-4" />}
          color="text-amber-600"
          bg="bg-amber-50"
          isString
        />
      </div>

      {/* Alert if overloaded */}
      {overloadedCount > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span>
            <span className="font-semibold">{overloadedCount} developer{overloadedCount !== 1 ? "s are" : " is"} overloaded.</span>{" "}
            Consider redistributing tasks or adjusting deadlines to prevent burnout and delays.
            {idleCount > 0 && ` ${idleCount} developer${idleCount !== 1 ? "s have" : " has"} capacity to take on more work.`}
          </span>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        {(["all", "overloaded", "heavy", "balanced", "light", "idle"] as const).map((f) => {
          const cfg = f === "all" ? null : WORKLOAD_CONFIG[f];
          const count = f === "all" ? developers.length : developers.filter((d) => getWorkloadLevel(d) === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                filter === f
                  ? f === "all"
                    ? "bg-slate-800 text-white border-slate-800"
                    : `${cfg!.bg} ${cfg!.color} ${cfg!.border}`
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              )}
            >
              {f === "all" ? "All" : WORKLOAD_CONFIG[f].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Developer cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-400">
            No developers match this filter.
          </div>
        ) : (
          filtered.map((dev) => {
            const level = getWorkloadLevel(dev);
            const cfg = WORKLOAD_CONFIG[level];
            const isExpanded = expandedId === dev.id;

            const activeTasks = dev.tasks.filter((t) => t.status !== "DONE");
            const inProgress = activeTasks.filter((t) => t.status === "IN_PROGRESS");
            const blocked = activeTasks.filter((t) => t.status === "BLOCKED");
            const inReview = activeTasks.filter((t) => t.status === "IN_REVIEW");
            const todo = activeTasks.filter((t) => t.status === "TODO");
            const done = dev.tasks.filter((t) => t.status === "DONE");
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const overdue = activeTasks.filter((t) => new Date(t.endDate) < today);
            const estHours = activeTasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);

            // Stacked bar data
            const total = Math.max(dev.tasks.length, 1);
            const barSegments = [
              { count: done.length, color: "bg-emerald-400", label: "Done" },
              { count: inReview.length, color: "bg-purple-400", label: "In Review" },
              { count: inProgress.length, color: "bg-blue-400", label: "In Progress" },
              { count: todo.length, color: "bg-slate-300", label: "To Do" },
              { count: blocked.length, color: "bg-red-400", label: "Blocked" },
            ].filter((s) => s.count > 0);

            return (
              <div
                key={dev.id}
                className={cn(
                  "bg-white rounded-xl border shadow-sm overflow-hidden",
                  level === "overloaded" ? "border-red-200" :
                  level === "heavy" ? "border-orange-200" : "border-slate-200/80"
                )}
              >
                {/* Card header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : dev.id)}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
                    cfg.bg, cfg.color
                  )}>
                    {dev.initials}
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{dev.fullName}</span>
                      <span className="text-xs text-slate-400">{ROLE_LABEL[dev.role] ?? dev.role}</span>
                      {dev.isOffToday && (
                        <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                          Off today
                        </span>
                      )}
                    </div>

                    {/* Stacked progress bar */}
                    {dev.tasks.length > 0 && (
                      <div className="flex h-1.5 rounded-full overflow-hidden mt-2 gap-px w-full max-w-xs">
                        {barSegments.map((seg) => (
                          <div
                            key={seg.label}
                            className={`${seg.color} transition-all`}
                            style={{ width: `${(seg.count / total) * 100}%` }}
                            title={`${seg.label}: ${seg.count}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-5 shrink-0">
                    <StatPill count={inProgress.length} icon={<Clock className="w-3 h-3" />} color="text-blue-600" label="In progress" />
                    {blocked.length > 0 && (
                      <StatPill count={blocked.length} icon={<AlertCircle className="w-3 h-3" />} color="text-red-500" label="Blocked" />
                    )}
                    {overdue.length > 0 && (
                      <StatPill count={overdue.length} icon={<AlertTriangle className="w-3 h-3" />} color="text-orange-500" label="Overdue" />
                    )}
                    {estHours > 0 && (
                      <StatPill value={`${Math.round(estHours)}h`} icon={<Timer className="w-3 h-3" />} color="text-amber-600" label="Est. hrs" />
                    )}
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full border",
                      cfg.bg, cfg.color, cfg.border
                    )}>
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Expanded task list */}
                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {activeTasks.length === 0 ? (
                      <p className="text-sm text-slate-400 px-5 py-3 italic">No tasks assigned.</p>
                    ) : (
                      activeTasks
                        .sort((a, b) => {
                          const order = ["BLOCKED", "IN_PROGRESS", "IN_REVIEW", "TODO"];
                          return order.indexOf(a.status) - order.indexOf(b.status);
                        })
                        .map((task) => {
                          const statusCfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
                          const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
                          const taskToday = new Date(); taskToday.setHours(0, 0, 0, 0);
                          const isOverdue = new Date(task.endDate) < taskToday;

                          return (
                            <div key={task.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50/50 transition-colors">
                              <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap",
                                statusCfg?.color ?? "bg-slate-100 text-slate-600 border-slate-200"
                              )}>
                                {statusCfg?.label ?? task.status}
                              </span>
                              <span className="text-sm text-slate-700 flex-1 truncate">{task.title}</span>
                              <span className={cn(
                                "text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap shrink-0",
                                priorityCfg?.color ?? "bg-slate-100 text-slate-600 border-slate-200"
                              )}>
                                {priorityCfg?.label ?? task.priority}
                              </span>
                              {task.estimatedHours && (
                                <span className="text-[11px] text-amber-600 shrink-0">{formatHours(task.estimatedHours)}</span>
                              )}
                              <span className={cn("text-[11px] shrink-0", isOverdue ? "text-red-500 font-semibold" : "text-slate-400")}>
                                {isOverdue ? "Overdue" : `Due ${formatDate(task.endDate)}`}
                              </span>
                              <Link
                                href={`/projects/${task.project.id}`}
                                className="text-[11px] text-violet-600 hover:underline shrink-0 max-w-[100px] truncate"
                                title={task.project.name}
                              >
                                {task.project.name}
                              </Link>
                            </div>
                          );
                        })
                    )}
                    {done.length > 0 && (
                      <div className="flex items-center gap-2 px-5 py-2 text-xs text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {done.length} completed task{done.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Unassigned tasks */}
      {unassignedTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Minus className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Unassigned Tasks
            </h2>
            <span className="text-xs text-slate-400">{unassignedTasks.length} tasks need an owner</span>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm divide-y divide-slate-50">
            {unassignedTasks.map((task) => {
              const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
              const today = new Date(); today.setHours(0, 0, 0, 0);
              const isOverdue = new Date(task.endDate) < today;

              return (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                  <span className="text-sm text-slate-700 flex-1 truncate">{task.title}</span>
                  <span className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap shrink-0",
                    priorityCfg?.color ?? "bg-slate-100 text-slate-600 border-slate-200"
                  )}>
                    {priorityCfg?.label ?? task.priority}
                  </span>
                  {task.estimatedHours && (
                    <span className="text-[11px] text-amber-600 shrink-0">{formatHours(task.estimatedHours)}</span>
                  )}
                  <span className={cn("text-[11px] shrink-0", isOverdue ? "text-red-500 font-semibold" : "text-slate-400")}>
                    {isOverdue ? "Overdue" : `Due ${formatDate(task.endDate)}`}
                  </span>
                  <Link
                    href={`/projects/${task.project.id}`}
                    className="flex items-center gap-1 text-[11px] text-violet-600 hover:underline shrink-0"
                  >
                    {task.project.name}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({
  label, value, icon, color, bg, isString,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  isString?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 border border-slate-200/80 shadow-sm bg-white`}>
      <div className={cn("mb-2", color)}>{icon}</div>
      <div className={cn("text-2xl font-bold tabular-nums", color)}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function StatPill({
  count, value, icon, color, label,
}: {
  count?: number;
  value?: string;
  icon: React.ReactNode;
  color: string;
  label: string;
}) {
  const display = value ?? count;
  return (
    <div className="flex items-center gap-1" title={label}>
      <span className={color}>{icon}</span>
      <span className={cn("text-sm font-semibold tabular-nums", color)}>{display}</span>
    </div>
  );
}
