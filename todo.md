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

## 🔜 Phase 3 — Polish (Next Session)
- [ ] Dark mode toggle (sidebar already dark; need content area dark: classes)
- [ ] Custom confirm modal (replace browser `confirm()` dialogs)
- [ ] Keyboard shortcut: `N` to open new task, `R` for new risk
- [ ] Mobile responsive layout (sidebar → bottom nav on small screens)
- [ ] Task search + filter by owner/priority
- [ ] GIF / screenshot for README hero image

## 🔜 Phase 4 — Growth Features
- [ ] NextAuth.js authentication (GitHub or Google)
- [ ] PostgreSQL support (swap adapter + provider in schema.prisma)
- [ ] LLM insights: replace lib/insights.ts with Claude API calls
- [ ] Slack webhook: post weekly report
- [ ] Email digest (weekly report via SendGrid/Resend)
- [ ] Vercel deployment (with Neon/Turso for hosted DB)
- [ ] Project templates
- [ ] Kanban board view (drag-and-drop task status columns)
- [ ] Risk matrix visualization (2×2 probability/impact grid)
- [ ] Public read-only project sharing link
