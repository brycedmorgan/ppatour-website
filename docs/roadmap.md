# ppatour.com — roadmap

What we are trying to do here, what is next, and what we want but cannot build
yet. Detailed API asks live in [`DATA-ASKS.md`](DATA-ASKS.md); the dated history
lives in the Session Log in the repo root `CLAUDE.md`.

> ⚠ **Before quoting any GA4 number for this site, read
> [`ANALYTICS.md`](ANALYTICS.md).** Property `358407319` carries five websites and
> ppatour.com is 2% of its views. Every unfiltered metric in it is Pickleball
> Brackets, not the PPA Tour.

The site is the **content / discovery / streaming** layer. Commerce redirects out
to partners (Tixr for tickets, pickleballtournaments.com for amateur
registration). There are **two deliberate exceptions** — Pickleball Vacations
and `/shop` — and in both the provider hosts the checkout. No card data,
addresses or order state live in this app, and there is no cart. A third
commerce surface needs the same conversation those two had.

---

## Now — in flight

| Item | State | Blocker |
|---|---|---|
| Athlete hero images | Slot shipped 8/15; **1 of 179 filled** (Anna Leigh Waters) | Named per-player photography — see Wishlist |
| Punta Cana bookings | LIVE at $4,800 double, 1 room left | none; Lainey controls rooms in Jackalope |
| MLP per-player timeline | Endpoint approved, awaiting their push | `team_leagues_rosters` going live (DATA-ASKS §6) |
| "Playing next" on profiles | Not started | Player→events endpoint (DATA-ASKS §5) |
| `/shop` headless storefront | Built 8/19, **shipped dark** — renders a holding state | A Storefront token, and the PBC decision below ([`SHOP.md`](SHOP.md)) |
| PPA × Vuori apparel deal | Concept + line sheet built; no approach made | Bryce to open the conversation |
| **GA4 property contamination** | Found 8/24; **nothing quotable until filtered** — [`ANALYTICS.md`](ANALYTICS.md) | Option A is buildable now; the split needs Bryce + the brackets owner |

## The fan app

ppatour.com is installable as of 8/18 — manifest, app shell, always-on score
bar. The full plan, the decisions behind it and what is still blocked live in
[`app-plan.md`](app-plan.md). Next up there: a service worker for offline, an
install prompt, a follow list, then the on-site event mode (blocked on an
owner per event, not on code).

## Next — buildable today, no external dependency

1. **Put the `Hostname contains ppatour.com` comparison on GA4 property
   `358407319`**, and add the same filter to Jackalope's `api/marketing/ga4.js`
   **before** `GA4_SA_KEY` is set. Five minutes, reversible, and until it exists
   every number the property reports is 98% somebody else's traffic
   ([`ANALYTICS.md`](ANALYTICS.md)).
2. **Add `team_leagues_rosters` to Jackalope's probe** (`lib/pbapi.js`
   `TEAM_LEAGUE_ENDPOINTS`). One line. Without it we cannot detect the endpoint
   going live, so Slack is our only signal.
3. **Discipline-level "where their points come from"** on athlete profiles. The
   WPR weighting is verified exact for all 2,033 ranked pros (DATA-ASKS §4), so
   this needs no new access.
4. **Per-event placements per player** by walking the bracket feed — buildable
   now as a cron-warmed job (DATA-ASKS §4a).
5. **Mirror the Trip Builder into `NationalsLive.tsx`.** The `-live` route
   renders its own trip section and drifts from the main event page.
6. **Fill `HEROES_BY_SLUG`** for marquee pros as named photos arrive.
7. **A Shopify `products/update` webhook** calling
   `revalidateTag("shopify-catalog")`, so a merchandising edit appears at once
   rather than within five minutes. Only worth building once someone is
   merchandising live.
8. **Verify `SHOPIFY_API_VERSION`.** It defaults to `2026-07` and no query has
   ever run against a real store. A rejected version fails safe and therefore
   looks exactly like "no products published yet" — check it first if the shop
   shows its holding state with a token set.

## Later — wants a decision, not code

- **Site chrome during a live event.** The homepage flips itself live, but
  `TopBar` and `StickyBuyBar` are still pathname-gated to `/live`. Making
  `StickyBuyBar` live-aware turns the tour's #1 ticket CTA into "Watch Live" on
  every page for the duration of an event. Commercial call, not a cleanup.
- **Who runs the PPA Tour store.** Pickleball Central already operates a live
  **PPA Tour Store** (10 products, *"the official retailer of the PPA Tour"*),
  and ppatour.com's own header "Shop" link points at it. PBC holds the
  **Official Store** designation, so repointing that link at our `/shop` moves
  revenue away from a Gold partner's contract. `/shop` is therefore built but
  absent from the nav. Three resolutions are written up in [`SHOP.md`](SHOP.md);
  the one that costs nobody anything — PBC's Shopify as the backend, `/shop` as
  the PPA-branded front end — is blocked because PBC is **not** in the
  Pickleball Holdings LLC Shopify org. **Bryce + Connor.**
- **How we separate ppatour.com from Pickleball Brackets in GA4.** `G-QCCT4TV3JR`
  is live on their production sites, so we cannot delete the stream — that is
  their measurement, not ours. Three resolutions are written up in
  [`ANALYTICS.md`](ANALYTICS.md); the right end state (C, move their streams to
  their own property) needs whoever owns `G-QCCT4TV3JR` in the room.
  **Bryce + the brackets owner.**
- **News home** — ppatour.com vs pickleball.com. Open since 7/28.
- **MLP's absence from the site.** Still unaddressed.

---

## Wishlist — we want this, we cannot build it yet

Each of these is blocked on data or a person, never on engineering time. Do not
approximate them; every one has a plausible-looking fake that would publish
something untrue.

### 1. "Playing next" on every athlete profile
**Want:** Anna Leigh Waters' page says which stop she plays next.
**Blocked on:** the player→events endpoint (DATA-ASKS §5).
**⚠ The tempting fake:** inverting `lib/event-field.ts`. It only knows the field
once a draw publishes — event week — so before that any list is a guess. The
page already distinguishes "In the Draw" from "Ones to Watch" for this reason.

### 2. A hero photo on all 179 profiles
**Want:** every pro gets the treatment ALW has.
**Blocked on:** per-player photography. The tour's library is filed by **venue**,
not by player — the `type:'athletes'` rows are all captioned "Player walk-in"
under a venue id — so nothing names who is in a frame.
**⚠ The tempting fake:** identifying faces ourselves. Most tour photography is
doubles and both women in a PPA women's final are frequently blonde. Attribute
from provenance or not at all (`lib/athlete-heroes.ts`).

### 3. Registered-player counts on event pages
**Blocked on:** the same endpoint as §1. Currently renders an honest
"Registration Count Coming" chip.

### 4. Real amateur division days in the Trip Builder
**Want:** "your bracket plays Saturday" instead of "the day posts with the order
of play".
**Blocked on:** division/day data, unpublished until after the registration
deadline.

### 5. True per-day watch odds
**Want:** "likely to play into Sunday" backed by history rather than rank.
**Blocked on:** each pro's historical round-by-round results (Dillon Segur's
source). Today's projection is labelled as a projection everywhere it appears.

### 6. Career earnings, W/L, win streaks, ranking movement arrows
**Blocked on:** feeds we do not have. Asked 7/28, still open.

### 7. Event Coverage back on event pages
**Want:** the "Coverage" section repopulated.
**Blocked on:** mapping the 322 migrated WP posts carrying an event category onto
this site's event slugs. Data work, not access.
