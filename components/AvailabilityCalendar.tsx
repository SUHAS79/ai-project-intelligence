"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Plus, Check, X, CalendarDays, Users, AlertTriangle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, parseISO, isToday, isBefore } from "date-fns";
import { AddAvailabilityModal } from "./AddAvailabilityModal";
import { cn } from "@/lib/utils";

interface AvailabilityEntry {
  id: string;
  userId: string | null;
  startDate: string;
  endDate: string;
  type: string;
  note: string | null;
  approved: boolean;
  user: { id: string; fullName: string; initials: string; role: string } | null;
}

interface TeamMember {
  id: string;
  fullName: string;
  initials: string;
  role: string;
}

interface AvailabilityCalendarProps {
  userRole: string;
  userId: string;
  teamMembers: TeamMember[];
  initialEntries: AvailabilityEntry[];
  initialYear: number;
  initialMonth: number; // 1-12
}

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  holiday: { bg: "bg-red-100",    text: "text-red-700",    label: "Holiday",   dot: "bg-red-500" },
  vacation:{ bg: "bg-blue-100",   text: "text-blue-700",   label: "Vacation",  dot: "bg-blue-500" },
  sick:    { bg: "bg-orange-100", text: "text-orange-700", label: "Sick",      dot: "bg-orange-500" },
  wfh:     { bg: "bg-emerald-100",text: "text-emerald-700",label: "WFH",       dot: "bg-emerald-500" },
  partial: { bg: "bg-purple-100", text: "text-purple-700", label: "Partial",   dot: "bg-purple-500" },
};

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateInRange(dateStr: string, startDate: string, endDate: string): boolean {
  return dateStr >= startDate && dateStr <= endDate;
}

export function AvailabilityCalendar({
  userRole,
  userId,
  teamMembers,
  initialEntries,
  initialYear,
  initialMonth,
}: AvailabilityCalendarProps) {
  const router = useRouter();
  const isManager = userRole === "manager";

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth); // 1-12
  const [entries, setEntries] = useState<AvailabilityEntry[]>(initialEntries);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDefaultDate, setAddDefaultDate] = useState<string | undefined>();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  async function fetchMonth(y: number, m: number) {
    setLoadingMonth(true);
    try {
      const ms = `${y}-${String(m).padStart(2, "0")}`;
      const res = await fetch(`/api/availability?month=${ms}`);
      if (res.ok) setEntries(await res.json());
    } finally {
      setLoadingMonth(false);
    }
  }

  function prevMonth() {
    let m = month - 1, y = year;
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y); setSelectedDay(null);
    fetchMonth(y, m);
  }

  function nextMonth() {
    let m = month + 1, y = year;
    if (m > 12) { m = 1; y++; }
    setMonth(m); setYear(y); setSelectedDay(null);
    fetchMonth(y, m);
  }

  // Build calendar days
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay });
  const startPadding = getDay(firstDay); // 0=Sun

  // Get entries for a given date string (YYYY-MM-DD)
  function getEntriesForDate(dateStr: string): AvailabilityEntry[] {
    return entries.filter((e) => dateInRange(dateStr, e.startDate, e.endDate));
  }

  // Entries for selected day
  const selectedEntries = selectedDay ? getEntriesForDate(selectedDay) : [];
  const pendingCount = entries.filter((e) => !e.approved && e.type === "vacation").length;

  async function handleApprove(id: string, approved: boolean) {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/availability/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      }
    } finally {
      setApprovingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/availability/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        if (selectedDay) {
          // re-check if day still has entries
          const remaining = entries.filter((e) => e.id !== id && dateInRange(selectedDay, e.startDate, e.endDate));
          if (remaining.length === 0) setSelectedDay(null);
        }
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 w-40 text-center">
              {format(new Date(year, month - 1, 1), "MMMM yyyy")}
            </h2>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          {loadingMonth && (
            <span className="text-xs text-slate-400 animate-pulse">Loading…</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isManager && pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {pendingCount} pending approval
            </div>
          )}
          <button
            onClick={() => { setAddDefaultDate(undefined); setShowAddModal(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {isManager ? "Add Entry" : "Request Day Off"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(TYPE_STYLES).map(([key, style]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
            <span className="text-xs text-slate-500">{style.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-dashed border-slate-400" />
          <span className="text-xs text-slate-400">Pending</span>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Calendar grid */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DAY_HEADERS.map((d) => (
                <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {/* Padding cells */}
              {Array.from({ length: startPadding }).map((_, i) => (
                <div key={`pad-${i}`} className="aspect-[1/1.1] border-r border-b border-slate-50/80 bg-slate-50/50" />
              ))}

              {daysInMonth.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayEntries = getEntriesForDate(dateStr);
                const isSelected = selectedDay === dateStr;
                const today = isToday(day);
                const weekend = getDay(day) === 0 || getDay(day) === 6;
                const hasHoliday = dayEntries.some((e) => e.type === "holiday");

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                    className={cn(
                      "aspect-[1/1.1] border-r border-b border-slate-100 p-1.5 cursor-pointer transition-colors relative",
                      isSelected ? "bg-violet-50 border-violet-200" : "hover:bg-slate-50",
                      weekend && !isSelected && "bg-slate-50/60",
                      hasHoliday && !isSelected && "bg-red-50/40"
                    )}
                  >
                    {/* Date number */}
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1",
                      today ? "bg-violet-600 text-white" : "text-slate-700"
                    )}>
                      {format(day, "d")}
                    </div>

                    {/* Entry dots */}
                    {dayEntries.length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {dayEntries.slice(0, 4).map((entry) => {
                          const style = TYPE_STYLES[entry.type] ?? TYPE_STYLES.vacation;
                          return (
                            <div
                              key={entry.id}
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold",
                                style.bg, style.text,
                                !entry.approved && "opacity-50 border border-dashed border-current"
                              )}
                              title={`${entry.user?.fullName ?? "Company"}: ${style.label}${!entry.approved ? " (pending)" : ""}`}
                            >
                              {entry.user?.initials ?? "🏢"}
                            </div>
                          );
                        })}
                        {dayEntries.length > 4 && (
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                            +{dayEntries.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side panel — selected day or list */}
        <div className="w-72 shrink-0">
          {selectedDay ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {format(parseISO(selectedDay), "EEEE, MMM d")}
                  </p>
                  <p className="text-xs text-slate-400">{selectedEntries.length} entries</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setAddDefaultDate(selectedDay); setShowAddModal(true); }}
                    className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-600 transition-colors"
                    title="Add entry for this day"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
                {selectedEntries.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No entries for this day.</p>
                ) : (
                  selectedEntries.map((entry) => {
                    const style = TYPE_STYLES[entry.type] ?? TYPE_STYLES.vacation;
                    const isOwn = entry.userId === userId;
                    const canDelete = isManager || isOwn;
                    const canApprove = isManager && !entry.approved && entry.type === "vacation";

                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          "rounded-xl border p-3",
                          entry.approved ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0", style.bg, style.text)}>
                            {entry.user?.initials ?? "🏢"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {entry.userId === null ? "Company Holiday" : entry.user?.fullName ?? "Unknown"}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={cn("text-[11px] font-semibold px-1.5 py-0.5 rounded-full", style.bg, style.text)}>
                                {style.label}
                              </span>
                              {!entry.approved && (
                                <span className="text-[11px] text-amber-600 font-medium">Pending</span>
                              )}
                            </div>
                            {entry.startDate !== entry.endDate && (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {format(parseISO(entry.startDate), "MMM d")} – {format(parseISO(entry.endDate), "MMM d")}
                              </p>
                            )}
                            {entry.note && (
                              <p className="text-[11px] text-slate-500 mt-1 italic">{entry.note}</p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 mt-2.5">
                          {canApprove && (
                            <>
                              <button
                                onClick={() => handleApprove(entry.id, true)}
                                disabled={approvingId === entry.id}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors disabled:opacity-60"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleApprove(entry.id, false)}
                                disabled={approvingId === entry.id}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-60"
                              >
                                <X className="w-3 h-3" /> Reject
                              </button>
                            </>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(entry.id)}
                              disabled={deletingId === entry.id}
                              className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 text-xs hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                            >
                              <X className="w-3 h-3" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* This month's list */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">
                  {format(new Date(year, month - 1, 1), "MMMM")} — All Entries
                </p>
                <p className="text-xs text-slate-400">{entries.length} total</p>
              </div>
              <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-50">
                {entries.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">No entries this month.</p>
                ) : (
                  entries.map((entry) => {
                    const style = TYPE_STYLES[entry.type] ?? TYPE_STYLES.vacation;
                    return (
                      <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0", style.bg, style.text)}>
                          {entry.user?.initials ?? "🏢"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">
                            {entry.userId === null ? "Company Holiday" : entry.user?.fullName ?? "—"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {entry.startDate === entry.endDate
                              ? format(parseISO(entry.startDate), "MMM d")
                              : `${format(parseISO(entry.startDate), "MMM d")} – ${format(parseISO(entry.endDate), "MMM d")}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", style.bg, style.text)}>
                            {style.label}
                          </span>
                          {!entry.approved && (
                            <span className="text-[10px] text-amber-500 font-medium">Pending</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddAvailabilityModal
          defaultDate={addDefaultDate}
          userRole={userRole}
          userId={userId}
          teamMembers={teamMembers}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchMonth(year, month);
          }}
        />
      )}
    </div>
  );
}
