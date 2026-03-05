# briancline.co Phase 2: Redesign & Unification

**Status:** Draft
**Author:** Reese (Product Manager)
**Date:** 2026-03-04 (updated 2026-03-05)
**Builder:** Marcel
**Stakeholder:** Brian Cline

---

## Context

Phase 1 is done. briancline.co has service pages (`/diving`, `/training`, `/deliveries`, `/training/faq`) that are pixel-perfect Wix recreations, plus a homepage that's Brian's personal portfolio. Wix is dead — DNS on Vercel, 196 redirects preserved.

The problem: service pages look like 2020 Wix (uppercase Montserrat, heavy layout) stapled onto a modern portfolio. None of it matches the SailorSkills Marketplace visual language. The detailing site still lives on a separate subdomain.

Phase 2 fixes this: redesign the service pages (not just port them), consolidate detailing under briancline.co, and unify the visual style with the Marketplace — while leaving the homepage and portfolio essentially untouched.

---

## Goals

1. **Redesign service pages** — rewrite copy, consolidate content, simplify, modernize. Not a port of the Wix pages. A rethink.
2. **Absorb `detailing.sailorskills.com`** into `/detailing` — single codebase, one site.
3. **Visual alignment** — service pages match the SailorSkills Marketplace style (React + Vite + Tailwind + shadcn/ui).
4. **Homepage bridge** — add a "Looking for Marine Services?" CTA to the existing homepage hero. Everything else on the homepage stays.
5. **Interactive tools** — cost calculator for diving and estimate form for detailing, styled like `marketplace.sailorskills.com/estimate`.

**Non-goals:**
- Blog (deferred)
- Homepage redesign (stays as-is except the new CTA)
- Portfolio/projects section changes (untouched)
- Backend/database/auth
- Payment processing (CTAs remain mailto or external links)

---

## Design System

### Source of Truth
Adopt the SailorSkills Marketplace design tokens from `~/AI/business/sailorskills/marketplace/src/index.css` and `tailwind.config.ts`.

### Color Palette
| Token | HSL | Usage |
|-------|-----|-------|
| `--primary` | `210 76% 39%` | Deep ocean blue — buttons, links, headings |
| `--secondary` | `187 100% 42%` | Teal — accents, hover states |
| `--accent` | `199 89% 48%` | Bright sky blue — highlights, CTAs |
| `--foreground` | `215 92% 21%` | Near-black navy — body text |
| `--background` | `0 0% 100%` | White — page background |
| `--muted` | `210 40% 96.1%` | Light gray — card backgrounds, section breaks |

### Typography
- **Headings:** Inter or system sans-serif. Bold (700) for h1/h2, Semibold (600) for h3.
- **Body:** Inter 400, `text-foreground`, 16px base.
- No more uppercase Montserrat everywhere. Clean, readable, modern.

### Components
shadcn/ui components — same as Marketplace:
- `Button` (solid primary + outline secondary)
- `Card` (service cards, testimonials, pricing)
- `Badge` (credentials, pricing tags)
- `Accordion` (FAQ sections)
- `RadioGroup`, `Input`, `Label` (calculator/estimate forms)

### Interactive Tool Style Reference
**`marketplace.sailorskills.com/estimate`** (`CostEstimator.tsx`) — boat type radio buttons with icons, length input, frequency selector, live price calculation with motion animations. This is the design pattern for both the diving cost calculator and detailing estimate form.

### Layout
- Max content width: `max-w-6xl` (1152px)
- Section padding: `py-16 md:py-24`
- Mobile-first responsive

### Shared Elements
- **Service page navbar:** Add a service nav that connects the service pages to each other and back to the homepage. Could be a sub-nav below the main site header, or integrated into the main nav.
- **Footer:** Consistent across service pages. Contact info, service links, copyright. Dark navy background matching Marketplace sidebar color.
- **CTA Pattern:** Every service page ends with a clear, warm call to action — mailto with contextual subject line.

---

## Information Architecture

```
briancline.co
├── /                   Homepage (UNCHANGED — add marine services CTA only)
├── /projects/*         Portfolio projects (UNCHANGED)
├── /diving             Hull cleaning — REDESIGN
├── /diving/calculator  Cost calculator (or inline on /diving)
├── /detailing          Boat detailing — NEW (absorb from detailing.sailorskills.com)
├── /training           Sailing lessons — REDESIGN
├── /training/faq       Training FAQ — REDESIGN
└── /deliveries         Vessel transport — REDESIGN
```

---

## Page Specifications

### Homepage `/` — MINIMAL CHANGE

**What changes:** Add a CTA in or near the hero section. Something like:

> "Looking for marine services?" → Button linking to `/diving` or a services overview anchor

That's it. The bio, portfolio section, projects — all untouched. The goal is a bridge between "Brian the builder" and "Brian the marine services provider" without redesigning the page.

**Implementation:** Could be a subtle banner, a second button in the hero, or a small card below the hero. Marcel's call on placement — keep it tasteful, not bolted on.

---

### Diving `/diving` — REDESIGN

**Current state:** Long Wix FAQ-style page with growth ratings, paint ratings, billing FAQ, cleaning process FAQ, special services, referral program. Accurate content but exhausting to read.

**Redesign direction:** Lead with value, not information. A potential customer needs to understand three things: what you do, what it costs, and how to start.

**Sections:**

1. **Hero** — "Professional Hull Cleaning · San Francisco Bay"
   - One clear sentence about what the service is
   - Price: `from $4.50/ft` (recurring) / `$6.00/ft` (one-time)
   - CTA: "Get a Free Assessment" (mailto)

2. **How It Works** — 3 steps, visual, minimal text
   - Schedule → Clean → Report (with photos and assessment ratings)

3. **Cost Calculator → Order Form** — Multi-step interactive flow, styled like Marketplace `/estimate`
   - **Replicate the full flow from `diving.sailorskills.com`** (source: `~/AI/business/sailorskills-platform/sailorskills-estimator/`)
   - Steps: Service selection → Boat length → Boat type → Hull type → Propeller count → Paint age → Last cleaned → Anodes → Result with cost breakdown
   - Result shows estimated cost, then "Proceed to Order" flows into checkout
   - Checkout: Boat info, marina, service interval, contact info, billing address, Stripe card elements, service agreement
   - **Pricing logic must be identical** — copy from `calculator.js` and `configuration.js`
   - **Stripe integration** — copy from `checkoutHandler.js`
   - Visual style: Marketplace form components (Card, RadioGroup, Input, Button)

4. **What You Get** — Consolidated "included with every service" section
   - Condition assessment (the 5-level growth scale — but condensed, not 5 separate boxes)
   - Paint condition report
   - Underwater photos
   - Anode inspection

5. **FAQ** — Accordion, but drastically trimmed
   - Keep only the questions a prospect actually asks before signing up
   - Cut the deep-dive technical content that reads like a manual
   - Maybe 5-6 questions max

6. **Referral Program** — Brief callout, not a full section

7. **CTA** — "Ready for a Cleaner Hull?" → mailto

**Copy direction:** Write like Brian talks. Direct, knowledgeable, no jargon walls. Short paragraphs. The current page reads like a compliance document — Phase 2 should read like a conversation with someone who knows their stuff.

**SEO:**
- Title: `Hull Cleaning | San Francisco Bay | Brian Cline`
- Meta: Focused on the service + location, not keyword-stuffed

---

### Detailing `/detailing` — NEW PAGE (absorb from detailing.sailorskills.com)

**Current state:** Separate site at `detailing.sailorskills.com` (`~/AI/business/sailorskills/detailing-site/`). Simple static page with services list, pricing ($5/ft from), and estimate request form. Images: `boat-detail.jpg`, `boat-hero.jpg`.

**Redesign direction:** Bring into briancline.co with fresh copy and the Marketplace form style. Not a port of the old page.

**Sections:**

1. **Hero** — "Boat Detailing · East Bay"
   - One sentence: above-waterline care for your boat
   - Price: `from $5.00/ft`
   - CTA: "Get an Estimate"

2. **Services** — Clean grid or list
   - Wash & dry, polish & wax, metal polishing, gelcoat stain removal, decal removal, varnish/brightwork
   - Icons or simple visual treatment — not a wall of text

3. **What's Included** — Brief
   - Satisfaction guarantee, communication, service logs, photos

4. **Estimate Request Form** — Styled like Marketplace cost estimator
   - Fields: Name, email, marina, boat name, boat length, services interested in (checkboxes), notes
   - On submit: sends email to Brian (use Formspree, Resend, or Vercel serverless function — whatever's simplest)
   - Keep the checkboxes from the current form (wash/dry, polish/wax, metal polishing, gelcoat, complete detailing, teak, other) — those are useful

5. **CTA** — "Get Your Boat Looking Its Best" → scrolls to form

**Migration:** After deploying, add 301 redirect from `detailing.sailorskills.com` → `briancline.co/detailing`.

**SEO:**
- Title: `Boat Detailing | East Bay | Brian Cline`

---

### Training `/training` — REDESIGN

**Current state:** Another Wix recreation. Big "SAILOR SKILLS" branding, $72/hr callout, skills list, testimonials, repeated CTAs.

**Redesign direction:** Lead with Brian's credibility and the personal nature of the instruction. The testimonials are gold — they should be prominent but not the entire page.

**Sections:**

1. **Hero** — "Private Sailing Lessons · San Francisco Bay"
   - Price: `$72/hr`
   - Credentials line: USCG Master · US Sailing Cruising Instructor · 20+ years
   - CTA: "Book a Free Consultation" (mailto)

2. **The Approach** — What makes this different from a sailing school
   - Custom lessons on your own boat
   - One-on-one (no group classes, no strangers)
   - Teach you to think, not just follow instructions
   - Singlehanding skills (rarely taught elsewhere)
   - 2-3 short paragraphs max

3. **Skills Covered** — Compact grid
   - Line handling, docking, emergency procedures, navigation, communications, seamanship, local knowledge
   - Not a curriculum — a quick scan of what's possible

4. **Testimonials** — 3 cards
   - Emily Richards (Film Producer) — the "adaptive teaching" quote
   - Evan McDonald (Three-time Bay Area Multihull Champion) — the "builds confidence" quote
   - Aimee P (Adult Educator) — the "most patient teacher" quote
   - Photos exist: `training/emily.jpg`, `training/evan.jpg`, `training/aimee.png`

5. **What's Included** — Brief
   - Free consultation, vessel inspection, satisfaction guarantee, online resources

6. **CTA** — "Schedule Your Free Consultation" → mailto

**Copy direction:** Warm, confident, not salesy. Brian teaches because he loves it. Let that come through.

**SEO:**
- Title: `Sailing Lessons | $72/hr | San Francisco Bay | Brian Cline`

---

### Training FAQ `/training/faq` — REDESIGN

**Current state:** Separate page, Wix recreation.

**Redesign direction:** Trim. Keep the questions that reduce friction for a prospect. Cut anything that's only relevant post-enrollment.

**Layout:** Brief intro → Accordion → CTA

**SEO:**
- Title: `Sailing Lessons FAQ | Brian Cline`

---

### Deliveries `/deliveries` — REDESIGN

**Current state:** Long Wix FAQ page with detailed rate structure (on-duty, standby, maximums, expenses).

**Redesign direction:** The rate structure is important and should stay clear, but the current presentation buries the lede under FAQ-style questions. Restructure as a proper service page.

**Sections:**

1. **Hero** — "Vessel Deliveries · West Coast"
   - Credentials: USCG Master
   - CTA: "Plan Your Delivery" (mailto)

2. **The Process** — How it works, step by step
   - Consultation (free) → Vessel inspection → Route planning → Delivery → Handoff
   - 3-5 steps, visual

3. **Rates** — Clear, not buried in FAQ format
   - Card-based layout (not HTML table)
   - On-duty: Captain $100/hr (max $1,200/day)
   - Standby: Captain $50/hr (max $600/day)
   - Crew rates if applicable
   - Note about combined maximums

4. **FAQ** — Accordion, trimmed
   - Weather delays, owner joining, insurance, safety decisions
   - Maybe 4-5 questions max

5. **CTA** — "Let's Plan Your Delivery" → mailto

**SEO:**
- Title: `Boat Deliveries | West Coast | Brian Cline | USCG Master`

---

## Technical Approach

### Current Stack
The site is plain HTML + Vite + Tailwind 4 (no React). Service pages are standalone HTML files.

### Phase 2 Stack
Convert to **React + Vite + Tailwind + shadcn/ui** for the service pages. Two options:

**Option A (recommended): Hybrid approach**
- Keep `index.html` (homepage) and `projects/` pages as-is
- Build new React app for service routes (`/diving`, `/detailing`, `/training`, `/deliveries`)
- Vercel routing handles which pages are React vs static

**Option B: Full React conversion**
- Port everything to React including homepage
- More work, higher risk of breaking the homepage Brian likes

Marcel should pick the approach based on what's cleanest. The constraint is: **don't break the homepage or project pages.**

### Codebase
- **Site:** `~/AI/business/briancline-co/website/`
- **Detailing (to absorb):** `~/AI/business/sailorskills/detailing-site/`
- **Diving estimator + order form (source of truth):** `~/AI/business/sailorskills-platform/sailorskills-estimator/`
  - `calculator.js` — pricing logic (surcharges, minimums, growth estimates)
  - `configuration.js` — service data, rates, constants
  - `checkoutHandler.js` — Stripe integration + order processing
  - `formHandler.js` — multi-step form navigation/validation
  - `state.js` — state management
  - `cleaningFrequencyService.js` — interval logic
  - `estimator.html` — the full page (still live at `diving.sailorskills.com`)
- **Marketplace (visual style reference):** `~/AI/business/sailorskills/marketplace/`
- **Marketplace estimator (style reference for forms):** `marketplace/src/pages/CostEstimator.tsx`

### Assets
Full-res images already in place:
- `public/images/diving/diving-hero.jpg`
- `public/images/training/` — brian headshot, sailing photo, testimonial photos (emily, evan, aimee)
- `public/images/deliveries/` — boat photos
- Detailing images at `detailing-site/public/images/`
- Homepage images (hero, headshot, projects) — all stay

### Form Submission (Detailing Estimate)
Email to Brian on submit. Options:
- **Formspree** — simplest, free tier, no code needed
- **Vercel serverless function** → Resend API — more control
- **Mailto fallback** — if form complexity isn't worth it

Marcel picks based on what's fastest.

### Vercel Configuration
```json
{
  "cleanUrls": true,
  "rewrites": [
    { "source": "/diving", "destination": "/index.html" },
    { "source": "/detailing", "destination": "/index.html" },
    { "source": "/training", "destination": "/index.html" },
    { "source": "/training/faq", "destination": "/index.html" },
    { "source": "/deliveries", "destination": "/index.html" }
  ]
}
```
(Or SPA catch-all if going full React)

### Redirects
After deployment: `detailing.sailorskills.com/*` → `briancline.co/detailing` (301)

---

## Build Order

### Week 1: Foundation + First Pages
1. **Project setup** — Add React + shadcn/ui to existing codebase (or new app alongside)
2. **Service page layout shell** — Shared nav, footer, CTA pattern
3. **Homepage CTA** — Add "Looking for Marine Services?" button to existing hero
4. **Diving page** — Full redesign with cost calculator
5. **Training page** — Full redesign with testimonials

### Week 2: Remaining Pages + Polish
6. **Deliveries page** — Full redesign with rate cards
7. **Training FAQ** — Accordion redesign
8. **Detailing page** — New page with estimate form
9. **Responsive QA** — Every page on mobile + tablet + desktop
10. **Detailing redirect** — `detailing.sailorskills.com` → `briancline.co/detailing`

### Week 3: Brian Review + Iteration
11. Brian walkthrough of every page
12. Copy refinements based on feedback
13. SEO meta tags + Open Graph
14. Performance audit (Lighthouse >90)
15. Ship

---

## Copy Principles

The current service pages read like they were written to fill a Wix template. Long, repetitive, over-explained. Phase 2 copy should:

- **Lead with the outcome**, not the process
- **Sound like Brian** — direct, knowledgeable, warm but not salesy
- **Cut ruthlessly** — if a sentence doesn't help someone decide to reach out, cut it
- **One CTA per section max** — don't repeat "Book Now" four times on one page
- **Use specifics** — "$4.50/ft" beats "competitive pricing", "20+ years on SF Bay" beats "experienced instructor"

Marcel should draft initial copy in the components. Brian and Reese will refine.

---

## Content Inventory

### Existing (redesign, don't port)
| Page | Source | Images |
|------|--------|--------|
| Diving | `briancline.co/diving` | `diving/diving-hero.jpg` |
| Training | `briancline.co/training` | `training/brian-headshot.png`, `emily.jpg`, `evan.jpg`, `aimee.png`, `brian-sailing.jpg` |
| Training FAQ | `briancline.co/training/faq` | None |
| Deliveries | `briancline.co/deliveries` | `deliveries/boat.jpg`, `deliveries/boat-full.jpg` |

### New
| Page | Source | Images |
|------|--------|--------|
| Detailing | `detailing.sailorskills.com` | `boat-detail.jpg`, `boat-hero.jpg` (from detailing-site) |

### Unchanged
| Page | Notes |
|------|-------|
| Homepage `/` | Add one CTA button only |
| Projects | Fully untouched |

---

## Success Criteria

### Launch Gate
- [ ] All service pages redesigned with new copy (not Wix ports)
- [ ] Diving cost calculator working (Marketplace estimator style)
- [ ] Detailing estimate form sends email to Brian
- [ ] Homepage has "Marine Services" CTA — nothing else changed
- [ ] Portfolio/projects pages untouched and working
- [ ] Visual style matches Marketplace (colors, typography, components)
- [ ] Mobile responsive on all pages
- [ ] `detailing.sailorskills.com` redirects to `/detailing`
- [ ] Lighthouse Performance >90

### Nice to Have
- [ ] Service page cross-links ("Also see: Detailing" on Diving page)
- [ ] Open Graph meta tags for social sharing
- [ ] LocalBusiness structured data
- [ ] Smooth page transitions / route animations

---

## References

- **Current site (live):** https://briancline.co
- **Marketplace (style reference):** https://marketplace.sailorskills.com
- **Cost estimator (tool reference):** https://marketplace.sailorskills.com/estimate
- **Detailing site (to absorb):** https://detailing.sailorskills.com
- **Phase 1 doc:** Obsidian `SailorSkills/Business/Domain Restructure - briancline.co.md`
- **Site source:** `~/AI/business/briancline-co/website/`
- **Detailing source:** `~/AI/business/sailorskills/detailing-site/`
- **Marketplace source:** `~/AI/business/sailorskills/marketplace/`
- **Cost estimator component:** `marketplace/src/pages/CostEstimator.tsx`
- **Diving estimator source (pricing + Stripe + order form):** `~/AI/business/sailorskills-platform/sailorskills-estimator/`
- **Diving estimator (live):** https://diving.sailorskills.com
- **Marketplace estimator (style reference):** `marketplace/src/pages/CostEstimator.tsx`
- **Wix content captures:** `~/clawd/docs/wix-captures/`
- **Redirect project:** `~/clawd/sailorskills-redirects/`
