# Pickleball Vacations on ppatour.com — runbook

Vacations used to be a standalone Next app deployed to `vacations.ppatour.com`
(repo `Gull-Stack/pickleball-vacations`, local `~/pickleball/PPA`). As of
**August 2026 it lives here**, at `/vacations`, and that repo is archive-only.

This is a **commerce** surface — the only one on ppatour.com. It takes real
money. Everything below is either a cutover step or a thing that will silently
stop working if someone changes it without reading.

---

## Routes

| URL | What | Rendering |
|---|---|---|
| `/vacations/` | The trip — hero, itinerary, stay, pros, pricing, calendar | Static, ISR |
| `/vacations/register/` | Traveler form → Stripe Checkout | `force-dynamic`, noindex |
| `/vacations/success/` | Post-payment confirmation | `force-dynamic`, noindex |
| `/vacations/trips/punta-cana/` | Sept 2026 guest archive | Static, noindex |
| `/api/vacations/checkout` | Creates the Stripe Checkout Session | Node runtime |
| `/api/vacations/availability` | Rooms left (count-only, public) | Node runtime |
| `/api/vacations/stripe-webhook` | `checkout.session.completed` → email + sheet | Node runtime |

`/tour/travel`, `/travel`, `/register`, `/success`, `/trips` and
`/trips/punta-cana` all 301 into the above (see `next.config.ts`).

---

## 🔴 ROOT CAUSE — the webhook 308 (fixed 2026-08-20)

**Read this before anything else in this file.**

`trailingSlash: true` (`next.config.ts`) makes Next answer the unslashed
`/api/vacations/stripe-webhook` with a 308 to the slashed path. **Stripe does
not follow redirects.** The endpoint was registered in Stripe WITHOUT the
slash, so from the moment it was created on **2026-08-05** it failed 100% of
deliveries. Response body on every attempt:

```json
{ "redirect": "/api/vacations/stripe-webhook/", "status": "308" }
```

141–182 ms per attempt: it died in routing and `route.ts` never loaded. No
email, no sheet row, no `invalidateAvailability()`, for every booking between
2026-08-05 and 2026-08-20.

**Fixed** by re-registering the destination as
`https://www.ppatour.com/api/vacations/stripe-webhook/` (trailing slash).
Verified: unslashed → 308, slashed → 400 with the handler's own
`"Webhook not configured (missing signature…)"` body, which proves the route
now executes.

### If you ever re-register this endpoint, keep the trailing slash

This is the second time `trailingSlash: true` has bitten this funnel. The
redirect tables in `next.config.ts` already carry slashes on their destinations
for the same reason, with comments saying so. The Stripe registration is the
one URL that lives outside the repo, so nothing in code review catches it.

Anything else that POSTs to this app from outside — a new payment provider, a
partner callback, a cron pinger — has the same trap. Register slashed.

### Two separate faults, don't confuse them

The 308 was the cause of the outage. It was found only after fixing a second,
independent gap: `SENDGRID_API_KEY` / `SENDGRID_FROM` were never copied to the
ppatour-website project, so even once the route ran it would have no-opped.
Both had to be fixed. Fixing only the SendGrid half changes nothing visible,
which is exactly what happened on 8/19 before the 308 was found.

---

## ⚠ Cutover status — 2026-08-19 audit

Lainey asked why new bookings weren't producing confirmation emails. They
weren't. **Steps 3 and 4 below were never done.** What the audit found:

| Step | State |
|---|---|
| 1. Stripe env vars | ✅ Done. `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` on ppatour-website. `/api/vacations/availability` returns `known: true`. |
| 2. Re-point Stripe webhook | ✅ Done 8/5, but registered unslashed and so **failed 100% until 8/20**. See the root-cause section above. |
| 3. SendGrid + Sheets vars | ⚠ Half fixed 8/19. `SENDGRID_API_KEY` + `SENDGRID_FROM` added and verified. `SHEETS_WEBHOOK_URL` + `SHEETS_WEBHOOK_SECRET` **still missing.** |
| 4. Redirect `vacations.ppatour.com` | ❌ **NOT DONE.** The old app is still live and serving `/`, `/register`, `/trips` to real traffic. |

The old `vacations.ppatour.com` endpoint was never registered in Stripe at all, so no email path existed anywhere during the outage.

**Two funnels are selling the same 20 rooms.** `vacations.ppatour.com` runs the
archived `Gull-Stack/pickleball-vacations` build; `www.ppatour.com/vacations`
runs this one. Both read the same Stripe account, so `capacity.ts` counts
correctly across both, but only one of them can send an email.

### The second failure mode, precisely (SendGrid)

`lib/vacations/email.ts` `configure()` returns `null` when either
`SENDGRID_API_KEY` or `SENDGRID_FROM` is unset. `sendBookingEmails` then logs a
warning, returns `{skipped: true}`, and the webhook still returns 200. Stripe
sees success and never retries. The guest is charged, the room is counted, and
no email exists. Nothing in the funnel reports an error.

Same shape for `appendBookingToSheet`. The "Pickleball Vacations — Bookings"
sheet has held only two smoke-test rows since 2026-05-30. No real booking has
ever landed in it.

### Do not redirect the subdomain before verifying step 2

If Stripe still calls `vacations.ppatour.com/api/stripe/webhook`, that route is
currently the **only** one with the creds to send mail. Redirecting the
subdomain deletes it and turns a partial failure into a total one. Order:
confirm the webhook target → then redirect.

The redirect is safe for email itself. SendGrid's authentication records sit on
`em3148.vacations.ppatour.com` and `s1`/`s2._domainkey.vacations.ppatour.com`,
which are distinct hostnames from the bare web record.

### Mail facts worth knowing

- Vacations sends through the **GullStack** SendGrid account, shared with
  unrelated clients. Not a PPA-owned account.
- `SENDGRID_FROM` is `noreply@vacations.ppatour.com`. There is **no** verified
  single sender on any `pickleball.com` or `ppatour.com` address; sending works
  because `vacations.ppatour.com` is an authenticated domain (`valid: true`).
- `ppatour.com` domain authentication (`em8015`) exists but is `valid: false`.
  Its four ClouDNS records are uninstalled. Installing them is what would let
  Vacations send from a plain `@ppatour.com` address.
- Email Activity retention on this account is **3 days**, so it cannot be used
  to reconstruct how many confirmations were missed. Stripe payment dates are
  the only reliable source for that.

### Open

- Confirm the Stripe webhook target, then do step 4.
- Add the two `SHEETS_*` vars.
- Back-send confirmations for bookings made between the ~8/5 cutover and
  8/19. Two doubles are sold on Club Med Turkoise; check payment dates.
- Rotate the SendGrid key. The one in use is full-access (it can create and
  delete API keys); the webhook needs `mail.send` only.

---

## ⚠ Cutover checklist — NOT done by the code

These are console/DNS actions. Until they're done, the page is live but the
back half of the funnel is not.

1. **Stripe env vars on the `ppatour-website` Vercel project (Production):**
   - `STRIPE_SECRET_KEY` — the live `sk_live_…`
   - `STRIPE_WEBHOOK_SECRET` — signing secret of the NEW endpoint (step 2)

   Without `STRIPE_SECRET_KEY` the page still renders: availability returns
   `known: false`, scarcity counters hide, and checkout returns a 503. That is
   deliberate — a Stripe outage must not take the marketing page down — but it
   also means **a missing key looks exactly like a working page.** Verify by
   hitting `/api/vacations/availability` and checking `"known": true`.

2. **Re-point the Stripe webhook** to
   `https://www.ppatour.com/api/vacations/stripe-webhook`
   (event: `checkout.session.completed`). The old endpoint on the standalone
   app dies with it. **If this is missed, payments still succeed** — the guest
   is charged and gets nothing: no confirmation email, no internal
   notification, no sheet row. Silent, and the worst failure mode here.

3. **`SENDGRID_API_KEY` + `SENDGRID_FROM`** (verified sender) — done 8/19.
   `SENDGRID_FROM` is `noreply@vacations.ppatour.com`; there is no verified
   single sender on any pickleball.com address, so sending works off the
   authenticated `vacations.ppatour.com` domain. **The `SHEETS_*` pair is
   obsolete — see "Bookings go to Jackalope" below.** Both still fail soft:
   unset means that channel warns and no-ops, and the booking is still in
   Stripe.

4. **Point `vacations.ppatour.com` here as a permanent, path-preserving
   redirect** (Vercel → Domains → Redirect to `www.ppatour.com`).
   **This is not optional.** Punta Cana and Turks guests hold Stripe
   confirmation links of the form
   `vacations.ppatour.com/success?session_id=cs_live_…`, and Lainey's
   collateral prints the subdomain. The root-level redirects in
   `next.config.ts` exist specifically to catch those inbound paths — verified
   that `/success/?session_id=…` reaches `/vacations/success/` in one hop with
   the query intact.

5. **Optional:** keep the `pickleball-vacations` Vercel project deployed but
   domain-less for a few weeks as a rollback.

---

## Bookings go to Jackalope, not a Google Sheet (8/20)

`lib/vacations/sheet.ts` is **deleted**. It posted a flat row to a Google Apps
Script behind `SHEETS_WEBHOOK_URL`, that variable was never set after the move,
and the "Pickleball Vacations — Bookings" spreadsheet still holds nothing but
two smoke-test rows from 2026-05-30. Eleven weeks of nobody noticing an empty
sheet is the argument against leaving a second, dormant write path around.

`lib/vacations/jackalope.ts` → `POST /api/public/vac-booking` on Jackalope,
which writes `vac_bookings` + `vac_travelers`. That puts the manifest beside
`vac_events` (visits), `vac_trips` (the contracted block) and `stripe_charges`
(the money), so the whole funnel is one join. `stripe_charges` already had the
payment; what it never had was the passport names, DOBs, gender and skill
levels, and that is the part the resort needs.

- **Shared secret `VAC_BOOKING_SECRET`, set on BOTH Vercel projects.** They must
  match. The endpoint 401s on mismatch and 503s if its own copy is unset.
- **That endpoint is deliberately NOT CORS-open**, unlike `vac-event.js`. It
  carries PII. Never add an `Access-Control-Allow-Origin` header to it.
- **Idempotent on `stripe_session_id`.** Stripe redelivers — failed events retry
  for days and the outage backlog gets replayed by hand. Verified: posting the
  same session twice returns the same `bookingId` and leaves two travelers, not
  four.
- **`vac_bookings` starts empty.** Bookings paid before 8/20 are NOT in it.
  Replaying their Stripe events would backfill them but would also send those
  guests a SECOND confirmation email. Backfilling from the Stripe API instead
  writes the rows without touching email.

---

## Things that will bite you

- **`lib/vacations/content.ts` is the ONLY home for trip facts.** `/tour/travel`
  used to carry a hand-transcribed copy of the same trip; that is how the page
  ended up advertising Club Med Turkoise with a CTA pointing at
  `ppavacations.com` — a parked domain nobody here owns. Don't reintroduce a
  second copy. The Travel tour-program entry was deleted for this reason.

- **Availability is Stripe, not a counter.** `lib/vacations/capacity.ts` counts
  succeeded PaymentIntents by `metadata.destination` — so a refund frees its
  room and there is no number to drift. The contracted block is read from
  **Jackalope** (`/api/public/vac-plan`), which is where Lainey edits it;
  `content.ts` `capacity` is only the fallback if Jackalope is unreachable.

- **`/api/vacations/checkout` is the gate, not the UI.** Cards and the form hide
  a sold-out option, but the 409 in the route is what stops an 11th single
  putting Lainey over the resort contract.

- **Never render current-trip content on `/vacations/success/`.** The guest's
  actual trip is in the Stripe session metadata. Punta Cana guests re-opening
  their original link were told they were going to Turks & Caicos until that
  was fixed on 7/20. The session is the record.

- **`revalidate` on `/vacations` reports 30s, not the 60 in the file.** Next
  takes the minimum across the route, and the Jackalope plan fetch uses
  `next: { revalidate: 30 }`. Deliberate — `cache: "no-store"` there would opt
  the whole page out of ISR.

- **The Jackalope funnel beacon** (`lib/vacations/track.ts`) is mounted in
  `app/vacations/layout.tsx`, NOT the root layout, so tour traffic never lands
  in Lainey's trip numbers. It's what makes the Vacations module in Jackalope
  say "10 rooms from N visitors" instead of just "10 rooms".

- **Group reveals need BOTH attributes** — `data-reveal` (so the observer picks
  the element up) and `data-reveal-group` (so children stagger). With only the
  latter the children sit at `opacity: 0` forever. This shipped broken on the
  stat band for exactly that reason and was caught by rendering the page, not
  by building it.

---

## Open decision

The site-wide **`StickyBuyBar`** renders on `/vacations`, pinning a
"Buy Tickets — $25" CTA for the next tour stop to the bottom of a page whose
own conversion is a $3,800–$6,400 room. It's standard site chrome and a
reasonable cross-sell, but it does compete. Suppressing it on `/vacations` is a
one-line change in `components/global/StickyBuyBar.tsx` — Bryce's call.
