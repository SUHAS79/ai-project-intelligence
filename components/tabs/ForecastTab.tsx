"use client";

import { useMemo } from "react";
import { Task, Project } from "@/app/generated/prisma/client";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  computeBurndown,
  computeForecastSummary,
  computeVelocityByWeek,
  computePlannedVsActual,
} from "@/lib/forecast";
import { format, parseISO } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Zap,
  AlertTriangle,
  Calendar,
  Timer,
} from "lucide-react";
import { formatHours } from "@/lib/utils";

interface ForecastTabProps {
  project: Project;
  tasks: Task[];
}

const COLORS = {
  planned: "#94a3b8",
  actual: "#6366f1",
  forecast: "#f59e0b",
  velocity: "#22c55e",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-slate-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.name}:</span>
          <span className="font-semibold text-slate-900">
            {p.value !== null && p.value !== undefined ? p.value : "—"}
            {p.unit ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ForecastTab({ project, tasks }: ForecastTabProps) {
  const projectStart = new Date(project.startDate);
  const projectEnd = new Date(project.endDate);

  const burndown = useMemo(
    () => computeBurndown(tasks, projectStart, projectEnd),
    [tasks, project.startDate, project.endDate]
  );
  const forecast = useMemo(
    () => computeForecastSummary(tasks, projectEnd),
    [tasks, project.endDate]
  );
  const velocity = useMemo(() => computeVelocityByWeek(tasks), [tasks]);
  const progressChart = useMemo(
    () => computePlannedVsActual(tasks, projectStart, projectEnd),
    [tasks, project.startDate, project.endDate]
  );

  const todayLabel = format(new Date(), "MMM d");

  return (
    <div className="space-y-6">
      {/* Forecast Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ForecastCard
          label="Expected Completion"
          value={
            forecast.forecastCompletionDate
              ? format(parseISO(forecast.forecastCompletionDate), "MMM d, yyyy")
              : "Insufficient data"
          }
          sub={
            forecast.forecastDaysFromToday != null
              ? forecast.forecastDaysFromToday === 0
                ? "Done today"
                : `in ${forecast.forecastDaysFromToday} days`
              : undefined
          }
          icon={<Calendar className="w-4 h-4" />}
          iconColor="text-violet-500"
          iconBg="bg-violet-50"
          status={forecast.isOnTrack ? "good" : "bad"}
        />
        <ForecastCard
          label="Schedule Variance"
          value={
            forecast.slippageDays === 0
              ? "On track"
              : forecast.slippageDays > 0
              ? `${forecast.slippageDays}d late`
              : `${Math.abs(forecast.slippageDays)}d early`
          }
          icon={
            forecast.isOnTrack ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )
          }
          iconColor={forecast.isOnTrack ? "text-emerald-500" : "text-red-500"}
          iconBg={forecast.isOnTrack ? "bg-emerald-50" : "bg-red-50"}
          status={forecast.isOnTrack ? "good" : "bad"}
        />
        <ForecastCard
          label="Current Velocity"
          value={`${forecast.velocityPerDay}`}
          sub="tasks/day"
          icon={<Zap className="w-4 h-4" />}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
          status={forecast.velocityPerDay > 0 ? "good" : "bad"}
        />
        <ForecastCard
          label="Remaining Work"
          value={`${forecast.remainingTasks}`}
          sub={`of ${tasks.length} tasks`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          status="neutral"
        />
      </div>

      {/* Confidence banner */}
      <div
        className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
          forecast.confidenceLabel === "High"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : forecast.confidenceLabel === "Medium"
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-slate-50 border-slate-200 text-slate-600"
        }`}
      >
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">
            {forecast.confidenceLabel} confidence forecast.
          </span>{" "}
          {forecast.confidenceLabel === "Low"
            ? "More historical task completions will improve forecast accuracy. Currently extrapolating from limited data."
            : forecast.confidenceLabel === "Medium"
            ? "Based on recent activity. Forecast will improve as more tasks are completed."
            : "Based on consistent recent velocity. Forecast is reliable unless scope changes."}
          {!forecast.isOnTrack && forecast.slippageDays > 0 && (
            <span className="ml-1 font-semibold">
              At current pace, the project will finish {forecast.slippageDays} days after the planned deadline.
            </span>
          )}
        </div>
      </div>

      {/* Effort Overview */}
      <EffortOverview tasks={tasks as any} />

      {/* Burndown Chart */}
      <ChartCard
        title="Burndown — Tasks Remaining Over Time"
        subtitle="Planned pace vs actual progress vs AI forecast"
      >
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={burndown} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              label={{ value: "Tasks left", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#94a3b8" }, dx: -4 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
            <ReferenceLine x={todayLabel} stroke="#e2e8f0" strokeDasharray="4 2" label={{ value: "Today", position: "top", fontSize: 10, fill: "#94a3b8" }} />
            <Line
              type="monotone"
              dataKey="planned"
              name="Planned"
              stroke={COLORS.planned}
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="5 4"
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke={COLORS.actual}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              name="Forecast"
              stroke={COLORS.forecast}
              strokeWidth={2}
              dot={false}
              strokeDasharray="6 3"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Planned vs Actual Progress */}
      <ChartCard
        title="Planned vs Actual Completion"
        subtitle="Cumulative % of tasks completed against planned schedule"
      >
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={progressChart} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradPlanned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.planned} stopOpacity={0.15} />
                <stop offset="95%" stopColor={COLORS.planned} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.actual} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.actual} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} interval="preserveStartEnd" />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
            <Area type="monotone" dataKey="planned" name="Planned %" stroke={COLORS.planned} fill="url(#gradPlanned)" strokeDasharray="5 4" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="actual" name="Actual %" stroke={COLORS.actual} fill="url(#gradActual)" strokeWidth={2} dot={false} connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Weekly Velocity */}
      <ChartCard
        title="Weekly Velocity"
        subtitle="Tasks completed per week over the past 6 weeks"
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={velocity} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="tasksCompleted"
              name="Tasks done"
              fill={COLORS.velocity}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ForecastCard({
  label, value, sub, icon, iconColor, iconBg, status,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  status: "good" | "bad" | "neutral";
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
      <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-[15px] font-bold text-slate-900 leading-tight mb-0.5">{value}</div>
      {sub && <div className="text-xs text-slate-400 mb-1">{sub}</div>}
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function EffortOverview({ tasks }: { tasks: (Task & { estimatedHours?: number | null; actualHours?: number | null })[] }) {
  const withEstimate = tasks.filter((t) => t.estimatedHours);
  const withActual = tasks.filter((t) => t.actualHours);
  const totalEstimated = withEstimate.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
  const totalActual = withActual.reduce((s, t) => s + (t.actualHours ?? 0), 0);
  const noEstimate = tasks.filter(
    (t) => (t.status === "IN_PROGRESS" || t.status === "TODO") && !t.estimatedHours
  ).length;

  // Accuracy: for tasks with both, compute avg ratio
  const tasksWithBoth = tasks.filter((t) => t.estimatedHours && t.actualHours);
  const avgAccuracy =
    tasksWithBoth.length > 0
      ? Math.round(
          (tasksWithBoth.reduce(
            (s, t) => s + Math.min(t.estimatedHours! / t.actualHours!, 2),
            0
          ) /
            tasksWithBoth.length) *
            100
        )
      : null;

  if (withEstimate.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-amber-800">
        <Timer className="w-4 h-4 shrink-0" />
        <span>
          <span className="font-semibold">No effort estimates yet.</span>{" "}
          Developers can set time estimates when picking up tasks — this helps forecast project hours.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Timer className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-900">Effort Overview</h3>
        <span className="text-xs text-slate-400">{withEstimate.length} of {tasks.length} tasks estimated</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-lg px-4 py-3">
          <p className="text-lg font-bold text-slate-900 tabular-nums">{formatHours(totalEstimated)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total estimated</p>
        </div>
        <div className="bg-slate-50 rounded-lg px-4 py-3">
          <p className={`text-lg font-bold tabular-nums ${totalActual > totalEstimated && totalEstimated > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {withActual.length > 0 ? formatHours(totalActual) : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Total actual</p>
        </div>
        <div className="bg-slate-50 rounded-lg px-4 py-3">
          <p className={`text-lg font-bold tabular-nums ${avgAccuracy !== null && avgAccuracy < 80 ? "text-red-600" : "text-emerald-600"}`}>
            {avgAccuracy !== null ? `${avgAccuracy}%` : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Avg accuracy</p>
        </div>
        <div className="bg-slate-50 rounded-lg px-4 py-3">
          <p className={`text-lg font-bold tabular-nums ${noEstimate > 0 ? "text-amber-600" : "text-slate-700"}`}>
            {noEstimate}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Unestimated active</p>
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title, subtitle, children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
