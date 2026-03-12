# Security Fixes Applied — 2026-03-11

**Operator:** Cyrus (Security Specialist)  
**Triggered by:** Weekly security audit sweep  
**Source report:** `~/clawd/docs/security/2025-03-11-weekly-audit.md`

---

## Priority 1 — .gitignore env wildcard fixes ✅

**Risk:** 🔴 High — `.env.staging`, `.env.backup`, or other env variants could be committed

| Repo | Status | Commit | Details |
|------|--------|--------|---------|
| `sailorskills-marketplace` | ✅ Created | `74e8e5b` (platform repo) | Was completely missing .gitignore |
| `sailorskills-billing` | ✅ Fixed | `5bede50` | Consolidated to `.env*` with `!.env.example` |
| `briancline-co/website` | ✅ Fixed | `646ddb9` | Consolidated to `.env*` with `!.env.example` |
| `briancline-co/scheduler` | ✅ Fixed | `6336b83` | Consolidated to `.env*` with `!.env.example` |

**Note:** `sailorskills-marketplace` is an empty subdirectory in the platform repo (not its own git repo). Created a proper .gitignore there for when it gets populated.

---

## Priority 2 — Remove dist-react/ from billing git tracking ✅

**Risk:** 🟡 Moderate — Build artifacts in git increase repo size and may contain inlined secrets

- **Commit:** `29dc63a`
- **Files removed:** 6 (index.html + 5 JS/CSS/map files)
- Added `dist-react/` to `.gitignore`
- Ran `git rm -r --cached dist-react/`

---

## Priority 3 — npm audit fix on billing ✅ (partial)

**Risk:** 🔴 High — Known vulnerabilities in dependencies

- **Commit:** `c0924b7`
- **Before:** 17 vulnerabilities (2 critical, 11 high, 3 moderate, 1 low)
- **After:** 3 vulnerabilities (3 high)
- **Fixed:** tar path traversal (critical), @capacitor/cli, undici decompression chain, and others

### Remaining vulnerabilities (3 high) — requires manual intervention:

```
serialize-javascript <=7.0.2 (RCE via RegExp.flags)
  └── mocha 8.0.0 - 12.0.0-beta-2
      └── @wdio/mocha-framework >=6.1.19
```

**Fix available via `npm audit fix --force`** but would downgrade `@wdio/mocha-framework` to 6.1.17 (breaking change). Brian should evaluate whether the WebDriver/Mocha test framework upgrade is acceptable.

---

## Priority 4 — Remove hardcoded test password ✅

**Risk:** 🔴 Critical — Hardcoded password `KLRss!650` in 66 source files, committed to git history

- **Commit:** `cd391fb`
- **Files modified:** 72 (66 test specs, 3 config files, 3 docs)
- Replaced all hardcoded password instances with `process.env.TEST_PASSWORD`
- Updated `tests/utils/test-config.js` — removed fallback default
- Updated `tests/maestro/config.yaml` and `run-tests.sh`
- Redacted password from `tests/maestro/README.md` and `shared/database/MIGRATION_NEEDED.md`
- Added `TEST_PASSWORD=` to `.env.example`

**⚠️ BREAKING CHANGE:** Tests now require `TEST_PASSWORD` env var. Must be set in `.env.local` or CI secrets.

**⚠️ NOTE:** The password remains in git history (in `dist/` build artifacts and prior commits). Consider:
1. Setting `TEST_PASSWORD` in GitHub Actions secrets
2. Rotating the actual password if it's used in production auth
3. Running `git filter-branch` or BFG Repo-Cleaner if full history scrub is needed

---

## Push Status

| Repo | Remote | Status |
|------|--------|--------|
| sailorskills-billing | `github.com:standardhuman/sailorskills-billing.git` | ✅ Pushed |
| sailorskills-platform | `github.com:standardhuman/sailorskills-docs.git` | ✅ Pushed |
| briancline-co/website | `github.com:standardhuman/briancline.io.git` | ✅ Pushed |
| briancline-co/scheduler | `github.com:standardhuman/bc-scheduler.git` | ✅ Pushed |

---

## Recommendations

1. **Immediate:** Set `TEST_PASSWORD` in CI secrets (GitHub Actions) and local `.env.local`
2. **Short-term:** Rotate the auth password since it's in git history
3. **Short-term:** Evaluate `@wdio/mocha-framework` upgrade to fix remaining 3 vulns
4. **Long-term:** Run BFG Repo-Cleaner on billing repo to scrub password from history
5. **Long-term:** Add pre-commit hook with `detect-secrets` or similar to prevent future credential leaks
