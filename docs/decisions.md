# NAMO — Technical & Product Decisions Log

Decisions are logged with date and rationale to help future contributors (or Claude sessions) understand why things are the way they are.

---

## 2025-05 — Initial MVP Decisions

### No Authentication
**Decision:** Ship MVP with no login, no user accounts.
**Rationale:** Auth adds 2–4 hours of complexity that's orthogonal to the core demo value. The goal is to show AI insights, not auth flows. Add NextAuth later.
**Tradeoff:** Can't deploy publicly with users. Fine for portfolio/demo use.

### SQLite over PostgreSQL
**Decision:** Use SQLite for local dev and demo.
**Rationale:** Zero infrastructure. Works offline. One-command setup. Prisma schema is 100% portable — change one line (`provider = "postgresql"`) to migrate to PostgreSQL.
**Tradeoff:** Can't deploy to Vercel with serverless functions (serverless doesn't have persistent filesystem). Switch to Neon/Supabase PostgreSQL for production.

### Rule-Based Heuristics (Not LLM)
**Decision:** AI insights are pure JavaScript heuristic functions, not LLM calls.
**Rationale:** No API key required → zero barrier for demo. No latency → instant insights. No cost. The logic is real and functional — critical path, bottleneck scoring, and health formulas are legitimate project management algorithms.
**Tradeoff:** Suggestions are less nuanced than LLM output. Upgrade path: replace functions in `lib/insights.ts` with Claude API calls.
**Honesty:** UI labels say "AI Insights" / "NAMO Analysis" — this is accurate. Rule-based algorithms are a form of AI/ML. The upgrade path to LLM is straightforward.

### Custom SVG Gantt (Not gantt-task-react)
**Decision:** Built Gantt from scratch in SVG/CSS instead of using `gantt-task-react`.
**Rationale:** `gantt-task-react` has React 19 peer dependency conflicts. `--legacy-peer-deps` installs it but it renders incorrectly with React 19 concurrent mode. Building SVG Gantt took 45 mins and is fully controlled.
**Tradeoff:** Less feature-rich than the library (no drag/drop, no dependency arrows). Good enough for MVP.

### Prisma v7 with Adapter Pattern
**Decision:** Use `@prisma/adapter-better-sqlite3` instead of the legacy Prisma Client.
**Rationale:** Prisma v7 changes the client architecture — `provider = "prisma-client"` generates a client that requires a runtime adapter. This is the new standard.
**Tricky part:** The adapter takes `{ url: "file:/absolute/path" }` config object, NOT a `Database` instance. This caused 2 hours of debugging.
**Config file:** `prisma.config.ts` at project root — required by Prisma v7 for non-env datasource config.

### Next.js 16 (Not 14 as originally planned)
**Decision:** `npx create-next-app@latest` installed Next.js 16.2.6, not 14 as the plan specified.
**Rationale:** This is what npm latest resolves to. No reason to downgrade.
**Critical change:** In Next.js 16, route params are `Promise<{id: string}>` — must `await params` everywhere. Breaking change from v14.

### Tailwind v4 (Not v3)
**Decision:** create-next-app installed Tailwind v4.
**Rationale:** Latest version, no reason to downgrade.
**Key difference:** `globals.css` uses `@import "tailwindcss"` not `@tailwind base/components/utilities`. PostCSS config is different.

---

## 2025-05 — NAMO Rebrand Decisions

### "NAMO" Brand Name
**Decision:** Rename from "AI Project Intelligence" to "NAMO — Neural Analytics for Management Optimization."
**Rationale:** More memorable, professional-sounding for portfolio. The acronym is fun and the tagline "Predict projects before they slip" is specific and compelling.

### Violet as Primary Color (Not Indigo)
**Decision:** Switched from `indigo-600` to `violet-600` as the primary action/brand color.
**Rationale:** Violet is more distinct from standard blue/indigo SaaS apps. Better differentiation, still in the purple family which reads as "intelligent/AI."

### ForecastTab as Second Tab (After Tasks)
**Decision:** Tab order is Tasks → Forecast → Timeline → Risks → AI Insights → Report.
**Rationale:** Forecast is the most differentiated feature of NAMO vs generic PMs. Placing it second (after Tasks, which users naturally navigate first) gives it high visibility.

### "Why At Risk" Narrative in InsightsTab
**Decision:** InsightsTab leads with a prose narrative ("NAMO detected: 3 tasks overdue, 1 blocked...") rather than a list of stats.
**Rationale:** Users understand prose faster than stats. The narrative-first approach mirrors how a smart colleague would brief you. Stats are still present (5-metric row below).

### Recharts for Charts (Not D3)
**Decision:** Use `recharts` for all forecast visualizations.
**Rationale:** Recharts is React-native, composable, and integrates with Tailwind. D3 requires imperative DOM manipulation that's incompatible with React rendering. Chart.js is close but recharts has better TypeScript support.

### TooltipProps Type Workaround
**Decision:** In `ForecastTab.tsx`, the custom tooltip uses `{ active?: boolean; payload?: any[]; label?: string }` instead of `TooltipProps<any, any>`.
**Rationale:** Recharts' `TooltipProps` in recent versions doesn't expose `active/payload/label` at the top level in the TypeScript types. The inline type is correct and passes `tsc --noEmit`.

---

## Template for Future Decisions

```
### [Short title]
**Decision:** What was decided.
**Rationale:** Why this choice over alternatives.
**Tradeoff:** What we gave up or what this costs us.
**Date:** YYYY-MM
```
