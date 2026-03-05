# Diving Page Revision: Cost Estimator-First Design

## Overview

Replace the current `/diving` page content with a cost estimator-first design. The Marketplace `/estimate` page (`marketplace.sailorskills.com/estimate`) is the visual template — same card-based layout, same component style — but with the full pricing engine from `~/AI/business/sailorskills-platform/sailorskills-estimator/calculator.js`.

**Keep:** ServiceNav, ServiceFooter (shared layout from Phase 2 build)
**Replace:** Everything between nav and footer

---

## Layout

Two-column layout (same as Marketplace `/estimate`):

- **Left column (wide):** Input cards, stacked vertically
- **Right column (narrow, sticky):** "Your Estimate" card that follows the user as they scroll

Below the estimator: a light support section with 3 compact cards.

---

## Header

Same style as Marketplace estimator header (light gradient background):

- Icon (calculator or anchor)
- **"Hull Cleaning Cost Estimator"**
- Subtitle: "Get an instant quote for professional hull cleaning services. Our pricing is transparent and based on your boat's specifications."

---

## Input Cards (Left Column)

Each card matches the Marketplace style: white card with subtle border, icon + bold title, helper text, then selector buttons or slider.

### Card 1: Boat Length
- Slider + number input (identical to Marketplace)
- Range: 15-100 feet, default 35
- Label: "Enter your boat's length in feet (LOA)"

### Card 2: Boat Type
- 4 options with icons (identical to Marketplace):
  - **Sailboat** (default)
  - **Powerboat** (+25%)
  - **Catamaran** (+25%)  ← show "+25%" badge in teal
  - **Trimaran** (+50%)  ← show "+50%" badge in teal

### Card 3: Service Frequency
- 4 options (identical to Marketplace):
  - **Monthly** — "Every month" — uses recurring rate ($4.49/ft)
  - **Bi-monthly** — "Every 2 months" — uses recurring rate ($4.49/ft)
  - **Quarterly** — "Every 3 months" — uses recurring rate ($4.49/ft)
  - **One-Time** — "Single service" — uses one-time rate ($5.99/ft)

### Card 4: Propellers
- Icon: propeller/gear
- 3 options:
  - **1** — "Standard" (default, no surcharge)
  - **2** — "+10%"
  - **3** — "+20%"
- Helper text: "First propeller included. Additional propellers add 10% each."

### Card 5: Bottom Paint Age
- Icon: paint roller or calendar
- Label: "How old is your bottom paint?"
- 5 options:
  - **< 6 months** — "Fresh paint" (maps to `0-6_months`)
  - **6-12 months** (maps to `6-12_months` → `6-12mo`)
  - **1-1.5 years** (maps to `1-1.5_years` → `1-1.5yr`)
  - **1.5-2 years** (maps to `1.5-2_years` → `1.5-2yr`)
  - **2+ years** (maps to `over_24_months` → `2+yr`)
- Helper text: "Paint condition affects marine growth estimates."

### Card 6: Last Cleaned
- Icon: clock/timer
- Label: "When was your hull last cleaned?"
- 7 options:
  - **< 2 months** (maps to `0-2_months` → `<2`)
  - **2-4 months** (maps to `2-4_months` → `2-4`)
  - **5-6 months** (maps to `5-6_months` → `5-6`)
  - **7-8 months** (maps to `7-8_months` → `7-8`)
  - **9-12 months** (maps to `9-12_months` → `9-12`)
  - **1-2 years** (maps to `13-24_months` → `13-24`)
  - **2+ years** (maps to `over_24_months` → `24+`)
- Helper text: "Longer gaps between cleanings may increase marine growth surcharges."

### Card 7: Anode Service
- Icon: wrench/bolt
- Label: "Need anode replacement?"
- Options:
  - **None** (default, 0 anodes)
  - **1-2 anodes**
  - **3-4 anodes**
  - **5+ anodes**
- Helper text: "$15 per anode installation (labor only — anode parts additional)"
- When a range is selected, use the midpoint for the estimate (1.5, 3.5, 5). Or better: show a small number stepper that defaults to the low end of the range (1, 3, 5) and lets them adjust.

Actually — simpler approach: just use a number stepper (0-10) instead of range buttons. Starts at 0. Each increment adds $15 to the estimate. This is more precise and matches how the original calculator worked.

---

## Your Estimate Card (Right Column, Sticky)

Identical visual style to Marketplace "Your Estimate" card (teal/blue gradient header, white body).

### Contents:

**Header:** "Your Estimate"

**Big price:** `$XXX` — large, bold
**Sublabel:** "per service" (or "per month" for recurring)

**Breakdown section** (light background, smaller text):
- Base rate: `$4.49/ft × 35ft` → `$157.15`
- Powerboat surcharge: `+25%` → `$39.29` (only if applicable)
- Catamaran/Trimaran surcharge (only if applicable)
- Additional propellers: `+10%` → `$15.72` (only if applicable)
- Est. Growth (from matrix): `Moderate-Heavy +25%` → `$39.29` (only if applicable)
- Anode installation: `3 × $15` → `$45.00` (only if applicable)
- **Subtotal:** `$XXX.XX`
- If minimum applied: "Minimum service charge" → `$149.00`
- **Total:** `$XXX.XX`

**CTA Button:** "Get Started →" (links to `/order` with query params: length, type, frequency, etc. — or to the Marketplace order form at `marketplace.sailorskills.com/order`)

**Phone line:** "Questions? Call us at (510) 277-4855"

### About Our Pricing (below the estimate card, also sticky)

Small info card (same as Marketplace):
- "Heavy marine growth may add 50%"
- "Severe growth may add 100%+"
- "Includes basic inspection report"
- "Before/after video included"
- **"See what's included in every service →"** ← smooth-scroll link to support section below

---

## Pricing Engine

Port the calculation logic from `calculator.js` and `configuration.js`. **Use hardcoded fallback rates only — no database calls, no Supabase dependency on the public site.**

### Rates (from `configuration.js` fallbacks):
- Recurring cleaning: **$4.49/ft**
- One-time cleaning: **$5.99/ft**
- Minimum service charge: **$149.00**
- Anode installation: **$15.00/each**

### Surcharges:
- Powerboat: **+25%** of base
- Catamaran: **+25%** of base (note: this is hull type, not boat type — but the Marketplace UI shows it as boat type. Keep the Marketplace's approach: Catamaran and Trimaran are boat type options alongside Sailboat and Powerboat)
- Trimaran: **+50%** of base
- Additional propellers: **+10% per additional** (1 included)
- Paint surcharges: **$0** (zeroed out to avoid double-dipping with growth)
- Growth surcharges: **from hull fouling matrix** (see below)

### Hull Fouling Matrix

This is the core differentiator from the simple Marketplace estimator. It's a 7×5 matrix:

**Rows (last cleaned):** <2mo, 2-4mo, 5-6mo, 7-8mo, 9-12mo, 13-24mo, 24+mo
**Columns (paint age):** <6mo, 6-12mo, 1-1.5yr, 1.5-2yr, 2+yr

**Severity → Surcharge:**
- MIN (Minimal): 0%
- M-MOD (Minimal-Moderate): 0%
- MOD (Moderate): 0%
- M-H (Moderate-Heavy): **+25%**
- H (Heavy): **+50%**
- H-S (Heavy-Severe): **+75%**
- S (Severe): **+100%**
- SEV (Severe Maximum): **+200%**

**Full matrix:**
```
              <6mo    6-12mo   1-1.5yr  1.5-2yr  2+yr
<2 months     MIN     MIN      MIN      MOD      M-H
2-4 months    MIN     M-MOD    M-MOD    MOD      M-H
5-6 months    MOD     MOD      MOD      M-H      H
7-8 months    null    M-H      M-H      H        H-S
9-12 months   null    null     H        H-S      SEV
1-2 years     null    null     H-S      S        SEV
2+ years      null    null     null     S        SEV
```

**Null handling:** If the matrix cell is null (impossible combo like fresh paint + not cleaned in years), fall right to the next valid cell in the same row. If no valid cell, return SEV (200%).

### Calculation Flow:
1. Get base rate from service frequency (recurring vs one-time)
2. `baseCost = rate × boatLength`
3. Apply boat type surcharge (% of baseCost)
4. Apply propeller surcharge (% of baseCost)
5. Look up fouling severity from matrix (paintAge × lastCleaned)
6. Apply growth surcharge (% of baseCost)
7. Add anode costs ($15 × count)
8. Sum all = subtotal
9. If subtotal < $149 minimum → total = $149
10. Display total

---

## Support Section (Below Estimator)

Light gray background section. Anchor ID: `#services-info`

Three cards side by side (responsive: stack on mobile):

### How It Works
1. **Get Your Estimate** — Use the calculator above
2. **Schedule Service** — Pick a date that works
3. **We Dive** — Professional cleaning with before/after documentation

### What's Included
- Complete hull scrub
- Running gear inspection
- Before/after GoPro video
- Digital service report
- Zinc anode inspection (replacement additional)

### FAQ (Accordion, 4-5 questions)
- "How long does a hull cleaning take?"
- "What if my boat has heavy growth?"
- "Do you service catamarans and trimarans?"
- "What areas do you serve?"
- "How do I schedule a recurring service?"

---

## "Get Started" Flow

When the user clicks "Get Started →":

**Option A (simpler, recommended for now):** Link to `marketplace.sailorskills.com/order` with query params pre-filled from the estimator selections. The Marketplace order form already exists and handles Stripe checkout.

**Option B (full integration):** Build the checkout form into briancline.co. This means porting `checkoutHandler.js` and the Stripe Elements integration. More work, better UX (no domain hop).

**Recommend Option A for initial ship**, then Option B as a fast-follow if the domain hop feels jarring.

---

## Source Files

- **Visual reference:** `marketplace.sailorskills.com/estimate` (live) and `marketplace/src/pages/CostEstimator.tsx`
- **Pricing engine:** `~/AI/business/sailorskills-platform/sailorskills-estimator/calculator.js`
- **Configuration/rates:** `~/AI/business/sailorskills-platform/sailorskills-estimator/configuration.js`
- **Current diving page to replace:** `~/AI/business/briancline-co/website/src/services/pages/Diving.jsx`

---

## Build Notes

- The `diving-calculator.js` that Marcel already created in `src/services/lib/` may have some of this logic. Check it first — if it already has the matrix, extend it. If it's the simple Marketplace version, replace it with the full engine.
- All rates are hardcoded (no Supabase calls). This is a public marketing page, not a logged-in app.
- The estimate card must update live as the user changes any input. No "Calculate" button — it's always current.
- Mobile: stack the estimate card above the support section (below the input cards). On mobile it shouldn't be sticky — it should sit after the last input card.
- Sticky behavior: estimate card uses `position: sticky; top: 2rem` with appropriate max-height and overflow handling for short viewports.
