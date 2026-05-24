@AGENTS.md

# NAMO — Neural Analytics for Management Optimization
**Tagline:** Predict projects before they slip.

This is a full-stack AI-powered project management app built with Next.js, SQLite/Prisma, and rule-based heuristics. It is a resume/portfolio project — clean code, real functionality, no fake data beyond seed.

---

## Critical Environment Facts

| Thing | Value |
|-------|-------|
| Next.js version | **16.2.6** (NOT 14) — `params` is a `Promise`, must `await params` in all routes and pages |
| Prisma version | **v7** — `provider = "prisma-client"`, generates to `app/generated/prisma/client`, requires runtime adapter |
| SQLite adapter | `@prisma/adapter-better-sqlite3` — takes `{ url: "file:/abs/path" }`, NOT a Database instance |
| DB location | `./dev.db` at project root (NOT `prisma/dev.db`) |
| Zod version | **v4** — use `error.issues`, NOT `error.errors` |
| Tailwind version | **v4** — uses `@import "tailwindcss"` syntax in globals.css |
| React version | **19** — `gantt-task-react` conflicts, use `--legacy-peer-deps` for npm installs |

## Auth System (Feature 1)

- **JWT sessions** via `jose` — 7-day cookie (`namo-session`), HttpOnly, SameSite=Lax
- **Passwords** hashed with `bcryptjs` (salt rounds: 12)
- **Roles**: `manager`, `developer`, `senior_developer`
- **Middleware** (`middleware.ts`): route protection + role-based redirects
  - Manager → `/` (project dashboard); tries `/dev` → redirected to `/`
  - Developer/Senior Dev → `/dev`; tries `/` or `/projects` → redirected to `/dev`
  - Unauthenticated → `/login`
- **Auth lib split**: `lib/roles.ts` (client-safe types & constants) + `lib/auth.ts` (server-only, uses next/headers)
- **Demo accounts** (created by `npm run seed`):
  - Manager: sarah@namo.dev / manager123
  - Senior Dev: alex@namo.dev / senior123
  - Developer: emma@namo.dev / dev123

## Architecture

```
app/
  layout.tsx              Root layout (no AppShell here — each page wraps itself)
  login/page.tsx          Standalone login page (no sidebar)
  page.tsx                Manager dashboard (server, force-dynamic)
  dev/page.tsx            Developer dashboard placeholder (Feature 2)
  team/page.tsx           Manager-only team management
  profile/page.tsx        Profile + password change (all roles)
  projects/[id]/page.tsx  Project hub (server, awaits params, fetches project+insights)
  api/
    auth/login/           POST → issues JWT cookie
    auth/logout/          POST → clears JWT cookie
    auth/me/              GET → current user | PATCH → change password
    users/                GET list | POST create (manager only)
    users/[id]/           PATCH → update role/status (manager only)
    projects/             GET/POST list, GET/PUT/DELETE by id
    projects/[id]/tasks/  GET/POST
    projects/[id]/risks/  GET/POST
    projects/[id]/report/ GET → WeeklyReport JSON
    tasks/[id]/           GET/PUT/DELETE
    risks/[id]/           GET/PUT/DELETE
    seed/                 POST → re-seeds demo data

components/
  Sidebar.tsx             Nav sidebar (NAMO brand, slate-950 bg, 232px)
  AppShell.tsx            Client shell wrapping Sidebar + main content
  ProjectHub.tsx          Tabbed project view (Tasks | Forecast | Timeline | Risks | AI Insights | Report)
  DashboardClient.tsx     Dashboard with MetricCards + project grid
  ProjectCard.tsx         Health-colored card in project list
  ProjectModal.tsx        Create/edit project modal
  TaskModal.tsx           Create/edit task modal (with dep multi-select)
  RiskModal.tsx           Create/edit risk modal
  HealthScore.tsx         Visual health score gauge component
  tabs/
    TasksTab.tsx          Task table with inline status select, filter pills
    ForecastTab.tsx       Burndown + velocity charts (recharts)
    GanttTab.tsx          Custom SVG Gantt chart (NOT gantt-task-react)
    RisksTab.tsx          Risk register with severity-sorted cards
    InsightsTab.tsx       AI narrative UX — "why at risk", recommendations
    ReportTab.tsx         Weekly report with copy-to-clipboard
  ui/
    Button.tsx Badge.tsx  Primitive UI components

lib/
  prisma.ts               Prisma client singleton (adapter pattern)
  insights.ts             AI heuristics: health score, critical path, bottlenecks, suggestions
  forecast.ts             Forecast engine: burndown, velocity, planned vs actual
  report.ts               Weekly report generator
  utils.ts                cn(), formatDate(), daysFromNow(), STATUS_CONFIG, etc.

prisma/
  schema.prisma           DB schema (Prisma v7 syntax)
  seed.ts                 Demo data seeder (3 projects, 24 tasks, 6 risks)
  migrations/             Auto-generated migration files
```

## How to Run

```bash
# Install
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Create DB + run migrations
npx prisma migrate dev --name init

# Seed demo data
npm run seed

# Start dev server
npm run dev
# → http://localhost:3000
```

## Key Patterns

### Next.js 16 params (MUST await)
```ts
// app/projects/[id]/page.tsx
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  ...
}

// app/api/projects/[id]/route.ts
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  ...
}
```

### Prisma v7 client singleton
```ts
// lib/prisma.ts
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
return new PrismaClient({ adapter } as any);
```

### Insights engine
`lib/insights.ts` exports `computeInsights(tasks, risks)` → `ProjectInsights`:
- Health score 0–100 (≥70 Healthy, ≥40 At Risk, <40 Critical)
- Critical path via topological sort + DP on dependency DAG
- Delay detection: endDate < today AND status ≠ DONE
- Bottleneck detection: tasks with most downstream dependents
- Suggestions: pattern-matched severity-labeled recommendations

### Forecast engine
`lib/forecast.ts` exports 4 pure functions used by `ForecastTab`:
- `computeBurndown` — tasks remaining per day (planned/actual/forecast)
- `computeForecastSummary` — velocity, slippage, confidence
- `computeVelocityByWeek` — last 6 weeks of completions
- `computePlannedVsActual` — cumulative % completion over time

## Design System (NAMO)

- **Primary**: Violet-600 (`#7c3aed`) for interactive elements, active states
- **Background**: Slate-100 for content area, White for cards
- **Sidebar**: Slate-950 (`#020617`)
- **Font**: System sans-serif via Tailwind
- **Card style**: `bg-white rounded-xl border border-slate-200/80 shadow-sm`
- **Health colors**: Emerald (healthy) / Amber (at risk) / Red (critical)
- **Severity dots**: Red-500 / Orange-400 / Amber-400 / Slate-300

## File Naming Conventions
- Components: PascalCase, `.tsx`
- Lib functions: camelCase, `.ts`
- API routes: `route.ts` in Next.js convention
- All imports use `@/` alias (maps to project root)

## Known Limitations (MVP)
- JWT deactivation lag: if a user is deactivated while logged in, their existing token remains valid until expiry (7 days). Acceptable for MVP.
- SQLite only (swap `provider` in schema.prisma + adapter for PostgreSQL)
- AI insights are rule-based heuristics, not LLM (upgrade path: replace `lib/insights.ts` functions)
- No real-time updates (refresh after mutations via `router.refresh()`)
