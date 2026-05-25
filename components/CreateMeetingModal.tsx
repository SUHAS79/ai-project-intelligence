"use client";

import { useState, useEffect } from "react";
import { X, Video, AlertTriangle, Users, User, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/roles";

interface Project {
  id: string;
  name: string;
}

interface Member {
  id: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    initials: string;
    role: string;
  };
}

interface CreateMeetingModalProps {
  projects: Project[];
  currentUserId?: string;
  onClose: () => void;
  onCreated: (meeting: any) => void;
}

type Step = "project" | "type" | "participant" | "schedule";
type MeetingType = "team" | "individual";

export function CreateMeetingModal({ projects, currentUserId, onClose, onCreated }: CreateMeetingModalProps) {
  // Step state
  const [step, setStep] = useState<Step>("project");

  // Form state
  const [projectId, setProjectId] = useState("");
  const [meetingType, setMeetingType] = useState<MeetingType>("team");
  const [participantId, setParticipantId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [title, setTitle] = useState("");

  // Members for selected project
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedParticipant = members.find((m) => m.userId === participantId);

  // Fetch members when project changes
  useEffect(() => {
    if (!projectId) { setMembers([]); return; }
    setLoadingMembers(true);
    fetch(`/api/projects/${projectId}/members`)
      .then((r) => r.json())
      .then((data) => {
        const all: Member[] = data.members ?? [];
        // Exclude self from individual meeting choices
        setMembers(all.filter((m) => m.userId !== currentUserId));
      })
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  }, [projectId, currentUserId]);

  // Auto-generate title when type and participant are chosen
  useEffect(() => {
    if (!selectedProject) return;
    if (meetingType === "team") {
      setTitle(`${selectedProject.name} — Team Meeting`);
    } else if (selectedParticipant) {
      setTitle(`1-on-1 with ${selectedParticipant.user.fullName}`);
    }
  }, [meetingType, selectedParticipant, selectedProject]);

  function goNext() {
    setError("");
    if (step === "project") {
      if (!projectId) { setError("Please select a project."); return; }
      setStep("type");
    } else if (step === "type") {
      if (meetingType === "individual") {
        setStep("participant");
      } else {
        setStep("schedule");
      }
    } else if (step === "participant") {
      if (!participantId) { setError("Please select a team member."); return; }
      setStep("schedule");
    }
  }

  function goBack() {
    setError("");
    if (step === "schedule") {
      setStep(meetingType === "individual" ? "participant" : "type");
    } else if (step === "participant") {
      setStep("type");
    } else if (step === "type") {
      setStep("project");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) { setError("Project is required."); return; }
    if (!title.trim()) { setError("Meeting title is required."); return; }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          projectId,
          meetingType,
          participantId: meetingType === "individual" ? participantId : null,
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

  const STEP_LABELS: Record<Step, string> = {
    project: "Select Project",
    type: "Meeting Type",
    participant: "Choose Member",
    schedule: "Schedule",
  };
  const ALL_STEPS: Step[] = ["project", "type", "participant", "schedule"];
  const visibleSteps: Step[] =
    meetingType === "individual"
      ? ["project", "type", "participant", "schedule"]
      : ["project", "type", "schedule"];
  const stepIdx = visibleSteps.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Video className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">New Meeting</h2>
              <p className="text-xs text-slate-400">{STEP_LABELS[step]}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-1 px-6 py-3 bg-slate-50 border-b border-slate-100">
          {visibleSteps.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={cn(
                "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0",
                i < stepIdx
                  ? "bg-violet-600 text-white"
                  : i === stepIdx
                  ? "bg-violet-100 text-violet-700 ring-2 ring-violet-500"
                  : "bg-slate-200 text-slate-400"
              )}>
                {i < stepIdx ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={cn(
                "text-[11px] font-medium",
                i === stepIdx ? "text-violet-700" : "text-slate-400"
              )}>
                {STEP_LABELS[s]}
              </span>
              {i < visibleSteps.length - 1 && (
                <div className={cn(
                  "flex-1 h-px mx-1",
                  i < stepIdx ? "bg-violet-400" : "bg-slate-200"
                )} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 min-h-[240px]">

            {/* ─── Step 1: Select Project ─── */}
            {step === "project" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Every meeting must be tied to a project. Select which project this meeting is for.
                </p>
                {projects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                    <p className="text-sm text-slate-500 font-medium">No active projects</p>
                    <p className="text-xs text-slate-400 mt-1">You need to be assigned to an active project first.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setProjectId(p.id); setParticipantId(""); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                          projectId === p.id
                            ? "border-violet-400 bg-violet-50 ring-1 ring-violet-400"
                            : "border-slate-200 hover:border-violet-200 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          projectId === p.id ? "bg-violet-600" : "bg-slate-100"
                        )}>
                          {projectId === p.id
                            ? <Check className="w-4 h-4 text-white" />
                            : <span className="text-[10px] font-bold text-slate-500">{p.name.slice(0, 2).toUpperCase()}</span>
                          }
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          projectId === p.id ? "text-violet-800" : "text-slate-700"
                        )}>
                          {p.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── Step 2: Meeting Type ─── */}
            {step === "type" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  What kind of meeting is this for <span className="font-semibold text-slate-800">{selectedProject?.name}</span>?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMeetingType("team")}
                    className={cn(
                      "flex flex-col items-center gap-3 px-4 py-5 rounded-xl border text-center transition-all",
                      meetingType === "team"
                        ? "border-violet-400 bg-violet-50 ring-1 ring-violet-400"
                        : "border-slate-200 hover:border-violet-200 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      meetingType === "team" ? "bg-violet-600" : "bg-slate-100"
                    )}>
                      <Users className={cn("w-5 h-5", meetingType === "team" ? "text-white" : "text-slate-400")} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", meetingType === "team" ? "text-violet-800" : "text-slate-700")}>
                        Full Team
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">All project members</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMeetingType("individual")}
                    className={cn(
                      "flex flex-col items-center gap-3 px-4 py-5 rounded-xl border text-center transition-all",
                      meetingType === "individual"
                        ? "border-violet-400 bg-violet-50 ring-1 ring-violet-400"
                        : "border-slate-200 hover:border-violet-200 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      meetingType === "individual" ? "bg-violet-600" : "bg-slate-100"
                    )}>
                      <User className={cn("w-5 h-5", meetingType === "individual" ? "text-white" : "text-slate-400")} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", meetingType === "individual" ? "text-violet-800" : "text-slate-700")}>
                        1-on-1
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">One team member</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ─── Step 3: Select Participant (individual only) ─── */}
            {step === "participant" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Pick someone from <span className="font-semibold text-slate-800">{selectedProject?.name}</span> for your 1-on-1.
                </p>
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                    <p className="text-sm text-slate-500">No other members in this project.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {members.map((m) => (
                      <button
                        key={m.userId}
                        type="button"
                        onClick={() => setParticipantId(m.userId)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                          participantId === m.userId
                            ? "border-violet-400 bg-violet-50 ring-1 ring-violet-400"
                            : "border-slate-200 hover:border-violet-200 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                          participantId === m.userId ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-600"
                        )}>
                          {m.user.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            participantId === m.userId ? "text-violet-800" : "text-slate-700"
                          )}>
                            {m.user.fullName}
                          </p>
                          <p className="text-[11px] text-slate-400">{ROLE_LABELS[m.user.role] ?? m.user.role}</p>
                        </div>
                        {participantId === m.userId && (
                          <Check className="w-4 h-4 text-violet-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── Step 4: Schedule ─── */}
            {step === "schedule" && (
              <div className="space-y-4">
                {/* Title (auto-generated but editable) */}
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
                  />
                </div>

                {/* Summary */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Project</span>
                    <span className="font-semibold text-slate-700">{selectedProject?.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Type</span>
                    <span className="font-semibold text-slate-700">
                      {meetingType === "team" ? "Full Team Meeting" : "1-on-1 Meeting"}
                    </span>
                  </div>
                  {meetingType === "individual" && selectedParticipant && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">With</span>
                      <span className="font-semibold text-slate-700">{selectedParticipant.user.fullName}</span>
                    </div>
                  )}
                </div>

                {/* Optional schedule */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Scheduled Date & Time <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Leave blank to start immediately.</p>
                </div>

                <div className="bg-violet-50 border border-violet-100 rounded-xl px-3.5 py-2.5 text-xs text-violet-700">
                  A unique Jitsi room will be created. Share the link from the meeting card.
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 px-6 pb-6">
            {step !== "project" ? (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}

            {step === "schedule" ? (
              <button
                type="submit"
                disabled={saving || !title.trim() || !projectId}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Video className="w-3.5 h-3.5" />
                    {scheduledAt ? "Schedule Meeting" : "Start Meeting"}
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={step === "project" && projects.length === 0}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
