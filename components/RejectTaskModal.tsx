"use client";

import { useState } from "react";
import { X, XCircle } from "lucide-react";

interface RejectTaskModalProps {
  taskTitle: string;
  taskId: string;
  onClose: () => void;
  onRejected: () => void;
}

export function RejectTaskModal({
  taskTitle,
  taskId,
  onClose,
  onRejected,
}: RejectTaskModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = reason.trim().length >= 10;

  async function handleReject() {
    if (!isValid) {
      setError("Please provide at least 10 characters explaining why this was rejected.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to reject task.");
        return;
      }
      onRejected();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Reject Task</h2>
              <p className="text-xs text-slate-500 mt-0.5">Provide feedback so the developer knows what to fix.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Task name */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Task</label>
            <p className="text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 line-clamp-2">
              {taskTitle}
            </p>
          </div>

          {/* Rejection reason */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Rejection reason <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain what needs to be fixed or improved..."
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <p className={`text-xs mt-1 ${reason.trim().length < 10 ? "text-slate-400" : "text-emerald-600"}`}>
              {reason.trim().length}/10 characters minimum
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={loading || !isValid}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <XCircle className="w-3.5 h-3.5" />
              {loading ? "Rejecting…" : "Reject Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
