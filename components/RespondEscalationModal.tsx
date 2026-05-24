"use client";

import { useState } from "react";
import { X, MessageSquare, CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

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

interface RespondEscalationModalProps {
  escalation: EscalationFull;
  onClose: () => void;
  onSuccess: () => void;
}

export function RespondEscalationModal({ escalation, onClose, onSuccess }: RespondEscalationModalProps) {
  const [response, setResponse] = useState(escalation.response ?? "");
  const [action, setAction] = useState<"respond" | "resolve">("respond");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (action === "respond" && response.trim().length < 5) {
      setError("Response must be at least 5 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/escalations/${escalation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, response: response.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update escalation");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const targetLabel =
    escalation.targetRole === "manager"
      ? "Manager"
      : escalation.targetRole === "senior_developer"
      ? "Senior Developer"
      : "Manager & Senior Dev";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Respond to Escalation</h2>
              <p className="text-xs text-slate-500">{escalation.project.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Escalation details */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center text-xs font-bold text-orange-800">
                  {escalation.createdBy.initials}
                </div>
                <span className="text-sm font-semibold text-slate-800">{escalation.createdBy.fullName}</span>
                <span className="text-xs text-slate-500 capitalize">({escalation.createdBy.role.replace(/_/g, " ")})</span>
              </div>
              <span className="text-xs text-slate-400">{format(new Date(escalation.createdAt), "MMM d, h:mm a")}</span>
            </div>
            {escalation.task && (
              <div className="text-xs text-orange-700 font-medium">
                Task: {escalation.task.title} ({escalation.task.status.replace(/_/g, " ")})
              </div>
            )}
            <p className="text-sm text-slate-700 leading-relaxed">{escalation.message}</p>
            <p className="text-xs text-slate-400">Sent to: {targetLabel}</p>
          </div>

          {/* Existing response if any */}
          {escalation.response && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Previous Response</p>
              <p className="text-sm text-slate-700">{escalation.response}</p>
              {escalation.respondedBy && (
                <p className="text-xs text-slate-400 mt-1">— {escalation.respondedBy.fullName}{escalation.respondedAt ? `, ${format(new Date(escalation.respondedAt), "MMM d")}` : ""}</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Action */}
            <div className="flex gap-3">
              <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${action === "respond" ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-slate-300"}`}>
                <input type="radio" name="action" value="respond" checked={action === "respond"} onChange={() => setAction("respond")} className="accent-violet-600" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Respond</p>
                  <p className="text-xs text-slate-500">Add a response, keep open</p>
                </div>
              </label>
              <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${action === "resolve" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}>
                <input type="radio" name="action" value="resolve" checked={action === "resolve"} onChange={() => setAction("resolve")} className="accent-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Resolve</p>
                  <p className="text-xs text-slate-500">Mark as resolved</p>
                </div>
              </label>
            </div>

            {/* Response text */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {action === "resolve" ? "Resolution note (optional)" : "Response"} {action === "respond" && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={3}
                placeholder={
                  action === "resolve"
                    ? "Describe how this was resolved…"
                    : "Provide your response or guidance…"
                }
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-60 ${
                  action === "resolve"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-violet-600 hover:bg-violet-700"
                }`}
              >
                {saving ? "Saving…" : action === "resolve" ? "Mark Resolved" : "Send Response"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
