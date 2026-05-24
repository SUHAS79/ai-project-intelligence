"use client";

import { useState } from "react";
import { Users, UserPlus, X, CheckCircle2, Clock, AlertCircle, Minus } from "lucide-react";
import { cn, STATUS_CONFIG } from "@/lib/utils";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";
import { toast } from "sonner";

type MemberUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  initials: string;
};

type Member = {
  id: string;
  userId: string;
  addedAt: string;
  user: MemberUser;
};

type TaskSummary = {
  id: string;
  title: string;
  status: string;
  owner: string | null;
  assignedToId?: string | null;
};

type AvailableUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  initials: string;
};

interface TeamTabProps {
  projectId: string;
  initialMembers: Member[];
  tasks: TaskSummary[];
  allUsers: AvailableUser[];   // all non-manager users in the org
  isManager: boolean;
}

export function TeamTab({
  projectId,
  initialMembers,
  tasks,
  allUsers,
  isManager,
}: TeamTabProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  // Users not yet in this project
  const memberUserIds = new Set(members.map((m) => m.userId));
  const available = allUsers.filter((u) => !memberUserIds.has(u.id));

  // For each member, compute their tasks in this project
  // Prefer assignedToId match (reliable); fall back to owner name match (legacy seed data)
  function getMemberTasks(member: Member) {
    return tasks.filter((t) => {
      if (t.assignedToId) return t.assignedToId === member.userId;
      if (t.owner) return t.owner.toLowerCase() === member.user.fullName.toLowerCase();
      return false;
    });
  }

  async function handleRemove(member: Member) {
    if (!confirm(`Remove ${member.user.fullName} from this project?`)) return;
    setRemoving(member.userId);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.userId }),
      });
      if (!res.ok) {
        toast.error("Failed to remove member.");
        return;
      }
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
      toast.success(`${member.user.fullName} removed from project.`);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setRemoving(null);
    }
  }

  function handleMemberAdded(newMember: Member) {
    setMembers((prev) => [...prev, newMember]);
    setShowAddModal(false);
    toast.success(`${newMember.user.fullName} added to project.`);
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">
            Project Team
            <span className="ml-2 text-slate-400 font-normal">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            People assigned to this project and their task progress.
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Member
          </button>
        )}
      </div>

      {/* Member list */}
      {members.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">No members assigned yet</p>
          {isManager && (
            <p className="text-xs text-slate-400 mt-1">
              Use "Add Member" to assign people to this project.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const memberTasks = getMemberTasks(member);
            const done = memberTasks.filter((t) => t.status === "DONE").length;
            const inProgress = memberTasks.filter((t) => t.status === "IN_PROGRESS").length;
            const blocked = memberTasks.filter((t) => t.status === "BLOCKED").length;
            const todo = memberTasks.filter((t) => t.status === "TODO").length;

            return (
              <div
                key={member.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm shadow-violet-200/50">
                    <span className="text-xs font-bold text-white">
                      {member.user.initials}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-slate-900">
                        {member.user.fullName}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border",
                          ROLE_COLORS[member.user.role] ??
                            "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {ROLE_LABELS[member.user.role] ?? member.user.role}
                      </span>
                      {member.user.status === "inactive" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border bg-slate-100 text-slate-500 border-slate-200">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{member.user.email}</p>

                    {/* Task stats */}
                    {memberTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No tasks assigned by name in this project.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {done > 0 && (
                          <TaskPill icon={<CheckCircle2 className="w-3 h-3" />} count={done} label="Done" color="text-emerald-600 bg-emerald-50 border-emerald-200" />
                        )}
                        {inProgress > 0 && (
                          <TaskPill icon={<Clock className="w-3 h-3" />} count={inProgress} label="In Progress" color="text-blue-600 bg-blue-50 border-blue-200" />
                        )}
                        {blocked > 0 && (
                          <TaskPill icon={<AlertCircle className="w-3 h-3" />} count={blocked} label="Blocked" color="text-red-600 bg-red-50 border-red-200" />
                        )}
                        {todo > 0 && (
                          <TaskPill icon={<Minus className="w-3 h-3" />} count={todo} label="To Do" color="text-slate-500 bg-slate-50 border-slate-200" />
                        )}
                        <span className="text-xs text-slate-400 self-center">
                          {memberTasks.length} task{memberTasks.length !== 1 ? "s" : ""} total
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  {isManager && (
                    <button
                      onClick={() => handleRemove(member)}
                      disabled={removing === member.userId}
                      className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Remove from project"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <AddMemberModal
          projectId={projectId}
          available={available}
          onClose={() => setShowAddModal(false)}
          onAdded={handleMemberAdded}
        />
      )}
    </div>
  );
}

function TaskPill({
  icon,
  count,
  label,
  color,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  color: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border",
        color
      )}
    >
      {icon}
      {count} {label}
    </span>
  );
}

function AddMemberModal({
  projectId,
  available,
  onClose,
  onAdded,
}: {
  projectId: string;
  available: AvailableUser[];
  onClose: () => void;
  onAdded: (member: Member) => void;
}) {
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    if (!selected) {
      setError("Please select a team member.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add member.");
        return;
      }
      onAdded(data.member);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add Member</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign an employee to this project.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {available.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              All employees are already assigned to this project.
            </p>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Select employee
                </label>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  <option value="">— Choose a team member —</option>
                  {available.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({ROLE_LABELS[u.role] ?? u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={loading || !selected}
                  className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Adding…" : "Add to project"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
