# Engine — Official Travel Partner on the event pages

Engine is the tour's Official Travel Partner. This is the **Omni "Swift"**
integration: we build discovery, **Engine hosts checkout** and owns payments,
cancellations, disputes and support.

That choice is deliberate and it is the thing to defend. Engine's partner API
offers two paths — **Swift** (above) and **Halo** (we build the whole booking
flow and take on payments + PCI). Swift is the only one that fits this site's
founding rule that commerce redirects out. `/vacations` is the one documented
exception to that rule and this must not become a second one.

**Do not add a booking form, a rate shop or a cart here.**

Every URL points at `engine.com` and nowhere else — never an affiliate layer.
Travelpayouts was pulled on 8/14 (`44b2590`) for silently rewriting travel links
site-wide to Kiwi/Klook; that commit's own message left "structure ready for
direct-brand links," which is this.

## What ships

| File | What it does |
|---|---|
| [`lib/engine.ts`](../lib/engine.ts) | The three URL builders, plus the hotel → property ID map |
| [`components/events/EngineStay.tsx`](../components/events/EngineStay.tsx) | The card and the per-hotel link, shared by both event surfaces |
| [`scripts/engine-properties.mjs`](../scripts/engine-properties.mjs) | Resolves and reports the property IDs |

### Three link types

1. **The co-branded front door** — `engine.com/partner/ppa`. Engine maintains
   that page; it reads "Sign up to claim your PPA offer."
2. **The group tool** — `groups.engine.com/new-trip`, with the event's city and
   dates prefilled. A **different product**, labelled as one: it raises a rate
   request for a *block* of rooms, which is what a club or a team travelling to
   a stop wants. Pre-event only — see the ⚠ in `EngineStay.tsx`.
3. **A dated per-hotel deep link** — `members.engine.com/properties/<ID>` with
   `checkIn` / `checkOut`. The actual Swift handoff. **Renders for no hotel
   today**; that is the open work item below.

All of it sits **UNDER** Kristen's negotiated room blocks, never above them. A
group rate with a book-by cutoff beats a public price, so pushing a general
booking site ahead of a contracted rate would cost the fan money and the tour
its block.

### Where it renders

Two placements, one component, both surfaces (the event page and
`NationalsLive`) so they cannot drift on a partner placement.

| Stop state | Placement | Section |
|---|---|---|
| Upcoming | `variant="plan"` — under the hotel list | Plan Your Trip → Where to Stay |
| **Being played** | `variant="onsite"` — beside gates and parking | Venue Guide → Know Before You Go |
| Completed | none | — |

⚠ **The onsite placement exists because the plan one disappears at first
serve.** Connor's 9/1 ruling retires all of Plan Your Trip once a stop starts,
and that took the Engine card with it — measured on the live Nationals page:
**zero `engine.com` links for the seven days that page is busiest**. A travel
*guide* is genuinely a pre-trip surface, but a *room* is not: Kristen's blocks
have book-by cutoffs weeks before the event (Cary's were 7/30 and 7/31), so
during event week the official blocks are expired and Engine is the only booking
answer the page still holds.

⚠ **Nothing on a completed event.** Nobody books a room for a tournament that
finished, and a travel partner's card on an archive page is an ad rather than an
answer.

### Tracking

`engine.com` is in `PARTNER_HOSTS` ([`OutboundClickTracker`](../components/global/OutboundClickTracker.tsx)),
so all three link types report as `partner_click`. The apex covers `members.`
and `groups.` too. Without that line the hotel handoff would be the one outbound
commerce click on an event page that nothing counts.

Every link carries the canonical event code as `utm_campaign`
(`0926-PPA-CARY-NC-USA`), a `utm_content` naming the placement, and — on the
per-hotel links — `utm_term` set to the property, so Engine can cut their side
by hotel across every event page that sent them a click. The group link also
carries Engine's own `sc=` attribution parameter, so the handoff is countable on
their side as well as ours.

⚠ **Dates are passed through as ISO strings and never parsed.**
`new Date("2026-09-26")` is UTC midnight, which is the previous day in every US
timezone — it would prefill a fan's stay one night early.

---

## OPEN ITEM 1 — the property map is empty. This is the unblock.

`ENGINE_PROPERTY_BY_HOTEL` in [`lib/engine.ts`](../lib/engine.ts) has no entries,
so no hotel renders a per-hotel Engine link today.

⚠ **An empty map is a working feature, not a stub.** With no entry a hotel simply
renders no Engine link and the section-level card still does its job. Nothing in
it is ever guessed: an ID that belongs to the wrong building would send a fan to
a different hotel than the one whose name they clicked — worse than no link, the
same call as dropping the dead Chicago hotel href (7/29) and the two Australia
registration links (8/6).

**It needs no certificates and no API.** The ID is in the URL when a signed-in
Engine user opens a property:

```
members.engine.com/properties/P0000000000000102095
                              ^^^^^^^^^^^^^^^^^^^^ this
```

So this is filled by hand, one hotel at a time, by anyone with an Engine login.
Add the line and that hotel gains a dated deep link on **both** event pages at
once.

### Hand it to whoever holds the login

Generate a fill-in sheet — the rows come from Kristen's live feed, so generate it
fresh rather than reusing an old one:

```bash
npm run engine:properties -- --csv > engine-property-ids.csv
```

Columns: **Event · Hotel · Where Engine should look · Engine property ID (fill
in) · Key**. They fill the ID column and send it back; the "Key" column is ours
and they should leave it alone.

The instruction to send with it:

> Sign in at `members.engine.com`, search each hotel by the address in column C,
> open the property, and copy the ID out of the browser's address bar — it's the
> `P…` string after `/properties/`. If you can't find a hotel, or you're not
> certain the result is the same building as the address, **leave it blank** —
> blank is handled correctly and a wrong ID sends fans to the wrong hotel.

Then paste the IDs into `ENGINE_PROPERTY_BY_HOTEL`, keyed by the Key column.
`npm run engine:properties -- --list` prints the same thing in a paste-ready
block if you'd rather work from that.

### Scope

**10 hotels** are on the live event pages today (Kristen's published blocks, via
the Jackalope feed): Cary ×2, Mesa ×2, Chicago ×2, Las Vegas ×3, Virginia Beach.
Start there — those are the ones a fan can actually click.

Add `--include-guides` for the full **39**, which brings in the static
`lib/event-guides.ts` hotels for the stops with no published block yet (Daytona,
Malibu, Palm Springs, Minneapolis, Cape Coral, Newport Beach, Greater Zion,
Sacramento, Atlanta, Cincinnati).

The map is keyed by hotel **name**, not by event, because a property is the same
building whichever stop is in town and Kristen's blocks move between events.

---

## OPEN ITEM 2 — the partner API is unreachable, and it is not the blocker

`npm run engine:properties` (no flags) resolves IDs against
`ContentService.ListProperties`. **It cannot reach the API**, and the failure
point is measured rather than assumed — re-confirmed 9/2, unchanged from 8/19:

- DNS resolves to 3 addresses; TCP :443 connects.
- **The TLS handshake SUCCEEDS** — `authorized=true`, server
  `CN=partner-api.engine.com`, negotiating both `h2` and `http/1.1`, with **and
  without** our client cert.
- Then **every HTTP/2 stream resets in ~150ms**, identically for GET and POST,
  the real path and a deliberately bogus one, plain REST and gRPC framing
  (`content-type: application/grpc`), cert present and cert absent.
- HTTP/2 to `www.google.com` and `engine.com` from the same machine returns 200.

That rules out an egress-IP block (TCP and TLS both complete), a rejected or
expired certificate (clean handshake, cert in date to Aug 2027), and wrong
protocol framing (a gRPC listener answers an unknown method with HTTP 200 +
`grpc-status=12`, not a reset). Something terminates our requests after TLS and
before routing. The script prints all of this so it can be quoted to Engine.

**Ask Engine:** is this sandbox certificate activated for `partner-api`, and is
the account entitled to `ContentService`? Quote the reset-after-handshake detail
— it rules out the allowlist answer they will reach for first.

⚠ **Fixing this would still not fill the map, so it is not on the critical
path.** The credential we hold is a **SANDBOX** mTLS pair, and these deep links
point at the **production** member site — a sandbox ID may name a building that
does not exist there. `--write` refuses to run from sandbox credentials for
exactly that reason (override with `--allow-sandbox` only to test the matcher).
A production credential is a second, separate ask.

### The credential

`.env.local` carries `ENGINE_CLIENT_CERT` / `ENGINE_CLIENT_KEY` (base64-encoded
PEMs, because env storage mangles multi-line values), plus
`ENGINE_API_BASE_URL` and `ENGINE_API_ENV=sandbox`. Issued to
*O=United Pickleball Association, OU=Tech Evaluation*, valid 30 Jul 2026 →
9 Aug 2027 by *Engine Partner API Sandbox*.

⚠ **It is deliberately in no Vercel environment.** The cert is only ever used by
a script on a dev machine — resolving at render time would mean shipping the
mTLS private key to Vercel and paying a handshake on page renders, for data that
changes about never. Production stays static and fail-safe.

⚠ **A partner slug cannot be guessed.** The docs' custom landing form
(`members.engine.com/join/:slug`) needs a slug issued with the Omni agreement,
and we hold none. `members.engine.com/join/ppa` and
`/join/zzz-not-a-real-slug` return **byte-identical 12,054-byte SPA shells**, so
a wrong guess would 200 in a link check and fail in a fan's browser. That is why
we use the verified co-branded `engine.com/partner/ppa` instead.

---

Docs: <https://engine-public.github.io/engine-partner-api/deep-linking.html>
