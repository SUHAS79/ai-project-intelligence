"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Minus,
  Zap,
  CalendarClock,
  Layers,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { cn, STATUS_CONFIG, PRIORITY_CONFIG, formatDate, daysFromNow } from "@/lib/utils";
import type { TokenPayload } from "@/lib/roles";
import { toast } from "sonner";

type AssignedTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | Date;
  endDate: string | Date;
  completedAt: string | Date | null;
  project: {
    id: string;
    name: string;
    status: string;
    endDate: string | Date;
  };
};

interface DevDashboardClientProps {
  user: TokenPayload;
  tasks: AssignedTask[];
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  DONE: CheckCircle2,
  IN_PROGRESS: Clock,
  BLOCKED: AlertCircle,
  TODO: Minus,
};

const STATUS_ORDER = ["IN_PROGRESS", "BLOCKED", "TODO", "DONE"];

export function DevDashboardClient({ user, tasks }: DevDashboardClientProps) {
  const router = useRouter();

  const sorted = [...tasks].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  );

  // Stats
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const blocked = tasks.filter((t) => t.status === "BLOCKED").length;
  const overdue = tasks.filter(
    (t) => t.status !== "DONE" && daysFromNow(t.endDate) < 0
  ).length;

  async function handleStatusChange(taskId: string, newStatus: string) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      toast.error("Failed to update status");
      return;
    }
    router.refresh();
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow shadow-violet-200">
          <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Hey, {user.fullName.split(" ")[0]}.
        </h1>
      </div>
      <p className="text-sm text-slate-500 ml-9 mb-8">
        Here are all the tasks currently assigned to you.
      </p>

      {/* Stat row */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <StatCard label="Total tasks" value={total} icon={Layers} color="text-slate-700" />
        <StatCard label="In progress" value={inProgress} icon={Clock} color="text-blue-600" />
        <StatCard label="Blocked" value={blocked} icon={AlertCircle} color="text-red-500" />
        <StatCard
          label={overdue > 0 ? "Overdue" : "Completed"}
          value={overdue > 0 ? overdue : done}
          icon={overdue > 0 ? AlertTriangle : CheckCircle2}
          color={overdue > 0 ? "text-red-500" : "text-emerald-600"}
        />
      </div>

      {/* Task list */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-violet-400" />
          </div>
          <h2 className="text-base font-semibold text-slate-700 mb-1">No tasks yet</h2>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            A manager will assign tasks to you from the project workspace.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((task) => {
            const statusCfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
            const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
            const isOverdue = task.status !== "DONE" && daysFromNow(task.endDate) < 0;
            const days = daysFromNow(task.endDate);
            const dueSoon = !isOverdue && days >= 0 && days <= 3 && task.status !== "DONE";
            const StatusIcon = STATUS_ICONS[task.status] ?? Minus;

            return (
              <div
                key={task.id}
                className={cn(
                  "bg-white rounded-xl border border-slate-200/80 shadow-sm px-5 py-4 flex items-start gap-4",
                  isOverdue && "border-red-200 bg-red-50/30"
                )}
              >
                {/* Status icon */}
                <div
                  className={cn(
                    "mt-0.5 shrink-0",
                    task.status === "DONE" && "text-emerald-500",
                    task.status === "IN_PROGRESS" && "text-blue-500",
                    task.status === "BLOCKED" && "text-red-500",
                    task.status === "TODO" && "text-slate-300"
                  )}
                >
                  <StatusIcon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-medium text-slate-900 text-sm">{task.title}</span>
                    <span className={cn("text-[11px] px-1.5 py-0.5 rounded font-medium border", priorityCfg.color)}>
                      {priorityCfg.label}
                    </span>
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Overdue
                      </span>
                    )}
                    {dueSoon && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        Due soon
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <Link
                      href={`/projects/${task.project.id}`}
                      className="hover:text-violet-600 transition-colors font-medium flex items-center gap-1"
                    >
                      {task.project.name}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                    <span className="flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" />
                      Due {formatDate(task.endDate)}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                  )}
                </div>

                {/* Status changer */}
                <div className="shrink-0">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className={cn(
                      "text-xs rounded-lg border px-2 py-1 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-200 appearance-none",
                      statusCfg.color
                    )}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile shortcut */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200/80 shadow-sm">
        <a
          href="/profile"
          className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{user.initials}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
              <p className="text-xs text-slate-400">View profile & change password</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </a>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-4 py-3.5 flex items-center gap-3">
      <div className={cn("shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className={cn("text-xl font-bold tabular-nums", color)}>{value}</p>
        <p className="text-[11px] text-slate-400 leading-tight">{label}</p>
      </div>
    </div>
  );
}
