"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

/** "sidebar" → dropdown opens to the right; "topbar" → dropdown opens downward, right-aligned */
interface NotificationsDropdownProps {
  placement?: "sidebar" | "topbar";
}

const TYPE_ICON: Record<string, string> = {
  task_assigned:              "📋",
  task_reassigned:            "🔄",
  task_status_changed:        "🔔",
  task_submitted_for_review:  "👀",
  task_approved:              "✅",
  task_rejected:              "❌",
  escalation_received:        "🚨",
  escalation_responded:       "💬",
  escalation_resolved:        "✔️",
  meeting_created:            "📅",
  project_assigned:           "🗂️",
};

export function NotificationsDropdown({ placement = "sidebar" }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Silently ignore — never break the UI for a notification poll failure
    }
  }, []);

  // Initial load + 30-second polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications(); // refresh on open
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
    setMarkingAll(false);
  }

  async function handleItemClick(n: AppNotification) {
    // Optimistically mark read
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      fetch(`/api/notifications/${n.id}`, { method: "PATCH" }).catch(() => {});
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  // Dropdown position classes
  const dropdownPos =
    placement === "sidebar"
      ? "left-full ml-3 bottom-0"       // opens to the right of sidebar
      : "right-0 top-full mt-1";        // opens downward from topbar

  return (
    <div ref={wrapperRef} className="relative">
      {/* Bell button */}
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        className={cn(
          "relative flex items-center justify-center rounded-lg transition-colors",
          placement === "sidebar"
            ? "w-full gap-2.5 px-2.5 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            : "w-8 h-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        )}
      >
        <Bell className="w-4 h-4 shrink-0" />
        {placement === "sidebar" && (
          <span className="flex-1 text-left">Notifications</span>
        )}
        {unreadCount > 0 && (
          <span
            className={cn(
              "min-w-[18px] h-[18px] bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none",
              placement === "sidebar"
                ? "ml-auto"
                : "absolute -top-0.5 -right-0.5 min-w-[16px] h-4 text-[9px]"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            "absolute w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] overflow-hidden flex flex-col",
            dropdownPos
          )}
          style={{ maxHeight: "420px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 shrink-0">
            <span className="text-[13px] font-semibold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 text-[11px] text-violet-600 hover:text-violet-700 transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Inbox className="w-6 h-6 text-slate-300 mb-2" />
                <p className="text-[12px] text-slate-500 font-medium">All caught up</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors flex items-start gap-2.5",
                    !n.read && "bg-violet-50"
                  )}
                >
                  {/* Unread dot */}
                  <span
                    className={cn(
                      "mt-1.5 w-1.5 h-1.5 rounded-full shrink-0",
                      !n.read ? "bg-violet-600" : "bg-transparent"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[13px] leading-none mt-px shrink-0">
                        {TYPE_ICON[n.type] ?? "🔔"}
                      </span>
                      <p
                        className={cn(
                          "text-[12px] font-semibold leading-snug truncate",
                          n.read ? "text-slate-500" : "text-slate-900"
                        )}
                      >
                        {n.title}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2 pl-5">
                      {n.body}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 pl-5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
