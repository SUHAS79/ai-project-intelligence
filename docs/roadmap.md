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
- [ ] NextAuth.js authentication (GitHub or Google provider)
- [ ] Multi-user: assign tasks to team members (user accounts)
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
