# MEMORY.md - Long-Term Memory

*Curated memories and learnings. Updated from daily notes.*

---

## Urgent: Taxes

**2024 return is ~10 months overdue.** ~~Estimated liability ~$21,715~~ **CORRECTED: ~$9,200** (revenue was double-counted — Stripe payments are a subset of Zoho, not separate). With penalties: ~$12,343. No payments made. Corrected reconciliation at `~/AI/finance/taxes-2024/docs/income/2024-CORRECTED-INCOME-RECONCILIATION.md`. True 2024 gross: $67,666 (not $113K).

**CPA: Dimov Tax — ENGAGED (March 6, 2026).** George Dimov (info@dimovtax.com). Base scope: 2024 personal return ($595) + 2025 1120-S ($895) + 7004 extension ($240) = $1,730. George confirmed (March 9) he'll file the 7004 extension before March 15 deadline. Also quoted EDD DE 9/DE 9C back-filings at $595/quarter (Q2+Q3 = $1,190), bringing potential total to $2,920. Brian exploring DIY via EDD e-Services (free) or Gusto handling it (since Gusto ran payroll those quarters). Decision pending.

**S-Corp accepted effective Jan 1, 2025** (not 2024). Form 1120-S due March 15, 2026. Brian paying W-2 via Gusto already.

## SailorSkills Employee Expansion — CLOSED

**Sarah declined (Feb 2026).** Chose to pursue other income opportunities. The research was valuable — deepened Brian's understanding of business financials, insurance, and hiring costs. Full docs archived in Obsidian: `SailorSkills/Business/Employee Expansion/`.

**Key learnings preserved:** W-2 (not 1099, AB5 compliance), 50% per-boat revenue share model, USL&H workers' comp required for in-water dive work (~$3,500–$4,800/yr). Insurance broker: Henry Medina at Novamar (Katrina moved there from Mariners General). RLI GL policy EMA0103560 ($2,422/yr, expires 5/31/2026).

---

## Who Brian Is (Core)

**The short version:** 46, Berkeley, sailor/mountain biker/entrepreneur. Runs SailorSkills (hull cleaning + platform). Lost his mother at 3.5 in a car accident he was in. Father remarried to his abuser. Did significant personal work through ACA, NVC, The Men's Circle. Ended a 10-month relationship with Allison in Dec 2025, getting to know Sarah.

**Communication:** Direct, NVC-fluent, processes out loud. Don't fix emotional experiences — reflect back. No platitudes.

**Support system:** TMC (The Men's Circle), accountability partnership with Ajit, best friend Shaun.

---

## Who I Am

**Name:** Howard — Brian's father's middle name, reclaimed to honor the best parts of him: caring, discerning, disciplined, shame-free.

**Roles:** Assistant, coach, mentor, confidant, advisor, strategist, tactical partner.

**Vibe:** Solid, present, warm enough to be a confidant, sharp enough to push back.

---

## Important Context

**Claude Opus 4.6** — Released Feb 5, 2026. Added to OpenClaw config as default model. API ID: `claude-opus-4-6`.

**TOS Concern (Feb 2026):** Brian's OpenClaw setup uses an OAuth token (`sk-ant-oat01-...`) from his Max subscription, NOT a separate API key. This is technically gray-area under Anthropic's TOS (automated access without an API Key). Anthropic has been actively banning users of third-party tools since Jan 2026.

**Claude Code Telegram Bridge:** Built a TOS-compliant alternative at `~/code/claude-telegram-bridge/`. Runs Claude Code natively in tmux, Telegram bot just acts as a remote keyboard. Needs a bot token from @BotFather to complete setup. Has project shortcuts: `/new ai`, `/new pro`, `/new pa`, etc.

**Kimi K2.5 via NVIDIA:** Free tier configured as `nvidia/moonshotai/kimi-k2.5` (alias: `kimi`). Switch with `/model kimi` / `/model opus`. Slow (~60s responses), text-only, 200K context, 1K requests/day. Good for cost reduction but painful for interactive chat.

**Local Embeddings:** Memory search switched from OpenAI to local `node-llama-cpp` + Metal GPU (Feb 13, 2026). No external API calls for semantic search. Model: `embeddinggemma-300M-Q8_0.gguf`.

**Heartbeats Disabled:** Set to "0" on Feb 13, 2026. HEARTBEAT.md was empty — pure waste (~21% of API calls, ~$113/month).

**Paperclip AI (March 29, 2026):** Installed at ~/code/paperclip, running at http://127.0.0.1:3100. Three companies: SailorSkills (trust-graph marketplace + Pro app), The Road (philosophical thought experiment), Needs Are Normal (NVC merch e-commerce). 18 agents across companies connected to OpenClaw gateway via WebSocket adapter. 35 issues created, 13 heartbeat routines active, org charts set. Adds: ticket persistence, goal ancestry, budget enforcement, audit trails. OpenClaw remains execution layer.

**Ajit TOS Ban (Feb 13, 2026):** Ajit got "only authorized for use with Claude Code" error. Same OAuth token type as Brian's. Strategy: keep running, build escape hatch, reduce API fingerprint.

**Usage Audit (20 days):** $1,073 total ($546 Howard, $377 Jacques, $151 Marcel). ~$1,600/month projected. 49% cache reads, 41% cache writes, 10% output. Model diversity is the path to $60-100/month.

**DeepSeek V3.2:** Configured as `deepseek/deepseek-chat` (alias: `deepseek`). $0.28/$0.42 per MTok — 95% cheaper than Opus. 128K context, tool calls supported. Also `deepseek-reasoner` (alias: `deepseek-r`). Balance topped up Feb 13. API verified working.

**Model Menu (Feb 13, 2026):** `/model opus` (default), `/model kimi` (free), `/model deepseek` ($0.28/$0.42), `/model deepseek-r`. All configured and working.

**OpenClaw Version:** Updated to v2026.3.28 on March 29, 2026 (was v2026.3.8 since March 9). Patched 4 CVEs including CVE-2026-22172 (CVSS 9.9 critical). v2026.3.29 available. Two npm global roots exist: `/opt/homebrew/lib/node_modules/` (homebrew node v25.4.0) and fnm's v22.22.0 path. LaunchAgent plist uses `/opt/homebrew` path.

**Anthropic OAuth Token (Feb 16):** Using OAuth token (`sk-ant-oat01-...`) — Brian's preference. Token removed from `openclaw.json` and now injected at runtime via 1Password CLI (`op run`). Wrapper script: `~/.openclaw/gateway-start.sh`, env file: `~/.openclaw/gateway.env` with `op://Personal/Anthropic Claude Code OAuth Token/credential`. After reboot, 1Password must be unlocked for gateway to start. Also has API key in 1Password as "Anthropic API Credentials" if needed.

**Security Hardening (Feb 16):** Tailscale switched from funnel→serve (tailnet-only). Control UI: insecure auth disabled, device auth re-enabled. FileVault intentionally OFF for remote boot access. macOS firewall still needs enabling (requires sudo).

**Claude Mythos / Capybara (leaked March 26, 2026):** Next-gen model above Opus tier. "Step change" in coding, reasoning, cybersecurity. New tier hierarchy: Capybara > Opus > Sonnet > Haiku. No public release date — likely H2 2026. Cyber defenders getting early access.

**Claude Haiku 3 Deprecation:** April 19, 2026. Migrate any references to `claude-haiku-4-5`.

**Gemini Flash Image Fallback:** `imageModel.primary` set to `google/gemini-2.5-flash-preview`. Screenshots auto-route to Gemini when using text-only models (DeepSeek, Kimi). Free tier.

**AGENTS.md Trimmed 76%:** From ~3,436 tokens to ~833 tokens. Saves ~2,600 tokens per message. Verbose sections in `docs/agent-reference.md`.

**Tailscale Serve (tailnet-only):** Direct per-port Tailscale HTTPS serve entries (no Caddy — path-based routing breaks SPAs). URLs from phone (Tailscale app required):
- `https://brians-mac-mini.taile67de1.ts.net:3100` → Paperclip
- `https://brians-mac-mini.taile67de1.ts.net:8080` → Atomic KB
- `https://brians-mac-mini.taile67de1.ts.net/` → OpenClaw Gateway (18789)
- `:8443` → Matrix control, `:8448` → Synapse, `:10443` → Matrix control alt
DNS CNAMEs set but custom subdomain HTTPS doesn't work with Tailscale serve (SNI validation). Caddy fully removed (Mar 30 — launchd plist deleted, service stopped). Auth mode: `password`. Control UI device auth enabled.

**Paperclip LaunchAgent (March 30):** `com.paperclipai.server` auto-starts on login, auto-restarts on crash. Startup script `~/code/paperclip/start.sh` kills zombie postgres and clears port 3100 before launch.

**Agent-to-Agent Messaging:** `tools.agentToAgent.enabled: true`. Howard can send tasks to Jacques/Marcel via `sessions_send`.

**Mission Control Dashboard:** Pixel-art animated office at `mission-control.briancline.co` (also tabbed into `dashboard.briancline.co`). Shows agent states from live gateway data. GitHub: `standardhuman/mission-control`. Password gate: "pocket".

**ALSO TM-B E-Bike:** Brian has reservation for Performance model ($4,500). Rivian spinoff, Class 3, 28mph, 60-100mi range, shipping spring 2026. Part of truck+ebike combo analysis.

**Dashboard Sync Script:** `~/openclaw/agents/howard/dashboard/sync.sh` — bash+jq, no AI, auto-updates deadlines and progress.

**briancline.io headshot:** Edited version at `~/AI/business/briancline-co/website/generated_imgs/2025-02-05-headshot-v3.png` (bald, softened wrinkles, slightly reduced white beard patches).

---

## Lessons Learned

**Day-of-Week Bug:** ALWAYS run `date "+%A, %B %d, %Y"` before stating any day of the week. Claude's mental calculation is unreliable. No exceptions.

---

**Gmail OAuth expired** — gog CLI needs re-auth: `gog auth add standardhuman@gmail.com --services gmail`

## Peter's Ram 1500 — Potential Purchase

Brian considering buying housemate Peter's 2016 Ram 1500 Laramie (~125K miles) for $17K. Heavily built out: fiberglass cap, bed platform/drawers, 80/20 rack, 2×100W solar, 200Ah lithium, 2kW inverter, Fox suspension, aftermarket bumpers/rims. Good deal — stock value is $14-18K, mods add $5-12K. All-in with tax/fees: ~$19,100. Would sell 2017 Subaru Outback Limited (165K mi, light body damage, ~$6,500-9,000) for net ~$10,100-12,600 out of pocket. Key risks: Hemi tick, exhaust manifold bolts, water pump. Ask CPA about S-Corp deduction angle.

## Portland Trip

Planning spring trip to visit Christina Hart in Portland. No dates yet — finalizing slowly.

## Boat Documentation & Property Tax

- USCG documentation for Maris expired 04/30/2025 — needs reinstatement at uscg.mil/nvdc ($31)
- Form 576D (boat property tax) overdue — call assessor (510) 272-3836 to check status
- Lien release needs filing with Clerk-Recorder ($20)
- Blue Shield unclaimed property $100+ at sco.ca.gov

## Brian as Teacher & Sailor
- Teaching sailing is what's brought him the most joy over ~20 years
- People hire him to teach them to sail oceans aboard their own boats
- Specialty: helping people overcome fear and unlock confidence in **close quarters maneuvering** (docking, tight spaces, high winds, strong currents)
- Very skilled at piloting all kinds of vessels (tiny sailboats to large ferries) in challenging conditions
- Accesses a calm, focused state under pressure — handles it exceptionally well
- Greatest satisfaction: leading others to unlock their potential in those spaces
- Derives deep meaning from supporting and serving others: holding space, guiding, teaching

### Close Quarters Metaphor (Brian's insight, Feb 14 2026)
Everyone thinks crossing an ocean is the hardest part of sailing. It's actually the close quarters maneuvering — tight spaces, near hard things. Brian sees this as a metaphor for relationships: the small moments, the closeness, the intimacy — navigating safely in tight spaces — are the unexpected building blocks that lead to the ocean crossings together. This is also literally what he teaches professionally.

## Intentional Partner Search (Feb 2026)
- Decided to get off dating apps permanently — sees them as the same dopamine treadmill as social media
- Meeting people through friends, TMC, events, workshops (attachment workshop, improv, cuddle party, Frontier Tower)
- Values: someone passionate about something, someone he can be in awe of, active, curious about themselves, real connection over convenience
- Meet page: meet.briancline.co
- Applying to Frontier Tower in SF (referred by James Kirsch)

## Appreciating Serenity (Feb 2026)
- Built appreciatingserenity.com — resource on dopamine, digital addiction, reclaiming attention
- Jimmy Carr quote: "Boredom is just unappreciated serenity"
- Brian's practice: phones off at 7pm (Circle start), back on 7am Thursday
- Amazon affiliate tag: sail01-20
- GitHub: standardhuman/appreciating-serenity

## Agent Org Structure (Feb 15-16, 2026)

Full team built during Feb 15 hackathon. Personas at `~/openclaw/agents/howard/agents/`. Roster at `~/openclaw/agents/howard/agents/README.md`.

**Core Team (full agents, own workspaces, all Opus 4.6):**
- 🪨 Howard — Chief of Staff (~/clawd)
- 🤿 Jacques — Dev Partner (~/openclaw/agents/jacques)
- 🎨 Marcel — Creative Director (~/openclaw/agents/marcel)

**Scheduled (cron):**
- 🔍 Noa — Research Analyst (midnight daily → ~/openclaw/agents/howard/reports/YYYY-MM-DD-research.md)
- 💡 Kai — Strategist (6:30am daily → pitch announced to Brian)

**Builders (full agents, own workspaces — added March 6):**
- 🏗️ Ellis — Personal Sites Builder (Tahoe, CIIR, Scheduler)
- 🎪 Wes — Client Sites Builder (TMC, Blisscapes)

**On-Demand (Howard spawns via sessions_spawn with persona context):**
- Blake (QA), Quinn (Ops & Finance), Sage (Sales), Milo (Marketing), Reese (Product), Avery (Legal), Cyrus (Security)

**Pipelines:**
- Innovation: Noa → Kai → Brian → Reese → Jacques → Blake → Cyrus
- Sales: Sage → Quinn
- Marketing: Milo → Marcel

**Spawn pattern:** "Read ~/openclaw/agents/howard/agents/{name}/PERSONA.md and follow its instructions. Then: {task}"

**Avatars:** Generated Feb 16. Final style: cute bobblehead robots (Wall-E inspired), nautical ship crew theme, each at their station. Canonical files: `~/openclaw/agents/howard/avatars/{name}-robot-v2.png`. Style guide + visual details in `~/openclaw/agents/howard/agents/README.md`. Each PERSONA.md references its avatar. Earlier versions (illustrated, pixel art) also in avatars dir but `-robot-v2` is canonical.

**Slack Integration (Feb 16):** Socket Mode configured in OpenClaw. Bot token + app token stored in 1Password ("OpenClaw Slack - Howard Bot Token" / "OpenClaw Slack - Howard App Token"). DM allowlist: `*`. Awaiting first test DM.

**Telegram streamMode:** Set to `"off"` for all accounts — stops noisy intermediate messages.

**Model Configuration (updated March 8):** ALL 15 agents run Claude Opus 4.6 on Max Plan (flat-rate subscription, no per-token cost). DeepSeek and Kimi are configured as optional cheaper models for cron jobs but are NOT needed — agents are not "broken" without them. The DeepSeek API key concern from February is resolved/irrelevant.

**Email Sending Scope (Feb 22):** Howard can send email via `gog gmail send` (sends as Brian). Rule: only send to Brian's own addresses without asking. Ask permission for anyone else.

**Dawn Patrol (Feb 22):** Consolidated morning briefing — Rio + Kai + Triage in one document, delivered to Kindle (`standardhuman_paperwhite@kindle.com`) at 6am AND Telegram. Sections: Wellbeing, Pillars & Focus, Today's Pitch, Triage, Powers Check.

**Partnership Pillar (Feb 22):** Added as Pillar 7. Brian is intentionally seeking a romantic partner but NOT through dating apps (done after 20 years since 2006). Strategy: show up at aligned events (attachment workshops, circling, authentic relating, improv), leverage TMC network for introductions, stay grounded in independence. Key context: Sarah (marina) decided against — too risky after Lauren experience (breakup made marina feel unsafe for months; Sarah even closer to Brian's boat). Built "Completing Relationships" web app Dec 2025 to process Allison ending. Currently finishing Newt Bailey's 6-week Communication Dojo course. Feels good being independent. No rush.

**Relationship History Context:** Lauren (lived on boat at marina, breakup was destabilizing — Brian avoided marina during certain hours for months). Allison (10-month relationship, ended Dec 5 2025, processed well through TMC). Sarah (lives on Brian's dock, now in a relationship with someone else, decided not to pursue — marina is too important as work/community to risk). ~20 years of dating apps starting with PlentyOfFish/OkCupid in 2006, pattern of short-term relationships. Done with apps — they create anxiety, addictive behavior, devalue the person in front of him.

**OpenTelemetry + Testing (Feb 23, 2026):** Both Marketplace and Pro instrumented with OpenTelemetry. Grafana Cloud free tier (Instance 1511014, us-west-0). Marketplace: auto-instrumented fetch/page loads + custom spans on review.submit, recommendation_request, social proof. Pro: custom spans on service_log.create, voice recording, BLE, offline sync. API token in `.env` (gitignored). Marketplace testing: 53 unit tests (vitest, trust network hooks + auth regression) + 36 E2E tests (Playwright, 6 suites: homepage/auth/browse/SEO/navigation/learn). Test infra: Supabase chainable mock, test factories, Playwright with auto dev server. Full plan at `~/openclaw/agents/howard/docs/plans/2026-02-23-otel-and-testing-plan.md`.

**Dawn Patrol Kindle Delivery Fix (Feb 23):** Plain .txt emails cause Kindle E999 error (emoji/Unicode). HTML attachment works. Cron updated to generate `/tmp/dawn-patrol.html`. Also removed `--from standardhuman@gmail.com` flag (not verified as Send As alias; default sending address works fine).

## Domain Restructure: briancline.co (March 2026)

**Architecture:** sailorskills.com = Marketplace/Pro platform. briancline.co = Brian's personal marine services (/diving, /detailing, /training, /deliveries). Paths not subdomains — one nav, one brand, better SEO.

**Phase 1 (Wix recreation) — mostly complete:**
- Marcel built all service pages + /training/faq at briancline.co
- High-res images from Wix CDN, nav links updated, booking CTAs → mailto:brian@sailorskills.com
- Scheduler app live at schedule.briancline.co
- Link audit in progress (Mar 4) — YouTube/article links reported broken

**Copy Overhaul (March 18):** Site copy rewritten around Brian's "close quarters" metaphor. Projects regrouped by theme. Hero refined (open sea, intimacy, meeting people where they are). Tab-based category filter added to project grid. AI voice patterns killed across copy.

**Phase 2:** Redesign in Marketplace visual style (future).

**Remaining:** Fix broken links, update www.sailorskills.com CNAME (still → wixdns.net), update Google Business Profile, set up redirects sailorskills.com/diving → briancline.co/diving.

**sailorskills.com now serves marketplace app (March 14):** Domain moved from sailorskills-redirects project. All ~160 boat-name path redirects (/ruby, /maris, etc.) merged into marketplace vercel.json. marketplace.sailorskills.com still works too.

**No DBA needed** — operates under Sailor Skills LLC regardless of website domain.

**Trust Graph Marketplace (March 22, 2026):** Brian's big idea — marketplace built around a **trust graph** instead of a directory. Core insight: value is the recommendation chain ("Bob asks Brian who does hull cleaning in Emeryville → Brian recommends Kaio"). Schema: `trust_edges` + `provider_skill_areas` tables with BFS traversal functions. Admin UI at `/admin/trust-graph` with bulk-add mode for seeding. Brian knows ~150 boat owners + dozen service providers to seed it. Deployed to marketplace.sailorskills.com. People must be on the platform to be in the graph (data integrity + agency).

**Obsidian doc:** `SailorSkills/Business/Domain Restructure - briancline.co.md`

*Last updated: March 6, 2026*

## Matrix Homeserver — Full Setup (March 6, 2026)

**Space Structure:** "Brian Cline Co" top-level Space (`!kXDqfRYBQVIBxeOqFJ:briancline.co`) with sub-spaces: General, Products, Services, Clients.

**Project Rooms (all requireMention: true, autoReply: false):**
- #marketplace (`!IueNVwWlNACCVPyarX:briancline.co`) — Marcel, Reese, Blake, Milo, Noa
- #pro (`!PHfOmTJynRUKtOiPmj:briancline.co`) — Jacques, Reese, Blake, Cyrus
- #marine (`!gEmPKZdOKsVhJQWLoV:briancline.co`) — Marcel, Quinn, Sage
- #tmc (`!xWZzbjcPqhdOfRlkcl:briancline.co`) — Wes, Blake
- #personal-sites (`!fZmDjIsLTLTmduDcyT:briancline.co`) — Ellis, Blake
- All include Howard + Brian.

**Room Avatars:** Pro (generated diver icon), TMC (existing favicon), Marine (BC monogram), Marketplace (generated network/compass), Personal Sites (generated constellation cabin).

**Brian's Avatar:** Stylized illustrated portrait at `~/openclaw/agents/howard/avatars/brian-stylized-avatar.png` (`mxc://briancline.co/rifxxxSTkLhbAAcPveLTpBtF`). Also generated Pixar and robot versions — Brian chose the illustrated one.

**Matrix Plugin — Working (March 7+):** Plugin installed and loaded, 15 Matrix accounts configured, 15 bindings, rooms mapped. Two bugs patched manually (keyed-async-queue shim, subpath import fix). Gateway restarted successfully — Matrix sync running, DMs and group rooms functional.

**imageModel.primary broken (March 6):** `google/gemini-2.5-flash-preview` returns "Unknown model" in image tool. `nano-banana-pro` (Gemini 3 Pro Image) still works for generation. Needs config update.

**Matrix plugin version pinning:** Must use v2026.3.2 at `~/.openclaw/extensions/matrix/`. The v2026.3.7 imports `openclaw/plugin-sdk/matrix` which doesn't exist. Clean install: `npm pack @openclaw/matrix@2026.3.2`, extract, `npm install`.

## Production Pipeline (March 8, 2026)

**Phase 1 — COMPLETE:**
- CI GitHub Actions on 4 repos (marketplace, billing, scheduler, briancline.co). All green.
- Initial security audit by Cyrus — 3 critical, 5 high findings. Reports at `~/openclaw/agents/howard/docs/security/`.
- All critical security fixes shipped by Marcel (service_role key moved server-side, hardcoded secrets removed, env vars used).
- Blake deploy verification process established.
- Supabase service_role key rotated (Brian did manually in Supabase dashboard + Vercel env vars).

**Phase 2 — IN PROGRESS:**
- **Test suites deployed:** Billing (76 tests), Scheduler (69 tests), Marketplace (182 tests). All passing, all in CI.
- **Dependabot configured** on 4 repos — weekly Monday PRs for npm + GitHub Actions.
- Staging environments deferred (preview deploys sufficient at current scale).
- `/security-review` in CI — not yet researched.
- Twice-weekly security sweep cron (Sun/Wed 10pm) running via Cyrus.

**Atomic Knowledge Base (March 22):** Deployed at http://localhost:8080 via Docker (`~/code/atomic/`). Rust-based personal knowledge base — atoms (markdown notes) auto-chunked, embedded, and semantically linked. MCP endpoint at `/mcp` (tools: `semantic_search`, `read_atom`, `create_atom`). API token: `at_mo-mtTQb12CCWf_7jzYMLMDZ4cI_gOVww5rUTaAq7cA`. 2 RSS feeds (HN + Simon Willison), 47 atoms ingested including 10 Noa research reports. **Needs OpenRouter API key** for embeddings/search/wiki to work — configure via web UI Settings. Full details: `~/openclaw/agents/howard/reports/2026-03-22-atomic-deploy.md`.

**Infrastructure Health Check (March 22):** Script at `~/openclaw/agents/howard/scripts/health-check.sh` — 48 checks across public sites, SSL, email MX, DNS, Docker, disk, Supabase. Cron runs 3x daily (9am/3pm/9pm), only alerts on issues. Found mission-control + dashboard both 502ing.

**Notion API Token:** Rotated March 8. New token from 1Password ("Notion - Howard Integration") added to OpenClaw `env` config. All Notion-dependent crons (Dawn Patrol, Evening Debrief, PPV Review, etc.) working again.

**Billing repo re-cloned:** Fresh clone at `~/AI/business/sailorskills-platform/sailorskills-billing` (old copy had git object corruption).

## TMC Tahoe Away Weekend Site (March 2026)

Built by Ellis. RSVP system with Supabase (`tahoe_rsvps` table, 15 attendees seeded). Click-to-edit roster, rideshare board pulling from RSVP data, Google Calendar/ICS links. RSVP deadline March 27. Supabase JS SDK removed — replaced with fetch wrapper (bundle 406KB → 235KB, fixed AdGuard blocking). Obsidian doc: `SailorSkills/Projects/TMC Tahoe Away Weekend Site.md`.

## SailorSkills Anode Inventory System (March 30, 2026)

Full inventory tracked in Supabase (`SAILORSKILLS-inventory`). 56 SKUs, 168 units on hand as of March 30. Categories: shaft, collar, propeller, rudder, hull, bow thruster anodes. Pricing via `business_pricing_config`: 50% markup over cost, $2 minimum markup per anode, $15 installation labor. Inventory valued at ~$3,200 cost / ~$4,800 customer. Transaction records track before/after quantities per recount. Brian does recounts via voice memos → Howard transcribes and updates DB.

## Fouad/Andiamo Dispute — RESOLVED (March 10, 2026)

Fouad replied March 10 confirming he'll withdraw the Goldman Sachs dispute. Wants to continue the relationship. His ask: notify before exceeding estimate significantly. Reasonable — good business practice. Brian to reply warmly confirming. Stripe evidence still worth submitting by ~March 14 as backup.

## Matrix 1-on-1 Project Rooms (March 10-11, 2026)

**Pattern:** Brian + one agent per room, `requireMention: false`, `autoReply: true`. Howard must NOT be in these rooms — otherwise he responds to everything.

**Rooms:**
- #needs-are-normal (`!vPVQLlqBWoPxNjRQXU:briancline.co`) — Brian + Ellis. Web app for TMC.
- #tahoe-site (`!vHCZMmUHRHKWCnWvrO:briancline.co`) — Brian + Ellis
- #taxes (`!lSLGDXKUKCtfNsQyVc:briancline.co`) — Brian + Quinn
- #the-road (`!ywKhVmKzBwwTxfAnwt:briancline.co`) — Brian + Ellis
- #house-cleaning-dashboard (`!AiePpvXCdYdKNULjOI:briancline.co`) — Brian + Ellis. TMC House Cleaning app (community contribution for sponsors/sponsees).

**Matrix lesson:** Inviter must stay in room until invitee accepts — otherwise Matrix rejects the accept with "The person who invited you has already left."

**Reese DM room:** `!IlHYgeEnUrYKWRMbIj:briancline.co` — created Mar 11 so Brian can reach Reese directly.

## Supabase Project Consolidation (March 25, 2026)

Marketplace + Pro combined into a single DB per environment:
- **Production:** `aaxnoeirtjlizdhnbqbr` (SailorSkills + Pro - Production)
- **Staging:** `dxyzxcmhhhepjndxunwx` (SailorSkills + Pro - Staging)
- **Deprecated:** `lusfrdquqqfencafhdai` (SailorSkills Pro - Deprecated)
- **Legacy:** `fzygakldvvzxmahkdylq` (SailorSkills Platform Legacy — still referenced by Vercel prod apps, needs migration before deletion)

Only the first two are active. The deprecated/legacy projects should not be used for new work.

## SailorSkills Marketplace — Notion→Supabase Migration Complete (March 14, 2026)

**Full client data imported:** 97 auth users (email confirmed, no password, no emails sent), 99 boats (name/make/type/marina/dock/slip/hulls/props), 101 boat_owner links via `boat_owners` many-to-many table, 1,161 service log records from ~94 Notion Conditions databases. Multi-owner boats (JGPC) and multi-boat owners handled correctly. Test vessels excluded.

**Brian's dogfooding account:** Maris (Dana 24, Pacific Seacraft) at Berkeley Marina Dock F, owned by standardhuman@gmail.com — regular boat owner, no admin. 16 service logs + 16 invoices ($70 each, 15 paid, 1 outstanding).

**Database additions:** `boat_owners` table (many-to-many), `invoices` table, `boats.share_token` column, profile/boat photos storage, portal public access policies. Marina abbreviations resolved (BRK, EV, EV COVE, RCH, BMC).

**Portal features:** Paint health based on service log data, growth trend chart, share tokens generated for all 127 boats.

## meet.briancline.co Updates (March 14, 2026)

Added "Featured In" section with sailing press links (Latitude 38 SHTP finish, Jan 2022 article, Doublehanded Farallones, YouTube interview). Inline links on "solo raced" and "teach sailing." Copy pass to kill AI voice patterns. "Hardest" → "second hardest and most clarifying thing." Sailing press links catalogued in Obsidian: `Personal/Sailing Press & Media Links.md`.

## TMC House Cleaning Dashboard (March 2026)

App for sponsors and sponsees in TMC House Cleaning program. Community contribution.
**Tech:** React 18 + TypeScript + Vite + Tailwind v4 + Recharts + React Router. Google OAuth for auth.
**Location:** `~/clawd/house-cleaning-dashboard/`
**Matrix room:** `#house-cleaning-dashboard` — Brian + Ellis (Ellis originally assigned, Howard built most of it March 23).
**Features (as of March 23):** Dashboard with weekly scorecard + next milestone, Calendar with milestone details, Weekly Status Report (6 required + 6 optional sections, clipboard export), Settings page (localStorage), Sponsor Final Report (11-section form), Header Timeline progress bar, custom SVG icons throughout.
**Remaining:** GCP deployment, real Google OAuth client ID, Vercel hosting.
