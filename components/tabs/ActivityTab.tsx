"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { History, AlertCircle, RefreshCw } from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  action: string;
  actorId: string | null;
  actorName: string;
  actorRole: string;
  details: string;
  createdAt: string;
}

interface ActivityTabProps {
  projectId: string;
}

// Entity type icon
const ENTITY_ICON: Record<string, string> = {
  task:       "📋",
  escalation: "🚨",
  meeting:    "📅",
  member:     "👤",
  project:    "🗂️",
};

// Action → accent colour for the dot on the timeline
const ACTION_DOT: Record<string, string> = {
  created:              "bg-emerald-400",
  assigned:             "bg-blue-400",
  reassigned:           "bg-blue-400",
  approved:             "bg-emerald-500",
  rejected:             "bg-red-400",
  submitted_for_review: "bg-violet-400",
  status_changed:       "bg-amber-400",
  reopened:             "bg-amber-400",
  responded:            "bg-blue-400",
  resolved:             "bg-emerald-400",
  scheduled:            "bg-indigo-400",
  member_added:         "bg-emerald-400",
  member_removed:       "bg-red-400",
};

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Group activity items by calendar day */
function groupByDay(items: ActivityItem[]): { label: string; items: ActivityItem[] }[] {
  const groups: Map<string, ActivityItem[]> = new Map();
  for (const item of items) {
    const d = new Date(item.createdAt);
    let key: string;
    if (isToday(d)) key = "Today";
    else if (isYesterday(d)) key = "Yesterday";
    else key = format(d, "EEEE, MMMM d, yyyy");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

export function ActivityTab({ projectId }: ActivityTabProps) {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivity = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/activity`);
      if (!res.ok) {
        setError("Failed to load activity log.");
        return;
      }
      const data = await res.json();
      setActivity(data.activity ?? []);
      setError("");
    } catch {
      setError("Network error loading activity.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const grouped = groupByDay(activity);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
            <History className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Activity Log</h2>
            <p className="text-xs text-slate-400">Full audit trail for this project</p>
          </div>
        </div>
        <button
          onClick={() => fetchActivity(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 flex justify-center">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 flex flex-col items-center gap-2 text-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      ) : activity.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-10 flex flex-col items-center gap-2 text-center">
          <History className="w-8 h-8 text-slate-200 mb-1" />
          <p className="text-sm font-medium text-slate-500">No activity recorded yet</p>
          <p className="text-xs text-slate-400">Actions on tasks, meetings, escalations, and team changes will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ label, items }) => (
            <div key={label}>
              {/* Day divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  {label}
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Items for this day */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                {items.map((item, idx) => {
                  const dotColor = ACTION_DOT[item.action] ?? "bg-slate-300";
                  const icon = ENTITY_ICON[item.entityType] ?? "🔔";
                  const initials = computeInitials(item.actorName);
                  const roleLabel = ROLE_LABELS[item.actorRole] ?? item.actorRole;
                  const roleColor = ROLE_COLORS[item.actorRole] ?? "bg-slate-100 text-slate-600 border-slate-200";

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3.5",
                        idx !== items.length - 1 && "border-b border-slate-100"
                      )}
                    >
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center shrink-0 pt-1">
                        <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />
                      </div>

                      {/* Actor avatar */}
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-[9px] font-bold text-white mt-0.5">
                        {initials}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="text-xs font-semibold text-slate-800">{item.actorName}</span>
                          <span className={cn("text-[9px] px-1 py-0.5 rounded border font-medium", roleColor)}>
                            {roleLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">
                          <span className="mr-1.5">{icon}</span>
                          {item.details}
                        </p>
                      </div>

                      {/* Timestamp */}
                      <span
                        className="text-[10px] text-slate-400 shrink-0 mt-0.5 whitespace-nowrap"
                        title={format(new Date(item.createdAt), "PPpp")}
                      >
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <p className="text-center text-[11px] text-slate-400 pb-2">
            Showing last {activity.length} events
          </p>
        </div>
      )}
    </div>
  );
}
