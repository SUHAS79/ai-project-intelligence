"use client";

import { useState } from "react";
import { X, Video, AlertTriangle } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface CreateMeetingModalProps {
  projects: Project[];
  onClose: () => void;
  onCreated: (meeting: any) => void;
}

export function CreateMeetingModal({ projects, onClose, onCreated }: CreateMeetingModalProps) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Meeting title is required."); return; }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          projectId: projectId || null,
          scheduledAt: scheduledAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create meeting");
        return;
      }
      const meeting = await res.json();
      onCreated(meeting);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Video className="w-4 h-4 text-violet-500" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">New Meeting</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Meeting Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sprint Planning, Design Review…"
              className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Project link */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Link to Project (optional)</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              <option value="">No project link</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Scheduled time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Scheduled Date & Time (optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-slate-400 mt-1">Leave blank for an instant / on-demand meeting.</p>
          </div>

          {/* Info */}
          <div className="bg-violet-50 border border-violet-100 rounded-xl px-3.5 py-2.5 text-xs text-violet-700">
            A unique Jitsi room will be created. Anyone with the link can join — share it from the meeting card.
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
