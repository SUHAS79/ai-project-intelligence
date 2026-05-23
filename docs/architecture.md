# NAMO — Architecture Document

## System Overview

NAMO is a monolithic full-stack Next.js application. There is no external backend service — everything (API, DB, AI logic) runs in a single process on localhost. This is intentional for the MVP: zero ops, instant demo, one command to run.

```
Browser
  ↕ HTTP
Next.js App Router (app/)
  ├── Server Components (pages, layouts)
  ├── Client Components ("use client" — modals, interactive tabs)
  └── API Route Handlers (app/api/**)
        ↕ Prisma ORM
      SQLite (dev.db)

lib/
  insights.ts   — pure functions, no DB access
  forecast.ts   — pure functions, no DB access
  report.ts     — pure functions, no DB access
  prisma.ts     — DB singleton
```

---

## Data Model

```
Project
  id          String  @id @default(cuid())
  name        String
  description String?
  status      String  @default("ACTIVE")  // ACTIVE | ON_HOLD | COMPLETED | CANCELLED
  startDate   DateTime
  endDate     DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tasks       Task[]
  risks       Risk[]

Task
  id          String  @id @default(cuid())
  projectId   String
  title       String
  description String?
  status      String  @default("TODO")    // TODO | IN_PROGRESS | BLOCKED | DONE
  priority    String  @default("MEDIUM")  // LOW | MEDIUM | HIGH | CRITICAL
  owner       String?
  startDate   DateTime
  endDate     DateTime
  completedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  dependsOn   TaskDependency[] @relation("dependent")
  dependedOnBy TaskDependency[] @relation("dependency")

TaskDependency
  id           String @id @default(cuid())
  dependentId  String   // the task that depends on another
  dependencyId String   // the task being depended on
  @@unique([dependentId, dependencyId])

Risk
  id          String  @id @default(cuid())
  projectId   String
  title       String
  description String?
  probability String  @default("MEDIUM")  // LOW | MEDIUM | HIGH
  impact      String  @default("MEDIUM")  // LOW | MEDIUM | HIGH
  mitigation  String?
  status      String  @default("OPEN")    // OPEN | MITIGATING | RESOLVED | ACCEPTED
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
```

---

## AI/Heuristics Engine (`lib/insights.ts`)

All "AI Insights" are rule-based heuristics. No LLM, no API keys. Clearly labeled in UI as heuristic intelligence.

### Health Score (0–100)
```
score = (taskHealth × 0.4) + (riskHealth × 0.3) + (momentum × 0.3)

taskHealth  = completionRate × 100 - blockageRate × 30 - overdueRate × 40
riskHealth  = 100 - riskPenalty  (CRITICAL=40pts, HIGH=20pts, MEDIUM=10pts, LOW=5pts)
momentum    = progressRate × 100  (how far along are we relative to elapsed time?)

Labels: ≥70 → Healthy, ≥40 → At Risk, <40 → Critical
```

### Critical Path
Standard longest-path algorithm on the task dependency DAG:
1. Build adjacency list from `TaskDependency` records
2. Topological sort (Kahn's algorithm)
3. Dynamic programming: `dist[node] = max(dist[dep] + 1 for dep in predecessors)`
4. Backtrack from node with max dist to find the critical path

### Bottleneck Detection
For each task, count total downstream dependents (BFS from task through `dependedOnBy`). Tasks with the most dependents are bottlenecks. Report how many are currently BLOCKED.

### Delay Detection
`endDate < today AND status ≠ DONE`. Severity:
- CRITICAL: >14 days overdue
- HIGH: >7 days overdue
- MEDIUM: >3 days overdue
- LOW: 1–3 days overdue

### Suggestions
Pattern-matching rules:
- >30% tasks overdue → suggest timeline review
- Unassigned tasks exist → suggest ownership assignment
- No risks logged → suggest risk review
- CRITICAL priority + BLOCKED → urgent alert
- HIGH-impact OPEN risk with no mitigation → flag

---

## Forecast Engine (`lib/forecast.ts`)

Pure functions computing time-series from task data.

### Velocity
Computed over last 14 days from `completedAt` timestamps. Tasks/day.

### Burndown
For each calendar day from project start → end+buffer:
- **Planned**: linear `total → 0` over project duration
- **Actual**: tasks completed up to that day (only for past days)
- **Forecast**: `remainingToday - velocity × daysAhead` (only for future days)

### Completion Forecast
`forecastDate = today + ceil(remainingTasks / velocity)`
Confidence rating based on historical completions + recent activity.

### Planned vs Actual (% chart)
8 sample points across project timeline. Planned% = time elapsed as %. Actual% = tasks done / total × 100.

---

## API Routes

All routes follow the Next.js 16 pattern: `params` is `Promise<{id: string}>` — must `await params`.

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/projects | List all projects with tasks + risks |
| POST | /api/projects | Create project |
| GET | /api/projects/[id] | Get single project with full data |
| PUT | /api/projects/[id] | Update project |
| DELETE | /api/projects/[id] | Delete project + cascade |
| GET | /api/projects/[id]/tasks | List tasks (with deps) |
| POST | /api/projects/[id]/tasks | Create task |
| GET | /api/tasks/[id] | Get single task |
| PUT | /api/tasks/[id] | Update task (handles completedAt on DONE) |
| DELETE | /api/tasks/[id] | Delete task |
| GET | /api/projects/[id]/risks | List risks |
| POST | /api/projects/[id]/risks | Create risk |
| PUT | /api/risks/[id] | Update risk |
| DELETE | /api/risks/[id] | Delete risk |
| GET | /api/projects/[id]/report | Generate weekly report JSON |
| POST | /api/seed | Re-seed demo data |

---

## Component Architecture

### Server vs Client Components
- **Server**: `app/page.tsx`, `app/projects/[id]/page.tsx` — fetch data, pass to client
- **Client** (`"use client"`): All interactive components (modals, tabs with state, DashboardClient)
- Pattern: Server fetches → passes props to Client shell → Client renders tabs

### State Management
- **Server state**: TanStack React Query v5 (only ReportTab uses it — async fetch)
- **Route mutations**: `router.refresh()` after API calls (re-runs server components)
- **UI state**: `useState` in client components (tab selection, modal open/close)

---

## Dependency Graph

```
recharts           — Burndown, area, bar charts in ForecastTab
date-fns           — Date arithmetic throughout forecast + insights
@tanstack/react-query — ReportTab async fetch
react-hook-form    — All modals
zod                — Form validation schemas
sonner             — Toast notifications
lucide-react       — Icons throughout
@prisma/adapter-better-sqlite3 — SQLite runtime adapter for Prisma v7
better-sqlite3     — SQLite driver
```

---

## Upgrading to Production

1. **Auth**: Add NextAuth.js with any provider, protect all routes + API
2. **Database**: Change `provider` in `schema.prisma` to `postgresql`, update `.env` DATABASE_URL, swap adapter to `@prisma/adapter-neon` or similar
3. **LLM insights**: Replace pattern-matching functions in `lib/insights.ts` with Anthropic API calls
4. **Deploy**: Push to Vercel, configure env vars, run `prisma migrate deploy`
