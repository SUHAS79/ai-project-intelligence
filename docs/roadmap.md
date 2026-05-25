# NAMO — Roadmap

## Completed (MVP — Phase 1 & 2)

### Phase 1 — Core MVP
- [x] Next.js app scaffold with TypeScript, Tailwind v4, App Router
- [x] Prisma v7 schema: Project, Task, TaskDependency, Risk
- [x] SQLite database with migrations
- [x] Seed data: 3 realistic projects, 24 tasks, 23 dependencies, 6 risks
- [x] Dashboard with project cards and health scoring
- [x] Project CRUD (create, edit, delete)
- [x] Task CRUD with status, priority, owner, dates
- [x] Task dependencies (multi-select picker)
- [x] Risk register CRUD with probability/impact matrix
- [x] Gantt timeline (custom SVG — React 19 compatible)
- [x] AI Insights engine: health score, critical path, bottlenecks, suggestions
- [x] Weekly report generation with copy-to-clipboard
- [x] Toast notifications
- [x] Loading skeletons and empty states

### Phase 2 — NAMO Rebrand + Premium UI
- [x] Full rebrand to NAMO (Neural Analytics for Management Optimization)
- [x] NAMO sidebar: slate-950, violet gradient Zap icon, tagline
- [x] Dashboard redesign: MetricCards, portfolio health, alert banner
- [x] ProjectCard redesign: health-colored left border, progress bar
- [x] InsightsTab redesign: "Project Outlook" narrative lead card, "why at risk" text
- [x] ForecastTab (new): burndown chart, planned vs actual, weekly velocity bar chart
- [x] Forecast engine (lib/forecast.ts): velocity, burndown, slippage calculations
- [x] TasksTab redesign: violet filter pills, cleaner table, opacity-on-hover actions
- [x] RisksTab redesign: severity-sorted, left border color, resolved section
- [x] ReportTab redesign: NAMO branding, loading skeleton, copy button
- [x] TypeScript clean (0 errors)
- [x] Documentation: CLAUDE.md, README.md, docs/

---

### Feature 1 — Role-Based Auth System ✅ (2026-05-24)
- [x] User model with role, status, initials, lastLogin
- [x] Prisma migration + seed (3 demo users)
- [x] JWT auth via jose + bcryptjs password hashing
- [x] Single login page with NAMO branding and demo quick-fill
- [x] proxy.ts: role-based route protection (manager/dev/senior_dev)
- [x] Manager dashboard: People management (create, edit role/status, deactivate)
- [x] Developer dashboard placeholder (/dev)
- [x] Profile page for all roles (view info + change password)
- [x] Sidebar: role-aware nav + user card + logout
- [x] lib/roles.ts (client-safe) + lib/auth.ts (server-only) module split

### Feature 2 — Task Assignment & Developer Dashboard ✅ (2026-05-25)
- [x] assignedToId on Task — real user FK, syncs owner string for legacy compat
- [x] "Owner" renamed to "Person" throughout task UI
- [x] Task creation/editing uses real-user dropdown (populated from org members)
- [x] TeamTab: task matching by assignedToId (reliable) + name fallback
- [x] Developer dashboard: assigned tasks, stat row, inline status changer

### Feature 4 — Effort Estimation Per Task ✅ (2026-05-25)
- [x] estimatedHours + actualHours fields on Task (Float?, nullable)
- [x] SetEstimateModal: quick presets + manual input, auto-prompted on IN_PROGRESS
- [x] "Set Estimate" button on unestimated IN_PROGRESS tasks
- [x] SubmitReviewModal: actual hours field with over/under variance badge
- [x] Estimate displayed on dev task cards (colour-coded actual vs estimated)
- [x] Manager TaskModal: pre-fill estimatedHours at creation time
- [x] TasksTab: effort inline under task title
- [x] ForecastTab: Effort Overview card (totals, accuracy %, unestimated count)
- [x] Insights: suggestion for unestimated active tasks

### Feature 3 — Ticket Review Workflow ✅ (2026-05-25)
- [x] New task status: IN_REVIEW (review gate before DONE)
- [x] Developer submits task for review with work summary
- [x] Senior Dev Review Queue on /dev dashboard (scoped to their projects)
- [x] Manager sees IN_REVIEW tasks in TasksTab with Approve/Reject buttons
- [x] Rejected tasks return to IN_PROGRESS with visible rejection reason
- [x] Manager can reopen DONE tasks
- [x] TaskActivity model: full audit log per task
- [x] Activity log inline in TasksTab (expandable)
- [x] STATUS_CONFIG + insights engine updated for IN_REVIEW

### Feature 5 — Request Escalation ✅ (2026-05-25)
- [x] Escalation model with projectId, taskId (optional), createdById, message, status, targetRole, response, respondedById
- [x] Prisma migration + named relations (EscalationCreator, EscalationResponder)
- [x] GET/POST /api/escalations — role-scoped retrieval + creation
- [x] PATCH/DELETE /api/escalations/[id] — respond/resolve/delete
- [x] EscalateModal — auto-attaches task context, target role, message
- [x] RespondEscalationModal — respond or resolve with note
- [x] EscalationsSection — shared card list with status badges, expand, delete
- [x] Developer dashboard: "Escalate" button on blocked/in-progress tasks + "My Escalations" list
- [x] Senior Dev dashboard: "Incoming Escalations" section with open badge
- [x] Manager dashboard: "Open Escalations" panel with respond/resolve

### Feature 6 — Daily/Weekly/Monthly Report Generator ✅ (2026-05-25)
- [x] Period selector in ReportTab (Daily / Weekly / Monthly toggle) — re-fetches on change
- [x] lib/report.ts generateReport() takes period param; lookback window: 1/7/30 days
- [x] completedInPeriod replaces completedThisWeek; inReviewTasks section added
- [x] GET /api/projects/[id]/report?period= — query param support
- [x] generatePortfolioReport() — cross-project report function
- [x] GET /api/reports/portfolio?period= — manager-only portfolio API
- [x] PortfolioReportModal — cross-project summary with health table, stats, AI recs, copy
- [x] DashboardClient: "Portfolio Report" button in page header

### Feature 7 — Employee Availability/Holiday Calendar ✅ (2026-05-25)
- [x] Availability model: nullable userId (null = company holiday), startDate/endDate, type, approved
- [x] Types: holiday | vacation (needs approval) | sick | wfh | partial (auto-approved)
- [x] GET/POST /api/availability — role-scoped; DELETE/PATCH /api/availability/[id]
- [x] /availability page — monthly calendar grid accessible to all roles
- [x] Manager: add company holidays, add entries for any team member, approve/reject vacation requests
- [x] Developer: request days off (vacation = pending; sick/wfh = instant), see team calendar
- [x] Calendar: click a day for side panel with all entries and approval actions
- [x] "Calendar" link added to both manager and developer sidebars

### Feature 8 — Manager Workload View ✅ (2026-05-25)
- [x] /workload page (manager-only) — per-developer workload cards with expand/collapse
- [x] Workload scoring: overloaded | heavy | balanced | light | idle
- [x] Summary strip: team count, active tasks, overloaded dev count, total est. hours
- [x] Filter pills by workload level; stacked progress bar per developer
- [x] Expanded task list: status, priority, est. hours, due date, project link
- [x] "Off today" badge integrated with Availability data
- [x] Unassigned tasks panel — active tasks with no assigned developer
- [x] "Workload" added to manager sidebar

### Feature 9 — In-app Meetings via Jitsi ✅ (2026-05-25)
- [x] Meeting model: title, projectId (optional), roomName (unique), scheduledAt, createdById, status
- [x] Prisma migration + relations (MeetingCreator on User, meetings on Project)
- [x] roomName auto-generated: `namo-{slug}-{random6}` → maps to `meet.jit.si/{roomName}`
- [x] GET /api/meetings — all meetings, team-wide visibility
- [x] POST /api/meetings — create with auto-generated roomName
- [x] PATCH /api/meetings/[id] — update status (scheduled → active → ended)
- [x] DELETE /api/meetings/[id] — creator or manager only
- [x] MeetingRoom component: loads Jitsi iFrame API dynamically; full-screen overlay; prejoin disabled
- [x] MeetingsClient: Live Now / Scheduled / Past sections; Instant Meeting CTA; Join, Copy link, Open in tab, Delete
- [x] CreateMeetingModal: title, optional project link, optional scheduled datetime
- [x] /meetings page — accessible to all authenticated roles
- [x] "Meetings" added to both manager and developer sidebars (Video icon)

### Polish Pass v1 ✅ (2026-05-25)
- [x] Mobile sidebar: hamburger toggle + backdrop overlay on < lg screens
- [x] Task table horizontal scroll (overflow-x-auto) on mobile
- [x] Date validation in TaskModal and ProjectModal (endDate >= startDate)
- [x] ProjectCard "No tasks yet" state when tasks.length === 0
- [x] WorkloadView empty state for 0 developers
- [x] ReportTab Copy button shows "Copied!" for 2 seconds
- [x] TeamTab member remove now has confirm() dialog
- [x] DevDashboardClient review queue shows empty state
- [x] MeetingsClient handleCreated calls router.refresh()
- [x] Modal.tsx mx-4 for mobile overflow safety
- [x] All modal submitting states verified (TaskModal, RiskModal, ProjectModal, EscalateModal, RespondEscalationModal, CreateMeetingModal)

### Polish Pass v2 ✅ (2026-05-25)
- [x] EscalationsSection: proper status labels ("Open" / "Responded" / "Resolved"), delete toast feedback
- [x] MeetingsClient: instant meeting loading state (spinner, disabled, error toast)
- [x] PeopleManagement: fixed encoding bug in search placeholder; mobile table scroll
- [x] ProjectHub: role-aware back link (/dev for non-managers); Edit button manager-only
- [x] ProjectHub: tab bar scrolls on mobile (overflow-x-auto, 7 tabs fit); responsive header
- [x] Dashboard MetricCard grid: 2 → 3 → 5 columns across breakpoints (sm/md/lg)
- [x] InsightsTab stats row: 2 → 3 → 5 columns across breakpoints
- [x] All major pages: p-4 sm:p-8 responsive padding (Dashboard, Dev, Profile, Workload, Meetings, Availability, ProjectHub)
- [x] AvailabilityCalendar: calendar + side panel stack on mobile (flex-col on < lg); approve/reject/delete toast feedback
- [x] Sidebar: section label "Menu" → "Navigation" for developer roles
- [x] TeamTab: cleaner "no tasks" message
- [x] ProjectCard footer: aligned "Needs attention" + "Open →" on the right

---

## Next Priorities (Phase 3)

### P0 — Polish
- [ ] Dark mode toggle (Tailwind dark: classes already on sidebar)
- [ ] Keyboard shortcut: `N` to create new task when on Tasks tab
- [ ] Confirm dialogs replaced with prettier custom modal (no browser `confirm()`)
- [ ] Mobile responsive: stack sidebar as bottom nav on small screens
- [ ] GIF/screenshot for README hero

### P1 — Features
- [ ] Task search and filter by owner/priority
- [ ] Bulk status update (multi-select tasks)
- [ ] Project archive (soft delete, filterable)
- [ ] Drag-to-reorder tasks within a status column (Kanban view)
- [ ] Risk probability/impact matrix visualization (2×2 grid)

### P2 — Upgrade Path
- [x] Role-based auth (Feature 1 — completed)
- [ ] Multi-user: assign tasks to team members (link Task.owner to User.id)
- [ ] PostgreSQL support (schema already portable, just swap adapter)
- [ ] LLM insights: replace heuristics with Claude API for natural language summaries
- [ ] Vercel deployment pipeline with environment variables

### P3 — Growth
- [ ] Slack integration: post weekly report to channel
- [ ] Email digest: weekly summary to project stakeholders
- [ ] API webhooks: notify external systems on status change
- [ ] Public project sharing link (read-only view)

---

## Non-Goals (Explicitly Excluded)
- Mobile native app
- Time tracking / timesheet
- Budget / cost tracking
- Resource allocation / capacity planning
- GitHub/Jira/Linear integration (would require OAuth + API management)
