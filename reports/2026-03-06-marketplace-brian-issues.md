# Brian's Marketplace Issues — March 6, 2026

Source: Brian's message in #marketplace, reported from hands-on testing.

## Auth & Account

1. **Enable account creation** — sign-up flow needs to work
2. **Test forgot password + password reset flow**
3. **Account settings Save doesn't work** — no confirmation, no animation, no visible effect (tested with SMS notifications toggle, phone number, profile changes)
4. **Security tab broken** — password change + 2FA toggle: "Update Security Settings" button has no animation, no visible effect

## Boat Management

5. **Add Boat fails** — error: `"New row for relation boats violates check constraint 'boats_type_check'"` (red error in background, modal stays open)
6. **Add Boat modal needs boat type dropdown** (currently missing/free text?)
7. **Add Boat image URL field should support file uploads** too
8. **Zero boats showing** after attempted add

## Profile & Layout

9. **Get Verified modal overlaps/pushes "My Boats" text off to the right** on Boat Owner page

## Provider Flow

10. **Provider page says "No Provider Listing Found"** — no way to claim from the profile page
11. **Claim listing flow unclear** — SailorSkills Diving shows as Featured + Verified but Brian can't claim it; no visible "Claim" button
12. **"Get Listed" button → dead end** — just shows "No provider listing found" with Browse Directory / Contact Us
13. **Should have a provider registration form** instead of just "Contact us"
14. **Provider search should auto-complete against existing directory** — if match found, prompt to claim

## Search

15. **Search for "Hull Cleaning Berkeley" returns nothing** despite SailorSkills Diving being listed as Hull Cleaning + Diving in Berkeley

## Reviews & Quotes

16. **Submit review → "Numeric Field Overflow" error**
17. **Request Quote submitted but no email received** — unclear where the email goes

## Redirects (confirmed working correctly)

- `sailorskills.com/diving`, `/detailing`, `/training`, `/deliveries` → should redirect to equivalent `briancline.co` pages
- `marketplace.sailorskills.com` is the correct current production URL
- `sailorskills.com` → `briancline.co` redirect is intentional for now
