# NAMO — Neural Analytics for Management Optimization

**Predict projects before they slip.**

A full-stack AI-powered project management tool that continuously analyzes your projects and surfaces risks, blockers, and forecasts — before your next standup.

---

## Demo Login

| Role | Email | Password |
|------|-------|----------|
| Manager | sarah@namo.dev | manager123 |
| Senior Developer | alex@namo.dev | senior123 |
| Developer | emma@namo.dev | dev123 |

- **Manager** → lands on `/` (project dashboard), can manage team, projects, and view all health data
- **Senior Developer / Developer** → lands on `/dev` (developer dashboard, Feature 2 coming soon)
- Inactive accounts cannot log in (manager can deactivate from Team page)

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

### 📋 Project Management
- **Task management** — status, priority, owner, start/end dates, dependencies
- **Gantt timeline** — custom SVG chart with today marker and dependency visualization
- **Risk register** — probability/impact matrix, mitigation tracking, status transitions
- **Weekly report** — auto-generated executive summary, ready to copy to Slack or email

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
| Server state | TanStack React Query v5 |

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/ai-project-intelligence
cd ai-project-intelligence

# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Create DB and run migrations
npx prisma migrate dev --name init

# Seed with demo data (3 users, 3 projects, 24 tasks, 6 risks)
npm run seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Data

The seed script creates three realistic projects:

1. **Mobile App Launch Q3** — Active project with overdue tasks, blocked items, and an unresolved HIGH-impact risk. AI insights fire immediately.
2. **Website Redesign** — On-hold project with mixed task statuses.
3. **API Integration Sprint** — Active sprint with dependency chains.

Re-seed at any time: `npm run seed` (wipes and recreates all demo data).

---

## Project Structure

```
app/                    Next.js App Router pages + API routes
components/
  tabs/                 TasksTab, ForecastTab, GanttTab, RisksTab, InsightsTab, ReportTab
  ui/                   Button, Badge primitives
lib/
  insights.ts           AI heuristics engine
  forecast.ts           Burndown + velocity computations
  report.ts             Weekly report generator
  prisma.ts             DB client singleton
prisma/
  schema.prisma         DB schema
  seed.ts               Demo data seeder
docs/                   Product, architecture, roadmap, decisions
```

---

## Architecture Notes

- **Role-based auth** — Manager, Developer, Senior Developer roles with JWT sessions
- **No API keys** — all AI insights are rule-based heuristics (critical path, bottleneck scoring, health formulas)
- **SQLite** — swap to PostgreSQL by changing one line in `schema.prisma`
- See `docs/architecture.md` for full system design

---

## License

MIT
