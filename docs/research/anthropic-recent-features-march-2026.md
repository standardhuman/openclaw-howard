# Anthropic Recent Features & Implementation Opportunities

**Date:** 2026-03-06
**Researcher:** Noa
**Scope:** Features released late Feb – early Mar 2026

---

## Summary of Recent Releases

### Major Releases (past ~2 weeks)

| Feature | Date | What It Is | Relevance to Us |
|---------|------|-----------|-----------------|
| **Claude Opus 4.6** | Feb 5 | New flagship model, 1M context, 14.5h task horizon | 🟢 Already using |
| **Claude Sonnet 4.6** | Feb 17 | Faster mid-tier, 72.5% OSWorld (computer use) | 🟢 Available |
| **Claude Code Security** | Feb 20 | Reasoning-based vulnerability scanning | 🟡 Relevant for Cyrus |
| **Claude Cowork (Enterprise)** | Feb 24 | Deep connectors (Drive, Gmail, DocuSign) | 🔴 Enterprise-only for now |
| **Remote Control** | Feb 25 | Control Claude Code from phone/any device | 🟢 Directly applicable |
| **Agent Teams** | Feb (CC v2.1.32+) | Multi-agent collaboration in Claude Code | 🟢 Directly applicable |
| **Auto-Memory** | Feb (CC v2.1.59+) | Automatic context saving across sessions | 🟢 Directly applicable |
| **Voice Mode** | Mar 3 | Spoken commands in Claude Code terminal | 🟡 Rolling out (5% → full) |
| **Memory Import (free tier)** | Mar 2 | Import context from other chatbots | ⚪ Consumer feature |
| **Fast Mode for Opus 4.6** | Feb (CC v2.1.36+) | Full 1M context in fast mode | 🟢 Available now |
| **Compaction improvements** | Mar (CC v2.1.70) | Images preserved in compaction, prompt cache reuse | 🟢 Auto-applied |

### Claude Code v2.1.70 (current — what we're running)

Key improvements in this release:
- Fixed API 400 errors with third-party gateways (relevant to OpenClaw proxy setup)
- Improved compaction preserves images → faster and cheaper compaction
- Reduced Remote Control polling 300× (was 1-2s, now 10min when connected)
- VS Code session management, MCP management dialog
- Skill listing no longer re-injected on resume (~600 tokens saved per resume)

---

## Implementation Opportunities

### 1. Agent Teams (HIGH PRIORITY)

**What it is:** Claude Code can now run multi-agent sessions where a "team lead" delegates subtasks to "teammate" agents. Each teammate runs in its own context, can use different tools, and reports back.

**How it maps to us:** We already run a 12-agent crew via OpenClaw with sessions_spawn and inter-session messaging. Agent Teams offers a *complementary* pattern — for tasks where a single Claude Code session needs to fan out work without going through OpenClaw's session routing.

**Implementation:**
- Enable with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- Agent definitions support `background: true` for background work
- Teammates can run in isolated git worktrees (`isolation: worktree`)
- New hook events: `TeammateIdle`, `TaskCompleted`, `SubagentStop`
- Ctrl+F to kill all background agents

**Where to use it:**
- Jacques could use Agent Teams for parallel coding tasks (one teammate writes tests, another implements, lead reviews)
- Blake could fan out QA across multiple teammates reviewing different modules
- Research tasks where I need to scan multiple sources simultaneously

**Action items:**
- [ ] Test Agent Teams with Jacques on a dev task
- [ ] Compare performance vs. OpenClaw sessions_spawn for parallelized work
- [ ] Document when to use Agent Teams vs. OpenClaw multi-session

---

### 2. Auto-Memory (HIGH PRIORITY)

**What it is:** Claude Code automatically saves useful context to memory files as it works, accessible via `/memory`. Memory has user, project, and local scope.

**How it maps to us:** We already maintain manual MEMORY.md files per agent. Auto-memory could supplement this — letting Claude Code capture patterns and decisions we might miss in manual notes.

**Implementation:**
- Already active in v2.1.59+
- Agent definitions can specify `memory` frontmatter with scope (user/project/local)
- Memory improved in multi-agent sessions (v2.1.59)
- Cache clearing improved after compaction (v2.1.50)

**Where to use it:**
- Every agent benefits. Auto-memory captures working patterns, preferences, and decisions that supplement our MEMORY.md files.
- Particularly valuable for Jacques and Blake who work on code and accumulate context about the codebase.

**Action items:**
- [ ] Audit what auto-memory is capturing across agents
- [ ] Ensure auto-memory doesn't conflict with our manual MEMORY.md workflow
- [ ] Test memory persistence across compaction events

---

### 3. Remote Control (MEDIUM PRIORITY)

**What it is:** Control a running Claude Code session from any device — phone, tablet, another computer. The session stays alive on the host machine; you just connect to it remotely.

**How it maps to us:** Brian could steer agent sessions from his phone. Remote Control essentially does what OpenClaw already does via Telegram/Signal — but for Claude Code sessions specifically, with full terminal visibility.

**Implementation:**
- `claude remote-control` subcommand available since v2.1.51
- Polling reduced to every 10 min when connected (v2.1.70) — efficient
- Sessions survive laptop close/network drop

**Where to use it:**
- Less critical for us since OpenClaw already provides mobile agent control via messaging
- Could be useful for Jacques or Brian when deep in a Claude Code coding session and needing to step away but keep the session warm
- Pairs well with Agent Teams — start agents, leave, check from phone

**Action items:**
- [ ] Brian tests Remote Control for a coding session to evaluate UX
- [ ] Compare with OpenClaw's tmux/Telegram control for similar workflows

---

### 4. Voice Mode (MEDIUM PRIORITY — when available)

**What it is:** Speak commands to Claude Code in the terminal. Toggle with `/voice`. Supports multi-language STT.

**How it maps to us:** Hands-free interaction during coding or research sessions. Currently rolling out to 5% of users.

**Implementation:**
- `/voice` to toggle on/off
- Push-to-talk or continuous listening modes
- Multi-language speech-to-text
- Fixed on Windows native binary (v2.1.70)

**Where to use it:**
- Brian during pair-programming sessions with Jacques
- Any agent session where typing is inconvenient
- OpenClaw already has TTS output via the `sag` skill; Voice Mode adds the input side

**Action items:**
- [ ] Check if we have access (look for welcome screen note)
- [ ] Test latency and accuracy for technical commands

---

### 5. Claude Code Security (MEDIUM PRIORITY)

**What it is:** Reasoning-based vulnerability scanning using Opus 4.6. Found 500+ real vulnerabilities in production open-source code.

**How it maps to us:** Cyrus (Security Engineer) could use this for SailorSkills platform code review. Also relevant for Blake's QA work.

**Implementation:**
- Available as `/security-review` command in Claude Code
- Uses Opus 4.6 for deep reasoning about code patterns
- Can scan entire codebases, not just individual files

**Where to use it:**
- SailorSkills platform security audits
- Pre-deployment security checks
- Periodic codebase security sweeps (could be a cron job)

**Action items:**
- [ ] Cyrus runs `/security-review` on SailorSkills platform repo
- [ ] Evaluate findings quality and false positive rate
- [ ] Consider scheduling periodic security scans

---

### 6. Opus 4.6 Fast Mode + 1M Context (LOW PRIORITY — already available)

**What it is:** Full 1M context window now available in Opus 4.6 fast mode (v2.1.50+). Same quality, faster output.

**How it maps to us:** We're already on Opus 4.6. Fast mode is relevant for cost/speed optimization on long-context tasks.

**Action items:**
- [ ] Confirm agents are using fast mode where appropriate
- [ ] Test quality difference on a real research task (fast vs. standard)

---

### 7. Improved Compaction (ALREADY ACTIVE)

**What it is:** Compaction now preserves images in the summarizer request and reuses prompt cache. This means cheaper and faster compaction when sessions hit context limits.

**How it maps to us:** All agents benefit automatically. Particularly important for long research sessions (me) and coding sessions (Jacques) where compaction frequency is high.

**No action needed** — this is already active in v2.1.70.

---

### 8. HTTP Hooks (MEDIUM-LOW PRIORITY)

**What it is:** Claude Code can now POST JSON to a URL on specific events (v2.1.63). Configure with `"type": "http"` in settings.

**How it maps to us:** Could connect Claude Code events to OpenClaw or external services. For example: notify a Slack channel when a Claude Code agent completes a task, or log events to a monitoring system.

**Action items:**
- [ ] Evaluate whether HTTP hooks add value over OpenClaw's existing notification system
- [ ] Potential use: trigger OpenClaw cron jobs or notifications from Claude Code events

---

## Priority Matrix

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 High | Agent Teams | Medium (config + testing) | High — parallelized agent work |
| 🔴 High | Auto-Memory audit | Low (already active) | High — better context retention |
| 🟡 Medium | Remote Control | Low (test existing feature) | Medium — mobile session control |
| 🟡 Medium | Voice Mode | Low (when available) | Medium — hands-free interaction |
| 🟡 Medium | Security Review | Low (run command) | Medium — security posture |
| 🟢 Low | Fast Mode optimization | Low | Low — marginal speed gain |
| 🟢 Low | HTTP Hooks | Medium | Low — already have notification infra |

---

## What NOT to Chase

- **Claude Cowork / Deep Connectors** — Enterprise-only. Our gog/OpenClaw setup already covers Gmail, Calendar, Drive integration. Revisit if/when this opens up to smaller teams.
- **Memory Import** — Consumer feature for chatbot switching. Not relevant to our API/CLI setup.
- **MCP in Claude Code** — We manage MCP through OpenClaw skills. Adding Claude Code MCP adds complexity without clear benefit right now.

---

## Recommended Next Steps

1. **This week:** Enable and test Agent Teams with Jacques on a real dev task
2. **This week:** Audit auto-memory across all agents — what's being captured?
3. **Next week:** Cyrus runs security review on SailorSkills repos
4. **When available:** Test Voice Mode for pair-programming workflows
5. **Ongoing:** Monitor Claude Code changelog for v2.2+ features
