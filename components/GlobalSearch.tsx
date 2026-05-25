"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderOpen,
  ListTodo,
  User,
  X,
  Loader2,
} from "lucide-react";
import { cn, STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/roles";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchProject {
  id: string;
  name: string;
  status: string;
  description: string | null;
}

interface SearchTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  project: { name: string };
}

interface SearchUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  initials: string;
}

interface SearchResults {
  projects: SearchProject[];
  tasks: SearchTask[];
  people: SearchUser[];
}

// ── Status / Priority chip helpers ────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

const TASK_STATUS_CHIP: Record<string, string> = {
  TODO:        "bg-slate-100 text-slate-500 border-slate-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  BLOCKED:     "bg-red-50 text-red-700 border-red-200",
  IN_REVIEW:   "bg-purple-50 text-purple-700 border-purple-200",
  DONE:        "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const PRIORITY_CHIP: Record<string, string> = {
  LOW:      "bg-slate-100 text-slate-500 border-slate-200",
  MEDIUM:   "bg-amber-50 text-amber-700 border-amber-200",
  HIGH:     "bg-orange-50 text-orange-700 border-orange-200",
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
};

const PROJECT_STATUS_CHIP: Record<string, string> = {
  PLANNING:  "bg-slate-100 text-slate-600 border-slate-200",
  ACTIVE:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  ON_HOLD:   "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

const ROLE_CHIP: Record<string, string> = {
  manager:          "bg-violet-50 text-violet-700 border-violet-200",
  senior_developer: "bg-blue-50 text-blue-700 border-blue-200",
  developer:        "bg-slate-100 text-slate-600 border-slate-200",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  // Keyboard shortcut + custom event to open
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("namo:search:open", onOpen);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("namo:search:open", onOpen);
    };
  }, []);

  // Focus input when opened; clear state when closed
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data: SearchResults = await res.json();
          setResults(data);
        }
      } catch {
        // silent — search failure shouldn't break anything
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open]);

  function close() {
    setOpen(false);
  }

  function navigate(href: string) {
    close();
    router.push(href);
  }

  const totalResults =
    (results?.projects.length ?? 0) +
    (results?.tasks.length ?? 0) +
    (results?.people.length ?? 0);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          {loading ? (
            <Loader2 className="w-4 h-4 text-violet-500 shrink-0 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects, tasks, people…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:block text-[11px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Empty prompt */}
          {!query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              <Search className="w-6 h-6 mx-auto mb-2 text-slate-300" />
              Type at least 2 characters to search across projects, tasks, and people
            </div>
          )}

          {/* Too short */}
          {query.trim().length === 1 && (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              Keep typing…
            </div>
          )}

          {/* No results */}
          {query.trim().length >= 2 && !loading && results && totalResults === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              No results for{" "}
              <span className="font-medium text-slate-600">"{query}"</span>
            </div>
          )}

          {/* Projects section */}
          {results && results.projects.length > 0 && (
            <section>
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Projects
                </p>
              </div>
              {results.projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {project.name}
                    </p>
                    {project.description && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                      PROJECT_STATUS_CHIP[project.status] ?? "bg-slate-100 text-slate-500 border-slate-200"
                    )}
                  >
                    {STATUS_LABEL[project.status] ?? project.status}
                  </span>
                </button>
              ))}
            </section>
          )}

          {/* Tasks section */}
          {results && results.tasks.length > 0 && (
            <section>
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Tasks
                </p>
              </div>
              {results.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => navigate(`/projects/${task.projectId}?tab=tasks`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <ListTodo className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {task.project.name}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                        TASK_STATUS_CHIP[task.status] ?? "bg-slate-100 text-slate-500 border-slate-200"
                      )}
                    >
                      {STATUS_LABEL[task.status] ?? task.status}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                        PRIORITY_CHIP[task.priority] ?? "bg-slate-100 text-slate-500 border-slate-200"
                      )}
                    >
                      {task.priority}
                    </span>
                  </div>
                </button>
              ))}
            </section>
          )}

          {/* People section */}
          {results && results.people.length > 0 && (
            <section>
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  People
                </p>
              </div>
              {results.people.map((person) => (
                <button
                  key={person.id}
                  onClick={() => navigate("/people")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white">
                      {person.initials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {person.fullName}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {person.email}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                      ROLE_CHIP[person.role] ?? "bg-slate-100 text-slate-500 border-slate-200"
                    )}
                  >
                    {ROLE_LABELS[person.role] ?? person.role}
                  </span>
                </button>
              ))}
            </section>
          )}

          {/* Bottom padding */}
          {results && totalResults > 0 && <div className="h-3" />}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-400">
          <span>
            <kbd className="bg-slate-100 text-slate-500 px-1 py-0.5 rounded text-[10px] font-mono border border-slate-200">↵</kbd>
            {" "}to open
          </span>
          <span>
            <kbd className="bg-slate-100 text-slate-500 px-1 py-0.5 rounded text-[10px] font-mono border border-slate-200">Esc</kbd>
            {" "}to close
          </span>
          <span className="ml-auto">
            <kbd className="bg-slate-100 text-slate-500 px-1 py-0.5 rounded text-[10px] font-mono border border-slate-200">⌘K</kbd>
            {" "}to open anytime
          </span>
        </div>
      </div>
    </div>
  );
}
