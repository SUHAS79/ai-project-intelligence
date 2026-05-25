"use client";

import { useState } from "react";
import { AlertTriangle, MessageSquare, CheckCircle2, Clock, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { RespondEscalationModal } from "./RespondEscalationModal";
import { TaskCommentThread } from "./TaskCommentThread";
import { SLABadge } from "./SLABadge";
import { useRouter } from "next/navigation";

interface EscalationFull {
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
}

interface EscalationsSectionProps {
  escalations: EscalationFull[];
  userRole: string;
  userId: string;
  title: string;
  emptyMessage: string;
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-orange-100 text-orange-700 border-orange-200",
  RESPONDED: "bg-blue-100 text-blue-700 border-blue-200",
  RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  RESPONDED: "Responded",
  RESOLVED: "Resolved",
};

const TARGET_LABEL: Record<string, string> = {
  manager: "Manager",
  senior_developer: "Senior Dev",
  both: "Manager & Senior Dev",
};

export function EscalationsSection({
  escalations,
  userRole,
  userId,
  title,
  emptyMessage,
}: EscalationsSectionProps) {
  const router = useRouter();
  const [respondingTo, setRespondingTo] = useState<EscalationFull | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [contactTask, setContactTask] = useState<{ id: string; title: string } | null>(null);

  const canRespond = userRole === "manager" || userRole === "senior_developer";

  async function handleDelete(id: string) {
    if (!confirm("Delete this escalation?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/escalations/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Escalation deleted.");
      } else {
        toast.error("Failed to delete escalation.");
      }
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  if (escalations.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-6 text-center text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {escalations.map((esc) => {
          const isOpen = expanded === esc.id;
          const isOwn = esc.createdBy.id === userId;

          return (
            <div
              key={esc.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                esc.status === "OPEN" ? "border-orange-200" : "border-slate-200"
              }`}
            >
              {/* Card header */}
              <div className="flex items-start gap-3 px-4 py-3.5">
                {/* Initiator avatar */}
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 mt-0.5">
                  {esc.createdBy.initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{esc.createdBy.fullName}</span>
                    <span className="text-xs text-slate-400">→</span>
                    <span className="text-xs text-slate-500">{TARGET_LABEL[esc.targetRole]}</span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[esc.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
                    >
                      {STATUS_LABELS[esc.status] ?? esc.status}
                    </span>
                    {(esc.status === "OPEN" || esc.status === "RESPONDED") && (
                      <SLABadge
                        since={esc.createdAt}
                        type="escalation"
                        label={esc.status === "OPEN" ? "Open" : "Open"}
                      />
                    )}
                    {esc.task && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {esc.task.title}
                      </span>
                    )}
                  </div>

                  {/* Message preview */}
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {esc.message}
                  </p>

                  {/* Response preview */}
                  {esc.response && !isOpen && (
                    <p className="text-xs text-emerald-700 mt-1 line-clamp-1">
                      ✓ {esc.respondedBy?.fullName}: {esc.response}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400">{format(new Date(esc.createdAt), "MMM d, h:mm a")}</span>
                    <span className="text-slate-200">·</span>
                    <span className="text-xs text-slate-400">{esc.project.name}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {canRespond && esc.status !== "RESOLVED" && (
                    <button
                      onClick={() => setRespondingTo(esc)}
                      className="px-2.5 py-1 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors"
                    >
                      Respond
                    </button>
                  )}
                  {/* Contact sender — open task thread if escalation has a task */}
                  {esc.task && (
                    <button
                      onClick={() => setContactTask({ id: esc.task!.id, title: esc.task!.title })}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
                      title="Open task thread to contact sender"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Thread
                    </button>
                  )}
                  {(isOwn || userRole === "manager") && esc.status === "OPEN" && (
                    <button
                      onClick={() => handleDelete(esc.id)}
                      disabled={deleting === esc.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setExpanded(isOpen ? null : esc.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-slate-100 px-4 py-3.5 bg-slate-50 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Full Message</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{esc.message}</p>
                  </div>
                  {esc.task && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Attached Task</p>
                      <p className="text-sm text-slate-700">
                        {esc.task.title} —{" "}
                        <span className="text-slate-500">
                          {esc.task.status.replace(/_/g, " ")} · Priority: {esc.task.priority}
                        </span>
                      </p>
                    </div>
                  )}
                  {esc.response && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Response</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{esc.response}</p>
                      {esc.respondedBy && (
                        <p className="text-xs text-slate-400 mt-1">
                          — {esc.respondedBy.fullName}
                          {esc.respondedAt ? `, ${format(new Date(esc.respondedAt), "MMM d, h:mm a")}` : ""}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {respondingTo && (
        <RespondEscalationModal
          escalation={respondingTo}
          onClose={() => setRespondingTo(null)}
          onSuccess={() => {
            setRespondingTo(null);
            router.refresh();
          }}
        />
      )}
      {contactTask && (
        <TaskCommentThread
          taskId={contactTask.id}
          taskTitle={contactTask.title}
          currentUserId={userId}
          onClose={() => setContactTask(null)}
        />
      )}
    </>
  );
}
