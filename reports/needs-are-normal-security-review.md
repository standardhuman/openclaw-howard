# Security Review: Needs Are Normal (needsarenormal.com)

## Risk Assessment
**Overall:** 🔴 High

**Reviewed:** 2026-03-10
**Reviewer:** Cyrus (Security Specialist)
**Repo:** ~/AI/business/needs-are-normal/
**Stack:** Next.js + Supabase + Stripe + Printful + Vercel

---

## Vulnerabilities Found

### 🔴 Critical

#### 1. Live API Keys Committed to Git History
**Impact:** Full compromise of all integrated services. Anyone with repo access (or if the repo were ever made public) gets:
- **Supabase service role key** — bypasses ALL Row Level Security, full database admin access
- **Stripe secret key** (test mode) — can create charges, read customer data, manage account
- **OpenAI API key** — can rack up charges on Brian's account
- **Gemini API key** — same
- **Printful API key** — can create/cancel orders, access customer shipping addresses

**Evidence:**
- `local.env` is tracked in git (committed in `cddec73` and `a4ff761`) with ALL secrets in plaintext
- `.env.local` also contains real credentials (not committed, but `local.env` IS committed)
- `scripts/find-gray-colors.ts` has Printful API key **hardcoded directly in source**: `const PRINTFUL_API_KEY = 'Gynz88CzYhOqtYpdFcvUMv8DbE5zNhSKpKdjxrPF'`
- `scripts/seed-product-variants.ts` has hardcoded fallback values for both `SUPABASE_SERVICE_ROLE_KEY` and `PRINTFUL_API_KEY`
- Even if `local.env` is deleted now, **the keys persist in git history forever**

**Remediation:**
1. **IMMEDIATELY rotate ALL keys:** Supabase service role key, Stripe secret key, OpenAI API key, Gemini API key, Printful API key
2. Add `local.env` to `.gitignore` (`.env*` already covers `.env.local` but NOT `local.env`)
3. Remove `local.env` from git tracking: `git rm --cached local.env`
4. Consider using `git filter-repo` or BFG Repo-Cleaner to purge secrets from history
5. Remove hardcoded keys from script files
6. Store all secrets in Vercel environment variables only

---

#### 2. No Admin Route Protection — Zero Authentication/Authorization
**Impact:** Anyone can access `/admin` and `/admin/ai-designer` without being logged in. The AI Designer generates images using the OpenAI API (burning credits) and uploads them to Supabase storage.

**Evidence:**
- `src/app/admin/page.tsx` — plain page component, no auth check whatsoever
- `src/app/admin/ai-designer/page.tsx` — client component, no auth check
- `src/app/admin/ai-designer/actions.ts` — server action checks for `auth.getUser()` but any registered user can call it (no role check, no admin role)
- **No middleware.ts exists anywhere** — there is no route-level auth protection at all
- No RBAC system — no admin role concept in the database

**Remediation:**
1. Create `middleware.ts` at the project root to protect `/admin/*` routes
2. Add an `is_admin` or `role` column to the `profiles` table
3. Check admin status in both middleware AND server actions (defense in depth)
4. The `generateAiDesignAction` should verify the user is an admin, not just authenticated

---

#### 3. Client-Controlled Payment Amount
**Impact:** A malicious user could pay less than the actual order total. The `createPaymentIntentAction` accepts `amount` directly from the client without server-side verification.

**Evidence:**
- `src/app/checkout/page.tsx` calculates `grandTotal` client-side, then passes it directly to `createPaymentIntentAction`
- `src/app/checkout/actions.ts` — `createPaymentIntentAction` only checks `amount > 0`, doesn't verify it matches any cart/order total
- An attacker could call the server action with `amount: 1` (1 cent) and get a valid PaymentIntent

**Remediation:**
1. `createPaymentIntentAction` should accept cart item IDs and quantities, then calculate the total server-side from database prices
2. Alternatively, create the PaymentIntent only after `createOrderAction` and derive the amount from the order record
3. Verify the amount in the Stripe webhook handler matches the order total before marking as paid

---

### 🟡 Medium

#### 4. Printful Webhook Has No Signature Validation
**Impact:** Anyone can send fake webhook events to `/api/webhooks/printful` and manipulate order statuses (mark orders as shipped, canceled, returned).

**Evidence:**
- `src/app/api/webhooks/printful/route.ts` — the webhook secret check is optional: `if (webhookSecret) { ... }` — and `PRINTFUL_WEBHOOK_SECRET` is empty in `.env.local`
- An attacker who discovers the webhook URL can forge order status updates

**Remediation:**
1. Set a strong `PRINTFUL_WEBHOOK_SECRET` value
2. Make the secret check mandatory (fail if not configured)
3. Consider IP allowlisting for Printful webhook IPs if available

---

#### 5. Stripe Webhook Secret Not Configured
**Impact:** While the Stripe webhook handler does verify signatures (good), the `STRIPE_WEBHOOK_SECRET` is set to `whsec_YOUR_WEBHOOK_SECRET_HERE` — a placeholder. If deployed with this value, signature verification would fail on all real events, or worse, if the value is empty, Stripe events go unprocessed.

**Evidence:**
- `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE`
- The handler correctly checks for and validates the secret, so this is more of a configuration issue

**Remediation:**
1. Set the real webhook signing secret from the Stripe Dashboard
2. Verify webhooks are actually being received and processed in production

---

#### 6. Multiple Tables Missing RLS
**Impact:** These tables are accessible to any user (anon or authenticated) via the Supabase client, because RLS is not enabled:

| Table | RLS Status | Risk |
|-------|-----------|------|
| `nvc_expressions` | ❌ No RLS | Low — public data, but writable by anyone |
| `ai_generated_images` | ❌ No RLS | Medium — anyone can insert/delete image records |
| `site_products` | ❌ No RLS | Medium — anyone can modify product data/prices |
| `printful_base_products` | ❌ No RLS | Low — internal data exposed |
| `product_mockups` | ❌ No RLS | Low — anyone can modify mockup associations |
| `ai_art_styles` | ❌ Explicitly disabled | Low — reference data but writable |
| `product_variants` | ✅ Has RLS | OK |

**Evidence:**
- `dump.sql` shows `GRANT ALL ON TABLE ... TO "anon"` for every table
- Only `orders`, `order_items`, `profiles`, and `product_variants` have RLS enabled
- Since the client uses the anon key, anyone with the Supabase URL + anon key (both public via `NEXT_PUBLIC_` vars) can directly modify products, prices, expressions, and images

**Remediation:**
1. Enable RLS on ALL tables
2. Add read-only policies for public data (`site_products`, `nvc_expressions`)
3. Restrict writes to admin users or service role only
4. At minimum: `ALTER TABLE public.site_products ENABLE ROW LEVEL SECURITY;` + read-only policy

---

#### 7. Storage Upload Policy Too Permissive
**Impact:** Any authenticated user can upload files to the `ai_images` bucket.

**Evidence:**
- Migration `20250519151649_revert_to_secure_storage_policy.sql` creates a policy allowing ANY authenticated user to upload
- Previously there was a `TEMP Allow ALL uploads` policy (even anon could upload) — it was partially fixed, but should be admin-only

**Remediation:**
1. Restrict uploads to admin users only
2. Add file type/size validation at the application level
3. Consider virus/malware scanning for uploaded content

---

#### 8. No Rate Limiting on Any Endpoint
**Impact:** All API routes and server actions are vulnerable to abuse — brute force login, payment intent spam, shipping rate flooding, AI image generation spam.

**Evidence:**
- No rate limiting middleware, no `rate-limit` package in dependencies
- `createPaymentIntentAction` can be called unlimited times (each creates a Stripe PaymentIntent)
- `generateAiDesignAction` can be called unlimited times (each burns OpenAI API credits)
- Login/signup have no brute-force protection

**Remediation:**
1. Add rate limiting via Vercel Edge Middleware or `@upstash/ratelimit`
2. Priority endpoints: login, signup, payment intent creation, AI generation
3. Consider Stripe's built-in idempotency keys

---

#### 9. No Security Headers (CSP, X-Frame-Options, etc.)
**Impact:** Site is vulnerable to clickjacking, XSS via injected scripts, MIME sniffing attacks.

**Evidence:**
- Response headers from `curl -sI https://needsarenormal.com` show NO:
  - `Content-Security-Policy`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
- Only `strict-transport-security` is set (by Vercel automatically)
- `next.config.ts` has no `headers()` configuration

**Remediation:**
Add security headers in `next.config.ts`:
```typescript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Content-Security-Policy', value: "default-src 'self'; ..." },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }];
}
```

---

#### 10. Order Confirmation Page Leaks Order Details Without Auth
**Impact:** Anyone with an order ID can view order details (items, shipping address, email, payment info) without being authenticated.

**Evidence:**
- `src/app/order-confirmation/page.tsx` fetches order data using the anon Supabase client
- The `orders` table has RLS, but the `anon` role has INSERT access via `"Allow anonymous users to create orders"` policy
- Order confirmation URL with `order_id` parameter is the only gate — UUIDs are guessable in theory with enough attempts
- The page also queries `order_items` and `site_products` directly

**Remediation:**
1. Add a verification token to order confirmation URLs
2. Or require authentication to view order details
3. At minimum, add a time-limited signed token for guest order viewing

---

### 🟢 Low

#### 11. npm Audit: 6 Known Vulnerabilities
**Impact:** 2 moderate, 4 high severity vulnerabilities in dependencies.

**Evidence:**
- `next` has HTTP request deserialization DoS and unbounded memory consumption issues
- `qs` has arrayLimit bypass DoS issues
- `tar` (via `supabase` package) has multiple path traversal vulnerabilities
- All fixable via `npm audit fix`

**Remediation:**
Run `npm audit fix` and update dependencies.

---

#### 12. Two Different Supabase Projects Referenced
**Impact:** Confusion/misconfiguration risk. The codebase references two different Supabase projects.

**Evidence:**
- `local.env` references `nejkghwlnazisqlezmdt.supabase.co` (appears to be a dev/old project)
- `.env.local` references `spoxyweqfhnvcmshqejq.supabase.co` (the production project)
- `next.config.ts` allows images from `spoxyweqfhnvcmshqejq` only
- The old project's service role key is also committed to git

**Remediation:**
1. Remove the old `local.env` entirely
2. Rotate keys on the old Supabase project too (or delete it if unused)

---

#### 13. Login Error Messages Leak Info via URL
**Impact:** Minor information disclosure. Error messages are passed via URL query parameters.

**Evidence:**
- `src/app/login/actions.ts`: `redirect('/login?error=' + encodeURIComponent(error.message))`
- Supabase auth error messages can reveal whether an email exists in the system

**Remediation:**
Use generic error messages: "Invalid credentials" regardless of whether the email exists.

---

#### 14. Open Signup — No Email Verification Enforcement
**Impact:** Anyone can create an account. Combined with #2 (no admin protection), this means any random signup gets access to admin features.

**Evidence:**
- `src/app/login/actions.ts` — `signUp` has `emailRedirectTo` commented out
- No indication that email verification is enforced before granting access

**Remediation:**
1. Enable email verification in Supabase Auth settings
2. Require verified email before allowing access to authenticated features

---

## Recommendations

### Immediate Actions (do today)
1. 🔑 **Rotate ALL API keys** — Supabase service role, Stripe secret, OpenAI, Gemini, Printful
2. 🗑️ **Remove `local.env` from git** — `git rm --cached local.env && echo "local.env" >> .gitignore`
3. 🔒 **Remove hardcoded keys** from `scripts/find-gray-colors.ts` and `scripts/seed-product-variants.ts`

### Short-Term (this week)
4. 🛡️ **Add middleware.ts** for admin route protection with role-based access
5. 💰 **Fix payment amount validation** — calculate totals server-side
6. 🔐 **Enable RLS** on all unprotected tables
7. 🔗 **Set real Stripe webhook secret** and make Printful webhook secret mandatory
8. 🧹 **Run `npm audit fix`**

### Long-Term (this month)
9. 📋 **Add security headers** via `next.config.ts`
10. ⏱️ **Implement rate limiting** on critical endpoints
11. 🔍 **Consider git history cleanup** with BFG Repo-Cleaner
12. 📧 **Enable and enforce email verification**
13. 🧪 **Add automated security scanning** to CI/CD pipeline

---

## Testing Performed
- [x] Static analysis (manual code review)
- [x] Dependency scan (`npm audit`)
- [x] Secrets scan (git history, source files, env files)
- [x] Manual code review (all routes, actions, webhooks, auth, RLS)
- [x] Configuration review (Supabase migrations, Next.js config, headers)
- [x] Live header analysis (`curl -sI https://needsarenormal.com`)
- [ ] Dynamic application testing (not performed — would require running the app)
- [ ] Penetration testing (not performed — out of scope for AI review)

## Notes
- This is an AI-assisted code review. It covers static analysis and architectural concerns but cannot replace hands-on penetration testing.
- The Stripe integration is using **test mode keys** (`sk_test_`, `pk_test_`). Before going live, ensure production keys are properly managed (Vercel env vars only, never in code).
- The Stripe webhook handler has good idempotency logic and proper signature verification — that's well done.
- The order RLS policies for authenticated users are correctly implemented.
- The repo appears to be private on GitHub (auth failed on remote check), which somewhat limits the blast radius of the committed secrets — but they should still be rotated immediately.
