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
- **Middleware** (`proxy.ts`, NOT `middleware.ts`): route protection + role-based redirects
  - Manager → `/` (project dashboard); tries `/dev` → redirected to `/`
  - Developer/Senior Dev → `/dev`; tries `/` or `/projects` → redirected to `/dev`
  - Unauthenticated → `/login`
- **Auth lib split**: `lib/roles.ts` (client-safe types & constants) + `lib/auth.ts` (server-only, uses next/headers)
- **Demo accounts** (created by `npm run seed`):
  - Managers: sarah@namo.dev / manager123 · marcus@namo.dev / manager123 · rachel@namo.dev / manager123
  - Senior Devs: alex@namo.dev / senior123 · nina@namo.dev / senior123 · carlos@namo.dev / senior123 · priya@namo.dev / senior123 · jordan@namo.dev / senior123 · yuki@namo.dev / senior123
  - Developers: emma@namo.dev / dev123 · james@namo.dev / dev123 · maria@namo.dev / dev123 · lisa@namo.dev / dev123 · david@namo.dev / dev123 · sophie@namo.dev / dev123 · tyler@namo.dev / dev123 · aisha@namo.dev / dev123 · ben@namo.dev / dev123 · zoe@namo.dev / dev123

## Architecture

```
app/
  layout.tsx              Root layout (no AppShell here — each page wraps itself)
  login/page.tsx          Standalone login page (accordion demo accounts for all 19 users)
  page.tsx                Manager dashboard (server, force-dynamic)
  dev/page.tsx            Developer dashboard (server, force-dynamic)
  dev/projects/page.tsx   Dev project list — projects user is assigned to (Feature A)
  team/page.tsx           [DEPRECATED — replaced by /people]
  people/page.tsx         Manager-only people management (fetches users + memberships + projects)
  profile/page.tsx        Profile + password change (all roles)
  projects/[id]/page.tsx  Project hub (server, awaits params, fetches project+insights, passes currentUserId)
  workload/page.tsx       Manager-only team capacity view (now passes allCandidates for reassignment)
  meetings/page.tsx       Meeting list + Jitsi join — all authenticated roles
  availability/page.tsx   Availability/holiday calendar — all authenticated roles
  api/
    auth/login/           POST → issues JWT cookie
    auth/logout/          POST → clears JWT cookie
    auth/me/              GET → current user | PATCH → change password
    users/                GET list | POST create (manager only)
    users/[id]/           PATCH → update role/status (manager only)
    users/[id]/projects/  GET → user's project memberships | PUT → sync memberships (manager only)
    projects/             GET/POST list, GET/PUT/DELETE by id
    projects/[id]/tasks/  GET/POST
    projects/[id]/risks/  GET/POST
    projects/[id]/report/ GET → WeeklyReport JSON
    projects/[id]/members/ GET/POST/DELETE — project membership
    projects/[id]/messages/ GET/POST — project group chat (Feature D)
    tasks/[id]/           GET/PUT/DELETE
    tasks/[id]/review/    POST (submit) | PATCH (approve/reject/reopen)
    tasks/[id]/comments/  GET/POST — per-task comment thread (Feature C)
    risks/[id]/           GET/PUT/DELETE
    reviews/              GET → IN_REVIEW queue (senior dev scoped to their projects, manager sees all)
    escalations/          GET (scoped by role) | POST (create escalation)
    escalations/[id]/     PATCH (respond/resolve) | DELETE (creator or manager)
    reports/portfolio/    GET → cross-project portfolio report (manager only, ?period=daily|weekly|monthly)
    availability/         GET (?month=YYYY-MM, role-scoped) | POST (create entry)
    availability/[id]/    PATCH (approve/reject, manager) | DELETE (creator or manager)
    meetings/             GET (all, team-wide) | POST (create, auto-generates roomName)
    meetings/[id]/        PATCH (update status) | DELETE (creator or manager)
    seed/                 POST → re-seeds demo data

components/
  Sidebar.tsx             Nav sidebar (NAMO brand, slate-950 bg, 232px)
  AppShell.tsx            Client shell wrapping Sidebar + main content
  ProjectHub.tsx          Tabbed project view (Tasks | Forecast | Timeline | Risks | Team | Chat | Escalations | AI Insights | Report)
  DashboardClient.tsx     Dashboard with MetricCards + project grid
  ProjectCard.tsx         Health-colored card in project list
  ProjectModal.tsx        Create/edit project modal
  TaskModal.tsx           Create/edit task modal (with dep multi-select)
  RiskModal.tsx           Create/edit risk modal
  EscalateModal.tsx       Developer/senior sends escalation (task context + message + target)
  RespondEscalationModal.tsx  Manager/senior dev responds or resolves an escalation
  EscalationsSection.tsx  Shared card list component for escalations (used in both dashboards); has "Thread" button per escalation if task attached
  TaskCommentThread.tsx   Modal dialog for per-task comment thread (Feature C)
  PortfolioReportModal.tsx  Manager-only cross-project report modal (period toggle, health table, copy)
  MeetingsClient.tsx      Meeting list with Live Now/Scheduled/Past sections + Instant Meeting CTA
  CreateMeetingModal.tsx  Create meeting form (title, optional project, optional scheduled time)
  MeetingRoom.tsx         Full-screen Jitsi iFrame overlay; loads external_api.js dynamically
  PeopleManagement.tsx    Manager people table: sort/search/filter, Assigned Projects column, AssignProjectModal inline
  EmployeeModal.tsx       Create/edit employee modal
  HealthScore.tsx         Visual health score gauge component
  tabs/
    TasksTab.tsx          Task table with inline status select, filter pills, comment thread button (💬)
    ForecastTab.tsx       Burndown + velocity charts (recharts)
    GanttTab.tsx          Custom SVG Gantt chart (NOT gantt-task-react)
    RisksTab.tsx          Risk register with severity-sorted cards
    InsightsTab.tsx       AI narrative UX — "why at risk", recommendations
    ReportTab.tsx         Weekly report with copy-to-clipboard
    ChatTab.tsx           Project group chat — polling /api/projects/[id]/messages, message bubbles (Feature D)
    EscalationsTab.tsx    Per-project escalation list + "New Escalation" for dev/senior (Feature G)
  ui/
    Button.tsx Badge.tsx  Primitive UI components

lib/
  prisma.ts               Prisma client singleton (adapter pattern)
  insights.ts             AI heuristics: health score, critical path, bottlenecks, suggestions
  forecast.ts             Forecast engine: burndown, velocity, planned vs actual
  report.ts               Weekly report generator
  utils.ts                cn(), formatDate(), daysFromNow(), STATUS_CONFIG, etc.

prisma/
  schema.prisma           DB schema (Prisma v7 syntax — 21 models including TaskComment + ProjectMessage)
  seed.ts                 Demo data seeder (19 users, 3 projects, 30 tasks, 36 deps, 18 activities, 8 risks, 6 escalations, 15 availability, 7 meetings, 14 chat msgs, 9 task comments)
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

### Serializing dates from server → client components
Server components must convert Prisma `Date` objects to ISO strings before passing to client components.
`parseISO()` from date-fns expects a string — passing a Date object causes a runtime crash.
```ts
// CORRECT — in meetings/page.tsx:
const meetings = meetingsRaw.map((m) => ({
  ...m,
  scheduledAt: m.scheduledAt?.toISOString() ?? null,
  createdAt: m.createdAt.toISOString(),
}));

// WRONG — Date objects break parseISO() in client:
<MeetingsClient initialMeetings={meetings as any} />
```

### Project membership API (user-centric)
`GET /api/users/[id]/projects` — returns list of projects the user is a member of
`PUT /api/users/[id]/projects` — body: `{ projectIds: string[] }` — diffs and syncs memberships atomically
```ts
// Diff + transaction pattern in /api/users/[id]/projects/route.ts:
const toAdd = projectIds.filter((pid) => !currentIds.has(pid));
const toRemove = [...currentIds].filter((pid) => !newIds.has(pid));
await prisma.$transaction([
  prisma.projectMember.deleteMany({ where: { userId: id, projectId: { in: toRemove } } }),
  ...toAdd.map((projectId) => prisma.projectMember.create({ data: { projectId, userId: id } })),
]);
```

### PeopleManagement type split
`EmployeeModal` returns a `BaseEmployee` (no project fields). `PeopleManagement` extends it with `projects: Project[]`.
Always preserve existing projects when EmployeeModal fires `onSuccess`:
```ts
copy[idx] = { ...updated, projects: copy[idx]?.projects ?? [] };
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
- **Project assignment chips**: Indigo-50 bg / Indigo-700 text / Indigo-100 border

## File Naming Conventions
- Components: PascalCase, `.tsx`
- Lib functions: camelCase, `.ts`
- API routes: `route.ts` in Next.js convention
- All imports use `@/` alias (maps to project root)

## Seed Data (as of 2026-05-25)

19 users across 3 roles:
- **3 Managers**: Sarah Mitchell, Marcus Johnson, Rachel Chen (each leads one project)
- **6 Senior Devs**: Alex Rivera, Nina Volkov, Carlos Mendez, Priya Patel, Jordan Walsh, Yuki Tanaka
- **10 Developers**: Emma Wilson, James Kim, Maria Santos, Lisa Tran, David Park, Sophie Brown, Tyler Wright, Aisha Okafor, Ben Carter, Zoe Adams

3 projects with dedicated manager ownership + ProjectMember assignments:
1. **Mobile App Launch Q3** — Sarah leads; Alex+Nina senior; Emma/James/Maria/Lisa/David devs
2. **Data Platform Migration** — Marcus leads; Carlos+Priya senior; Sophie/Tyler/Aisha devs
3. **Internal Dashboard Redesign** — Rachel leads; Jordan+Yuki senior; Emma/Ben/Zoe devs (Emma is cross-project)

30 tasks in mixed states demonstrating full workflow:
- DONE/APPROVED (7): include workSummary, reviewedById, actualHours
- IN_REVIEW/PENDING (3): submitted, awaiting senior dev or manager approval
- IN_PROGRESS (4): includes one rejected task with rejectionReason visible
- BLOCKED (1): Android onboarding blocked on design assets (overdue)
- TODO (15): upcoming work with estimatedHours

Other seed data:
- 36 task dependencies (realistic DAG per project)
- 18 TaskActivity records (submitted_for_review + approved/rejected audit trail)
- 8 risks across projects (OPEN + MITIGATING)
- 6 escalations (OPEN / RESPONDED / RESOLVED — covering all roles)
- 15 availability entries (company holidays, approved/pending vacations, sick, WFH, partial)
- 8 meetings (6 team + 2 individual; 5 scheduled, 3 ended; project-linked)

Seed cleanup order (safe for all FK constraints):
```ts
await prisma.taskActivity.deleteMany();
await prisma.taskDependency.deleteMany();
await prisma.escalation.deleteMany();
await prisma.task.deleteMany();
await prisma.risk.deleteMany();
await prisma.availability.deleteMany();
await prisma.meeting.deleteMany();
await prisma.projectMember.deleteMany();
await prisma.project.deleteMany();
await prisma.user.deleteMany();
```

## Known Limitations (MVP)
- JWT deactivation lag: if a user is deactivated while logged in, their existing token remains valid until expiry (7 days). Acceptable for MVP.
- SQLite only (swap `provider` in schema.prisma + adapter for PostgreSQL)
- AI insights are rule-based heuristics, not LLM (upgrade path: replace `lib/insights.ts` functions)
- No real-time updates (refresh after mutations via `router.refresh()`)

## Polish Pass v1 (completed 2026-05-25)
- Mobile sidebar: hamburger toggle on < lg screens (AppShellClient.tsx + Sidebar.tsx updated)
- All modals have submitting state + disabled buttons (TaskModal, RiskModal, ProjectModal, EscalateModal, RespondEscalationModal, CreateMeetingModal all use isSubmitting/saving)
- Date validation in TaskModal and ProjectModal (endDate >= startDate via Zod refine)
- Table horizontal scroll on mobile (overflow-x-auto + min-w-[640px] in TasksTab)
- Fragment key fix in TasksTab (already correct — Fragment with key={task.id})
- Empty states added to Escalations (EscalationsSection already had one), WorkloadView (new top-level empty state)
- Badge and Button base classes normalized (Badge uses inline-flex items-center rounded-full; Button has disabled:opacity-50 disabled:cursor-not-allowed)
- Router.refresh() consistency — MeetingsClient.handleCreated now calls router.refresh()
- ProjectCard shows "No tasks yet" when tasks.length is 0
- ReportTab Copy button shows "Copied!" for 2 seconds after click
- TeamTab remove member now has confirm() dialog
- DevDashboardClient review queue shows empty state message when no items

## Polish Pass v2 (completed 2026-05-25)
- EscalationsSection: status labels use proper case ("Open"/"Responded"/"Resolved"); delete has success toast
- MeetingsClient: instant meeting button has loading state (spinner + "Starting…" text + error toast); single-click guard
- PeopleManagement: search placeholder encoding fixed; table gets overflow-x-auto on mobile
- ProjectHub: back link is role-aware (`/dev` for non-managers, `/` for manager); Edit button only visible to manager; tab bar scrolls on mobile (overflow-x-auto + min-w-max); header stacks on mobile (flex-col → sm:flex-row); all padding responsive (p-4 sm:p-8, px-4 sm:px-8)
- DashboardClient: MetricCard grid is responsive (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`); padding is `p-4 sm:p-8`; header buttons shorten on mobile
- InsightsTab: stats row is responsive (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`)
- All major pages (Dev dashboard, Profile, Workload, Meetings, Availability): padding is `p-4 sm:p-8`
- AvailabilityCalendar: calendar + side panel stack on mobile (`flex-col lg:flex-row`); side panel is `w-full lg:w-72`; header wraps on mobile; approve/reject/delete all have toast feedback
- Sidebar: section label "Menu" → "Navigation" for non-manager roles
- TeamTab: "No tasks assigned by name in this project." → "No tasks assigned in this project."
- ProjectCard footer: "Needs attention" and "Open →" grouped right-aligned

## Seed Data Overhaul (completed 2026-05-25)
- Expanded from 3 users → 19 users (3 managers, 6 senior devs, 10 developers)
- 3 projects each with a dedicated manager lead and full ProjectMember assignments
- 30 tasks with assignedToId FK, estimatedHours, actualHours, review workflow fields
- Review workflow data: DONE/APPROVED tasks have workSummary + reviewedById; IN_REVIEW tasks have PENDING status + submittedForReviewAt; one task shows REJECTED flow with rejectionReason
- 18 TaskActivity records for audit trail (submitted/approved/rejected)
- 36 task dependencies for Gantt + critical path rendering
- 8 risks (OPEN + MITIGATING) across all 3 projects
- 6 escalations in OPEN/RESPONDED/RESOLVED states covering all role scenarios
- 15 availability entries: company holidays, approved + pending vacations, sick days, WFH, partial days
- 7 meetings: scheduled + ended, project-linked and general, correct roomName format
- Seed cleanup now covers ALL tables (was missing taskActivity, escalation, availability, meeting, projectMember)

## People Page — Project Assignment (completed 2026-05-25)
- New "Assigned Projects" column in the people table: shows indigo chips per project, or "Unassigned" if none
- "Projects" action button per employee opens `AssignProjectModal` (inline in PeopleManagement.tsx)
- `AssignProjectModal`: checkbox-style toggle buttons for all active projects, pre-checked from current memberships
- Save calls `PUT /api/users/[id]/projects` — atomically diffs and syncs memberships in a single DB transaction
- Local state updates immediately on save (no page reload)
- Search now also matches project names
- People table min-width bumped from 640px → 900px to fit extra column
- `BaseEmployee` type (no projects, matches EmployeeModal) split from `Employee` type (extends with `projects: Project[]`) to keep TypeScript clean across the component boundary

## Meetings Page — Serialization Fix (completed 2026-05-25)
- Root cause: Prisma returns `Date` objects; `parseISO()` in `MeetingCard` expects a string
- Fix: meetings page now explicitly calls `.toISOString()` on all Date fields before passing to client
- Also: switched to `Promise.all` for parallel fetching of meetings + projects; added `scheduledAt` to orderBy

## Dev + Senior Dev Workspace Upgrade (completed 2026-05-25)

Features A–G: transformed the developer and senior developer experience into a proper project workspace.

### Feature A — My Projects page (`/dev/projects`)
- New page listing all projects the current user is assigned to
- Cards show: name, description, health score, progress bar (done/total tasks), manager name, team count, due date, days remaining/overdue
- Clicking a card goes to `/projects/[id]` — the full project workspace
- "My Projects" added to `DEV_NAV` in Sidebar.tsx
- `app/dev/projects/page.tsx` uses `computeInsights` to compute health per project

### Feature B — Team visibility in project workspace
- `TeamTab.tsx` shows all team members with role badges (ROLE_COLORS + ROLE_LABELS)
- Manager role clearly distinguished with violet badge; senior dev with blue; developer with slate
- Task stats per member (Done/In Progress/Blocked/Todo counts)
- Read-only view for non-managers (no Add Member / Remove buttons shown)

### Feature C — Per-task comment thread
- New `TaskComment` Prisma model (taskId, userId, userFullName, userRole, userInitials, body, createdAt)
- `GET/POST /api/tasks/[id]/comments` — auth required; POST verifies task exists
- `TaskCommentThread` component: full-screen modal with message bubbles (isMine = violet/right, others = slate/left), grouped messages, Enter to send
- Comment (💬) button added to every task row in `TasksTab` — visible for all roles
- `currentUserId` prop threaded: project page → ProjectHub → TasksTab → TaskCommentThread
- 9 seed comments across 4 tasks demonstrating real collaboration threads

### Feature D — Project group chat
- New `ProjectMessage` Prisma model (projectId, userId, userFullName, userRole, userInitials, body, createdAt)
- `GET/POST /api/projects/[id]/messages` — membership verified; managers always have access
- `ChatTab` component: polls every 5s, message bubbles with role badges, grouped messages, Enter to send
- "Chat" tab added between Team and AI Insights in ProjectHub
- 14 seed messages across 3 projects with realistic team conversations

### Feature E — Workload inline reassignment
- "Reassign" button appears on task rows in expanded dev card view, for overloaded/heavy workload levels
- `ReassignModal` (inline in WorkloadView.tsx): select dropdown of all other devs/senior devs, calls `PUT /api/tasks/[id]` with `{ assignedToId }`
- `allCandidates` prop added to WorkloadView; workload page passes all non-manager active users
- On success: toast + router.refresh() — capacity view updates immediately

### Feature F — Escalation contact action
- "Thread" button on escalation cards in `EscalationsSection` when `esc.task` exists
- Opens `TaskCommentThread` for that task — allows direct communication between escalation sender and responder
- Works for all roles (developer, senior_developer, manager)

### Feature G — Complete project workspace for devs/seniors
- "Escalations" tab added to ProjectHub (between Chat and AI Insights)
- `EscalationsTab` component: fetches `/api/escalations` and filters to current project; shows EscalationsSection + "New Escalation" button for dev/senior
- Proxy updated: `/projects/[id]` now accessible to all authenticated roles (was manager-only); only `/projects` (the list) remains manager-only
- Combined result: dev/senior opening a project sees: My Tasks (with comments + approve/reject if senior), Team, Chat, Escalations

## Role-Based Visibility Refactor (completed 2026-05-25)

### Tab visibility by role
```ts
// ProjectHub.tsx
const MANAGER_TABS = [
  { id: "tasks",       label: "Tasks",       icon: CheckSquare },
  { id: "forecast",    label: "Forecast",    icon: TrendingUp },
  { id: "gantt",       label: "Timeline",    icon: GanttChart },
  { id: "risks",       label: "Risks",       icon: AlertTriangle },
  { id: "team",        label: "Team",        icon: Users },
  { id: "chat",        label: "Chat",        icon: MessageSquare },
  { id: "escalations", label: "Escalations", icon: Siren },
  { id: "insights",    label: "AI Insights", icon: Brain },
  { id: "report",      label: "Report",      icon: FileText },
];

const DEV_TABS = [
  { id: "tasks",       label: "My Tasks",    icon: CheckSquare },
  { id: "team",        label: "Team",        icon: Users },
  { id: "chat",        label: "Chat",        icon: MessageSquare },
  { id: "escalations", label: "Escalations", icon: Siren },
];
```

### Task filtering — three layers
1. **API layer** (`/api/projects/[id]/tasks` GET): non-managers get `WHERE assignedToId = {userId}` — server rejects blind requests
2. **Component layer** (ProjectHub): `myTasks = isManager ? project.tasks : project.tasks.filter(t => t.assignedToId === currentUserId)`
3. **Tab layer** (TasksTab): receives `myTasks` — filtered list already applied
4. **TeamTab exception**: receives full `project.tasks` so per-member task counts remain accurate for all viewers

### Content render guards
```tsx
{currentTab === "tasks" && <TasksTab tasks={myTasks} ... />}
{isManager && currentTab === "forecast"  && <ForecastTab ... />}
{isManager && currentTab === "gantt"     && <GanttTab ... />}
{isManager && currentTab === "risks"     && <RisksTab ... />}
{isManager && currentTab === "insights"  && <InsightsTab ... />}
{isManager && currentTab === "report"    && <ReportTab ... />}
{currentTab === "team"        && <TeamTab tasks={project.tasks} ... />}  // full tasks!
{currentTab === "chat"        && <ChatTab ... />}
{currentTab === "escalations" && <EscalationsTab ... />}
```

### safeActiveTab guard
```ts
const safeActiveTab = visibleTabIds.has(activeTab) ? activeTab : TABS[0].id;
```
Prevents blank content when a dev opens a URL like `/projects/[id]?tab=forecast` — clamps to first visible tab instead.

### Health score (header)
Always computed server-side from ALL project tasks (`computeInsights(project.tasks as any, project.risks)`) regardless of role, so the score is accurate even when TasksTab is filtered.

### New Prisma models
```prisma
model TaskComment {
  id           String   @id @default(cuid())
  taskId       String
  userId       String
  userFullName String
  userRole     String
  userInitials String
  body         String
  createdAt    DateTime @default(now())
  task Task @relation(...)
  user User @relation(...)
}

model ProjectMessage {
  id           String   @id @default(cuid())
  projectId    String
  userId       String
  userFullName String
  userRole     String
  userInitials String
  body         String
  createdAt    DateTime @default(now())
  project Project @relation(...)
  user    User    @relation(...)
}
```

### Seed cleanup update (must include new models)
```ts
await prisma.taskComment.deleteMany();
await prisma.projectMessage.deleteMany();
await prisma.taskActivity.deleteMany();
// ... rest unchanged
```

## Meeting Queries & Chat Fix (completed 2026-05-25)

### Root cause — stale Prisma singleton
`lib/prisma.ts` stores the Prisma client on `globalThis`. If the server was started **before** `npx prisma generate` ran (e.g., before the `add-meeting-type` migration), the singleton holds the old client (without `participant`) for the life of the process. Hot-reload does NOT recreate it. Fix: kill the server process and restart — the new process imports the correct generated client.

### Files changed
- **`app/api/meetings/[id]/route.ts`** — added `participant` to its local `MEETING_INCLUDE` (was missing; `route.ts` in `[id]/` has its own constant separate from `meetings/route.ts`)
- **`components/tabs/ChatTab.tsx`** — split `fetchError` / `sendError` states; fetch 403 → "You are not a member of this project's chat." with `AlertCircle` icon; other errors → human-readable messages; compose textarea and send button disabled when `fetchError` is set

### Gotcha to remember
Any time a new Prisma relation is added and `npx prisma generate` is run, the dev server **must be fully killed and restarted**. `next dev` hot-reload does not re-execute `lib/prisma.ts`; the singleton on `globalThis` is frozen for the process lifetime.

## Collaboration Flows Refactor (completed 2026-05-25)

### Dev/Senior Project Listing (`/dev/projects`)
- Removed health score widget and project-wide progress bar (manager analytics)
- Card now shows: MY task count badge + status breakdown chips (done/active/blocked/todo)
- All task data scoped to `assignedToId === user.userId` — no team-wide metrics visible

### Meetings — Project-First Flow
- **Schema**: `meetingType String @default("team")` and `participantId String?` added to `Meeting`; `participatingIn Meeting[]` added to `User`
- **Migration**: `add-meeting-type`
- **API** (`POST /api/meetings`):
  - `projectId` is now required
  - `meetingType`: `"team"` | `"individual"`
  - `participantId` required for individual; validated as project member
  - Response now includes `participant { id, fullName, initials, role }`
- **CreateMeetingModal** — 4-step flow:
  1. Select Project (required; scoped to user's accessible projects)
  2. Select Type: Full Team or 1-on-1
  3. (if 1-on-1) Select participant from project members (fetches `/api/projects/[id]/members`)
  4. Title (auto-generated, editable) + optional scheduled time
- **MeetingsClient** — instant meeting CTA removed; `MeetingCard` shows type badge (Team / 1-on-1) + participant name
- **Meetings page**: projects scoped by role — manager sees all active; dev/senior sees only their member projects

### Role Enforcement Summary
| Area | Manager | Developer / Senior Dev |
|---|---|---|
| Project workspace tabs | 9 (incl. Forecast, Risks, AI Insights, Report) | 4 (My Tasks, Team, Chat, Escalations) |
| `/dev/projects` listing | N/A (redirects to `/`) | MY tasks only — no health/progress analytics |
| Meeting creation projects | All active projects | Own member projects only |
| Task visibility via API | All project tasks | Own assigned tasks only (`assignedToId`) |
