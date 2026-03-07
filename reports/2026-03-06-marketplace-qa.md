# SailorSkills Marketplace QA Audit — March 6, 2026

**Tested URL:** marketplace.sailorskills.com (production)
**Target production URL:** sailorskills.com (domain switch pending)
**Conducted by:** Blake (QA), consolidated by Howard

## Executive Summary

The marketplace has a solid foundation — clean homepage, 408 providers in the directory, working category pages, and a polished cost estimator. But there are significant issues: missing API keys, database schema mismatches, broken routes, and a React runtime crash.

---

## 🔴 CRITICAL (4 issues)

### 1. Google Maps API Key Not Configured
`VITE_GOOGLE_MAPS_API_KEY` is empty in production. This breaks:
- Location search on services page (textbox permanently disabled: "Loading mapping service...")
- Map embeds on every provider detail page ("Google Maps Platform rejected your request")
- The LocationManager service entirely
- Console flooding with 100+ Google Maps errors per session

### 2. Supabase Database Schema Out of Sync
Frontend expects tables/columns that don't exist:
- `kb_articles` → Learn page can't load, falls back to homepage
- `invoices` → Payment pages crash
- `boats.share_token` → Portal crashes ("Unable to Load Portal")
- `provider_vouches` and `provider_referrals` → 400 errors on every provider page

### 3. React Runtime Crash
`TypeError: i is not a function` in `Engine-LIOzEhjR.js` causes full error boundary crashes, producing random error screens ("Invoice Error", "Unable to Load Portal") on certain navigation paths.

### 4. Footer Links to Non-Existent Pages
Every page links to Privacy Policy, Terms of Service, Status, Help Center — all point to `href="#"`. Missing Privacy Policy and Terms of Service is a legal liability for a marketplace.

---

## 🟠 IMPORTANT (6 issues)

### 5. Five pages route to wrong content
- `/learn` → renders homepage (missing DB table)
- `/assistant` → renders services directory
- `/ask` → renders auth/sign-up page
- `/about` → renders services directory (no route exists)
- `/provider-profile` → renders AI chatbot

### 6. Three footer-linked pages return 404
`/contact`, `/safety`, `/about`

### 7. Sitemap points to wrong domain
All URLs reference `sailorskills.com` instead of `marketplace.sailorskills.com`

### 8. Sign-up says "Coming Soon!"
The "Get Started" CTA in the header dead-ends new users

### 9. OG image uses relative path
Instead of absolute URL — social sharing preview broken

### 10. No canonical tags
Combined with routing issues, this is an SEO problem

---

## 🟡 NICE-TO-HAVE (7 issues)

- No SSR — every page has identical `<title>` and `<meta description>`
- No pagination on 408-provider list
- Provider data quality (home addresses showing, non-marine businesses, out-of-area providers)
- Phone number formatting inconsistent
- Estimate calculator has placeholder phone number "(619) 555-HULL"
- Missing `twitter:card` meta tag
- Location search has no fallback when Maps API fails

---

## ✅ What's Working Well

- **Homepage** — clean design, professional, well-structured
- **Provider directory** — 408 providers with ratings, addresses, service categories, phone/website links
- **Service category + location pages** — proper breadcrumbs, filtering, Featured/Verified badges
- **Provider detail pages** — good layout with services, contact, claim listing CTA, review section
- **Hull Cleaning Cost Estimator** — polished interactive calculator
- **Auth page** — Google/Apple SSO, email/password, tab navigation
- **Custom 404 page** — well-themed
- **Performance** — 58ms TTFB, Vercel CDN with caching, ~870KB total JS (reasonable)

---

## Recommended Fix Order

1. **Set `VITE_GOOGLE_MAPS_API_KEY` in Vercel env vars** — unblocks location features
2. **Run Supabase migrations** for missing tables (`kb_articles`, `invoices`, `provider_vouches`, `provider_referrals`, `boats.share_token`)
3. **Fix or remove broken routes** — `/learn`, `/assistant`, `/ask`, `/about`, `/contact`, `/safety`, `/provider-profile`
4. **Create Privacy Policy + Terms of Service pages**
5. **Fix OG image + add canonical tags**
6. **Update sitemap domain**
7. **Domain switch: sailorskills.com → marketplace Vercel project**
8. **Provider data cleanup**

---

## Untested (needs auth credentials)

- AI Assistant flow
- Order flow
- Boat Portal (needs valid share token)
- Admin pages (providers, trust graph, quotes, reviews, verifications)
- Projects page
- Network search
- Ask Neighbors
