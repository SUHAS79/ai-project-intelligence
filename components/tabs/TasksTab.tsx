"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Task, Project } from "@/app/generated/prisma/client";
import type { ProjectInsights } from "@/lib/insights";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { TaskModal } from "../TaskModal";
import { RejectTaskModal } from "../RejectTaskModal";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  formatDate,
  daysFromNow,
  formatHours,
  cn,
} from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ListTodo,
  ClipboardCheck,
  XCircle,
  RotateCcw,
  Timer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

type AssignedUser = {
  id: string;
  fullName: string;
  initials: string;
};

type TaskActivity = {
  id: string;
  userId: string;
  userFullName: string;
  action: string;
  details: string | null;
  createdAt: string | Date;
};

type TaskWithDeps = Task & {
  dependsOn: any[];
  dependedOnBy: any[];
  assignedTo?: AssignedUser | null;
  reviewedBy?: AssignedUser | null;
  activities?: TaskActivity[];
  reviewStatus?: string | null;
  workSummary?: string | null;
  rejectionReason?: string | null;
  submittedForReviewAt?: string | Date | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
};

interface TasksTabProps {
  project: Project;
  tasks: TaskWithDeps[];
  insights: ProjectInsights;
  allUsers?: AssignedUser[];
  userRole?: string;
  isManager?: boolean;
}

const STATUS_FILTER_LABELS: Record<string, string> = {
  ALL: "All",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

const ACTION_LABELS: Record<string, string> = {
  submitted_for_review: "Submitted for review",
  approved: "Approved",
  rejected: "Rejected",
  status_changed: "Status changed",
  reopened: "Reopened",
};

export function TasksTab({
  project,
  tasks,
  insights,
  allUsers = [],
  userRole = "manager",
  isManager = false,
}: TasksTabProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithDeps | null>(null);
  const [filter, setFilter] = useState<"ALL" | "TODO" | "IN_PROGRESS" | "BLOCKED" | "IN_REVIEW" | "DONE">("ALL");
  const [rejectingTask, setRejectingTask] = useState<TaskWithDeps | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [reopeningId, setReopeningId] = useState<string | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  const canReview = isManager || userRole === "senior_developer";

  const filteredTasks = filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter);

  const isOverdue = (task: Task) =>
    task.status !== "DONE" && task.status !== "IN_REVIEW" && daysFromNow(task.endDate) < 0;

  const handleCreate = async (data: any) => {
    const res = await fetch(`/api/projects/${project.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create task");
    toast.success("Task created");
    router.refresh();
  };

  const handleUpdate = async (data: any) => {
    if (!editingTask) return;
    const res = await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update task");
    toast.success("Task updated");
    setEditingTask(null);
    router.refresh();
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Failed to delete task");
    toast.success("Task deleted");
    router.refresh();
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) return toast.error("Failed to update status");
    router.refresh();
  };

  const handleApprove = async (task: TaskWithDeps) => {
    setApprovingId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) {
        toast.error("Failed to approve task");
        return;
      }
      toast.success(`"${task.title}" approved — marked as Done`);
      router.refresh();
    } finally {
      setApprovingId(null);
    }
  };

  const handleReopen = async (task: TaskWithDeps) => {
    setReopeningId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reopen", reopenReason: "Reopened by manager" }),
      });
      if (!res.ok) {
        toast.error("Failed to reopen task");
        return;
      }
      toast.success(`"${task.title}" reopened`);
      router.refresh();
    } finally {
      setReopeningId(null);
    }
  };

  const availableForDeps = tasks.filter((t) => (editingTask ? t.id !== editingTask.id : true));
  const inReviewCount = tasks.filter((t) => t.status === "IN_REVIEW").length;

  return (
    <div className="max-w-5xl space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 bg-white border border-slate-200/80 rounded-xl p-1 shadow-sm flex-wrap">
          {(["ALL", "TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE"] as const).map((s) => {
            const count = s === "ALL" ? tasks.length : tasks.filter((t) => t.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  filter === s
                    ? s === "IN_REVIEW"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-violet-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                {STATUS_FILTER_LABELS[s]}
                <span
                  className={cn(
                    "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    filter === s ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {isManager && (
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </Button>
        )}
      </div>

      {/* IN_REVIEW alert banner */}
      {inReviewCount > 0 && canReview && filter !== "IN_REVIEW" && (
        <button
          onClick={() => setFilter("IN_REVIEW")}
          className="w-full flex items-center gap-2 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-700 font-medium hover:bg-purple-100 transition-colors"
        >
          <ClipboardCheck className="w-4 h-4" />
          {inReviewCount} task{inReviewCount !== 1 ? "s" : ""} awaiting your review
          <span className="ml-auto text-purple-500 text-xs">View →</span>
        </button>
      )}

      {/* Task Table */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <ListTodo className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-medium text-slate-700 mb-1">
            {filter === "ALL" ? "No tasks yet" : `No ${STATUS_FILTER_LABELS[filter].toLowerCase()} tasks`}
          </p>
          <p className="text-sm text-slate-400">
            {filter === "ALL" ? "Add your first task to start tracking progress" : "Switch filters to see other tasks"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Task</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Person</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Due</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTasks.map((task) => {
                const statusCfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];
                const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
                const overdue = isOverdue(task);
                const days = daysFromNow(task.endDate);
                const dueSoon =
                  !overdue && days >= 0 && days <= 3 && task.status !== "DONE" && task.status !== "IN_REVIEW";
                const isInReview = task.status === "IN_REVIEW";
                const isDone = task.status === "DONE";

                const displayName = task.assignedTo?.fullName ?? task.owner ?? null;
                const displayInitial =
                  task.assignedTo?.initials?.charAt(0) ??
                  displayName?.charAt(0).toUpperCase() ??
                  null;

                const showActivity = expandedActivity === task.id;

                return (
                  <>
                    <tr
                      key={task.id}
                      className={cn(
                        "hover:bg-slate-50/60 transition-colors group",
                        isInReview && "bg-purple-50/30",
                        overdue && !isInReview && "bg-red-50/40"
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900 flex items-center gap-2 flex-wrap">
                          {task.title}
                          {isInReview && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-purple-700 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded-full">
                              <ClipboardCheck className="w-3 h-3" />
                              In Review
                            </span>
                          )}
                          {task.reviewStatus === "REJECTED" && !isInReview && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                          {overdue && (
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
                        {task.dependsOn.length > 0 && (
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />
                            {task.dependsOn.length}{" "}
                            {task.dependsOn.length === 1 ? "dependency" : "dependencies"}
                          </div>
                        )}
                        {/* Effort estimate */}
                        {task.estimatedHours && (
                          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-amber-600">
                            <Timer className="w-3 h-3" />
                            {task.actualHours ? (
                              <>
                                <span className={task.actualHours > task.estimatedHours ? "text-red-500 font-medium" : "text-emerald-600 font-medium"}>
                                  {formatHours(task.actualHours)} actual
                                </span>
                                <span className="text-slate-400">/ {formatHours(task.estimatedHours)} est.</span>
                              </>
                            ) : (
                              <span>~{formatHours(task.estimatedHours)} est.</span>
                            )}
                          </div>
                        )}
                        {/* Work summary for IN_REVIEW */}
                        {isInReview && task.workSummary && (
                          <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">
                            "{task.workSummary}"
                          </p>
                        )}
                        {/* Rejection reason */}
                        {task.reviewStatus === "REJECTED" && task.rejectionReason && !isInReview && (
                          <p className="text-[11px] text-red-600 mt-1 italic line-clamp-1">
                            Feedback: {task.rejectionReason}
                          </p>
                        )}
                      </td>

                      {/* Status cell */}
                      <td className="px-4 py-3.5">
                        {isInReview ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border bg-purple-100 text-purple-700 border-purple-200">
                            <ClipboardCheck className="w-3 h-3" />
                            In Review
                          </span>
                        ) : isDone ? (
                          <span className={cn("text-xs rounded-lg border px-2 py-1 font-medium", statusCfg?.color)}>
                            Done
                          </span>
                        ) : (
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task, e.target.value)}
                            className={cn(
                              "text-xs rounded-lg border px-2 py-1 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-200 appearance-none",
                              statusCfg?.color
                            )}
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="BLOCKED">Blocked</option>
                            <option value="DONE">Done</option>
                          </select>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge className={priorityCfg.color}>{priorityCfg.label}</Badge>
                      </td>

                      <td className="px-4 py-3.5">
                        {displayName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-[11px] font-bold text-violet-600 shrink-0">
                              {displayInitial}
                            </div>
                            <span className="text-sm text-slate-700 truncate max-w-[100px]">
                              {displayName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={cn("text-sm", overdue ? "text-red-500 font-medium" : "text-slate-500")}>
                          {formatDate(task.endDate)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-0.5 justify-end">
                          {/* Review actions */}
                          {isInReview && canReview && (
                            <>
                              <button
                                onClick={() => handleApprove(task)}
                                disabled={approvingId === task.id}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-60"
                                title="Approve"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {approvingId === task.id ? "…" : "Approve"}
                              </button>
                              <button
                                onClick={() => setRejectingTask(task)}
                                disabled={approvingId === task.id}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-60 ml-1"
                                title="Reject"
                              >
                                <XCircle className="w-3 h-3" />
                                Reject
                              </button>
                            </>
                          )}

                          {/* Reopen (manager only, DONE tasks) */}
                          {isDone && isManager && (
                            <button
                              onClick={() => handleReopen(task)}
                              disabled={reopeningId === task.id}
                              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-60"
                              title="Reopen task"
                            >
                              <RotateCcw className="w-3 h-3" />
                              {reopeningId === task.id ? "…" : "Reopen"}
                            </button>
                          )}

                          {/* Activity log toggle */}
                          {task.activities && task.activities.length > 0 && (
                            <button
                              onClick={() => setExpandedActivity(showActivity ? null : task.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Activity log"
                            >
                              {showActivity ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* Standard edit/delete — hidden while IN_REVIEW (protect integrity) */}
                          {!isInReview && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isManager && (
                                <button
                                  onClick={() => setEditingTask(task)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {isManager && (
                                <button
                                  onClick={() => handleDelete(task.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Activity log expansion row */}
                    {showActivity && task.activities && task.activities.length > 0 && (
                      <tr key={`${task.id}-activity`} className="bg-slate-50/80">
                        <td colSpan={6} className="px-5 py-3">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Activity log
                          </p>
                          <div className="space-y-1.5">
                            {task.activities.map((act) => (
                              <div key={act.id} className="flex items-start gap-2 text-xs text-slate-600">
                                <span className="w-2 h-2 rounded-full bg-violet-300 mt-1 shrink-0" />
                                <span className="font-medium">{act.userFullName}</span>
                                <span className="text-slate-400">
                                  {ACTION_LABELS[act.action] ?? act.action}
                                  {act.details && act.action !== "submitted_for_review"
                                    ? `: "${act.details}"`
                                    : ""}
                                </span>
                                <span className="ml-auto text-slate-400 text-[11px] shrink-0">
                                  {formatDate(act.createdAt)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {isManager && (
        <TaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          availableTasks={tasks}
          allUsers={allUsers}
        />
      )}
      {isManager && editingTask && (
        <TaskModal
          isOpen={true}
          onClose={() => setEditingTask(null)}
          onSubmit={handleUpdate}
          task={editingTask}
          availableTasks={availableForDeps}
          allUsers={allUsers}
          title="Edit Task"
        />
      )}
      {rejectingTask && (
        <RejectTaskModal
          taskTitle={rejectingTask.title}
          taskId={rejectingTask.id}
          onClose={() => setRejectingTask(null)}
          onRejected={() => {
            setRejectingTask(null);
            router.refresh();
            toast.success("Task sent back with feedback");
          }}
        />
      )}
    </div>
  );
}
