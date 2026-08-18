# Turning ppatour.com into an app

Scoping brief, 2026-08-18. Bryce asked what it would take. Short answer: most of
the content already ships on the site, so this is 80% a product-shell and
data-ownership job, not a rewrite.

## The decision that comes before any code

**MATCHDAY already exists in both app stores.** "MATCHDAY by Pickleball Inc.",
iOS `id6755119460`, Android `com.cc.pbpulse.app`, seller Christopher Cantino,
landing page pblfg.com (see `lib/matchday.ts`). A second Pickleball Inc. fan app
splits the install base and the reviews. Pick one:

- **A — Fold in.** ppatour.com becomes the installable web app (scores /
  standings / schedule / on-site mode). MATCHDAY stays the store app and we feed
  it, or it absorbs the event-day experience.
- **B — Take it over.** We own MATCHDAY's roadmap and point it at our APIs.
- **C — Ship ours anyway.** Only defensible if MATCHDAY is being wound down.

Everything below assumes we build the web app first, which is true under all
three options.

## What already exists

| Feature Bryce asked for | State on the site today |
|---|---|
| Live scores along the bottom | `components/global/ScoreTicker.tsx`, `components/live/LiveBar.tsx`, `LiveScoreTicker.tsx`, `ScoresBoard.tsx`; `/api/scores` (30s CDN window) and `/api/ticker` (which partner is live right now) |
| Standings / rankings | `/rankings`, `/leaderboards`, `lib/rankings-api.ts`, `lib/division-rankings.ts`, `FinalStandings.tsx` |
| Schedule | `/events`, `/events/[year]/[slug]`, `lib/event-schedule.ts` (order of play, pro + amateur by day) |
| Brackets | `/brackets`, `BracketView.tsx`, `/api/brackets` |
| Event travel content | `lib/event-guides.ts` (hotels, city picks), `lib/venue-locations.ts` (verified street addresses) |

What does **not** exist: any `manifest.ts`, service worker, icon set, or
app-shell navigation. There is no installable app today.

## Phases

**Phase 1 — make it installable (small).** `app/manifest.ts`, icon set from
`app/icon.svg`, theme color, service worker for the offline shell. Detect
`display-mode: standalone` and swap site chrome for an app shell: bottom tab bar
(Live · Rankings · Schedule · Event · Me), no marketing header, no cookie
banner. Add to Home Screen prompt on mobile.

**Phase 2 — the persistent score bar.** Promote `LiveBar` from `/live` to every
route, driven by the ticker's "is a partner live" signal. The roadmap already
flags this as a commercial call, not a cleanup: it competes with `StickyBuyBar`,
the tour's #1 ticket CTA. Decide which one wins during an event.

**Phase 3 — follow list.** "My players" and "my events", localStorage first, no
login. This is where the app beats the site.

**Phase 4 — on-site event mode (the real work).** Geofence or event-week
detection flips the app into venue mode for, say, the North Carolina Open: site
map, parking and gates, today's order of play by court, shuttles, food, will
call, accessibility. **None of this data exists in structured form.** It has to
be authored per event, by the pod that runs the event, in Jackalope on the
event-code spine, then published to ppatour.com through the existing
`/api/revalidate-events` hook. Code is maybe a week. Getting one owner per event
to fill the form is the actual project.

**Phase 5 — store presence and push.** A Capacitor or Expo shell around the web
app, plus native push, so notifications work on iOS reliably and we get store
discoverability. Apple guideline 4.2 rejects thin web wrappers, so the shell has
to carry real native features: push, offline, geofence, wallet. Tickets stay in
Tixr by deep link.

## Blockers that are not engineering time

1. **MATCHDAY overlap** — strategic, above.
2. **No live push feed.** `/api/scores` is polled per division on a 30s cache.
   "Anna Leigh just took game 1" needs a webhook or a delta endpoint from the
   Pickleball.com API team (Jason Santerre writes the spec, Kenan Hasanovic
   says whether it is built).
3. **No player→events endpoint.** Same blocker as "playing next" on athlete
   profiles (`docs/DATA-ASKS.md` §5). Without it, "follow a player and get
   notified when they play" cannot be built honestly.
4. **No on-site content owner.** Site maps, parking, gates. Ops has this in
   decks and emails, never in a feed.
5. **Ticketing stays out.** Tixr owns the wallet and scan.

## Cost

Engineering is in-house. Cash: Apple $99/yr, Google Play $25 once, push on a
free tier. The spend that matters is design and per-venue maps.
