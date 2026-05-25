"use client";

import { useState, useMemo } from "react";
import {
  Users, Plus, Pencil, UserX, UserCheck,
  ChevronUp, ChevronDown, Search, FolderKanban, X, Check,
} from "lucide-react";
import { EmployeeModal } from "./EmployeeModal";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

type Project = { id: string; name: string };

// Base shape returned by EmployeeModal (no project data)
type BaseEmployee = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  initials: string;
  createdAt: string;
  lastLogin: string | null;
};

// Full shape used inside PeopleManagement (includes project memberships)
type Employee = BaseEmployee & { projects: Project[] };

type SortKey = "fullName" | "role" | "status" | "lastLogin";
type SortDir = "asc" | "desc";

interface PeopleManagementProps {
  initialEmployees: Employee[];
  allProjects: Project[];
}

export function PeopleManagement({ initialEmployees, allProjects }: PeopleManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [assignTarget, setAssignTarget] = useState<Employee | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");
  const [deactivating, setDeactivating] = useState<string | null>(null);

  function openCreate() {
    setModalMode("create");
    setSelectedEmployee(null);
    setModalOpen(true);
  }

  function openEdit(emp: Employee) {
    setModalMode("edit");
    setSelectedEmployee(emp);
    setModalOpen(true);
  }

  function openAssign(emp: Employee) {
    setAssignTarget(emp);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handleSuccess(updated: BaseEmployee) {
    setEmployees((prev) => {
      const idx = prev.findIndex((e) => e.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        // Preserve projects when editing (EmployeeModal doesn't touch them)
        copy[idx] = { ...updated, projects: copy[idx]?.projects ?? [] };
        return copy;
      }
      return [...prev, { ...updated, projects: [] }];
    });
    setModalOpen(false);
    toast.success(
      modalMode === "create"
        ? `${updated.fullName} has been added to the team.`
        : `${updated.fullName} has been updated.`
    );
  }

  function handleProjectsUpdated(empId: string, projects: Project[]) {
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, projects } : e))
    );
    setAssignTarget(null);
  }

  async function handleDeactivate(emp: Employee) {
    setDeactivating(emp.id);
    try {
      const res = await fetch(`/api/users/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: emp.status === "active" ? "inactive" : "active" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update status.");
        return;
      }
      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...data.user, projects: e.projects } : e))
      );
      toast.success(
        emp.status === "active"
          ? `${emp.fullName} has been deactivated.`
          : `${emp.fullName} has been reactivated.`
      );
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setDeactivating(null);
    }
  }

  const filtered = useMemo(() => {
    let list = employees;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          ROLE_LABELS[e.role]?.toLowerCase().includes(q) ||
          e.projects.some((p) => p.name.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      let va = "";
      let vb = "";
      if (sortKey === "fullName") { va = a.fullName; vb = b.fullName; }
      else if (sortKey === "role") { va = a.role; vb = b.role; }
      else if (sortKey === "status") { va = a.status; vb = b.status; }
      else if (sortKey === "lastLogin") { va = a.lastLogin ?? ""; vb = b.lastLogin ?? ""; }
      const cmp = va.localeCompare(vb);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [employees, search, sortKey, sortDir]);

  const active = employees.filter((e) => e.status === "active").length;
  const inactive = employees.filter((e) => e.status === "inactive").length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">People</h1>
          </div>
          <p className="text-sm text-slate-500 ml-9">
            Manage team members, roles, and project assignments.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add employee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Total members" value={employees.length} />
        <StatCard label="Active" value={active} color="text-emerald-600" />
        <StatCard label="Inactive" value={inactive} color="text-slate-400" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, role, or project…"
            className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">
              {search ? "No results found" : "No team members yet"}
            </p>
            {!search && (
              <p className="text-xs text-slate-400 mt-1">
                Add your first employee to get started.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <SortTh label="Name"       sortKey="fullName"  current={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                  <SortTh label="Role"       sortKey="role"      current={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Assigned Projects
                  </th>
                  <SortTh label="Status"     sortKey="status"    current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortTh label="Last login" sortKey="lastLogin" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className={cn(
                      "hover:bg-slate-50/50 transition-colors",
                      emp.status === "inactive" && "opacity-60"
                    )}
                  >
                    {/* Name + Avatar */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-white">{emp.initials}</span>
                        </div>
                        <span className="font-medium text-slate-900">{emp.fullName}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5 text-slate-500 text-xs">{emp.email}</td>

                    {/* Role badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
                          ROLE_COLORS[emp.role] ?? "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {ROLE_LABELS[emp.role] ?? emp.role}
                      </span>
                    </td>

                    {/* Assigned Projects */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {emp.projects.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        ) : (
                          emp.projects.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                            >
                              {p.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
                          emp.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        )}
                      >
                        {emp.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Last login */}
                    <td className="px-4 py-3.5 text-slate-400 text-xs">
                      {emp.lastLogin ? formatDate(emp.lastLogin) : "Never"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openAssign(emp)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Change project assignments"
                        >
                          <FolderKanban className="w-3 h-3" />
                          Projects
                        </button>
                        <button
                          onClick={() => openEdit(emp)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeactivate(emp)}
                          disabled={deactivating === emp.id}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50",
                            emp.status === "active"
                              ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                              : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          )}
                        >
                          {emp.status === "active" ? (
                            <><UserX className="w-3 h-3" />Deactivate</>
                          ) : (
                            <><UserCheck className="w-3 h-3" />Reactivate</>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee create/edit modal */}
      <EmployeeModal
        isOpen={modalOpen}
        mode={modalMode}
        employee={selectedEmployee}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* Project assignment modal */}
      {assignTarget && (
        <AssignProjectModal
          employee={assignTarget}
          allProjects={allProjects}
          onClose={() => setAssignTarget(null)}
          onSaved={(projects) => handleProjectsUpdated(assignTarget.id, projects)}
        />
      )}
    </div>
  );
}

// ─── AssignProjectModal ───────────────────────────────────────────────────────

function AssignProjectModal({
  employee,
  allProjects,
  onClose,
  onSaved,
}: {
  employee: Employee;
  allProjects: Project[];
  onClose: () => void;
  onSaved: (projects: Project[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(employee.projects.map((p) => p.id))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggle(projectId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${employee.id}/projects`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update project assignments.");
        return;
      }
      onSaved(data.projects as Project[]);
      toast.success(`Project assignments updated for ${employee.fullName}.`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges =
    selected.size !== employee.projects.length ||
    [...selected].some((id) => !employee.projects.find((p) => p.id === id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-white">{employee.initials}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{employee.fullName}</p>
                <p className="text-xs text-slate-400">{ROLE_LABELS[employee.role] ?? employee.role}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <FolderKanban className="w-4 h-4 text-indigo-500" />
            <p className="text-sm font-medium text-slate-700">Assign to Projects</p>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Select the projects this employee should be a member of. Changes apply immediately and update all project team lists.
          </p>

          {allProjects.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No active projects found.</p>
          ) : (
            <div className="space-y-2">
              {allProjects.map((project) => {
                const isSelected = selected.has(project.id);
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => toggle(project.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                      isSelected
                        ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "bg-indigo-600 border-indigo-600"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-medium flex-1">{project.name}</span>
                    {isSelected && (
                      <span className="text-[11px] font-semibold text-indigo-500">Assigned</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Current summary */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {selected.size === 0 ? (
              <span className="text-xs text-slate-400 italic">No projects selected — employee will be unassigned.</span>
            ) : (
              [...selected].map((id) => {
                const p = allProjects.find((proj) => proj.id === id);
                if (!p) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700"
                  >
                    {p.name}
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, color = "text-slate-900",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
      <div className={cn("text-2xl font-bold tabular-nums", color)}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function SortTh({
  label, sortKey, current, dir, onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th className="px-4 py-3 text-left">
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-700 transition-colors"
      >
        {label}
        <span className="flex flex-col">
          <ChevronUp className={cn("w-2.5 h-2.5 -mb-0.5", active && dir === "asc" ? "text-violet-500" : "text-slate-300")} />
          <ChevronDown className={cn("w-2.5 h-2.5", active && dir === "desc" ? "text-violet-500" : "text-slate-300")} />
        </span>
      </button>
    </th>
  );
}
