@AGENTS.md

# PPA Tour Website Rebuild — `ppatour-website`

Content-first rebuild of `ppatour.com`. The site is the **content / discovery /
streaming** layer; commerce redirects out to partners (tixr for tickets,
pickleballtournaments.com for amateur registration). Do **not** embed checkout,
build a cart, or replicate registration forms.

**Two documented exceptions, both on Bryce's call, and both HOSTED:** `/vacations`
(Stripe) and `/shop` (Shopify). Neither holds card data, addresses or order
state — each creates a session server-side and hands the buyer to the provider's
own checkout page. That is the line, and it is what makes them exceptions rather
than drift. A third surface needs the same conversation; a native cart needs a
different one.

**Full brief:** read [`CLAUDE_CODE_PASSOFF_v2.md`](CLAUDE_CODE_PASSOFF_v2.md)
end-to-end before touching code. The strategy doc (`Option B — Content-First
Strategy`) is the ultimate source of truth.

**Owner:** Bryce Morgan (President + CMO, PPA Tour)

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · shadcn/ui ·
Sanity (CMS, pending confirm) · Vercel (staging) → AWS (prod, Phase 3).

## Standing rulings (don't re-litigate)

- **The header "Shop" link stays pointed at Pickleball Central until Bryce and Connor
  say otherwise.** `Header.tsx:59` and `SiteFooter.tsx:50` link out to PBC's live
  **PPA Tour Store** (`/apparel/ppa-tour-apparel/`, 10 products, *"the official retailer
  of the PPA Tour"*). PBC holds the **Official Store** designation, so repointing that
  link at our own `/shop` moves revenue away from a Gold partner's contractual
  designation. **That is a commercial decision, not a routing change.** `/shop` is built
  and works, and is deliberately absent from the global nav until the call is made —
  see [`docs/SHOP.md`](docs/SHOP.md) for the three ways it can resolve.

- **The Tour = Majors, Cups, and Opens. Opens are 1,000 points, or 500 for three
  stops.** The 7/29 ruling (Opens 1,000, "The Tour = 1,000+") was superseded by the
  **9/8 board decision**: **Veolia Malibu Showcase, Minneapolis Indoor Open and
  Cincinnati Open are PPA 500 Opens** and stay PPA Tour stops (Bryce, 9/15). They are
  curated `tier: "open", points: 500`. The Tour is `isTourStop()` (not a Challenger,
  500+ points) in one place. **Copy says "Majors, Cups, and Opens", never "500 points
  or more".** Challengers and international 500s are NOT Tour stops.
- **Worlds is a Major** — the biggest one, at 3,000 points. Bryce, 7/29: "Worlds is
  the biggest slam. Still in the category." It is NOT a tier sitting above the Majors.
  `isMajor()` already badged it correctly; the pro-tour tier table, the TV schedule
  label, and the "Worlds, majors, cups, opens" copy pattern were the places that
  presented it as a peer category, and they're fixed.
- **Never quote a GA4 number from property `358407319` without
  `Hostname contains ppatour.com` applied.** The property holds five websites and
  ppatour.com is 2% of its views — the unfiltered number is Pickleball Brackets,
  not the PPA Tour. Applies to decks, sponsor conversations, Connor, and any API
  consumer including Jackalope. Found 8/24; see [`docs/ANALYTICS.md`](docs/ANALYTICS.md).
- **Ad inventory on ppatour.com is off the table for now** (Bryce, 7/29). Don't build
  slots, don't ask again.
- **Family details are removed from Jack Sock's bio ONLY — this is not a site-wide rule.**
  Wesley, 8/5: *"Only Jack Sock needed that info removed… no need to worry about this in the
  future."* His wife/child sentences are deleted from `lib/data/published-athletes.json`;
  nothing in code redacts anything. A roster-wide `isPersonalLife()` rule in `cleanBio` was
  built, shipped and then **reverted at his direction** — it had stripped 24 sentences from
  20 other pros (spouses, children, Tyler Loong's daughters, Tyson McGuffin's family). **Don't
  re-implement it, and don't "fix" the other 21 profiles that mention a spouse or child.**

## Session Log

> Entries before 2026-09-26 live in [`docs/session-log-archive.md`](docs/session-log-archive.md) (moved 2026-10-03: this file had grown past what a cloud routine can load). Same format, newest first.

### 2026-10-26 — Vacations checkout takes promo codes (Lainey)
- Lainey asked for a $1,000-off code for Black Desert without a separate Stripe link. `allow_promotion_codes: true` in `app/api/vacations/checkout/route.ts`, so every Vacations checkout shows Stripe's promo box (Lainey OK'd it on all trips).
- Codes live in Stripe → Product catalogue → Coupons. Bryce/Claude make them; Lainey does not need a Stripe login.
- ⚠ Line items are inline `product_data`, so a coupon can't be scoped to one trip by product. Scope a code with max redemptions + expiry instead. Real per-trip scoping needs a Stripe product id per trip in `trip-config.ts`.
- Jackalope records what Stripe collected, so a discounted booking stays on the same `vac_bookings` row.
- Coupon "Black Desert $1,000 off" + promo code `BLACKDESERT1000` (max 1 use) created in the **Pro Pickleball Association** Stripe account (`acct_1FYvnnLVDkSJQVHq`), which holds Vacations. Not "Pickleball Solutions". Lainey told 10/26.
- **Receipts + event codes (Lainey 10/26):** checkout now sets `payment_intent_data.receipt_email` (Stripe sends the receipt on payment) and stamps `event_code` (new required `TripConfig.eventCode`, from ziff `schedule.js` SCHED_VACATIONS) into metadata and into the payment description, so finance sees the trip in the Payments list and exports. Payments made before today have no code.
- ⚠ The push did NOT trigger a Vercel deploy. Shipped by `vercel deploy --prod --archive=tgz` (plain deploy fails: >15,000 files). Production is aliased to ppatour.com.
### 2026-10-22 (pt. 2) — Worlds parking lands (Dana, Asana `1219791843119153`)
- Her five sections verbatim in `PARKING_BY_SLUG["pickleball-world-championships"]` (General, Hotel Shuttles, Rideshare, VIP, ADA) + her shuttle map (`public/ppa/parking/pickleball-world-championships.webp`). Sixth finalized stop.
- **⚠ 2025 and 2026 share the slug.** New `PARKING_EDITION_START` pins it to 2026-11-02; `parkingFor`/`parkingText` take the start date (event page, /today, NationalsLive). Verified on the dev server: 2026 + /today carry it, 2025 keeps the holding line.
- Gates still TBD: don't derive one from "shuttles start 30 min before gates".

### 2026-10-21 — Junior PPA rankings refreshed (Daniela, Asana `1219751671856012`)
- Jake's sheet (edited 10/21 18:41 UTC) → `lib/data/junior-rankings.json`, `updated: "Oct 21, 2026"`. 2,577 rows (+46), no board shrank, 94–100% confirmed per division. Fetch → import `--check` → import, as 10/15.
- Verified against a second pull: rank, name, points and age match for all 2,577 rows (the sheet now writes some points as "1,500"; the importer handles it).

### 2026-10-22 — Engine LIVE on production (Official Travel Partner, Where to Stay)
- Engine sent the production mTLS cert + key via 1Password; Wesley confirmed the booking host `ppatour.booking.engine.com`. `.env.local` now holds the production pair against `partner-api.engine.com` (sandbox lines commented out beside it). **Still in no Vercel env, on purpose**: the site reads the committed snapshot, only `scripts/engine-nearby.ts` talks to Engine.
- `engine-live` merged with main and shipped; `ENGINE_ENV = "production"` in `lib/engine-booking.ts`; snapshot re-pulled against production: 12 stops, 299 hotels (`lib/data/engine-properties.json`). Verified a real property link renders PPA-branded with rooms and rates. ⚠ The booking host returns 200 for ANY property ID (SPA), so check in a browser, not curl.
- Wesley: no hotel photos in Official Room Blocks (all event pages; Engine's column keeps its photos). The 10/8 `hotelPhoto` map stays in lib/event-guides, unused.
- Refresh: `node --import <resolver> scripts/engine-nearby.ts --write` (no tsx in this repo; Node 24 type stripping + a resolve hook for `@/` and extensionless imports).
- Open: 8 stops have no venue address/coords (VB, Arizona, Mesa, Sacramento, Cincinnati, PPA Finals, + TBD venues); results sort by distance only, so some top rows are motels/vacation rentals. Both in docs/ENGINE.md.

### 2026-10-19 — Native app backend: /api/app/home, /api/push/native, APNs sender
- Bryce: "rebuild it like a real app." New Expo app lives in `~/pickleball/ppa-tour-app` (Gull-Stack/ppa-tour-app); this site is its backend.
- `GET /api/app/home` = `resolveScoresEvent()` + slim `getEvents()` list, edge-cached 5 min. One launch call for Scores + Events tabs.
- `POST/DELETE /api/push/native` stores phone tokens in `push_subscriptions` as `apns:<token>` / `fcm:<token>` (p256dh="native", auth=platform) so `subscribersFollowing` / `allSubscribers` return phones unchanged.
- `lib/apns.ts`: APNs over Node http2 + ES256 provider JWT, no Expo push service. Env `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_KEY`, `APNS_TOPIC` (default com.ppatour.app), `APNS_SANDBOX=1` for debug builds. Unset = inert. `sendToAll` dispatches on the endpoint prefix; prunes on 410 / BadDeviceToken. FCM (Android) not wired yet.
- Next: Bryce creates the APNs key in App Store Connect → Keys and sets the four env vars on Vercel; `pushSendConfigured()` is now VAPID **or** APNs.

### 2026-10-19 (pt. 2) — The three non-code SEO asks are out
- Bryce: "Do it. And send it." Sent from his Gmail/Slack: (1) Google sports-partnerships ask as a reply to Trent Marco's June "Pickleball and Google" thread (the only Google contact in the inbox); (2) Nathan a sourced Wikipedia draft + the COI/Articles-for-Creation route; (3) Caitlin a Slack DM to add the Jackalope service account to the MLP Search Console property. All logged in docs/SEO.md §7a.
- Next: chase Google 10/26 if silent; Nathan's submission; MLP numbers appear in the organic read once the grant lands.

### 2026-10-19 (pm) — Challenger: the other 9 tabs of the "Website Changes" sheet
- First pass only did the sheet's "Overall" tab. This pass does About, How It Works, Points, Path, Showdown, Sponsors, Host (sheet 1OLO3oiMSlaCcVvw7WtLmWkCggxiYOIOcNZ8sN5D3xeY; Anders, Brooke, Nathan).
- Anders' copy is verbatim (typos "awared"/"seperately" fixed). "Stop" → "event" across the page (Anders: "across the board"), nav label included.
- YouTube is now @ppachallengerseries (UCxMwmsqkVi9GW6yVIFDenCg, "PPA Challenger"). Mojo added to Sponsors from the tour roster entry.
- Showdown: Brooke removed the "both players agree / confirmed by Oct 26" line on purpose. Don't put it back. Day label is now "Semifinals and Finals – All Events".
- /about/host-tournament: "A DJ or MC" and "A podium, medals and trophies" removed from the host list (Brooke).
- Real Challenger photos LIVE: Tanner's 22-shot Drive folder → public/ppa/challenger/photos (1600w). Hero = Saturday-49 crowd shot under a red wash. Cards: own photo for Atlanta, Charlotte, Fort Collins, Houston, Punta Gorda, Seattle, Black Desert, Wilson; the rest rotate a 10-photo pool (lib/challenger-photos.ts).

### 2026-10-19 — Challenger page: red, logo, no Jack Sock, Tanner's copy fixes
- Tanner Groff DM'd two sheets 10/19: "PPA Challenger Points Only" (1YKUWYQ7…, '25/'26/'27 tabs) and "Website Changes" (1OLO3oiM…; Nathan + Anders).
- Points: every row agrees with lib/challenger-points.ts. Added Raleigh (Dec 2025) = 125. The level lookup now also tries the curated slug. Open: the '27 tab has no Newport Beach or Charlotte (our table has 250/125); Sarasota (Oct 2026) isn't on the '26 tab.
- Hero: Jack Sock photo gone (he has never played a Challenger). Now Challenger red `#ba0c2f` (new `challenger-red` tokens in globals.css) with the Series logo (public/ppa/challenger/logo-white.png, from the old ppachallenger.com). Every accent on the page and in the rankings is red.
- U.S. Challenger event cards now default to public/ppa/challenger/card.jpg (logo on red), not pro-tour action shots. Removed the Atlanta, Charlotte and Seattle pins (all pro photos).
- Copy: "PPA Tour Challenger Series" → "PPA Challenger Series"; "PPA-run tournament" → "PPA-run tour"; Anders' description line is used verbatim.
- Still open: real Challenger event photos. Asked Tanner; pin them in HERO_OVERRIDE_BY_EVENT_SLUG and the hero when they come. The rankings workbook (Jacob Guidry) is still not here.
- Local gotcha: PB_API_TOKEN in .env.local returns 401, so local getEvents serves placeholder data. Verify points on prod only.

### 2026-10-18 (pt. 4) — Organic read: 28d clicks +44% YoY
- Bryce: "How is our organic growth?" GSC via Jackalope (`/api/seo/gsc?brand=ppa&yoy=1`, the YoY endpoint deployed this afternoon). 28d to 10/15: 245,784 clicks, +43.9% YoY, CTR 13.2% vs 8.1%, position 5.1 vs 8.1. 90d: −8.5% YoY (the window straddles the 8/4 relaunch; Sept–Oct are ahead). Full table: docs/SEO.md §7e.
- 93% of top-query clicks are brand. Non-brand is the growth lane (Phase 2 content, athlete pages).
- MLP: the GSC service account lacks access to the MLP property. Grant needed (Settings → Users and permissions).

### 2026-10-18 (pt. 3) — Wikidata items for the PPA Tour and the UPA
- Bryce: "Do the wikidata items." Created from his Chrome session (Wikidata auto-made a temp account, so no IP in the history): **PPA Tour Q141769292** (14 sourced statements), **United Pickleball Association Q141769280** (parts: PPA Tour + MLP; inception 2024-02-29), and MLP Q128285945 got `parent organization → UPA`. Org JSON-LD `sameAs` now leads with the Q-id.
- Gotcha: the auto-mode classifier blocks the API token fetch and anonymous `wbeditentity` from curl, but the item form in the browser + `mw.Api().postWithToken('csrf', …)` by item id in page context works.
- Next: standalone Wikipedia article (Nathan/PR, COI-disclosed); Google Sports Partnerships ask; GSC Events report 10/31.

### 2026-10-18 (pt. 2) — Scorched-earth schema pass; the score-box answer
- Bryce: "NFL gets score boxes on Google, we don't — how?" Answer (docs/SEO.md §7a): **not markup**. Google's sports boxes are licensed data feeds (league → Google Sports Partnerships, or via Sportradar/Genius/Stats Perform). nfl.com ships zero JSON-LD. Path = a data-rights conversation + a knowledge-graph entity. **The PPA Tour has no Wikidata item; "PPA Tour" on Wikipedia is a redirect** to a section of "Pickleball in the United States" (same for MLP, UPA). That is the real gap.
- Shipped: `lib/event-schema.ts` rebuilt — `@id`s, `competitor`+`performer`, one `subEvent` per pro division with the **podium as linked Persons** once completed (`lib/event-results.ts`, sync from tournament-history.json; builder stays client-safe for NationalsLive), `BroadcastEvent` per platform, OG card as 2nd image, offers dropped post-event. Org node enriched (founding 2018, UPA parent, LinkedIn, aliases). Athletes: `@id`, Country, `affiliation`, Wikipedia/Wikidata `sameAs` for 10 verified pros (`lib/athlete-sameas.ts`). Articles: `about`/`mentions` Persons. `/events/` ItemList.
- 10/7 list closed: unknown athlete → 404 (was 307); `/tournament/<slug>/` → matching event page (`app/tournament/[slug]`); `/ppa-blog/` → `/blog/`; `/search` out of sitemap; `/favicon.ico` rewrite. Open: pickleball.com profile sameAs (Jason), og:url, Mesa Cup duplicate title (editorial).
- Street addresses for every 2026–27 Tour venue + the curated past ones now in `lib/venue-locations.ts` (35 keys, each checked against the venue's own site; Liberty Park street left off as unconfirmed; the 2027 Cape Coral record's venue corrected to the feed's "The Courts, Cape Coral"). Pickleball Virginia Beach ≠ the Sports Center (928 S Birdneck Rd).
- Next: Wikidata item for the tour (Bryce/Nathan); Google sports partnerships ask via the Ads rep; Rich Results Test per template after deploy; GSC Events report on 10/31.

### 2026-10-18 (pt. 2) — Events feed refreshes every 2 hours, so an announcement isn't stuck behind a push

- **Catie Preis, #ppa-tour-europe 7:51AM:** next Europe announcements are coming and a stop that goes
  public on Pickleballtournaments has to show on ppatoureurope.com "almost immediately" to stay in sync
  with the social posts — *"These updates can't be stuck behind a GitHub permission for hours/days"*.
- **Nothing about a new stop ever needed a code push.** Stops come off the `ppa_tournaments` feed and
  render themselves; the only lag was OUR cache. `vercel.json` `/api/revalidate-events` was two daily
  slots, so a newly public stop could sit a day. Now `0 */2 * * *` — worst case 2h. Shipped by Wesley
  as `dbf87be` (push access for Claude on this repo still 403s, 4th day); both it and the head `5b75619`
  report Vercel success.
- The route header and the `lib/events-api.ts` comments said "midnight Central / once a day" and are
  corrected, so the next reader doesn't re-derive the old cadence.
- **What DOES still need a human, and Catie was told both:** the stop's own photo, or the card falls back
  to `VENUE_IMAGES` (Lille ran a Barcelona shot for this reason), and a heads up when a title changes
  after it goes public — the pre-public title needs a `CURATED_ALIASES` row (Lille's `…-p125-france`).
- ⚠ Rankings/athletes/content crons are untouched and still daily. Only the events calendar moved.

### 2026-10-18 — Challengers no longer show a fake 500
- Chris texted Bryce: 2027 Challenger schedule shows 500 pts on all but one stop. Cause: uncurated Challengers fell back to TIER_META.challenger.points (500); real levels are 125/250 per event (PT sanction level, not in our feed).
- Shipped 7c0d98c + 7b56dc3: `pointsText`/`tierBadgeText` in lib/placeholder-data.ts — unknown Challenger level = no number on cards, "—" in the past table, out of points filters + search.
- Levels in: 2027 Challenger Master sheet (Bryce, 10/18) → lib/challenger-points.ts, keyed by year (curated match is year-free, so 2027 Seattle was inheriting 2026's 250). Next: Jason/Kenan expose PT sanction level in the feed; 2026 past stops still unconfirmed (show "—").

### 2026-10-18 — VB Sunday starts 8AM ET on weather; Europe ITP copy + Yuri Syromolotov (Bryce's patches)

- **Keaton Maynard, 10/17 11:12PM ET:** Sunday 8AM + 9AM ET semifinals on Championship Court and Grandstand, first
  finals match 10AM ET. VB Sun first serve 10:00 → **8:00 AM** (`FIRST_SERVE_BY_SLUG`); PBTV Sunday 10AM → **8AM ET**
  in both `lib/broadcast.ts` and `lib/tv-schedule.ts` (TC stays 10AM–2PM); Sunday label "Championship Sunday —
  semifinals, then finals" (`LABELS_BY_SLUG`). Gates follow via `broadcastStart` (the noon run ends 10/17).
  8AM platform confirmed by Keaton, #marketing-general 10/18 7:08AM: "Now 8am start on PBTV for both courts". Audit: broadcast ↔ tv-schedule agree (10 slots); the sheet
  still says Sun PBTV 10AM, so it flags Sunday until it's updated (plus the old Tue/Wed rows).
- /europe ITP card: Catie's new second paragraph (ITPs may still compete in 2026, ≤125-point events), verbatim.
- New roster entry `yuri-syromolotov` (row 28 of Catie's sheet): no `portrait` on purpose (silhouette until the file
  lands), divisions are the house default pending her confirmation, Instagram 200.
- Kanichová's new portrait (Katherina, #ppa-tour-europe 10/17): "VICTORIA KANICHOVA NEW.png" (1080×1350, Drive file
  `1KVkv7-DFru34Uipyd5QY3N4vKczUzVqs`, link-shared) → flattened on white, 900×1125 q82 (56 KB), same path
  `public/europe/pros/viktoria-kanichova.jpg`, so no roster change.

### 2026-10-16 — Europe: DailyStory event-news form + Traskin's profile (Bryce's patches, no push access)

- /europe#contact: Juan's hosted DailyStory form (double opt-in, GDPR) as "Email / Event News" between the
  Media and Referees links and Contact Us. ⚠ Separate list from the `LeadMagnetCapture` at the foot of the page
  (Customer.io); the comment in page.tsx says which to delete if Europe consolidates. No CSP on our side and no
  X-Frame-Options on theirs, so the frame embeds.
- `lib/europe-roster.ts` Henrik Traskin: age 27, Joola, Instagram (200), tagline + one-line bio from Catie's
  sheet. Sponsor first went up as "Joola" (her sheet); Catie confirmed "Joola Europe", matching the other seven.

### 2026-10-15 (pt. 2) — Lille event card: curated row + alias + photo (for Bryce, no push access)

- Feed (live, 10/15): **"PPA TOUR EUROPE - P125 LILLE"**, Nov 12–15, Villeneuve-d'Ascq, Registration Open. Bryce's
  link read `…-p125-france` (the pre-public title); both slugs alias to `ppa-france-p125-lille` in `CURATED_ALIASES`.
- New row in `lib/placeholder-data.ts` with `image: "/ppa/event-lille-p125.jpg"`: Catie's Barcelona women's doubles
  shot (Drive original 6000×4000, 18 MB), cropped 4:5 at 1200×1500 q72 (156 KB), player centred, partner cropped
  out. Without it the card fell back to VENUE_IMAGES. Swap the photo when Lille has its own.
- `France: "FRA"` added to `COUNTRY_ISO3` in `lib/event-code.ts`.
- ⚠ pickleballtournaments.com 403s from here; the feed (PB-API-TOKEN header) is how to read titles/dates.

### 2026-10-15 — Junior PPA rankings refreshed (Daniela, Asana `1219559520094706`)

- Jake's sheet (edited 10/15 20:17 UTC) → `lib/data/junior-rankings.json`, `updated: "Oct 15, 2026"`. 2,531 rows
  (+60), no board shrank, 95–100% confirmed per division. Same fetch → import `--check` → import path as 10/12.
- Verified against a fresh pull of all 24 tabs: rank, name, points and age match row for row, 0 mismatches.

### 2026-10-14 (pt. 2) — Worlds Championship Sunday: first serve 10:00 AM; every day now has a time

- Brian Clark, DM 11:52, answering both asks from this morning: **"10am Sunday finals start"** and
  **"Won't know gate times until we know amateur play hours."** Nov 8 `firstServe` "TBD" → **10:00 AM**
  in `eventSchedules["pickleball-world-championships"]`. All seven days of Worlds now carry a first
  serve (11:00 AM Mon–Sat from his 10/14 note, 10:00 AM Sunday).
- The `amateurNote` read "Sunday's first serve … still to be announced" and would have contradicted its
  own table; it now says 11:00 AM Mon–Sat and 10:00 AM Championship Sunday, gates still TBD.
- **⚠ GATES STAY TBD FOR A STATED REASON, and the comment now records it.** They are blocked on the
  amateur play hours, not on nobody having asked. Don't derive a gate from the 11 AM first serve, and
  don't add a `GATES_BY_SLUG` line until Brian sends one. `gatesPublished` is still false, so the page,
  Know Before You Go and the concierge keep pointing at the Order of Play instead of naming a gate.
- Verified: the 7-day table, `gatesPublished` false, `timesPendingLine` reads "Gate times will be posted
  closer to the event; first-serve times are in the Order of Play." The **2025 edition is still withheld
  to the template** (the shared-slug guard), and Virginia Beach is unchanged (Sun 10 AM, Wed 12 PM).
  tsc clean (0 errors, whole repo).
- ⚠ `firstServeNote` is not used for Worlds (page.tsx passes null when a stop has a transcribed
  schedule), so the concierge takes its answer from the table, not from that sentence.
- Next: gate times from Brian once the amateur hours are set.

### 2026-10-13 (pt. 4) — Ramsey's Chicago Cup stats wrap

- Google Doc from Wesley (not link-shared; read via the Drive connector) →
  `championship-sunday-standout-stats-from-the-veolia-chicago-cup` in `lib/news-posts-authored.ts` (wpId 900007),
  verbatim, same shape as the Las Vegas wrap. Photo: Wesley's pick (Waters with the trophy and medal),
  `public/ppa/news/championship-sunday-standout-stats-chicago-2026.jpg`, 2048 q64, `position: "50% 38%"`, no names.
- ⚠ Copy flagged to Wesley, published as written: MD line "(Career titles: Waters 68, Johns, 81)" vs "200th
  overall career title" (68 looks like one discipline's count), and the stray comma in "Johns, 81".

### 2026-10-13 (pt. 3) — Mesa tickets on; VB order of play corrected (Asana sweep)

- **Carvana Mesa Cup** (Asana `1219412594134889`, Tanner Thygerson 10/8): `carvana-mesa-cup` mapped to Tixr
  `ppa-mesa-210307` (in the price snapshot, on sale, from $25) and register `ppa-tour-carvana-mesa-cup-2`.
- **VB order of play** (Asana `1219460793907394`, Matt Mayfield 10/12–13): Oct 12 "Pro qualifying" (no amateurs
  or juniors), Oct 13 "Pro round of 64"; noon start was already done (pt. 1/2). New `LABELS_BY_SLUG` +
  `dayLabelFor()` in `lib/order-of-play.ts`, used by both `buildSchedule`s and `proDayLabels` so the scores
  board agrees. ⚠ The template's Monday/Tuesday ("Amateur & junior brackets" / "Senior Open + pro qualifying")
  drops the R64 on every 7-day stop — fix per stop as the schedule owners confirm.
- ⚠ **Schedule owners going forward: Andrew DeHennis and Ben Smyth** split the calendar; confirm with them before
  publishing a stop's schedule. VB not yet confirmed with Andrew.

### 2026-10-13 (pt. 2) — Standing rule: gates and first serve = the day's earliest broadcast start

- **Wesley: "have the rule be the gate time always matches the earliest broadcast time for that day unless
  specified otherwise."** First serve follows the same rule (asked; otherwise Daytona/Malibu read a noon gate
  over a 10 AM first serve).
- `broadcastStart(slug, iso, state)` in `lib/event-schedule.ts`: earliest non-TAPE window in `lib/broadcast.ts`
  on that weekday, **converted ET → the venue's zone** (`tzForState`/`tzOffsetMs`, now exported from
  `placeholder-data`). Malibu 3PM ET = 12:00 PM local. Precedence for gates: GATES_AT_FIRST_SERVE → dated run
  (`GATES_FROM_BY_SLUG`) → GATES_BY_SLUG → broadcast → template; first serve: FIRST_SERVE_BY_SLUG → broadcast →
  template. Days with no live window (qualifier Mondays) keep the template.
- `state` now threads through both `buildSchedule`s, `playDays` (hero, home, live status) and `firstServeNote`.
  `gatesDaily(slug, gates[])` says "X daily" only when every day agrees, else points to the Order of Play.
  A broadcast stop no longer claims "an hour before first serve".
- **⚠ Worlds stays TBD.** Its transcribed schedule wins over the rule; the concierge's first-serve note and KBYG
  now follow it (they had read the templated days: "First serve is 11:00 AM", "Gates open 8:00 AM daily").
- Verified: VB unchanged; Daytona Thu–Sun 12/12; Malibu Thu–Sat 12/12, Sun 10/10; Worlds TBD everywhere.

### 2026-10-13 — VB gates at noon Tue–Sat; first serve from the broadcast starts

- Wesley, mid-event: gates noon "for today and onward". Then (asked): **Sunday stays on the template's 10:00 AM
  gate** (broadcast opens 10AM ET), and first serve matches the PBTV starts, the Chicago pattern: Tue–Sat
  12:00 PM, Sun 10:00 AM. Monday (qualifiers, played) untouched: 8:00 AM gate, 9:00 AM first serve.
- New `GATES_FROM_BY_SLUG` (`from`/`through` run) in `lib/event-schedule.ts`; `gatesFor` now takes the day's
  ISO. **New `gatesDaily()`** feeds every "Gates open … daily" sentence (schedule intro, Know Before You Go, the
  concierge's new required `gatesDaily`): they used to print `days[0].gates`, i.e. Monday's old gate.
- Verified on the dev server: per-day gate = first serve Tue–Sun; intro, KBYG and concierge read "12:00 PM
  Tue 10/13 – Sat 10/17". Daytona (template) unchanged. tsc clean; eslint at the NationalsLive baseline.

### 2026-10-12 (pt. 4) — VB Tue/Wed are the PickleballTV app only

- Trey Thayer flagged it; Keaton, #marketing-general 10/12: "Matt is streaming to the PBTV (APP only) for Tuesday
  and Wednesday. TC comes in to do production starting thursday." Bryce asked for it in the thread; built here
  (his 6-file patch never arrived).
- `lib/broadcast.ts` VB Tue/Wed `platform: "PBTV App"` (event page table + Order of Play read it as written);
  `lib/event-watch.ts` groups it under the PBTV card. `lib/tv-schedule.ts` keeps channel "PBTV" with new
  `appOnly: true`, rendered "PickleballTV App" by new `windowLabel()` in `lib/tv-channels.ts` (TvGuide +
  /watch/tv). The audit maps "PBTV App" → PBTV for the lockstep check.
- **⚠ OPEN: Matt's 10/10 note said Tue/Wed were triple streamed (app + PBTV YouTube + PPA Tour YouTube).** Bryce
  asked him to confirm; if YouTube carries them, add it to both files.

### 2026-10-12 (pt. 3) — PPA Australia Cup on /watch: new YouTube channel for the first stream-only stop

- Bryce's four blocks (Slack DM 10/11), applied by Wesley; Asana `1219412868556797`. Keaton Maynard,
  #marketing-general 10/10 7:23 PM: "Yea on the PPA website watch page", answering whether the Australia Cup
  windows belong there. Source is his own production grid in that thread ("PPA Australia Cup: Queensland Tennis
  Centre | Brisbane (Cup) 1,500", five LIVE rows, PPA YouTube + PPA Australia YouTube).
- New `"YouTube"` channel in `lib/tv-schedule.ts`. The type forces the rest: a label in `lib/tv-channels.ts`, a
  reachable `ChannelFilter` + pill on /watch/tv, and badge colours in BOTH `TvGuide` maps (sky, not YouTube red —
  there is no red in the palette).
- **⚠ THE DAYS ARE ET AND SIT A DAY BEHIND BRISBANE.** Queensland is UTC+10 with no daylight saving, 14h ahead of
  EDT, so local 10AM–6PM is 8PM–4AM ET the night before and Brisbane Wednesday is the Tuesday row. Keaton's first
  grid had both the day slip and Sydney's offset (7PM–3AM); corrected before this was built. Don't shift it back.
- **No `slug` and no `tier`, both deliberate.** Brisbane is a link-out stop (`hasInternalPage: false`), so there is
  no /events page of ours and no `lib/broadcast.ts` entry — the audit's lockstep check skips slugless rows. Tier
  renders as "<x> pts" next to our Majors/Cups/Opens, and whether a sister-tour Cup is a PPA Tour stop is Bryce +
  Connor's call. **Open for them.**
- ⚠ `scripts/audit-tv-schedule.mjs` lists it as "not on this sheet". Expected: that sheet is Championship Court,
  PBTV/TC/FOX only. Do not add an EVENT_MAP row to quiet it.
- Keaton's 10/10 "Disregard the changes for other events, Wesley has those handled" means the Worlds/Daytona/Malibu
  sync (pt. 1, from the 10/10 sheet) is ours to keep current, not Bryce's.
- Verified on the dev server: /watch and /watch/tv render the Cup between VB and MLP Cup, 5 ET days, YouTube pill
  + sky badges. tsc clean, eslint clean on the four files.

### 2026-10-12 (pt. 2) — Junior PPA rankings refreshed (Daniela, Asana `1219331697654163`)

- Jake's sheet (edited 10/8) → `lib/data/junior-rankings.json`, `updated: "Oct 8, 2026"`. All 24 boards
  confirmed 94–100% against their own division, none shrank, +82 players (2,471 rows); no age warnings.
- **The sheet is now link-shared**, and the Drive connector had stopped returning cell values. New
  `scripts/fetch-junior-rankings.mjs <out.md>` pulls the 24 tabs via gviz into the importer's input, so a
  refresh is fetch → import `--check` → import. ⚠ gviz returns the FIRST tab for an unknown name; both
  scripts guard against it.

### 2026-10-12 — Broadcast windows synced to the 10/10 sheet: Worlds, Daytona, Malibu, MLP Cup

- Keaton's Asana `1219361358300308` (his 10/9 revision). Applied from the production sheet "as of 10/10",
  which is newer than his note and differs from it twice: **Worlds Sat/Sun also moved** (he said unchanged),
  and **Malibu Sat TC is 4–7PM** (was 4–8, not in his note).
- **⚠ Worlds' Celebrity Pro-Am moved Wed → Thu 8–10PM ET**, now on PBTV and Tennis Channel.
- MLP Cup synced too (Fri/Sat to 8PM; Sunday split into SF 11–2 and Finals 3–4:30).
- Audit: every upcoming stop matches the sheet except VB Tue/Wed (Matt's 10/10 note, ahead of the sheet);
  broadcast ↔ tv-schedule agree for all. Event pages + /watch/tv verified on the dev server.

### 2026-10-11 (pt. 5) — Player history: failed draw loads no longer read as "didn't play"

- A 429/failed draw fetch looked identical to "not in this event" and got cached 1h (Waters lost Las Vegas + Atlanta on one pull).
  Now: failed stop → answer flagged `partial`, cached 60s, keep reading (0b5cdd4). `lib/brackets-api` won't pin a finished
  stop's build for a year if any division came back empty (754b38f). International stop with no Pro divisions = genuinely empty.
- **The May 10 – Aug 31 hole is real**: the `ppa_tournaments` feed has no US stop between PPA Finals and Nationals; Orlando /
  LA Slam exist only as curated rows in `lib/placeholder-data.ts` with no draw.
- Live 10/11: Waters 10 events (Las Vegas → Mesa), all finishes Champion/Finalist/Semifinalist, not partial.
- ⚠ `isTourStop` still counts the college "The Nationals" and PickleSlam as tour stops elsewhere on the site.

### 2026-10-11 (pt. 4) — Profile results redesign: Latest Result card, navy Recent Results band, no medal words

- **Right column → "Latest Result"** (`components/athletes/LatestResult.tsx`, under Quick Info): navy strip with the
  last stop's logo + best finish there (Champion > Finalist > Semifinalist > Quarterfinalist > Round of N), then an
  ESPN-style box score of the last match (`components/athletes/BoxScore.tsx`: team rows, G1–G3 columns, winner bold,
  headshots from `faces`), then "See all results →" to `#recent-results`.
- **Recent Results is its own navy band** in the page's grammar (eyebrow, font-display h2, square cards, top colour
  bar): tournaments as a swipeable rail with event logos + finish chips, matches as box scores grouped by event.
  App player screen uses the same component, `variant="app"` (light, compact).
- **No medal language (Hannah 7/28):** `PlayerRun.medal`/history `medal` → `place: 1|2|3|null`; labels via
  `finishLabel()` in lib/player-event ("Champion", "Finalist", "Semifinalist", "Round of 16", "Pools" — pool exits no
  longer read "Round 3"). Top finish = tour yellow, finalist = navy/yellow ring. Bracket tab "Bronze" → "3rd".
- One shared request: `components/athletes/use-player-history.ts` (module memo, empties not memoized, 10-min TTL,
  state keyed to the request so the app never shows the previous player's results).
- `/api/player-history` now also returns `logoUrl` per event and `faces` (latest match only, unambiguous names).

### 2026-10-11 (pt. 3) — Player history: the missing spring stops (Texas, Greater Zion)

- **Root cause:** `recentStops` took the 10 newest tour stops, not 10 the player played. The feed tags the college
  tour's "The Nationals" a slam and PickleSlam an Open, so they took two slots and the Texas Open and Greater Zion Cup
  (both ALW/Bright WD titles, draws fine on `/api/brackets`) fell off.
- **Fix** (`lib/player-history.ts`): stops in a 400-day window (max 30, college-tour names skipped), read newest first
  3 at a time until the player has 10 events with a result. Skipped stops cost a cached fetch, never a slot.
- **The May 10 – Aug 31 hole is real:** the feed has no US tour stop between the PPA Finals and Nationals (MLP summer).
  Curated `orlando-open` / `los-angeles-slam` rows in lib/placeholder-data are not in the feed and have no draw.
- Not fixed (flag): `isTourStop` counts the college "Nationals" (slam) and PickleSlam (open) elsewhere too.

### 2026-10-11 — Recent tournaments + recent matches on player screen and athlete profile

- Bryce: "we should be adding their recent scores and tournaments to the players pages too". Shipped on the app
  player screen (`/scores/player/`, current event excluded) and every `/athletes/<slug>` profile.
- **No per-player results endpoint exists.** Our token reaches `users/{slug}` + `player_medals` only; pickleball.com
  player pages are CloudFront-blocked; MATCHDAY syncs per-event matches too. So `lib/player-history.ts` runs
  `playerRuns` (lib/player-event) over the last 10 finished tour stops (3 at a time; finished draws cached a year).
- Served by `/api/player-history/?name=` (CDN 1h + 1d SWR; empty answers 60s) and rendered client-side by
  `components/athletes/RecentResults.tsx`: profiles are force-static ×1,100, so no draw work in the build.
- Live-checked: Anna Leigh Waters (6 stops, Gold/Silver + partners, Vegas WD Final 11-8 10-12 11-5), Ben Johns (7),
  Chris Haworth (6), Hunter Johnson (6). May–Sep gap = summer, not a bug.
- Gaps: losers-bracket rounds sort below winners knockout rounds in "Recent matches"; a pool exit reads "Round 3";
  name-keyed (a namesake in the same draws would merge). Only the last 10 stops (no 2025).

### 2026-10-10 (pt. 2) — App: tap any player → player screen (`/scores/player/?name=&event=`)

- Bryce 10/9: "click one player, see all their scores, profiles". Every name on Scores cards (MatchCard `playerHref`
  prop, opt-in, website ticker unchanged) and in the app bracket (`MobileBracket` `Names`) links to the screen.
- `components/app/PlayerScreen.tsx`: photo, WPR rank/board/points, Follow + Full profile (our slug only), On court
  (live ticker), then their path through every draw at the event (pools/winners/losers, round, opponents, score, W/L,
  medal or "Next: QF"/"Out in R16"). Partners and opponents are tappable, so fans walk player to player.
- `lib/player-event.ts`: `resolvePlayer` (name → ranked pro; ambiguous names resolve to our profile only if exactly one
  is ours, else no rank/profile/follow) and `playerRuns` (all draws via getBracketIndex/getBracketDraw, one cached build).
  Boards memoized 1h per instance; non-live results not cached.
- ⚠ Ticker names are short ("B. Johns"); `TickerPlayer.fullName` added and used for every lookup (player links, On court,
  and Scores "Your players", which had never matched since 10/9 for the same reason). `?event=` must be a known tour UUID.
- Verify against a Vercel deployment (no PB_API_TOKEN locally).

### 2026-10-10 — Chicago weekend parking at Crate & Barrel; VB broadcast Tue/Wed added, Thu/Fri PBTV 12–8

- **Chicago (Dana, Slack + updated Asana `1219139745966275`):** Sat 10/10 & Sun 10/11 park at Crate & Barrel
  HQ (1250 Techny Rd), Techny Prairie as overflow; the Techny paragraph now reads Wed–Fri. No map for C&B, so
  the Techny map got `after: 3` to stay under its own paragraph.
- **VB broadcast (Bryce's patch, he can't push):** Tue 10/13 RD64 + Wed 10/14 RD32 PBTV 12–8PM ET (Matt, 10/10:
  start only, "until End of Day"; 8PM is Bryce's). Thu/Fri PBTV 2–10 → 12–8 (Keaton, 10/9); the live sheet
  already carries 12–8 for Thu/Fri. TC unchanged. `tv-schedule` VB `startIso` → 10-13.
- Audit: VB flags only the two Tue/Wed rows (ahead of the sheet); broadcast ↔ tv-schedule 10/10 agree.
- ⚠ **Keaton's 10/9 revision also moved Worlds, Daytona and Malibu windows; not applied yet.**

### 2026-10-09 (pt. 2) — App: Rankings tab + "Your players" on Scores; TestFlight archive ready

- **Rankings tab → `/rankings/app/`** (`components/app/AppRankings.tsx`): same navy header + pill as Scores, Men|Women,
  name search, top 100 per board with headshots, follow chip per pro (local profiles only), pinned "Your players".
  `/rankings` (marketing page) unchanged; the tab's footer links to it. No movement arrows: the WPR feed has no prior rank.
- **Scores: "Your players" section first** — matches with a followed pro, pulled out of Live/Up next/Final. Matched by
  folded name (ticker has names, not slugs). No follows → a "Follow your players" card to the Rankings tab.
- Follows are still device-local (`components/app/follows.ts`, Aug build). **MLP teams not added**: no team data in this repo.
- TestFlight: `mobile/ios/exportOptions.plist` added. Archive + upload is blocked for Claude by the auto-mode classifier;
  Bryce runs `mobile/testflight.sh` (bundle `com.ppatour.game`, version 1.0 build 2 — the arcade uploaded 1.0 build 1).
  **Uploaded 10/10 08:33 MT (build 2, upload succeeded).** Next upload: `BUILD=3 ./testflight.sh`.
- Jason chased 10/9 for the ppatour.com OIDC client (redirect `/api/auth/callback/pickleball`), asked by Tuesday.
- Connor texted home-screen install steps 10/9.

### 2026-10-09 — Virginia Beach parking lands (Ocean Breeze, $10/day, golf-cart shuttle)

- Dana Summers' request (Asana `1219328269479333`, due 10/8, event starts 10/12): her copy verbatim in
  `PARKING_BY_SLUG["virginia-beach-open"]` plus her Ocean Breeze map (`public/ppa/parking/virginia-beach-open.webp`,
  1536px q70, 374 KB; it's mostly foliage, and q60 saved only 10%). Fifth finalized stop.
- **⚠ Mon qualifiers park on-site; Tue–Sun has NO on-site public parking.** The map shows the Tue–Sun lots only.
  Only two sections, General + Rideshare: she sent no Premium or ADA section.
- Verified on the dev server: the event page and `/today` carry the copy and the map, the holding line is gone,
  Chicago is still 200. eslint clean.

### 2026-10-08 (pt. 5) — Scores-first LIVE + iPhone shell on Bryce's phone
- Bryce: "build it… get the changes live tonight". `app-scores-first` merged to main (54e745e) + qa-gate fix 7bbc7c4: bracket chip and draw always agree (no divs[0] fallback), pool play shown.
- `mobile/` = Capacitor iOS shell loading ppatour.com/scores in app mode (excluded from tsc/eslint/Vercel). Installed + launched on Bryce's iPhone via personal team (com.brycemorgan.ppatour.dev, 7-day expiry). See mobile/README.md.
- TestFlight upload NOT done: OpCo team works for signing but the only app record is the shelved arcade's com.ppatour.game — awaiting Bryce's OK, or a new com.ppatour.app record from Jason/Tom.
- Bryce 10/8 mid-session: bracket rounds ~90% wide so the next round peeks, swipe between them, height re-fits the round in view → `RoundSwiper` in MobileBracket (scroll-snap, 88% columns). Verified on prod deploy: R16 995px → Final 141px, tabs follow. Tab tap sets the round directly (scroll events skip during smooth scroll).
- iOS default bundle now `com.ppatour.app` (qa-gate: don't default onto the arcade's record).
- SSO: confirmed the company login is oidc.pickleball.com (MATCHDAY's issuer). Our client creds from Jason still outstanding (asked 10/1, no reply).

### 2026-10-08 (pt. 4) — App goes scores-first (branch `app-scores-first`, merged in pt. 5)
- Bryce: app should feel like ESPN — scores + brackets first, schedule/events deeper. Found why "Live does nothing": the Live tab and score bar pointed at `/live`, the homepage **rehearsal harness**, which renders the homepage again.
- New `/scores` (`app/scores`, `components/app/ScoresHome.tsx`, `lib/app-scores.ts`): event header (LIVE, Watch, Event info), Scores | Bracket toggle, one set of division chips (All/WD/MD/Mixed/WS/MS) driving both. Opens on the running stop, else the last finished one — never a future stop.
- `components/app/MobileBracket.tsx`: phone bracket = round tabs + stacked matchups, opens on the round in play; replaces the shrunk tree in the app.
- Tabs now Scores · Rankings · Events · Watch · You (no Home/Live). Manifest start_url → `/scores/`; app-mode `/` forwards to `/scores/` (old installs keep the old start_url); score bar links `/scores/` and hides on it.
- Verified on preview against live Chicago R16 (WD/MD live, finals, MD bracket). ⚠ Local dev has no `PB_API_TOKEN` → events feed falls back with no UUIDs → "no scores". Test on a preview.
- Matchday research (for SSO/push): MATCHDAY is a *client* of `oidc.pickleball.com`, not an IdP; favorites = `mlp_team_follows` (team_uuid) + `user_notification_preferences` (free-text player_name), keyed by MATCHDAY user id; no partner API. See `docs/app-plan.md` 10/8.
- Next: Bryce OK to merge; then our own OIDC client from Jason → follows on `sub` → native push (Phase 5).

### 2026-10-08 (pt. 3) — Worlds hotels + hotel photos
- Sheraton Galleria split into Fans ($139, by 10/16) + Pro Players blocks per Kristen 10/8; Renaissance + DoubleTree links corrected (`lib/event-guides.ts`).
- New `photo` on hotel cards: `hotelPhoto(name)` maps names → `/public/ppa/hotels/photos/*.jpg`, so Jackalope-feed hotels get photos too. Sheraton + Renaissance pulled from marriott.com; Hilton/IHG sites block automation — add more by dropping a jpg + one regex line.
- Jackalope now publishes Worlds hotels (was 0 — seed regex bug), so the feed overrides the static list where the city matches.

### 2026-10-08 (pt. 2) — Black Desert vacation on sale
- New trip `/vacations/trips/black-desert/`: Greater Zion Cup VIP weekend + 2 days of clinics with Dave Fleming, Mar 26–31 2027, Black Desert Resort. Lainey's listing doc + Drive photos (Drive folder "BLACK DESERT: MARCH").
- New pricing shape: ONE King room at $6,500 for 1 or 2 guests, 15 rooms in any mix. `TripConfig.roomPool` makes both occupancies draw from one block (single+double from Jackalope); `bedOptions: ["King"]` hides the bed picker; `domestic` swaps passport wording for government ID.
- `trip.nightsNote` replaces the hard-coded "all-inclusive" in the trip card (Black Desert isn't).
- Jackalope `vac_trips` row `black-desert-2027` (destination "Black Desert Resort", pooled) + spine code `0327-VAC-IVINS-USA`.
- Open: "more pros to come"; spa details TBD in Lainey's doc; no Sage class yet.

### 2026-10-08 — Paddle Lab → pickleball.com: Jason gets the files; PBC photos mirrored
- Jason Santerre is rebuilding Paddle Lab at pickleball.com/paddles from our JSON (his call: files, not an API). GitHub `JsonTerre` invited (write — personal repos can't do read-only).
- All 497 PBC paddle photos now live in `public/ppa/paddles/pbc/` (34 MB) via new `scripts/mirror-pbc-images.mjs`; catalogue `image` = local path, `sourceImage` = old BigCommerce URL. Reason: BigCommerce CDN dies at the Shopify cutover on 18 Jan 2027. `lab:pbc:crawl` = crawl → mirror → match.
- Bryce 10/8: Kew is fine with the data on pickleball.com; JOOLA's objection is a PPA-sponsorship issue only, not a blocker for pickleball.com.
- Open: Hannah's team owes 8 rows + 2 questions (reminded 10/8); editorial JSON still empty; repo is PUBLIC.

### 2026-10-08 — Europe contact: photographer Typeform + Contact Us heading (Katherina)
- Katherina, 10:54 AM: third Typeform "Photographer Interest — Apply for PPA Tour Europe" (ppatour.typeform.com/WFHeurope) added to `EUROPE_FORM_LINKS` → shows on /europe#contact and /europe/eventlinks.
- /europe#contact: the three form links are now separate stacked cards (3-up was too cramped in max-w-3xl) instead of one joined strip; "Get Involved / Media and Referees" kept as the head over all three; new "Contact Us" head over the embedded InquiryForm.
- She's still asking why Typeform: answer is the roadmap item "Europe: move forms off Typeform".

### 2026-10-07 (pt. 4) — Paddle Lab → pickleball.com/paddles (Jason)
- Jason replied: pickleball.com will rebuild the lab in its own components (header/footer/CSS) at `pickleball.com/paddles`; he's reviewing the gated build for brand/UI first.
- Sent: URL + user `ppa` by email (Hannah cc'd), password by Slack DM. Told him it's static JSON (paddles.json, paddle-pbc.json, editorial), not an API — we can expose one or hand over files.
- Next: Jason's review → pick API vs files. Before public: Kew terms, UPA-A RPM conflict, JOOLA position; Hannah owes 8 rows + 2 questions from 10/6.

### 2026-10-08 — Apex flip live; GSC canonical validation started
- Bryce switched ppatour.com in Vercel Domains from "Redirect to www" to Production; next.config APEX_LEGACY_REDIRECTS now handle apex → www. Verified live: every apex path is ONE 308 (ppatour.com/athlete/ben-johns/ → www/athletes/ben-johns/).
- Fixed first (a4cca7b): the apex `/:path*` catch-all dropped the trailing slash (2 hops); now root, files and paths each keep their shape.
- GSC "Duplicate, Google chose different canonical" (139): Validate fix started 10/8.
- Handbook PDFs → /about/player-handbook/ live (Bryce added the Firewall bypass 10/7).
- MLP team-page contact leak emailed to Caitlin + Wesley 10/7; re-check view-source when they reply.
- Open: PBC MPN trim + blog descriptions — Bryce said go; blocked by the auto-mode classifier, needs a non-auto session.

### 2026-10-07 (pt. 3) — 404 redirects from the GSC report
- `/players/<slug>/` and root `/<athlete-slug>/` → `/athletes/<slug>/`; `/meet-the-team/` → /about/ (repoint to /team at launch); `/blog-category/*` → /blog/; `/<post>/feed/` → the post. Tested on a local build.
- Root athlete slugs live in app/[slug]/page.tsx (only after no article matches), not next.config — a pattern there would shadow posts.
- Handbook PDFs → /about/player-handbook/ live: Bryce added a Firewall bypass for just those two paths (Vercel system mitigations deny /wp-content/). Other /wp-content/ still 403.
- Local `npm run build` refuses without PB_API_TOKEN (stale snapshot); `npx next build` skips prebuild for testing.

### 2026-10-07 (pt. 2) — Ticket questions: email only, no ticketing Slack channel (Parker)
- Parker: "We would like these to all go through the ticketing@ppatour.com email not through slack."
- Contact → *Tickets* and the triage TICKETING route now post only to the marketing channel (#ppa-marketing-form), status "📧 Emailed to ticketing@ppatour.com". Nothing goes to FORM_SLACK_CHANNEL_TICKETING (left set, now unused).
- Verified live 10/7 1:40 PM MT with a TEST submission (topic Tickets): triage routed TICKETING, one post in #ppa-marketing-form with the new label, nothing in #ppa-ticketing-form, no email failure in logs. Side note: `reactions.add` → not_in_channel in #ppa-marketing-form (bot not a member), so no ✅ there.
- Email unchanged: FORM_INBOX_TICKETING = ticketing@pickleball.com + ticketing@ppatour.com. Misfiled ticket questions on other topics still get re-routed there by triage.

### 2026-10-07 — SEO re-audit: Phase 1 confirmed live; /watch + /athletes titles

- Full crawl of 1,139 sitemap URLs: all 200, self-canonical, one H1 each. Phase 1 is live, not "awaiting push" (SEO.md updated, new §3b).
- `/watch/` → "How to Watch Pro Pickleball on TV & Streaming | PPA Tour", H1 "Watch Pro Pickleball" ("As Seen On" kept as the line above the network logos). `/athletes/` → "Pro Pickleball Players: Rankings & Profiles | PPA Tour", H1 "Pro Pickleball Players". Re-check GSC CTR 10/31.
- Open (SEO.md §3b): headline-length cap, apex flip after Chicago, soft-404 athlete slugs, /tournament/ mapping, subEvent, og:url, /ppa-blog/ index, Mesa `-2` dupe.
- Same-day audits of MLP and PBC: notes in mlp-website `docs/SEO.md` and ziff `docs/PBC-SEO-PLAN.md`.

### 2026-10-06 — Paddle Lab: Joseph's reconciliations loaded, 87 → 153 PBC matches

- Hannah returned the Kew-vs-PBC master list 10/2 with Joseph's "Joseph Adjustments" tab; 67 confirmed
  pairs are now `ALIASES` in `scripts/import-pbc-paddles.mjs`. PBC re-crawled (497 products). Matched 153/468.
- 8 rows held (URL missing, shape/thickness/name mismatch, or not in PBC's sitemap) — listed in
  `docs/PADDLE-LAB.md` "Near-misses to confirm". Need Hannah/Joseph before loading.
- Lab is still gated (password, no links). Bryce emailed Jason 10/6 about hosting it on pickleball.com,
  Hannah cc'd. No answer yet.
- Import guard: a stale alias now warns; >3 missing at once refuses to write (partial-crawl protection).
- Hannah emailed 10/6 with the 8 held rows + 2 questions (Franklin Aurelius shared photo, Selkirk Luxx II vs
  original). Next: load Joseph's answers; chase Jason if no reply by ~10/9.
- ⚠ Local `npm run build` refuses without `PB_API_TOKEN` (stale rankings snapshot); `npx next build` passed.

### 2026-10-05 (pt. 2) — Fleming's Chicago storylines + Ramsey's Las Vegas stats wrap

- Both from Google Docs Wesley sent (link-shared; `export?format=txt` works with no auth). Fleming →
  native `veolia-chicago-cup-storylines` in `lib/news-articles.ts` (Las Vegas preview rules, his TV line
  checked against today's TC fix). Ramsey → `championship-sunday-standout-stats-from-the-rate-las-vegas-open`
  in `lib/news-posts-authored.ts` (wpId 900006).
- **Ramsey's photo is Wesley's pick** (`public/ppa/news/championship-sunday-standout-stats-las-vegas-2026.jpg`,
  2048 q64, no names in alt). The subject sits high, so `WpImage.position` (new, optional) carries a hero
  `object-position` through `wpToCard` — native articles already had `imagePosition`.
- ⚠ **Fleming's post still uses `lt-northbrook/featured-aerial.jpg`, the event's own hero.** Wesley picked a
  Championship Sunday photo (Veolia + STORM signage) but it arrived inline, not as a file. Swap it in when
  it lands. A first pick was rejected: Toys "R" Us PPA Finals signage across half the frame (Connor, 7/20).

### 2026-10-05 — Chicago Cup: first serve from the broadcast starts, gates at first serve, Thu/Fri TC dropped

- PBTV's Chicago start-times note matched the site except **Tennis Channel Thu 3–5:30 and Fri 3–6 ET**,
  which the live sheet had also dropped. Removed from `tv-schedule.ts` and `broadcast.ts`; the audit
  passes for Chicago in both.
- The order of play was still the template (gates 8/9/10, first serve 9/10/11). First serve now comes
  from the broadcast starts in Central (Wesley's call): Tue–Fri 2 PM, Sat 12 PM, Sun 10 AM.
  **Monday 10/5 keeps the template's 9 AM**: it isn't broadcast, so nothing implies a time.
- **Gates = first serve "for now"** (Wesley): new `GATES_AT_FIRST_SERVE` in `lib/event-schedule.ts`.
  `gatesFor` takes the resolved first serve. The intro, the venue section's Gates & Sessions card and
  the concierge (new required `ConciergeFacts.gatesAtFirstServe`) all say "Gates open at first serve
  each day". When real gate times arrive, delete the line and use `GATES_BY_SLUG`.
- ⚠ Every local event page 404'd for a few minutes on a fresh dev server, then served 200 with the
  same code. It was the cold feed, not the change; production was 200 throughout.

### 2026-10-04 — Chicago Cup parking lands; a section can now carry more than one map

- Dana Summers' request (Asana `1219139745966275`, due 10/4, event starts 10/5): her four sections
  verbatim in `PARKING_BY_SLUG["veolia-chicago-cup"]`, with her two maps. Fourth finalized stop.
- **⚠ PARKING MOVES MID-EVENT.** Mon–Tue is the east on-site lot; Wed–Sun is off-site at Techny
  Prairie (1750 Techny Rd) with a shuttle. So General Parking has two maps, and the single
  `ParkingSection.image` became **`images: ParkingMap[]` with an optional `after` paragraph index**.
  Each map renders under the paragraph about its lot. Cary, Arizona and Vegas were converted
  mechanically and render unchanged.
- The on-site map also appears under Premium, because she asked for it there (same lot, sold as a
  Wed–Sun pass). Same file, so it costs no extra download.
- Maps: 1600px webp q70, 223 / 215 KB (Arizona is 223). Premium's "Tixr" links to the Chicago listing
  with `utm_content=event-parking-premium`.
- Verified on rendered pages: event page + `/today` carry the copy and both maps, in the right order.
  Vegas and Cary controls are unchanged. tsc clean apart from stale `.next` validator stubs; eslint
  clean.

### 2026-10-02 — api.pickleball.com 429s: one instance refreshes, the rest serve what they have

- Wesley asked for a per-tournament comparison of api.pickleball.com calls; published as an artifact
  (https://claude.ai/artifact/7DziJU2YFWxvjK869NB5re) from `vercel metrics vercel.external_api_request.count`.
  ⚠ The destination host is `request_hostname`, not `origin_hostname` (that is OUR host); `fetch_type origin`
  = reached pickleball.com, `cache-get` = Data Cache. Vercel keeps 36 days only. Upstream calls per day:
  Nationals 140K · Arizona 42K · Las Vegas 12K (first 5 days).
- **Kenan said there were no 429s; there were ~10K during Las Vegas.** They come from their app
  (`pb-instance-id`, `request_id` headers; CloudFront only passes them through) and the body reads
  `platform access denied: platformID=9`, so a search for "rate limit" misses them. Sample request_id
  `39678703056452`, 10/2 15:26:44 GMT. A 12-request probe got 11 refusals.
- **Cause: every warm instance refreshed the same expired row at once**, each retrying 3x. Fixed in
  `lib/pb-cache.ts`: a 10s refresh lease in `api_cache` (new nullable `lease_until` column, added by the
  idempotent `init`), stale-copy fallback on refusal (up to max(6x window, 2 min)), the unreleased lease
  doubles as a fleet-wide cooldown, runtime retries 1 (0 with a stale copy), build keeps 3 via `NEXT_PHASE`.
- ⚠ **Freshness is now the row's AGE against each caller's own window, not `expires_at`.** Scores (20s) and
  brackets (90s) read the same `tournament_events/{id}` URLs and share rows; under `expires_at` the last
  writer set freshness for both. `expires_at` is still written for the sweep and for skew-protected old
  deployments.
- Brackets (`lib/brackets-api.ts`): divisions fetched in sequence, not `Promise.all`; a division with an
  `endDate` accepts 30-min-old rows, one with no match on court 3-min (cost: the live dot can lag a match
  start by up to 3 min; the scoreboard does not).
- Verified with a PGlite harness (10 module copies = 10 instances, fake upstream refusing >2 in flight):
  per expiry 28–40 upstream calls → 1, and 10/10 got data even while upstream refused. NOT run: `next build`
  or the dev server, both of which write to the production table via `.env.local`. Pushed mid-event at
  Wesley's call. Next: re-pull the 429 counts after a day live.

### 2026-10-01 — Player filter idea (Stephen Venegas) + SSO with sso.pickleball.com is next priority

- Stephen Venegas asked for a per-player filter on event pages (matches played, upcoming, how to watch). Scoped:
  `?player=` on the event page, built from `lib/brackets-api.ts` + `athlete-aliases.ts` + `broadcast.ts`. ~2–3 days.
  Gaps: watch info is by day/round only (no streamed-court data), and the feed has team names, not player IDs.
- Bryce: **SSO with Jason's sso.pickleball.com is the next priority, then the mobile app** (app-plan Phase 5, Capacitor).
- Ask emailed to jason@pickleball.com 10/1 (Gmail thread `1a0f8ccd8a4087ec`): OIDC client + secret, redirect URIs
  (prod + one fixed staging host), PKCE public client for the app, claims (sub/email/name + PT.com player ID),
  logout/refresh, account deletion (Apple), staging SSO + test accounts, consent/opt-in ownership.
- Plan once creds land (~1 wk): Auth.js generic OIDC, `/account`, follows move from device to Neon keyed by `sub`,
  personal data via client-side `/api/me` so pages stay static/ISR.
- Next: chase Jason's reply; then SSO build; then the app shell.

### 2026-10-01 — Europe: socials on the site, Europe-only schedule with past stops, no Carvana link

- Payton (#ppa-tour-europe, 10/1, for Albert): socials + event link, Europe-only schedule incl. past events, no
  Carvana link, "more European" header, gallery that syncs from Google Drive.
- **⚠ THE SOCIALS WERE ASKED FOR TWICE BEFORE AND DROPPED.** 9/22 (Instagram + Facebook @ppatoureurope, in the
  WPR thread) and 9/23 (YouTube + Instagram on /eventlinks); Bryce said "done shortly" 9/25. The 9/22 entry here
  logged it as a "Next" and nothing picked it up, and `europe/layout.tsx` still carried a "don't assert an
  unconfirmed handle" comment. Shipped now: `lib/europe-socials.ts` (URLs curl-verified) → hero "Follow" row,
  Europe footer, and a "Watch & follow" block on /eventlinks.
- Schedule: split on END DATE (feed leaves finished stops "upcoming"); "Past Europe Events" band added; the
  "See the full tour schedule →" link to /events (Carvana, all tours) is gone.
- **Not done — header photo.** Pick: Katherina's "Venue Impressions Barcelona" Drive folder, DSC04289 (wide court,
  PPA Europe banners, live play). Folder isn't link-shared; needs a browser download Bryce OKs.
- **Not done — card photos.** Brescia card shows Melbourne, Portorož shows Gold Coast (generic fallback images in
  `lib/events-api.ts`). Needs real Italy/Slovenia photos from the Europe team.
- **Later 10/1 (Bryce: "find anything else they asked that we haven't done"):** full channel audit → artifact
  https://claude.ai/artifact/Ssog1Z6FE9cqP1bW85iBr3. Also shipped: Brescia pulled (Payton: not confirmed; matched
  on name/city in `isUnconfirmedEuropeStop`), 9/30 entry copy verbatim, Official Partners strip (LT PRO48 ball,
  JOOLA net, logos from Payton's 9/22 post). **Still open on us:** Turnstile hostname (since 9/24!), FFT deck
  "done" never posted (edits applied 9/17), gallery, edit-access answer (asked 9/15), Typeform links, US pages
  still served on ppatoureurope.com by URL.
- **Rest of 10/1 (all live unless noted):** Drive-synced gallery (lib/europe-gallery.ts, served via next/image —
  lh3 /d/ links fail in a Google-signed-in browser); 26 new Barcelona studio portraits incl. Tom Protzek's first;
  Alexia bio; Typeform media + referee links (survey stays off, Payton); sponsor strip moved above the footer with
  links (JOOLA, LT PRO48 → PBC product page); US sections on ppatoureurope.com 307 to the Europe home; Portorož +
  Barcelona card photos (show after the nightly events-cache refresh); Barcelona ranks 25/26.
- **Turnstile fixed:** new widget on Bryce's Cloudflare ("PPA Tour Stuff", ppatour.com + www + ppatoureurope.com),
  Production keys swapped, both contact forms tested passing. ⚠ Preview env has no Turnstile keys (see docs/notes.md).
- **Slack sweep routine** (trig_01CWLtiK2x5JjovkzvVB5via) now does this work 4x daily across all of Bryce's channels;
  hourly FFT routine paused. Open: header photo DSC04289 (needs Bryce's OK to download), Europe menu links (team).
- **Gallery:** done (see above). Drive auto-sync is possible (shared folder + service account or Drive API key, pulled at
  build/ISR) — waiting on the photos and a decision. Brescia: Payton said "don't move over that brescia event"
  (Italy rollover thread) — it still shows on the Europe schedule; asked.

### 2026-09-28 (pt. 2) — Worlds gets its real order of play and a Programming section

- Wesley: add the Worlds schedule (worlds.unitedpickleball.com/schedule, built in
  `pickleball-world-championship-new`) to the Opendoor Pickleball World Championships page.
  Then: *"Dont put it as part of the order of play. it should be in it's own section."*
- **Order of Play** now has a real `eventSchedules` entry for Worlds: Mon qualifiers → Tue R64 →
  … → Sun Championship (the template had Mon "Amateur & junior brackets", Tue "Senior Open + pro
  qualifying"). The Challenger Showdown moved out of `SIDE_EVENTS_BY_SLUG` into Thu/Fri/Sat
  `amateur` (derived via `showdownOn`, still from `lib/challenger-showdown.ts`).
- **⚠ GATES + FIRST SERVE ARE "TBD"**: the Worlds site publishes rounds, not times. New
  `gatesPublished()` makes the intro line and the concierge say times are coming instead of
  claiming "an hour before first serve" / "Gates open TBD".
- **⚠ `EventSchedule.start` — annual editions share the `pickleball-world-championships` slug**,
  and both run 7 days, so the day-count check would not have stopped the 2026 schedule printing on
  the 2025 page. `getEventSchedule(slug, startIso)` now withholds a dated entry from other
  editions; every caller passes the start date. Verified: 2025 page unchanged.
- **Programming** (King of the Court, clinics, round robins, Meet the Pro) is its own section +
  tab after Order of Play, from new `lib/event-programming.ts` (same `start` guard), hidden once
  the event completes. ⚠ It is a SNAPSHOT of the events team's live Google Sheet — re-pull before
  the week. Music and the MLP Nations Cup (Oct 30–Nov 1) deliberately left out.
- Also: amateur-row React keys include `detail` (a day can repeat a session name); the real-schedule
  table's Live column caps at 5.5rem below `lg` so "PBTV · Tennis Channel" wraps instead of
  crushing Pro Play on phones.
- Shipped in the same push, from a parallel session: a "Watch" label beside the platform mark on
  live `MatchCard`s. (That session's hero `DayWatchButton` was already on main as `4f09e02`.)
- Verified on the dev server at 1440 + 390: 0 overflow, 2025 Worlds + Las Vegas/Chicago/VB controls
  unchanged. tsc clean; eslint at the TodayPanel/NationalsLive set-state-in-effect baseline.

### 2026-09-28 — Live-event copy says what is on court, not what the calendar says

- Wesley (Asana "Verbiage Update for Live Events"): the site goes live off the event's DATES, so the
  hero read "LIVE NOW · Matches in progress" for all seven days — overnight, before first serve,
  between sessions. The dates still decide it is tournament week; **new `lib/live-status.ts` decides
  what to SAY**, from the ticker feed plus the order of play.
- **"In progress" / "Live Now" / "Watch Live" only while the feed has a `status: "live"` match.**
  Otherwise: "First serve 2:00 PM" (nothing played yet today) · "Up next · 6:30 PM PDT" (between
  matches; just "Up next" once that planned start has passed — matches run late) · "Play resumes Thu ·
  2:00 PM" · "Play complete". Badge reads "Tournament Week" when nothing is live. Feed unreachable →
  the day's round from the order of play, never a claim about play. "Pro Qualifiers in progress" when
  every live match is a qualifier.
- **First-serve times come from new `playDays()` in `lib/order-of-play.ts`**, which mirrors
  buildSchedule's template + `FIRST_SERVE_BY_SLUG` + the transcribed `eventSchedules`. ⚠ If the
  template in either buildSchedule changes, change it there too.
- `useLiveTicker` gained `feedOk` (the feed actually answered) — `loaded` also turns true after the
  retry budget is spent, which is "we could not ask", not "nothing is on".
- Surfaces: homepage hero (badge, status line, red Watch Live → blue **TV Schedule** when idle),
  event-page hero (also kills the phone countdown stuck at "0D : 0H : 0M : 0S"), the "Live Now"
  kickers over both live scores bands, the header marquee (idle link → **Scores & Brackets**, the
  event's `#results`; pulsing red dots only when live), and StickyBuyBar (it said "Live Now · Watch
  Live" over up-next/final rows). ScoreTicker and AppScoreBar were already right. **NationalsLive
  deliberately untouched** — its live state is a simulated 20s countdown over Atlanta fixtures.
- ⚠ Everything renders the NEUTRAL state before hydration; the server cannot see the feed or the
  device's day, and must not claim a match is live.
- Verified against the real Las Vegas feed on its first day (qualifiers between matches): homepage +
  event page read "Tournament Week / Up next", 0 "in progress", 0 "Watch Live", no overflow at 1440 or
  390. 12 synthetic cases through `liveEventStatus`. tsc clean, eslint at the StickyBuyBar
  set-state-in-effect baseline, `next build` green (2,103 pages) — with stale `.next/types` from
  another branch moved aside, which otherwise fails the typecheck.
- ⚠ First-serve times print without a zone ("2:00 PM"): venue time, from the schedule, which has none.
- **Follow-up, same day (Wesley):** the homepage hero keeps **"▶ Watch Live" for the whole playing day** —
  before first serve, between matches, while a match is on — and only once the day's matches are all
  done (`done-today` / `done`) becomes blue **"▶ Watch PickleballTV"** → the PBTV stream.
  `DayWatchButton` in `components/live/LiveEventStatus.tsx`. The header marquee keeps its idle
  "Scores & Brackets" link.

### 2026-09-28 — The rankings re-read themselves daily; the deploy hook never fired, and Next was caching our SQL for a year

- Wesley: *"The World Rankings are not accurate currently. Could this be a caching issue?"* Then: *"we need
  to have the rankings re-read once a day. get that setup and get the rankings updated asap."*
- **Production was serving a board that no longer existed upstream.** Ben Johns 17,832.5 against a live
  18,432.5, ALW 20,710 against 22,105, Staksrud and Patriquin swapped at No. 4/5. The 9/27 17:21 UTC deploy's
  prebuild pulled it (17 upstream, 0 cached — so NOT the 9/23 durable cache), and asking the API for
  `rank=2026-09-27` today returns different numbers. pickleball.com was mid-recalculation or briefly wrong
  when we built, and the snapshot is bundled JSON, so it stayed until someone pushed. Fixed within minutes by
  a production redeploy; the rest is making sure it can't recur.
- **⚠ THE DAILY REFRESH HAD NEVER RUN.** `/api/cron/rebuild` (9/5) pinged a Deploy Hook so `prebuild` would
  regenerate the snapshot. `DEPLOY_HOOK_URL` was set 23 days ago and not one production deploy came from it —
  every "fresh" board since 9/5 was a side effect of a code push. Deleted, not repaired: its premise ("a cron
  cannot write the snapshot itself") was true of the filesystem, not of the database.
- **New `/api/cron/rankings`, same 09:00 UTC slot.** Fetches all 16 boards (fresh, bypassing the per-URL
  cache), stores the whole snapshot as one `api_cache` row (`wpr-snapshot:latest`, own tag `wpr-snapshot` so a
  `?tag=rankings` purge can't wipe it), then `revalidatePath("/", "layout")` — lazily, because ranks reach
  nearly every page. A failed run writes nothing and returns 502; the previous snapshot keeps serving.
  Manual refresh: `GET /api/cron/rankings/` with `Authorization: Bearer $CRON_SECRET`.
- **`lib/wpr-snapshot.ts` serves whichever is NEWER — the bundled file or the stored row.** One cheap
  `updated_at` probe per instance per 5s; the ~700 KB value is re-read only when it changed. The in-process
  board memos in `rankings-api` and `division-rankings` are now keyed on the snapshot's `generatedAt`, or a
  warm instance would have held yesterday's board for six hours. **Still zero `partner_rankings` calls per
  page view** — measured 0 across the board, an athlete lookup and division ranks.
- **`lib/wpr-snapshot-core.mjs` is the one implementation** for the build script and the cron, because the
  URL is the durable-cache key and two copies drift. Verified the script's output identical in shape
  (keys, division keys, player fields) and it still fails soft/hard exactly as before.
- **⚠ THE REAL FIND: NEXT WAS CACHING OUR POSTGRES QUERIES WITH `revalidate: 31536000`.** The Neon HTTP
  driver sends SQL as a `fetch` POST, and on `force-static` routes (/rankings, the homepage) or
  `fetchCache = "default-cache"` (/api/rankings) Next's patched fetch stores it. Found in
  `.next/cache/fetch-cache`: `SELECT`s, `CREATE TABLE`s, a year each. So on those routes `pb-cache` has been
  returning whatever a query first returned, and a cached `INSERT` never reaches the table again — this
  predates today (9/18). Fixed in `pb-cache.ts` with `neonConfig.fetchFunction` → Next's
  `_nextOriginalFetch`. ⚠ **That is a Next internal; if an upgrade drops it, this silently falls back to the
  bug.** Re-check after any Next upgrade: build, then `grep -l neon.tech .next/cache/fetch-cache/*` must be
  empty.
- **Verified on a real production build against the live API and the real table, not by reasoning:** wrote
  a marker row (Ben 99,999), the build and `/api/rankings` served it; ran the cron locally → **17 upstream,
  stored, and /rankings, /api/rankings, /athletes/ben-johns, /athletes/anna-leigh-waters and the homepage all
  read the live board on the next request.** After the fix: 0 Neon entries in the fetch cache, `/api/rankings`
  back to ○ (it had gone ƒ while the SQL was being cached), `/rankings` ○, athletes ● — unchanged. tsc +
  eslint clean.
- ⚠ Method: built with `next build --webpack` because Turbopack refuses the worktree's `node_modules`
  junction, and the global `npm`/`npx` are broken on this machine (MODULE_NOT_FOUND in npm itself). Node 24's
  type-stripping plus a 15-line resolve hook for `@/` runs lib code without tsx.
- **Open:** whether pickleball.com recalculates at a fixed time — 09:00 UTC is a guess, and the 9/27 capture
  shows a bad moment exists. If a stale board is reported again, check the cron's run log first.

