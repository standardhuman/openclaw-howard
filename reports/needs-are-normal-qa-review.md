# Review: Needs Are Normal — QA Review

**Reviewed:** 2026-03-10  
**Site:** https://needsarenormal.com  
**Repo:** ~/AI/business/needs-are-normal/  
**Stack:** Next.js 16.1 / React 19 / Tailwind 4 / Supabase / Stripe / Printful  
**Last active development:** Dec 24, 2025  

## Verdict: 🛑 Needs Work

The site has a solid foundation — clean homepage design, well-structured checkout flow, proper webhook handling — but it has **build-breaking TypeScript errors**, **security gaps**, and several functional issues that need fixing before it can ship.

---

## Issues Found

### 🛑 Must Fix

#### 1. Build is broken — TypeScript errors prevent compilation
`npm run build` fails with errors in two files:

**`src/app/cart/page.tsx`** — References `getCartItemKey`, `variant_mockup_url`, `size`, and `color` properties that don't exist on `CartItem`/`CartContextType`. The cart page was written for a variant-aware cart system that was never implemented in the context.

**`src/app/order-confirmation/page.tsx`** — References `shipping_address.state` and `shipping_address.country` but the `OrderAddress` type uses `state_code` and `country_code`.

**Full error list:**
```
cart/page.tsx(15): 'getCartItemKey' does not exist on type 'CartContextType'
cart/page.tsx(75): 'variant_mockup_url' does not exist on type 'CartItem'
cart/page.tsx(98-102): 'size' and 'color' do not exist on type 'CartItem'
order-confirmation/page.tsx(155): 'state' does not exist on type 'OrderAddress'
order-confirmation/page.tsx(156): 'country' does not exist on type 'OrderAddress'
```

**Impact:** The site cannot be rebuilt or redeployed. The current live deployment is running from a stale `.next` build from Dec 24.  
**Fix:** Update cart page to use `item.id` as the key (no variant support yet), remove size/color/variant_mockup_url references. Fix order-confirmation to use `state_code` and `country_code`.

#### 2. Admin area has zero authentication protection
`/admin` and `/admin/ai-designer` are publicly accessible. No middleware, no auth check, no route guards. Anyone who knows the URL can access the admin dashboard and AI designer.

**Impact:** The AI designer makes authenticated Supabase calls (which would fail for unauthenticated users), but the admin page itself is visible to the public, and the route structure is discoverable.  
**Fix:** Add Next.js middleware to protect `/admin/*` routes, checking for authenticated session and an admin role.

#### 3. Printful webhook endpoint has no signature verification
The Printful webhook handler (`src/app/api/webhooks/printful/route.ts`) uses an optional query parameter `?secret=...` for auth. If `PRINTFUL_WEBHOOK_SECRET` is not set, the endpoint accepts **any** POST request and can modify order statuses (shipped, canceled, returned) in the database.

**Impact:** An attacker could forge webhook payloads to mark orders as shipped/canceled/returned.  
**Fix:** Make webhook secret verification mandatory (not optional). Consider also validating Printful's IP ranges or using HMAC signatures.

#### 4. `customer_email` column missing from database schema
The `Order` TypeScript type includes `customer_email`, and `createOrderAction` inserts it. But the `orders` table schema in `supabase/all_migrations.sql` never adds this column. If it was added manually to the live DB, it's not tracked in migrations.

**Impact:** Any new environment setup from migrations would fail on order creation. If the column doesn't exist in production, orders can't be created at all.  
**Fix:** Add a migration for `ALTER TABLE public.orders ADD COLUMN customer_email TEXT;`

#### 5. NPM vulnerabilities — 6 known issues (4 high severity)
`npm audit` reports 6 vulnerabilities. The high-severity ones are in `tar` (dependency of `supabase` CLI) and include path traversal and symlink attacks. The moderate ones are in `next` and `qs`.

**Fix:** Run `npm audit fix`. Update `next` and `supabase` packages to patched versions.

---

### ⚠️ Should Fix

#### 6. `/expressions` route returns 404 on live site
The expressions page exists in the codebase but returns a 404 at `needsarenormal.com/expressions`. Likely it was excluded from the deployment or has a runtime error. It also still references "NVC" terminology directly (title says "NVC Expressions," mentions "Nonviolent Communication") which contradicts the documented decision to scrub NVC references.

Additionally, the expressions page uses the browser Supabase client (`supabaseClient.ts`) instead of the server client in a server component. This works but bypasses SSR cookie-based auth.

**Fix:** Either remove the expressions page (it's not linked from navigation) or update it to use `createClient` from `@/lib/supabase/server`, rename to match "connected communication" language.

#### 7. Missing `placeholder-product.png` in public directory
`ProductCard`, `CartPage`, and `ProductPage` all reference `/placeholder-product.png` as fallback, but this file doesn't exist in `/public/`. Placeholder images exist at `/public/placeholders/tshirt.png` and `mug.png` but aren't referenced.

**Impact:** Products without mockup URLs show a broken image.  
**Fix:** Either add `placeholder-product.png` to `/public/` or update references to use `/placeholders/tshirt.png`.

#### 8. Newsletter form is non-functional
The homepage newsletter signup form has no `action`, no `onSubmit`, and no API endpoint. Submitting it does nothing. No email service integration exists.

**Impact:** Users who try to subscribe get no feedback and their email goes nowhere.  
**Fix:** Either connect it to a mailing list service (Mailchimp, Buttondown, etc.) or remove the section until it's ready.

#### 9. Product detail page design inconsistency
The main site uses a warm sage/terracotta/cream color palette. The product detail page (`/products/[id]`) uses purple (`text-purple-700`, `hover:text-purple-600`) which matches the cart/checkout/auth pages but clashes with the homepage/products listing. The breadcrumb on the product detail page also uses purple links while the products listing breadcrumb uses sage.

**Impact:** Visual inconsistency makes the site feel unfinished.  
**Fix:** Unify color scheme. The homepage sage palette is the stronger brand direction.

#### 10. RLS policies may block webhook order updates
The `orders` table has RLS enabled with policies that restrict updates to authenticated users where `auth.uid() = user_id`. The Stripe webhook handler uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) — correct. But `submitOrderToPrintfulAction` in `checkout/actions.ts` uses the cookie-based server client which IS subject to RLS. If the RLS update policy only allows updating `pending_payment`/`pending_fulfillment` status orders, the status update to `processing` after Printful submission might fail since the order was just updated to `paid`.

**Fix:** Review RLS policies for the webhook flow. The Stripe webhook handler correctly uses the service role key, but the client-side Printful submission path should also use it or have RLS policies that allow the `paid -> processing` transition.

#### 11. Duplicate auth implementations
There are two login flows:
- `src/app/login/page.tsx` — Client-side login using browser Supabase client
- `src/components/Auth/LoginForm.tsx` — Server action login using `login()` from `actions.ts`

Same for signup:
- `src/app/signup/page.tsx` — Client-side signup
- `src/components/Auth/SignupForm.tsx` — Client-side signup (different component)

The components in `Auth/` (`LoginForm.tsx`, `SignupForm.tsx`) are never imported anywhere — they're dead code.

**Fix:** Delete `src/components/Auth/LoginForm.tsx` and `src/components/Auth/SignupForm.tsx`. Also remove the server actions `login()` and `signup()` from `src/app/login/actions.ts` since the pages use client-side auth directly.

#### 12. Stripe API version is a future/unreleased version
```typescript
apiVersion: '2025-08-27.basil'
```
This appears in both `checkout/actions.ts` and the Stripe webhook handler. This is likely a development preview version. For production, pin to a stable, released API version.

**Fix:** Update to the latest stable Stripe API version.

---

### 💡 Consider

#### 13. Homepage "Best Sellers" shows "Loading products..." when DB returns empty
When no products exist (or Supabase query fails silently), the featured products section displays "Loading products..." — but products aren't loading, they just don't exist. This is misleading.

**Fix:** Change fallback text to "Coming soon" or "No products available" when the array is empty (this is a static server render, not a loading state).

#### 14. No size/color variant selection in product UI
The `types.ts` file defines `ProductVariant`, `SiteProductWithVariants`, `AVAILABLE_SIZES`, and `AVAILABLE_COLORS`, but none of this is used in the UI. Products are sold as single variants. The product page says "7 sizes | 3 colors" in the info bar but there's no selector.

This matches the HANDOFF.md note that size/color variant UI is still a remaining task.

#### 15. Dark mode styles could conflict
`globals.css` defines a dark mode media query that changes backgrounds to `#0a0a0a`, but the entire site is designed for light mode with custom brand colors. On a dark-mode browser, the background would go dark while text colors (charcoal, stone, etc.) would be near-invisible.

**Fix:** Either remove the dark mode media query or properly support dark mode throughout.

#### 16. Console logging in production
`CartContext.tsx` has extensive `console.log` statements for cart operations. These should be removed or gated behind a debug flag for production.

#### 17. `local.env` file in repo root
There's a `local.env` file alongside `.env.local`. The `.gitignore` pattern `.env*` catches both, so no secrets are committed. But having two env files is confusing. `local.env` appears to be the original template, now redundant with `credentials.example.env`.

#### 18. Order confirmation page uses unoptimized `<img>` tag
The order confirmation page uses raw `<img>` elements for product thumbnails instead of Next.js `<Image>` component, missing out on optimization, lazy loading, and responsive sizing.

#### 19. No `<meta>` description per page
Only the root layout sets metadata. Individual pages (products, cart, checkout, etc.) don't set page-specific titles or descriptions, which hurts SEO.

#### 20. Footer shows "© 2025" on some pages
The homepage footer correctly uses `new Date().getFullYear()` (showing 2026), but the web_fetch of cart/admin/login pages showed "© 2025". This might be a caching issue from the Dec 2025 deployment, but it's worth verifying after a fresh build.

---

## What's Good

- **Homepage design is solid.** The warm color palette, messaging hierarchy, and overall layout are polished and on-brand. The copy is genuine and avoids generic e-commerce speak.

- **Checkout flow is well-architected.** Proper Stripe integration with PaymentElement, shipping rate calculation via Printful API, order creation in Supabase, metadata linking for webhook reconciliation — this is production-quality architecture.

- **Webhook handlers are well-structured.** Both Stripe and Printful webhooks have proper event routing, error handling, idempotency checks, and graceful failure modes.

- **Supabase server client setup is correct.** The SSR cookie-based client is properly implemented for server components.

- **No secrets in source code.** All API keys are properly in `.env.local`, `.env*` is gitignored, and no hardcoded tokens appear in the codebase.

- **Good separation of concerns.** Server actions for mutations, server components for data fetching, client components for interactivity — follows Next.js best practices.

---

## Summary

The biggest blockers are:
1. **Build is broken** — can't deploy until TypeScript errors are fixed
2. **Admin is unprotected** — needs auth middleware before any real usage
3. **Printful webhook auth is optional** — needs to be mandatory

After those three, the site could function as a proof-of-concept. The remaining items are important for launch but not blocking development.

The architecture is sound. The problems are mostly about incomplete features (variants, newsletter, admin auth) and code that got ahead of the implementation (cart page written for a variant system that doesn't exist yet). A focused session or two could resolve the must-fix and should-fix items.
