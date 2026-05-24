# TODO — NAMO (Neural Analytics for Management Optimization)

## ✅ Phase 1 — Core MVP (Completed)
- [x] GitHub repo creation and clone
- [x] Next.js 16 + TypeScript + Tailwind v4 bootstrap
- [x] Prisma v7 + SQLite + better-sqlite3 adapter setup
- [x] Database schema (Project, Task, TaskDependency, Risk)
- [x] Initial migration
- [x] Seed data (3 projects, 24 tasks, 23 dependencies, 6 risks)
- [x] Prisma client singleton (lib/prisma.ts)
- [x] AI insights engine (lib/insights.ts)
  - [x] Delay detection with severity scoring
  - [x] Critical path algorithm (topological sort + DP)
  - [x] Bottleneck task detection
  - [x] Risk flags from risk register
  - [x] Improvement suggestions (pattern matching)
  - [x] Health score (weighted formula)
- [x] Report generator (lib/report.ts)
- [x] Utility functions (lib/utils.ts)
- [x] All API routes (projects, tasks, risks, report, seed)
- [x] Root layout with sidebar navigation
- [x] Dashboard with summary stats and project cards
- [x] Project creation modal
- [x] Project detail hub with tabbed navigation
- [x] Tasks tab (list, create, edit, delete, status quick-toggle, filter)
- [x] Gantt/Timeline tab (custom SVG, color-coded, dependency arrows)
- [x] Risks tab (log, edit, delete, AI risk alerts)
- [x] AI Insights tab (health score, delays, critical path, bottlenecks, suggestions)
- [x] Weekly Report tab (auto-generated, copy to clipboard)
- [x] TypeScript passes (0 errors)
- [x] Production build passes

## ✅ Phase 2 — NAMO Rebrand (Completed)
- [x] NAMO branding: sidebar redesign (slate-950, violet Zap, tagline)
- [x] NAMO metadata in app/layout.tsx
- [x] Dashboard redesign: MetricCards, portfolio health, alert banner
- [x] ProjectCard redesign: health-colored left border, progress bar
- [x] InsightsTab redesign: "Project Outlook" narrative lead card, "why at risk" prose
- [x] ForecastTab (new): burndown, planned vs actual, velocity charts
- [x] Forecast engine (lib/forecast.ts): velocity, slippage, confidence calculations
- [x] TasksTab redesign: violet filter pills, cleaner table, hover-reveal actions
- [x] RisksTab redesign: severity-sorted, left border color coding, resolved section
- [x] ReportTab redesign: NAMO branding, loading skeleton, violet AI section
- [x] TypeScript passes (0 errors) — ForecastTab TooltipProps workaround
- [x] Documentation: CLAUDE.md, README.md, docs/product.md, docs/architecture.md, docs/roadmap.md, docs/decisions.md
- [x] Git commit with NAMO phase progress

## ✅ Feature 1 — Role-Based Auth System (Completed)
- [x] User model in Prisma (id, fullName, email, password, role, status, initials, createdAt, lastLogin)
- [x] Prisma migration: add_users
- [x] bcryptjs password hashing (salt rounds: 12)
- [x] JWT sessions via jose (7-day HttpOnly cookie)
- [x] Single login page with NAMO branding + demo credential quick-fill buttons
- [x] POST /api/auth/login — verifies credentials, issues JWT, updates lastLogin
- [x] POST /api/auth/logout — clears JWT cookie
- [x] GET/PATCH /api/auth/me — current user info + password change
- [x] GET/POST /api/users — manager-only list + create
- [x] PATCH /api/users/[id] — manager-only role/status update
- [x] Middleware route protection (manager → /; dev → /dev; unauthenticated → /login)
- [x] Sidebar: role-based nav (Dashboard/Projects/Team for manager; My Dashboard for devs)
- [x] Sidebar: user avatar, name, role label, logout button
- [x] Team management page (/team) — sortable table with role/status badges
- [x] Employee modal — create (all fields) + edit (role/status only)
- [x] Deactivate/Reactivate employee (no delete, just status toggle)
- [x] Developer dashboard placeholder (/dev)
- [x] Profile page (/profile) — all roles, shows info + change password form
- [x] Seed data: 3 demo users (sarah@namo.dev, alex@namo.dev, emma@namo.dev)
- [x] README.md updated with Demo Login table
- [x] lib/roles.ts (client-safe) + lib/auth.ts (server-only) split to avoid next/headers in client bundles

## 🔜 Feature 2 — Developer Dashboard
- [ ] My tasks view (tasks assigned to logged-in developer)
- [ ] Task status update from dev dashboard
- [ ] Daily task summary

## 🔜 Phase 3 — Polish (Deferred)
- [ ] Dark mode toggle (sidebar already dark; need content area dark: classes)
- [ ] Custom confirm modal (replace browser `confirm()` dialogs)
- [ ] Keyboard shortcut: `N` to open new task, `R` for new risk
- [ ] Mobile responsive layout (sidebar → bottom nav on small screens)
- [ ] Task search + filter by owner/priority
- [ ] GIF / screenshot for README hero image

## 🔜 Phase 4 — Growth Features
- [ ] PostgreSQL support (swap adapter + provider in schema.prisma)
- [ ] LLM insights: replace lib/insights.ts with Claude API calls
- [ ] Slack webhook: post weekly report
- [ ] Email digest (weekly report via SendGrid/Resend)
- [ ] Vercel deployment (with Neon/Turso for hosted DB)
- [ ] Project templates
- [ ] Kanban board view (drag-and-drop task status columns)
- [ ] Risk matrix visualization (2×2 probability/impact grid)
- [ ] Public read-only project sharing link
