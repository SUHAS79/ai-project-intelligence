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

### Seed Data Overhaul ✅ (2026-05-25)
- [x] 19 users: 3 managers, 6 senior devs, 10 developers — all with real emails, initials, lastLogin
- [x] Preserved original demo accounts (sarah/alex/emma) + added 16 new team members
- [x] 3 projects, each with dedicated manager lead + full ProjectMember assignments
- [x] 30 tasks with assignedToId, estimatedHours/actualHours, mixed statuses (DONE/IN_REVIEW/IN_PROGRESS/BLOCKED/TODO)
- [x] Review workflow data: APPROVED tasks with workSummary; IN_REVIEW with PENDING; rejected task with rejectionReason
- [x] 18 TaskActivity records capturing submitted/approved/rejected audit trail
- [x] 36 task dependencies for realistic Gantt + critical path
- [x] 8 risks across projects (OPEN + MITIGATING)
- [x] 6 escalations: OPEN / RESPONDED / RESOLVED — covering all role scenarios
- [x] 15 availability entries: company holidays, approved/pending vacations, sick, WFH, partial days
- [x] 7 meetings: scheduled + ended, correct roomName format `namo-{slug}-{random6}`
- [x] Seed cleanup now covers all tables (was missing taskActivity, escalation, availability, meeting, projectMember)

### Feature 10 — People Page Project Assignment ✅ (2026-05-25)
- [x] New "Assigned Projects" column in People table — indigo chips per project, "Unassigned" if none
- [x] "Projects" action button per employee opens AssignProjectModal
- [x] AssignProjectModal: large checkbox-toggle buttons per active project, pre-checked from current memberships
- [x] GET /api/users/[id]/projects — returns user's current project memberships
- [x] PUT /api/users/[id]/projects — atomically syncs memberships (diff + transaction)
- [x] Immediate local state update on save (no page reload)
- [x] Search in People table now also matches project names
- [x] Table min-width bumped to 900px for wider column set
- [x] BaseEmployee / Employee type split keeps TypeScript clean across EmployeeModal boundary
- [x] people/page.tsx: parallel-fetches users (with memberships) + projects via Promise.all
- [x] Updating assignments immediately reflects in project TeamTab + workload view (same DB, same queries)

### Meetings Serialization Fix ✅ (2026-05-25)
- [x] Root cause: Prisma Date objects passed to MeetingsClient; parseISO() expects strings → runtime error
- [x] Fix: meetings/page.tsx now explicitly .toISOString() all Date fields before passing to client
- [x] Parallel fetch of meetings + projects with Promise.all
- [x] Added scheduledAt to orderBy for correct chronological sorting

### Login Page — All Demo Accounts ✅ (2026-05-25)
- [x] All 19 demo users shown in grouped collapsible accordion sections
- [x] Sections: Managers (3) / Senior Developers (6) / Developers (10)
- [x] Password hint shown in section header; click any account to quick-fill email + password
- [x] Accordion behavior: expanding one section collapses the previous

### Feature 11 — Dev + Senior Dev Project Workspace ✅ (2026-05-25)
- [x] Feature A: `/dev/projects` page — lists user's assigned projects with health, progress, manager, team count, due date
- [x] Feature A: "My Projects" added to DEV_NAV in Sidebar (between My Dashboard and Calendar)
- [x] Feature A: Proxy updated — `/projects/[id]` now accessible to all authenticated roles; only `/projects` list stays manager-only
- [x] Feature B: Team tab is read-only for dev/senior (role badges already visible via ROLE_LABELS + ROLE_COLORS)
- [x] Feature C: `TaskComment` Prisma model + migration; `GET/POST /api/tasks/[id]/comments`; `TaskCommentThread` modal component
- [x] Feature C: Comment (💬) button on every task row in TasksTab for all roles; `currentUserId` threaded through ProjectHub → TasksTab
- [x] Feature D: `ProjectMessage` Prisma model + migration; `GET/POST /api/projects/[id]/messages` with membership guard
- [x] Feature D: `ChatTab` component — polls every 5s, message bubbles, role badge per sender, grouped messages, Enter to send
- [x] Feature D: "Chat" tab added to ProjectHub (between Team and AI Insights)
- [x] Feature E: "Reassign" button on task rows in WorkloadView for overloaded/heavy devs; `ReassignModal` with candidate select + immediate refresh
- [x] Feature F: "Thread" button on escalation cards when task is attached; opens TaskCommentThread for direct communication
- [x] Feature G: `EscalationsTab` component — project-scoped escalation list + "New Escalation" for dev/senior; added as 7th tab in ProjectHub
- [x] Seed: 14 project chat messages + 9 task comments across all 3 projects; cleanup updated for new models
- [x] CLAUDE.md, docs/roadmap.md, todo.md updated

### Feature 12 — Role-Based Visibility Refactor ✅ (2026-05-25)
- [x] MANAGER_TABS (9 tabs): Tasks · Forecast · Timeline · Risks · Team · Chat · Escalations · AI Insights · Report
- [x] DEV_TABS (4 tabs): My Tasks · Team · Chat · Escalations
- [x] "Tasks" relabeled to "My Tasks" in DEV_TABS — label change applies at definition; manager tab unchanged
- [x] Forecast, Timeline, Risks, AI Insights, Report hidden from dev/senior at both UI (tab bar) and render level (`{isManager && ...}`)
- [x] myTasks: managers see all project tasks; dev/senior see only tasks where assignedToId === currentUserId
- [x] TasksTab receives filtered myTasks; TeamTab still receives full project.tasks for accurate member stats
- [x] API-level enforcement: GET /api/projects/[id]/tasks filters by assignedToId for non-managers
- [x] safeActiveTab guards: URL ?tab= clamped to role-visible tabs (no blank content for dev opening manager URL)
- [x] TasksTab empty states role-aware: "No tasks assigned to you" / "Tasks assigned to you in this project will appear here"
- [x] Health score in header computed server-side from full task list (accurate for all roles)
- [x] Back link: "/" for managers; "/dev/projects" for dev/senior
- [x] 0 TypeScript errors

### Feature 13 — Collaboration Flows Refactor ✅ (2026-05-25)

#### Part 1 — Dev/Senior Project Listing Cleanup
- [x] `/dev/projects` page: health score widget and project-wide progress bar removed
- [x] Replaced with per-user MY task breakdown chips: done / in progress / blocked / to do
- [x] "My Tasks" count badge in card header (scoped to current user only)
- [x] Retained: PM name, team count, due date, overdue indicator

#### Part 2 — Project Chat Verified
- [x] API confirmed correct: GET returns `{ messages: [...] }`; ChatTab uses `data.messages ?? []`
- [x] Project-scoped chat — messages stored with `projectId`; cross-project isolation enforced at DB level
- [x] Membership guard on GET and POST; managers always have access
- [x] 5s polling, auto-scroll, grouped bubbles, Enter to send — all functional

#### Part 3 — Meetings Project-First
- [x] Schema: `meetingType String @default("team")` + `participantId String?` + `participant` relation on Meeting
- [x] User model: `participatingIn Meeting[]` relation added
- [x] Migration `add-meeting-type` — SQLite DB updated
- [x] API POST now requires `projectId`; validates participant membership for individual meetings
- [x] `participant` included in all meeting GET/POST responses
- [x] **CreateMeetingModal** completely rewritten — 4-step guided flow:
  - Step 1: Choose project (mandatory; scoped to user-accessible projects)
  - Step 2: Meeting type — Full Team or 1-on-1
  - Step 3 (1-on-1 only): Select one project member (fetched from API; self excluded)
  - Step 4: Title (auto-generated, editable) + optional scheduled time
- [x] "Instant Meeting" CTA removed — all meetings now project-tied
- [x] MeetingCard shows type badge (Team / 1-on-1) and participant name for individual meetings
- [x] Meetings page scopes project dropdown by role (manager: all active; dev/senior: member projects only)
- [x] Seed: 8 meetings — 6 team + 2 individual (Sarah↔Alex, Marcus↔Sophie)

#### Part 4 — Role Safety
- [x] MANAGER_TABS (9) vs DEV_TABS (4) in ProjectHub — enforced at tab bar and render level
- [x] Dev/senior project listing shows only user-relevant data (no analytics)
- [x] Meeting creation scoped to accessible projects per role

### Fix — Meeting Queries, Project Chat & Dev Views ✅ (2026-05-25)
- [x] `app/api/meetings/[id]/route.ts`: `participant` added to local `MEETING_INCLUDE` — was missing, causing `PrismaClientValidationError: Unknown field 'participant'` at runtime
- [x] Root cause: `lib/prisma.ts` Prisma singleton on `globalThis` caches old client (pre-migration); fix = kill + restart server after `npx prisma generate`
- [x] `ChatTab.tsx`: split `fetchError` / `sendError` states; 403 shows "You are not a member of this project's chat." with AlertCircle icon; compose input disabled when fetch fails
- [x] 0 TypeScript errors; dev server started clean

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
- [x] Project-member assignment from People page (Feature 10 — completed)
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
