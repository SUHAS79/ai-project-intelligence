"use client";

import { useState } from "react";
import { X, Timer } from "lucide-react";

interface SetEstimateModalProps {
  taskTitle: string;
  taskId: string;
  onClose: () => void;
  onSaved: (hours: number) => void;
}

export function SetEstimateModal({
  taskTitle,
  taskId,
  onClose,
  onSaved,
}: SetEstimateModalProps) {
  const [hours, setHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const parsed = parseFloat(hours);
  const isValid = !isNaN(parsed) && parsed > 0;

  async function handleSave() {
    if (!isValid) {
      setError("Please enter a valid number of hours.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimatedHours: parsed }),
      });
      if (!res.ok) {
        setError("Failed to save estimate.");
        return;
      }
      onSaved(parsed);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Quick-select presets
  const PRESETS = [
    { label: "1h", value: 1 },
    { label: "2h", value: 2 },
    { label: "4h", value: 4 },
    { label: "1 day", value: 8 },
    { label: "2 days", value: 16 },
    { label: "1 week", value: 40 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Timer className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Set Time Estimate</h2>
              <p className="text-xs text-slate-500 mt-0.5">How long do you expect this to take?</p>
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

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">Quick select</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setHours(String(p.value))}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    hours === String(p.value)
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manual input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Or enter hours manually
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 6"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-12 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                hours
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip for now
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || !isValid}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Timer className="w-3.5 h-3.5" />
                {loading ? "Saving…" : "Set Estimate"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
