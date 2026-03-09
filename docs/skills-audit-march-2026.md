# Skills Audit — March 2026

*Comparing our OpenClaw setup against Anthropic's "Complete Guide to Building Skills for Claude" (January 2026)*

**Audit date:** March 9, 2026
**Auditor:** Howard (automated analysis)
**Scope:** 8 custom business skills, 31 lifeskills, 8 frequently-used OpenClaw built-in skills

---

## Executive Summary

Our skill library is **large and substantive** (39 custom skills + 50 built-in), but the structural compliance with Anthropic's guide is mixed. The biggest systemic issues:

1. **Lifeskills have weak descriptions** — most lack trigger phrases, hurting auto-detection
2. **No skills use `scripts/` or `assets/`** — we're missing deterministic validation entirely
3. **Empty `references/` directories** — 4 of 6 custom skills with references/ have nothing in them
4. **No error handling** in any skill
5. **AGENTS.md duplicates skill-navigator routing logic** — the LifeSkills auto-detection table should live in skill-navigator, not AGENTS.md

The good news: naming is consistently kebab-case, word counts are reasonable (nothing over 5,000), and the Anthropic-adapted business skills have strong descriptions with trigger phrases.

---

## Inventory

### Brian's Custom Business Skills (8)

| Skill | Words | Has refs/ | Has scripts/ | Has assets/ |
|-------|-------|-----------|-------------|-------------|
| customer-support | 1,798 | ✅ (empty) | ❌ | ❌ |
| finance | 1,879 | ✅ (1 file) | ❌ | ❌ |
| handoff | 610 | ❌ | ❌ | ❌ |
| legal | 1,758 | ✅ (1 file) | ❌ | ❌ |
| marketing | 1,866 | ✅ (empty) | ❌ | ❌ |
| product-management | 2,076 | ✅ (empty) | ❌ | ❌ |
| resume | 555 | ❌ | ❌ | ❌ |
| sales | 1,900 | ✅ (empty) | ❌ | ❌ |

### LifeSkills (31)

| Skill | Words | Description Quality |
|-------|-------|-------------------|
| big-purchases | 1,556 | ⚠️ No trigger phrases |
| brainstorming | 2,118 | ⚠️ No trigger phrases |
| budgeting | 1,172 | ⚠️ No trigger phrases |
| business-planning | 1,391 | ⚠️ Weak — "Use when user needs help with..." |
| client-management | 1,523 | ⚠️ No trigger phrases |
| creating-lifeskills | 1,057 | ⚠️ No trigger phrases |
| daily-shutdown | 1,166 | ⚠️ No trigger phrases |
| daily-startup | 1,615 | ⚠️ Weak — mentions start of workday |
| debt-payoff | 1,501 | ⚠️ No trigger phrases |
| decision-making | 3,256 | ⚠️ Weak — "facing important decisions" |
| design-exploration | 587 | ⚠️ No trigger phrases |
| financial-review | 1,237 | ⚠️ No trigger phrases |
| nutrition-planning | 2,241 | ⚠️ No trigger phrases |
| nvc-conversation | 1,737 | ✅ Good — "conflict, tension, difficult conversation" |
| plan-execution | 548 | ⚠️ No trigger phrases |
| portfolio-assessment | 1,500 | ⚠️ No trigger phrases |
| pricing-strategy | 1,479 | ⚠️ No trigger phrases |
| problem-solving | 971 | ⚠️ No trigger phrases |
| project-planning | 614 | ⚠️ No trigger phrases |
| retirement-planning | 1,551 | ⚠️ No trigger phrases |
| revenue-growth | 1,415 | ⚠️ No trigger phrases |
| sales-proposals | 1,650 | ⚠️ No trigger phrases |
| scheduling | 1,421 | ⚠️ No trigger phrases |
| self-connection | 1,304 | ⚠️ No trigger phrases |
| skill-navigator | 885 | ✅ Good |
| sleep-routine | 1,860 | ⚠️ No trigger phrases |
| strength-program | 2,169 | ⚠️ No trigger phrases |
| tax-mitigation | 1,284 | ⚠️ No trigger phrases |
| using-lifeskills | 1,292 | ⚠️ No trigger phrases |
| verification | 698 | ✅ Good — "about to claim something is complete" |
| weekly-review | 1,322 | ✅ Decent — "end of week, planning, review, scattered" |

### OpenClaw Built-in Skills (frequently used)

| Skill | Words | Description Quality | Has refs/ |
|-------|-------|-------------------|-----------|
| gog | 624 | ⚠️ Tool description only — no trigger phrases | ❌ |
| github | 225 | ✅ Good — specific commands listed | ❌ |
| obsidian | 306 | ⚠️ Generic — "Work with Obsidian vaults" | ❌ |
| sag | 289 | ⚠️ Tool description only | ❌ |
| 1password | 351 | ✅ Good — specific use cases listed | ✅ |
| weather | 154 | ✅ Concise and clear | ❌ |
| peekaboo | 727 | ⚠️ Tool description only | ❌ |
| summarize | 247 | ✅ Good — includes fallback use case | ❌ |

---

## Detailed Scorecard

### Scoring Criteria (1-5)

| Criterion | What it measures |
|-----------|-----------------|
| **Frontmatter** | name (kebab-case) + description (with trigger phrases, under 1024 chars) |
| **Progressive Disclosure** | SKILL.md body ≤5K words, references/ for deep content |
| **Actionability** | Specific instructions vs vague guidance |
| **Error Handling** | Addresses failure cases, edge cases |
| **Composability** | Works alongside other skills without conflict |
| **Validation** | Uses scripts/ for deterministic checks where appropriate |

### Custom Business Skills

| Skill | Frontmatter | Prog. Disclosure | Actionability | Error Handling | Composability | Validation | **Avg** |
|-------|:-----------:|:----------------:|:-------------:|:--------------:|:-------------:|:----------:|:-------:|
| customer-support | 5 | 3 | 5 | 3 | 4 | 1 | **3.5** |
| finance | 5 | 4 | 5 | 3 | 4 | 1 | **3.7** |
| handoff | 4 | 5 | 5 | 2 | 5 | 1 | **3.7** |
| legal | 5 | 4 | 5 | 3 | 4 | 1 | **3.7** |
| marketing | 5 | 3 | 5 | 2 | 4 | 1 | **3.3** |
| product-management | 5 | 3 | 5 | 2 | 4 | 1 | **3.3** |
| resume | 4 | 5 | 4 | 2 | 5 | 1 | **3.5** |
| sales | 5 | 3 | 5 | 2 | 4 | 1 | **3.3** |

**Strengths:** The Anthropic-adapted skills (customer-support, finance, legal, marketing, product-management, sales) all have excellent descriptions with clear trigger phrases. Instructions are highly specific and actionable with templates, checklists, and concrete examples. The "Practical Notes for Small Business" sections are a nice touch, contextualizing enterprise frameworks for Brian's actual business.

**Weaknesses:** Empty references/ directories in 4 skills. No scripts/ anywhere. Limited error handling — none of them address "what to do when something goes wrong." Marketing and product-management could push their extensive tables/templates into references/ to reduce SKILL.md body size.

### LifeSkills

| Skill | Frontmatter | Prog. Disclosure | Actionability | Error Handling | Composability | Validation | **Avg** |
|-------|:-----------:|:----------------:|:-------------:|:--------------:|:-------------:|:----------:|:-------:|
| business-planning | 2 | 4 | 5 | 2 | 4 | 1 | **3.0** |
| daily-startup | 2 | 4 | 5 | 3 | 5 | 1 | **3.3** |
| decision-making | 2 | 3 | 5 | 3 | 4 | 1 | **3.0** |
| nvc-conversation | 3 | 4 | 5 | 3 | 4 | 1 | **3.3** |
| skill-navigator | 4 | 5 | 4 | 2 | 5 | 1 | **3.5** |
| verification | 4 | 5 | 4 | 3 | 5 | 1 | **3.7** |
| weekly-review | 3 | 4 | 5 | 3 | 4 | 1 | **3.3** |
| *Other 24 skills* | 2 | 4 | 4 | 2 | 4 | 1 | **2.8** |

**Strengths:** The workflow structure is excellent — clear phases, time estimates, examples, and "Common Pitfalls" sections. The skill-navigator provides smart routing. Decision-making is a thorough multi-framework skill (first principles + pre-mortem + OODA). Self-connection and NVC integrate emotional awareness, which is unique and valuable.

**Weaknesses:** The #1 problem: **27 of 31 lifeskills have description fields that don't include trigger phrases.** They say things like "Use when user needs help with business goal setting" — but that's in the description, not as explicit trigger phrases. The guide says description must include WHAT it does AND WHEN to use it, with specific trigger phrases. AGENTS.md compensates with a manual routing table, but that's a workaround, not a fix. The descriptions should contain the triggers natively so the system can auto-route.

### OpenClaw Built-in Skills

| Skill | Frontmatter | Prog. Disclosure | Actionability | Error Handling | Composability | **Avg** |
|-------|:-----------:|:----------------:|:-------------:|:--------------:|:-------------:|:-------:|
| gog | 3 | 5 | 5 | 2 | 5 | **4.0** |
| github | 4 | 5 | 4 | 2 | 5 | **4.0** |
| obsidian | 3 | 5 | 4 | 2 | 5 | **3.8** |
| sag | 3 | 5 | 4 | 2 | 5 | **3.8** |
| 1password | 4 | 5 | 5 | 3 | 5 | **4.4** |
| weather | 4 | 5 | 5 | 2 | 5 | **4.2** |
| peekaboo | 3 | 5 | 4 | 2 | 5 | **3.8** |
| summarize | 4 | 5 | 4 | 2 | 5 | **4.0** |

**Assessment:** The built-in skills are *intentionally concise* — they're MCP Enhancement skills that wrap CLI tools. They follow the guide's pattern well: short description, minimal body, just enough for the LLM to know how to call the tool. Their weakness is the same as everywhere: no error handling guidance ("what to do if `gog` auth fails").

---

## Gap Analysis

### 1. Description Trigger Phrases (CRITICAL)

**27 of 31 lifeskills** lack proper trigger phrases. The guide is emphatic: *"Description field must include WHAT it does AND WHEN to use it (trigger phrases)."* This is how the system decides to load a skill.

Current pattern (bad):
```yaml
description: Use when facing important decisions, tradeoffs, unclear paths
```

Recommended pattern (good):
```yaml
description: >
  Structured decision-making framework combining First Principles, Pre-mortem,
  and OODA Loop. Use when facing important decisions, choosing between options,
  evaluating tradeoffs, or when stakes are high. Trigger phrases: "should I",
  "help me decide", "which option", "weighing options", "pros and cons",
  "can't decide", "what would you do"
```

### 2. Scripts for Deterministic Validation (HIGH)

Zero skills use `scripts/`. Candidates:

| Skill | Script Opportunity |
|-------|-------------------|
| finance | `scripts/validate-journal-entry.py` — verify debits = credits |
| finance | `scripts/reconciliation-template.py` — generate rec format |
| verification | `scripts/completion-checklist.sh` — enforce evidence checks |
| handoff | `scripts/generate-handoff.sh` — auto-populate from git state |
| weekly-review | `scripts/collect-open-loops.sh` — scan calendar/tasks/email |
| budgeting | `scripts/budget-calculator.py` — income/expense math |
| strength-program | `scripts/progression-tracker.py` — weight/rep tracking |

### 3. Empty References Directories (MEDIUM)

4 skills have `references/` but nothing in them:
- customer-support/references/ — should contain: response templates, KB article templates
- marketing/references/ — should contain: brand voice guide, content calendar template
- product-management/references/ — should contain: PRD template, OKR template
- sales/references/ — should contain: battlecard template, outreach templates

### 4. Error Handling (MEDIUM)

No skill addresses error cases. Guide recommends: *"Include error handling in skills."*

Missing patterns:
- **gog**: What to do when OAuth expires, when email send fails
- **handoff**: What if git isn't initialized, no remote set
- **finance**: What if trial balance doesn't balance
- **customer-support**: What if CRM data unavailable

### 5. AGENTS.md / Skill Overlap (LOW-MEDIUM)

AGENTS.md contains a "LifeSkills Auto-Detection" routing table:
```
- Business/planning → business-planning
- Budget → budgeting
- Schedule → scheduling
...
```

This duplicates `skill-navigator` and should live in the skill's own description field. AGENTS.md should reference the skill-navigator, not replicate its routing logic. Currently the routing table in AGENTS.md is the *actual* trigger mechanism because the lifeskill descriptions are too weak.

### 6. PERSONA Files vs Skills

Agent personas (Blake, Ellis, etc.) contain role-specific workflows:
- **Blake's code review checklist** → could be a `code-review` skill
- **Ellis's deploy workflow** → could be a `deploy-site` skill

These are currently embedded in PERSONA.md files that only one agent sees. As reusable skills, any agent could do code review or deploy.

### 7. Missing Skills for Repeated Workflows

Workflows we do regularly that aren't skills:

| Workflow | Current State | Skill Opportunity |
|----------|--------------|-------------------|
| Git commit + push | Ad-hoc in every session | `git-workflow` — conventional commits, branching, PR flow |
| Memory management | Instructions in AGENTS.md | `memory-management` — daily/long-term note patterns |
| Dashboard updates | Instructions in AGENTS.md | `dashboard-sync` — update + push flow |
| Obsidian note creation | Pattern in AGENTS.md | `obsidian-workflow` — vault structure, linking, templates |
| Agent coordination | Pattern in group chat rules | `agent-coordination` — handoff protocols, @-mention patterns |
| Architecture documentation | Pattern in TOOLS.md | `architecture-docs` — Mermaid diagrams, Obsidian sync |

---

## Top 10 Improvements (Prioritized by Impact)

### 1. 🔴 Add trigger phrases to all 27 lifeskill descriptions
**Impact:** High — directly affects whether skills auto-trigger
**Effort:** Low — 1-2 hours
**Action:** For each lifeskill, add 5-7 trigger phrases to the YAML description field. Use the pattern from AGENTS.md's auto-detection table as a starting point.

### 2. 🔴 Remove LifeSkills routing table from AGENTS.md
**Impact:** High — eliminates duplication, reduces AGENTS.md bloat
**Effort:** Low — 15 minutes (after #1 is done)
**Action:** Once descriptions have trigger phrases, remove the "LifeSkills Auto-Detection" section from AGENTS.md. Replace with a one-liner: "LifeSkills are in `~/clawd/skills/lifeskills/skills/` — they auto-trigger from descriptions."

### 3. 🟡 Add `scripts/generate-handoff.sh` to handoff skill
**Impact:** High — handoff is used every session
**Effort:** Medium — 2 hours
**Action:** Script that auto-generates HANDOFF.md from git state: current branch, recent commits, modified files, uncommitted changes. The handoff skill body becomes guidance on what to *add* beyond the auto-generated content.

### 4. 🟡 Populate empty references/ directories
**Impact:** Medium — enables progressive disclosure
**Effort:** Medium — 3-4 hours
**Action:** For customer-support, marketing, product-management, and sales: extract templates and detailed reference material from SKILL.md body into references/ files. This keeps SKILL.md lean and loads detail only when needed.

### 5. 🟡 Add error handling sections to top 5 skills
**Impact:** Medium — prevents failures during execution
**Effort:** Medium — 2-3 hours
**Action:** Add "## Troubleshooting" or "## Error Handling" sections to: handoff, finance, customer-support, gog (our local notes), and weekly-review. Cover the 3 most common failure modes per skill.

### 6. 🟡 Build `git-workflow` skill
**Impact:** Medium-high — used in every coding session
**Effort:** Medium — 2 hours
**Action:** Conventional commits, branching strategy, PR workflow, commit message format. Include `scripts/validate-commit-msg.sh`.

### 7. 🟢 Build `memory-management` skill
**Impact:** Medium — consistency across sessions
**Effort:** Low-medium — 1-2 hours
**Action:** Extract memory patterns from AGENTS.md into a proper skill. When to write to daily notes, when to update MEMORY.md, dual-write rule, cleanup patterns.

### 8. 🟢 Add validation script to finance skill
**Impact:** Medium — prevents accounting errors
**Effort:** Low — 1 hour
**Action:** `scripts/validate-journal-entry.py` — verify debits = credits, check account codes, flag common errors. Could also add `scripts/reconciliation-template.py`.

### 9. 🟢 Build `code-review` skill from Blake's PERSONA
**Impact:** Medium — makes review process reusable
**Effort:** Low-medium — 1-2 hours
**Action:** Extract Blake's review checklist (security review, content review, deliverable review) into a standalone skill any agent can use.

### 10. 🟢 Add `allowed-tools` to custom skill frontmatter
**Impact:** Low-medium — improves composability metadata
**Effort:** Low — 30 minutes
**Action:** For skills that depend on specific tools (finance → spreadsheet access, sales → web search + CRM, marketing → web search), add `allowed-tools` to frontmatter so the system knows what's needed.

---

## New Skills to Build

| Skill Name | Category | Why |
|-----------|----------|-----|
| `git-workflow` | Workflow Automation | Conventional commits, branching, PR flow — used every session |
| `memory-management` | Workflow Automation | Extract from AGENTS.md — daily notes, MEMORY.md, dual-write patterns |
| `code-review` | Workflow Automation | Extract from Blake's PERSONA — reusable review checklist |
| `dashboard-sync` | Workflow Automation | Update dashboard data.json + push — currently ad-hoc |
| `architecture-docs` | Document Creation | Mermaid diagrams in markdown, Obsidian sync workflow |
| `deploy-site` | Workflow Automation | Vercel deploy flow, DNS config, environment setup |
| `client-onboarding` | Workflow Automation | New SailorSkills client setup: Notion entry, welcome email, account config |
| `meeting-prep` | Workflow Automation | Combine calendar check + research + agenda draft — cross-cuts gog + web search |

---

## Gold Standard Skill Template

Here's what a perfectly compliant skill looks like for our setup:

```
my-skill/
├── SKILL.md
├── scripts/
│   └── validate-output.py
├── references/
│   ├── detailed-guide.md
│   └── examples.md
└── assets/
    └── template.md
```

### SKILL.md

```yaml
---
name: my-skill
description: >
  One-line summary of what this skill does. Use when [specific situation 1],
  [specific situation 2], or [specific situation 3]. Trigger phrases: "phrase 1",
  "phrase 2", "phrase 3", "phrase 4", "phrase 5". Handles [domain] workflows
  including [capability 1], [capability 2], and [capability 3].
metadata:
  author: Brian Cline
  version: 1.0.0
---

# My Skill

Brief overview — what this skill does and why it exists. 2-3 sentences max.

**Tools that help:** List relevant tools (web search, file access, specific CLIs).

---

## Core Workflow

### Step 1: [Action]

**When to use:** Specific trigger condition.

[Specific, actionable instructions. Not vague. Include the exact steps.]

### Step 2: [Action]

[Continue with concrete steps, templates, and checklists.]

---

## Templates

[Include 1-2 templates inline. Move additional templates to references/.]

---

## Error Handling

| Problem | Solution |
|---------|----------|
| [Common failure 1] | [What to do] |
| [Common failure 2] | [What to do] |
| [Common failure 3] | [What to do] |

---

## Advanced Usage

For detailed reference material, see:
- [Detailed Guide](references/detailed-guide.md) — comprehensive walkthrough
- [Examples](references/examples.md) — real-world examples

## Validation

Run `scripts/validate-output.py` before finalizing output to verify:
- [Check 1]
- [Check 2]
- [Check 3]
```

### Key Properties:
1. **Description under 1024 chars** with explicit trigger phrases
2. **SKILL.md body under 5,000 words** — details pushed to references/
3. **scripts/ for deterministic validation** — code is more reliable than instructions
4. **Error handling section** — addresses common failures
5. **Progressive disclosure** — overview in SKILL.md, depth in references/
6. **Kebab-case naming** — folder and `name` field match
7. **Actionable instructions** — specific steps, not vague guidance
8. **Templates inline** for quick use, with more in references/

---

## Summary by Category

### What's Working Well ✅
- Kebab-case naming — 100% compliance
- Word counts — all under 5,000 words
- Anthropic-adapted business skills — excellent descriptions, specific instructions
- Handoff/Resume pair — clean session continuity pattern
- LifeSkills workflow structure — clear phases, time estimates, great examples
- Skill-navigator routing — smart exploration-first approach
- Verification skill — unique and valuable "evidence before claims" pattern

### What Needs Work ⚠️
- 27/31 lifeskills missing trigger phrases in descriptions
- 0/39 custom skills use scripts/ for validation
- 4/6 references/ directories are empty
- 0 skills have error handling sections
- AGENTS.md duplicates skill-navigator routing
- Blake's review process trapped in a PERSONA file
- No testing framework for any skill

### What's Missing ❌
- `scripts/` usage anywhere
- `assets/` usage anywhere
- Error handling in any skill
- Validation scripts
- Skills for repeated workflows (git, memory, dashboard, deploys)
- Success criteria or testing plans for any skill
