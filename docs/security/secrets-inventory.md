# Secrets Inventory

**Last updated:** 2026-03-08  
**Maintained by:** Cyrus  

---

## Active Secrets Across All Codebases

### Supabase — SailorSkills Project (`fzygakldvvzxmahkdylq`)

| Secret | Type | Where Referenced | Properly in .env? | Hardcoded? | Expiry | Status |
|--------|------|-----------------|-------------------|------------|--------|--------|
| Supabase URL | URL | marketplace `client.ts`, billing `CustomerDataService.js`, billing `supabase-init.js`, briancline.co `DivingOrder.jsx`, scheduler `supabase.ts`, billing API files | ⚠️ Mixed | Yes — billing `CustomerDataService.js:9`, billing `supabase-init.js`, briancline.co `DivingOrder.jsx:19` | N/A | ⚠️ Needs cleanup |
| Supabase Anon Key | JWT (anon role) | Same files as URL above | ⚠️ Mixed | Yes — billing `CustomerDataService.js:10`, billing `supabase-init.js:10`, briancline.co `DivingOrder.jsx:20`, scheduler `.env.prod` (git-tracked) | 2035 (JWT exp) | ⚠️ Needs cleanup |
| Supabase Service Role Key | JWT (service_role) | billing `conditions-logging.js:186`, billing `enhanced-charge-flow.js:1017`, billing `invoice-flow.js:398` | ❌ NO | 🔴 YES — in 3 client-side JS files | 2035 (JWT exp) | 🔴 CRITICAL — rotate after removing from source |

### Supabase — Tahoe Project (`aaxnoeirtjlizdhnbqbr`)

| Secret | Type | Where Referenced | Properly in .env? | Hardcoded? | Expiry | Status |
|--------|------|-----------------|-------------------|------------|--------|--------|
| Supabase URL | URL | tahoe `supabase.js:2` | Also in `.env` | Yes — `supabase.js:2` | N/A | ⚠️ Move to env var |
| Supabase Anon Key | JWT (anon role) | tahoe `supabase.js:3`, tahoe `.env` | Also in `.env` | Yes — `supabase.js:3` | 2035 (JWT exp) | ⚠️ Move to env var |

### Stripe

| Secret | Type | Where Referenced | Properly in .env? | Hardcoded? | Expiry | Status |
|--------|------|-----------------|-------------------|------------|--------|--------|
| Stripe Live Publishable Key (`pk_live_pri1Iepe...`) | Publishable key | billing `supabase-init.js:22`, billing `wizard-payment.js:86` | ❌ | Yes — 2 files | Does not expire | ⚠️ Move to env var |
| Stripe Secret Key (live) | Secret key | billing API files (`search-customers-with-boats.js`, `stripe-customers.js`) via `process.env.STRIPE_SECRET_KEY` | ✅ Yes | No | Does not expire (rotate annually) | ✅ Good — check rotation date |
| Stripe Secret Key (test) | Secret key | billing `.env.local` | ✅ Yes | No | Does not expire | ✅ Good |
| Stripe Webhook Signing Secret | Secret | Referenced in briancline.co `.env` template | ✅ Yes | No | Does not expire | ✅ Good |

### Resend (Email)

| Secret | Type | Where Referenced | Properly in .env? | Hardcoded? | Expiry | Status |
|--------|------|-----------------|-------------------|------------|--------|--------|
| Resend API Key | API key | briancline.co `.env.local` | ✅ Yes | No | Does not expire | ✅ Good |

### Google OAuth

| Secret | Type | Where Referenced | Properly in .env? | Hardcoded? | Expiry | Status |
|--------|------|-----------------|-------------------|------------|--------|--------|
| Google Client ID | OAuth client ID | briancline.co `.env` | ✅ Yes | No | Does not expire | ✅ Good |
| Google Client Secret | OAuth secret | briancline.co `.env` | ✅ Yes | No | Does not expire | ✅ Good |
| Google Refresh Token | OAuth refresh | briancline.co `.env` | ✅ Yes | No | Expires if unused 6 months | ⚠️ Monitor usage |

### Telegram

| Secret | Type | Where Referenced | Properly in .env? | Hardcoded? | Expiry | Status |
|--------|------|-----------------|-------------------|------------|--------|--------|
| Telegram Bot Token | Bot token | telegram bridge `.env`, `index.js` via `process.env.TELEGRAM_BOT_TOKEN` | ✅ Yes | No | Does not expire (revoke via BotFather) | ✅ Good |

### Dashboard / Infrastructure

| Secret | Type | Where Referenced | Properly in .env? | Hardcoded? | Expiry | Status |
|--------|------|-----------------|-------------------|------------|--------|--------|
| Anthropic Admin Key | API key | dashboard `collect-data.js` via `process.env.ANTHROPIC_ADMIN_KEY` | ✅ Yes | No | TBD | ✅ Good — check expiry |
| DeepSeek API Key | API key | dashboard `collect-data.js` via `process.env.DEEPSEEK_API_KEY` | ✅ Yes | No | Does not expire | ✅ Good |
| Vercel OIDC Token | Token | dashboard `.env.local`, scheduler `.env.vercel` | ✅ Yes | No | Auto-rotated by Vercel CLI | ✅ Good |

### Application Passwords (Non-API)

| Secret | Type | Where Referenced | Properly in .env? | Hardcoded? | Expiry | Status |
|--------|------|-----------------|-------------------|------------|--------|--------|
| Scheduler Admin Password | Plaintext password | scheduler `src/utils/auth.ts:7` — value: `admin123` | ❌ NO | 🔴 YES | N/A | 🔴 CRITICAL — remove, use Supabase Auth |
| Dashboard Password | Client-side hash | dashboard `index.html:715` — value: `pocket` (in comment) | ❌ NO | 🔴 YES | N/A | 🟠 HIGH — replace with real auth or remove |
| briancline.co Admin Password | Password | briancline.co `.env.local` via `ADMIN_PASSWORD` | ✅ Yes | No | N/A | ✅ OK (env var, but consider Supabase Auth) |

### Auto-Claude / Development

| Secret | Type | Where Referenced | Properly in .env? | Hardcoded? | Expiry | Status |
|--------|------|-----------------|-------------------|------------|--------|--------|
| Claude Code OAuth Token | OAuth token | billing `.auto-claude/.env` | ✅ Yes (gitignored) | No | TBD | ⚠️ Check expiry |
| OpenAI API Key | API key | billing `.auto-claude/.env` template | ✅ Yes | No | Does not expire | ✅ Good |
| Google API Key | API key | billing `.auto-claude/.env` template | ✅ Yes | No | Does not expire | ✅ Good |

---

## Secrets Requiring Immediate Action

| Priority | Secret | Action | Owner |
|----------|--------|--------|-------|
| 🔴 P0 | Supabase Service Role Key (SailorSkills) | Remove from client-side billing source → rotate key | Marcel + Cyrus |
| 🔴 P0 | Scheduler Admin Password ("admin123") | Delete `auth.ts`, use Supabase Auth exclusively | Ellis |
| 🔴 P0 | Scheduler `.env.prod` JWT tokens | Untrack from git, rotate keys | Ellis + Cyrus |
| 🟠 P1 | Supabase Anon Key hardcoded (billing, briancline.co, tahoe) | Move to env vars | Marcel, Ellis |
| 🟠 P1 | Stripe Live Key hardcoded (billing) | Move to env var | Marcel |
| 🟠 P1 | Dashboard password "pocket" | Remove or replace auth | Marcel |
| 🟡 P2 | Tahoe `.gitignore` missing `.env` | Add before git init | TBD |

---

## Rotation Schedule

| Secret | Rotation Policy | Last Rotated | Next Rotation |
|--------|----------------|-------------|---------------|
| Supabase Service Role Key (SailorSkills) | **Immediately** (after removing from source) | Never | **ASAP** |
| Supabase Anon Key (SailorSkills) | After hardcoded references removed | Never | After P1 fixes |
| Supabase Keys (Tahoe) | After source cleanup | Never | After P1 fixes |
| Stripe Live Secret Key | Annually | Unknown | TBD — check Stripe dashboard |
| Stripe Live Publishable Key | After env var migration | Never | After P1 fixes |
| Google Refresh Token | Monitor for 6-month expiry | Unknown | TBD |
| Telegram Bot Token | Only if compromised | Unknown | N/A |
| Anthropic Admin Key | TBD | Unknown | TBD |
| Dashboard Password | Immediately (exposed in source) | N/A | N/A — remove entirely |

---

## Notes

- Supabase anon keys are designed to be public (RLS protects data), but hardcoding prevents rotation and conflates environments. Standard practice: always load from env vars.
- The service role key in billing is the only secret that provides elevated database access. This is the highest priority fix.
- Several secrets have unknown "last rotated" dates. Brian may need to check service dashboards (Stripe, Supabase, Google Cloud Console) to fill these in.
- Consider adopting 1Password for secrets management across the team (skill available at `~/clawd/skills/1password/`).
