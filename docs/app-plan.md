# Turning ppatour.com into an app

Scoping brief, 2026-08-18. Bryce asked what it would take. Short answer: most of
the content already ships on the site, so this is 80% a product-shell and
data-ownership job, not a rewrite.

## Decisions — Bryce, 2026-08-18

1. **We ship our own app, MATCHDAY keeps running.** "MATCHDAY by Pickleball
   Inc." (iOS `id6755119460`, Android `com.cc.pbpulse.app`, seller Christopher
   Cantino) stays where it is. Bryce: *"different funnel"* — MATCHDAY is its own
   audience, ours is the tour's own fans coming off ppatour.com.
2. **In the app, the score bar owns the bottom edge.** `StickyBuyBar`, the
   tour's #1 ticket CTA, stands down inside an installed window and is untouched
   on the web. Website sells tickets; app follows the tour.
3. **On-site content owner — TBD.** Still the one thing blocking Phase 4.
4. **Live scores are not blocked.** The feed is already on the site (Wesley has
   it implemented); no new access to chase.

## What already exists

| Feature Bryce asked for | State on the site today |
|---|---|
| Live scores along the bottom | `components/global/ScoreTicker.tsx`, `components/live/LiveBar.tsx`, `LiveScoreTicker.tsx`, `ScoresBoard.tsx`; `/api/scores` (30s CDN window) and `/api/ticker` (which partner is live right now) |
| Standings / rankings | `/rankings`, `/leaderboards`, `lib/rankings-api.ts`, `lib/division-rankings.ts`, `FinalStandings.tsx` |
| Schedule | `/events`, `/events/[year]/[slug]`, `lib/event-schedule.ts` (order of play, pro + amateur by day) |
| Brackets | `/brackets`, `BracketView.tsx`, `/api/brackets` |
| Event travel content | `lib/event-guides.ts` (hotels, city picks), `lib/venue-locations.ts` (verified street addresses) |

What did **not** exist before 8/18: any manifest, icon set, or app-shell
navigation. Phase 1 and 2 below closed that; there is still no service worker
and no store presence.

## Phases

**Phase 1 — make it installable. ✅ SHIPPED 8/18** (`app/manifest.ts`,
`components/app/`). Add to Home Screen opens a standalone window with a
five-tab bottom bar — Home · Live · Rankings · Schedule · Event — and no
marketing footer, cookie banner or accessibility launcher. Detection is
`display-mode: standalone`, iOS's `navigator.standalone`, then the manifest's
own `?source=pwa`, because older iOS reports neither inside a home-screen
window. Still open: a service worker for offline, and an in-page install
prompt.

**Phase 2 — the persistent score bar. ✅ SHIPPED 8/18**
(`components/app/AppScoreBar.tsx`). Always on, every route, cycling every live
match every 5s off `/api/ticker` — the same feed as the header ticker, so the
two cannot disagree. With nothing live it shows the next tour stop rather than
vanishing. Web is unchanged.

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

1. ~~MATCHDAY overlap~~ — settled 8/18, both apps run.
2. ~~Live score feed~~ — settled 8/18, we already have it. Note the shape it
   is in: polling on a 30s cache, which is right for a bar that redraws while
   you look at it. A *notification* ("Anna Leigh just took game 1") is a
   different job and needs somewhere to run the poll when the app is closed.
   That is Phase 5, not a data ask.
3. **No player→events endpoint.** Same blocker as "playing next" on athlete
   profiles (`docs/DATA-ASKS.md` §5). Without it, "follow a player and get
   notified when they play" cannot be built honestly.
4. **No on-site content owner.** Site maps, parking, gates. Ops has this in
   decks and emails, never in a feed.
5. **Ticketing stays out.** Tixr owns the wallet and scan.

## Cost

Engineering is in-house. Cash: Apple $99/yr, Google Play $25 once, push on a
free tier. The spend that matters is design and per-venue maps.
