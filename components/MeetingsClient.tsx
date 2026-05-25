"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Video, Plus, ExternalLink, Trash2, Clock, CheckCircle2,
  Calendar, Copy, Users, User, CalendarPlus, Download,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { MeetingRoom } from "./MeetingRoom";
import { CreateMeetingModal } from "./CreateMeetingModal";
import { toast } from "sonner";
import type { TokenPayload } from "@/lib/roles";

interface MeetingParticipant {
  id: string;
  fullName: string;
  initials: string;
  role: string;
}

interface Meeting {
  id: string;
  title: string;
  roomName: string;
  scheduledAt: string | null;
  meetingType: string;
  status: string;
  createdAt: string;
  project: { id: string; name: string } | null;
  participant: MeetingParticipant | null;
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

  const upcomingMeetings = meetings
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => {
      if (!a.scheduledAt && !b.scheduledAt) return 0;
      if (!a.scheduledAt) return 1;
      if (!b.scheduledAt) return -1;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });

  const endedMeetings = meetings.filter((m) => m.status === "ended");
  const activeMeetings = meetings.filter((m) => m.status === "active");

  async function handleJoin(meeting: Meeting) {
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
    router.refresh();
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

        {/* Empty state */}
        {meetings.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <Video className="w-6 h-6 text-violet-400" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">No meetings yet</p>
            <p className="text-sm text-slate-400 mb-4">Create a meeting tied to a project to get started.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Meeting
            </button>
          </div>
        )}

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
        {upcomingMeetings.length > 0 && (
          <Section title="Scheduled" icon={<Calendar className="w-4 h-4 text-slate-400" />}>
            {upcomingMeetings.map((m) => (
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
          currentUserId={user.userId}
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

/** Build a Google Calendar "Add event" URL for a meeting */
function buildGCalUrl(meeting: Meeting): string | null {
  if (!meeting.scheduledAt) return null;
  const start = new Date(meeting.scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: meeting.title,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  if (meeting.project) params.set("details", `Project: ${meeting.project.name}`);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
  const isIndividual = meeting.meetingType === "individual";
  const gcalUrl = buildGCalUrl(meeting);

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
          {/* Meeting type badge */}
          <span className={cn(
            "text-[11px] px-2 py-0.5 rounded-full border flex items-center gap-1",
            isIndividual
              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          )}>
            {isIndividual ? <User className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
            {isIndividual ? "1-on-1" : "Team"}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
          {meeting.project && (
            <span className="font-medium text-slate-500">{meeting.project.name}</span>
          )}
          {meeting.project && <span className="text-slate-300">·</span>}
          {isIndividual && meeting.participant ? (
            <span>With {meeting.participant.fullName}</span>
          ) : (
            <span>Full team</span>
          )}
          <span className="text-slate-300">·</span>
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
        {/* Calendar export buttons — only shown when a scheduled time exists */}
        {gcalUrl && (
          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Add to Google Calendar"
            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
          </a>
        )}
        {meeting.scheduledAt && (
          <a
            href={`/api/meetings/${meeting.id}/ics`}
            download
            title="Download .ics calendar file"
            className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        )}
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
