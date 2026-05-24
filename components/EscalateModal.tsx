"use client";

import { useState } from "react";
import { X, AlertTriangle, ChevronDown } from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface Project {
  id: string;
  name: string;
}

interface EscalateModalProps {
  project: Project;
  task?: Task | null;
  userRole: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TARGET_ROLE_OPTIONS = [
  { value: "manager", label: "Manager", description: "Formal escalation to project manager" },
  { value: "senior_developer", label: "Senior Developer", description: "Technical help or unblocking" },
  { value: "both", label: "Both", description: "Critical issue requiring immediate attention" },
];

export function EscalateModal({ project, task, userRole, onClose, onSuccess }: EscalateModalProps) {
  const [message, setMessage] = useState(
    task ? `I am blocked on "${task.title}" and need help. ` : ""
  );
  const [targetRole, setTargetRole] = useState<"manager" | "senior_developer" | "both">(
    userRole === "senior_developer" ? "manager" : "senior_developer"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 10) {
      setError("Message must be at least 10 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          taskId: task?.id ?? undefined,
          message: message.trim(),
          targetRole,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to send escalation");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Send Escalation</h2>
              <p className="text-xs text-slate-500">{project.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Task context */}
          {task && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Attached Task</p>
              <p className="text-sm font-semibold text-slate-800">{task.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">Status: {task.status.replace(/_/g, " ")}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">Priority: {task.priority}</span>
              </div>
            </div>
          )}

          {/* Target role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Send to</label>
            <div className="space-y-2">
              {TARGET_ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    targetRole === opt.value
                      ? "border-violet-500 bg-violet-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetRole"
                    value={opt.value}
                    checked={targetRole === opt.value}
                    onChange={() => setTargetRole(opt.value as typeof targetRole)}
                    className="mt-0.5 accent-violet-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-800">{opt.label}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Describe the blocker or request in detail. What have you tried? What do you need?"
              className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{message.length} chars — minimum 10</p>
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
            >
              {saving ? "Sending…" : "Send Escalation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
