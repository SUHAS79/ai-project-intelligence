"use client";

import { useState } from "react";
import { User, Mail, Shield, Clock, Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

type ProfileUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  initials: string;
  createdAt: string;
  lastLogin: string | null;
};

export function ProfileClient({ user }: { user: ProfileUser }) {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess(false);

    if (newPwd !== confirmPwd) {
      setPwdError("New passwords do not match.");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("Password must be at least 6 characters.");
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdError(data.error ?? "Failed to change password.");
        return;
      }
      setPwdSuccess(true);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      toast.success("Password updated successfully.");
    } catch {
      setPwdError("Something went wrong. Please try again.");
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Profile</h1>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-200/50">
            <span className="text-xl font-bold text-white">{user.initials}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">{user.fullName}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-2.5">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
                  ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-600 border-slate-200"
                )}
              >
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
                  user.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                )}
              >
                {user.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
          <InfoItem
            icon={<Mail className="w-3.5 h-3.5" />}
            label="Email"
            value={user.email}
          />
          <InfoItem
            icon={<Shield className="w-3.5 h-3.5" />}
            label="Role"
            value={ROLE_LABELS[user.role] ?? user.role}
          />
          <InfoItem
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Member since"
            value={formatDate(user.createdAt)}
          />
          <InfoItem
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Last login"
            value={user.lastLogin ? formatDate(user.lastLogin) : "This session"}
          />
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-slate-500" />
          <h3 className="text-base font-semibold text-slate-900">Change password</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {pwdError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3.5 py-2.5">
              {pwdError}
            </div>
          )}

          {pwdSuccess && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3.5 py-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Password changed successfully.
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Current password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                required
                placeholder="Your current password"
                className={inputCls}
              />
              <ToggleEye
                show={showCurrent}
                onToggle={() => setShowCurrent(!showCurrent)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              New password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className={inputCls}
              />
              <ToggleEye
                show={showNew}
                onToggle={() => setShowNew(!showNew)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
              placeholder="Repeat new password"
              className={inputCls}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={pwdLoading}
              className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pwdLoading ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
        {icon}
        <span className="text-[11px] uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className="text-sm text-slate-700 font-medium">{value}</p>
    </div>
  );
}

function ToggleEye({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      tabIndex={-1}
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );
}

const inputCls =
  "w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all";
