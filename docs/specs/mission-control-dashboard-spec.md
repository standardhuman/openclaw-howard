# Mission Control Dashboard — Product Spec

**Author:** Reese (PM)  
**Builder:** Marcel  
**Date:** March 3, 2026  
**Status:** Ready for build  
**URL:** dashboard.briancline.co → Mac Mini via Tailscale

---

## Overview

Rebuild the dashboard at `~/clawd/dashboard/` from a static HTML page into a proper multi-page application. One URL, one sidebar, seven pages. This replaces both the current dashboard and `team.briancline.co` (the team org chart becomes a page within the dashboard).

The dashboard is Brian's control surface for a 13-agent AI organization. It needs to be information-dense, dark-themed, and fast. No login — Tailscale gates access.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  dashboard.briancline.co (Vercel)                   │
│  vercel.json redirects → Mac Mini via Tailscale     │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  Express Backend (port 3333, Mac Mini)              │
│  ├── /api/status      → gateway RPC (status)        │
│  ├── /api/cron        → gateway RPC (cron.list)     │
│  ├── /api/agents      → data.json (agents array)    │
│  ├── /api/projects    → data-curated.json           │
│  ├── /api/tasks       → tasks.json (read/write)     │
│  ├── /api/memory      → filesystem (~/clawd/memory/)│
│  ├── /api/docs        → filesystem scan + metadata  │
│  ├── /api/costs       → data.json (organization)    │
│  ├── /api/activity    → data.json (recentActivity)  │
│  └── static files     → React SPA build             │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   OpenClaw GW    Filesystem    data.json
   (RPC calls)    (memory/,     (collected
                   docs/, git)   every 15m)
```

### Stack

- **Frontend:** React + Vite + TailwindCSS (Marcel's standard)
- **Backend:** Express on Mac Mini, port 3333
- **Data:** No database. `data.json` (auto-collected every 15m), `data-curated.json` (manually maintained), `tasks.json` (read/write), filesystem reads for memory/docs
- **Deployment:** Static build served by Express. Vercel proxies via Tailscale
- **Auth:** None needed — Tailscale restricts access to Brian's devices

### Key Constraint

The existing `collect-data.js` script runs every 15 minutes via cron and produces `data.json` with agent costs, tokens, activity, and organization data. **Don't replace this system.** The backend reads from `data.json` for cost/agent data. New API endpoints extend what's available, they don't replace the collection pipeline.

---

## Navigation & Layout

```
┌──────────────────────────────────────────────────────────────┐
│  ⚓ Mission Control                           Mar 3, 2026    │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│  📋 Tasks  │  [Active Page Content]                          │
│  📅 Calendar│                                                │
│  🚀 Projects│                                                │
│  🧠 Memory │                                                 │
│  📄 Docs   │                                                 │
│  👥 Team   │                                                 │
│  ⚙️ System │                                                 │
│            │                                                 │
│            │                                                 │
│            │                                                 │
│  ─────────│                                                  │
│  ● Online  │                                                 │
│  13 agents │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

### Sidebar

- Fixed width: 220px
- Collapsible to icon-only (60px) on mobile or user toggle
- Top: Logo/title ("⚓ Mission Control")
- Middle: Nav items with emoji + label
- Bottom: Gateway status indicator (green dot = healthy, red = down) + agent count
- Active page highlighted with accent color left border
- Route structure: `/tasks`, `/calendar`, `/projects`, `/memory`, `/docs`, `/team`, `/system`
- Default route (`/`) redirects to `/tasks`

---

## Page 1: Tasks (Kanban)

The primary working view. A Kanban board with a live activity sidebar.

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Tasks                                    [+ New Task]      │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  BACKLOG (3) │ IN PROGRESS  │ REVIEW (1)   │ DONE (5)       │
│              │ (2)          │              │                │
│ ┌──────────┐│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐   │
│ │ Fix anode││ │ Build 55  │ │ │ Claim    │ │ │ Build 54 │   │
│ │ pricing  ││ │ field test│ │ │ flow QA  │ │ │ shipped  │   │
│ │ 📐 Reese ││ │ 🤿 Jacques│ │ │ 🔍 Blake │ │ │ 2d ago   │   │
│ │ med · 3d ││ │ high · 1d │ │ │ med · 1d │ │ └──────────┘   │
│ └──────────┘│ └──────────┘ │ └──────────┘ │ ┌──────────┐   │
│ ┌──────────┐│ ┌──────────┐ │              │ │ Email    │   │
│ │ Notion   ││ │ Trust    │ │              │ │ confirm  │   │
│ │ sync fix ││ │ graph    │ │              │ │ enabled  │   │
│ │ 🪨 Howard││ │ seeding  │ │              │ │ 1d ago   │   │
│ │ low · 5d ││ │ 🎨 Marcel│ │              │ └──────────┘   │
│ └──────────┘│ │ high · 0d│ │              │                │
│              │ └──────────┘ │              │                │
└──────────────┴──────────────┴──────────────┴────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Recent Activity                                            │
│  🤿 Jacques: Committed Build 55 fixes — 2m ago              │
│  📐 Reese: Writing Mission Control spec — 15m ago           │
│  🪨 Howard: Dawn Patrol delivered — 4h ago                  │
│  🔭 Noa: Daily research brief filed — 6h ago               │
└─────────────────────────────────────────────────────────────┘
```

### Task Card Fields

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  assignee?: string;          // agent ID
  priority: 'low' | 'medium' | 'high' | 'critical';
  created: string;            // ISO timestamp
  completed?: string;         // ISO timestamp
  project?: string;           // project name
  tags?: string[];
}
```

### Interactions

- Drag-and-drop cards between columns
- Click card → expand with full description, edit fields
- "+ New Task" button → modal with title, description, assignee dropdown (13 agents), priority, project
- Cards persist to `tasks.json` via `PUT /api/tasks`

### Activity Feed

- Below the Kanban board (not a sidebar — keeps the board wide)
- Shows last 20 agent actions from `data.json.recentActivity`
- Each entry: agent emoji + name + action summary + relative time
- Auto-refreshes every 60 seconds

### Data Source

| Field | Source |
|-------|--------|
| Tasks | `tasks.json` (read/write via `/api/tasks`) |
| Activity feed | `data.json` → `recentActivity` (collected every 15m) |
| Agent list (for assignee) | `data.json` → `agents` |

### API

```
GET  /api/tasks          → { tasks: Task[] }
PUT  /api/tasks          → accepts { tasks: Task[] }, writes to tasks.json
GET  /api/activity       → { activity: ActivityItem[] }
```

---

## Page 2: Calendar (Cron Visualization)

Weekly grid showing all scheduled cron jobs. The visual answer to "when do my agents do things?"

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Calendar                              Week of Mar 3, 2026  │
│  [◀ Prev]  [Today]  [Next ▶]          [Week | Month]       │
├────────┬────────┬────────┬────────┬────────┬────────┬──────┤
│  Mon   │  Tue   │  Wed   │  Thu   │  Fri   │  Sat   │ Sun  │
├────────┼────────┼────────┼────────┼────────┼────────┼──────┤
│ 00:00  │ 00:00  │ 00:00  │ 00:00  │ 00:00  │ 00:00  │00:00 │
│ ░░░░░░ │ ░░░░░░ │ ░░░░░░ │ ░░░░░░ │ ░░░░░░ │ ░░░░░░ │░░░░░│
│ Noa 🔍 │ Noa 🔍 │ Noa 🔍 │ Noa 🔍 │ Noa 🔍 │ Noa 🔍 │Noa  │
│ Mem ⟳  │ Mem ⟳  │ Mem ⟳  │ Mem ⟳  │ Mem ⟳  │ Mem ⟳  │Mem ⟳│
│ Voice🎙│ Voice🎙│ Voice🎙│ Voice🎙│ Voice🎙│ Voice🎙│     │
│        │        │        │        │        │        │      │
│ 06:00  │ 06:00  │ 06:00  │ 06:00  │ 06:00  │ 06:00  │06:00 │
│ Dawn🌅 │ Dawn🌅 │ Dawn🌅 │ Dawn🌅 │ Dawn🌅 │ Dawn🌅 │Dawn │
│        │        │        │        │        │        │      │
│ 07:00  │ 07:00  │ 07:00  │ 07:00  │ 07:00  │ 07:00  │07:00 │
│ Note📓 │ Note📓 │ Note📓 │ Note📓 │ Note📓 │ Note📓 │Note │
│        │        │        │        │        │        │      │
│ 10:00  │ 10:00  │ 10:00  │ 10:00  │ 10:00  │ 10:00  │      │
│ Pulse📡│ Pulse📡│ Pulse📡│ Pulse📡│ Pulse📡│ Pulse📡│      │
│  ...   │  ...   │  ...   │  ...   │  ...   │  ...   │      │
│ 18:30  │ 18:30  │ 18:30  │ 18:30  │ 18:30  │ 18:30  │      │
│ Debrf🌅│ Debrf🌅│ Debrf🌅│ Debrf🌅│ Debrf🌅│ Debrf🌅│PPV📊│
└────────┴────────┴────────┴────────┴────────┴────────┴──────┘

Legend: ■ Briefing  ■ Research  ■ Memory  ■ Maintenance  ■ Data
```

### Cron Job Display

```typescript
interface CronJobDisplay {
  id: string;
  name: string;
  agentId: string;
  enabled: boolean;
  schedule: {
    kind: 'cron' | 'every' | 'at';
    expr?: string;          // cron expression
    tz?: string;            // timezone
    everyMs?: number;       // interval jobs
  };
  category: 'briefing' | 'research' | 'memory' | 'maintenance' | 'data';
  lastRun?: {
    status: 'ok' | 'error';
    durationMs: number;
    at: number;             // timestamp
  };
  nextRun: number;          // timestamp
}
```

### Category Colors

| Category | Color | Examples |
|----------|-------|----------|
| Briefing | `#00bcd4` (cyan) | Dawn Patrol, Evening Debrief, Notebook Prompt |
| Research | `#9d4edd` (purple) | Noa Research Brief |
| Memory | `#06d6a0` (green) | Memory Sync, Voice Memo, Afternoon Checkpoint |
| Maintenance | `#ffd166` (amber) | Dashboard Collection, Backups |
| Data | `#ff6b6b` (coral) | Dashboard Hourly Update |

Category is derived from job name keywords on the backend:
- Name contains "dawn" or "debrief" or "notebook" or "pulse" or "staging" → briefing
- Name contains "research" or "noa" → research
- Name contains "memory" or "sync" or "voice" or "checkpoint" or "capture" → memory
- Name contains "dashboard" or "backup" or "collection" → maintenance
- Default → data

### Interactions

- Hover on a job block → tooltip with name, agent, last run status, duration, next run time
- Click → expanded detail card showing full job config and recent run history
- "every" interval jobs (like Dashboard Collection @ 15m) show as a thin repeated stripe
- Gaps in coverage visually obvious (empty white space between jobs)
- Week/Month toggle (month view shows density heatmap, not individual jobs)

### Data Source

| Field | Source |
|-------|--------|
| Cron jobs | OpenClaw gateway RPC `cron.list` via `/api/cron` |
| Run history | `cron.list` response includes `state.lastRunAtMs`, `lastStatus`, `lastDurationMs` |
| Schedule parsing | Backend converts cron expressions to day/time slots |

### API

```
GET /api/cron → { jobs: CronJobDisplay[] }
```

The backend calls `openclaw gateway call cron.list --json`, parses the result, categorizes jobs, and computes next-run times for the requested week.

---

## Page 3: Projects

Cards for each active project with progress tracking and linked docs.

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Projects                               [Active | All]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │ 🚀 SailorSkills Pro     │  │ 🌊 Marketplace           │   │
│  │ ████████████████░░ 92%  │  │ ████████████░░░░░░ 65%  │   │
│  │                         │  │                         │   │
│  │ Lead: Jacques            │  │ Lead: Marcel             │   │
│  │ Status: ● Launched       │  │ Status: ● In Progress    │   │
│  │ Build: 55 (TestFlight)  │  │ Demo: Mar 5              │   │
│  │                         │  │                         │   │
│  │ Recent:                 │  │ Recent:                  │   │
│  │ · Build 55 submitted    │  │ · Claim flow shipped     │   │
│  │ · 3 bug fixes merged    │  │ · Email confirm enabled  │   │
│  │                         │  │                         │   │
│  │ 📄 MVP Tracker          │  │ 📄 HANDOFF               │   │
│  │ 📄 Sprint Docs          │  │ 📄 Trust Graph Design    │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │ 📊 Mission Control      │  │ 🎬 BOATY Pipeline        │   │
│  │ ██░░░░░░░░░░░░░░ 10%   │  │ ██████░░░░░░░░░░ 35%    │   │
│  │ Lead: Marcel             │  │ Lead: Marcel             │   │
│  │ Status: ● Planning       │  │ Status: ○ Paused         │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Project Data

```typescript
interface Project {
  name: string;
  icon: string;
  status: 'active' | 'in-progress' | 'planning' | 'paused' | 'completed';
  progress: number;           // 0-100
  lead: string;               // agent name
  metric?: string;            // key metric ("Build 55", "Demo Mar 5")
  nextAction?: string;
  recentActivity: string[];   // last 3-5 items
  docs: { label: string; url: string }[];
  checklist?: { text: string; done: boolean }[];
}
```

### Interactions

- Click card → expanded view with full checklist, all recent activity, all docs
- Status badge is color-coded: green (active/completed), blue (in-progress), amber (planning), gray (paused)
- Active/All toggle filters by status

### Data Source

| Field | Source |
|-------|--------|
| Project data | `data-curated.json` → `projects` array (manually maintained by Howard) |

### API

```
GET /api/projects → { projects: Project[] }
```

---

## Page 4: Memory (Journal Browser)

Daily journal browser with long-term memory viewer and staleness indicators.

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Memory                          [Daily | Long-term | All]  │
├────────────────┬────────────────────────────────────────────┤
│  Dates         │  2026-03-02                                │
│                │                                            │
│  ● Mar 3       │  ## Howard's Daily Notes                   │
│  ● Mar 2       │                                            │
│  ● Mar 1       │  ### Key Decisions                         │
│  ○ Feb 28      │  - Mission Control spec assigned to Reese  │
│  ○ Feb 27      │  - Added midday cron jobs                  │
│  ○ Feb 26      │  - Reverse prompting in Dawn Patrol        │
│  ○ Feb 25      │  ...                                       │
│  ○ Feb 24      │                                            │
│  ○ Feb 23      │  ---                                       │
│  ...           │                                            │
│                │  ## Reese's Daily Notes                    │
│  ─────────     │                                            │
│  Agent filter: │  ### Build 55 Fixes                        │
│  [All ▼]       │  - Boat type: DB overrides extraction      │
│                │  - Propeller case mismatch fixed            │
│                │  - Follow-up prompt strengthened            │
│                │  ...                                       │
│                │                                            │
│  Freshness:    │  ─── Staleness: MEMORY.md ────             │
│  🟢 Today (3)  │  Last updated: 2h ago                      │
│  🟡 This week  │  ⚠ "Risk Register" section → 5 days stale │
│  🔴 Stale (2)  │                                            │
└────────────────┴────────────────────────────────────────────┘
```

### Memory Data Model

```typescript
interface DailyNote {
  date: string;              // YYYY-MM-DD
  agent: string;             // agent ID or "all"
  filename: string;          // full path
  content: string;           // markdown content
  lastModified: string;      // ISO timestamp
  wordCount: number;
}

interface MemoryFile {
  path: string;              // relative to agent workspace
  agent: string;
  lastModified: string;
  size: number;
  staleWarning?: string;     // set if >3 days old for active content
}
```

### Interactions

- Click date in left sidebar → loads all daily notes for that date (across agents)
- Agent filter dropdown → show only one agent's notes
- Long-term tab → renders each agent's MEMORY.md with staleness highlights
- Staleness indicator: green dot (updated today), yellow (this week), red (>7 days, should be current)
- Content rendered as markdown (use `react-markdown` or similar)

### Data Source

| Field | Source |
|-------|--------|
| Daily notes | Filesystem: `~/clawd/memory/YYYY-MM-DD*.md` + `~/clawd-{agent}/memory/YYYY-MM-DD*.md` |
| Long-term memory | `~/clawd/MEMORY.md` + `~/clawd-{agent}/MEMORY.md` |
| File metadata | `fs.stat()` for last modified times |

### Directories to Scan

```
~/clawd/memory/              (Howard)
~/clawd-jacques/memory/      (Jacques)
~/clawd-marcel/memory/       (Marcel)
~/clawd-reese/memory/        (Reese)
~/clawd-noa/memory/          (Noa)
~/clawd-kai/memory/          (Kai)
~/clawd-blake/memory/        (Blake)
~/clawd-quinn/memory/        (Quinn)
~/clawd-sage/memory/         (Sage)
~/clawd-milo/memory/         (Milo)
~/clawd-avery/memory/        (Avery)
~/clawd-cyrus/memory/        (Cyrus)
~/clawd-rio/memory/          (Rio)
```

### API

```
GET /api/memory/dates                  → { dates: string[] }  (available dates, newest first)
GET /api/memory/daily?date=YYYY-MM-DD  → { notes: DailyNote[] }
GET /api/memory/daily?date=YYYY-MM-DD&agent=reese → filtered
GET /api/memory/longterm               → { files: MemoryFile[] }
GET /api/memory/longterm/:agent        → { content: string, lastModified: string }
GET /api/memory/staleness              → { stale: { agent: string, file: string, daysSinceUpdate: number }[] }
```

---

## Page 5: Docs (Searchable Index)

Searchable index of docs across `~/clawd/docs/` and Obsidian vault.

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Docs                                                       │
│  🔍 [Search docs...                                    ]    │
│                                                             │
│  Filters: [All ▼]  [Plans | Specs | Research | Cases]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📁 Plans (8)                                               │
│  ├─ mission-control-upgrade.md          Mar 2 · 7.2KB      │
│  ├─ 2026-07-trust-graph-design.md       Feb 25 · 4.1KB     │
│  ├─ configurable-pricing-spec.md        Feb 28 · 3.8KB     │
│  └─ ...                                                    │
│                                                             │
│  📁 Specs (5)                                               │
│  ├─ mission-control-dashboard-spec.md   Mar 3 · 18KB       │
│  ├─ save-and-charge-flow.md             Feb 27 · 5.2KB     │
│  ├─ GoPro-Connection-Flow-Spec.md       Feb 25 · 6.1KB     │
│  └─ ...                                                    │
│                                                             │
│  📁 Research (4)                                            │
│  ├─ mission-control-analysis.md         Mar 2 · 12KB       │
│  └─ ...                                                    │
│                                                             │
│  📁 Obsidian (12)                                           │
│  ├─ Organization/Agent Reference        Feb 20 · 3.1KB     │
│  └─ ...                                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Doc Entry

```typescript
interface DocEntry {
  path: string;              // relative path
  name: string;              // filename without extension
  category: 'plans' | 'specs' | 'research' | 'cases' | 'bugs' | 'obsidian' | 'other';
  source: 'clawd' | 'obsidian';
  lastModified: string;
  size: number;
  preview?: string;          // first 200 chars
}
```

### Interactions

- Search filters by filename and content preview (client-side for speed, docs list is <100 items)
- Category tabs filter by `category`
- Click doc → full markdown render in a content pane (right side or modal)
- Obsidian docs link to `obsidian://` URI for opening in the app

### Data Source

| Field | Source |
|-------|--------|
| Clawd docs | Filesystem: `~/clawd/docs/**/*.md` (recursive scan) |
| Obsidian docs | Filesystem: `~/Obsidian/Brian's Vault/**/*.md` |

### Category Mapping

Derive from directory structure:
- `~/clawd/docs/plans/` → plans
- `~/clawd/docs/specs/` → specs
- `~/clawd/docs/research/` → research
- `~/clawd/docs/cases/` → cases
- `~/clawd/docs/bugs/` → bugs
- `~/Obsidian/Brian's Vault/` → obsidian
- Everything else → other

### API

```
GET /api/docs                → { docs: DocEntry[] }
GET /api/docs/content?path=  → { content: string }  (reads and returns markdown)
```

**Security:** Only serve files under `~/clawd/docs/` and `~/Obsidian/Brian's Vault/`. Validate path doesn't escape these roots (no `../` traversal).

---

## Page 6: Team (Org Chart)

The crew page — replaces `team.briancline.co`. Shows all 13 agents with roles, status, costs, and current work.

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Team                                    [Grid | Org Chart] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CORE TEAM                                                  │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│  │ 🪨 Howard      │ │ 🤿 Jacques     │ │ 🎨 Marcel      │   │
│  │ Chief of Staff │ │ Dev Partner    │ │ Creative Dir   │   │
│  │ ● Active       │ │ ○ Standby     │ │ ○ Standby      │   │
│  │ Helm           │ │ Deck          │ │ Workshop       │   │
│  │                │ │               │ │                │   │
│  │ Cost: $387     │ │ Cost: $274    │ │ Cost: $412     │   │
│  │ Tasks: 31      │ │ Tasks: 18     │ │ Tasks: 24      │   │
│  │ Last: 2m ago   │ │ Last: 1h ago  │ │ Last: 3h ago   │   │
│  │                │ │               │ │                │   │
│  │ Doing: Dawn    │ │ Doing: Build  │ │ Doing: Trust   │   │
│  │ Patrol brief   │ │ 55 bug fixes  │ │ graph seeding  │   │
│  └────────────────┘ └────────────────┘ └────────────────┘   │
│                                                             │
│  SCHEDULED CREW                                             │
│  ┌────────────────┐ ┌────────────────┐                      │
│  │ 🔭 Noa         │ │ 🗺️ Kai         │                      │
│  │ Research       │ │ Strategist    │                      │
│  │ ○ Standby     │ │ ○ Standby     │                      │
│  │ Crow's Nest   │ │ Chart Room    │                      │
│  └────────────────┘ └────────────────┘                      │
│                                                             │
│  ON-DEMAND CREW                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │📐 Reese│ │🔍 Blake│ │📋 Quinn│ │🤝 Sage │ │📣 Milo │   │
│  │PM      │ │QA      │ │Ops     │ │Sales   │ │Mktg    │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
│  ┌────────┐ ┌────────┐ ┌────────┐                          │
│  │⚖️ Avery│ │🛡️ Cyrus│ │🌊 Rio  │                          │
│  │Legal   │ │Security│ │Wellbeing│                         │
│  └────────┘ └────────┘ └────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Agent Card Data

```typescript
interface AgentCard {
  agentId: string;
  name: string;
  emoji: string;
  role: string;
  team: 'Core Team' | 'Scheduled Crew' | 'On-Demand';
  station: string;            // nautical station name
  status: 'active' | 'standby';
  costThisMonth: number;
  totalTokens: number;
  tasksCompleted: number;
  lastActive: string;         // relative time
  lastActiveTs: number;       // timestamp for sorting
  currentTask: string;
  avatar?: string;            // path to avatar image
}
```

### Agent Details (source of truth: IDENTITY.md files)

| Agent | ID | Role | Team | Station | Emoji |
|-------|-----|------|------|---------|-------|
| Howard | main | Chief of Staff | Core | Helm | 🪨 |
| Jacques | jacques | Dev Partner | Core | Deck | 🤿 |
| Marcel | marcel | Creative Director | Core | Workshop | 🎨 |
| Noa | noa | Research Analyst | Scheduled | Crow's Nest | 🔭 |
| Kai | kai | Strategist | Scheduled | Chart Room | 🗺️ |
| Blake | blake | QA Specialist | On-Demand | Engine Room | 🔍 |
| Quinn | quinn | Ops & Finance | On-Demand | Supply Hold | 📋 |
| Sage | sage | Sales | On-Demand | Gangway | 🤝 |
| Milo | milo | Marketing | On-Demand | Main Deck | 📣 |
| Reese | reese | Product Manager | On-Demand | Drafting Table | 📐 |
| Avery | avery | Legal | On-Demand | Captain's Quarters | ⚖️ |
| Cyrus | cyrus | Security | On-Demand | Stern | 🛡️ |
| Rio | rio | Wellbeing Coach | On-Demand | Crow's Nest | 🌊 |

### View Modes

**Grid view** (default): Cards in a responsive grid, grouped by team tier. Core team gets full-size cards with all metrics. Scheduled and On-Demand get compact cards.

**Org chart view**: Tree layout with Brian at top, Howard below, then branching to Jacques/Marcel/Noa/Kai (direct reports with regular sessions), then the on-demand crew below their functional leads. Visual hierarchy, not management hierarchy — it shows information flow.

```
                        Brian (Founder)
                             │
                      Howard (Chief of Staff)
                   ┌────────┼────────────┐
              Jacques    Marcel         Noa/Kai
            (Dev)      (Creative)    (Research/Strategy)
               │          │
         Blake (QA)    Milo (Mktg)
                          │
                    ┌──────┼──────┐
               Reese    Quinn    Sage
              (PM)     (Ops)   (Sales)
                                  │
                          ┌───────┼───────┐
                       Avery   Cyrus    Rio
                      (Legal) (Security)(Wellbeing)
```

### Interactions

- Click agent card → expanded view with full identity info, recent session history, cost breakdown
- Grid/Org Chart toggle
- Agent status updates in real-time from `data.json` (re-fetched every 60s)

### Data Source

| Field | Source |
|-------|--------|
| Agent data | `data.json` → `agents` array (updated every 15m by collect-data.js) |
| Identity info | Hardcoded in backend from IDENTITY.md files (rarely changes) |
| Avatars | `~/clawd/dashboard/avatars/{name}-robot-v2.png` |

### API

```
GET /api/agents → { agents: AgentCard[] }
```

---

## Page 7: System (Health & Costs)

Gateway health, model configuration, cron status, and cost tracking.

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  System                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GATEWAY STATUS                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ● Online — Brians-Mac-mini.local                      │ │
│  │ Uptime: 3d 14h · Version: 2026.1.29                   │ │
│  │ Channels: Telegram ✓  Slack ✓  Webchat ✓              │ │
│  │ Active sessions: 4 · Agents: 13 configured            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  MONTHLY COSTS                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ Actual: $349/mo      │  │ API Equivalent: $1,847│        │
│  │ ████████░░░░ 70%     │  │ Savings: $1,498/mo   │        │
│  │ Target: $500          │  │ via Anthropic Max 20X│        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                             │
│  COST BY AGENT                            COST BY MODEL    │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ Marcel    $412  ███  │  │ Opus 4.6   $847 ████ │        │
│  │ Howard    $387  ███  │  │ DeepSeek   $12  █    │        │
│  │ Jacques   $274  ██   │  │ Kimi       $0   ·    │        │
│  │ Others    $0    ·    │  │ Gemini     $0   ·    │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                             │
│  INFRASTRUCTURE                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Anthropic Max 20X  $200  │ Vercel Pro     $20         │ │
│  │ Supabase           $25   │ Domains        $41         │ │
│  │ Stripe             $32   │ Resend         $18         │ │
│  │ 1Password          $8    │ Brave Search   $5          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  CRON HEALTH                                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 17 jobs configured · 17 enabled · 0 errored           │ │
│  │                                                        │ │
│  │ Dashboard Collection    ● ok   15m ago   every 15m     │ │
│  │ Dawn Patrol             ● ok   4h ago    06:00 daily   │ │
│  │ Evening Debrief         ● ok   12h ago   18:30 daily   │ │
│  │ Noa Research            ● ok   7h ago    00:00 daily   │ │
│  │ ...                                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Sources

| Section | Source |
|---------|--------|
| Gateway status | RPC: `openclaw gateway call status --json` + `system-presence` |
| Monthly costs | `data.json` → `organization.monthlyCosts` |
| Cost by agent | `data.json` → `organization.costsByAgent` |
| Cost by model | `data.json` → `organization.costsByModel` |
| Infrastructure | `data.json` → `organization.infrastructure` (static from collect-data.js) |
| Cron health | RPC: `openclaw gateway call cron.list --json` |

### API

```
GET /api/system/status  → gateway RPC status + system-presence
GET /api/system/costs   → cost data from data.json
GET /api/cron           → (shared with Calendar page)
```

---

## Component Hierarchy

```
<App>
  <Router>
    <Layout>
      <Sidebar>
        <NavItem />      × 7 pages
        <StatusBadge />  (gateway health)
      </Sidebar>
      <MainContent>
        <TasksPage>
          <KanbanBoard>
            <KanbanColumn>
              <TaskCard />
            </KanbanColumn>
          </KanbanBoard>
          <ActivityFeed />
        </TasksPage>
        
        <CalendarPage>
          <WeekNavigator />
          <WeekGrid>
            <DayColumn>
              <CronJobBlock />
            </DayColumn>
          </WeekGrid>
          <Legend />
        </CalendarPage>
        
        <ProjectsPage>
          <ProjectCard />
        </ProjectsPage>
        
        <MemoryPage>
          <DateSidebar />
          <NoteViewer />     (renders markdown)
          <StalenessPanel />
        </MemoryPage>
        
        <DocsPage>
          <SearchBar />
          <CategoryFilter />
          <DocList>
            <DocEntry />
          </DocList>
          <DocViewer />      (renders markdown)
        </DocsPage>
        
        <TeamPage>
          <ViewToggle />     (grid | org chart)
          <TeamGrid>
            <AgentCard />
          </TeamGrid>
          <OrgChart />       (tree visualization)
        </TeamPage>
        
        <SystemPage>
          <GatewayStatus />
          <CostOverview />
          <CostByAgent />
          <CostByModel />
          <InfrastructureList />
          <CronHealthTable />
        </SystemPage>
      </MainContent>
    </Layout>
  </Router>
</App>
```

---

## Backend API Summary

All endpoints return JSON. No authentication (Tailscale-gated).

| Method | Path | Description | Source |
|--------|------|-------------|--------|
| GET | `/api/status` | Gateway health | RPC `status` + `system-presence` |
| GET | `/api/agents` | All 13 agents with status/costs | `data.json` |
| GET | `/api/cron` | Cron jobs with schedule + health | RPC `cron.list` |
| GET | `/api/projects` | Project cards | `data-curated.json` |
| GET | `/api/tasks` | Task list (Kanban) | `tasks.json` |
| PUT | `/api/tasks` | Update task list | Writes `tasks.json` |
| GET | `/api/activity` | Recent agent actions | `data.json` |
| GET | `/api/memory/dates` | Available daily note dates | Filesystem scan |
| GET | `/api/memory/daily` | Daily notes for a date | Filesystem read |
| GET | `/api/memory/longterm` | MEMORY.md files list | Filesystem scan |
| GET | `/api/memory/longterm/:agent` | Specific agent's MEMORY.md | Filesystem read |
| GET | `/api/memory/staleness` | Stale memory files | Filesystem stat |
| GET | `/api/docs` | Doc index | Filesystem scan |
| GET | `/api/docs/content` | Single doc content | Filesystem read |
| GET | `/api/system/status` | Full system status | RPC + data.json |
| GET | `/api/system/costs` | Cost breakdown | `data.json` |

### Backend Implementation Notes

- **RPC calls:** Shell out to `openclaw gateway call <method> --json` and parse stdout. Cache results for 60 seconds (cron data doesn't change frequently).
- **Filesystem scans:** Scan once on startup, then re-scan every 5 minutes. Cache the results.
- **Path security:** Whitelist allowed directories. Reject any path with `..` or that resolves outside allowed roots.
- **CORS:** Not needed (same origin, served by the same Express server).

---

## Design System

### Colors

```css
:root {
  --bg-primary: #0a0a1a;        /* page background */
  --bg-card: #12122a;           /* card background */
  --bg-sidebar: #0d0d20;        /* sidebar background */
  --bg-hover: #1a1a3a;          /* hover state */
  --border: #2a2a4a;            /* card/divider borders */
  --text-primary: #e0e0ff;      /* main text */
  --text-secondary: #a0a0c0;    /* secondary/muted text */
  --accent: #00bcd4;            /* primary accent (cyan) */
  --accent-hover: #00a5bb;      /* accent hover */
  --success: #06d6a0;           /* green - active/healthy */
  --warning: #ffd166;           /* amber - attention */
  --danger: #ff6b6b;            /* red - error/critical */
  --purple: #9d4edd;            /* research/special */
}
```

### Typography

- Font: `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
- Page title: 24px, 600 weight
- Card title: 16px, 600 weight
- Body: 14px, 400 weight
- Small/meta: 12px, 400 weight, `--text-secondary`

### Card Style

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  transition: border-color 0.2s;
}
.card:hover {
  border-color: var(--accent);
}
```

### Status Indicators

- `●` Green dot: active/healthy/online
- `○` Gray dot: standby/idle
- `◉` Red dot: error/down
- Use `--success`, `--text-secondary`, `--danger` respectively

---

## Build Order

Marcel should build in this order (each is independently demoable):

1. **Layout + Sidebar + Router** — the shell. Static nav, all 7 routes stubbed with page titles. This is the foundation everything builds on.

2. **Team page** — highest value early because it replaces `team.briancline.co`. Grid view with agent cards reading from `/api/agents`. Data already exists in `data.json`.

3. **System page** — second-highest existing data coverage. Cost cards, cron health table. Mostly rendering what `collect-data.js` already computes.

4. **Tasks page** — Kanban board with drag-and-drop. Extend existing `tasks.json` with proper status/priority fields. Activity feed from `/api/activity`.

5. **Calendar page** — Cron visualization. Parse cron expressions into weekly grid slots. This is the most novel page — no existing equivalent.

6. **Projects page** — Straightforward card grid from `data-curated.json`. Low complexity.

7. **Memory page** — Filesystem reads across 13 agent workspaces. Journal browser with markdown rendering. Most complex backend work (scanning many directories).

8. **Docs page** — Search + browse. Last because it overlaps with Obsidian (which Brian might prefer for doc reading anyway). But having it in the dashboard closes the loop.

---

## Migration Notes

- Current `server.js` stays as the Express server — extend it, don't replace it
- `collect-data.js` cron keeps running — the new backend reads its output
- `data-curated.json` stays as the manual data source for projects/needsAttention
- `tasks.json` format needs a schema upgrade (add `status`, `priority`, `assignee` fields) — migrate existing tasks on first run
- `vercel.json` redirect stays the same — Vercel → Mac Mini via Tailscale
- Current `index.html`, `mission-control.html`, `unified.html` etc. can be archived once the React app is live
- Robot avatars at `~/clawd/dashboard/avatars/` should be served as static assets

---

## What This Spec Doesn't Cover (Intentional)

- **Council (multi-model deliberation)** — Phase 2.5 per the plan. Build the skill first, then add a UI for it.
- **Radar (research feed)** — Noa's research can live in the Memory page for now.
- **Approvals queue** — No approval workflow exists yet. Add when there's something to approve.
- **Pixel art office** — Skip. (Per Noa's analysis: pure novelty, doesn't add function.)
- **Real-time WebSocket streaming** — Polling every 60s is sufficient. WebSocket streaming is an optimization for later if the polling feels sluggish.
- **Authentication** — Tailscale gates all access. If Brian needs to share the dashboard with someone outside his tailnet, add basic auth then.
- **Mobile responsive layout** — Sidebar collapses to icon-only on screens <768px. Full mobile responsiveness is nice-to-have but not required for v1 (Brian uses this on desktop).

---

## Success Criteria

1. Brian can open `dashboard.briancline.co` and see all 7 pages with real data
2. `team.briancline.co` redirect can be pointed to `dashboard.briancline.co/team`
3. Kanban board persists task state across page loads
4. Calendar shows all 17 cron jobs in their correct time slots
5. Memory browser loads daily notes from all 13 agent workspaces
6. System page shows accurate cost data matching what `collect-data.js` computes
7. Page load under 2 seconds on Tailscale connection
8. Dark theme matches the visual language of the existing `mission-control.html` (which Brian already approved the look of)
