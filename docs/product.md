# NAMO — Product Document

## Vision

NAMO (Neural Analytics for Management Optimization) is a project intelligence tool that predicts slip before it happens. Unlike traditional PMs that just track status, NAMO continuously analyzes your project's dependency graph, velocity, and risk profile to surface the issues that matter — before they become blockers.

**Core promise:** You should know your project is in trouble before your standup, not after.

---

## Target Users

- **Small engineering teams** (2–12 people) running 1–5 concurrent projects
- **Solo developers** tracking personal or freelance projects
- **Product managers** who need automated status reporting without spreadsheet maintenance
- **Portfolio context:** Demonstrates full-stack AI product thinking for engineering roles

---

## Key Value Propositions

1. **Proactive alerts** — NAMO flags overdue tasks, blocked critical paths, and high-severity risks before you go look for them
2. **AI-generated narrative** — Plain-language "why is this project at risk" summaries, not just raw data
3. **Forecast, not just status** — Velocity-based completion predictions with confidence ratings
4. **One-click reports** — Structured weekly status report ready to copy into Slack or email
5. **Zero setup** — No API keys, no cloud, no accounts. SQLite + local server = instant demo

---

## User Flows

### Flow 1: Create a project
1. Click "+ New Project" on dashboard
2. Enter name, description, start/end dates, status
3. Redirected to project hub → Tasks tab
4. Add tasks with titles, owners, priorities, dependencies, and dates

### Flow 2: Daily standup prep
1. Open project → AI Insights tab
2. Read "Project Outlook" card — immediate understanding of health
3. Check "Urgent Actions Required" — CRITICAL/HIGH items only
4. Check "Overdue Tasks" list — who's behind and by how much
5. Check "Critical Dependency Chain" — which tasks will cascade if delayed

### Flow 3: Weekly report
1. Open project → Report tab
2. Report auto-generates from live data
3. Review Executive Summary, completed tasks, in-progress, risks
4. Click "Copy" → paste into Slack/email/Notion

### Flow 4: Forecast review
1. Open project → Forecast tab
2. Read 4 summary cards: completion date, schedule variance, velocity, remaining work
3. Read confidence banner — understand how reliable the forecast is
4. Study burndown chart — see actual vs planned vs projected trajectory
5. Check weekly velocity chart — spot slowdowns

---

## MVP Scope (Shipped)

| Feature | Status |
|---------|--------|
| Project CRUD (create, edit, delete) | ✅ |
| Task CRUD with status, priority, owner, dates | ✅ |
| Task dependencies (multi-select) | ✅ |
| Risk register with probability/impact matrix | ✅ |
| Health score (0–100, 3 tiers) | ✅ |
| AI Insights: delay detection | ✅ |
| AI Insights: critical path | ✅ |
| AI Insights: bottleneck detection | ✅ |
| AI Insights: severity-ranked suggestions | ✅ |
| Forecast: burndown chart | ✅ |
| Forecast: velocity tracking | ✅ |
| Forecast: planned vs actual | ✅ |
| Forecast: completion date prediction | ✅ |
| Gantt timeline view | ✅ |
| Weekly report generation + copy | ✅ |
| Seed data for instant demo | ✅ |

---

## Out of Scope (MVP)

- Authentication / multi-user / teams
- Comments or @mentions
- Email/Slack notifications
- File attachments
- Time tracking
- Budget tracking
- Mobile app
- LLM integration (all insights are rule-based heuristics)

---

## Future Enhancements (Roadmap)

See `docs/roadmap.md`.
