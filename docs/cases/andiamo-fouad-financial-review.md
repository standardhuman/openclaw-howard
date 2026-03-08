# Andiamo / Fouad Maghri — Financial Review (Stripe Dispute)

**Prepared:** March 7, 2026 (Saturday, 10:55 PM PST)  
**Prepared by:** Quinn (Finance)  
**Status:** URGENT — Response deadline TBD (see notes below)

---

## 1. Stripe Charge Confirmed

| Field | Value |
|-------|-------|
| **Charge ID** | `ch_3T6G2SEbT3YrW03C0rLbbxzP` |
| **Dispute ID** | `du_1T8XYHEbT3YrW03CBamlSwON` |
| **Invoice ID** | `in_1T6G2REbT3YrW03CqT47ndyH` |
| **Invoice Number** | BKTOZSTS-0003 |
| **Customer** | Fouad Maghri (`cus_TQ0fcWwa6mhyug`) |
| **Email** | maghrifouad@gmail.com |
| **Phone** | (415) 986-9874 |
| **Amount** | $400.06 USD |
| **Charge Date** | March 1, 2026 at 11:52 AM PST |
| **Card** | Mastercard ending 6707 (credit, exp 04/2028) |
| **Status** | Disputed — funds held by Stripe |
| **Amount Refunded** | $0.00 |

### AVS Check Results (Noteworthy)
- Address line 1 check: **FAIL**
- Postal code check: **FAIL**
- CVC check: Not performed

These AVS failures are on the customer's existing card on file — not a fraud indicator in this context, but worth noting as part of the dispute record.

---

## 2. Invoice Breakdown — Amount Confirmed ✓

The $400.06 matches the case documentation exactly:

| Line Item | Amount |
|-----------|--------|
| Base: 44ft × $4.49/ft | $197.56 |
| Power vessel surcharge (+25%) | $49.39 |
| Twin prop surcharge (+10%) | $19.76 |
| Heavy growth surcharge (+50%) | $133.35 |
| **Total** | **$400.06** |

Invoice description: "Monthly hull cleaning service for Andiamo. Service was performed on February 19, 2026."

Custom fields on invoice:
- Vessel: Andiamo
- Service Performed: February 19, 2026

**Comparison to November:** Nov 2025 invoice was $736.31 (severe growth + anodes + waived item recovery). February's $400.06 is actually lower — heavy growth instead of severe, no anodes or extras.

---

## 3. Dispute Status & Deadline

**What we know:**
- Dispute ID: `du_1T8XYHEbT3YrW03CBamlSwON`
- The charge is flagged `disputed: true` in Stripe
- The $400.06 is currently held by Stripe (not available for payout)

**What we can't confirm from CLI:**
- The API key in the billing dashboard (`rk_live_...`) lacks `rak_dispute_read` permission, so I could not pull the dispute object directly. The exact dispute reason code, evidence deadline, and whether Smart Disputes auto-submitted are only visible in the Stripe Dashboard.

**Typical timeline:** Mastercard disputes give 7–21 days to respond. Given the dispute was likely filed in the last few days (charge was March 1), **Brian should check the Dashboard ASAP for the exact deadline.**

**Dashboard link:** https://dashboard.stripe.com/payments/ch_3T6G2SEbT3YrW03C0rLbbxzP

---

## 4. Smart Disputes Status

Stripe's Smart Disputes feature was announced for auto-enablement starting November/December 2025. Per the task notes, Brian received an email about early access in Nov 2025.

**How Smart Disputes works (current as of March 2026):**
- Stripe auto-assembles an evidence packet using AI and internal transaction data
- If you don't manually respond, Smart Disputes auto-submits just before the deadline
- **If you win via Smart Disputes:** Stripe charges a **30% success fee** on the recovered amount
- **If you lose:** No Smart Disputes fee (only the standard $15 dispute fee)
- Smart Disputes **waives** the new $15 counter fee (effective June 2025)

**Action needed:** Check the Stripe Dashboard → Settings → Disputes to confirm Smart Disputes is enabled on this account. If it is, the dispute page will show a Smart Disputes badge and pre-filled evidence.

**Important consideration for this case:** We have strong evidence (before/after videos, service logs, weather data) that Smart Disputes won't have access to. Manual submission with our evidence is likely stronger than the automated packet. However, if Smart Disputes is enabled and we do nothing, it will auto-submit before the deadline — which might not include our best evidence.

---

## 5. Financial Impact

### Immediate Impact (Already Occurred)
| Item | Amount |
|------|--------|
| Funds held by Stripe (not payable) | $400.06 |
| Standard dispute fee (non-refundable) | $15.00 |
| **Total at risk right now** | **$415.06** |

### If We Win the Dispute

**Option A — Manual submission (recommended):**
| Item | Amount |
|------|--------|
| Funds returned | +$400.06 |
| Counter fee (refunded on win) | $0 net |
| Dispute fee (kept by Stripe, non-refundable) | -$15.00 |
| **Net cost** | **$15.00** |

**Option B — Smart Disputes auto-submit:**
| Item | Amount |
|------|--------|
| Funds returned | +$400.06 |
| Smart Disputes success fee (30% of $400.06) | -$120.02 |
| Counter fee | $0 (waived by Smart Disputes) |
| Dispute fee (non-refundable) | -$15.00 |
| **Net cost** | **$135.02** |

### If We Lose the Dispute
| Item | Amount |
|------|--------|
| Funds lost | -$400.06 |
| Dispute fee | -$15.00 |
| Counter fee (if manually countered) | -$15.00 |
| **Total loss** | **$415.06 – $430.06** |

---

## 6. Context — This Dispute is Unexpected

Per the task briefing:
- Fouad emailed a complaint on **March 1, 2026** claiming the boat wasn't serviced and he was overcharged
- Brian spoke with Fouad **by phone after March 1** and they **resolved things amicably**
- Fouad **agreed to continue service** with a custom plan
- The dispute arriving after that resolution is unexpected

This is consistent with a few scenarios:
1. **Fouad filed the dispute before the phone call** and forgot to withdraw it
2. **Fouad's bank/card issuer auto-filed** based on a complaint he made before the resolution
3. **Fouad changed his mind** after the call

Scenario 1 or 2 is most likely given the amicable resolution. Fouad may be able to **withdraw the dispute** by contacting his card issuer (Mastercard). This would be the cleanest resolution and avoid all fees except the $15 dispute fee already charged.

---

## 7. Recommended Actions

### Immediate (Tonight/Tomorrow Morning)
1. **Log into Stripe Dashboard** and check the dispute details:
   - Dispute reason code (fraud? product not received? product unacceptable?)
   - Evidence submission deadline
   - Whether Smart Disputes has auto-generated a response
   - Dashboard link: https://dashboard.stripe.com/payments/ch_3T6G2SEbT3YrW03C0rLbbxzP

2. **If Smart Disputes is enabled and auto-submitting:** Consider whether to override with manual evidence (our case is strong — videos, logs, weather data)

### Short Term
3. **Contact Fouad** — Ask if he filed the dispute before or after the phone call. If before, ask him to contact his Mastercard issuer to withdraw it. This is the best outcome for both parties.

4. **If contesting manually,** prepare an evidence packet:
   - Before/after video links (YouTube)
   - Service log from Notion (Feb 19 entry)
   - Invoice with itemized breakdown
   - Weather data showing why growth returns quickly
   - Note about the phone resolution and agreement to continue service
   - Prior service history showing consistent pattern

### API Key Permissions
5. **Upgrade the billing dashboard API key** to include `rak_dispute_read` and `rak_balance_read` permissions so we can monitor disputes programmatically in the future.

---

## 8. Revenue Impact Note

This $400.06 is part of the ~$6,400/month revenue base. If lost:
- Monthly revenue drops ~6.3% for March
- The $15 dispute fee is a sunk cost regardless of outcome
- A lost dispute also increases the account's dispute rate, which Stripe monitors (threshold: 0.75% of transactions → risk of account review)

---

*Prepared by Quinn — Business Operations / Finance*  
*Case docs reference: `~/clawd/docs/cases/andiamo-fuad-march-2026.md`*
