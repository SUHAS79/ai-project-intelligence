# AI Project Intelligence — Product Spec

## Product Vision
A web-based project management tool for small teams that uses AI (rule-based heuristics) to surface delay risks, dependency bottlenecks, and improvement suggestions automatically — making project intelligence accessible without expensive tooling.

## Target User
Small engineering teams (3–12 people) who need more than a simple to-do list but less than a full enterprise PM suite.

## Core MVP Features

### 1. Project Management
- Create, edit, delete projects
- Fields: name, description, status (Active/On Hold/Completed/Cancelled), start date, end date
- Project list dashboard with health score per project

### 2. Task Management
- Create, edit, delete tasks within a project
- Fields: title, description, status, priority, owner, start date, end date, dependencies
- Task status: TODO | IN_PROGRESS | BLOCKED | DONE
- Priority: LOW | MEDIUM | HIGH | CRITICAL
- Quick status toggle from task list

### 3. Task Dependencies
- Tasks can depend on other tasks (must-finish-first relationships)
- Dependency chains visualized in Gantt view
- Dependency cycles are prevented at data layer

### 4. Gantt / Timeline View
- Custom SVG-based Gantt chart
- Color-coded bars by task status
- Priority-coded bar borders
- Dependency arrows (dashed SVG paths)
- Today marker line
- Week header labels

### 5. Risk Log
- Log risks per project
- Fields: title, description, probability (L/M/H), impact (L/M/H), mitigation, status
- Risk status: OPEN | MITIGATING | RESOLVED | ACCEPTED
- Severity computed from probability × impact matrix

### 6. Project Health Score
- Weighted formula: task health (40%) + risk health (30%) + momentum (30%)
- Score: 0–100 with Green (≥70) / Yellow (≥40) / Red (<40) labels
- Visible on every project card and project detail header

### 7. AI Insights Panel
- **Delay Detection**: Tasks overdue with severity bucketing (LOW/MEDIUM/HIGH/CRITICAL)
- **Critical Path**: Longest dependency chain (topological sort + DP)
- **Bottleneck Detection**: Tasks with most dependents, surfaces blocking tasks
- **Risk Flags**: High-probability/impact risks without mitigation
- **Improvement Suggestions**: Pattern-matched recommendations
- All clearly labeled as "AI Insights" (rule-based heuristics)

### 8. Weekly Status Report
- Auto-generated from live project data
- Sections: Executive Summary, Completed This Week, In Progress, At Risk, Blocked, Top Risks, AI Recommendations
- Copy-to-clipboard as Markdown

### 9. Sample Data
- 3 seeded demo projects (Mobile App Launch, Data Platform Migration, Dashboard Redesign)
- 24 tasks, 23 dependencies, 6 risks
- Mixed statuses so AI insights fire immediately on first load

## Non-Goals (MVP)
- User authentication / multi-user
- Email notifications
- Actual ML/LLM integration (planned for v2)
- Mobile app
- Calendar integrations
- Custom fields

## Technical Stack
- Next.js 16 (App Router, TypeScript)
- SQLite + Prisma ORM (Prisma v7 + better-sqlite3 adapter)
- Tailwind CSS v4
- TanStack React Query v5
- React Hook Form v7 + Zod v4
- Recharts (planned for metrics chart v2)
- Custom SVG Gantt chart
- lucide-react icons
- sonner toast notifications
