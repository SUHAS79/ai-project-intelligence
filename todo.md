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
- [x] People management page (/people) — sortable table with role/status badges
- [x] Employee modal — create (all fields) + edit (role/status only)
- [x] Deactivate/Reactivate employee (no delete, just status toggle)
- [x] Developer dashboard placeholder (/dev)
- [x] Profile page (/profile) — all roles, shows info + change password form
- [x] Seed data: 3 demo users (sarah@namo.dev, alex@namo.dev, emma@namo.dev)
- [x] README.md updated with Demo Login table
- [x] lib/roles.ts (client-safe) + lib/auth.ts (server-only) split to avoid next/headers in client bundles

## ✅ Feature 2 — Developer Dashboard & Task Assignment (Completed)
- [x] assignedToId FK on Task (nullable, refs User, onDelete: SetNull)
- [x] Rename "Owner" → "Person" throughout task UI
- [x] TaskModal: free-text owner replaced with real-user select dropdown
- [x] API: sync owner string from user.fullName on create/update
- [x] TasksTab: display assignedTo avatar/name; fall back to legacy owner
- [x] TeamTab: match tasks by assignedToId first, name fallback for legacy data
- [x] Real developer dashboard (/dev): assigned tasks, stat row, inline status change
- [x] Tasks sorted by urgency (IN_PROGRESS > BLOCKED > TODO > DONE)

## ✅ Feature 4 — Effort Estimation Per Task (Completed)
- [x] estimatedHours Float? + actualHours Float? on Task model
- [x] Prisma migration: add_effort_estimation
- [x] formatHours() utility in lib/utils.ts
- [x] SetEstimateModal — quick-select presets (1h, 2h, 4h, 1d, 2d, 1w) + manual input
- [x] Auto-prompt for estimate when dev moves task to IN_PROGRESS with no estimate
- [x] "Set Estimate" button on IN_PROGRESS tasks with no estimate
- [x] SubmitReviewModal: actual hours field with variance display (over/under est.)
- [x] DevDashboardClient: estimate chip on task cards, actual vs estimated colour-coded
- [x] TaskModal: estimatedHours field for managers to pre-fill
- [x] TasksTab: effort display inline under task title (estimate + actual vs estimated)
- [x] ForecastTab: Effort Overview card (total est., total actual, avg accuracy %, unestimated count)
- [x] Insights: suggestion for too many in-progress tasks with no estimate

## ✅ Feature 3 — Ticket Review Workflow (Completed)
- [x] New task status: IN_REVIEW (TODO → IN_PROGRESS → IN_REVIEW → DONE)
- [x] TaskActivity model: activity log per task (submitted_for_review, approved, rejected, reopened)
- [x] Review fields on Task: reviewStatus, workSummary, rejectionReason, reviewedById, reviewedAt, submittedForReviewAt
- [x] POST /api/tasks/[id]/review — developer submits with work summary
- [x] PATCH /api/tasks/[id]/review — approve | reject | reopen (senior dev + manager)
- [x] GET /api/reviews — global IN_REVIEW queue (senior dev: their projects; manager: all)
- [x] SubmitReviewModal — task name + work summary textarea
- [x] RejectTaskModal — rejection reason (min 10 chars)
- [x] ReviewQueueSection — approve/reject with full context (assignee, project, summary)
- [x] DevDashboardClient: submit for review button on IN_PROGRESS tasks; rejection reason visible; IN_REVIEW badge
- [x] Senior Dev /dev: Review Queue section with badge count
- [x] TasksTab: IN_REVIEW filter + banner; approve/reject for manager/senior dev; reopen for manager; activity log expansion
- [x] STATUS_CONFIG: added IN_REVIEW (purple)
- [x] Insights: IN_REVIEW excluded from overdue; counted as near-done in momentum score

## ✅ Feature 5 — Request Escalation (Completed)
- [x] Escalation model: id, projectId, taskId?, createdById, message, status, targetRole, response, respondedById, respondedAt
- [x] Prisma migration: add_escalation
- [x] Named Prisma relations: EscalationCreator + EscalationResponder on User; escalations[] on Project and Task
- [x] GET /api/escalations — scoped by role (dev: own, senior: targeted+project, manager: all)
- [x] POST /api/escalations — create with task context + targetRole
- [x] PATCH /api/escalations/[id] — respond or resolve (manager + senior dev only)
- [x] DELETE /api/escalations/[id] — creator or manager can delete OPEN escalations
- [x] EscalateModal — task auto-context, target role radio, message textarea
- [x] RespondEscalationModal — respond (keep open) or resolve with response note
- [x] EscalationsSection — shared card list with expand/respond/delete; status badges
- [x] DevDashboardClient: "Escalate" button on BLOCKED/IN_PROGRESS tasks
- [x] DevDashboardClient: "My Escalations" section for developers
- [x] DevDashboardClient: "Incoming Escalations" section for senior devs (badge count)
- [x] app/dev/page.tsx: fetch myEscalations + incomingEscalations (senior dev only)
- [x] DashboardClient: "Open Escalations" panel for manager (with badge count)
- [x] app/page.tsx: fetch openEscalations for manager dashboard
- [x] TypeScript: 0 errors
- [x] Build: passes

## ✅ Feature 6 — Daily/Weekly/Monthly Report Generator (Completed)
- [x] lib/report.ts: ReportPeriod type ("daily" | "weekly" | "monthly"), period param on generateReport()
- [x] lib/report.ts: renamed completedThisWeek → completedInPeriod; added inReviewTasks; WeeklyReport alias kept for back-compat
- [x] lib/report.ts: generatePortfolioReport() — cross-project summary with health scores, completions, blockers, recommendations
- [x] GET /api/projects/[id]/report?period= — accepts daily/weekly/monthly, default weekly
- [x] GET /api/reports/portfolio?period= — manager-only, cross-project portfolio report
- [x] ReportTab: period toggle (Daily / Weekly / Monthly) — re-fetches on change, labels update accordingly
- [x] ReportTab: Pending Review (IN_REVIEW) section added
- [x] PortfolioReportModal: cross-project modal on manager dashboard — summary stats, project health table, period toggle, copy to clipboard
- [x] DashboardClient: "Portfolio Report" button in header opens PortfolioReportModal
- [x] TypeScript: 0 errors, build: passes

## ✅ Feature 7 — Employee Availability/Holiday Calendar (Completed)
- [x] Availability model: userId (nullable = company holiday), startDate, endDate, type, note, approved
- [x] Prisma migration: add_availability + User.availability relation
- [x] Types: holiday (company-wide) | vacation (needs approval) | sick | wfh | partial (auto-approved)
- [x] GET /api/availability?month=YYYY-MM — manager: all users; dev: own + company holidays
- [x] POST /api/availability — manager: any user/holiday; dev: own entries only
- [x] PATCH /api/availability/[id] — manager approves/rejects vacation requests
- [x] DELETE /api/availability/[id] — creator or manager
- [x] /availability page — server page with AppShell, fetches current month data
- [x] AvailabilityCalendar — monthly grid with avatars per day, month navigation, fetch on change
- [x] Click a day — side panel shows all entries with approve/reject/delete actions
- [x] AddAvailabilityModal — date range, type radio, note, target user (manager only)
- [x] Pending approval badge counter for manager
- [x] Legend (holiday/vacation/sick/wfh/partial + pending indicator)
- [x] "Calendar" added to MANAGER_NAV and DEV_NAV in Sidebar

## ✅ Feature 8 — Manager Workload View (Completed)
- [x] /workload page — manager-only, force-dynamic server page
- [x] proxy.ts updated: /workload added to isManagerOnlyPath
- [x] WorkloadView client component: per-developer cards, expandable task list
- [x] Workload scoring: overloaded | heavy | balanced | light | idle (based on IN_PROGRESS count, overdue, est. hours)
- [x] Summary strip: team members, active tasks, overloaded count, estimated hours remaining
- [x] Overloaded alert banner with redistribution suggestion
- [x] Filter pills: filter by workload level (All / Overloaded / Heavy / Balanced / Light / Idle)
- [x] Developer card: stacked progress bar, status breakdown, overdue count, est. hours, expand/collapse
- [x] Expanded view: task list sorted by urgency (blocked first) with status, priority, est. hours, due date, project link
- [x] "Off today" badge using Availability data (approved vacation/sick/holiday)
- [x] Unassigned tasks panel: active tasks with no owner, link to their project
- [x] "Workload" added to MANAGER_NAV in Sidebar (BarChart3 icon)

## ✅ Feature 9 — In-app Meetings via Jitsi (Completed)
- [x] Meeting model: title, projectId (optional), roomName (unique), scheduledAt, createdById, status
- [x] Prisma migration: add_meetings; User.createdMeetings relation; Project.meetings relation
- [x] roomName format: namo-{slug}-{random6} — maps to meet.jit.si/{roomName}
- [x] GET /api/meetings — all meetings (team-wide visibility)
- [x] POST /api/meetings — create with auto-generated unique roomName
- [x] PATCH /api/meetings/[id] — update status (scheduled → active → ended)
- [x] DELETE /api/meetings/[id] — creator or manager only
- [x] MeetingRoom component: loads Jitsi iFrame API from meet.jit.si dynamically (useEffect), full-screen overlay
- [x] Jitsi config: prejoin disabled, watermark hidden, custom toolbar buttons, user displayName from session
- [x] MeetingsClient: meeting list with Live Now / Scheduled / Past sections
- [x] Instant Meeting CTA button — creates and launches a meeting in one click
- [x] CreateMeetingModal: title, optional project link, optional scheduled datetime
- [x] Meeting cards: Join/Rejoin button, Copy link, Open in new tab, Delete
- [x] Status badges: Scheduled / Live (animated red dot) / Ended
- [x] /meetings page — accessible to all roles (manager + developer)
- [x] "Meetings" added to MANAGER_NAV and DEV_NAV in Sidebar

## ✅ Polish Pass v1 (Completed 2026-05-25)
- [x] Mobile sidebar: hamburger toggle + backdrop overlay on < lg screens (AppShellClient.tsx)
- [x] Task table horizontal scroll on mobile (overflow-x-auto + min-w in TasksTab)
- [x] Date validation in TaskModal and ProjectModal (Zod .refine() endDate >= startDate)
- [x] ProjectCard "No tasks yet" empty state when tasks.length === 0
- [x] WorkloadView top-level empty state when developers.length === 0
- [x] WorkloadView expanded card: "No tasks assigned" instead of "No active tasks"
- [x] ReportTab copy button: "Copied!" feedback for 2 seconds
- [x] TeamTab member remove: confirm() dialog added
- [x] DevDashboardClient review queue: empty state message + task count text
- [x] MeetingsClient handleCreated: router.refresh() for data consistency
- [x] Modal.tsx: mx-4 for mobile overflow safety
- [x] All modals verified: submitting state + disabled buttons correct

## ✅ Polish Pass v2 (Completed 2026-05-25)
- [x] EscalationsSection status labels: "OPEN" → "Open", "RESPONDED" → "Responded", "RESOLVED" → "Resolved"
- [x] EscalationsSection delete: added success/error toast feedback
- [x] MeetingsClient instant meeting button: loading state (spinner, disabled, "Starting…" text, error toast)
- [x] PeopleManagement search placeholder: fixed encoding (â€¦ → …)
- [x] PeopleManagement table: overflow-x-auto wrapper + min-w-[640px] for mobile
- [x] ProjectHub back link: role-aware ("/dev" for non-manager, "/" for manager)
- [x] ProjectHub Edit button: only shown to manager (was visible to all roles)
- [x] ProjectHub tab bar: overflow-x-auto + whitespace-nowrap for 7 tabs on mobile
- [x] ProjectHub header: flex-col on mobile, flex-row on sm+; px-4 sm:px-8 padding
- [x] ProjectHub content: p-4 sm:p-8 responsive padding
- [x] DashboardClient: p-4 sm:p-8 responsive padding
- [x] DashboardClient MetricCard grid: grid-cols-2 sm:grid-cols-3 lg:grid-cols-5
- [x] DashboardClient header: flex-wrap + shortened button labels on mobile
- [x] DevDashboardClient: p-4 sm:p-8 responsive padding
- [x] ProfileClient: p-4 sm:p-8 responsive padding
- [x] Workload page: p-4 sm:p-8 responsive padding
- [x] Meetings page: p-4 sm:p-8 responsive padding
- [x] Availability page: p-4 sm:p-8 responsive padding
- [x] InsightsTab stats row: grid-cols-2 sm:grid-cols-3 lg:grid-cols-5
- [x] AvailabilityCalendar calendar+panel: flex-col on mobile, flex-row on lg+
- [x] AvailabilityCalendar side panel: w-full on mobile, w-72 on lg+
- [x] AvailabilityCalendar header: flex-wrap for mobile
- [x] AvailabilityCalendar approve/reject: added success/error toast feedback
- [x] AvailabilityCalendar delete: added success/error toast feedback
- [x] Sidebar section label: "Menu" → "Navigation" for non-manager roles
- [x] TeamTab no-tasks message: "No tasks assigned by name" → "No tasks assigned in this project."
- [x] ProjectCard footer: "Needs attention" + "Open →" grouped in right flex container

## ✅ Seed Data Overhaul (Completed 2026-05-25)
- [x] Expanded from 3 users → 19 users: 3 managers, 6 senior devs, 10 developers
- [x] All users have realistic names, emails (@namo.dev), initials, lastLogin dates
- [x] 3 projects each with dedicated manager lead + ProjectMember assignments (some cross-project)
- [x] 30 tasks across projects with assignedToId FK, estimatedHours, actualHours, mixed statuses
- [x] DONE/APPROVED tasks: workSummary, reviewedById, reviewedAt, actualHours set
- [x] IN_REVIEW/PENDING tasks: submittedForReviewAt, workSummary set
- [x] IN_PROGRESS with rejection: rejectionReason visible, reviewStatus = REJECTED
- [x] BLOCKED task (overdue): Android onboarding blocked and past deadline
- [x] 18 TaskActivity records: submitted_for_review + approved/rejected audit trail
- [x] 36 task dependencies for Gantt + critical path rendering
- [x] 8 risks across 3 projects (OPEN + MITIGATING, realistic descriptions)
- [x] 6 escalations: OPEN / RESPONDED / RESOLVED — covering all role scenarios
- [x] 15 availability entries: 3 company holidays, approved/pending vacations, sick days, WFH, partial
- [x] 7 meetings: scheduled + ended, project-linked + general, namo-{slug}-{random6} format
- [x] Seed cleanup now covers ALL 10 tables (was missing taskActivity, escalation, availability, meeting, projectMember)

## ✅ Feature 10 — People Page Project Assignment (Completed 2026-05-25)
- [x] New "Assigned Projects" column in People table: indigo chips per project, "Unassigned" in italics if none
- [x] "Projects" action button per row opens AssignProjectModal (inline in PeopleManagement.tsx)
- [x] AssignProjectModal: large toggle-checkbox buttons per active project, pre-checked from DB
- [x] Save button calls PUT /api/users/[id]/projects — diffs old vs new, applies in DB transaction
- [x] Local employee state updates immediately on save (no page reload or router.refresh needed)
- [x] Search in People table now also matches against project names
- [x] People table min-width: 640px → 900px to fit the extra column
- [x] BaseEmployee type (no project fields, matches EmployeeModal.Employee) + Employee extends BaseEmployee with projects[]
- [x] people/page.tsx: parallel fetches users+memberships+projects via Promise.all
- [x] New API: GET /api/users/[id]/projects — returns user's project memberships (manager only)
- [x] New API: PUT /api/users/[id]/projects — body {projectIds[]} — atomically syncs memberships in transaction
- [x] Updating assignments reflects in project TeamTab + workload view (same DB queries)

## ✅ Meetings Serialization Bug Fix (Completed 2026-05-25)
- [x] Root cause: Prisma Date objects passed to MeetingsClient as `meetings as any` — parseISO() requires strings → runtime crash
- [x] Fix: meetings/page.tsx now calls .toISOString() on all Date fields before passing to client component
- [x] Parallel-fetch meetings + projects via Promise.all for faster page load
- [x] Added scheduledAt to orderBy for correct chronological display

## ✅ Login Page — All 19 Demo Accounts (Completed 2026-05-25)
- [x] Replaced 3 flat buttons with grouped collapsible accordion (Managers / Senior Devs / Developers)
- [x] Password hint shown in each section header so reviewers can see all credentials at a glance
- [x] Click section header to expand; click any account row to quick-fill email + password
- [x] Accordion: expanding a section collapses the previously open one

## 🔜 Phase 3 — Polish (Remaining)
- [ ] Dark mode toggle (sidebar already dark; need content area dark: classes)
- [ ] Custom confirm modal (replace browser `confirm()` dialogs)
- [ ] Keyboard shortcut: `N` to open new task, `R` for new risk
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
