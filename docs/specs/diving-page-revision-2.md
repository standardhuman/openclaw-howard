# Diving Page Revision 2: Fixes + Order Form Port

## Changes from Current Build

### 1. Replace Emoji with Lucide Icons

Every input card and section currently uses stock emoji. Replace with Lucide React icons (already available via shadcn/ui). Suggested mappings:

| Current Emoji | Replace With | Lucide Icon Name |
|---|---|---|
| ⚓ (Boat Length) | Ruler icon | `Ruler` |
| ⛵ (Boat Type) | Sailboat icon | `Ship` |
| 📅 (Service Frequency) | Calendar icon | `CalendarDays` |
| 🔧 (Propellers) | Settings/gear icon | `Settings` or `Cog` |
| 🎨 (Paint Age) | Paintbrush icon | `Paintbrush` |
| ⏰ (Last Cleaned) | Clock icon | `Clock` |
| 🔩 (Anodes) | Wrench icon | `Wrench` |
| Calculator header icon | Calculator | `Calculator` |
| How It Works | List/steps | `ListChecks` |
| What's Included | Check circle | `CheckCircle2` |
| FAQ | Help circle | `HelpCircle` |

Use `className="w-5 h-5 text-[#0073a8]"` for card title icons, matching the Marketplace style.

### 2. Fix "Get Started" Button (White on White)

The "Get Started →" button in the estimate card is invisible (white text on white background). Fix:
- Background: `bg-[#0073a8]` (ocean blue, matching Marketplace primary)
- Text: `text-white`
- Hover: `hover:bg-[#005f8a]`
- Full width within the estimate card
- Should say "Get Started →" with `ArrowRight` Lucide icon

### 3. FAQ Revision

Remove the current FAQ. Replace with a consolidated version from the original diving page FAQ. Categories merged into a flat accordion. Drop "How long does hull cleaning take?" Keep these (rewritten to be concise):

**Assessment & Ratings:**
1. **"How do you rate levels of marine growth?"** — Include the 5-level scale: None, Minimal, Moderate, Heavy, Severe with brief descriptions
2. **"How do you rate paint condition?"** — Include the 5-level scale: Excellent, Good, Fair, Poor, Missing with brief descriptions

**Billing & Pricing:**
3. **"How does billing work?"** — Bill within a week after service. Anode/variable charges included.
4. **"Are anodes extra?"** — Yes, additional. Customer can provide own. ~Chandlery prices + tax. $15 installation fee.
5. **"Can you provide an estimate before beginning work?"** — Yes, happy to stop by for a look before first service.
6. **"Do you offer a referral program?"** — Yes! Free cleaning per referral signup. Friend gets 50% off first cleaning. No limit.

**Cleaning Process:**
7. **"What do you use to clean the bottom?"** — Tools matched to growth type, minimum effective abrasion. Will advise if paint needs haul-out.
8. **"Will my paint look perfectly clean afterward?"** — Depends on paint's biocidal properties. Some algae may remain in texture — removing it would damage paint.
9. **"How high up do you clean?"** — Up to the antifouling paint line only. No unpainted surfaces.

**Special Services:**
10. **"Do you offer one-time services?"** — Yes, especially for voyage prep.
11. **"I need a cleaning before a race. Can you help?"** — Yes, will align as close to race day as possible.
12. **"I dropped something in the water. Can you retrieve it?"** — Yes, book as one-time service. 20min search + 20min bonus. No guarantee. Don't disturb bottom before arrival.

Use a flat Accordion component — no category headers needed. All 12 questions visible.

### 4. Port Order Form to briancline.co

**Do NOT link to `marketplace.sailorskills.com/order`.** Instead, build the order form as a new page within briancline.co.

#### New Route: `/diving/order`

Add this route to the React SPA router. Add a Vercel rewrite:
```json
{ "source": "/diving/order", "destination": "/services" }
```

#### Order Form Page Structure

Port from `marketplace/src/pages/Order.tsx` but with these changes:

**Use ServiceLayout** (ServiceNav + ServiceFooter) instead of Marketplace MainLayout.

**Form sections (4 cards):**

1. **Boat Details** (Ship icon)
   - Boat Name, Boat Type (dropdown), Make, Model, Length (ft)
   - Pre-fill length and boat type from URL params (passed from estimator)

2. **Boat Location** (MapPin icon)
   - Marina, Dock, Slip

3. **Your Information** (User icon)
   - Full Name, Email, Phone
   - Billing Address, City, State (needed for Stripe)

4. **Service Details** (Wrench icon)
   - Service Type: Hull Cleaning (default, dropdown)
   - **Frequency: Monthly / Every 2 Months / Every 3 Months / One-Time**
     ```js
     const FREQUENCIES = [
       { value: 'monthly', label: 'Monthly' },
       { value: 'bimonthly', label: 'Every 2 Months' },
       { value: 'quarterly', label: 'Every 3 Months' },
       { value: 'one_time', label: 'One-Time Service' },
     ];
     ```
   - Notes (textarea)

5. **Payment Information** (CreditCard icon)
   - Stripe Elements: Card Number, Expiry, CVC
   - ZIP/Postal code (collected by Stripe Element or as separate field)
   - **This does NOT charge the card.** It saves the payment method via `SetupIntent` (for recurring) or creates an authorization hold (for one-time).
   - Service agreement checkbox: "I authorize SailorSkills to charge the card on file after service completion. Estimated amount: $XXX."
   - Show the estimated cost from URL params

#### Stripe Integration

Port the payment flow from `~/AI/business/sailorskills-platform/sailorskills-estimator/checkoutHandler.js`:

1. Load Stripe.js via `@stripe/stripe-js` and `@stripe/react-stripe-js` (add as dependencies)
2. Get the publishable key from the `get-stripe-config` edge function:
   ```
   GET {supabaseUrl}/functions/v1/get-stripe-config
   Authorization: Bearer {supabaseAnonKey}
   ```
3. Mount Stripe `CardElement` (or individual `CardNumberElement`, `CardExpiryElement`, `CardCvcElement`)
4. On submit, call the `create-payment-intent` edge function:
   ```
   POST {supabaseUrl}/functions/v1/create-payment-intent
   Authorization: Bearer {supabaseAnonKey}
   Body: { formData: { ...allFormFields, estimate, service, serviceDetails } }
   ```
5. The edge function returns `{ clientSecret, intentType, orderId, orderNumber }`
6. If `intentType === 'setup'` → `stripe.confirmCardSetup(clientSecret, { payment_method: { card, billing_details } })`
7. If `intentType !== 'setup'` → `stripe.confirmCardPayment(clientSecret, { payment_method: { card, billing_details } })`
8. On success → show confirmation with order number
9. On error → show error message, re-enable submit

#### Supabase Config for briancline.co

The order form needs to call Supabase edge functions. Use the **shared** Supabase project (same as Marketplace):

```js
const SUPABASE_URL = 'https://aaxnoeirtjlizdhnbqbr.supabase.co';
const SUPABASE_ANON_KEY = '...'; // Same anon key as Marketplace
```

These should be environment variables in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Or hardcoded as fallbacks (the anon key is public by design).

Actually — check the estimator's `configuration.js` for the existing values. It uses the **platform** Supabase project (`fzygakldvvzxcmahkdylq`), not the shared Marketplace project. The `create-payment-intent` edge function is deployed there. Use the same credentials:

```js
const SUPABASE_URL = 'https://fzygakldvvzxmahkdylq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eWdha2xkdnZ6eG1haGtkeWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwODM4OTgsImV4cCI6MjA2OTY1OTg5OH0.8BNDF5zmpk2HFdprTjsdOWTDh_XkAPdTnGo7omtiVIk';
```

#### "Get Started" Flow (Estimator → Order)

When user clicks "Get Started →" on the estimate card, navigate to `/diving/order` with query params:
```
/diving/order?length=35&type=sailboat&frequency=monthly&estimate=157
```

The order form reads these via `useSearchParams` and pre-fills boat type, length, frequency, and shows the estimated cost.

### 5. Mobile Considerations

- Order form: single column on mobile, full width cards
- Stripe Elements: use single `CardElement` on mobile (combined card/expiry/cvc) for smaller screens, individual elements on desktop
- Actually just use `CardElement` (combined) everywhere for simplicity — the individual element approach from the original is unnecessary complexity

---

## Files to Create/Modify

- **Modify:** `src/services/pages/Diving.jsx` — icons, button fix, FAQ
- **Modify:** `src/services/lib/diving-calculator.js` — no changes needed (logic is correct)
- **Create:** `src/services/pages/DivingOrder.jsx` — the full order form with Stripe
- **Modify:** `src/services/App.jsx` — add `/diving/order` route
- **Modify:** `vercel.json` — add rewrite for `/diving/order`
- **Modify:** `package.json` — add `@stripe/stripe-js` and `@stripe/react-stripe-js`

## Do NOT Modify

- Other service pages (Training, Deliveries, Detailing)
- ServiceNav, ServiceFooter
- Homepage
