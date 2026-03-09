# Weekly Security Audit — 2026-03-08

**Auditor:** Cyrus (automated sweep)  
**Baseline:** 2026-03-08 Initial Audit  
**Repos scanned:** 6 active codebases  

---

## 🟢 Summary: Significant Progress Since Initial Audit

| Severity | Initial | Current | Change |
|----------|---------|---------|--------|
| 🔴 Critical | 3 | 1 | -2 ✅ |
| 🟠 High | 5 | 2 | -3 ✅ |
| 🟡 Medium | 6 | 5 | -1 ✅ |
| 🟢 Low | 4 | 3 | -1 ✅ |

---

## ✅ Resolved Since Initial Audit

### CRITICAL → Fixed

1. **[Billing] Hardcoded Supabase Service Role Key** — RESOLVED ✅
   - Service role key is no longer in client-side JavaScript
   - `conditions-logging.js` now references server-side API proxy pattern
   - `enhanced-charge-flow.js` and `invoice-flow.js` — no service_role references found
   - Comment at line 181 confirms: "service_role key stays server-side"

2. **[Scheduler] Hardcoded Admin Password** — RESOLVED ✅
   - `src/utils/auth.ts` now uses `import.meta.env.VITE_ADMIN_PASSWORD || ''`
   - No more `admin123` in source. Comment documents plan to consolidate on Supabase Auth in Phase 2.

3. **[Scheduler] Production Secrets Committed to Git** — RESOLVED ✅
   - `git ls-files` shows only `.env.example` tracked (good)
   - `.gitignore` now includes `.env`, `.env.local`, `.env.*.local`, `.env.prod`, `.env.vercel`, `.env.production`
   - ⚠️ Note: Historical exposure in git history still exists unless purged with BFG/filter-branch

### HIGH → Fixed

4. **[Billing] Hardcoded Supabase Anon Key/URL** — RESOLVED ✅
   - `CustomerDataService.js` now uses `import.meta.env` pattern
   - `supabase-init.js` now uses `import.meta.env?.VITE_SUPABASE_URL` with proper fallback chain

5. **[Billing] Stripe Live Publishable Key Hardcoded** — RESOLVED ✅
   - No `pk_live` or `sk_live` patterns found in billing source

6. **[briancline.co] Hardcoded Supabase Credentials** — RESOLVED ✅
   - `DivingOrder.jsx` now uses `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`

7. **[Tahoe] Supabase Anon Key Hardcoded / Missing .gitignore** — RESOLVED ✅
   - `src/supabase.js` now uses `import.meta.env.VITE_SUPABASE_ANON_KEY`
   - `.gitignore` now includes `.env`, `.env.local`, `.env.*.local`

---

## 🔴 Persistent Findings

### CRITICAL (1)

**None newly critical** — but one high finding warrants attention:

### HIGH (2)

1. **[Dashboard] Client-Side Password with Hash in Source** — PERSISTENT 🟠
   - `index.html:714-715` still contains hash `-982936170` (password "pocket" in test files)
   - `test-auth-simple.html` literally documents the password and hash
   - Server.js line 410 mentions injecting auth hash, but the fallback is still in source
   - **Mitigation:** Tailscale network-level access control
   - **Recommendation:** Remove `test-auth-simple.html` from repo. Consider server-side auth or accept Tailscale as the security boundary.

2. **[Dashboard] DeepSeek API Key via Shell Command** — PERSISTENT (upgraded from LOW to HIGH consideration)
   - `scripts/collect-data.js:183` passes API key via `curl` command string
   - Visible in process listings (`ps aux`)
   - **Recommendation:** Use Node `fetch` instead of shell `curl`

### MEDIUM (5)

3. **[Billing] npm audit: 17 vulnerabilities** — PERSISTENT 🟡
   - 2 critical (tar via @capacitor/cli, undici decompression DoS)
   - 11 high, 3 moderate, 1 low
   - Same counts as initial audit — `npm audit fix` has not been run
   - **Recommendation:** Run `npm audit fix` — this is low-effort

4. **[Marketplace] npm audit: 4 vulnerabilities** — PERSISTENT 🟡
   - rollup path traversal (high), qs DoS, minimatch ReDoS
   - Same as initial audit

5. **[Scheduler] npm audit: 3 vulnerabilities** — PERSISTENT 🟡
   - rollup + minimatch — same as initial audit

6. **[briancline.co] npm audit: 1 vulnerability** — PERSISTENT 🟡
   - rollup path traversal — same as initial audit

7. **[Billing] innerHTML Usage with Dynamic Content** — PERSISTENT 🟡
   - Multiple files still use `innerHTML` for customer data rendering

### LOW (3)

8. **[Dashboard] Data Backups in Repo** — PERSISTENT 🟢
   - Now 16 `data-backup-*.json` files (was 20+)
   - `.gitignore` only covers `.env*.local`, not `data-backup-*.json`
   - **Recommendation:** Add `data-backup-*.json` to `.gitignore`

9. **[Marketplace] dangerouslySetInnerHTML** — PERSISTENT 🟢

10. **[Scheduler] Dev Auth Bypass Flag** — PERSISTENT 🟢

---

## New Findings

**None.** No new secrets, no new sensitive files detected since the initial audit.

---

## Dependency Audit Comparison

| Repo | Initial | Current | Change |
|------|---------|---------|--------|
| sailorskills-billing | 17 (2C/11H/3M/1L) | 17 (2C/11H/3M/1L) | No change |
| sailorskills-marketplace | 4 (2H/1M/1L) | 4 (2H/1M/1L) | No change |
| bc-scheduler | 3 (2H/1M) | 3 (2H/1M) | No change |
| briancline.co | 1 (1H) | 1 (1H) | No change |
| tahoe-away-weekend | 0 | 0 | ✅ Clean |
| dashboard | N/A | N/A | No package.json |

---

## .env / .gitignore Status

| Repo | Status | Change from Initial |
|------|--------|-------------------|
| sailorskills-billing | ✅ Good | No change |
| sailorskills-marketplace | ✅ Good | No change |
| bc-scheduler | ✅ Fixed | 🟢 `.env.prod`, `.env.vercel` now gitignored and untracked |
| briancline.co | ✅ Good | No change |
| tahoe-away-weekend | ✅ Fixed | 🟢 `.env` patterns now in `.gitignore` |
| dashboard | ⚠️ Partial | `.env*.local` covered, `data-backup-*.json` not |

---

## Priority Actions (Remaining)

### This Week
1. Run `npm audit fix` across all 4 repos with vulnerabilities (15 min effort)
2. Delete `test-auth-simple.html` from dashboard (exposes password in plaintext)
3. Add `data-backup-*.json` to dashboard `.gitignore`

### This Sprint
4. Replace `curl` with Node `fetch` in `collect-data.js`
5. Sanitize `innerHTML` usage in billing app
6. Consider purging scheduler git history (BFG) if repo will ever be shared

### Backlog
7. Replace dashboard password gate or formalize Tailscale-only access
8. Add DOMPurify for dangerouslySetInnerHTML in marketplace
9. Remove `@capacitor/cli` from billing if not needed (eliminates 2 critical dep vulns)

---

## Assessment

**Good progress.** The three critical findings from the initial audit are all resolved:
- Service role key removed from billing client code ✅
- Scheduler admin password moved to env var ✅  
- Scheduler .env files untracked from git ✅

The main gap is **dependency vulnerabilities** — none of the repos have run `npm audit fix` since the initial audit. This is the lowest-hanging fruit remaining.

No new security risks introduced. Codebase is trending in the right direction.

**Next audit: March 11 or 15, 2026**
