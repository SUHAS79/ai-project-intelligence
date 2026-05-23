# AI Project Intelligence

> AI-powered project management for small teams — built with Next.js, Prisma, and real heuristic intelligence.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-teal)](https://prisma.io)
[![SQLite](https://img.shields.io/badge/SQLite-local-green)](https://sqlite.org)

## Features

| Feature | Description |
|---------|-------------|
| 📋 **Projects & Tasks** | Full CRUD with status, priority, owner, dates |
| 🔗 **Task Dependencies** | Define which tasks block others |
| 📅 **Gantt Timeline** | Custom SVG Gantt with dependency arrows |
| ⚠️ **Risk Register** | Log risks with probability, impact, mitigation |
| 🧠 **AI Insights** | Delay detection, critical path, bottlenecks, suggestions |
| 📊 **Health Score** | 0–100 project health with color coding |
| 📄 **Weekly Reports** | Auto-generated, copyable status reports |
| 🌱 **Demo Data** | 3 seeded projects, instantly explorable |

## Tech Stack

- **Framework**: Next.js 16 (App Router + API Routes)
- **Database**: SQLite via Prisma v7 + better-sqlite3
- **UI**: Tailwind CSS v4 + lucide-react
- **State**: TanStack React Query v5
- **Forms**: React Hook Form v7 + Zod v4
- **Notifications**: Sonner toasts

## Quick Start

```bash
# Clone the repo
git clone https://github.com/SUHAS79/ai-project-intelligence
cd ai-project-intelligence

# Install dependencies
npm install --legacy-peer-deps

# Run database migrations
npx prisma migrate dev

# Seed with demo data
npm run seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see 3 demo projects with live AI insights.

## Project Structure

```
├── app/
│   ├── api/           # All API routes (projects, tasks, risks, insights, report)
│   ├── generated/     # Prisma client (auto-generated, don't edit)
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Dashboard
├── components/
│   ├── tabs/          # TasksTab, GanttTab, RisksTab, InsightsTab, ReportTab
│   ├── ui/            # Badge, Button, Input, Modal, Select, Textarea
│   └── ...            # AppShell, Sidebar, ProjectCard, ProjectHub, Modals
├── lib/
│   ├── insights.ts    # AI heuristics engine
│   ├── prisma.ts      # Database client singleton
│   ├── report.ts      # Report generator
│   └── utils.ts       # Shared utilities + status configs
├── prisma/
│   ├── schema.prisma  # Database schema
│   └── seed.ts        # Demo data seeder
├── spec.md            # Product specification
└── todo.md            # Roadmap
```

## AI Insights (How It Works)

The AI layer uses pure rule-based heuristics — no API key required, no hallucination risk:

1. **Delay Detection** — Tasks past their end date with severity bucketing
2. **Critical Path** — Topological sort + dynamic programming on the dependency graph
3. **Bottleneck Detection** — Tasks with the most dependents (cascading risk)
4. **Risk Flags** — High-severity risks without mitigation plans
5. **Health Score** — Weighted formula: task health (40%) + risk health (30%) + momentum (30%)

These will be upgraded to LLM-powered suggestions (Claude/GPT-4) in v2 without changing the API interface.

## Upgrading to PostgreSQL

Only two changes needed:
1. In `prisma/schema.prisma`: change `provider = "sqlite"` → `provider = "postgresql"`
2. In `.env`: update `DATABASE_URL` to your PostgreSQL connection string
3. In `lib/prisma.ts` and `prisma/seed.ts`: use `@prisma/adapter-pg` instead of `better-sqlite3`

## License

MIT
