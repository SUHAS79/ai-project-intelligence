"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import type { TokenPayload } from "@/lib/roles";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { GlobalSearch } from "./GlobalSearch";

interface AppShellClientProps {
  user: TokenPayload | null;
  children: React.ReactNode;
}

export function AppShellClient({ user, children }: AppShellClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-[232px]">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-950 border-b border-white/[0.06] sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-white tracking-tight flex-1">NAMO</span>
          {user && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("namo:search:open"))}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Search"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
            </button>
          )}
          {user && (
            <NotificationsDropdown placement="topbar" />
          )}
        </div>

        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Global search palette — rendered once at shell level */}
      {user && <GlobalSearch />}
    </div>
  );
}
