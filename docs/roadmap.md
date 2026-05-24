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
