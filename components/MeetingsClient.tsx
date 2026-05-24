"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Video, Plus, ExternalLink, Trash2, Clock, CheckCircle2,
  Calendar, Users, Copy, Zap,
} from "lucide-react";
import { format, parseISO, isAfter, isBefore, addHours } from "date-fns";
import { cn } from "@/lib/utils";
import { MeetingRoom } from "./MeetingRoom";
import { CreateMeetingModal } from "./CreateMeetingModal";
import { toast } from "sonner";
import type { TokenPayload } from "@/lib/roles";

interface Meeting {
  id: string;
  title: string;
  roomName: string;
  scheduledAt: string | null;
  status: string;
  createdAt: string;
  project: { id: string; name: string } | null;
  createdBy: { id: string; fullName: string; initials: string; role: string };
}

interface Project {
  id: string;
  name: string;
}

interface MeetingsClientProps {
  user: TokenPayload;
  initialMeetings: Meeting[];
  projects: Project[];
}

const STATUS_CONFIG = {
  scheduled: { label: "Scheduled", bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-400" },
  active:    { label: "Live",      bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500 animate-pulse" },
  ended:     { label: "Ended",     bg: "bg-slate-100",  text: "text-slate-500",   border: "border-slate-200",   dot: "bg-slate-300" },
};

export function MeetingsClient({ user, initialMeetings, projects }: MeetingsClientProps) {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [activeRoom, setActiveRoom] = useState<Meeting | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const upcomingMeetings = meetings.filter(
    (m) => m.status === "scheduled"
  ).sort((a, b) => {
    if (!a.scheduledAt && !b.scheduledAt) return 0;
    if (!a.scheduledAt) return 1;
    if (!b.scheduledAt) return -1;
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });

  const endedMeetings = meetings.filter((m) => m.status === "ended");
  const activeMeetings = meetings.filter((m) => m.status === "active");

  async function handleJoin(meeting: Meeting) {
    // Mark as active
    try {
      await fetch(`/api/meetings/${meeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      setMeetings((prev) => prev.map((m) => m.id === meeting.id ? { ...m, status: "active" } : m));
    } catch {}
    setActiveRoom(meeting);
  }

  async function handleLeave(meeting: Meeting) {
    setActiveRoom(null);
    try {
      await fetch(`/api/meetings/${meeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });
      setMeetings((prev) => prev.map((m) => m.id === meeting.id ? { ...m, status: "ended" } : m));
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this meeting?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
        toast.success("Meeting deleted");
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopyLink(roomName: string) {
    const url = `https://meet.jit.si/${roomName}`;
    navigator.clipboard.writeText(url);
    toast.success("Meeting link copied to clipboard");
  }

  function handleCreated(meeting: Meeting) {
    setMeetings((prev) => [meeting, ...prev]);
    toast.success(`Meeting "${meeting.title}" created`);
  }

  const canDelete = (m: Meeting) =>
    m.createdBy.id === user.userId || user.role === "manager";

  return (
    <>
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {upcomingMeetings.length} upcoming · {activeMeetings.length} live · {endedMeetings.length} ended
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Meeting
          </button>
        </div>

        {/* Instant meeting CTA */}
        <button
          onClick={async () => {
            // Create an instant meeting with a default title
            const res = await fetch("/api/meetings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: "Instant Meeting", projectId: null, scheduledAt: null }),
            });
            if (res.ok) {
              const m = await res.json();
              setMeetings((prev) => [m, ...prev]);
              handleJoin(m);
            }
          }}
          className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl text-white hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200 group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-base">Start Instant Meeting</p>
            <p className="text-violet-200 text-sm">Jump in immediately — no scheduling needed</p>
          </div>
          <Video className="w-5 h-5 ml-auto opacity-70 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Active meetings */}
        {activeMeetings.length > 0 && (
          <Section title="Live Now" icon={<div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}>
            {activeMeetings.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                canDelete={canDelete(m)}
                onJoin={() => handleJoin(m)}
                onDelete={() => handleDelete(m.id)}
                onCopyLink={() => handleCopyLink(m.roomName)}
                deletingId={deletingId}
              />
            ))}
          </Section>
        )}

        {/* Upcoming / scheduled */}
        <Section title="Scheduled" icon={<Calendar className="w-4 h-4 text-slate-400" />}>
          {upcomingMeetings.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
              No upcoming meetings. Create one above or start an instant meeting.
            </div>
          ) : (
            upcomingMeetings.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                canDelete={canDelete(m)}
                onJoin={() => handleJoin(m)}
                onDelete={() => handleDelete(m.id)}
                onCopyLink={() => handleCopyLink(m.roomName)}
                deletingId={deletingId}
              />
            ))
          )}
        </Section>

        {/* Ended meetings */}
        {endedMeetings.length > 0 && (
          <Section title="Past Meetings" icon={<CheckCircle2 className="w-4 h-4 text-slate-400" />}>
            {endedMeetings.slice(0, 5).map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                canDelete={canDelete(m)}
                onJoin={() => handleJoin(m)}
                onDelete={() => handleDelete(m.id)}
                onCopyLink={() => handleCopyLink(m.roomName)}
                deletingId={deletingId}
                isPast
              />
            ))}
          </Section>
        )}
      </div>

      {/* Jitsi meeting room overlay */}
      {activeRoom && (
        <MeetingRoom
          roomName={activeRoom.roomName}
          meetingTitle={activeRoom.title}
          userFullName={user.fullName}
          userInitials={user.initials}
          onClose={() => setActiveRoom(null)}
          onEnded={() => handleLeave(activeRoom)}
        />
      )}

      {/* Create meeting modal */}
      {showCreate && (
        <CreateMeetingModal
          projects={projects}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({
  title, icon, children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MeetingCard({
  meeting,
  canDelete,
  onJoin,
  onDelete,
  onCopyLink,
  deletingId,
  isPast = false,
}: {
  meeting: Meeting;
  canDelete: boolean;
  onJoin: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  deletingId: string | null;
  isPast?: boolean;
}) {
  const status = STATUS_CONFIG[meeting.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.scheduled;
  const jitsiUrl = `https://meet.jit.si/${meeting.roomName}`;

  return (
    <div className={cn(
      "bg-white rounded-xl border shadow-sm px-5 py-4 flex items-center gap-4",
      meeting.status === "active" ? "border-red-200" :
      meeting.status === "ended" ? "border-slate-200 opacity-70" :
      "border-slate-200/80"
    )}>
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
        meeting.status === "active" ? "bg-red-50" :
        meeting.status === "ended" ? "bg-slate-50" : "bg-violet-50"
      )}>
        <Video className={cn(
          "w-5 h-5",
          meeting.status === "active" ? "text-red-500" :
          meeting.status === "ended" ? "text-slate-400" : "text-violet-500"
        )} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-900 text-sm">{meeting.title}</span>
          <span className={cn(
            "text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5",
            status.bg, status.text, status.border
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>
          {meeting.project && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {meeting.project.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
          {meeting.scheduledAt ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(parseISO(meeting.scheduledAt), "MMM d, h:mm a")}
            </span>
          ) : (
            <span>On-demand</span>
          )}
          <span className="text-slate-300">·</span>
          <span>By {meeting.createdBy.fullName}</span>
          <span className="text-slate-300">·</span>
          <span className="font-mono text-[10px]">{meeting.roomName}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {!isPast && (
          <button
            onClick={onJoin}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors",
              meeting.status === "active"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            )}
          >
            <Video className="w-3.5 h-3.5" />
            {meeting.status === "active" ? "Rejoin" : "Join"}
          </button>
        )}
        <button
          onClick={onCopyLink}
          title="Copy Jitsi link"
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <a
          href={jitsiUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in new tab"
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        {canDelete && (
          <button
            onClick={onDelete}
            disabled={deletingId === meeting.id}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
