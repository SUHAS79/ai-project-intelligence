# TODO — AI Project Intelligence

## ✅ Completed (MVP)
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
- [x] All API routes (projects, tasks, risks, insights, report)
- [x] Root layout with sidebar navigation
- [x] Dashboard with summary stats and project cards
- [x] Project creation modal
- [x] Project detail hub with tabbed navigation
- [x] Tasks tab (list, create, edit, delete, status quick-toggle, filter)
- [x] Gantt/Timeline tab (custom SVG, color-coded, dependency arrows)
- [x] Risks tab (log, edit, delete, AI risk alerts)
- [x] AI Insights tab (health score, delays, critical path, bottlenecks, suggestions)
- [x] Weekly Report tab (auto-generated, copy to clipboard)
- [x] spec.md, todo.md, README.md
- [x] TypeScript passes (0 errors)
- [x] Production build passes

## 🔜 Next Steps (Post-MVP)
- [ ] Add recharts-based progress/velocity chart on dashboard
- [ ] Dark mode toggle
- [ ] Export report as PDF
- [ ] Keyboard shortcuts (cmd+k project switcher)
- [ ] Add task time tracking (actual hours)
- [ ] LLM integration for natural language insights (replace heuristics with GPT-4/Claude API)
- [ ] Multi-user auth (NextAuth.js)
- [ ] Email digest (weekly report via email)
- [ ] Slack/Teams notification webhook
- [ ] PostgreSQL upgrade path (change Prisma provider + URL only)
- [ ] Deploy to Vercel (with LibSQL/Turso for hosted SQLite)
- [ ] Project templates (sprint, product launch, data migration)
- [ ] Burndown/burnup charts
- [ ] Time zones for deadlines
