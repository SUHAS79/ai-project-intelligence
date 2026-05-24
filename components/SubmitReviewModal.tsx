"use client";

import { useState } from "react";
import { X, SendHorizonal, FileCheck, Timer } from "lucide-react";
import { formatHours } from "@/lib/utils";

interface SubmitReviewModalProps {
  taskTitle: string;
  taskId: string;
  estimatedHours?: number | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export function SubmitReviewModal({
  taskTitle,
  taskId,
  estimatedHours,
  onClose,
  onSubmitted,
}: SubmitReviewModalProps) {
  const [workSummary, setWorkSummary] = useState("");
  const [actualHoursStr, setActualHoursStr] = useState(
    estimatedHours ? String(estimatedHours) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const actualHoursParsed = parseFloat(actualHoursStr);
  const actualHoursValid = !isNaN(actualHoursParsed) && actualHoursParsed > 0;

  // Variance display
  const variance =
    estimatedHours && actualHoursValid
      ? actualHoursParsed - estimatedHours
      : null;

  async function handleSubmit() {
    if (!workSummary.trim()) {
      setError("Please describe what you did.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workSummary: workSummary.trim(),
          actualHours: actualHoursValid ? actualHoursParsed : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit for review.");
        return;
      }
      onSubmitted();
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <FileCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Submit for Review</h2>
              <p className="text-xs text-slate-500 mt-0.5">Describe your work before sending for approval.</p>
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

          {/* Work summary */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Work summary <span className="text-red-400">*</span>
            </label>
            <textarea
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              placeholder="What did you build / fix / implement? Include any notes for the reviewer..."
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{workSummary.length} characters</p>
          </div>

          {/* Actual hours */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              <span className="flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-amber-500" />
                Actual time spent
                {estimatedHours && (
                  <span className="text-slate-400 font-normal">
                    (estimated {formatHours(estimatedHours)})
                  </span>
                )}
              </span>
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={actualHoursStr}
                  onChange={(e) => setActualHoursStr(e.target.value)}
                  placeholder="e.g. 6"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-12 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                  hours
                </span>
              </div>
              {variance !== null && (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-lg border ${
                    variance > 0
                      ? "text-red-700 bg-red-50 border-red-200"
                      : "text-emerald-700 bg-emerald-50 border-emerald-200"
                  }`}
                >
                  {variance > 0 ? `+${formatHours(variance)} over` : `${formatHours(Math.abs(variance))} under`}
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !workSummary.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <SendHorizonal className="w-3.5 h-3.5" />
              {loading ? "Submitting…" : "Submit for Review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
