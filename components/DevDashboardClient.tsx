"use client";

import { useState } from "react";
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
  SendHorizonal,
  XCircle,
  ClipboardCheck,
  Timer,
  Siren,
  MessageSquare,
} from "lucide-react";
import {
  cn,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  formatDate,
  daysFromNow,
  formatHours,
} from "@/lib/utils";
import type { TokenPayload } from "@/lib/roles";
import { SubmitReviewModal } from "./SubmitReviewModal";
import { SetEstimateModal } from "./SetEstimateModal";
import { ReviewQueueSection } from "./ReviewQueueSection";
import { EscalateModal } from "./EscalateModal";
import { EscalationsSection } from "./EscalationsSection";
import { toast } from "sonner";

type EscalationFull = {
  id: string;
  message: string;
  status: string;
  targetRole: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  project: { id: string; name: string };
  task: { id: string; title: string; status: string; priority: string } | null;
  createdBy: { id: string; fullName: string; initials: string; role: string };
  respondedBy: { id: string; fullName: string; initials: string } | null;
};

type ReviewTask = {
  id: string;
  title: string;
  workSummary: string | null;
  submittedForReviewAt: string | Date | null;
  project: { id: string; name: string };
  assignedTo: { id: string; fullName: string; initials: string } | null;
};

type AssignedTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | Date;
  endDate: string | Date;
  completedAt: string | Date | null;
  reviewStatus: string | null;
  workSummary: string | null;
  rejectionReason: string | null;
  assignedToId: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
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
  reviewQueue?: ReviewTask[];
  myEscalations?: EscalationFull[];
  incomingEscalations?: EscalationFull[];
}

const STATUS_ORDER = ["IN_REVIEW", "IN_PROGRESS", "BLOCKED", "TODO", "DONE"];

export function DevDashboardClient({
  user,
  tasks: initialTasks,
  reviewQueue = [],
  myEscalations = [],
  incomingEscalations = [],
}: DevDashboardClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<AssignedTask[]>(initialTasks);
  const [submitForTask, setSubmitForTask] = useState<AssignedTask | null>(null);
  const [estimateForTask, setEstimateForTask] = useState<AssignedTask | null>(null);
  const [escalateForTask, setEscalateForTask] = useState<AssignedTask | null>(null);

  const isSeniorDev = user.role === "senior_developer";

  const sorted = [...tasks].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  );

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const inReview = tasks.filter((t) => t.status === "IN_REVIEW").length;
  const blocked = tasks.filter((t) => t.status === "BLOCKED").length;
  const rejected = tasks.filter((t) => t.reviewStatus === "REJECTED").length;
  const overdue = tasks.filter(
    (t) => t.status !== "DONE" && t.status !== "IN_REVIEW" && daysFromNow(t.endDate) < 0
  ).length;

  async function handleStatusChange(taskId: string, newStatus: string, task: AssignedTask) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      toast.error("Failed to update status");
      return;
    }
    const updated = { ...task, status: newStatus, reviewStatus: null, rejectionReason: null };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));

    // If moving to IN_PROGRESS with no estimate yet, prompt for estimate
    if (newStatus === "IN_PROGRESS" && !task.estimatedHours) {
      setEstimateForTask(updated);
    }
    router.refresh();
  }

  function handleEstimateSaved(taskId: string, hours: number) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, estimatedHours: hours } : t))
    );
    setEstimateForTask(null);
    toast.success(`Estimate set: ${formatHours(hours)}`);
  }

  function handleReviewSubmitted() {
    setSubmitForTask(null);
    router.refresh();
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow shadow-violet-200">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Hey, {user.fullName.split(" ")[0]}.
          </h1>
        </div>
        <p className="text-sm text-slate-500 ml-9">
          {isSeniorDev
            ? "Your tasks and review queue."
            : "Here are all the tasks currently assigned to you."}
        </p>
      </div>

      {/* ── REVIEW QUEUE (senior dev only) ── */}
      {isSeniorDev && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-semibold text-slate-800">Review Queue</h2>
            {reviewQueue.length > 0 && (
              <>
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {reviewQueue.length}
                </span>
                <span className="text-xs text-purple-600 font-medium ml-1">
                  {reviewQueue.length} task{reviewQueue.length !== 1 ? "s" : ""} waiting for review
                </span>
              </>
            )}
          </div>
          {reviewQueue.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-5 py-4 text-center text-sm text-slate-400">
              No tasks pending review. When developers submit work, it will appear here.
            </div>
          )}
          <ReviewQueueSection initialTasks={reviewQueue} />
        </section>
      )}

      {/* ── MY TASKS ── */}
      <section>
        <h2 className="text-sm font-semibold text-slate-800 mb-4">My Tasks</h2>

        {/* Stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={total} icon={Layers} color="text-slate-700" />
          <StatCard label="In Progress" value={inProgress} icon={Clock} color="text-blue-600" />
          {inReview > 0 ? (
            <StatCard label="In Review" value={inReview} icon={ClipboardCheck} color="text-purple-600" />
          ) : rejected > 0 ? (
            <StatCard label="Rejected" value={rejected} icon={XCircle} color="text-red-500" />
          ) : (
            <StatCard label="Blocked" value={blocked} icon={AlertCircle} color="text-red-500" />
          )}
          <StatCard
            label={overdue > 0 ? "Overdue" : "Completed"}
            value={overdue > 0 ? overdue : done}
            icon={overdue > 0 ? AlertTriangle : CheckCircle2}
            color={overdue > 0 ? "text-red-500" : "text-emerald-600"}
          />
        </div>

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
              const isOverdue =
                task.status !== "DONE" &&
                task.status !== "IN_REVIEW" &&
                daysFromNow(task.endDate) < 0;
              const days = daysFromNow(task.endDate);
              const dueSoon =
                !isOverdue &&
                days >= 0 &&
                days <= 3 &&
                task.status !== "DONE" &&
                task.status !== "IN_REVIEW";
              const isInReview = task.status === "IN_REVIEW";
              const isRejected = task.reviewStatus === "REJECTED";
              const isDone = task.status === "DONE";
              const needsEstimate =
                task.status === "IN_PROGRESS" && !task.estimatedHours;

              return (
                <div
                  key={task.id}
                  className={cn(
                    "bg-white rounded-xl border shadow-sm px-5 py-4",
                    isInReview
                      ? "border-purple-200/80 bg-purple-50/20"
                      : isRejected
                      ? "border-red-200/80 bg-red-50/20"
                      : isOverdue
                      ? "border-red-200/60 bg-red-50/30"
                      : "border-slate-200/80"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Status icon */}
                    <div
                      className={cn(
                        "mt-0.5 shrink-0",
                        isDone && "text-emerald-500",
                        task.status === "IN_PROGRESS" && !isRejected && "text-blue-500",
                        isInReview && "text-purple-500",
                        task.status === "BLOCKED" && "text-red-500",
                        task.status === "TODO" && "text-slate-300",
                        isRejected && "text-red-500"
                      )}
                    >
                      {isInReview ? (
                        <ClipboardCheck className="w-4 h-4" />
                      ) : isDone ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isRejected ? (
                        <XCircle className="w-4 h-4" />
                      ) : task.status === "BLOCKED" ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : task.status === "IN_PROGRESS" ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-medium text-slate-900 text-sm">{task.title}</span>
                        <span className={cn("text-[11px] px-1.5 py-0.5 rounded font-medium border", priorityCfg.color)}>
                          {priorityCfg.label}
                        </span>
                        {isInReview && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-purple-700 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded-full font-medium">
                            <ClipboardCheck className="w-3 h-3" />
                            Awaiting Review
                          </span>
                        )}
                        {isRejected && !isInReview && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-full font-medium">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        )}
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

                      <div className="flex items-center gap-3 text-xs text-slate-400 mb-1 flex-wrap">
                        <span className="font-medium text-slate-500" title={task.project.name}>
                          {task.project.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" />
                          Due {formatDate(task.endDate)}
                        </span>
                        {/* Estimate display */}
                        {task.estimatedHours && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Timer className="w-3 h-3" />
                            ~{formatHours(task.estimatedHours)} est.
                            {task.actualHours && task.actualHours !== task.estimatedHours && (
                              <span
                                className={cn(
                                  "ml-1 font-medium",
                                  task.actualHours > task.estimatedHours
                                    ? "text-red-500"
                                    : "text-emerald-600"
                                )}
                              >
                                ({formatHours(task.actualHours)} actual)
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                      )}

                      {/* Rejection reason */}
                      {isRejected && task.rejectionReason && (
                        <div className="mt-2.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          <p className="text-xs font-semibold text-red-700 mb-0.5">Rejection feedback:</p>
                          <p className="text-xs text-red-700">{task.rejectionReason}</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {/* Set estimate prompt */}
                        {needsEstimate && (
                          <button
                            onClick={() => setEstimateForTask(task)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors"
                          >
                            <Timer className="w-3.5 h-3.5" />
                            Set Estimate
                          </button>
                        )}
                        {/* Submit for review */}
                        {task.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => setSubmitForTask(task)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                          >
                            <SendHorizonal className="w-3.5 h-3.5" />
                            Submit for Review
                          </button>
                        )}
                        {/* Escalate button for BLOCKED or IN_PROGRESS tasks */}
                        {(task.status === "BLOCKED" || task.status === "IN_PROGRESS") && (
                          <button
                            onClick={() => setEscalateForTask(task)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-lg transition-colors"
                          >
                            <Siren className="w-3.5 h-3.5" />
                            Escalate
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status changer */}
                    {!isInReview && !isDone ? (
                      <div className="shrink-0">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value, task)}
                          className={cn(
                            "text-xs rounded-lg border px-2 py-1 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-200 appearance-none",
                            statusCfg?.color ?? "bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="BLOCKED">Blocked</option>
                        </select>
                      </div>
                    ) : (
                      <span
                        className={cn(
                          "shrink-0 text-xs rounded-lg border px-2 py-1 font-medium",
                          statusCfg?.color ?? "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        {STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]?.label ?? task.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── INCOMING ESCALATIONS (senior dev only) ── */}
      {isSeniorDev && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Siren className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-slate-800">Incoming Escalations</h2>
            {incomingEscalations.filter((e) => e.status === "OPEN").length > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                {incomingEscalations.filter((e) => e.status === "OPEN").length}
              </span>
            )}
          </div>
          <EscalationsSection
            escalations={incomingEscalations}
            userRole={user.role}
            userId={user.userId}
            title="Incoming Escalations"
            emptyMessage="No escalations directed to you."
          />
        </section>
      )}

      {/* ── MY ESCALATIONS ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">My Escalations</h2>
          {myEscalations.filter((e) => e.status !== "RESOLVED").length > 0 && (
            <span className="w-5 h-5 rounded-full bg-slate-400 text-white text-[10px] font-bold flex items-center justify-center">
              {myEscalations.filter((e) => e.status !== "RESOLVED").length}
            </span>
          )}
        </div>
        <EscalationsSection
          escalations={myEscalations}
          userRole={user.role}
          userId={user.userId}
          title="My Escalations"
          emptyMessage="You haven't sent any escalations yet. Use the Escalate button on a task when you're blocked."
        />
      </section>

      {/* Profile shortcut */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
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

      {/* Set estimate modal */}
      {estimateForTask && (
        <SetEstimateModal
          taskTitle={estimateForTask.title}
          taskId={estimateForTask.id}
          onClose={() => setEstimateForTask(null)}
          onSaved={(hours) => handleEstimateSaved(estimateForTask.id, hours)}
        />
      )}

      {/* Submit for review modal */}
      {submitForTask && (
        <SubmitReviewModal
          taskTitle={submitForTask.title}
          taskId={submitForTask.id}
          estimatedHours={submitForTask.estimatedHours}
          onClose={() => setSubmitForTask(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Escalate modal */}
      {escalateForTask && (
        <EscalateModal
          project={escalateForTask.project}
          task={escalateForTask}
          userRole={user.role}
          onClose={() => setEscalateForTask(null)}
          onSuccess={() => {
            setEscalateForTask(null);
            router.refresh();
          }}
        />
      )}
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
