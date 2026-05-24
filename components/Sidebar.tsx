"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Zap,
  Users,
  User,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, ROLE_COLORS, type TokenPayload } from "@/lib/roles";
import { useState } from "react";

// Nav items per role
const MANAGER_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/team", label: "Team", icon: Users },
];

const DEV_NAV = [
  { href: "/dev", label: "My Dashboard", icon: LayoutDashboard },
];

interface SidebarProps {
  user: TokenPayload | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = user?.role === "manager" ? MANAGER_NAV : DEV_NAV;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  }

  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : "";
  const roleBadge = user ? (ROLE_COLORS[user.role] ?? "") : "";

  return (
    <aside className="fixed left-0 top-0 h-full w-[232px] bg-slate-950 flex flex-col z-40 border-r border-white/5">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[15px] font-bold text-white tracking-tight leading-none">
              NAMO
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 leading-none tracking-wide uppercase">
              Predict before they slip
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold px-2 mb-2">
          Workspace
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/dev"
              ? pathname === "/dev"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Divider + Settings section */}
        <div className="pt-3 mt-3 border-t border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold px-2 mb-2">
            Account
          </p>
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
              pathname === "/profile"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <User className="w-4 h-4 shrink-0" />
            Profile
          </Link>
        </div>
      </nav>

      {/* User info + Logout */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
        {user ? (
          <>
            {/* User card */}
            <Link
              href="/profile"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/5 transition-colors group mb-1"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-white">
                  {user.initials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-white truncate leading-none">
                  {user.fullName}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-none">
                  {roleLabel}
                </div>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
            </Link>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </>
        ) : (
          /* AI Status footer when no user info */
          <div className="flex items-center gap-2 px-2">
            <div className="relative w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
              <span className="relative block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[11px] text-slate-500">Neural analysis active</span>
          </div>
        )}
      </div>
    </aside>
  );
}
