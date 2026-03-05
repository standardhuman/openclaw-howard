# Diving Page Revision 3: Service Types, Icons, Sticky Fix, Stripe Elements, Terms

## 1. Service Type Selection (New Input Card — Card 0, above Boat Length)

Add a service selection card as the FIRST input. This changes which subsequent inputs are shown and how pricing works.

### Services:

| Service Key | Name | Type | Rate | Description |
|---|---|---|---|---|
| `recurring_cleaning` | Recurring Cleaning & Anodes | per_foot | $4.49/ft | Regular hull cleaning. Includes anode inspection. |
| `onetime_cleaning` | One-time Cleaning & Anodes | per_foot | $5.99/ft | Single hull cleaning + anode inspection. |
| `underwater_inspection` | Underwater Inspection | per_foot | $3.99/ft | Photo/video documentation. Insurance, pre-purchase, damage assessment. |
| `item_recovery` | Item Recovery | flat | $199 | Recovery of lost items. Up to 45 min search. Not guaranteed. |
| `propeller_service` | Propeller Removal/Installation | flat | $349/propeller | Professional propeller service. |
| `anodes_only` | Anodes Only | flat | $149 min | Anode inspection and replacement only. $15/anode installation. |

### UI:
- Card title: "Service Type" with `Anchor` Lucide icon
- 6 buttons in a 2×3 or 3×2 grid, same style as boat type buttons
- Each button shows: service name + price indicator (e.g. "From $4.49/ft" or "$199 flat")
- Default selection: "Recurring Cleaning & Anodes"

### Conditional Input Visibility:

| Input Card | recurring_cleaning | onetime_cleaning | inspection | item_recovery | propeller_service | anodes_only |
|---|---|---|---|---|---|---|
| Boat Length | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Boat Type | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Service Frequency | ✅ (locked to recurring options) | ❌ (locked to one-time) | ❌ | ❌ | ❌ | ❌ |
| Propellers | ✅ | ✅ | ❌ | ❌ | ✅ (count = price multiplier) | ❌ |
| Paint Age | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Last Cleaned | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Anodes | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

For **item_recovery**: Show only the estimate card with flat rate $199. No other inputs needed.
For **propeller_service**: Show propeller count only. Price = $349 × propeller count.
For **anodes_only**: Show anode count only. Price = $149 minimum + $15 × anode count.
For **underwater_inspection**: Show boat length + boat type. Price = $3.99/ft with boat type surcharges, $149 minimum.

### Pricing Engine Update (`diving-calculator.js`):

Add the additional service types. The `calculateEstimate()` function needs to accept a `serviceKey` parameter and handle:
- `per_foot` services: rate × length + surcharges + minimum
- `flat` services: flat rate (× count for propellers)
- Anodes-only: minimum charge + per-anode fee

## 2. Custom Boat Type Icons

The 4 boat type buttons need distinctive icons. Lucide doesn't have catamaran/trimaran, so use inline SVGs:

### Sailboat
Use Lucide `Sailboat` icon (it exists! `import { Sailboat } from 'lucide-react'`). If not available in the installed version, use a simple inline SVG of a sailboat silhouette.

### Powerboat
Current icon is fine (keep `Ship` or use a motorboat SVG).

### Catamaran
Inline SVG — top-down view of two parallel hulls:
```jsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
  {/* Two parallel hulls */}
  <path d="M5 4 C5 4, 4 12, 5 20 C5 20, 6 21, 7 20 C8 12, 7 4, 7 4 Z" />
  <path d="M17 4 C17 4, 16 12, 17 20 C17 20, 18 21, 19 20 C20 12, 19 4, 19 4 Z" />
  {/* Cross beams */}
  <line x1="7" y1="8" x2="17" y2="8" />
  <line x1="7" y1="16" x2="17" y2="16" />
</svg>
```

### Trimaran
Inline SVG — top-down view of three hulls (center hull larger):
```jsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
  {/* Center hull (larger) */}
  <path d="M11 3 C11 3, 10 12, 11 21 C11 21, 12 22, 13 21 C14 12, 13 3, 13 3 Z" />
  {/* Left hull (smaller) */}
  <path d="M4 7 C4 7, 3.5 12, 4 17 C4 17, 4.5 17.5, 5 17 C5.5 12, 5 7, 5 7 Z" />
  {/* Right hull (smaller) */}
  <path d="M19 7 C19 7, 18.5 12, 19 17 C19 17, 19.5 17.5, 20 17 C20.5 12, 20 7, 20 7 Z" />
  {/* Cross beams */}
  <line x1="5" y1="10" x2="11" y2="10" />
  <line x1="13" y1="10" x2="19" y2="10" />
  <line x1="5" y1="14" x2="11" y2="14" />
  <line x1="13" y1="14" x2="19" y2="14" />
</svg>
```

Make these reusable components (e.g. `CatamaranIcon`, `TrimaranIcon`) or just inline them in the boat type card.

## 3. Sticky Estimate Card — Fix Cropping

The estimate card currently sticks to the very top of the viewport, getting cropped by the nav bar.

**Fix:** Change the sticky positioning so it stays vertically centered in the viewport as the user scrolls:

```css
/* Instead of */
position: sticky;
top: 1rem;

/* Use */
position: sticky;
top: 50%;
transform: translateY(-50%);
```

Or more practically, calculate a top offset that centers it:
```css
position: sticky;
top: calc(50vh - 200px); /* Adjust 200px based on card height / 2 */
```

This keeps it floating mid-page as the user scrolls through the input cards. Test with varying viewport heights.

Also add `max-height: calc(100vh - 120px)` and `overflow-y: auto` so the breakdown scrolls internally if it gets too long (many surcharges applied).

## 4. Stripe Payment Elements — Separate Fields

Replace the single `CardElement` with individual Stripe Elements for proper card collection:

### Fields:
1. **Card Number** — `CardNumberElement`
2. **Expiration Date** — `CardExpiryElement`  
3. **CVC** — `CardCvcElement`
4. **Billing ZIP** — `PostalCodeElement` (or a regular input if Stripe postal isn't available — Stripe individual elements don't always include postal, so use a plain input field for ZIP)

### Layout:
```
┌─────────────────────────────────┐
│ Card Number                     │
│ ┌─────────────────────────────┐ │
│ │ •••• •••• •••• ••••         │ │
│ └─────────────────────────────┘ │
│                                 │
│ Expiration     CVC              │
│ ┌───────────┐ ┌───────────────┐ │
│ │ MM / YY   │ │ •••           │ │
│ └───────────┘ └───────────────┘ │
│                                 │
│ Billing ZIP                     │
│ ┌───────────┐                   │
│ │ 94720     │                   │
│ └───────────┘                   │
└─────────────────────────────────┘
```

### Implementation:
Use `@stripe/react-stripe-js` for React integration:
```jsx
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
```

Add `@stripe/react-stripe-js` to dependencies (Marcel used direct mount last time — switch to the React wrapper for proper lifecycle management).

Wrap the order form in `<Elements stripe={stripePromise}>` provider. Use `useStripe()` and `useElements()` hooks.

### Stripe Element Styling:
Match the site's input styling:
```js
const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a1a1a',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};
```

## 5. Service Agreement — Full Terms

Replace the current single checkbox with the full agreement from the original checkout:

```jsx
<div className="border rounded-lg p-4 bg-gray-50 space-y-3">
  <h4 className="font-semibold text-gray-900">Important Service Agreement</h4>
  
  <p className="text-sm text-gray-700">
    <strong>Billing:</strong> Your card will be charged only after service completion.
  </p>
  
  <p className="text-sm text-gray-700">
    <strong>Estimate Notice:</strong> The final amount may vary from the provided estimate based on actual conditions found during service. Common variations include:
  </p>
  
  <ul className="text-sm text-gray-700 list-disc ml-5 space-y-1">
    <li>Unexpected marine growth levels</li>
    <li>Additional anode replacements needed</li>
  </ul>
  
  <p className="text-sm text-gray-700">
    Any variations and their reasons will be documented in your service logs and underwater video.
  </p>
  
  <div className="flex items-start gap-2 pt-2">
    <input type="checkbox" id="service-agreement" required className="mt-1" />
    <label htmlFor="service-agreement" className="text-sm text-gray-700">
      I understand and agree to be billed for the service at time of completion, 
      and that the final amount may vary from the estimate provided.
    </label>
  </div>
</div>
```

## 6. Order Form — Conditional Sections Based on Service Type

The order form at `/diving/order` should also receive a `service` URL param and show/hide sections accordingly:

- **Item Recovery:** Hide boat info section. Show "Recovery Location" section instead (textarea for location details, item description input, date lost input).
- **Anodes Only:** Show boat info + "Anode Information" section (textarea for anode details — sizes, types, etc.)
- **Propeller Service:** Show boat info + propeller count.
- **All others:** Standard form (boat info, location, contact, service details, payment).

Service interval section:
- **Recurring cleaning:** Show frequency selector (Monthly / Bi-monthly / Quarterly)
- **One-time cleaning, inspection, item recovery, propeller, anodes:** Hide frequency (auto-set to one-time)

## Files to Modify

- **`Diving.jsx`** — Add service type card (Card 0), conditional input visibility, custom boat type SVGs, sticky card fix
- **`diving-calculator.js`** — Add all 6 service types with correct pricing logic
- **`DivingOrder.jsx`** — Separate Stripe elements, full service agreement, conditional sections based on service type, add `@stripe/react-stripe-js`
- **`App.jsx`** — No changes needed (route already exists)
- **`vercel.json`** — No changes needed
- **`package.json`** — Add `@stripe/react-stripe-js` dependency

## Do NOT Modify
- Other service pages (Training, Deliveries, Detailing)
- ServiceNav, ServiceFooter
- Homepage
