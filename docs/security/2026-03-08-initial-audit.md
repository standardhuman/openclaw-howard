# Initial Security Audit — 2026-03-08

**Auditor:** Cyrus  
**Repos scanned:** 8 (6 active codebases, 1 redirect config, 1 data-only)  
**Critical findings:** 3  
**High findings:** 5  
**Medium findings:** 6  
**Low findings:** 4

---

## Critical Findings

### 1. [Billing] Hardcoded Supabase Service Role Key in Client-Side JavaScript

- **Severity:** 🔴 CRITICAL
- **Description:** The Supabase `service_role` JWT is hardcoded directly in three client-facing JavaScript files. This key bypasses ALL Row Level Security (RLS) policies, granting full read/write access to every table in the database. Anyone who views page source or inspects network traffic gets god-mode database access.
- **Location:**
  - `src/admin/inline-scripts/conditions-logging.js:186`
  - `src/admin/inline-scripts/enhanced-charge-flow.js:1017`
  - `src/admin/invoice-flow.js:398`
- **Repo:** `sailorskills-billing` (`~/AI/business/sailorskills-platform/sailorskills-billing`)
- **Impact:** Full database compromise. An attacker could read, modify, or delete all billing data, customer records, and invoices.
- **Recommended fix:** 
  1. **Immediately** remove the service role key from all client-side code
  2. Move these operations to Vercel serverless functions (already in `api/`) that use the service role key server-side via `process.env.SUPABASE_SERVICE_ROLE_KEY`
  3. Rotate the service role key in Supabase dashboard after the code is fixed
  4. Audit Supabase logs for unauthorized access using this key
- **Assigned to:** Marcel (builder), Cyrus (key rotation)

### 2. [Scheduler] Hardcoded Admin Password in Source Code

- **Severity:** 🔴 CRITICAL
- **Description:** The file `src/utils/auth.ts` contains `const ADMIN_PASSWORD = 'admin123'` — a plaintext hardcoded password for admin access. This is committed to git and visible to anyone with repo access. The password itself ("admin123") is trivially guessable.
- **Location:** `src/utils/auth.ts:7`
- **Repo:** `bc-scheduler` (`~/AI/business/briancline-co/scheduler`)
- **Impact:** Anyone can access the admin interface. The scheduler handles real client booking data.
- **Recommended fix:**
  1. Remove the hardcoded password immediately
  2. The repo already has Supabase Auth integrated (`src/contexts/AuthContext.tsx`) — use it as the sole auth mechanism
  3. Delete the `src/utils/auth.ts` file entirely
  4. Remove any UI that uses the legacy password login
- **Assigned to:** Ellis (builder)

### 3. [Scheduler] Production Secrets Committed to Git

- **Severity:** 🔴 CRITICAL
- **Description:** The file `.env.prod` is tracked in git and contains production Supabase JWT tokens (2 JWT values detected). The `.env.vercel` file is also tracked. These files are in the git history permanently.
- **Location:** `.env.prod`, `.env.vercel` (both git-tracked)
- **Repo:** `bc-scheduler` (`~/AI/business/briancline-co/scheduler`)
- **Impact:** Anyone with access to the repo (or its git history) has production credentials.
- **Recommended fix:**
  1. Add `.env.prod` and `.env.vercel` to `.gitignore`
  2. Remove from git tracking: `git rm --cached .env.prod .env.vercel`
  3. Rotate the exposed Supabase keys
  4. Use `git filter-branch` or BFG Repo Cleaner to purge from history if the repo is public
  5. Move production config to Vercel environment variables exclusively
- **Assigned to:** Ellis (builder), Cyrus (key rotation)

---

## High Findings

### 4. [Billing] Hardcoded Supabase Anon Key and URL in Source Code

- **Severity:** 🟠 HIGH
- **Description:** The Supabase URL and anon key are hardcoded in `src/customers/services/CustomerDataService.js` and `src/admin/inline-scripts/supabase-init.js` rather than loaded from environment variables.
- **Location:**
  - `src/customers/services/CustomerDataService.js:9-10`
  - `src/admin/inline-scripts/supabase-init.js:10-22`
- **Repo:** `sailorskills-billing`
- **Impact:** While anon keys are designed to be public (protected by RLS), hardcoding them makes key rotation impossible without code changes. It also means the same key is used in dev and production.
- **Recommended fix:** Replace hardcoded values with `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY` (pattern already used elsewhere in this codebase).
- **Assigned to:** Marcel

### 5. [Billing] Stripe Live Publishable Key Hardcoded

- **Severity:** 🟠 HIGH
- **Description:** The Stripe live publishable key `pk_live_pri1IepedMvGQmLCFrV4kVzF` is hardcoded in source. While publishable keys are meant to be client-facing, hardcoding prevents key rotation and mixes production keys into development.
- **Location:**
  - `src/admin/inline-scripts/supabase-init.js:22`
  - `src/admin/inline-scripts/wizard-payment.js:86`
- **Repo:** `sailorskills-billing`
- **Recommended fix:** Move to environment variable `VITE_STRIPE_PUBLISHABLE_KEY`.
- **Assigned to:** Marcel

### 6. [briancline.co] Hardcoded Supabase Credentials in Component

- **Severity:** 🟠 HIGH
- **Description:** The Supabase URL and anon key are hardcoded directly in `DivingOrder.jsx`. Same issues as #4.
- **Location:** `src/services/pages/DivingOrder.jsx:19-20`
- **Repo:** `briancline.io` (`~/AI/business/briancline-co/website`)
- **Recommended fix:** Replace with `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- **Assigned to:** Ellis

### 7. [Tahoe] Supabase Anon Key Hardcoded in Source (No .gitignore for .env)

- **Severity:** 🟠 HIGH
- **Description:** `src/supabase.js` has the Supabase anon key hardcoded directly in source code. The `.env` file also exists but `.gitignore` does NOT include `.env` patterns — if this repo gets a git init, the `.env` will be committed.
- **Location:** `src/supabase.js:3`
- **Repo:** `tahoe-away-weekend` (`~/clawd/tahoe-away-weekend`)
- **Note:** The code comment says "avoids Supabase JS client which ad blockers interfere with" — the custom REST wrapper is fine, but the key should come from env vars.
- **Recommended fix:**
  1. Use `import.meta.env.VITE_SUPABASE_ANON_KEY` instead of hardcoded value
  2. Add `.env` / `.env.local` / `.env.*.local` to `.gitignore`
- **Assigned to:** Builder (TBD)

### 8. [Dashboard] Client-Side Password with Hash in Source

- **Severity:** 🟠 HIGH
- **Description:** The Mission Control dashboard uses a client-side password gate. The password hash (`-982936170`) and the password itself (`"pocket"` — visible in a comment) are in the HTML source. Anyone can read the source, find the hash, and the comment literally says the password. The auth uses `localStorage` which is trivially bypassed.
- **Location:** `index.html:715` (and `working.html`, `enhanced.html`, `unified.html`, `three-tabs.html`)
- **Repo:** `dashboard` (`~/clawd/dashboard`)
- **Impact:** Zero effective access control on the dashboard. Contains organizational cost data, agent info, sprint details.
- **Recommended fix:**
  1. Short-term: Since this is Tailscale-gated, the network provides the real security layer. Remove the password gate or use server-side auth.
  2. Medium-term: Add proper authentication if the dashboard will be accessible beyond Tailscale.
- **Assigned to:** Marcel

---

## Medium Findings

### 9. [Billing] 17 npm Vulnerabilities (2 Critical, 11 High)

- **Severity:** 🟡 MEDIUM (build-time dependencies, not runtime)
- **Description:** `npm audit` reports 17 vulnerabilities including 2 critical (likely in `tar` via `@capacitor/cli` and `undici` decompression DoS).
- **Repo:** `sailorskills-billing`
- **Recommended fix:** Run `npm audit fix`. For breaking changes, run `npm audit fix --force` on a branch and test. Consider removing `@capacitor/cli` if not needed for web-only deployment.

### 10. [Marketplace] 4 npm Vulnerabilities (2 High)

- **Severity:** 🟡 MEDIUM
- **Description:** `npm audit` reports 4 vulnerabilities — `rollup` path traversal (high), `qs` DoS (moderate), `minimatch` ReDoS (low/high).
- **Repo:** `sailorskills-marketplace`
- **Recommended fix:** Run `npm audit fix`. All have fixes available.

### 11. [Scheduler] 3 npm Vulnerabilities (2 High)

- **Severity:** 🟡 MEDIUM
- **Description:** `rollup` path traversal and `minimatch` ReDoS.
- **Repo:** `bc-scheduler`
- **Recommended fix:** Run `npm audit fix`.

### 12. [briancline.co] 1 npm Vulnerability (High)

- **Severity:** 🟡 MEDIUM
- **Description:** `rollup` path traversal vulnerability.
- **Repo:** `briancline.io`
- **Recommended fix:** Run `npm audit fix`.

### 13. [Billing] innerHTML Usage with Dynamic Content

- **Severity:** 🟡 MEDIUM
- **Description:** Multiple files in the billing app use `innerHTML` to render dynamic content including customer names and data. If any customer data contains HTML/script tags, this creates XSS risk.
- **Location:** `src/customers/ui/CustomerDetailModal.js`, `src/customers/ui/CustomerListView.js`, `src/customers/datatable/DataTableView.js`
- **Repo:** `sailorskills-billing`
- **Recommended fix:** Use `textContent` for user-supplied data, or sanitize HTML before insertion.

### 14. [briancline.co] ADMIN_PASSWORD in .env

- **Severity:** 🟡 MEDIUM
- **Description:** The `.env` template includes `ADMIN_PASSWORD` as an environment variable. While using env vars is better than hardcoding, storing passwords in `.env` files (even gitignored ones) is fragile. The `.env` template file itself is in the repo.
- **Repo:** `briancline.io`
- **Recommended fix:** Use Supabase Auth or a proper auth provider instead of password-based admin auth.

---

## Low Findings

### 15. [Dashboard] Data Backups Stored in Repo Directory

- **Severity:** 🟢 LOW
- **Description:** 20+ `data-backup-*.json` files are stored in the dashboard directory. These contain organizational data (costs, agent info, sprint progress). The dashboard is git-tracked, so these could end up in the repo.
- **Repo:** `dashboard`
- **Recommended fix:** Move backups to a separate directory outside the repo, or add `data-backup-*.json` to `.gitignore`.

### 16. [Marketplace] dangerouslySetInnerHTML Usage

- **Severity:** 🟢 LOW
- **Description:** Used in `chart.tsx` (UI library component) and `[slug].tsx` (content rendering) and `ServiceLocation.tsx`. The content pages likely render CMS/markdown content — low risk if content is admin-controlled.
- **Repo:** `sailorskills-marketplace`
- **Recommended fix:** Ensure all content passed to `dangerouslySetInnerHTML` is sanitized (DOMPurify or similar).

### 17. [Scheduler] Dev Auth Bypass Flag

- **Severity:** 🟢 LOW
- **Description:** `.env` contains `VITE_DEV_AUTH_BYPASS` — a development-only auth bypass. Acceptable for local dev if it's properly guarded.
- **Repo:** `bc-scheduler`
- **Recommended fix:** Verify this flag is ignored in production builds. Add a runtime check that `import.meta.env.DEV` is true before allowing bypass.

### 18. [Dashboard] DeepSeek API Key Used in Shell Command

- **Severity:** 🟢 LOW
- **Description:** `scripts/collect-data.js` passes the DeepSeek API key via a `curl` command string, which could appear in process listings.
- **Repo:** `dashboard`
- **Recommended fix:** Use Node's `fetch` or `https` module instead of shell `curl` to avoid exposing the key in process args.

---

## Dependency Audit Results

| Repo | Critical | High | Moderate | Low | Total |
|------|----------|------|----------|-----|-------|
| sailorskills-marketplace | 0 | 2 | 1 | 1 | 4 |
| briancline.io | 0 | 1 | 0 | 0 | 1 |
| sailorskills-billing | 2 | 11 | 3 | 1 | 17 |
| bc-scheduler | 0 | 2 | 1 | 0 | 3 |
| tahoe-away-weekend | 0 | 0 | 0 | 0 | 0 |
| sailorskills-redirects | — | — | — | — | N/A (no npm) |
| dashboard | — | — | — | — | N/A (no package.json) |
| claude-telegram-bridge | 0 | 0 | 0 | 0 | 0 |

---

## .env / .gitignore Status

| Repo | .env Files Found | .env in .gitignore? | Git-Tracked .env Files | Status |
|------|-----------------|---------------------|----------------------|--------|
| sailorskills-marketplace | `.env`, `.vercel/.env.development.local` | ✅ Yes | None | ✅ Good |
| briancline.io | `.env`, `.env.local`, `.env.development.local` | ✅ Yes | None | ✅ Good |
| sailorskills-billing | `.env`, `.env.local`, `.env.example`, `.auto-claude/.env` | ✅ Yes | `.env.example` only | ✅ Good |
| bc-scheduler | `.env`, `.env.prod`, `.env.vercel` | ⚠️ Partial | **`.env.prod`, `.env.vercel`** | 🔴 BAD |
| tahoe-away-weekend | `.env` | ❌ No `.env` in gitignore | N/A (no git) | ⚠️ Risk |
| sailorskills-redirects | None | N/A | N/A | ✅ N/A |
| dashboard | `.env.local` | ⚠️ Partial (`.env*.local` only) | None | ⚠️ Partial |
| claude-telegram-bridge | `.env`, `.env.example` | ✅ Yes | None | ✅ Good |

---

## Repo-by-Repo Summary

### SailorSkills Marketplace (`sailorskills-marketplace`)
- **Path:** `~/AI/business/sailorskills/marketplace`
- **npm audit:** 4 vulnerabilities (2 high, 1 moderate, 1 low) — all fixable
- **Hardcoded secrets:** None — uses `import.meta.env` properly ✅
- **.env status:** Properly gitignored ✅
- **Notable:** Has Supabase migrations, test files, solid env var handling. Best practices of all repos.
- **Action needed:** Run `npm audit fix`

### briancline.co (`briancline.io`)
- **Path:** `~/AI/business/briancline-co/website`
- **npm audit:** 1 vulnerability (1 high) — fixable
- **Hardcoded secrets:** Supabase URL + anon key in `DivingOrder.jsx`
- **.env status:** Properly gitignored ✅
- **Notable:** Has `ADMIN_PASSWORD` in env, Google OAuth secrets in `.env`
- **Action needed:** Move hardcoded Supabase creds to env vars, run `npm audit fix`

### Billing Dashboard (`sailorskills-billing`)
- **Path:** `~/AI/business/sailorskills-platform/sailorskills-billing`
- **npm audit:** 17 vulnerabilities (2 critical, 11 high, 3 moderate, 1 low)
- **Hardcoded secrets:** 🔴 Service role JWT (3 files), anon key (2 files), Stripe live key (2 files)
- **.env status:** Properly gitignored ✅
- **Notable:** Worst security posture of all repos. Service role key exposure is a critical database security risk. Heavy use of `innerHTML`.
- **Action needed:** Immediate service role key removal, code refactor to use env vars, npm audit fix

### Scheduler (`bc-scheduler`)
- **Path:** `~/AI/business/briancline-co/scheduler`
- **npm audit:** 3 vulnerabilities (2 high, 1 moderate)
- **Hardcoded secrets:** 🔴 Admin password "admin123" in source code, production JWT tokens in git-tracked `.env.prod`
- **.env status:** ⚠️ `.env.prod` and `.env.vercel` tracked in git
- **Notable:** Has both legacy password auth and Supabase Auth — should consolidate on Supabase Auth only
- **Action needed:** Remove hardcoded password, untrack env files, rotate exposed keys

### Tahoe Away Weekend (`tahoe-away-weekend`)
- **Path:** `~/clawd/tahoe-away-weekend`
- **npm audit:** 0 vulnerabilities ✅
- **Hardcoded secrets:** Supabase anon key in `src/supabase.js`
- **.env status:** ⚠️ `.env` not in `.gitignore`
- **Notable:** Uses custom REST wrapper instead of Supabase client. No git repo yet — fix gitignore before initializing.
- **Action needed:** Move key to env var, fix `.gitignore`

### SailorSkills Redirects (`sailorskills-redirects`)
- **Path:** `~/clawd/sailorskills-redirects`
- **npm audit:** N/A (no npm project)
- **Hardcoded secrets:** None ✅
- **.env status:** N/A
- **Notable:** Just `vercel.json` redirect rules and an `index.html`. Minimal attack surface.
- **Action needed:** None

### Mission Control Dashboard (`dashboard`)
- **Path:** `~/clawd/dashboard`
- **npm audit:** N/A (no package.json — plain HTML/JS)
- **Hardcoded secrets:** Password "pocket" with hash in HTML source
- **.env status:** `.env.local` with Vercel OIDC token only
- **Notable:** Client-side auth is security theater. Data backups accumulating in repo dir. `collect-data.js` uses API keys via env vars (good) but passes them via shell commands (minor risk).
- **Action needed:** Remove or replace password gate, move backups out of repo

### Telegram Bridge (`claude-telegram-bridge`)
- **Path:** `~/code/claude-telegram-bridge`
- **npm audit:** 0 vulnerabilities ✅
- **Hardcoded secrets:** None — all secrets via env vars ✅
- **.env status:** Properly gitignored ✅
- **Notable:** Clean. Uses env vars correctly, has `.env.example` template. No git repo found locally (may be a clone without `.git`).
- **Action needed:** None

---

## Priority Fix List

### Immediate (this week)

1. **🔴 Remove service role key from billing source code** — This is a live database exposure. Every minute it's in source is a risk.
2. **🔴 Remove hardcoded admin password from scheduler** — Consolidate on Supabase Auth.
3. **🔴 Untrack `.env.prod` from scheduler git** — Then rotate the exposed keys.
4. **🟠 Move hardcoded Supabase/Stripe keys to env vars** across billing, briancline.co, and tahoe.

### This sprint

5. **🟡 Run `npm audit fix` on all repos** — Low effort, fixes known dependency vulnerabilities.
6. **🟡 Fix `.gitignore` in tahoe** — Add `.env` patterns before git init.
7. **🟡 Sanitize innerHTML usage in billing** — Prevent XSS via customer data.

### Backlog

8. **🟢 Replace dashboard password gate** — Low priority since Tailscale provides network-level access control.
9. **🟢 Move dashboard backups** — Add to `.gitignore` or relocate.
10. **🟢 Add DOMPurify for dangerouslySetInnerHTML** in marketplace content pages.

---

## Notes

This is the first security audit across all active codebases. Key patterns observed:

- **Inconsistent secret handling:** Some repos (marketplace, telegram bridge) handle secrets properly via env vars. Others (billing, briancline.co, tahoe) have secrets sprinkled through source code.
- **The billing app is the biggest risk.** Service role key in client-side JS is a textbook critical vulnerability. This needs to be fixed before anything else.
- **No CI/CD security gates exist yet.** The production pipeline spec (Phase 1.1) will address this — but until then, every push to main is unvalidated.
- **Supabase anon keys appearing in source is common** across repos. While anon keys are designed to be public (RLS protects the data), hardcoding them prevents rotation and conflates environments. Standardize on env vars.
- **The scheduler has two auth systems.** The legacy password system (`auth.ts`) and Supabase Auth (`AuthContext.tsx`) both exist. Kill the legacy one.

Next audit: March 15, 2026 (weekly cadence per pipeline spec).
