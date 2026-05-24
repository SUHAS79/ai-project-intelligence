"use client";

import { useState, useEffect } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/roles";

type Employee = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  initials: string;
  createdAt: string;
  lastLogin: string | null;
};

type Mode = "create" | "edit";

interface EmployeeModalProps {
  isOpen: boolean;
  mode: Mode;
  employee?: Employee | null;
  onClose: () => void;
  onSuccess: (employee: Employee) => void;
}

export function EmployeeModal({
  isOpen,
  mode,
  employee,
  onClose,
  onSuccess,
}: EmployeeModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"developer" | "senior_developer">("developer");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && employee) {
        setFullName(employee.fullName);
        setEmail(employee.email);
        setRole(employee.role as "developer" | "senior_developer");
        setStatus(employee.status as "active" | "inactive");
      } else {
        setFullName("");
        setEmail("");
        setPassword("");
        setRole("developer");
        setStatus("active");
      }
      setError("");
      setShowPassword(false);
    }
  }, [isOpen, mode, employee]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "create") {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, email, password, role, status }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to create employee.");
          return;
        }
        onSuccess(data.user);
      } else if (mode === "edit" && employee) {
        const res = await fetch(`/api/users/${employee.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, status }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to update employee.");
          return;
        }
        onSuccess(data.user);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {mode === "create" ? "Add Employee" : "Edit Employee"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === "create"
                ? "Create a new team member account"
                : `Editing ${employee?.fullName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          {mode === "create" && (
            <>
              <Field label="Full name">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="e.g. Jane Smith"
                  className={inputCls}
                />
              </Field>

              <Field label="Email address">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="jane@company.com"
                  className={inputCls}
                />
              </Field>

              <Field label="Temporary password">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    className={cn(inputCls, "pr-10")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  The employee will be able to change this after logging in.
                </p>
              </Field>
            </>
          )}

          <Field label="Role">
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "developer" | "senior_developer")
              }
              className={inputCls}
            >
              <option value="developer">{ROLE_LABELS["developer"]}</option>
              <option value="senior_developer">
                {ROLE_LABELS["senior_developer"]}
              </option>
            </select>
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "active" | "inactive")
              }
              className={inputCls}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? "Saving…"
                : mode === "create"
                ? "Create employee"
                : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all";
