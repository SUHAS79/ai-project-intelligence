# NAMO — Neural Analytics for Management Optimization

**Predict projects before they slip.**

A full-stack AI-powered project management tool that continuously analyzes your projects and surfaces risks, blockers, and forecasts — before your next standup.

---

## Demo Login

All 19 demo accounts use the same password per role. On the login page, click any role group to expand and quick-fill.

| Role | Email | Password |
|------|-------|----------|
| Manager | sarah@namo.dev | manager123 |
| Manager | marcus@namo.dev | manager123 |
| Manager | rachel@namo.dev | manager123 |
| Senior Developer | alex@namo.dev | senior123 |
| Senior Developer | nina@namo.dev | senior123 |
| Senior Developer | carlos@namo.dev | senior123 |
| Senior Developer | priya@namo.dev | senior123 |
| Senior Developer | jordan@namo.dev | senior123 |
| Senior Developer | yuki@namo.dev | senior123 |
| Developer | emma@namo.dev | dev123 |
| Developer | james@namo.dev | dev123 |
| Developer | aisha@namo.dev | dev123 |
| Developer | (+ 7 more) | dev123 |

- **Manager** → lands on `/` — project dashboard, people management, workload view, portfolio reports
- **Senior Developer** → lands on `/dev` — assigned tasks, review queue, incoming escalations
- **Developer** → lands on `/dev` — assigned tasks, submit for review, escalate blockers

---

## Features

### 🧠 AI Insights
- **Health score** (0–100) computed from task velocity, blockage rate, and risk severity
- **Critical path** detection — visualizes the longest dependency chain in your project
- **Bottleneck analysis** — identifies which tasks are blocking the most work
- **Delay detection** — flags overdue tasks with severity ratings (CRITICAL / HIGH / MEDIUM / LOW)
- **Smart recommendations** — pattern-matched suggestions for common project failure modes

### 📈 Forecasting
- **Burndown chart** — planned vs actual vs AI-projected trajectory
- **Completion forecast** — velocity-based prediction with confidence rating (Low/Medium/High)
- **Schedule variance** — exactly how many days ahead or behind you are
- **Weekly velocity** — bar chart of tasks completed per week over last 6 weeks
- **Effort overview** — estimated vs actual hours, accuracy %, unestimated task count

### 📋 Project Management
- **Task management** — status, priority, owner, start/end dates, dependencies, effort estimates
- **Review workflow** — Developer → Senior Dev/Manager review gate before DONE; rejected tasks return with reason
- **Gantt timeline** — custom SVG chart with today marker and dependency visualization
- **Risk register** — probability/impact matrix, mitigation tracking, status transitions
- **Report generator** — daily/weekly/monthly executive summary, copy to Slack/email
- **Portfolio report** — cross-project health and completion summary (manager only)

### 👥 Team Management
- **People page** — sortable/searchable table of all 19 team members with role and project assignment
- **Project assignment** — assign/reassign employees to projects directly from the People page; updates team lists instantly
- **Workload view** — per-developer task load scoring (idle → light → balanced → heavy → overloaded)
- **Availability calendar** — company holidays, vacation requests (with approval), sick days, WFH
- **Escalation system** — developers escalate blockers to senior devs or managers; full respond/resolve flow

### 📹 Meetings
- **Instant meetings** — one click to start a Jitsi Meet room, no account required
- **Scheduled meetings** — create with optional project link and date/time
- **Join from anywhere** — copy link, open in new tab, or join in-app with full Jitsi overlay

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | SQLite + Prisma v7 |
| Auth | JWT via jose + bcryptjs (role-based sessions) |
| UI | Tailwind CSS v4 |
| Charts | Recharts |
| Forms | React Hook Form + Zod v4 |
| Icons | Lucide React |
| Toasts | Sonner |
| Video | Jitsi Meet (via external_api.js) |

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/SUHAS79/ai-project-intelligence
cd ai-project-intelligence

# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Create DB and run migrations
npx prisma migrate dev --name init

# Seed with realistic demo data
npm run seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Data

The seed script creates a fully-populated realistic workspace:

**19 users across 3 roles** (3 managers · 6 senior devs · 10 developers)

**3 active projects**, each led by a dedicated manager:
1. **Mobile App Launch Q3** — Sarah Mitchell leads; overdue Android task, iOS in review, critical path active. AI insights fire immediately.
2. **Data Platform Migration** — Marcus Johnson leads; ETL pipeline overdue, escalation open, data risks logged.
3. **Internal Dashboard Redesign** — Rachel Chen leads; wireframes in review, cross-project developer (Emma on both P1 and P3).

**30 tasks in mixed states** — demonstrating the full workflow:
- `DONE/APPROVED` — with work summaries and actual hours
- `IN_REVIEW` — submitted, awaiting senior dev approval
- `IN_PROGRESS` — active work, one with a rejection reason visible
- `BLOCKED` — overdue Android task with an open escalation
- `TODO` — upcoming work with estimates

**Supporting data**: 36 dependencies · 18 activity log entries · 8 risks · 6 escalations · 15 availability entries · 7 meetings

Re-seed at any time: `npm run seed` (wipes and recreates all demo data in ~3 seconds).

---

## Project Structure

```
app/                    Next.js App Router pages + API routes
  api/
    users/[id]/projects/  GET/PUT — user project membership management
    projects/[id]/members/ GET/POST/DELETE — project team management
    meetings/             GET/POST/PATCH/DELETE — meeting CRUD
    escalations/          GET/POST/PATCH/DELETE — escalation flow
    availability/         GET/POST/PATCH/DELETE — calendar entries
    reports/portfolio/    GET — cross-project summary
components/
  PeopleManagement.tsx  People table with inline project assignment modal
  MeetingsClient.tsx    Meeting list with Jitsi integration
  tabs/                 TasksTab, ForecastTab, GanttTab, RisksTab, InsightsTab, ReportTab
  ui/                   Button, Badge primitives
lib/
  insights.ts           AI heuristics engine
  forecast.ts           Burndown + velocity computations
  report.ts             Report generator (daily/weekly/monthly + portfolio)
  prisma.ts             DB client singleton
prisma/
  schema.prisma         DB schema (19 models)
  seed.ts               Comprehensive demo data seeder
docs/                   Roadmap, architecture, decisions
```

---

## Architecture Notes

- **Role-based auth** — Manager, Developer, Senior Developer roles with JWT sessions; route protection via `proxy.ts`
- **No API keys** — all AI insights are rule-based heuristics (critical path, bottleneck scoring, health formulas)
- **SQLite** — swap to PostgreSQL by changing one line in `schema.prisma` + the adapter import
- **Server → Client serialization** — all Prisma Date objects are explicitly `.toISOString()`'d before passing to client components
- See `docs/roadmap.md` for full feature history and `CLAUDE.md` for developer reference

---

## License

MIT
