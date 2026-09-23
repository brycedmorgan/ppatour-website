# Engine — Official Travel Partner, on the event pages

Engine is the tour's Official Travel Partner. This is the **Omni Go** integration:
we build discovery, **Engine hosts checkout** and owns payments, cancellations,
disputes and support.

That choice is deliberate and it is the thing to defend. Engine's partner API also
exposes a full booking service (`/book/v1/...`) where we would take on payments
and PCI. We do not use it. Omni Go is the only shape that fits this site's
founding rule that commerce redirects out — `/vacations` is the one documented
exception and this must not become the second.

**Do not add a booking form, a cart, or a rate shop here.**

Docs: [Omni Go](https://engine-public.github.io/engine-partner-api/omni-go-integration.html)
· [Deep linking](https://engine-public.github.io/engine-partner-api/deep-linking.html)
· [API spec](https://engine-public.github.io/engine-partner-api/swagger-ui/index.html)

---

## What ships

| File | What it does |
|---|---|
| [`lib/engine-booking.ts`](../lib/engine-booking.ts) | The booking host (sandbox ↔ production) and the URL builders. **Imports no data**, so client components can use it. |
| [`lib/engine.ts`](../lib/engine.ts) | The property snapshot, the block de-dupe, and the hand-filled hotel→ID map. |
| [`lib/data/engine-properties.json`](../lib/data/engine-properties.json) | The committed snapshot of hotels near each venue. Generated, never hand-edited. |
| [`components/events/WhereToStay.tsx`](../components/events/WhereToStay.tsx) | The two-column row: official blocks beside Engine. Shared by both event surfaces. |
| [`components/events/EngineStay.tsx`](../components/events/EngineStay.tsx) | The Engine card. |
| [`components/events/EnginePropertyRow.tsx`](../components/events/EnginePropertyRow.tsx) | One hotel row — thumb, distance, rating, amenity chips. Shared by card and modal. |
| [`components/events/EngineMoreHotels.tsx`](../components/events/EngineMoreHotels.tsx) | The "View all N hotels" modal. |
| [`scripts/engine-nearby.ts`](../scripts/engine-nearby.ts) | Pulls the snapshot. |
| [`scripts/engine-properties.mjs`](../scripts/engine-properties.mjs) | The older hand-fill workflow for `ENGINE_PROPERTY_BY_HOTEL`. Superseded for discovery; still the way to attach an Engine ID to one of Kristen's blocks. |

### Where it renders

| Stop state | Placement |
|---|---|
| Upcoming | the `WhereToStay` row in Plan Your Trip — blocks left, Engine right |
| Being played | `variant="onsite"` in the Venue Guide, beside gates and parking |
| Completed | nothing |

⚠ **The onsite placement exists because the plan one disappears at first serve.**
Connor's 9/1 ruling retires Plan Your Trip once a stop starts. A travel *guide* is
a pre-trip surface, but a *room* is not: Kristen's blocks have book-by cutoffs
weeks earlier, so during event week Engine is the only booking answer left.

⚠ **No properties means no card, in either placement.** The property list is the
only thing in it that does anything; without one it is a logo and a sentence.

---

## The one line that takes this live

`ENGINE_ENV` in [`lib/engine-booking.ts`](../lib/engine-booking.ts).

| | Booking host | API host (`ENGINE_API_BASE_URL`) |
|---|---|---|
| `sandbox` | `ppatour.booking-sandbox.engine.com` | `partner-api-sandbox.engine.com` |
| `production` | `ppatour.booking.engine.com` | `partner-api.engine.com` |

⚠ **THE PRODUCTION BOOKING HOST IS DERIVED, NOT CONFIRMED.** Engine's Omni Go
guide specifies `[yourBrand].booking.engine.com`; their team sent us the sandbox
host with a live example. Nobody has handed us the production URL or served a 200
from it. **Confirm it, and open one property there, before flipping.** A wrong
booking host is a dead link on every hotel on the site at once.

⚠ **DEPLOYING WITH `ENGINE_ENV` STILL SET TO `"sandbox"` WOULD PUBLISH SANDBOX
LINKS.** Keep this off main until Engine confirms the production host and issues a
production credential.

⚠ **THE SNAPSHOT IS IGNORED UNLESS ITS ENVIRONMENT MATCHES.** It records which
environment produced it. Flip `ENGINE_ENV` without re-running the script and the
lists go quiet rather than publishing IDs that may name a different building.

---

## The credential, and the failure that cost three weeks

`.env.local` carries `ENGINE_CLIENT_CERT` / `ENGINE_CLIENT_KEY` (base64 PEMs,
because env storage mangles multi-line values), plus `ENGINE_API_BASE_URL` and
`ENGINE_API_ENV`. It is an **mTLS client certificate**, not an API key — issued to
*O=United Pickleball Association, OU=Tech Evaluation, CN=Wesley Ahlfeld* by
*Engine Partner API Sandbox*, valid 30 Jul 2026 → 9 Aug 2027.

⚠ **IT IS IN NO VERCEL ENVIRONMENT, ON PURPOSE.** It is only ever used by a script
on a dev machine. Resolving at render time would mean shipping the private key to
Vercel and paying a handshake on page renders, for data that changes about never —
and it would hand Engine's uptime a veto over whether Where to Stay has any content
during event week, which is exactly when the page is busiest.

⚠ **A SANDBOX CREDENTIAL SENT TO THE PRODUCTION HOST LOOKS EXACTLY LIKE A REJECTED
CERTIFICATE, AND IT IS NOT.** From 30 Jul to 23 Sep this integration was believed
blocked on a broken cert. What was actually happening, measured:

- `partner-api.engine.com` (production) completes the TLS handshake cleanly and
  then **resets every HTTP/2 stream at ~130ms**, identically for a real path and a
  deliberately bogus one. There is no HTTP status in a reset, so there is no error
  message — it simply hangs up.
- **The production edge never asks for a client certificate at all.** Connecting
  with no cert gets through the handshake too. So the cert was never being
  examined, which is what rules it out as the cause.
- `partner-api-sandbox.engine.com` — a different hostname on entirely different
  IPs — answers the same credential with **HTTP 200 and real data in under a
  second**.

**If this API ever appears dead again, check the hostname against `ENGINE_API_ENV`
before suspecting the certificate.**

### What we are entitled to

Measured 9/23. Re-run `scratchpad/engine-entitlements.ts` after Engine grants
anything.

| Service | Status |
|---|---|
| `ContentService.ListProperties` | ✅ entitled |
| `ContentService.GetProperties` | ✅ entitled |
| `CatalogService.ListPropertyCatalog` | ❌ 403 |
| `LodgingShoppingService.FindBestOffers` (**rates**) | ❌ 403 |
| `LodgingShoppingService.FindAvailability` | ❌ 403 |
| `LodgingBookingService.*` | ❌ 403 |
| `NotificationService.*` | ❌ 403 |

403, not 401 — we authenticate fine, we are simply not entitled.

⚠ **THERE IS NO PRICE ON THESE CARDS BECAUSE WE DO NOT HAVE ONE.**
`ListProperties` is a content endpoint; rates live behind the shopping service we
cannot reach. If that is ever granted, publishing a nightly rate is a **decision**
about showing a number we do not control directly beside Kristen's negotiated
rates — not a free upgrade.

---

## Refreshing the snapshot

```bash
npx tsx scripts/engine-nearby.ts             # report only, writes nothing
npx tsx scripts/engine-nearby.ts --write     # refresh lib/data/engine-properties.json
npx tsx scripts/engine-nearby.ts --radius 8  # miles, default 5
```

The search is centred on the venue's **coordinates** where we hold them and on its
**verified street address** otherwise, both from
[`lib/venue-locations.ts`](../lib/venue-locations.ts). A venue with neither is
**skipped**, never searched on its city — that would centre a 5-mile radius on a
downtown nowhere near the courts and list hotels a fan cannot walk to, with
nothing on the page looking wrong.

Each row stores id, name, address, city/region, distance, hero image, star rating
and a curated set of amenity labels (`AMENITY_KEEP` in the script — free parking
first, because it is the one that decides where somebody driving to a venue with a
paid lot stays).

### How the pinned coordinates were obtained

`ListProperties` returns each property's coordinates **and** its distance from the
search centre. Sending the verified street address and then solving for the point
that satisfies every returned distance recovers the exact centre their geocoder
used — fitted over 11–25 properties per venue, residual RMS 0.001–0.004 mi.
Pinning it makes later pulls reproducible rather than dependent on their geocoder
behaving identically next time.

---

## Open items

1. **17 of 20 stops have neither coordinates nor a verified address**, so they
   render no Engine column. This is the biggest gap and it is ours to close, not
   Engine's. Cary Tennis Park, Darling Tennis Center and Life Time — Northbrook
   are done.
2. **Confirm the production booking host**, and get a **production credential**.
3. **Are sandbox property IDs the same as production IDs?** Decides whether the
   whole snapshot can be built in sandbox and flipped, or must be re-pulled at
   go-live.
4. **De-dupe is by hotel NAME.** It catches an exact match — verified: the JW
   Marriott and Best Western Plus Las Vegas West are both blocks on the Las Vegas
   page and both are correctly suppressed. It does **not** catch a hotel the two
   sources spell differently: Kristen's *"La Quinta Las Vegas Red Rock /
   Summerlin"* against Engine's *"La Quinta Inn & Suites by Wyndham Las Vegas Red
   Rock"* may or may not be the same building, and both currently render. Every
   property carries a **GIATA identifier**; storing one against each official block
   would make this exact.
5. **The snapshot is imported by `lib/engine.ts`, and `NationalsLive` is a client
   component**, so the file lands in that route's browser bundle. 25 KB at three
   stops; at full coverage it would be worth passing properties in as props from
   the server instead.
6. **Is there a fan-facing PPA landing page?** `engine.com/partner/ppa` is real and
   co-branded, but its own title reads *"Business Travel Done Better"* — a B2B
   programme signup. It was removed from the event pages on 9/23 for that reason.
   If the PPA rate needs an account, we have nowhere honest to send a fan.
