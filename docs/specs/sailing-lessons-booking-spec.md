# Sailing Lessons Booking — BC Scheduler Feature Spec

**Author:** Reese (PM)  
**Date:** 2026-03-05  
**Status:** Draft  
**Builder:** TBD (likely Marcel or Jacques)  
**Codebase:** `~/AI/business/briancline-co/scheduler/`  
**Live:** https://schedule.briancline.co  

---

## Problem

Brian teaches private sailing and powerboat lessons on San Francisco Bay. The old Wix site had Wix Bookings integrated — students could pick a lesson type, choose a time, and book directly. When the site moved to briancline.co, that booking system died. Right now the training page links to `schedule.briancline.co/connect`, which is a generic "Let's Connect" free call — no lesson-specific context, no package selection, no pricing, no sailing-specific information.

The scheduler already has most of the infrastructure: calendar + availability, Google Calendar sync, email confirmations, Supabase persistence, admin dashboard, and a custom link system (`/book/:slug`). What it lacks is the concept of **session packages** — bookings that span more than 2 hours, have tiered pricing, and carry domain-specific context (sailing instruction, in-person only, vessel info).

## Goal

Add a **sailing lessons booking type** to BC Scheduler so students can:
1. Pick a session type (consultation, half-day, full-day)
2. See pricing and what's included
3. Pick a date from Brian's real availability
4. Book and get a confirmation email + calendar invite

Brian should be able to:
1. Manage sailing bookings in the same admin dashboard
2. See session type and any student notes
3. **Track session counts per student** — know how many sessions someone has done out of how many they've paid for, even when sessions are months apart
4. View revenue from lesson bookings

## Non-Goals

- **Payment collection at booking time.** Lessons are paid after the first 3 hours (per Brian's guarantee). No Stripe integration needed here — just show the price so students know what to expect.
- **Multi-day package scheduling.** Packages (2-day, 4-day) are pricing/payment constructs, not booking constructs. Students book individual half-day or full-day sessions one at a time and Brian tracks how many are consumed against what they've paid for.
- **Recurring/subscription bookings.** Each booking is standalone.
- **Student portal or progress tracking.** Out of scope.
- **Multi-instructor support.** Brian is the only instructor.

---

## Session Types

Students book one session at a time. Multi-day packages (2-day for $1,080, 4-day for $2,040) are mentioned on the training page and FAQ as pricing options, but scheduling-wise, every booking is a single consultation, half-day, or full-day. Brian tracks session counts against what the student has paid for.

### Free Consultation
- **Duration:** 1 hour
- **Price:** Free
- **Format:** In-person (at student's boat)
- **What happens:** Meet at the boat, discuss goals and experience, vessel inspection, equipment recommendations. Student receives a vessel assessment and training application afterward.
- **Availability:** Any valid time slot within business hours
- **Auto-approve:** Yes

### Half-Day
- **Duration:** 3 hours
- **Price:** $300 + tax
- **Format:** In-person (on the water)
- **Note:** First 3 hours are satisfaction-guaranteed — if the student isn't happy, no charge.
- **Availability:** Any valid start time (no minimum constraint — early morning is fine)
- **Auto-approve:** Yes

### Full-Day
- **Duration:** 6.5–7 hours
- **Price:** $600 + tax
- **Format:** In-person (on the water)
- **Availability:** Any valid start time (naturally limited by business hours end time — a 6.5hr session starting at 9 AM ends at 3:30 PM, starting at 10 AM ends at 4:30 PM, etc.)
- **Auto-approve:** Yes

### Credit Card Surcharge
All prices: add 3% for credit card payments. This is informational — no payment is collected at booking.

### Additional Students
No extra charge. Any number of students can join. Each person needs to complete the Training Application.

---

## Data Model Changes

### New: `booking_type` expansion

The current `BookingType` is `'connect' | 'consult'`. We need to add `'sailing'`.

**Option A (recommended): Add `'sailing'` as a third booking type.**

```typescript
// types/booking.ts
export type BookingType = 'connect' | 'consult' | 'sailing'
```

This keeps the type system simple. The sailing-specific details (package, pricing) live in new fields on the booking.

**Option B: Generic "service type" system.** More flexible but over-engineered for current needs. Reject.

### New fields on `Booking`

```typescript
interface Booking {
  // ... existing fields ...
  
  // New fields for sailing bookings
  sessionType?: SailingSessionType  // Which session type
  sessionPrice?: number             // Price in cents (for display/reporting)
  boatName?: string                 // Student's boat name
  boatLocation?: string             // Marina/slip
  additionalStudents?: number       // How many extra people
  studentId?: string                // FK to sailing_students (for session tracking)
}

type SailingSessionType = 
  | 'consultation'   // 1hr, free
  | 'half-day'       // 3hr, $300
  | 'full-day'       // 6.5-7hr, $600
```

### New: `sailing_students` table (session tracking)

Brian loses track of where students are in their purchased sessions — someone buys 4 days, sessions are spread over months, and he can't remember which are done and which are outstanding. This table solves that.

```typescript
interface SailingStudent {
  id: string
  name: string
  email: string
  phone?: string
  boatName?: string
  boatLocation?: string
  sessionsPurchased: number    // Total sessions paid for (e.g., 4 for Package B)
  sessionsCompleted: number    // Sessions marked done
  sessionsScheduled: number    // Upcoming confirmed bookings
  packageType?: string         // Informal label: "4 full-days", "pay as you go", etc.
  totalPaid?: number           // Cents — what they've paid so far
  notes?: string               // Freeform admin notes
  createdAt: string
  updatedAt: string
}
```

**How it works:**
- When a sailing booking is created, the scheduler checks if a `sailing_student` record exists for that email. If not, one is created automatically.
- The booking is linked to the student via `studentId`.
- `sessionsScheduled` increments when a booking is confirmed, decrements when completed or canceled.
- `sessionsCompleted` increments when Brian marks a session as done (new admin action).
- `sessionsPurchased` is set manually by Brian in admin — when a student pays for 4 days, Brian sets this to 4.
- The admin dashboard shows a **student card**: "Emily Richards — 3 of 4 sessions completed, 1 scheduled, 0 remaining."

This is the core of what Brian needs: at-a-glance visibility into where each student stands.

**Key design choice:** `sessionsPurchased` is manually set, not derived from payment. Brian's payment arrangements are flexible (cash discount, guarantee period, etc.) and trying to automate this would be wrong. Brian enters the number when the student pays.

### New: `duration` type expansion

Current `Duration` type: `20 | 30 | 45 | 60 | 90 | 120`

Sailing needs: `60` (consultation), `180` (half-day), `390` (full-day, ~6.5 hours).

```typescript
export type Duration = 20 | 30 | 45 | 60 | 90 | 120 | 180 | 390
```

The `DurationSelector` component already renders `{duration} min` and handles arbitrary values from the array — it just needs the type to allow the new values. The calendar availability logic uses `addMinutes(currentTime, duration)`, so it'll work as-is.

The one thing that needs attention: **time slot generation**. Currently it generates 30-minute increment slots between 9 AM and 5 PM. A 390-minute (6.5 hour) booking starting at 9 AM ends at 3:30 PM — that fits. But starting at 10:30 AM would run past 5 PM. The slot generator already checks `if (slotEnd <= dayEnd)` so it naturally filters these out. For half-day and full-day, there will be very few valid start times, which is actually good — it simplifies the UX.

### Database migration

```sql
-- Add new columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session_type text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session_price integer;  -- cents
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS boat_name text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS boat_location text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS additional_students integer DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES sailing_students(id);

-- Session tracking table
CREATE TABLE IF NOT EXISTS sailing_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  boat_name text,
  boat_location text,
  sessions_purchased integer NOT NULL DEFAULT 0,
  sessions_completed integer NOT NULL DEFAULT 0,
  sessions_scheduled integer NOT NULL DEFAULT 0,
  package_type text,           -- informal label: "4 full-days", "pay as you go"
  total_paid integer DEFAULT 0, -- cents
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for email lookups (matching students to bookings)
CREATE INDEX IF NOT EXISTS idx_sailing_students_email ON sailing_students(email);

-- RLS: public can insert (creating student on first booking), admin can update
ALTER TABLE sailing_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert sailing students" ON sailing_students FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can view sailing students" ON sailing_students FOR SELECT USING (true);
CREATE POLICY "Admin can update sailing students" ON sailing_students FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);
```

The `duration` column is already `integer` (not an enum), so no migration needed for new duration values.

The `type` column is already `text` (not an enum), so `'sailing'` works without migration.

---

## Routing

### New page: `/sailing`

Dedicated landing page for sailing lessons. This replaces the current flow of going through `/connect` or creating a custom link.

```
/sailing              → SailingPage (package selection + booking)
/sailing/success      → reuse existing SuccessPage (or customize)
```

The router addition:

```tsx
<Route path="/sailing" element={<Layout><SailingPage /></Layout>} />
```

### Homepage update

Add a third card to the HomePage grid:

```
💬 Let's Connect       💼 Book a Consultation       ⛵ Sailing Lessons
Free • 20-120 min      Paid • 30-120 min            Free consult or packages
```

### Custom links

The custom link system (`/book/:slug`) should continue to work. Brian can create a link like `/book/sailing-consult` that pre-selects the consultation package. But the primary entry point is `/sailing`.

---

## UX Flow

### `/sailing` page

**Step 1: Session Type Selection**

The page opens with a hero section and session type cards.

```
⛵ Sailing Lessons
Private instruction on your boat. San Francisco Bay.
USCG Licensed Master · US Sailing Cruising Instructor

┌─────────────────────────────────────────┐
│  🆓  Free Consultation                  │
│  1 hour · Meet at your boat             │
│  Discuss goals, vessel inspection,       │
│  develop a training plan                 │
│  [Selected ✓]                           │
└─────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐
│  ☀️ Half-Day      │  │  🌅 Full-Day     │
│  3 hours · $300   │  │  6.5 hrs · $600  │
│  + tax            │  │  + tax           │
└──────────────────┘  └──────────────────┘

  Add 3% for credit card payments.
  No extra charge for additional students.
  Multi-day packages available — ask during consultation.
```

The free consultation is the default selection (hero-sized card, like the diving page's "Cleaning & Anodes" treatment). Half-day and full-day are side by side below. Multi-day packages (2-day $1,080, 4-day $2,040) are mentioned as a note — they're a pricing arrangement, not a separate booking type.

**Step 2: Student Information**

After selecting a session type, a form section appears. This is the standard `BookingForm` fields plus sailing-specific fields:

- Name *
- Email *
- Phone (optional)
- Boat name (optional, but encouraged)
- Boat location / marina (optional)
- Number of additional students (default 0)
- Notes — pre-filled prompt: "Tell me about your sailing experience and what you'd like to learn"

If the student's email matches an existing `sailing_student` record, the form pre-fills boat name and location from the stored record. This is a nice-to-have — returning students shouldn't have to re-enter their boat info.

**Step 3: Date & Time Selection**

The standard calendar + time slot picker. Differences from Connect/Consult:

- **Format is always "In Person"** — no format selector shown. The location shows as the student's marina (if provided) or "Your boat — San Francisco Bay."
- **Time slots are naturally filtered by session duration.** The existing slot generator already checks that `slotEnd <= dayEnd`, so longer sessions simply have fewer valid start times. No artificial constraints needed — any start time that fits within business hours is valid.

**Step 4: Confirmation**

Standard `BookingForm` submit → `SuccessPage`. The success page shows:
- Session type and price (or "Free" for consultation)
- Date and time
- "Add to Calendar" buttons
- Manage booking link
- For consultation: "What to expect" blurb (vessel inspection, training plan, bring your boat keys)

### Price display

Show prices on the session type cards but NOT on the confirmation page as a "charge." The confirmation should say something like:

> **Half-Day Session — $300 + tax**  
> Payment is collected in person after your session. Your first 3 hours are satisfaction-guaranteed.

---

## Component Changes

### New: `SailingPage.tsx`

The primary new component. Contains:
- Hero with sailing context
- `SessionTypeSelector` (new component, sailing-specific)
- `SailingBookingForm` (extends BookingForm with boat fields)
- Calendar + TimeSlots (reused)
- Pricing summary

### New: `SessionTypeSelector.tsx`

Renders the three session type cards (consultation hero, half-day and full-day side by side). Accepts `selected` and `onChange` props. Returns a `SailingSessionType` value.

### Modified: `DurationSelector.tsx`

Add label formatting for longer durations:
```typescript
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  if (minutes === 60) return '1 hour'
  if (minutes === 180) return '3 hours'
  if (minutes === 390) return '6.5 hours'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`
}
```

This won't actually be used on the sailing page (which has its own PackageSelector), but keeps the DurationSelector correct if these durations appear in custom links or admin views.

### Modified: `BookingForm.tsx`

Add optional sailing fields that appear when `bookingType === 'sailing'`:

```tsx
interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void
  isSubmitting: boolean
  initialData?: Partial<BookingFormData>
  bookingType?: BookingType  // NEW
}
```

When `bookingType === 'sailing'`, render additional fields: boat name, boat location, additional students.

### Modified: `FormatSelector.tsx`

No changes needed — the SailingPage simply won't render it (format is always in-person).

### Modified: `SuccessPage.tsx`

Detect `booking.type === 'sailing'` and show:
- Session type name instead of "Connect Call" / "Consultation"
- Price with the payment-in-person note
- "What to expect" section for consultations

### Modified: `HomePage.tsx`

Add third card linking to `/sailing`.

### Modified: Admin pages

- `AdminBookingsPage`: Show session type and price for sailing bookings in the list
- `AdminBookingDetailPage`: Show sailing-specific fields (boat name, location, additional students) and link to student record
- Filter/sort by booking type should include 'sailing'

### New: Admin student tracking

New admin page or section: **Sailing Students** (`/admin/sailing-students`)

Shows a list of all sailing students with:
- Name, email, boat
- Sessions: "3 of 4 completed" with a progress indicator
- Next scheduled session date (if any)
- Quick actions: edit purchased count, mark session complete, add notes

Student detail view:
- All booking history for that student (linked via email)
- Editable fields: `sessionsPurchased`, `packageType`, `totalPaid`, `notes`
- Timeline of sessions: date, type (half/full), status (completed/upcoming/canceled)

This is the primary tool Brian uses to answer "where is this student in their package?"

---

## Email Updates

The `send-email` edge function needs a sailing-specific email template:

**Confirmation email for consultation:**
> Subject: "Free Sailing Consultation Confirmed — [Date]"
>
> Your free consultation with Brian Cline is confirmed.
>
> **When:** [Date] at [Time]  
> **Where:** Your boat (bring your boat keys!)  
> **Duration:** 1 hour  
>
> During this session, we'll:  
> - Discuss your sailing goals and experience  
> - Inspect your vessel's safety gear and systems  
> - Create a training plan tailored to you  
>
> You'll receive a vessel assessment and training application afterward.
>
> Questions? Reply to this email or call Brian at [phone].

**Confirmation email for paid sessions:**
> Subject: "Sailing Lesson Confirmed — [Half-Day / Full-Day] on [Date]"
>
> Your [Half-Day / Full-Day] sailing lesson with Brian Cline is confirmed.
>
> **When:** [Date] at [Time]  
> **Duration:** [3 hours / 6.5 hours]  
> **Price:** [$300 / $600] + tax  
> **Where:** Your boat  
>
> **Payment:** Collected in person after your session.  
> **Guarantee:** Your first 3 hours are satisfaction-guaranteed — if you're not happy, no charge.

**Admin notification:**
Brian gets the standard admin notification email with the sailing-specific fields included.

---

## Calendar Integration

The Google Calendar event should include:
- **Title:** "Sailing: [Consultation / Half-Day / Full-Day] — [Student Name]"
- **Location:** Student's boat location (if provided) or "Student's boat — SF Bay"
- **Description:** Package details, student info, notes
- **Duration:** Matches the package duration (60/180/390 min)

This is handled by the `google-calendar` edge function. The `booking.duration` value drives the event end time — no changes needed to the calendar logic, just the event title/description formatting.

---

## Availability Considerations

### Time slot generation for long sessions

The current slot generator creates 30-minute increments from 9 AM to 5 PM and filters by `slotEnd <= dayEnd`. This naturally limits long sessions. No artificial start time constraints — any start that fits is valid.

| Session Type | Duration | Valid start times (9 AM - 5 PM window) |
|---------|----------|----------------------------------------|
| Consultation | 60 min | 9:00, 9:30, 10:00 ... 4:00 (15 slots) |
| Half-Day | 180 min | 9:00, 9:30, 10:00 ... 2:00 (11 slots) |
| Full-Day | 390 min | 9:00, 9:30, 10:00, 10:30 (4 slots) |

For full-day, only 4 possible start times is actually fine — students don't need more granularity than that for an all-day session.

### Buffer time

The existing 15-minute buffer between bookings applies. A half-day session (3 hours) blocks 3 hours + 15 min on each side = 3.5 hours of calendar time. This is correct — Brian needs time between sessions.

---

## Admin Settings

### New: Sailing pricing configuration

Add sailing pricing to the admin settings page, similar to how consult pricing is configured:

```typescript
interface AdminSettings {
  // ... existing fields ...
  sailingPricing: {
    halfDay: number      // default 300 (dollars, not cents — matches consult pricing pattern)
    fullDay: number      // default 600
  }
}
```

This lets Brian adjust per-session prices without a code deploy. The consultation is always free. Multi-day package pricing ($1,080 for 2 days, $2,040 for 4 days) is mentioned on the training page and FAQ but isn't part of the scheduler — it's a payment arrangement Brian tracks via the student record.

### Database migration for settings

```sql
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sailing_rate_half_day integer DEFAULT 30000;  -- $300 in cents
ALTER TABLE settings ADD COLUMN IF NOT EXISTS sailing_rate_full_day integer DEFAULT 60000;
```

---

## Integration with briancline.co

The training page at `briancline.co/training` currently links to `schedule.briancline.co/connect`. Update all CTAs:

- "Book a Free Consultation" → `https://schedule.briancline.co/sailing`
- "Get Started" (bottom CTA) → `https://schedule.briancline.co/sailing`
- FAQ "How do I book?" → reference `schedule.briancline.co/sailing`

The sailing page on the scheduler is the canonical booking entry point. The training page on briancline.co is the marketing/content page that drives people there.

---

## Acceptance Criteria

### AC1: Session Type Selection
- [ ] Student can select from 3 session types (consultation, half-day, full-day)
- [ ] Free consultation is the default/prominent selection
- [ ] Prices display correctly with "+ tax" and 3% CC note
- [ ] Multi-day package pricing mentioned as informational note
- [ ] Session type selection drives the correct duration for calendar availability

### AC2: Sailing-Specific Form
- [ ] Boat name and boat location fields appear for sailing bookings
- [ ] Additional students counter works (0+)
- [ ] Notes field has sailing-specific placeholder text
- [ ] Returning students (by email match) get boat info pre-filled

### AC3: Calendar & Availability
- [ ] All session types show any valid start time within business hours (no artificial constraints)
- [ ] 15-minute buffer applies between sailing and all other booking types
- [ ] Google Calendar events have correct duration (60/180/390 min)
- [ ] Calendar event title includes "Sailing: [Session Type] — [Name]"

### AC4: Booking Persistence
- [ ] Sailing bookings save to Supabase with session type, price, boat info
- [ ] Bookings are linked to a `sailing_student` record (auto-created on first booking)
- [ ] Bookings appear in admin dashboard with sailing-specific details
- [ ] Filter by type works for `sailing` bookings

### AC5: Emails
- [ ] Consultation confirmation has sailing-specific content (what to bring, what to expect)
- [ ] Paid session confirmation shows price, payment terms, and guarantee
- [ ] Admin notification includes boat name and session type details

### AC6: Student Tracking
- [ ] `sailing_students` table auto-populated on first booking per email
- [ ] Admin can view all sailing students with session counts
- [ ] Admin can edit `sessions_purchased`, `package_type`, `total_paid`, `notes`
- [ ] Admin can mark a session as completed (increments `sessions_completed`)
- [ ] Student card shows "X of Y sessions completed, Z scheduled"
- [ ] Student detail view shows full booking history for that student

### AC7: Admin Settings & Dashboard
- [ ] Sailing pricing (half-day, full-day) configurable in admin settings
- [ ] Sailing bookings visible with session type/price in admin bookings list
- [ ] Booking detail shows all sailing-specific fields and links to student record

### AC8: Format & Auto-Approve
- [ ] All sailing bookings are in-person only (no format selector)
- [ ] All sailing bookings auto-approve (consultation, half-day, full-day)

### AC9: briancline.co Integration
- [ ] Training page CTAs link to `schedule.briancline.co/sailing`
- [ ] FAQ references the booking system correctly

### AC10: Cancellation Policy Display
- [ ] Cancellation policy displayed on the sailing booking page (informational only)
- [ ] Seasonal windows shown (12hr Dec–Mar, 48hr Apr–Nov)
- [ ] Wind/rain/vessel conditions mentioned
- [ ] No automated enforcement — Brian handles exceptions manually

---

## Estimated Effort

| Area | Estimate |
|------|----------|
| Type system + data model | 1-2 hours |
| Database migration (bookings + sailing_students) | 1 hour |
| SailingPage + SessionTypeSelector | 3-4 hours |
| BookingForm sailing extensions | 1 hour |
| SuccessPage sailing customization | 1 hour |
| Email templates | 1-2 hours |
| Admin: sailing students page + student tracking | 3-4 hours |
| Admin: booking detail updates | 1 hour |
| Admin settings (pricing) | 1 hour |
| HomePage card | 30 min |
| Cancellation policy display | 30 min |
| briancline.co link updates | 15 min |
| Testing | 2-3 hours |
| **Total** | **~16-21 hours** |

The student tracking system is the biggest new piece (~3-4 hours). Without it, the feature would be ~12-16 hours — but Brian explicitly needs this to stop losing track of where students are in their packages.

---

## Open Questions

1. **Tax calculation:** Show estimated tax on the page? California sales tax on services varies. Current approach: just show "$300 + tax" and let Brian handle the math at payment time. Simpler and avoids legal complexity.

2. **Training Application:** The original site sent a training application after the consultation. Should the scheduler trigger this, or does Brian handle it manually via email? (Recommend: manual for v1, automated in v2.)

3. **Session completion trigger:** How does Brian mark a session as "completed"? Options: (a) manual button in admin booking detail, (b) auto-complete when the booking date passes, (c) both — auto-complete after date with manual override. Recommend (c): auto-complete past bookings, with a manual "mark incomplete" for cancellations/no-shows.

4. **Student merge:** If the same person books with slightly different email addresses (e.g., personal vs work), how to handle? For v1: manual — Brian can update the student record. Flag for v2: email alias detection.

---

## Resolved Questions

- ~~**Start time constraints:**~~ No constraints. Any valid start time within business hours. The slot generator's existing `slotEnd <= dayEnd` check naturally limits long sessions. *(Brian: "No minimum on how early those can start.")*

- ~~**Multi-day packages in scheduler:**~~ Not scheduled as packages. Students book individual sessions; Brian tracks consumed/remaining via the `sailing_students` table. *(Brian: "Realistically we're just scheduling half and full day sessions one at a time.")*

- ~~**Session tracking:**~~ Included in v1. Brian needs this — students buy multi-session packages and sessions can be months apart. Without tracking, he loses count. *(Brian: "I often lose track of if someone is buying two, three, four, five... sessions.")*

- ~~**Cancellation policy:**~~ Display only. No automated enforcement. *(Brian: "The cancellation policy is mostly for display.")*

---

## Future Enhancements (not in v1)

- **Automated training application:** Send vessel assessment form after consultation booking
- **Seasonal availability:** Different hours/days for winter vs summer
- **Waiting list:** When Brian's calendar is full, let students join a waitlist
- **Payment integration:** Collect payment via Stripe after the 3-hour guarantee period
- **Student email alias detection:** Merge student records with different email addresses
- **Session notes per booking:** Brian adds post-session notes (what was covered, what to work on next)
