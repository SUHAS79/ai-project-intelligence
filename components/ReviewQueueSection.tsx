"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  CalendarClock,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { RejectTaskModal } from "./RejectTaskModal";
import { toast } from "sonner";

type ReviewTask = {
  id: string;
  title: string;
  workSummary: string | null;
  submittedForReviewAt: string | Date | null;
  project: { id: string; name: string };
  assignedTo: { id: string; fullName: string; initials: string } | null;
};

interface ReviewQueueSectionProps {
  initialTasks: ReviewTask[];
}

export function ReviewQueueSection({ initialTasks }: ReviewQueueSectionProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<ReviewTask[]>(initialTasks);
  const [rejectingTask, setRejectingTask] = useState<ReviewTask | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  async function handleApprove(task: ReviewTask) {
    setApproving(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) {
        toast.error("Failed to approve task.");
        return;
      }
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success(`"${task.title}" approved and marked as Done.`);
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setApproving(null);
    }
  }

  function handleRejected(taskId: string, taskTitle: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setRejectingTask(null);
    toast.success(`"${taskTitle}" sent back with feedback.`);
    router.refresh();
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 text-center">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
        <p className="text-sm font-medium text-slate-700">Review queue is clear</p>
        <p className="text-xs text-slate-400 mt-1">No tasks are waiting for your review.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-xl border border-purple-200/60 shadow-sm p-5"
          >
            <div className="flex items-start gap-4">
              {/* Assignee avatar */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm shadow-violet-200/50">
                <span className="text-xs font-bold text-white">
                  {task.assignedTo?.initials ?? "?"}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                {/* Task + project */}
                <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{task.title}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {task.assignedTo?.fullName ?? "Unknown"}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="font-medium text-slate-500">{task.project.name}</span>
                  {task.submittedForReviewAt && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        Submitted {formatDate(task.submittedForReviewAt)}
                      </span>
                    </>
                  )}
                </div>

                {/* Work summary */}
                {task.workSummary && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2.5 mb-3">
                    <p className="text-xs text-slate-500 font-medium mb-1">Work summary</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{task.workSummary}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(task)}
                    disabled={approving === task.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {approving === task.id ? "Approving…" : "Approve"}
                  </button>
                  <button
                    onClick={() => setRejectingTask(task)}
                    disabled={approving === task.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors disabled:opacity-60"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>

              {/* In Review badge */}
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                <Clock className="w-3 h-3" />
                In Review
              </span>
            </div>
          </div>
        ))}
      </div>

      {rejectingTask && (
        <RejectTaskModal
          taskTitle={rejectingTask.title}
          taskId={rejectingTask.id}
          onClose={() => setRejectingTask(null)}
          onRejected={() => handleRejected(rejectingTask.id, rejectingTask.title)}
        />
      )}
    </>
  );
}
