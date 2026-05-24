"use client";

import { useState } from "react";
import { X, CalendarDays, AlertTriangle } from "lucide-react";

interface TeamMember {
  id: string;
  fullName: string;
  initials: string;
  role: string;
}

interface AddAvailabilityModalProps {
  defaultDate?: string; // YYYY-MM-DD
  userRole: string;
  userId: string;
  teamMembers?: TeamMember[]; // manager-only: list of team members
  onClose: () => void;
  onSuccess: () => void;
}

const TYPE_OPTIONS = [
  { value: "vacation", label: "🌴 Vacation", description: "Requires manager approval", needsApproval: true },
  { value: "sick",     label: "🤒 Sick Day",  description: "Auto-approved",             needsApproval: false },
  { value: "wfh",     label: "🏠 WFH",       description: "Working from home",          needsApproval: false },
  { value: "partial",  label: "⏰ Partial Day", description: "Available part of the day", needsApproval: false },
  { value: "holiday",  label: "🎉 Public Holiday", description: "Company-wide day off (manager only)", needsApproval: false, managerOnly: true },
];

export function AddAvailabilityModal({
  defaultDate,
  userRole,
  userId,
  teamMembers = [],
  onClose,
  onSuccess,
}: AddAvailabilityModalProps) {
  const isManager = userRole === "manager";

  const [startDate, setStartDate] = useState(defaultDate ?? "");
  const [endDate, setEndDate] = useState(defaultDate ?? "");
  const [type, setType] = useState<string>("vacation");
  const [note, setNote] = useState("");
  const [targetUserId, setTargetUserId] = useState<string>(
    isManager ? "" : userId // empty string = company-wide holiday for managers
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const availableTypes = TYPE_OPTIONS.filter((t) => isManager || !t.managerOnly);

  const selectedType = TYPE_OPTIONS.find((t) => t.value === type);
  const needsApproval = selectedType?.needsApproval && !isManager;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate) { setError("Start date is required."); return; }
    if (!endDate) { setError("End date is required."); return; }
    if (startDate > endDate) { setError("End date must be on or after start date."); return; }

    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      startDate,
      endDate,
      type,
      note: note.trim() || undefined,
    };

    // Manager: set userId (null = company holiday if type=holiday and no user selected)
    if (isManager) {
      if (type === "holiday") {
        payload.userId = null; // company-wide
      } else {
        if (!targetUserId) { setError("Please select a team member."); setSaving(false); return; }
        payload.userId = targetUserId;
      }
    }

    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save");
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Add Availability Entry</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Manager: who is this for? */}
          {isManager && type !== "holiday" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Team Member</label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="">Select team member…</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {availableTypes.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    type === opt.value
                      ? "border-violet-500 bg-violet-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={opt.value}
                    checked={type === opt.value}
                    onChange={() => setType(opt.value)}
                    className="mt-0.5 accent-violet-600 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800 leading-tight">{opt.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate || e.target.value > endDate) setEndDate(e.target.value);
                }}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Doctor's appointment, family trip…"
              className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Approval notice */}
          {needsApproval && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              This request will be pending until a manager approves it.
            </div>
          )}

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
              {saving ? "Saving…" : needsApproval ? "Submit Request" : "Add Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
