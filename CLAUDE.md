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

