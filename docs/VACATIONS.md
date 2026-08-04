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

3. **`SENDGRID_API_KEY` + `SENDGRID_FROM`** (verified sender) and
   **`SHEETS_WEBHOOK_URL` + `SHEETS_WEBHOOK_SECRET`** — copy from the
   `pickleball-vacations` project. All four fail soft: unset means that channel
   logs a warning and no-ops, and the booking is still recorded in Stripe.

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
