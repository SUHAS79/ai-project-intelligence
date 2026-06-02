"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Zap,
  UserCog,
  User,
  LogOut,
  ChevronRight,
  CalendarDays,
  BarChart3,
  Video,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type TokenPayload } from "@/lib/roles";
import { useState } from "react";
import { NotificationsDropdown } from "./NotificationsDropdown";

// Nav items per role
const MANAGER_NAV = [
  { href: "/",             label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects",     label: "Projects",  icon: FolderOpen },
  { href: "/people",       label: "People",    icon: UserCog },
  { href: "/workload",     label: "Workload",  icon: BarChart3 },
  { href: "/availability", label: "Calendar",  icon: CalendarDays },
  { href: "/meetings",     label: "Meetings",  icon: Video },
  { href: "/profile",      label: "Profile",   icon: User },
];

const DEV_NAV = [
  { href: "/dev",              label: "My Dashboard", icon: LayoutDashboard },
  { href: "/dev/projects",     label: "My Projects",  icon: FolderOpen },
  { href: "/availability",     label: "Calendar",     icon: CalendarDays },
  { href: "/meetings",         label: "Meetings",     icon: Video },
  { href: "/profile",          label: "Profile",      icon: User },
];

interface SidebarProps {
  user: TokenPayload | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ user, isOpen = false, onClose }: SidebarProps) {
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

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    if (href === "/dev") return pathname === "/dev";
    return pathname.startsWith(href);
  }

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full w-[232px] bg-white flex flex-col z-40 border-r border-slate-200 transition-transform duration-200",
      // On mobile: slide in/out; on desktop: always visible
      "lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold text-slate-900 tracking-tight leading-none">
              NAMO
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-none tracking-wide uppercase">
              Predict before they slip
            </div>
          </div>
          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close navigation"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search trigger */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("namo:search:open"))}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 transition-all duration-150"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left text-[12px]">Search…</span>
          <kbd className="text-[9px] bg-white text-slate-400 px-1 py-0.5 rounded font-mono border border-slate-200 leading-none">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold px-2 mb-2">
          {user?.role === "manager" ? "Workspace" : "Navigation"}
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                active
                  ? "bg-violet-50 text-violet-700 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Notifications + User card + Logout */}
      <div className="px-3 pb-4 border-t border-slate-200 pt-3">
        {user ? (
          <>
            {/* Notifications bell — opens dropdown to the right */}
            <div className="mb-1">
              <NotificationsDropdown placement="sidebar" />
            </div>

            {/* User card */}
            <Link
              href="/profile"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-100 transition-colors group mb-1"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-white">
                  {user.initials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-slate-900 truncate leading-none">
                  {user.fullName}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-none">
                  {roleLabel}
                </div>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600 shrink-0 transition-colors" />
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-150 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </>
        ) : (
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
