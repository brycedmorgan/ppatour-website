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
3. **On-site content owner — TBD.** Still the one thing blocking Phase 4, now
   narrowed to a specific eight-field form (see Phase 4).
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

## 10/8 — scores-first, and what MATCHDAY's SSO can (and can't) give us

**Bryce, 10/8:** "more like ESPN" — scores and brackets first, schedule and
events deeper, so it stops feeling like a website wrapper. Built on branch
`app-scores-first`: `/scores` is the app's first screen and first tab; tabs are
Scores · Rankings · Events · Watch · You. The old Live tab opened `/live`, the
homepage rehearsal harness, i.e. the homepage again.

**Favorites + push via MATCHDAY — findings (pbpulse, read-only):**
- MATCHDAY has no SSO of its own. It is an OIDC client of
  `oidc.pickleball.com` (Jason), scope `openid offline_access email`, no PKCE,
  and mints its own Supabase session after the exchange. ppatour.com can be a
  sibling client and gets the same `sub`.
- Favorites exist: `mlp_team_follows` (stable `team_uuid`, per-alert flags)
  and `user_notification_preferences` (followed pros as **free-text
  `player_name`**). Keyed by MATCHDAY's user id; only users who signed in with
  Pickleball.com (~186 of ~3,450) have a `sub` link at all.
- No partner API for favorites. Push tokens and APNs/FCM keys belong to
  MATCHDAY's bundle (`com.cc.pbpulse.app`) and can't be reused by our app.
- Supabase project moves at the Nov 9–15 cutover — don't integrate against the
  Lovable project.
- ⚠ Security, raise with the migration: `send-push-notification` accepts an
  `x-service-role: true` header with no secret check (`verify_jwt=false`), and
  `get_user_followed_players` / `get_user_followed_mlp_teams` are granted to
  anon.

**Recommendation:** own the follows ourselves on `sub` (Neon `ppatour-fanapp`
already holds device follows), seed MLP team picks from MATCHDAY for the
overlap after cutover via a server-to-server endpoint, and send our own push
from the store app. Asking Jason for our OIDC client (emailed 10/1) is still
the gate.

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

**Phase 3 — follow list + alerts. ✅ SHIPPED 8/18.** Follow buttons on athlete
profiles, a "You" tab (`/following`), device-local follows with no account, and
web push off a Neon store (`ppatour-fanapp`) + VAPID keys on Production. Four
alerts built; `PUSH_ALERTS` fires only `draw` on day one. See
`lib/push-alerts.ts` for why, and the 8/18 pt. 2 session log for the operational
details.

**Phase 4 — "Today at the event". ✅ SHIPPED 8/19** at
`/events/<year>/<slug>/today`; owner for Nationals is **Haley Brezec**, and her
list is five fields because Cary's parking/ADA/shuttle/rideshare are already
sourced. Original scoping below.

**Phase 4 (as scoped).** One route, `/events/<year>/<slug>/today`,
on the **website**, not app-only — the app's Event tab points at it and it becomes
the top of the event page during event week. Ordered for someone standing at the
gate, which is not how a website usually orders things:

1. **Right now** — what is on which court (`/api/scores` already carries court +
   live status).
2. **Today's play** — gates, first serve, round, amateur sessions
   (`lib/event-schedule.ts`, transcribed for Nationals).
3. **Getting in** — address + directions (`lib/venue-locations.ts`), parking,
   will call, bag policy.
4. **Watching** — what is streaming, where.

1, 2 and half of 3 are buildable with data we already have. The rest is **eight
fields per event** a human must supply: venue map image, parking (where / cost /
maps link), gate + bag policy, will call, food, shuttle or rideshare drop, ADA
entrance, one know-before-you-go note. Authored in Jackalope on the event-code
spine, published through the existing revalidate hook. Eight is the cap on
purpose — a longer form does not get filled.

⚠ **A blank field renders as nothing, never as a guess.** On 8/5 hand-written
parking copy was deleted from all 18 event pages because it quoted unsourced
prices ("$20/day, or free with a Reserved+ ticket"). Wrong on-site information
does not read as a typo; it sends someone to a lot that is not there.

**Pilot: Nationals, Cary, Aug 31 – Sep 6** — the only stop with a real
transcribed order of play AND the only stop with finalized parking. Everywhere
else would ship with six of eight fields empty.

**Not doing: GPS geofencing.** "You are at the venue" costs a location
permission prompt, and permissions cannot be asked for twice. Event week is
signal enough to promote the view.

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
