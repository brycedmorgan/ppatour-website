@AGENTS.md

# PPA Tour Website Rebuild — `ppatour-website`

Content-first rebuild of `ppatour.com`. The site is the **content / discovery /
streaming** layer; commerce redirects out to partners (tixr for tickets,
pickleballtournaments.com for amateur registration). Do **not** embed checkout,
build a cart, or replicate registration forms.

**Full brief:** read [`CLAUDE_CODE_PASSOFF_v2.md`](CLAUDE_CODE_PASSOFF_v2.md)
end-to-end before touching code. The strategy doc (`Option B — Content-First
Strategy`) is the ultimate source of truth.

**Owner:** Bryce Morgan (President + CMO, PPA Tour)

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · shadcn/ui ·
Sanity (CMS, pending confirm) · Vercel (staging) → AWS (prod, Phase 3).

## Standing rulings (don't re-litigate)

- **Opens are 1,000 points.** Bryce, 7/29 — closing Hannah's "Opens 500 / Cups 1500 /
  Majors 2000" claim outright ("Hannah is full of shit"). The live tier system stands:
  Opens 1,000 · Cups 1,500 · Championship 2,000 · Worlds 3,000, and Connor's 7/23
  "The Tour = 1,000+ points" spec stays baked into `getMainTourEvents()` and the
  events buckets. **No further changes on this.**
- **Worlds is a Major** — the biggest one, at 3,000 points. Bryce, 7/29: "Worlds is
  the biggest slam. Still in the category." It is NOT a tier sitting above the Majors.
  `isMajor()` already badged it correctly; the pro-tour tier table, the TV schedule
  label, and the "Worlds, majors, cups, opens" copy pattern were the places that
  presented it as a peer category, and they're fixed.
- **Ad inventory on ppatour.com is off the table for now** (Bryce, 7/29). Don't build
  slots, don't ask again.

## Session Log

### 2026-08-05 (pt. 7) — /watch: the Live Now band is hidden unless something is live
- Wesley: "on /watch, we need to have the live now section hidden unless we are actually live."
  It was unconditional, so out of competition the page published a **"LIVE NOW · Scores &
  Brackets" heading over three permanently-spinning skeleton cards**. The ticker holding its
  loading state when nothing is live is correct behaviour (it refuses to fabricate matches —
  7/31) but under a heading that claims live it reads as broken. **Same class of bug the 8/1
  audit fixed on /live**, one surface over.
- New `components/watch/WatchLiveNow.tsx` owns the heading + rail and **returns null unless a
  match has `status === "live"`**. Finals and up-next rows arrive in the same ±1-day feed
  window and neither makes the label true; once one match IS live the rail shows the whole
  window (live → up next → final), which is the point of the section.
- **The gate is client-side, on the cards' own 15s poll**, so the band appears by itself at
  first serve on a tab that was already open, and retires when the last match finishes. The
  server prefetch is kept and seeds it, so there's no flash of a heading that then removes
  itself — and the `Suspense fallback` is now `null`, not a 120px spacer, or the reserved gap
  would outlive the section it was reserving for.
- **⚠ It owns the hook and passes the matches DOWN** via a new `matches` prop on
  `LiveScoreTicker` (controlled mode: render these, don't poll). Nesting two `useLiveTicker`
  calls would have doubled /watch's polling **and let the heading claim live over an empty
  rail** for a tick. Uncontrolled callers (`TopBar` on /live) are untouched.
- Verified both branches through a real Next server, not just a build: with the live feed
  empty (dev feed reports `hasActiveMatches: true` for PPA but returns **0 rows** in the
  window) /watch renders **0 "Live Now", 0 "Scores & Brackets"** and goes straight from the TV
  guide to Next Broadcast; with a live match seeded into the prefetch the band returns with
  **real cards and exactly one pulsing live dot**, no skeletons. tsc + eslint clean.
- **⚠ Method: a stale `next dev` on :3111 served the OLD code and answered 200 for a page I
  thought I'd just changed** — it showed the band still present. Second helping of the 8/3
  Windows port trap. `next dev` also refuses to start twice for one repo dir, so **check
  `Get-NetTCPConnection -LocalPort N -State Listen` and use the server that owns the dir.**

### 2026-08-05 (pt. 6) — The real PBTV brand kit lands; /pbtv re-skinned off the guide, not a guess
- **Bob Whyley sent the PBTV brand kit** (Dropbox, 36MB) — the asset chased since 7/30 and the
  thing `_pbtv/HANDOFF.md` named as the blocker on this page. Both guides + every logo format.
- **⚠ THE PAGE WAS THE WRONG COLOUR AND THE WRONG SHAPE, and not by a little.** The concept was
  built pre-kit as deep-green ground (`#06160E`) with an optic-lime accent (`#C8F250`). **PBTV is
  a GREYSCALE brand with one muted green** — main colours are grey `#828C96`, green `#508250`,
  black, white; secondary taupe/mid-grey/slate. **Not one value in the old palette survived.**
  Re-skinned to the guide: black ground, white ink, `#828C96` for secondary text, `#508250`
  reserved for CTAs and the live-bug accent.
- **Every pair was contrast-checked on black before it shipped**, not eyeballed: green 4.65:1 ·
  grey 6.14:1 · white-on-green 4.52:1 — all AA for normal text. **`#626262` measured 3.44:1, so
  it holds LINES and never type** (the small supporting text that used to sit on it moved to the
  main grey). The one colour NOT in the guide is the `--live` red; PBTV has no red, and it stays
  as a functional broadcast-status colour with a comment saying so.
- **Real vector logos replace two 66KB base64 PNGs.** The kit's PDFs are Illustrator vector, so
  they were **converted to true SVG** (a small PDF-path→SVG converter — content streams inflate
  to plain `m/l/c/h` ops). **⚠ The first pass silently dropped the `l` glyphs** — straight-sided
  letters are drawn as `re` rectangles, which the converter was discarding as clip rects, so the
  wordmark read "pickeba tv". Caught by RENDERING it, not by reading the output. **Page 160KB → 31KB.**
- **⚠ THE ONE JUDGEMENT CALL: display type is now uppercase condensed.** PBTV's headline face is
  **Prohibition** and every frame in the guide reads TOURNAMENT / TONIGHT / COMING UP. The page
  was all-lowercase Framer-spare. Changed, and flagged in the CSS — three rules revert it.
  **⚠ Prohibition, Avenir and All Round Gothic are licensed DESKTOP faces and the kit shipped no
  webfonts**, so the stack names the real faces first (Avenir Next ships on every Mac and iPhone)
  and falls back to Oswald — which is the face the 2023 Visual Language moodboard itself specified.
  To make it exact, licence the two webfonts and self-host.
- **Three real bugs found while re-skinning, all pre-existing:**
  - **No `<meta charset>` at all** — every em dash rendered as `â€"` unless the server happened to
    send a charset header. The page's correctness was depending on infrastructure it doesn't control.
  - **87px of horizontal overflow at 390px.** The header had NO mobile treatment — four text links
    plus the pill never fit. Below 720px the section links drop (the footer nav carries the same
    five anchors) and the logo + "watch live" stay.
  - **`.hero`, `.stage` and `.join` are each ALSO `.wrap`** and carry a `padding` SHORTHAND, which
    resets `.wrap`'s `0 24px` gutter to zero. Invisible above ~1128px because the centred max-width
    hides it; at 390px the headline sat flush against the screen edge. `padding-block` fixes it.
- **Verified with CDP device metrics at 390/768/1440** (never `--window-size` — this repo's log
  records why): **0px horizontal overflow at all three**, 0 elements stuck at opacity 0, 0 broken
  images. Dead canvas block removed (its `getElementById('court')` returned null on every load).
- **⚠ A PARALLEL SESSION IS COMMITTING WITH `git commit -a` AND SWEPT THIS WORK UP.** The three
  PBTV brand SVGs landed inside `1be38f4` and a mid-edit `index.html` inside `667157c` — both
  titled "Nationals hero". Nothing is lost and the final state is correct, but those commit
  messages do not describe their contents. Same trap as the 7/31 pt.3 entry. `cc6cbdb` is the
  clean remainder.
- **Next:** licence + self-host Prohibition and Avenir (the only thing between this and exact) ·
  the FAST-platform logos (Xumo/Philo/TCL/LG/CW) are still Simple-Icons-or-nothing — 9 of 14
  tiles are text-only · the kit ships **no combination lockup file**, only a picture of one in
  the guide, so ask Bob for it before it goes on anything printed.

### 2026-08-05 (pt. 5) — Blog work now SHIPPED: 57 images synced to Blob, gate green
- **Bryce grabbed `BLOB_READ_WRITE_TOKEN` from the Vercel Blob dashboard** (Storage →
  ppatour-website-media → `.env.local` tab) into `~/pickleball/ppatour-website/.env.local`
  (gitignored). That unblocked the whole thing — see pt.4 for why it was blocking.
- **Integrated the held blog work onto main** by cherry-picking the two *code* commits
  (`8c6a0cd`, `cfa2615`) — skipped the two session-log-only commits to avoid CLAUDE.md clashes.
  One conflict, in `app/sitemap.ts`: resolved to keep BOTH — /vacations stays out (Stripe hold)
  AND blog posts emit via `n.href`.
- **Ran `node scripts/sync-wp-media.mjs`: 57 blog assets, 0 failed, 6.7MB → 3.5MB.** Gate now
  **PASS, 1788/1788 (100%), 0 still on WordPress**. Full build green, pushed (`e6644d9`),
  deploy ● Ready.
- **Verified live on prod:** `/blog` + `/ppa-blog/{slug}` 200 with real `<h1>`, and **every post
  image resolves to `…public.blob.vercel-storage.com`, zero `ppatour.com/wp-content` left** — the
  39 evergreen SEO posts (Hannah's) now survive the domain cutover.
- **`blog-work-hold` branch deleted** — its content is on main now (the two log-only commits were
  intentionally dropped; their history is captured here). `.env.local` left in place for future
  media syncs (gitignored).
- **⚠ Cutover reminder unchanged:** when ppatour.com points here, re-run `sync-wp-media.mjs`
  once more if any new posts landed, and remember `/vacations` is still noindex until Stripe.

### 2026-08-04 (pt. 4) — Launch-night prep: pushing main would have RED-BUILT the launch
- **Bryce launches ppatour.com tonight.** Asked to confirm tracking/cookies are in place,
  keep vacations.ppatour.com intact until Stripe, and noindex /vacations. Shipped green +
  verified live on production (`6504d08`). **Blog work held back — see below.**
- **⚠ THE PLANNED "push main" WOULD HAVE RED-BUILT THE LAUNCH.** Four unpushed 8/4 pt.3 blog
  commits (now on branch `blog-work-hold`) reference **57 blog images still on ppatour.com**
  never synced to Blob; `prebuild` runs `sync-wp-media.mjs --verify` which **exits 1** on them.
  Verified: gate exit 1 with the blog commits, exit 0 without. Origin/main's prod deploys are
  green precisely *because* they lack these commits. **Pushing as approved would have failed the
  build and shipped nothing on launch night.** (This is the pt.3 blog work — its own log entries
  live on `blog-work-hold`, not here, since the reset reverted CLAUDE.md too.)
- **Only the two launch-safe changes went to main**, rebased clean onto origin (gate green):
  - **/vacations noindex + out of the sitemap** until Stripe lands (`robots:{index:false}` in
    `app/vacations/page.tsx`, entry removed from `app/sitemap.ts`). Page renders, checkout 503s,
    real bookings still run on the intact subdomain. **Revert both when Stripe is configured.**
  - **Six Zero logo parity** — old `six-zero.jpg` was a 320×126 stacked lockup rendering visibly
    smaller than JOOLA/Proton in the Platinum grid (a sponsor flagged it to Bryce). Replaced with
    a 1000px PNG rasterized (sharp) from Six Zero's own vector wordmark (`six-zero-logo.svg`),
    recoloured near-black. Verified live: png 200, old jpg 404.
- **⚠ TO SHIP THE BLOG WORK: needs `BLOB_READ_WRITE_TOKEN` (not on this machine).** `vercel env
  pull` → `node scripts/sync-wp-media.mjs` (sync mode — uploads 57 assets + rewrites
  `wp-media-map.json`) → commit the map → rebase/merge `blog-work-hold` → push. Gate goes green
  after the sync. Dry run (pt.3): 60 assets, 0 failures, 6.9MB → 3.7MB.
- **Tracking audit (Bryce's actual ask): all verified firing on prod** — GA4 `G-NKVE1BRLK7`
  (Consent Mode v2, denied-by-default), Meta Pixel, cookie banner (Accept/Decline flips both
  live), outbound-click conversions, Vercel Analytics + Speed Insights, UserWay. `SITE_INDEXABLE=
  true` already set (known since pt.3); fine since launch is tonight, canonicals → www.ppatour.com.
- **Open for Bryce:** secondary GA4 `G-VFNFRP66Z5` env var unset → that property goes dark at
  cutover · **"Is Proton still a thing?"** — if no longer a sponsor, pull from the Platinum roster
  in `home-content.ts` (business call) · old.ppatour.com fallback = a Cloudflare + WordPress-
  siteurl job (all DNS on Cloudflare; not a launch blocker).

### 2026-08-04 (pt. 2) — Gold Prize Grid cut; a RED BUILD nobody noticed; invented presenters
- **Gold Prize Grid removed from event pages** (Bryce, photo of the Nationals page). Deleted the
  component rather than unmounting it, so nothing can re-import it. It rendered on **two** surfaces
  that drift silently — the event page and `NationalsLive.tsx`. `GOLD_GRID` / `goldGridTotal` stay
  in placeholder-data with a ⚠ note that nothing renders them. Purse is untouched: `TIER_PRIZE`
  still carries the hero, quick facts and What's at Stake. Side effect: this cleared the last
  literal 🥇🥈🥉 off an event page, closing Hannah's 7/28 medal-terminology flag.
- **⚠ PRODUCTION WAS RED FOR ~20 MINUTES AND IT LOOKED FINE FROM OUTSIDE.** Builds failed from
  `76257b2` (VB Open / Mojo) onward; **three deploys errored before mine landed** and the live site
  kept serving the last good build, so nobody noticed. **If a push seems not to have taken effect,
  check the deployment state before re-pushing — a green site is not a green build.**
  - Cause: `short: "Virginia Beach Open"` set on a `RawEvent`. **`shortName` was deleted from the
    type on 8/3 precisely so it could not return** — the type refused to compile, which is the
    design working.
  - **⚠ AND THE COMPILE ERROR WAS THE ONLY THING STOPPING A WORSE BUG.** `slug = r.slug ?? kebab(name)`,
    so the rename would have moved the page to `/events/2026/mojo-energy-pouches-virginia-beach-open`
    and orphaned BRAND_BY_SLUG, venue-photos, tv-schedule, broadcast, event-guides,
    defending-champions.json, watch-angles.json, news-articles, the sitemap and every inbound link.
    **Pinning `slug` on ANY rename is not optional.** Verified: URL byte-identical, Mojo name renders.
- **⚠ WE WERE INVENTING PRESENTING PARTNERS — 6 of 10 were fabricated.**
  `presentedBy: PRESENTER_BY_SLUG[slug] ?? sponsor`, where `sponsor` is whichever of
  Veolia/Carvana/Rate/Proton the **name starts with**. So an event's **title** sponsor was published
  as its **presenting** partner — two different deals at two different prices. It produced the
  self-referential "Proton Daytona Beach Open presented by Proton" and "Carvana Mesa Cup presented
  by Carvana". Bryan Renahan flagged three; the bug was structural.
  - **Fixed in BOTH builders.** `lib/events-api.ts` carried the identical fallback and **/events is
    feed-driven** — curated-only would have left the page that matters still crediting the wrong
    partner. Same trap as the 8/3 name pass. **PRESENTER_BY_SLUG is now the only source**; unlisted
    means nothing renders. 10 → 5, all genuine. Arizona Open → **AT Sports** (Veolia is title).
  - Two nobody flagged were wrong the same way but **hand-typed on the records**, so the fallback fix
    missed them: Carvana Utah Open and Veolia Kansas City Cup. Removed separately.
- **Cincinnati has no venue** (Bryan: "should not have Lindner Family Tennis Center listed anywhere").
  Row drops `venue` and falls back to the city; the trip guide's mapQuery, getting-there and parking
  copy were all written around that venue (Mason, Gate A, "the tennis center") and were **reduced to
  what is true without one rather than re-pointed at an invented replacement**. Verified 0 Lindner.
- **"MAIN GATE · BOX OFFICE" overflowed its box on every event page** (Bryan, screenshot). It is the
  only long label drawn *inside* a filled rect. Box 180→230, tracking 2→1.5 to match GUEST SERVICES.
  **Measured with `getComputedTextLength()`, not estimated: 180.1px in 230px.** Longest in-box label
  on the map — re-measure if reworded.
- **Deliberately NOT touched: tournament names and badges.** Tyler was mid-flight on those (4 commits
  in an hour) and concurrent edits to the same rows are what broke the build. Checked instead:
  Nationals reads "Veolia Pickleball National Championships" on **both** homepage and /events, so the
  split Tyler flagged in #60 is already resolved and **no feed-name override is needed**.
- Verified live on production, not just locally: Cincinnati 0 Lindner, Mesa Cup 0 presenters,
  Arizona 10× AT Sports. Slack recap sent to #ppa-website-crew by Bryce.
- **Next:** Connor's hero still needs an asset (he wants "exciting"; current drone shot is too much
  grass) · Zyia is the last sponsor with no mark · Jeff's Dropbox headshot misspellings (e.g. Cason
  Campbell) · Vacations cutover is Bryce's, shortly.

### 2026-08-04 — How Pro Pickleball Works rebuilt from Jeff's doc; five stale stop counts
- **Source: Jeff Watson's "How Pro Pickleball Works" doc** (#ppa-website-crew, 8/3). **Every
  comment thread on it is RESOLVED, Connor Pardoe's included — the numbers are approved, not
  drafted.** Two of his rulings are baked in: **show only the Gold contract prize grid**
  ("Id only show gold here") and **there is no third-place match** ("we are just getting rid
  of the 3rd, both teams get paid for 4th").
- **⚠ THE OLD PAGE WASN'T JUST THIN, IT WAS WRONG.** It listed **only two Majors** (there are
  four), called the **PPA Finals a "bonus"** rather than a 2,000-point event, and said **"the
  majors pay double"** when Worlds is 3,000. It had nothing on contracts, the WPR weighting,
  Current Seed, draws, byes or prize money — most of what a fan actually wants.
- Four sections behind jump links: **Who Is a Pro** (contract-first, three routes in,
  Gold/Standard/Futures + the Top-25 promotion, Legacy, ITPs and the 8-events-in-a-year path
  back) · **Rankings & Current Seed** · **Tournaments & Draws** · **Points & Prize Money**.
- **The 50/35/15 figure is ONE stacked bar, not three meters** — parts of a single composite
  score, so segment width IS the weight. Same validated `ppa-blue-deep → ppa-blue → ppa-sky`
  ramp as the 8/3 /rankings hero, **labels outside the bar because `ppa-sky` carries a
  contrast WARN.** Don't restyle without re-reading that entry.
- **Jeff flags WPR vs Current Seed as the thing that "trips up new fans"** — it gets its own
  panel, because the two numbers do different jobs (WPR = entry + byes, Current Seed =
  per-discipline seeding, combined across a doubles team).
- **URL deliberately unchanged.** `/about/how-it-works` is linked from the header, footer,
  /about, /rankings, the homepage, /about/history, the sitemap and site search — only the H1
  and `<title>` changed. Prize-grid CTA deep-links the next stop's `#stakes` (verified to
  exist on both the event page and NationalsLive). **Each wide table scrolls in its own
  `overflow-x-auto`** so the page body never scrolls sideways.
- **⚠ /about HAD FIVE STALE STOP COUNTS, IN FOUR FORMATS — and a grep for "18" found three.**
  It claimed **18** tour stops in five places while `getMainTourEvents()` returns **20**, a
  regression against the 7/29 sitewide normalization. Two were `18`, **two were spelled
  "eighteen"** (including the H2 *"One Race. Eighteen Stops."*), one was in the metadata
  description. **The spelled-out ones were only caught by diffing RENDERED TEXT, not source —
  when normalizing a number, search the output, not the code.** All five now derive from
  `getMainTourEvents()`, as do the season opener and closer, so **no event name is typed on
  that page any more** — which also cleared the retired "Veolia Pickleball National
  Championships" spelling the 8/3 change left behind, and "the majors pay double".
  - The old comment called the count *"TBD, 18 shown provisionally"* (Tyler, 7/30). Deriving
    settles it permanently.
- **⚠ The doc uses medal language** — "gold-medal matches", "no bronze-medal matches" — which
  brushes against **Hannah's 7/28 ruling to drop medal terminology sitewide**. Kept Jeff's
  wording because it names match *formats*, not player achievements (hers targeted rank chips
  and career stats). **Flagged, not resolved** — if she's firm, it's two strings.
- **⚠ STANDING INSTRUCTION (Wesley, 8/4): never audit or flag old `/news` articles.** They sit
  behind the content-approval gate and are Dylan's. Several carry retired terminology and
  superseded figures; that is knowingly accepted. Fix non-article surfaces and say nothing.
- Verified on a real prod build: tsc + build clean, eslint at its 8-error baseline, **zero
  horizontal overflow across 9 pages at a true 390px**, rendered at 1440 and 390.

### 2026-08-03 (pt. 7) — Full tournament names: `shortName` deleted; a homepage viewport bug
- Jeff Watson, 15:43 in #ppa-website-crew: **"we need to call every tournament by their
  full name please - in every instance"** (Veolia Pickleball National Championships, Veolia
  Chicago Cup, Carvana Pickleball Masters). Bryce escalated it off a Nationals meta
  description. Wesley: *"We need it to not be the short names."*
- **The data was already right — `name` has always carried the full sponsored name and
  already matched Jeff verbatim.** The bug was that **`shortName` is what rendered**, in 54
  places: the event `<h1>`, `<title>`, the OG card, /watch, the concierge, every ticket CTA.
- **⚠ WHAT `shortName` WAS ACTUALLY FOR.** Of the 20 main-tour stops, 12 differed, and
  **8 of those 12 existed only to strip the title sponsor** — Veolia Pickleball National
  Championships → National Championships, Rate Las Vegas Open → Las Vegas Open, Carvana Mesa
  Cup → Mesa Cup. **We were removing Veolia / Carvana / Rate / Proton from the `<h1>`, the
  browser tab and the OG card of the events they pay to title.** A sponsor-billing bug
  dressed as a copy-style preference. The other four were ordinary abbreviation.
- **Deleted from the type, not bypassed** — all 54 sites became type errors, so no surface
  could quietly keep the old behaviour. `Tournament.name` documents why it must not return.
- **⚠ NAMES COME FROM THE FEED. Wesley's call, after seeing the measurement: "use the API
  names only."** Checked all 220 `ppa_tournaments` rows first, because **the API contradicts
  Jeff on two of his own three examples.** Three stops changed:
  - Veolia Pickleball National Championships → **Veolia PPA National Championships**
  - Carvana Pickleball Masters → **Carvana Pickleball Masters Powered by Invited**
  - Greater Zion Cup at Black Desert Resort → **Greater Zion Cup** (*shorter* — the feed
    drops the resort)
  14 were already identical; **3 aren't in the feed at all** (Proton Daytona, Texas Open 2027,
  PPA Open) and keep curated names, as does everything when the API is unreachable.
- **⚠ THE FEED IS NOT SELF-CONSISTENT YEAR TO YEAR, and /events proves it on one screen:** it
  names the **2026** Zion stop *"Greater Zion Cup at Black Desert Resort"* and the **2027** one
  *"Greater Zion Cup"*. Same for Texas (*"Veolia Texas Open"* 2026, bare *"Texas Open"* 2027)
  and Sacramento. **Both strings are the feed's own — that is now the site's behaviour by
  design. If a name reads wrong, fix it in the feed, not here.**
- **⚠ FLIPPING THE MAPPER WAS NOT ENOUGH, AND THIS IS THE TRAP.** `resolveEvent` checks
  `tournaments` (curated) FIRST, so a curated event never reaches the API record — the mapper
  change alone did nothing on the page that matters most. Worse, the **homepage hero, Next on
  Tour strip, header panel, `-live` route and EVERY OG card read the curated list directly**
  (`getMainTourEvents()` / `tournaments`), so a mapper-only fix would have left the event page
  disagreeing with the homepage. **Half-applied here is worse than not applied.**
  - Fixed on both sides: the mapper prefers the feed title, `resolveEvent` overlays the live
    name onto the curated record (keeping `defendingChampions`, the one field the API path
    doesn't carry), **and the three curated ROWS were renamed to mirror the feed** so the
    sync surfaces agree without an async refactor.
- **⚠ NEW `RawEvent.slug` — RENAMING AN EVENT USED TO SILENTLY MOVE ITS URL.** `buildSchedule`
  derived the slug from the name, so changing a name would have repointed the page and
  orphaned `BRAND_BY_SLUG`, `COMMERCE_BY_SLUG`, `GALLERY_BY_SLUG`, event-guides, broadcast,
  venue-photos, `MAJOR_SLUGS`, the sitemap and every inbound link. The three renamed rows pin
  their original slug. **Verified: 28 event URLs byte-identical before and after.**
  `CURATED_ALIASES` still does the reverse mapping and all three still resolve.
- **`lib/tv-schedule.ts` is a THIRD hand-typed name list and two entries had drifted** on the
  same slug — "PPA World Pickleball Championships" and "Proton Florida Open". Fixed.
  `broadcast.ts` is keyed by slug only. ⚠ **Nothing prevents this drifting again** — a check
  asserting every slug-bearing TV entry matches the curated name is worth ~20 lines.
- The `-live` route had a **hardcoded `<title>` of "National Championships — Live"** — the
  only true leak the sweep found. OG font sizing was a two-step tuned for short names
  (`>18 ? 68 : 84`); **10 of 20 names now exceed 18 chars, longest is 40**, so it's graduated
  at 34/26/18. **Cards were rendered and looked at, not assumed.**
- **⚠ THE REAL BUG THIS TURNED UP: the homepage Next on Tour grid dragged the whole page's
  layout viewport from 390 to 453 at an emulated 390px device.** It measured **436px inside a
  358px container**. Cause: **a `<li>` is a grid item, so it defaults to `min-width: auto`
  and the column floors at content-based minimum — which meant the `min-w-0` + `truncate`
  already on the name span never got to apply.** One `min-w-0` on the `li`.
  - **Only caught by measuring the DEPLOYED site as a baseline (390) and diffing the local
    build (453).** Worth repeating: for any change that lengthens text, the live site is a
    free pre-change control.
- Verified on a real prod build: **491 full-name renders vs 6 bare, and all 6 are correct** —
  "Indoor National Championships" and the 2023 "Biofreeze USA Pickleball National
  Championships" are *different events*, the bare "Daytona Beach Open" rows are the 2023/24/25
  editions that genuinely had no Proton billing, and one is a YouTube video title from the
  feed. **Zero horizontal overflow across 9 pages at a true 390px.** Slugs unchanged → no URLs
  moved. tsc + build (1,175 pages) clean; eslint at its existing 8-error baseline.
- **⚠ TWO METHOD TRAPS, both cost real time:**
  - **`pkill -f "next start"` does not kill the server on Windows.** Three verification runs
    silently reported the OLD build before I checked the port and saw `EADDRINUSE` in the
    server log. **Check `netstat -ano | grep :PORT` and `Stop-Process -Id` instead.** Same
    family as the 7/29 stale-`public/` gotcha.
  - Mobile measurement is **CDP `Emulation.setDeviceMetricsOverride`**, never `--window-size`
    (7/31 pt. 5). No puppeteer in this repo — **Node 24 ships a global `WebSocket`, so you can
    drive Chrome over CDP with zero dependencies.**
- **Left for a human:** prose now reads *"Watch Veolia PPA National Championships Back"* /
  *"Why … Matters"* / *"How … Finished"*. Grammatically clumsy but deliberately NOT reworded —
  Jeff said every instance, and rewriting published copy isn't a refactor's call.
  Also **`lib/news-articles.ts` still says "Veolia Pickleball National Championships"** in
  Dylan's published copy — left alone under the 7/29 content-approval ruling. **Flag it to
  him**; it's now the only place on the site using the retired spelling.
- **⚠ The feed is now the source of truth for names, so a rename upstream reaches the site
  with no code change — but the three curated ROWS are a HAND-MIRROR of it and will drift.**
  Same exposure as `lib/tv-schedule.ts`, which had already drifted twice
  ("PPA World Pickleball Championships", "Proton Florida Open" — both fixed this session).
  **A check asserting curated + TV names match the feed is ~20 lines and worth it.**
### 2026-08-04 — Pickleball Vacations moved ONTO this site at /vacations
- **Bryce: "I want PPA vacations built within the new ppa tour site."** It was a
  standalone Next app on `vacations.ppatour.com` (`~/pickleball/PPA`). It now lives here —
  marketing page, registration form, Stripe checkout, guest archive and all. **That repo is
  archive-only from today.** Full runbook in [`docs/VACATIONS.md`](docs/VACATIONS.md).
- **⚠ THIS IS THE SITE'S FIRST COMMERCE SURFACE.** The founding rule is "commerce redirects
  out", and this is the deliberate exception, not drift. Checkout is still *hosted* by Stripe
  — we create a Session and redirect — so no card data touches this app. Nothing else on the
  site should read this as permission to embed a cart.
- **⚠ FOUR CUTOVER STEPS ARE NOT CODE and the page looks fine without them**: live Stripe key,
  **re-point the Stripe webhook to `/api/vacations/stripe-webhook`**, SendGrid + Sheets vars,
  and the `vacations.ppatour.com` domain redirect. The webhook is the dangerous one — miss it
  and payments still succeed while the guest gets no confirmation, no internal notification
  and no sheet row. Verify the key with `/api/vacations/availability` → `"known": true`.
- **The subdomain redirect must be path- AND query-preserving.** Punta Cana guests hold
  `vacations.ppatour.com/success?session_id=cs_live_…` links. Root-level 301s for `/success`,
  `/register`, `/trips`, `/trips/punta-cana` and `/travel` exist to catch exactly those —
  verified single-hop with the query intact. All six sources checked against the 811 migrated
  post slugs first; **zero collisions**.
- **`/tour/travel` is gone** (301 → `/vacations`) and the Travel tour-program entry was
  **deleted**, not repointed. It hand-transcribed the same trip facts, which is how it came
  to advertise Club Med Turkoise with a CTA aimed at **`ppavacations.com` — a parked domain
  nobody here owns** (verified: registrar lander, and it was live on the page). Tournament
  hotels were its other half and already live on each event page's Where to Stay.
  **`lib/vacations/content.ts` is now the only home for trip facts.**
- **Built native, not ported 1:1.** Data + commerce libs came over nearly verbatim (they're
  battle-tested); the UI was rebuilt in Gotham/PPA navy on this site's own section, rail and
  reveal patterns, with the Vacations teal kept as a sub-brand accent — the same idea as an
  event's `brand.accent`. New tokens `--color-vac-*` in globals.css, **scoped to /vacations;
  `ppa-blue` stays the tour's CTA.** Hayden's card links through to `/athletes/hayden-patriquin`,
  which is the whole point of it living here.
- **⚠ A GROUP REVEAL NEEDS BOTH `data-reveal` AND `data-reveal-group`.** The first is what
  the observer queries for; the second only does the child stagger. I shipped six groups with
  just the latter and **every child sat at `opacity: 0`** — the stat band rendered as an empty
  navy box. `HomeContent.tsx:702` is the one prior usage and carries both. **Caught by
  rendering the page, not by building it** — tsc, eslint and `next build` were all clean.
- **⚠ FULL-PAGE SCREENSHOTS LIE ON THIS PAGE.** The hero is `min-h-[78svh]`, so a tall
  `--window-size` capture inflates the viewport unit and the hero balloons to 3,500px. Verified
  instead with **CDP `Emulation.setDeviceMetricsOverride` + DOM measurement**
  (`scratchpad/cdp.mjs`): at 1440×900 hero **702px**, at 390×844 hero **735px**,
  **0 horizontal overflow and 0 elements stuck at opacity 0** on /vacations, /register and the
  Punta Cana archive. Same lesson as 7/31 pt. 5.
- **Found and dropped two 404s that are live today**: the Punta Cana guest archive lists
  Archery and Kayaking tiles whose images were deleted on 7/17 when Turkoise replaced the trip.
  Confirmed 404 on the standalone site. Ported without them.
- Also fixed: stat-band `px-4` sat on the `gap-px bg-white/10` grid itself and painted a pale
  strip down both outer edges (padding moved to a wrapper); the hero said "adults-only" twice
  in adjacent lines; the checkout `fetch` now carries the trailing slash the other four forms
  on this site use, so the POST doesn't take a 308 on the way in.
- Deps added: `stripe`, `@sendgrid/mail`. Assets under `public/vacations/` (6.4 MB — the
  ~13 MB of unused `.eps`/`.pdf` print formats were pruned on the way in).
- **Next:** the four cutover steps · **open call for Bryce — the site-wide `StickyBuyBar`
  pins a $25 ticket CTA to the bottom of a page selling a $3,800 room; suppressing it on
  /vacations is one line** · roll Punta Cana's archive into a real trips index when trip 3 lands.

### 2026-08-03 (pt. 6) — Rankings search + region filter; a phantom leaderboard page killed
- Wesley: add **search by name** and **filter by region** to /rankings and /leaderboards.
  His framing on search was the right one — *"all 2,000 at once" doesn't help anyone find a
  specific player; if they want No. 400 they scroll past 399 rows either way.* Both shipped.
- **New `lib/ranking-filters.ts` is shared by the client board AND the server page**, so the
  two surfaces can't drift on what "matches" means. Search folds accents and punctuation and
  matches all terms in any order — verified against the **10 genuinely accented names on the
  board**, e.g. plain `nguyen hoang` finds *Nguyễn Hoàng*. A search box that can't find an
  accented name is worse than none for the pros most likely to have one.
- **⚠ REGION IS DERIVED FROM `countryCode`, NEVER STORED ON THE ROW.** /rankings renders the
  complete boards, so a `region` field would be ~25 KB of extra payload on the document the
  8/1 pass fought from 3.96 MB down to 2.04 MB. The two-letter code is already in the payload
  for the circle-flag, so deriving is free. **Don't add the field.**
- **⚠ CONNOR'S FIVE REGIONS DO NOT COVER THE RANKED FIELD, and this mattered.** His USA /
  Asia / Australia / Europe / Canada is right for *events* — the tour only runs stops there —
  but players come from everywhere. Measured on the live feed: **47 of 2,075 ranked pros are
  from none of the five** (Brazil 9, Puerto Rico/Mexico/Colombia/Venezuela 5 each, Peru,
  Chile, Bolivia, Argentina, Ecuador, Saint Lucia, + South Africa, Morocco, Libya, Zambia,
  Tunisia). Shipping the five alone would have left them **unreachable by any filter value** —
  the same bug the 7/31 events work fixed when the sub-1,000 stops had no reachable filter.
  So: Connor's five, **in Connor's order**, plus a trailing **"Rest of World"**.
  - **That bucket is not fringe — it holds men's No. 2 (Gabriel Tardio) and No. 5 (Federico
    Staksrud).** Dropping it would have hidden two top-five players from the region filter.
  - Verified as a true partition, client and server: the six counts sum to exactly 1,324 men
    and 751 women, every player reachable, **no player in two regions**.
  - ⚠ **NZ is filed under "Australia"** (32 players), following the existing `NZL: "Australia"`
    in events-api's `COUNTRY_BY_CODE`. Consistent with /events; one line to split if anyone
    objects. Israel → Asia (geographic); Turkey/Georgia/Russia → Europe (sporting convention).
    **Puerto Rico is deliberately NOT "usa"** — the feed gives it its own country and flag.
- **⚠ THE REAL BUG THIS TURNED UP: /leaderboards advertised a page that did not exist.** It
  reported the API's `total_records` (**1,366**) as the total, but the mapper drops zero-point
  players (**42 of them**), so the board actually ends at **1,324 on page 27** — and page 28
  was linked in the pagination and rendered *"No players on this page"* in the tour's own
  standings. Found because the new filtered path counts real rows, so the same screen quoted
  **1,366 and 1,324 for one board**. `getRankingPage` now assembles the board once and
  paginates that, so `total`/`totalPages` count only rows that render. Page 28 is gone; a
  deep `?page=99999` clamps to 27 instead of going blank.
  - Cost is ~nothing: `boardAll` reads the same 24h tagged Data Cache entries that
    /rankings — `force-static`, built at deploy — already populates for both genders.
- **The wrong-board dead end is handled on both pages**, and it's the likeliest zero-result:
  searching "waters" while sitting on the men's board. Mobile tabs now carry per-board match
  counts (`Men · 0 / Women · 2`) and the empty state offers **"2 matches in Women →"**.
  Without it, a *correct* search reads as "no results" — only one board is on screen at 390px.
- **True world rank is never reindexed by a filter** — searching "duckworth" shows the badge
  **400**, not 1. Filtered column headings read "1 of 1,324" so the board never presents a
  filtered set as the whole field.
- **⚠ There are 22 duplicate names on the boards, including TWO "Ben Johns" (#1 US and #679
  AU).** Search correctly returns both, which is why results must keep rank + flag + points
  as disambiguators. Don't "de-duplicate" them.
- /rankings filters client-side (rows are already in the payload; `useDeferredValue` keeps
  the input responsive against 18,646 DOM nodes — **keep it**). /leaderboards filters
  server-side via `?q=`/`?region=` on a plain **GET form**, so results are linkable and work
  with JS off; every pagination and gender-tab link carries the filter, Clear drops it.
- Controls are **opt-in via `filterable`** — the homepage and /athletes top-10 modules use the
  same component and must not grow a search box over ten rows. Verified absent on both.
- Verified on a real server at 1440px and 390px: 2,075 rows, zero horizontal overflow,
  labelled controls, `aria-live` count, the `sr-only` WPR `<h1>` intact, and param hardening
  (bad/uppercase/path-ish region, bad/negative/absurd page, `<script>` in `q`) all inert.

### 2026-08-03 (pt. 5) — The /events filter bug (one bug, not three); UserWay; sponsors 8/4

- **Sponsors → the 8/4 approved roster** (Wesley's, landed in parallel), which now supersedes
  ppatour.com/sponsors — the live page trails it. **Silver is removed from the `PartnerTier`
  union, not just emptied**, so `tier: "silver"` is a type error rather than a regression a
  hand-edit can reintroduce. 30 partners: Carvana + 9 Platinum / 8 Gold / 12 Tour. Hertz and
  Picklebalm off; MOJO, The Picklr, Zyia on. The two three-way identity conflicts flagged in
  pt. 4 are resolved by naming both brand and mark — **AstraZeneca / Fasenra** and **AT Sports
  Surfaces / Acrytech** — and Reign Storm → **STORM** to match its wordmark (asset renamed
  with it). Rankings search/region shipped the same afternoon — see pt. 6.

**⚠ THE /EVENTS FILTER BUG WAS ONE BUG, NOT THREE — AND `slug` IS NOT UNIQUE.**
- Wesley reported three faults: Past + "The Tour 1,000+" showing sub-1,000 stops, Past +
  "Challengers" showing Veolia Atlanta Championships, and filters going wrong after several
  changes. All three were **`key={t.slug}`** on the event cards.
- **Ten slugs carry multiple records because they are annual editions**: `carvana-mesa-cup`
  for 2025 **and** 2026 **and** 2027, `pickleball-world-championships` 2025+2026, `ppa-finals`
  2026+2027, and seven more. Verified all ten — **zero are true duplicates.** The data is
  right; identity is **year + slug**, exactly what `eventHref` builds.
- Duplicate keys ⇒ React can't reconcile ⇒ cards from the PREVIOUS filter state survive.
  Measured: Past+Tour **counter 74 / DOM 77**; Past+Challengers **47 / 54**; the same state
  after churn **47 / 47 clean**. That last one is why it read as "breaks when you change
  filters repeatedly" — it's **sequence-dependent**. `shown.length` was always right; the DOM
  was stale. **If a list of events ever renders wrong again, check the key first.**
- Separately: **the "The Tour · 1,000+ Pts" option never checked points.** It excluded
  international + challenger only, while `app/events/page.tsx` defines The Tour as
  `tierKey !== "challenger" && tierPoints(e) >= 1000`. The label was a claim the code didn't
  enforce. Same predicate both places now — which also drops the grid's international
  exclusion (contrary to page.tsx and Connor's 7/23 ruling). **Past + The Tour 74 → 105.**
- Method note: the first reproduction attempt counted `document.querySelectorAll('article')`
  and so included the six "Next Six on Tour" cards above the grid, which made legitimate
  upcoming stops look like filter leaks. **Scope to the grid's own section**; and the
  counter-vs-rendered-card-count comparison is the measurement that actually finds this class
  of bug.

**UserWay (`YBUtdPKa3d`) — ported, deliberately outside the consent gate**
- Closes the 8/1 launch-audit flag: UserWay (`YBUtdPKa3d`) runs on ppatour.com and this
  rebuild didn't carry it. New `components/global/AccessibilityWidget.tsx`, mounted in
  `app/layout.tsx` beside Vercel Analytics. Verified loading with **`localStorage` consent
  key `null`** — i.e. it works for a visitor who never touched the banner.
- **⚠ It is NOT in `MarketingTags.tsx`, on purpose.** Every tag there is gated on env +
  production domain + cookie consent, and all three are wrong for an accessibility widget:
  **gating it behind "Accept cookies" means a screen-reader user who clicks Decline loses
  the one feature built for them**, and gating it to the production domain means nobody can
  test accessibility on a preview. It stores the visitor's own a11y preferences —
  functional, not tracking.
- **Account ID hardcoded** with a `NEXT_PUBLIC_USERWAY_ACCOUNT` override (`=off` disables).
  The repo default is env-gated-so-nothing-ships-on, which is right for session replay and
  wrong here: shipping dark would mean it silently isn't there on launch day unless someone
  remembers a Vercel var. `data-account` does survive next/script's `lazyOnload` path —
  verified on the injected element, not assumed.
- **⚠ The button floats bottom-left, and our bottom bars are full-width.** At 390px it
  occupies x 13–57 and was **covering "We use cookies for analytics."** Fixed on OUR side —
  `pl-16` below `sm` on `CookieBanner` and `StickyBuyBar` — rather than fighting UserWay's
  generated DOM, which would break on their next release. Verified clear on both bars at
  390px and 1440px; the buy bar's event name truncates slightly earlier on mobile, which is
  the trade. **Re-check if either bar's padding is refactored.**
- Bottom-left also keeps it clear of the **EventConcierge launcher** (`bottom-20 right-4`),
  which is the other floating control on event pages.
- `lazyOnload` so a ~100KB third-party bundle doesn't compete with the hero image.

### 2026-08-03 (pt. 4) — Sponsor wall: real tiers off the live site, all 29 marks, all linked
- Wesley dropped the brand-asset zips (**Platinum / Gold / Tour Sponsors**) and then
  pointed at **ppatour.com/sponsors**, which is now the source of truth for tiers.
  **Every one of the 29 partners has a real mark and links to its own site** — the
  "10 partners render as a blue dash" gap from 8/1 is closed.
- **⚠ TIERS COME FROM THE LIVE PAGE, NOT THE ZIPS.** Building them off the folders was
  wrong four ways: there is **no Silver folder at all** (Hertz / PlaySight / Tixr), and the
  folders filed **Pickleball Central as Tour** (live: Gold), **Tixr + PlaySight as Tour**
  (live: Silver). Zips are authoritative for ARTWORK, the live page for TIER. New
  `PartnerTier` = title · platinum · gold · silver · tour · official, and
  `partnersByTier()` is the single ordering every surface reads — the old
  `tier === "official"` filters would have silently meant "Selkirk only".
- **The live page also fixed a duplicate I created**: `LT Pro 48` (Tour) and `Life Time`
  (Platinum, from the Platinum folder) are **one partner** — LT = Life Time, the ball is
  their product, and the live page lists a single "Lifetime — Official Ball" under Tour.
  Merged. ⚠ Which mark to show is still open; `life-time.webp` stays on disk.
- **It filled the nine missing designations** (Zimmer Biomet "Official MedTech and Joint
  Replacement Partner", DUPR "Official Rating", Black Clover "Official Apparel", Engine,
  Mineragua, O2, PlaySight, Pickleball Central "Official Store"). `role`/`category`/`note`
  are now **optional** — a partner with a mark but no confirmed designation gets a
  logo-only card (same treatment `hideRole` gives Veolia/Humana), never an invented one.
- **Five sponsors we didn't carry at all** added: PickleballTV (I'd wrongly excluded it as
  "our own property" — it's a Gold sponsor), Pickleball Tournaments, Just Courts, Hertz,
  Picklebalm. Their marks came from the live media library via new **URL support in
  `scripts/import-sponsor-logos.mjs`** — re-run that rather than hand-placing files.
- **⚠ THE REAL BUG THIS TURNED UP: a fabricated sponsorship on Worlds.** `EventSponsors`
  inferred an event's title sponsor by matching the event name against a partner's **first
  word**, so adding Pickleball Central made **"Pickleball World Championships" credit them
  as title partner**. Full-name matching doesn't fix it either (the Daytona stop reads
  "Proton", the partner is "Proton Sports"). Now a curated **`eventNamePrefix`** — unset
  means the partner never titles an event. Verified: 10 legitimate matches kept, Worlds 0.
- **Encoding is chosen per file, and this mattered.** A fixed webp encoder was *worse* than
  the source art (Ensure 24 KB → 71 KB). The importer now encodes 5 ways and ships the
  smallest, so **every refreshed mark is smaller than the file it replaced** (Carvana
  21.3→6.1 KB, JOOLA 17.4→6.9 KB). 30 assets, 384 KB. Extensions are mixed on purpose.
- **Links: all 29 outbound**, destinations taken from the live page's own hrefs (srsltid
  Google-click junk stripped), verified reachable with a browser UA — 27×200, Carvana +
  Tixr 403 which are the known bot-blocks from 7/29. `partnerLink()` moved to
  **`lib/partner-link.ts`**: it was private to PartnerWall, which is exactly why
  **/about/sponsors rendered 29 logos and not one was clickable**, title card included.
- **Footer = title + Platinum only** (Wesley) — 29 marks wrapping on all 1,174 pages gave a
  Tour Sponsor the same site-wide billing as Carvana. Now 9 + an "All Sponsors →" link,
  since the marks themselves now leave the site. ⚠ 9 tiles still wrap to 5 rows at 390px.
- **Selkirk removed** (Wesley, "for now"): absent from the live page in every tier AND from
  the zips. Two knock-ons handled — the Selkirk **case study** on /about/sponsors went with
  them (it claimed "Official Equipment Partner" on a page that no longer lists them), and
  ~15 athletes on Selkirk paddles **stopped showing "Official Partner of the PPA Tour"**,
  which is correct and happened for free because `athlete-gear` reads the live roster.
  Historical references left alone (past event names, paddle names) — those are facts.
- **⚠ STILL NEEDS A DECISION:**
  - **Fasenra vs AstraZeneca.** The live page lists **AstraZeneca (Official Partner)**, no
    Fasenra; the only art is the AstraZeneca corporate mark. Wesley's call was keep the
    name. Card reads AstraZeneca mark + "Official Asthma Partner"; link is fasenra.com
    where the live page uses astrazeneca.com. Fasenra presents Nationals in copy.
  - **Acrytech vs "Court Surfaces/Tennis Paint"** (live) vs **"AT Sports"** (the artwork) —
    three names, one partner. Our link stays acrytech.com (Conner verified 7/28).
  - **Two competing tier taxonomies on /about/sponsors**: the sales ladder ("Tier 01 Title
    → Tier 04 Official Partner") now sits directly above Platinum/Gold/Silver/Tour.
  - **JOOLA, Proton and Six Zero are all "Official Paddle Partner"** — three exclusive
    paddle partners is a contradiction, and the live page gives none of them a designation.
  - PBTV's mark is a **square lockup**, so height-capped it reads small beside wordmarks.
  - Only two case studies remain in a three-column grid; a third is a marketing claim.
- **Rankings pagination built, verified, then REVERTED** — 2,033 rows → 50/page took DOM
  18,646 → 1,292 and HTML 2.04 → 0.88 MB, but "all the way" was Connor's ruling. Asked
  Bryce + Tyler to confirm in #ppa-website-crew. Diff is parked, not committed.

### 2026-08-03 (pt. 3) — Cutover env vars ARE IN; /game rebuilt; canonicals added
- **⚠ THE SITE IS LIVE AND INDEXABLE AS OF TODAY.** Bryce set `NEXT_PUBLIC_SITE_URL` +
  `NEXT_PUBLIC_SITE_INDEXABLE` (Production scope, correct) and deployed. Verified: robots meta
  gone, `robots.txt` now `Allow: /`, sitemap on `www.ppatour.com`, **GA4 `G-NKVE1BRLK7` and the
  Meta Pixel both firing** (`gtag` and `fbq` both functions in-browser). **Launch moved to
  Tuesday night.**
- **Tyler was right that GA4 wasn't on the site, and it was my doing.** The env var existed for
  19 days; I gated the tag behind `SITE_INDEXABLE` on 8/1 to stop previews reporting into the
  production stream. It came on automatically with the cutover vars. **Worth saying out loud to
  the team — "not installed" and "held until launch" look identical from outside.**
- **⚠ NO CANONICAL TAGS EXISTED ANYWHERE.** Found while verifying the above, and it only became
  urgent *because* of the above: the site is indexable on `ppatour-website.vercel.app` while DNS
  still points ppatour.com at WordPress, so Google could index the staging hostname as the real
  one. Fixed with `alternates: { canonical: "./" }` on the root layout — relative, so Next
  resolves per-route against `metadataBase`, one line instead of 1,174 pages. **Verified live:
  every page now says `https://www.ppatour.com/<path>`.**
- **All 10 page-sitemap orphans are closed.** Six now go home (social-media-landing-page, vote,
  vote/thank-you, ppa-survey-ticket-giveaway, video-submission, welcome-email) per Bryce's call.
  ⚠ `video-submission` is retired "for now" — if the intake returns it wants a real page.
- **`/game` — PPA Pickleball Tour 2025 rebuilt, not redirected** (Bryce: "we want it, make it
  bigger and better"). **The old page never named the game, never gave a platform or date, and
  its four store buttons were bare `<img>` links with no alt text** — a product page with no way
  to buy it. Now: real labelled buttons in the hero AND at the foot, six features with the real
  in-game screenshots (rehosted to `public/ppa/game/`), cross-links into /events + /athletes.
  Legacy URL 301s in. All four storefronts verified 200 and added to `PARTNER_HOSTS`, links
  UTM-tagged `ppa-tour-2025-game`.
  - Steam `app/2574120` · PS `concept/10009246` · Xbox `9nfjp2z9x13k` · Switch `ppa-pickleball-tour-2025-switch`
  - **⚠ STILL NEEDED FROM BRYCE: price, release date, a trailer, and whether a 2026 edition is
    coming.** The page says "out now" because that is all the old one claimed. **No Dropbox mount
    exists on this machine** — assets need a shared link, same as the 5/22 photo drop.
- **Next:** GA4 service account is STILL the only thing blocking the Jackalope funnel · DNS
  Tuesday night · sponsor logos (draft sitting in Bryce's Gmail).

### 2026-08-03 (pt. 2) — ISR shipped: /rankings 34.8s -> 0.21s; Vacations front door
- **✅ ISR IS LIVE AND VERIFIED.** `/` `/rankings` `/events` `/athletes` all serve
  **`x-vercel-cache: HIT`**. `/rankings` TTFB **34.8s → 0.21s**.
- **⚠ THE REAL CAUSE, AND IT IS A TRAP WORTH REMEMBERING.** Adding `export const revalidate`
  fixed `/events` and `/athletes` but NOT `/` or `/rankings`. The Vercel build log settled it:
  **both build `○` locally and `ƒ` in production.** The difference is `PB_API_TOKEN` — with a
  token the rankings fetch actually runs, and **`lib/pb-fetch` retries a 429 with
  `cache: "no-store"`**, which opts the whole route out of static generation. partner_rankings
  rate-limits under build load (that retry is why the 7/31 caching work exists), so **whether the
  homepage was CDN-cacheable came down to whether upstream throttled us mid-build.** It had been
  losing. Fixed with `export const dynamic = "force-static"` on both — neither page reads cookies,
  headers or searchParams, so nothing is lost. **Never trust a local `○` for a page that fetches.**
- **`/watch` stays dynamic on purpose.** Its LiveScores boundary server-prefetches the ticker with
  `no-store`. Caching that for 60s would put a stale score on the page whose job is live scores.
  Dropping the prefetch would make it static (the component already polls CDN-cached
  `/api/ticker`) but that is a live-scores decision, not a cleanup. Documented in the file.
- **`/news` gets no ISR** — it reads `searchParams`, so it is dynamic regardless and a revalidate
  export there would be a comment that lies.
- **`/tour/travel` is now the Pickleball Vacations front door.** That trip is **0 of 20 rooms
  against $102k** and the travel page was generic hotel copy that never mentioned it. Now leads
  with Club Med Turkoise, Dec 8-12, clinics, ten courts, all-inclusive, then hands off.
  **Deliberately NOT a port** — Vacations is its own Stripe checkout with a Jackalope room block,
  and this site's rule is commerce redirects out. **No price quoted**, it lives in that project's
  `pricing.ts`. CTA + nav link are UTM-tagged and both hostnames added to `PARTNER_HOSTS`, so the
  handoff fires `partner_click`. ⚠ Update the trip facts here when the trip rolls over.
- **Drafted the sponsor-logo ask to Patrick Sorensen** (`p.sorensen@ppatour.com`, cc jacob@ +
  b.jones@) as a continuation of Connor's 7/29 sponsors-page review thread. **In drafts, not sent.**
- **Next:** Bryce to grant the GA4 service account (Editor if he wants key events set by API,
  Viewer is enough for reporting) · cutover env vars · the 6 remaining orphan URLs.

### 2026-08-03 — Rankings hero rebalanced; legacy-sitemap orphans; Semrush baseline
- **Rankings hero is two columns now** (`2ee9ef5`). Bryce: "balanced better up top… highlight the
  breakout… use space better." The mark + copy ran down the left half and left the right half
  empty, while the **50/35/15 split — the thing that explains what the ranking IS — sat underneath
  as three bullets.** Copy left, weighting as a figure right.
- **The figure is ONE horizontal stacked bar, not three meters** — these are parts of a single
  composite score and three bars wouldn't say that. **Segment width IS the weight**, no
  exaggerated scale, so singles reads as the sliver it is. Verified in the DOM: segments render at
  exactly 50/35/15 of drawn width.
- **⚠ Palette was computed, not chosen.** `ppa-blue-deep → ppa-blue → ppa-sky`, single-hue ramp,
  heaviest darkest. All six checks pass on ppa-paper (worst adjacent ΔE 15.7 protan / 15.4 normal).
  **Two brand colours were rejected by the validator, not by taste: `ppa-navy` fails the lightness
  band (0.28) and chroma floor; `ppa-yellow` fails contrast at 1.21:1.** `ppa-sky` carries a
  contrast WARN (1.89) which *obliges* the direct labels — **keep them if you restyle this.**
- **⚠ The window-resize trap bit again** — `resize_window` reports success but the screenshot
  viewport is decoupled from it, so mobile was verified as a **measured DOM test** (figure + every
  row fit 358px, zero overflow), not a screenshot. Same lesson as 7/31 pt. 5.
- **Legacy sitemap crawl** (`ea1f...`): post 812/812, ppa-blog 40/40, athlete 218/218, tournament
  178/178 all resolve — that coverage is what protects the evergreen rankings. **But 10 of 37
  `page-sitemap` URLs 404 here and all 10 are live 200s on ppatour.com today.** Redirected the
  three obvious ones; **seven need a human and are listed in `docs/LAUNCH.md`.**
  - **⚠ `/social-media-landing-page/` is the urgent one — if that's the live link-in-bio, every
    social profile breaks on launch day.** `/vote/` is a Carvana-named award campaign; picking a
    destination for a sponsor's page isn't ours to make.
- **Semrush baseline recorded in LAUNCH.md.** Site Health 81% (+4%) but broken pages **16 (+15)**
  and errors **53 (+24)**. **⚠ The audit is capped at 100 crawled pages on an 812-post site — that
  score is a ~12% sample, not whole-site health.** Position Tracking has ppatour.com **#1 for
  "when was pickleball invented" (6,600/mo)** and #1 for "dallas pickleball tournament".
- **Pickleball Vacations: recommended NOT porting it.** It's a live Stripe checkout with room
  inventory read from Jackalope, and the site's founding rule is content/discovery only —
  commerce redirects out. It's already linked in the Events panel (`vacations.ppatour.com`, 200).
  **The real find: that trip is 0 of 20 rooms, $0 against $102k, and `/tour/travel` is generic
  hotel-partner copy that never mentions it.** Proposed making `/tour/travel` its front door with
  a tracked outbound link. **Awaiting Bryce.**
- **⚠ STILL UNSTARTED, biggest Wednesday risk: ISR.** `/rankings` served in **34.8s** on one pull
  and every live-data page returns `no-store` + `x-vercel-cache: MISS` — no page-level
  `revalidate` export anywhere, so each hit re-renders 2,033 rows at the origin. ~4 lines.

### 2026-08-01 — Launch audit: /rankings weight, bio scrape artifacts, analytics leak
- **Audited the site as a fan, two days out from the Aug 5 launch.** Six findings; four are
  fixed and pushed (`36cf945`, `7ea2ef0`), two need a person.
- **⚠ /rankings was a 3.96 MB HTML document** — 2,556 images, DOMContentLoaded **14.0s**. It
  renders the COMPLETE boards (Connor: "all the way"), so per-row markup IS the page. Three
  fixes, zero visual change: avatars used `fill`+`sizes` (8 srcset candidates per image, 26%
  of the document) → `width`/`height` gives 1x/2x; **the flag `<img>` had no `loading` attr so
  ~2,000 circle-flag SVGs were fetched eagerly on first paint — that was the 14s**; row class
  string + `grid-template-columns` were repeated 2,033× → hoisted to `.wpr-row` + a single
  `--wpr-cols` custom property, plus `content-visibility:auto`.
  **Measured on production: 3.96 → 2.04 MB (48%), DCL 14.0s → 5.3s, image requests 2,556 → 6.**
- **⚠ Still 18,646 DOM nodes and 5.3s.** The rest is inherent to 2,033 rows — the structural
  call (paginate, or top-N + "show all") is Connor's, since "all the way" was his ruling.
- **Bio cleaner missed two scrape artifacts that reached published pages.** "Frequently Asked
  Questions" is now a STOP header — 13 pages ended with *"Frequently Asked Questions About Kate
  Fahey Is Kate Fahey on the PPA Tour? Yes, ..."*, and **Kate Fahey is the reigning women's
  singles champ, linked from the homepage**. "Major League Pickleball" is a header on ben-johns
  and **ordinary prose in 86 other bios**, so it needs a sentence-boundary guard — `PLAIN_HEADERS`
  deliberately excludes the boundary set; listing it in both splits those 86 mid-sentence
  (I did exactly that once, caught it in verification).
  Verified across all 180: 0 non-200, all four artifacts 0/180, **every remaining paragraph is a
  subset of the old text** (nothing invented), 38 pages shorter, 10,724 chars of boilerplate gone.
- **⚠ MEASUREMENT LEAK — every preview/staging deploy was firing the production GA4 stream
  (G-NKVE1BRLK7) and the production Meta Pixel.** The components only checked "is the ID set",
  and it's set project-wide. Months of QA clicks and crawls landed in the property the business
  reads. Both now gate on `ANALYTICS_ENABLED` (`lib/analytics.ts` → `NEXT_PUBLIC_SITE_INDEXABLE`),
  which is already step 1 of the cutover runbook.
- **Ported the tags the old site runs via GTM-KG5F7W6 that this rebuild never carried**: 2nd GA4
  property `G-VFNFRP66Z5`, TikTok `D41T2AJC77U69K483TK0`, Clarity `vx8dxhws9k`, Hotjar `3598441`.
  All ship **dark** — env + production + consent gated; IDs live in `docs/LAUNCH.md`, not in code.
  **⚠ UserWay (accessibility widget, `YBUtdPKa3d`) is on ppatour.com and is NOT ported** — that
  changes our accessibility posture at cutover and needs a decision, not an omission.
- **Vercel Web Analytics + Speed Insights** added (Bryce enabled the project). Deliberately
  outside the consent banner and the production gate — both cookieless. Speed Insights is the
  one that matters: real-user Core Web Vitals per route, which GA4 can't report and which
  /rankings and open issue #17 (mobile LCP 5.0s) need measured.
- **/live** was rendering "LIVE NOW · MATCHES IN PROGRESS" + a WATCH LIVE button for an event
  that ended **May 3**. `noindex` keeps it out of search, not out of the address bar. Now
  redirects to /watch unless its event is genuinely running.
- **Watch "As Seen On"** was a hard 5-col grid; withholding unconfirmed ESPN/NBC left 3 logos
  and a dead grey block. Column count now follows the confirmed marks.
- **⚠ NEEDS A PERSON, not code:**
  - **10 of 17 partners have no logo** (Rate, Fasenra, Holland America, Joma, LT Pro 48, Park
    Place, Selkirk, Reign Storm, Tixr, Acrytech) — they render as a blue dash + typed name.
    **Fasenra presents the National Championships.** Sponsors will open this page Wednesday.
  - **ben-johns reads 188 career titles in the stat rail and "123+ PPA Tour titles" in the bio**
    (and 36 singles + 41 doubles = 77). Different scopes, probably — but it reads as a
    contradiction on the most-visited profile.
- **⚠ THE BIG ONE FOR JACKALOPE: the website does not speak the event-code spine.** Jackalope's
  `api/marketing/spend-by-event.js` and `lib/ga4.js` both join marketing data to events by
  parsing **`MMYY-SERIES-CITY`** out of campaign names. The site's `lib/utm.ts` emits page-type
  labels instead — `utm_campaign=event|watch|rankings|sitewide`. So **every Buy-Tickets click
  from launch week lands in GA4 unattributable to any event, and UTMs cannot be backfilled.**
  Fixing `withUtm()` to carry the canonical code is the whole tie-in. Bryce's call on whether
  it goes in before Wednesday.
- **✅ EVENT-CODE UTMs SHIPPED (`afd6f88`)** — Bryce called it for before Wednesday. New
  `lib/event-code.ts` derives the canonical **`MMYY-PPA-CITY-ST-USA`** code (validated against
  all 35 dated US PPA rows in Jackalope's `lib/spine-match.js` — 35/35, 0 mismatches), and it's
  a derived `Tournament.eventCode` set in BOTH builders so the curated and API paths can't drift.
  23 `withUtm` call sites moved off `t.slug`; `TicketGrid`'s `slug` prop became `campaign`; new
  `withCampaign()` stamps the code onto module-level partner links (PBTV) that can't know which
  event page they're on. **Verified live: every event-linked outbound click carries
  `0926-PPA-CARY-NC-USA`, zero `utm_campaign=event` left.**
  - **⚠ SERIES is the tour brand `PPA`, never the tier** (Bryce corrected my first draft, which
    used MAJOR). Every stop is PPA whether it's a Major, a Cup or a 125.
  - **⚠ MMYY is the END date.** Atlanta runs Apr 27 – May 3 and codes `0526`, not `0426`.
    Parsed as text so no timezone can roll the month.
  - **⚠ The spine has NO international PPA codes.** Melbourne derives `0726-PPA-MELBOURNE-AUS`
    and won't match a spine event — it lands in the untagged-spend bucket `spend-by-event.js`
    already surfaces. Correct failure mode (visible, fixable) but **someone should add the
    international stops to the spine.**
- **✅ BIO PASSTHROUGH SHIPPED (`67d71a6`)** — the bios were scraped once and froze; the stat rail
  above them is live, so the same screen disagreed with itself. **Ben Johns read "188 Career
  Titles" over "123+ PPA Tour titles … As of 2024"; Anna Leigh Waters read 181 against a live 196.**
  `lib/bio-live.ts` substitutes the live medals figure wherever the prose states a career total.
  **It is a REPLACER, never a writer** — only rewrites digits already in the sentence, needs a live
  value to fire, and no-ops entirely when stats are unavailable, so an API outage returns the prose
  untouched rather than blank. Also applied to the JSON-LD description (structured data Google
  reads must not contradict the page).
  - **⚠ "Titles" means two different things in these bios and only one tracks the API.** Three traps,
    all found by dry-running the roster, all now guarded: **STREAK** ("16 consecutive mixed doubles
    titles"), **PAREN** ("(31 titles together)"), **SCOPED** ("won 3 gold medals with Andrei").
  - **⚠ The SCOPED guard silently did nothing at first** — a trailing `\b` after `with\s+[A-Z]` can
    never match, because the capital is followed by a lowercase letter. Pesa Teoni's single-event
    result was being rewritten into a career total. **Put the boundary on each alternative.**
  - **⚠ The streak guard window is 30 chars BEFORE only.** A ±60 window let a "consecutive" from a
    later clause suppress a valid substitution two clauses earlier — these bios are run-ons.
  - Final dry run over all 180: **9 substitutions, all genuine career totals on 2 athletes;
    2 correctly skipped.** Verified live: Johns' prose now reads 188 / 42 singles / 65 doubles
    (42+65+81 = 188, matching the rail); ALW reads 196.
  - **Ben Johns' career section was a bulleted list flattened into one unreadable run-on.**
    Repunctuated into sentences — **number sets verified byte-identical before and after**, and the
    digits are deliberately left as scraped so the passthrough still updates them at render.
- **Jackalope marketing analytics — Bryce wants all four: per-event funnel, GA4 on first,
  forecasting, launch-day live board.** Plumbing already exists (`api/marketing/ga4.js`,
  `spend-by-event.js`, `pulse.js`, `api/reach/aggregate.js`) and all of it joins on the event
  code, which the website now emits. **⚠ BLOCKED: `GA4_SA_KEY` is unset, so `api/marketing/ga4.js`
  returns `configured:false`** — a GA4 service-account key plus Viewer on properties 358407319
  (PPA - GA4) and the second property behind `G-VFNFRP66Z5`. Nothing website-side reaches
  Jackalope until that lands. Funnel + live board are next once it does; forecasting needs a
  couple of completed events of history first.
- **Next:** set `GA4_SA_KEY` in Jackalope — `api/marketing/ga4.js` is
  built but returns `configured:false` · sponsor logos · the /rankings pagination call.

### 2026-07-31 (pt. 6) — Be the Best in the footer, the WPR mark on Rankings
- **Two real brand packs landed** (Bryce, via Dropbox) and are now on the site. Both were converted from
  Illustrator to **true vector SVG** and are hosted in Jackalope under `/brand-assets/marks/` as the
  single source; the copies here in `public/ppa/logos/` are the site's cut of that same art.
- **Be the Best is the footer sign-off** — Jeff Watson asked for it "semi front-and-center," so it sits
  directly under the tour logo at `h-11 → h-20`, the first thing you meet entering the footer.
  **The reversed two-colour lockup is the right one for a navy field**: white letters, yellow pickleball
  as the full stop. That ball *is* the mark — the flat all-white variant exists for single-colour print
  and must not be used here. Tour logo dropped a step (`h-8 → h-7 sm:h-8`) so the two don't compete.
- **The WPR wordmark replaces the Rankings `<h1>` text.** ⚠ **The `<h1>` stays in the DOM as `sr-only`**
  — swapping a heading for an image must not cost the heading, and Rankings is a page people search for
  by name.
- **⚠ AND IT USES BOTH MARKS, WHICH IS THE POINT OF SHIPPING A SYSTEM.** The horizontal wordmark is
  **17:1** — at 390px it would render ~19px tall and stop being readable. So `< sm` renders the **stacked
  combo mark** (182×80) and `≥ sm` renders the horizontal (746×44). Scaling one mark past its floor is
  the failure the combo mark was drawn to prevent.
- **Be the Best also closes the Rankings page** (Bryce: put it "by the rankings stuff as well"). It sits
  under the standings, not above them — this is the one page where the tagline is a statement of fact
  rather than a slogan, and the board is the answer to it. Marked `aria-hidden`: the footer already
  carries it, and reading "Be the Best" aloud twice per visit is noise.
- **Verified by rendering, not just building:** clean `tsc` + `next build`, then drove the real prod
  server at **1440px and 390px** — every mark resolves, correct mark visible at each breakpoint, `<h1>`
  text intact, **zero horizontal overflow, zero HTTP ≥400**.
- **Next:** the WPR icon is the avatar/profile-slot mark and nothing uses it yet — athlete cards and the
  leaderboard are the natural homes · ⚠ the WPR icon ships a **different navy** (`#00335B`) to the rest
  of its own system (`#0C2844`), so don't place it beside the wordmark until somebody settles that.

### 2026-07-31 (pt. 5) — The five callouts were 2,438px on a phone; now a swipe rail
- Wesley: the Watch/Tickets/Follow/Play/Sponsor band "takes way too much space on
  mobile." It had **no mobile layout at all** — `grid sm:grid-cols-2 lg:grid-cols-5`,
  so below 640px it stacked one full-width `aspect-[4/5]` card per row. **Measured 2,438px
  on a 390px phone (~3.5 screens)**, the tallest thing on the homepage, walling the hero
  off from the rankings and newsroom.
- Built three options against the real component/photos and screenshotted each at a true
  390px viewport: 2-up grid (405px), **swipe rail (331px)**, compact rows (400px).
  Wesley picked the rail. **2,438 → 331px, −86%.** Desktop is untouched — verified the
  band still renders five-across at exactly 368px at 1280px.
- Cards sit at **68vw so the next one always peeks** — that peek is the only affordance
  saying "swipe," so don't widen it to 100vw. Scrollbar-hiding utilities copied from the
  house rail pattern (`EventGallery` / `PickleballIn90` / `ScoreRail`).
- **⚠ The real bug this turned up: `data-reveal` per card is broken inside a horizontal
  rail.** A card parked off-screen to the side never intersects, so it sits at
  `opacity: 0` — and a **fast fling carries it from off-right to off-left without ever
  intersecting, leaving a permanently blank card**. Reproduced it: after flinging to the
  end, cards 4 and 5 revealed but **"Follow" stayed at opacity 0**.
  - Fix is a new **`data-reveal-group`** in `globals.css`: the *parent* is the observer
    target (it always intersects vertically, whatever the rail's scroll position) and the
    children stagger off it via their own `--reveal-delay`. Stagger is preserved exactly —
    verified 0/70/140/210/280ms on both mobile and desktop.
  - **Use `data-reveal-group` for any future horizontal rail**, not per-child `data-reveal`.
- Verified on a local **production** build, not dev: section 331px, `isRail` true
  (scrollWidth 1326 vs viewport 390), 5 cards at 265px, all five opacity 1 before *and*
  after a full fling, and **`pageOverflows: false`** — the rail doesn't leak horizontal
  scroll to the page. Typecheck + lint clean, build 1174 pages.
- **Method note — headless Chrome lies about mobile width on Windows.** `--window-size=390`
  floors the *layout* viewport near 500px, so the first screenshots rendered the cards
  625px tall (not 488px) while the PNG was still 390px wide. Use CDP
  `Emulation.setDeviceMetricsOverride` for any mobile measurement; `--window-size` alone is
  not trustworthy. Also: `overflow-x: hidden` on `body` makes body the scroll container, so
  `documentElement.scrollHeight` collapses to the viewport height — measure
  `body.scrollHeight` too.

### 2026-07-31 (pt. 4) — Tickets held back by hand: Cincinnati + Cape Coral 2027
- Wesley: hide tickets on **Cincinnati Open (12–18 Apr 2027)** and **Cape Coral Open
  (1–7 Feb 2027)** "until we turn it back on". Both are genuinely listed and on sale on
  Tixr at $25, so this is an **editorial switch, not a fact about the listing** — which is
  why it is `TICKETS_HIDDEN` in `lib/tixr-price-index.ts` and **not** an edit to the
  snapshot JSON: `scripts/sync-tixr-prices.mjs` recomputes `onSale` from the live feed
  every morning and would have silently put the tickets back. Dropping the `ticketsUrl`
  mapping would also work but `npm run tixr:audit` would then flag them as unlinked live
  listings, and we'd lose the ids needed to switch back on.
- **To re-enable: delete the event's line from `TICKETS_HIDDEN`.** That's the whole
  operation — price, link and copy return together on every surface.
- Keyed by **Tixr event id** (181370, 196548) and gated in the two modules everything else
  funnels through, so no call site changed: the client-safe index (`ticketPriceFrom` /
  `ticketsOnSale`) and, server-side, `ticketTiersFor` — gating that one kills the tier grid,
  `ticketPriceFrom`, `admissionTiersFor` and `ticketsOnSale` together, since all derive
  from it. Verified all four gates false, 0 tiers, and the 12 genuinely on-sale events
  untouched. Rendered pages: **4× "Tickets Coming Soon", zero price strings.**
- **Three ungated leaks found while verifying — all pre-existing drift from `2bf593e`,
  which gated the visible UI only.** The first two published ticket info for these two
  events (and for the ten 2027 stops hidden on 7/31 pt.1) despite their pages correctly
  reading "Tickets Coming Soon":
  - **JSON-LD `offers` (worst one)** — `app/events/[year]/[slug]/page.tsx` emitted
    `price: t.ticketPriceFrom` as a `schema.org/InStock` Offer with the Tixr URL. That
    price is the **tier-table fallback**, so we were feeding Google a **$39 buyable offer
    for an event whose real Tixr price is $25 and which we aren't selling**. Now the whole
    `offers` block is omitted unless `onSale`.
  - **EventConcierge** — the chatbot answered "Tickets start at $39… [Buy tickets]" off the
    same fallback. `ticketFrom`/`ticketsUrl` are now `number | null` / `string | null` with
    a coming-soon answer.
  - **Header "Next Event" panel** — `meta={`Tickets from $${next.ticketPriceFrom}`}`
    ungated. Not firing for these two (they're months from being "next") but it would have,
    and it fires for whichever hidden 2027 stop reaches the front of the calendar first.
- **⚠ Still ungated, deliberately left: `components/events/NationalsLive.tsx`** has **zero
  `onSale` references** — its hero prints "Buy Tickets — from $X" unconditionally in both
  branches. Harmless today because it only serves the Nationals `-live` route and Nationals
  is on sale, so it publishes nothing wrong. But it is exactly the silent drift CLAUDE.md
  warns about on that file, and it will publish a fabricated price the moment that route
  points at an unlisted event. Worth mirroring the gate.
- ⚠ Typecheck + lint clean on every changed file, and the full build passed **before** the
  JSON-LD/concierge edits (the confirming rebuild was cancelled). **Re-run `npm run build`
  before deploying** to re-verify the rendered output.

### 2026-07-31 (pt. 3) — Rate-limited on `partner_rankings`: caching every API call
- We were throttled on `/v2/data/partner_rankings`. Root cause was **`lib/rankings-api.ts`
  — the one `partner_rankings` caller still on a bare `fetch`**. Every other consumer
  (`division-rankings.ts`) already went through `pbGetJson`; this one had `revalidate` but
  **no retry, no cache tag, and four different `page_size` values (25/50/100/150) for the
  same two boards** — so eight cache entries, eight cold-start requests, and a single 429
  went straight to an "unavailable" rankings page with no retry.
- **Everything now reads through one `boardPage(gender, page)`** with three layers:
  `pbGetJson` (429 backoff) → Data Cache 24h tagged `ATHLETES_CACHE_TAG` (the existing
  daily cron already refreshes it) → **module memo + in-flight map**, which is the part the
  Data Cache can't do: it collapses the parallel page renders of one build into a single
  upstream call while the cache is still cold. **One page size (250)** for all of them.
- **Measured, same workload (240 page loads, cold cache): 684 → 4 upstream requests;
  20 → 4 distinct cache entries.** `getRankingBySlug` was the sleeper — every one of the
  ~150 news article pages calls it, and it made its own two requests. It now costs nothing.
- `getRankingPage` (/leaderboards) **slices the shared 250-row page** instead of asking
  upstream for 50 — paging costs no upstream calls within a block of five display pages.
  250 is deliberately a multiple of `FULL_PAGE_SIZE` so a display page never straddles two.
- **The four client-polled proxies were all `Cache-Control: no-store`** — the site-wide
  ScoreTicker polls `/api/ticker` every 15s from every open tab, so N visitors meant N
  origin hits, each possibly on a cold instance with an empty in-process cache. Now
  `s-maxage` + `stale-while-revalidate` so the CDN absorbs the polls: ticker 10s, brackets
  15s, scores 30s (each under its poll interval, so live data stays live), athlete-videos
  1h (finished tournaments don't change). **Upstream call rate is now flat in traffic.**
  Error responses stay `no-store` so a transient failure isn't pinned at the edge.
- `lib/event-field.ts` was cached but **untagged** — unreachable by any cron, and it fans
  out one request per pro division per event page. Tagged `TOURNAMENT_DETAILS_CACHE_TAG`.
- Left `no-store` **deliberately**: the 5 live-data fetchers in `ticker-api`/`scores-api`/
  `brackets-api` (they have 5–60s module caches + request coalescing, and their routes are
  now CDN-cached in front), and every POST write path (customerio, google-sheet, the form
  routes) — caching those would be a bug.
- Build clean, 1174 pages. Static generation **116s → 49s** as a side effect.
- **⚠ Attribution:** a parallel `git commit -a` (`0b36eca`, "Add a Tixr mapping audit")
  swept these changes into its commit. The code is right and in main-line history, but that
  message doesn't describe it. Only `lib/event-field.ts` is still uncommitted.
### 2026-07-31 (pt. 2) — Event page: one calendar block, two-column Watch (`e532c4f`)
- Bryce on the Nationals page: put Amateur & Junior Play in the same calendar
  block as Pro Play, on the real days; and make Watch two columns with the
  channels down the right.
- **Order of Play is one table now.** New `ProDay.amateur[]` renders an
  **Amateur & Junior Play** column beside Pro Play. Amateur skill/age brackets
  sit on all seven days; **PPA Tour Camp on Aug 31 & Sep 1, 4–7 PM**. That's two
  of the four old rows absorbed, which was the point. Below `lg` the column
  folds under Pro Play (5-col → 3-col) rather than squeezing.
- **Junior PPA, Senior Open and MoneyBall are still undated.** Re-pulled
  `pickleballtournaments.com/tournaments/ppa-tour-veolia-ppa-national-championships`
  today — the pro block is there, the amateur day assignments are **still TBD**,
  same wall as 7/16. They render in a small "Day still to be announced" strip;
  move each onto its `ProDay` the moment the days publish (after the Aug 24
  registration deadline). **Bryce is sending a PT link** — if it's a different
  page than the one above, it may have the real days.
- **Watch is two columns**: rounds (what's on + where to watch) left, channels
  stacked right in **PBTV → Tennis Channel → MATCHDAY** order. `HOW_TO_WATCH`
  was already in that order, so it was purely layout.
- **Fixed stale copy in both files**: "Follow all four days live — free on
  YouTube" on a seven-day event, months after YouTube stopped being the play.
  Now points at PickleballTV.
- Both the main event page and the `-live` variant (`NationalsLive.tsx`) carry
  every change — they render the same schedule data and drift silently.

### 2026-07-31 — Connor's /events restructure: Other Events out, points filter in (`1cb467d`)
- Connor's website-update note: keep **Next Six on Tour** (1,000+), **kill the
  "Other Events" under-1,000 section**, put everything including the 500s into
  **Find an Event** and sort there, and cut the region list to **USA, Asia,
  Australia, Europe, Canada — in that order**. All four shipped, pushed to main.
- `ChallengerStrip.tsx` **deleted**; `/events` is now Next Six → Find an Event.
- **Points filter is always visible and goes all the way down**: Major 2,000+ /
  Cup 1,500 / Open 1,000 / 500 / 250 / 125. It used to be Major/Cup/Open and
  only appeared when Type was "The Tour", which is why the sub-1,000 stops were
  unreachable by filter and needed their own band.
- **New `Tournament.points`** — the flat `challenger` tier reads 500 for
  *everything* under 1,000, so a 125 was badged "Challenger · 500" and the new
  filter would have been a lie. `pointsFromName()` (split out of `tierFromName`)
  now sets the real level on sub-1,000 stops in BOTH the curated builder and the
  API mapper; `tierPoints()` prefers it. Verified against the curated list:
  28 sub-1,000 events → 13× 500, 6× 250, 9× 125.
- **Italy and Spain rolled up into Europe** (`Tournament.country` union +
  `COUNTRY_BY_CODE`). Added the rest of the European ISO codes while in there so
  a French or Portuguese stop lands in Europe without a code change. Card chips
  now read "Europe" — consistent with Asia/Australia, which were already regions
  under a "Country" label. Filter label is now **Regions**, not Countries.
- Verified on a local prod build: 0 "Other Events" strings, the three dropdowns
  render Connor's exact lists, cards badge "Challenger · 250" / "Challenger ·
  500" honestly, 51 upcoming events in the finder.
- Rebased onto Wesley/Tyler's `tierBadgeClass` commit (`c5fdde2`) — clean.

### 2026-07-29 (pt. 3) — Full link crawl of the live site: 2 real hotel breaks
- Crawled all **256 sitemap routes** live: every page 200s, **0 broken internal links**
  across 265 internal hrefs. The 7/28 "28 → 0" result holds and this session's changes
  didn't regress it. Crawler saved at `scratchpad/crawl.mjs` if it's worth committing.
- 135 external non-200s, but **almost all are bot-blocks, not breaks** — tixr, Carvana,
  Hilton, Best Western and IHG all 403 automated HEAD/GET. Confirmed by control: the
  known-good tixr group page 403s too. `pickleballtournaments.com` ETIMEDOUTs were my
  own crawl concurrency; it's 200 on a single request. **Don't chase these.**
- **Two real findings, both hotels, both previously flagged "needs Kristen" on 7/16:**
  - **Chicago Holiday Inn Express Prospect Heights — genuine 404** (verified with a
    browser UA, so not the 403 bot-block). Its `qSlH=CHIAM` hotel code isn't Prospect
    Heights and the URL form differs from every other IHG link in the file. **href
    removed** — the row degrades to name + address + rate with no Book button, which
    beats a dead page. Not guessing a hotel code: wrong hotel is worse than no link.
    **Still needs the real link from Kristen.**
  - **Hampton Inn Farmers Branch — good, and now durable.** The `links.h6.hilton.com`
    email-tracking URL resolves 200 to a canonical `attend-my-event` page; swapped the
    canonical in, since tracking redirects expire. Closes that 7/16 flag.
- Method note for next time: verify a suspected broken external link **individually with
  a browser User-Agent** before acting. A concurrent crawl produces mostly false
  positives on travel/commerce domains.

### 2026-07-29 (pt. 2) — Bryce's rulings: Opens, Worlds, ad inventory
- Three of the six open audit-thread decisions are now closed. See **Standing rulings**
  above — Opens 1,000, Worlds is the biggest Major, ad inventory dropped.
- Only code change needed was the Worlds one: `/about/pro-tour` tier table restructured
  (Major 2,000–3,000 leads, with **Championship as its own row** because the PPA Finals
  is a 2,000-pt stop that is deliberately *not* one of the four Majors — the old note
  wrongly listed it as one), `lib/tv-schedule.ts` Worlds row → "Major · 3,000", and the
  "Worlds, majors, cups, opens" pattern in pro-tour / player-handbook / PickleballIn90
  drops the redundant "Worlds".
- Opens needed no change — 1,000 was already live and correct.
- **Left alone deliberately**: `lib/news-articles.ts` states the ladder as "Worlds
  (3,000), Slams (2,000)…" in two articles. That's Dylan's editorial copy under the
  content-approval gate, and the points are factually right; flag it to him rather than
  editing published articles.
- **Still open from the six**: news home (ppatour.com vs pickleball.com), MLP's total
  absence from the site, whether to make a statement above the fold, and whether Buy
  Tickets is really the first callout.

### 2026-07-29 — Connor's morning texts: fake 1,000s, Dink, paddles, About (`c09760e`)
- Worked Connor's 7/29 iMessage list (plus his 7/28 Watch note). Pushed to main.
- **The fake 1,000-point events — root cause found.** `inferTier()` in
  `lib/events-api.ts` defaulted every unrecognized event to `open` = 1,000 pts, so
  one-day MLP qualifiers at Australian clubs sat in the "1,000+ Points / Next Six on
  Tour" band. Now qualifier/league/junior/senior/camp names **and any event under
  three days** drop to `challenger` → Other Events. Verifying against the live feed
  turned up two more: **"PPA125 - GOLD COAST"** read as 1,000 because
  `tierFromName`'s `\b` never matches inside "PPA125" (regex now `(?:\b|PPA)P?…`),
  and **"PPA Spain: Template"** was rendering as a live tour stop (now junk-filtered
  with `/template|test event|TBD/`).
- **"The Dink Minor League" — four events dropped from the feed entirely**
  (`NON_TOUR_NAME` in `isJunk`). Third-party minor league on the same tournament
  platform, not ours to promote.
- **Australian names cleaned**: trailing `@ Venue` and the leading region word come
  off in `cleanTitle` — the venue field and country chip already say both.
- **Player profiles → Pickleball Central, never the manufacturer.** Ben Johns' paddle
  was going to joola.com. The "Shop JOOLA" button is gone; "Buy This Paddle" → PBC.
  Partner still *named* on the card; `GearLink.brandHref` retains the store URL so
  restoring the button is one line if Connor reverses it.
- **About page stat band deleted** (his "can't show that prize money number and those
  stats") — 25 stops / $5.2M / 12 countries / 150K fans. Same on `/about/pro-tour`,
  replaced with structural facts (20 stops / 5 divisions / 4 majors / 1,000+ pts).
  While in there: copy still credited the **Toys "R" Us** PPA Finals and claimed
  FOX/FS1/YouTube carry every match; **stop count was 25 in five places and 18 in
  four** — it's **20**, normalized sitewide off `getMainTourEvents()`.
- **Watch page rebuilt to his 7/28 spec**: real network marks (CBS/FOX/ESPN/NBC/Tennis
  Channel) on white tiles five-across — white because network logos are colour-locked
  and a knocked-out version isn't ours to make — then the **PickleballTV banner
  directly under the big five**, then where-to-watch. SVGs in `public/ppa/networks/`.
- **⚠ ESPN + NBC still unconfirmed** in any broadcast sheet we hold. That mattered less
  when we typed the names in Gotham; we now publish their actual trademarks. Adam
  Friedman needs to confirm — deleting a row in `AS_SEEN_ON` is the whole fix.
- **Not done, needs Bryce**: the header ("too many chiefs", "should look electric") —
  that's his own redesign call, not a spec I could execute. Also his own ask to put
  **staff photos on the site** (searchable) has no owner or asset source yet.
- Gotcha for next session: `next start` serves `public/` from a **boot-time** manifest,
  and a stale server on :3000 will silently 404 newly added assets. `lsof -ti:3000 |
  xargs kill -9` before trusting a local verify.

### 2026-07-28 (pt. 2) — Hannah's audit round (`d991e03`)
- Hannah Johns sent 18 items to the audit thread after the first pass shipped. Ten are live.
- **Homepage order flips off-season**: the World Pickleball Rankings board takes the block
  under the callouts, Latest Champions drops below it (her read: people come for rankings and
  player profiles). `scoresSection` / `rankingsSection` are now consts in `HomeContent` and the
  order is conditional — **live events still lead with the scores rail**.
- **Hero right half lightened**: new `.scrim-hero-left` masks the vertical scrim away toward the
  right above `lg`, so the space freed by removing the crest shows the venue instead of dead
  navy. Below `lg` the full scrim stays (headline spans the width).
- **All medal language gone** (her "doing away with medal terminology across the board"): rank
  chips lost gold/silver/bronze for a top-five treatment in tour yellow; player pages read
  Titles / Finals / Semifinals; "Career Gold" → "Career Titles".
- **Footer social icons in brand colors**, Instagram via a real `linearGradient` def.
- **History timeline was wrong and is now right** — we had founding 2018 and Carvana 2020.
  Corrected off her Pickleball Central timeline doc: 2019 founding, Mesa 2020, player contracts
  2021, Dundon + first CBS broadcast 2022, Dallas + Carvana 2023, merger 2024, global 2025.
- **How It Works said six divisions and split mixed by gender** — it's five. Fixed there (event
  pages already had it right).
- Rankings page gains an **Event-Specific Standings** link to pickleball.com (her SEO point);
  player profile headings use the **full name**; event pages get **See All Pros Competing**;
  "The Current No. 1's" takes her apostrophe.
- **⚠ NOT changed, needs a ruling**: she says Opens 500 / Cups 1500 / Majors 2000. The live tier
  system is Opens 1000 / Cups 1500 / Championship 2000 / Worlds 3000, and Connor's 7/23 spec
  ("The Tour = 1,000+ points") is baked into `getMainTourEvents()`, the events buckets and copy
  in ~10 places. If Opens are really 500 the whole Tour bucket needs rethinking. Asked Connor.
- **Blocked on data, not design** (told her so): career earnings, W/L + win streaks, latest
  articles on profiles, paddle photos + specs, ranking movement arrows, per-event historical
  champions, and the full tour records archive. All need Wesley's feeds. The records archive is
  the highest-value one — evergreen SEO plus broadcast/stats utility.
- **Blocked on content owners**: video hero, Point/Match/Clip of the Week, Pressroom section —
  asked Jeff to own the weekly feed before we build the slots.
- News consolidation deliberately deferred until Connor rules on ppatour.com vs pickleball.com,
  so we restructure once instead of twice.

### 2026-07-28 — Website audit pass: Bryce's punch list + the 7/27 thread (`74f1d25`)
- Worked Connor's "Full Website Audit Request" thread (Conner Ogden, Dave Rogers,
  Jeff Watson + Nathan's Google doc) plus Bryce's own 7/28 punch list. Pushed to main.
- **Homepage**: floating Veolia crest + floating "Featured Event" card removed (both
  redundant with the hero; kept on `/live`); new **Next on Tour** strip above the five
  callouts (next 3 stops then the next 3, text links + arrows); callouts 18rem → 23rem
  and hero 58svh → 50svh; the Next-Event sub-bar now retires on first scroll —
  `HideOnScroll` existed but was **orphaned**, now wired into `TopBar`.
- **Rankings**: men's left / women's right side-by-side from `lg` up (kills the desktop
  dead space Bryce flagged), toggle retained below `lg`. Same component powers the
  homepage module, so both change together.
- **Watch rebuilt broadcast-first**: "As Seen On" network band leads, then a real TV
  guide (`components/watch/TvGuide.tsx`) showing the next four events day-by-day,
  channel-by-channel. ⚠ **CBS + FOX are confirmed in `lib/broadcast.ts`; ESPN + NBC are
  NOT in any broadcast sheet we hold** — they came from Connor's brief. Confirm with
  Adam Friedman before launch; deleting a row in `AS_SEEN_ON` is the whole fix.
- **VENUE PHOTOGRAPHY — the big one.** `VENUE_IMAGES` were Melbourne/Macao/Gold Coast
  city shots cycling across the US calendar (Las Vegas illustrated with Brisbane, Worlds
  with the Macau tower). Now: `lib/venue-photos.ts` joins **event slug → venue id → real
  photography**, with two importers writing one manifest —
  `scripts/import-venue-photos.mjs` (reads the event photo zips in `~/Downloads`, no
  credentials) and `scripts/sync-venue-photos.mjs` (Jackalope's Blob library, **needs
  `BLOB_READ_WRITE_TOKEN`** — OIDC is off for the dev environment).
  **145 photos across 10 venues imported**; Cary/Mesa/Brookhaven/Lakeville/San
  Clemente/Mission Hills lead with their own aerials and all now have galleries
  (Worlds had none). **Still generic**: Las Vegas (`lv-summerlin`, 33 in Jackalope),
  Virginia Beach (`pickleball-vb-va`, 24) and Chicago/Malibu (no library) — the first two
  land the moment someone runs the Blob sync with a token.
- **EventGallery → single horizontal rail** (Bryce: "one row gliding across instead of
  taking up vertical space"): pointer-drag on desktop, native swipe on touch, arrows on
  `lg`, drag-vs-click disambiguated so dragging never opens the lightbox.
- **Broken links**: full crawl went **28 → 0**. Two real bugs — the TV schedule's Arizona
  Open row pointed at the *2027* `carvana-mesa-cup` slug, and link-out events fell back
  to `eventHref()` (which 404s) whenever `hasInternalPage` was undefined, i.e. any time
  the events API is unreachable and we serve the curated list.
- **Thread fixes**: YouTube no longer claims "every court, every match" (that's PBTV —
  Dave); PBTV is the primary Watch CTA; athlete paddles → Pickleball Central; junior/
  senior/state registration → the PPA-sanctioned event search; Proton + Acry-Tech tiles
  link to the partner; Jeff/Nathan's copy for rankings/tour/callouts; "paddle skin" →
  "paddle or something from the merch store"; event-rate → tournament-rate; the
  "checkout lives off-site" line cut; 180-athlete count dropped; champion names +
  "Full Results" clickable; Cary NC and "2,000 Ranking Points" now link out.
- **Sponsors**: the logo IS the card — partner names are never typed beside their marks.
  New `Partner.hideRole` makes Veolia + Humana logo-only; JOOLA keeps "Official Paddle
  Partner". Applies on homepage, event pages, `/about/sponsors`, and the spotlight.
- **Next / open for Bryce**: (1) the six decisions in the thread that need him +
  Connor — news home (ppatour.com vs pickleball.com), ad inventory, Slam/Majors
  nomenclature + what Worlds is, MLP's total absence, whether to make a statement above
  the fold, and whether Buy Tickets is really the first callout; (2) confirm ESPN/NBC;
  (3) run the Blob sync for Vegas + Virginia Beach; (4) Jeff flagged "remove square
  bullets" on `/events` — left alone, it reads as the site-wide section marker and needs
  him to point at the specific element; (5) per-discipline rankings/seeds (Dave) still
  blocked on Wesley's feed — the Discipline control filters but can't sort.

### 2026-07-27 — APP Tour competitive briefing hosted at `/app-tour` (`396350c`)
- Bryce needed a **public, forwardable** version of the APP registration analysis. The Jackalope
  module (`ziff` → Competitor Research) sits behind Google SSO, so stakeholders outside the company
  can't open it. Static deck at `public/app-tour/index.html`, same pattern as `/pbtv`.
  **Live: https://ppatour-website.vercel.app/app-tour**
- **The data.** Six seasons of APP registered-player counts, pulled from the three platforms that
  hosted their events: legacy PT via the Internet Archive (2020–mid-2023), current PT's
  APP-sanctioned search (Jun 23–Oct 24), UTR's public event API `registeredCount` for club "APP Tour"
  (Oct 24–Dec 25), Pickleball Den event pages (2026). APP peaked at **12,760 across 20 events in
  2023**; 1 Jan–27 Jul **2026 is 1,971 across 5** (−73% YoY). U.S. calendar 23 stops (2022) → 11 (2026).
- **The head-to-head is the strongest slide and it's ours.** Same window, same PT
  "Completed — N players" metric: **PPA 13,575 (15 events) → 14,235 (11 events), +4.9%** while APP fell
  73%. Per event PPA 905 → **1,294**; APP 619 → **394**. Pulled from
  `pickleballtournaments.com/search?partner=sanction_ppa&past_tours=true`.
- **Measured data and opinion are deliberately separated.** Sections 01–04 + Method are sourced
  counts. The "Why the calendar is shrinking" band carries a **PPA TOUR ASSESSMENT** stamp and states
  in the footer that we make no claim about the APP's private finances. No invented APP revenue
  figures anywhere — the gate argument rests on the observable (municipal parks, no ticketed
  stadium build), not on numbers we don't have.
- `noindex, nofollow` so it's link-shareable without being searchable. Brand fonts copied to
  `public/app-tour/fonts/` (a static page can't use the Next font pipeline).
- **⚠ Flagged to Bryce, his call:** this repo is a **public GitHub repo**, so the deck's HTML —
  including the assessment language — is readable by anyone who finds the repo, and noindex only
  stops search engines. If the shutdown language should stay internal, it belongs on the Jackalope
  version and this page should carry the data sections only.
- **Next:** re-pull the ◦ open-registration rows after 7/29 for a final Chicago figure; if this
  becomes a recurring briefing, drive it off a shared JSON rather than two hand-maintained copies
  (here and `ziff/competitors.js`).

### 2026-07-26 — TV data reconciled to Scheduling V22 (7/17/26)
- Bryce: "make sure our TV stuff matches this" (Adam Friedman PBTV update +
  Pickleball Scheduling 2026 V22 + Champions Series sheet). Synced the
  Tennis Channel windows — the site was built off the 6/30 sheet — to V22's
  authoritative "PPA TC Broadcast Hours". Fixed in BOTH `lib/tv-schedule.ts`
  (/watch/tv) and `lib/broadcast.ts` (event-page Watch tables):
  - Cary/Nationals: TC Thu–Sun (was Sun only) — 23h
  - Las Vegas: TC Sun ONLY 1–5 (removed Fri/Sat) — 4h
  - Chicago: TC 11a–3p (was 11a–2p) — 12h
  - Malibu: TC Thu–Sun 3–9/3–7; dropped Wed, added Sat SF + Sun — 20h
  - VA Beach + Worlds already matched.
- **Flagged, NOT changed** (need Bryce/Adam): (1) Sept "Arizona Open" and the
  Oct/Nov "MLP Cup" carry TC windows V22's TC sheets don't list — remove or
  PBTV-only? (2) `carvana-mesa-cup` slug: Sept event vs V22's Feb Mesa Cup —
  naming/date mismatch. (3) `virginia-beach-open` has stray "Premier Pool
  Play" rows in broadcast.ts that look misplaced. (4) PBTV windows still
  templated — reconcile vs V22 "Coverage Schedule & Broadcast" (417 rows).
  (5) MLP Champions Series (senior, PBTV Mon/Tue from 8/3) + Adam's new
  originals (Picklers, Brighter, Partners, Spec Check…) not on the site's TV
  page yet — add a PBTV programming section?
- **Separately** (not this repo): parsed the "PPA Tour Ratings Track - 2026"
  Nielsen workbook → structured JSON + summary + source xlsx in
  `~/pickleball/_ratings/` (a private non-repo folder — confidential Nielsen
  data, deliberately NOT in any deployed/public repo). 52 telecasts, peak
  reach 2.0M (MLP Midseason Finals/FOX), 1.65M
  (PPA Finals/FOX), ~9.4M cumulative P2+ reach.

### 2026-07-25 — PickleWave reverse-engineered: data-source map for the PPA data layer
- Brett/Bryce convo → task: figure out where picklewave.com pulls its data.
  Full write-up in [`PICKLEWAVE-API-ANALYSIS.md`](PICKLEWAVE-API-ANALYSIS.md).
- Verdict: PickleWave is a server-rendered Rails app with its own Postgres;
  no privileged access. Sources = Pickleball Inc's own public feeds:
  **PickleballBrackets engine** (system of record; every pickleball.com
  tournament record says `Platform: PickleballBrackets`, ptd.aspx?eid=GUID),
  **pickleball.com/api/v1|v2** (results/rankings, unauthenticated),
  **pickleballtournaments.com/tournaments/api/** (tourneyEvents, open),
  **ppatour.com admin-ajax `get_rankings`**, **DUPR** ratings, and
  **@ppastreamedcourts YouTube VODs** for the replay catalog. ELO/Pickles are
  computed in-house.
- For the rebuild's data layer: ask Jason for direct brackets-engine +
  pickleball.com API access — same data first-party, no scraping.
- Next: fold this into the Pickleball+ / app spec conversation with Connor.

### 2026-07-24 — Homepage perf: fonts woff2 + Cormorant preload fix + image sizes
- Bryce flagged the homepage feeling slow. Server was fine (warm TTFB ~0.3s);
  the weight was fonts + oversized images.
- **Root cause = Cormorant Garamond preloaded site-wide**: it was a 1.2 MB
  UNSUBSET .ttf pulled on EVERY page (`preload: true` default on the localFont)
  despite only Nationals-style events using it. Fix: `preload: false` +
  Latin-subset woff2 → **1,195 KB → 30 KB**, and 0 on the homepage.
- **Gotham → woff2** (was .ttf/.otf, incl. a 128 KB Book .otf): 325 KB → ~100 KB.
  ⚠ Kept `Gotham-Black.ttf` + `Gotham-Medium.ttf` on disk — `lib/og.ts`
  (Satori OG cards) needs TTF, not woff2. Layout references only the woff2;
  the TTFs bundle into the OG route only.
- **Sponsor logos**: no `sizes` → next/image served the 3840px candidate for
  ~130px logos. Added `sizes` to all 6 render sites (PartnerWall ×2, footer,
  spotlight, homepage marquee, EventSponsors).
- **Hero**: `quality={65}` (65/75 are the only allowlisted qualities in
  next.config — 70 clamps). ~516 KB → ~400 KB.
- **Net: homepage sheds ~1.5 MB.** Fonts 1.52 MB → 0.10 MB is the headline.
- Tooling note: converted with `fontTools` + `brotli` (pip). woff2 files live
  in `app/fonts/`.

### 2026-07-23 (pt. 5) — Gold Prize Grid + honest defending champs + nav dedup
- **Gold Prize Grid** (`components/events/GoldPrizeGrid.tsx`, Connor:
  "clickable… make us look biggest and best") — leads the What's-at-Stake
  section with the real on-court purse BIG, native `<details>` expands to the
  full 5-division × podium grid. Real grid totals in `GOLD_GRID` +
  `goldGridTotal()` (Majors/Worlds $1,024,400 · Cups $647,493 · Opens
  $439,086 · Finals $628,000 via slug override). Wired into the event page
  AND NationalsLive. No fabricated per-cell dollars — shows the real total +
  podium structure.
- **Defending champions fixed** (Connor: "make sure it's right"). Was the
  SAME hardcoded 5 names (Ben Johns / Anna Bright / …) on EVERY event.
  Now `Tournament.defendingChampions` per-event, with an honest "confirmed
  once last season's champions are set" fallback — deleted the placeholder
  constant from both event components. **Data ask: Wesley → per-event
  prior-year champions** (then it lights up automatically).
- **Nav dedup**: "Sponsors" was listed twice (top-level tab + inside About
  dropdown AND the desktop About panel) — removed the About duplicates. The
  deeper "which tab feels pointless" is ambiguous (may be the Jackalope app,
  not the site) — flagged to Connor for specifics before restructuring.
- Cleaned unused `tierShort`/`tierLabel` imports left by the Major swap.
- **Genuinely still open (not code tweaks)**: Jeff's ranking wheel + "where
  the points come from" (needs per-event results the athlete/event feed
  doesn't expose yet — Wesley) and the **PPA Shop** "Powered by PBC"
  (a Jackalope/commerce build, not a website section).

### 2026-07-23 (pt. 4) — Player-profile redesign (Connor: "sloppy", "link to gear")
- Rebuilt `/athletes/[slug]` for flow + the missing gear link (`be01350`,
  live). Premium hero (bigger portrait, brand glow) + a **broadcast-style
  stat strip** under it (World Rank / WPR Points / DUPR / Career Gold) so
  rank + DUPR + hardware hit immediately. Strip is count-aware (2/3/4 cols).
- Killed the duplicate rank/points cards that sat in the sidebar (they're in
  the hero strip now) — the "sloppy" redundancy. Sidebar → Quick Info +
  Full World Rankings link.
- **New "In the Bag" gear section** (`lib/athlete-gear.ts`): player's paddle
  + shop CTA. Official partners (JOOLA/Selkirk/Six Zero) link straight to
  their store (UTM `athlete-gear`); any other brand points to our
  official-partner directory — we only send traffic to gear we rep (Connor's
  "only our official shit"). Verified: 42 profiles link to a partner store,
  rest → official gear. Repoint to the PPA Shop when it exists.
- Bio / division rankings / medals / DUPR retained, tighter.
- **Still ahead** (needs data, flagged): "where the points come from" /
  previous results + Jeff's ranking wheel — the athlete feed has no
  per-event results yet (Wesley's API lane / Jeff's component).

### 2026-07-23 (pt. 3) — Majors designation wired (Connor confirmed the four)
- Connor: **Atlanta Open = "the Players"** major. So the four Majors are
  Masters, Atlanta (Players), Nationals, Worlds. Shipped `52fe997` (live).
- Majors are now a curated per-event designation — `isMajor()` in
  placeholder-data (MAJOR_SLUGS + name backstop for API records), NOT a
  tier. Those four carry a **MAJOR badge** everywhere (hero, cards, header
  eyebrow, OG card, meta) via new `eventTierShort()`/`eventTierLabel()`,
  swapped in at every badge site.
- Reverted the 2,000-pt tier label off "Major" → **"Championship"** so
  **PPA Finals** (2,000-pt but NOT one of the four) reads correctly and
  "Major" stays exclusive to the four. Verified in the build + live:
  Nationals/Worlds/Masters/Atlanta = Major; Finals = Championship.
- Connor confirmed the two proper event names (LA Slam, Hong Kong Slam)
  **keep "Slam" for now** — no change (already left as-is).

### 2026-07-23 (pt. 2) — Connor's 7/23 text punch list (from his flight)
- Connor texted a fresh walk-through list this morning. Shipped the
  confident naming/structure wins in one commit (`fd8456b`), pushed to
  main → Vercel auto-deploy (production). Build 274 routes clean; the 8
  eslint errors are all pre-existing "setState-in-effect" flags in the
  live/interactive client components (StickyBuyBar, LiveScoreGrid,
  BracketPanel, ScoresBoard, AthleteVideos, NationalsLive) — none in
  files touched this session.
- **"Don't use main" / "The Pro Tour or just The Tour"**: events page
  hero "The Main Tour" → **"The Tour"**; homepage schedule section, event
  "Next on Tour", ScheduleGrid filter, and all `main-tour`/`main tour`
  marketing copy across nav/about/tour/play → "the Tour"/"tour stop".
  ("main draw" left — real bracket term.)
- **Events buckets** (his spec): **The Tour** = 1,000+ pts, **Other
  Events** = under 1,000 (was "Challenger Series"). 
- **Asia/Australia 1,000+ now in The Tour**: dropped the
  `region !== international` exclusion. Root fix — international events
  were ALL defaulting to 1,000 pts (both the curated builder and live
  `inferTier`), so a "Spain P125"/"Canada 125" would've flooded The Tour.
  New `tierFromName()` parses the points token in the title (1500 / P250
  / 125) and it wins over keyword inference. Verified in the build:
  Hong Kong/Kuala Lumpur/Gold Coast/Australia in The Tour band, 125s
  stay in Other Events. **Still TODO**: full internal event pages for
  the intl 1,000+ stops (they surface + link out today; need
  venue/guide content — flagged to Connor).
- **"No more Slam" → majors**: tier label `slam` → **"PPA Major" / "Major"**
  (badges, tables, filters, TV schedule); generic "Worlds, Slams, Cups,
  Opens" copy → "Worlds, majors, cups, opens". **Left + flagged**: the two
  proper event names still containing "Slam" (LA Slam, PPA Asia 1500 Hong
  Kong Slam) — need Connor's official rename; Jack Sock's real-tennis
  "Grand Slam champion" bio; the 15 news articles (Dylan's editorial).
  Also flagged: which 4 events carry the Major designation (his list:
  Masters/Players/Nationals/Worlds — "Players" has no event in data yet).
- **"Prize money and fees" → "Prize Purse"**: homepage stat, event
  What's-at-Stake tiles + quick-facts, event meta description, stakes prose.
- **Sponsor logos forward to partner sites** (his "forward when you click
  the logo"): `Partner.website` added; PartnerWall title + every official
  card now click through (UTM `sponsor-directory`, `target=_blank`) for the
  13 partners we have confident URLs for; the other 4 (Proton, LT Pro 48,
  Reign Storm, Acrytech) stay non-linked until we confirm — never a wrong
  destination. `↗` on hover.
- **Not done this pass (bigger design projects, in the Connor reply as
  "next")**: player-profile redesign (bio/ranking/medals/DUPR/gear,
  "sloppy right now"), Jeff's ranking wheel + where-points-come-from,
  gold-grid clickable/"biggest & best" display, tab navigation cleanup,
  and the **PPA Shop** ("Powered by PBC", official-partner-only, medals/
  signed gear/trading cards) — that one is a Jackalope/commerce build,
  not a copy tweak.

### 2026-07-23 — Event hotels pull from Jackalope + booking-link click tracking
- `lib/published-hotels.ts` server-fetches Jackalope's public hotels feed
  (Kristen's blocks flagged "on ppatour.com"), matches by city, overrides
  the static event-guide hotels (5-min ISR; falls back to guide when
  empty/unreachable). `BookGroupRateLink` sendBeacons each click to the
  Jackalope counter → demand shows per hotel in Travel → All Hotels.
- Kristen now manages hotels in Jackalope (Travel), not the sheet/email.


### 2026-07-20 — Connor's site-walk punch list (all 10 items)
- Connor walked the site with Bryce ("better than the PGA site", live in
  ~2 weeks) and left a 10-item list. All shipped this session (9 commits,
  `f2b31db`…); build 260+ routes clean; the 3 eslint errors are
  pre-existing in Wesley/Tyler files (volunteer page, StickyBuyBar,
  Analytics), untouched.
- **#1 Events page**: 1,000+ stops lead BIG (all upcoming main tour in the
  large card band), Challenger Series in a smaller strip below, full
  search/filter last. "PPA Tour" filter now includes EVERYTHING; Country
  is its own always-visible dimension (incl. USA).
- **#2 Sponsors everywhere**: nav "Sponsors" right of Tour; every event
  page has a Sponsors section (marquee partners + tour roster + "Want to
  be a sponsor?" → /about/sponsors#inquire → Jacob's Leads pipeline);
  footer "Our Sponsors" strip + Become a Sponsor CTA.
- **#3 Rankings**: `getFullRankings()` pages the API until exhausted —
  /rankings now renders the COMPLETE men's/women's boards (tab shows
  count). Locally it falls back to the 8-row placeholder (no PB_API_TOKEN
  on this machine) — verify row counts on the Vercel deploy.
- **#4 AI-coverage approval gate**: `NewsArticle.status` REQUIRED; drafts
  invisible site-wide (404 included); consumers all read
  `publishedArticles`. New/rewritten AI articles MUST land as
  `status: "draft"`; **Dylan** flips to published. docs/CONTENT-APPROVAL.md.
- **#5 Homepage labeling**: hero carries an event ID chip (name + dates +
  venue); Live & Latest rail carries an event label chip.
- **#6 Event sticky nav**: past the hero, site chrome slides away
  (`html[data-event-nav-scrolled]` + `.site-chrome` in globals.css) and
  the event tab bar sticks top-0 all the way down w/ a pinned Buy Tickets
  CTA.
- **#7 Play tab removed** from nav; /play route kept (Tour panel's Get On
  Court card); event pages carry play via Get Involved.
- **#8 Imagery**: Nationals hero back to the champ-court drone shot + its
  9-photo gallery restored (reference standard); main-tour cards cycle
  venue/stadium placeholders instead of player shots. Per-event asset
  gaps for **Sadie**: docs/VENUE-ASSETS.md.
- **#9 Athletes**: single chest-up crop anchor, branded "Photo Coming"
  placeholder for missing photos, no "No. 0" badge; filters Gender /
  Discipline / Ranking range added.
- **#10 Registered counts — BLOCKED on Jason**: display + adapter shipped
  (`lib/registrations.ts`, honest "Registration Count Coming" chip in Get
  Involved). Needs `PT_API_TOKEN` + `PT_API_BASE_URL` in Vercel + endpoint
  confirm. docs/DATA-ASKS.md.
- Next: get Jason's PT.com creds; brief Dylan on the article gate; feed
  Sadie the venue shot list; per-event sponsor lists from
  Jackalope/SponsorCX when they exist.

### 2026-07-21 — Full official-partner roster (Connor: all sponsors, feel valuable)
- Connor Pardoe priority: every sponsor listed + made to feel valuable
  across homepage + event pages. Expanded `partners` 7 → **all 17**
  current designated partners from the exclusivity roster (Carvana
  title + Veolia, JOOLA, Humana, Ensure, Proton, Six Zero, Rate,
  Fasenra, Holland America, Joma, LT Pro 48, Park Place, Selkirk, Reign
  Storm, Tixr, Acrytech). Each leads with the category it owns
  ("Official {X} of the PPA Tour") — the designation IS the value.
- New `components/global/PartnerWall.tsx` directory (title hero + full
  official grid, accent-tintable) used on homepage AND every event
  Sponsors section. Logo shown where we hold the brand-kit file; clean
  name-wordmark card otherwise. /about/sponsors shows all 17.
- Logo field now optional; guarded every partner-logo render (footer,
  spotlight, marquee, sponsors page, event marquee).
- **Logos for the 10 non-flagship partners = per-partner asset swap**
  (favicons were too low-quality to sit beside the 2048px wordmarks;
  the data field is ready — drop a real brand-kit PNG in
  public/ppa/sponsors + set logo/logoWidth/logoHeight).
- Source of truth: Jackalope sponsorship exclusivity sheet
  (ziff sponsorship.js SPN_EXCLUSIVES). Roster shifts as designations
  renew/lapse — resync when the sheet changes.

### 2026-07-20 (pt. 2) — Per-event display typography (Nationals serif)
- Answered the open font question: YES, per-event serif — opt-in, not
  tour-wide. `brand.font: "cormorant"` sets `--font-event-serif` on the
  event page; `.event-display` (hero title + section H2s) swaps to
  Cormorant Garamond — the Nationals brand-guide serif that sets its own
  wordmark. Self-hosted variable font (app/fonts/CormorantGaramond.ttf).
- `.event-display` is self-contained: default branch = exact Gotham Black
  (weight 900, tight), serif branch = weight 700 + slight tracking for
  uppercase. So every non-branded event stays Gotham (verified: Las Vegas
  Open hero + headings still Gotham Black).
- To skin another event: add `font: "cormorant"` (or a new serif) to its
  BRAND_BY_SLUG entry. Only Nationals opted in for now.

### 2026-07-20 — Generated OG share cards site-wide + purse regression fix
- next/og cards replace raw-photo shares: event cards (photo + navy
  scrim + tier badge + event mark chip + Gotham title + "$1.65M on the
  line · tickets from $59" + brand-accent bar), article cards (category
  chip + headline + dateline), rebuilt site default (drone shot). New
  `lib/og.ts` (Gotham loading + public-image data URIs). File-based
  opengraph-image overrides metadata images automatically.
- Satori gotchas: use backgroundImage for gradients; `inset` shorthand
  unsupported — explicit top/left/width/height.
- ⚠ FIXED REGRESSION: the ppa_tournaments API rewrite reintroduced old
  TIER_PRIZE placeholders ($300k Slams) — restored official 2026 totals
  (Slams/Worlds $1,648,641 · Cups $1,271,734 · Opens $1,063,327). If
  the events pipeline gets rewritten again, keep TIER_PRIZE authoritative.

### 2026-07-16 (pt. 3) — Official hotel blocks (Kristen's thread) + Jackalope doc
- Parsed the "2026/2027 PPA Tour Hotel Links" Gmail thread (Kristen
  Russell, latest 7/16). 15 official hotels across 6 events loaded into
  `lib/event-guides.ts` (Place gains href/brand/rate/cutoff). Where to
  Stay rows show brand mark + "Official" badge (event accent) + rate +
  book-by + "Book the Group Rate ↗" button. NC first-class: Holiday Inn
  RDU (IHG, by 7/31) + Home2 Suites RDU (Hilton, by 7/30).
- Email URLs were quoted-printable-corrupted; reconstructed with QP
  rules ("= 26-" → "=2026-", "�" = eaten =XX pair). TWO need Kristen's
  confirmation: Chicago HIE group code, Hampton Farmers Branch h6 link.
  Full table + flags: ziff `docs/HOTEL-LINKS-2026-27.md`.
- Brand marks = Google favicon pulls in `public/ppa/hotels/` — swap for
  official brand assets when marketing supplies them.

### 2026-07-16 (pt. 2) — Seconds on the countdown + hero broadcast clock
- Countdown badge ticks D:H:M:S every second (homepage + event heroes).
- New `FirstServeCountdown` — "First Serve In" clock bottom-right of
  the event hero: big tabular digits, DAYS/HRS/MIN/SEC labels,
  brand-accent colons; hidden under lg and once the event starts.
- Verify-note: the clock is client-only (null until mount) — check
  deployed JS chunks for its strings, not the server HTML.

### 2026-07-16 — Nationals order of play: Pro Play + Amateur & Junior tables
- Bryce's ask: split the schedule into a "Pro Play" table (first serve
  + TV) and an "Amateur & Junior Play" section (no serve times — they
  vary by division). Built `lib/event-schedule.ts` overrides; events
  without one keep the templated table.
- Pro days transcribed from the OFFICIAL registration page Bryce sent
  (pickleballtournaments.com): Mon 8/31 Qualifying (serve TBD) · Tue
  R64 · Wed R32 · Thu R16 · Fri QF · Sat SF · Sun Championship. NOTE:
  Bryce's message listed slightly different rounds (Sep 3 "Round 1",
  no Sep 2) — followed the official page + broadcast sheet instead;
  flagged to him.
- Amateur table: week-long skill/age brackets · PPA Tour Camp Aug 31 +
  Sep 1 (4–7 PM) · Junior PPA + Senior Open · MoneyBall · "division
  days publish after Aug 24 deadline" note + register deep link.
- Amateur per-division days aren't published anywhere yet (checked the
  registration page HTML — no events API exposed). When Wesley's
  PT.com API lands, sync real division/day data into eventSchedules.

### 2026-07-15 (pt. 9) — Article player links (inline + rail)
- Bryce's ask: articles referencing players should hyperlink them and
  offer bio links on the right. Shipped: `linkifyPlayers` wraps
  athlete full-name mentions in the dek/body with links to
  `/athletes/{slug}`; sticky right rail "Players in This Story"
  (headshot, rank, division) merges explicit `article.players` with
  auto-detected mentions. No players → centered single column.
- Seeded players on vegas-final / race-report / atlanta-draw. To
  feature players on any article: add slugs to `players`; inline
  linking is automatic wherever the roster name appears verbatim.

### 2026-07-15 (pt. 8b) — Trophy mark in the event hero
- Follow-up from Bryce ("it is perfect when you scroll, its stunning"):
  the event mark now also sits left of the event name in the HERO —
  white treatment (brightness-0 invert + navy drop-shadow) over the
  photo. Renders for any event with `brand.icon`; others unchanged.

### 2026-07-15 (pt. 8) — Branded event nav + scroll behavior + accordions
- Bryce's asks, all shipped: (1) floating tab bar swaps "Overview" for
  the event's mark + name once scrolled (`EventTabNav`, threshold
  420px, tap = back to top); (2) the next-event ScoreTicker collapses
  site-wide on scroll (`HideOnScroll`, >120px); (3) per-event brand
  system — `Tournament.brand {primary, accent, icon}`, Nationals wired
  from its quick guide (navy #023155, deep red #C1272D, trophy mark
  extracted from the guide PNG w/ PIL → `public/ppa/events/
  nationals-trophy.png`); accent threads through hero badge/strip/CTA,
  section markers, router kickers via `--event-accent` CSS var,
  falling back to PPA blue for unbranded events; (4) Know Before You
  Go rows → native <details> accordions (first open).
- Sticky offsets: event tab bar now top-16; sections scroll-mt-[120px].
- To brand more events: drop their quick-guide colors + mark into
  `brand` on the tournament record — everything else is automatic.
- Fonts note: Nationals guide lists Cormorant Garamond Bold as the
  event serif — NOT applied (site stays Gotham); revisit if Bryce
  wants full event-skin typography.

### 2026-07-15 (pt. 7) — Coverage↔events linking + Event Report spec (Jackalope)
- `NewsArticle.eventSlug` ties coverage to tour stops; 6 articles
  tagged (Vegas ×2, Atlanta ×2, Chicago, Virginia Beach). Event pages
  get a **Coverage** section + tab when articles exist — "Story So
  Far" pre-event, "Relive {event}" when `status: "completed"`; hero
  countdown reads "Final" once completed. The archive state activates
  automatically when events complete (Wesley's API sets status).
- **Jackalope**: `ziff/docs/EVENT-REPORT-SPEC.md` — one Event Report
  record per stop renders both the public site recap AND the
  per-sponsor recap (Connor's auto-recap ask). Private layers
  (activations, Hive valuation, ticket revenue) never reach the site.
  Bryce's framing: this is the knowledge base of tour history.
- Still open for the Events page (#3): past/Challenger/international
  event DATA — the archive UI is ready, the records don't exist yet.

### 2026-07-15 (pt. 6) — Newsroom: 15 real articles + article pages
- Every news headline now opens a real article. `lib/news-articles.ts`
  holds 15 written pieces (recaps, analysis, features, explainers,
  profiles) — slug/dek/why-it-matters/5-paragraph bodies, grounded in
  site season data (rankings points, calendar dates, purse totals,
  PBTV/TC broadcast). No fabricated quotes from real players;
  narrative arcs lean on the fictional players already in matches[]
  (Anand, Safdar, Hartman/Bricker).
- `/news/[slug]` template: image hero + category/byline, dek,
  why-it-matters callout, body, "See It Live" ticket CTA (UTM
  `article-{slug}`) + TV Schedule link, 3 related articles, OG/article
  meta. 114 routes build clean.
- `home-content.ts` `news[]` is now DERIVED from newsArticles (single
  source) — /news index, homepage newsroom, and site search link to
  real slugs automatically. Sitemap includes articles.
- Storylines on the homepage still have no hrefs (Storyline type) —
  candidate next: link the 5 storyline cards to matching articles.
- When Sanity lands, articles move to CMS; the type is CMS-shaped.

### 2026-07-15 (pt. 5) — Per-event payout → full totals (Bryce's call)
- Bryce wants the biggest true number per event: prizeMoney now shows
  **prize money + appearance fees** per tier — Slams/Worlds $1,648,641
  · Cups $1,271,734 · Opens $1,063,327 · Finals $1,252,241 (official
  2026 tier totals from ppatour.com/how-it-works).
- Labels reframed honestly: event hero "{X} On the Line" · quick facts
  + What's-at-Stake tile "Prize Money & Fees" (note: "incl. appearance
  fees") · stakes copy "the tour puts {X} behind this event."
- Season stat stays "$5.2M+ Prize Money & Fees."

### 2026-07-15 (pt. 4) — Sponsorship front door (commit `43545e0`)
- **Full-bleed pass (Bryce's ask):** homepage ScoreRail + PartnerSpotlight banner +
  sponsor logo marquee now run edge-to-edge; section headings stay capped at max-w-6xl.
- **Homepage sponsor CTA** under the logos: "Find Out What Sponsoring the PPA Tour &
  Pickleball Is All About" → `/about/sponsors#inquire`; Partners section link repointed
  there too (was `/about`).
- **Real partnership inquiry form** (`components/marketing/SponsorInquiryForm.tsx`) on
  /about/sponsors — company/name/email/phone/category/budget/message + honeypot; hero
  "Partnership Inquiry" + closing "The Ask" CTAs now scroll to it (mailto demoted to
  secondary).
- **`/api/sponsor-inquiry`** forwards server-to-server to the Jackalope leads hook
  (`x-lead-secret`) — submissions land as deals under **Leads** in the Sales pipeline
  (ziff commit `3427a31`, hook live + verified 401/405). **⚠ Blocked on Bryce:**
  `vercel env add LEAD_HOOK_SECRET production` in BOTH repos (same value), redeploy both,
  then submit a test inquiry. Until then the route logs + returns ok (nothing breaks).
- Build 99 routes + lint clean; form/marquee/CTA verified headless on a local prod build.
- **⚠ Deploy status unknown at log time** — push went to `main`; GitHub auto-deploy has
  been flaky and the CLI deploy was permission-blocked this session. If
  ppatour-website.vercel.app doesn't show the CTA, run `vercel --prod --yes`.

### 2026-07-15 (pt. 3) — Purse correction (official 2026 numbers)
- Bryce flagged Nationals "$300,000 purse" as way low. Pulled
  ppatour.com/how-it-works: **$5,235,943 total prize money +
  appearance fees for 2026**; Gold Prize Grid per event tier:
  Slams/Worlds $1,024,400 · Cups $647,493 · Opens $439,086 · Finals
  $628,000.
- Updated all 20 events' `prizeMoney` by tier (Challenger untouched);
  homepage + /about/pro-tour stat "$2.4M+ Season Purse" → "$5.2M+
  Prize Money & Fees". Event-page hero, quick facts, and What's-at-
  Stake all inherit.
- Presentation choice: per-event number = Gold Prize Grid (actual
  purse), season number = prize + appearance fees (the $5.2M headline
  PPA promotes). Flag if Tyler prefers per-event totals incl. fees
  (Slam would read $1.65M).

### 2026-07-15 (pt. 2) — New Nationals hero + Ken Burns; full TV schedule page
- **Nationals hero** swapped to Bryce's overhead champ-court drone shot
  (`nationals-drone-champcourt.jpg`); previous drone shot moved to the
  gallery (now 9 photos). **Ken Burns drift added to all event-page
  heroes** (same `animate-kenburns` as homepage; drone video is the
  future replacement).
- **TV schedule page** `/watch/tv` built from the Google broadcast
  sheet (2026 PPA/MLP Championship Court, as of 6/30): remaining
  season transcribed into `lib/tv-schedule.ts` — 9 events (Nationals →
  Malibu, incl. MLP Cup). Rest of year is **PBTV + Tennis Channel
  only** (confirmed vs sheet; Nationals Sunday = TC 11AM–4PM ET ✓;
  existing per-event `lib/broadcast.ts` Nationals entry already
  matched). Filter pills (All / TC / PBTV), TC rows highlighted,
  event-page links, PBTV + find-Tennis-Channel CTAs.
- /watch "FOX & FS1" card → "Tennis Channel" → /watch/tv (no FOX
  windows remain); Events mega panel gains TV Schedule link.
- **Data source note:** sheet is public-readable CSV
  (`export?format=csv&gid=476669390`) — a build-time fetch or cron
  could auto-sync `tv-schedule.ts` later (Wesley's API lane).

### 2026-07-15 — Nationals real photography + flip-through gallery; Tyler's deep links landed
- **Nationals imagery (commit `2cafbc4`):** hero swapped to the drone
  shot of a packed center court at Cary Tennis Park (from Bryce's
  DRONE PHOTOS.zip); 7 new NC Open photos (same venue) resized into
  `public/ppa/nationals-*` (4 drone + 3 crowd). Homepage hero + Events
  mega-panel card inherit it automatically (keyed off next event).
- **EventGallery** (`components/events/EventGallery.tsx`): gallery on
  all event pages is now grid + full-screen lightbox — prev/next,
  keyboard (←/→/Esc), swipe, counter, dot nav. Nationals gallery = 8
  photos. Verified in Chrome (lightbox open/flip).
- **Team is committing now:** Tyler (tdodd7) pushed #1 — every ticket
  + registration CTA deep-links to its real event page
  (`tixr.com/groups/ppa/events/{slug}` helper + fallback) — and #2,
  UTM-tagging remaining partner links (Shop, PBTV, MATCHDAY, PBC).
  Punch-list #6 is DONE. A `wesley-edits` branch exists on origin —
  check/merge it. My work rebased cleanly on top; build + lint green.
- Note: push was rejected-then-rebased — always `git pull --rebase`
  before pushing now that three people commit to main.

### 2026-07-14 (pt. 4) — Event pages: three-audience upgrade + concierge chat
- Bryce's brief: event pages must serve travelers, players, and
  at-home fans — site map, know-what-to-do, schedule, who's playing,
  where to stay/park, get involved, ask questions (chatbot).
- **Shipped (commit `05ff854`)** on `/events/[slug]` (all 20 events,
  richest on Nationals):
  - Audience router (Going / Playing / Watching From Home lanes)
  - "What's at Stake" section (points/purse/field + narrative)
  - Venue Guide: generic brand-styled SVG grounds map
    (`components/events/VenueMap.tsx`, numbered legend, "official map
    event week" caption) + Know Before You Go grid (gates, parking
    from guide data, bag policy, autographs, weather, guest services)
  - Get Involved: amateur draw (from $89/division), camps, pro-am,
    volunteer
  - **EventConcierge** (`components/events/EventConcierge.tsx`) —
    floating chat, rule-based intents answering from per-event facts
    built server-side (tickets/schedule/parking/hotels/dining/watch/
    register, UTM-tagged links); quick chips + free text; graceful
    contact fallback. NOT an LLM yet — phase 2 plan: API route +
    Claude with same facts + FAQ corpus; shares the fan-support
    knowledge base planned for Jackie/phone agent in Jackalope.
  - Hero countdown ticks live; tab nav now 9 sections.
- Verified in Chrome: concierge answers real Cary parking data; map +
  KBYG render; countdown ticking. Build 97 routes + lint clean.
- Bryce: "more polish and call to action." Shipped commit `95a98ab`:
  - **StickyBuyBar** (`components/global/`, mounted site-wide in layout)
    — slides up after 480px scroll: next event + date + "From $59" +
    Buy Tickets (UTM `sticky-buy-bar`); renders a ▶ Watch Live state
    when `getTickerState()` returns LIVE. Punch-list #7 done (desktop
    + mobile in one component).
  - **Hero ticket CTA** — "Buy Tickets — From $59" primary button
    (UTM `home-hero-buy-tickets`); homepage previously had zero ticket
    CTAs. Hero badge now a live D:H:M **Countdown**
    (`components/motion/Countdown.tsx`, 30s tick, hydration-safe).
  - **Price chips** — "From $X" on every event card (homepage + /events
    ScheduleGrid), fed by existing `ticketPriceFrom`.
  - **Micro-polish** — arrow-nudge on all seven section links +
    press-scale on primary CTAs; mega-panel featured images preloaded
    via `/_next/image` warmup (no navy flash).
- Verified in Chrome (countdown ticking, bar slide-up, chips, reveals).
  Note: cookie banner (z-40) overlays the buy bar (z-30) until
  dismissed — intentional stacking, revisit if Tyler flags it.
- **Remaining CTA ideas (approved list, second pass):** mid-page
  conversion band (watch/play fork), email-capture rewrite w/ presale
  hook, contrast pass, event-page scarcity chips.

### 2026-07-14 (pt. 2) — Motion pass + desktop mega menu
- Bryce's direction: smooth motion + "a beautiful dropdown menu on
  desktop." Reference: Hers mega-menu (Mobbin screenshot).
- **Shipped (commit `db79129`):**
  - **Mega dropdowns** — Events / Tour / About open full-width white
    panels (columned links + upcoming-stops list + featured image card
    with arrow CTA); page dims/blurs behind; hover or click opens, Esc
    closes; active item gets blue underline + rotating chevron; panel +
    columns stagger in. All content driven from existing lib data.
    Mobile drawer unchanged.
  - **Motion system** — `ScrollReveal` (global IntersectionObserver
    driver; server components opt in via `data-reveal` +
    `--reveal-delay`; progressive enhancement — no JS / reduced motion
    never hides content), `CountUp` (stat-band numbers), hero staggered
    entrance + Ken Burns drift, card hover lift + arrow nudge, new
    `ppa-rise` / `ppa-kenburns` theme animations.
  - Applied on: homepage (hero, stat band, lanes, section heads, event
    cards) + events ScheduleGrid.
- Verified in Chrome on the local prod build: all three panels, dim
  backdrop, count-ups, reveals; build 97 routes + lint clean.
- **Next candidates:** reveals on remaining pages (watch/play/athletes),
  panel featured-card image preload (brief dark flash on first open),
  sticky mobile buy bar (Friday punch list #7).

### 2026-07-14 — Fable 5 audit vs Tyler/Wesley combined review + QA cleanup
- Audited the build against Tyler's combined review doc (Option A gap
  analysis + Wesley's QA). All major claims confirmed in code; three
  parallel audit agents produced file:line findings.
- **Shipped (commit `54c7112`, pushed → auto-deploy):** working site
  search (`lib/search-index.ts` static index over events/athletes/
  programs/news/pages + `/search` client UI — replaces ComingSoon stub);
  Rankings added to header nav; footer "Leaderboard" repointed
  `/athletes`→`/rankings`; PickleballTV added as lead Where-to-Watch
  card on `/watch`; ScoreTicker mobile overflow fixed (truncate + hide
  date + overflow-hidden); ScoreRail static on touch devices
  (`pointer: coarse` — no more unstoppable auto-scroll); footer tixr +
  pickleballtournaments links now carry UTMs; CookieBanner lint fix
  (useSyncExternalStore); dead code removed (Gobold font, orphan
  `(content)/news`, empty component scaffold dirs).
- **Still open from the review (the big ones):** commerce deep links —
  every event still shares generic `TIXR`/`REGISTER` constants in
  `lib/placeholder-data.ts:51-52`; needs real per-event tixr event URLs
  + pickleballtournaments registration URLs (Wesley's API lane; the
  `Tournament` type already has per-event `ticketsUrl`/`registerUrl`
  fields, so it's a data swap, zero component changes). Events page is
  upcoming-main-tour only (no past/Challenger/international data
  exists yet, no text search on the grid). Sticky mobile buy bar,
  scarcity, /play rebuild, testimonials/FAQs per the Friday punch list.
- Build 97 routes clean, eslint clean; search verified with real
  queries (nationals/vegas/anna leigh/cary) via tsx.
- Review deadline: site review-ready **Friday 7/17 EOD** (email thread
  with Tyler + Wesley has the owner-assigned punch list).

### 2026-05-22 — Official photo library → 24-pro roster (incl. ALW)
- Bryce's 2nd Dropbox link WORKED (`dl=1` zip, 4.1 GB, 137 player folders
  of official studio headshots, 6000×4000). Selected 24 top pros, center-
  cropped square + downsized to 700px JPEGs (~80–120 KB) → replaced the
  ppatour.com PNGs in `/public/ppa/pros/` (now lowercase-slug `.jpg`).
  Did NOT commit the 4.1 GB library — only the 24 selected, optimized.
- Roster now includes the real stars I was missing: **Anna Leigh Waters
  (W #1)**, Collin Johns, Gabe Tardio, Dylan Frazier, Riley Newman, Tyra
  Black, Jay Devilliers, Dekel Bar, Jessie Irvine, Lea Jansen, Paris
  Todd, Kate Fahey, Megan Dizon, + the earlier set.
- `lib/athletes.ts` rebuilt (24 pros, real divisions, short original
  bios). `divisionRankings` + `playersToWatch` updated to real top-5s
  (ALW #1 in all three women's; Ben Johns #1 men's). Old ppatour PNGs
  removed.
- Verified: build passes (64 routes); /athletes roster grid + profiles
  + homepage rankings all show official headshots.
- Deployed via `vercel --prod`.
- Live: https://ppatour-website.vercel.app

### 2026-05-22 — ppatour.com 1:1 audit → 11 new content pages
- Pulled `ppatour.com/sitemap.xml` (37 static pages) and audited 1:1.
- Built **11 new real /about/* pages** with PPA-accurate content (the
  ones the footer + nav linked into ComingSoon):
  - `/about/pro-tour` — pro-tour overview with stats band + tier table.
  - `/about/history` — National Champions year-by-year table + timeline.
  - `/about/host-tournament` — three-step venue bid funnel.
  - `/about/private-events` — corporate pro-am / hospitality formats.
  - `/about/ambassadors` + `/about/international-ambassadors` — programs
    with perks and regions.
  - `/about/careers` — six-team hiring grid.
  - `/about/contact` — eight-area email directory.
  - `/about/integrity` — confidential reporting w/ principles.
  - `/about/privacy` + `/about/terms` — plain-English legal pages.
  - `/about/player-handbook` — six-section pro/amateur rule reference.
- Header About submenu expanded (Pro Tour, Tournament History, Contact);
  sitemap.ts lists all new routes.
- Build passes (95 routes). Deployed via `vercel --prod`.
- Live: https://ppatour-website.vercel.app

### 2026-05-22 — Deeper standings + SEO/Open Graph
- Points Race extended to **top-8 per division** (all 6) using the
  40-pro roster — fuller, real standings.
- **SEO/sharing polish:** layout metadata gets `metadataBase`, default
  Open Graph + Twitter cards; new `app/opengraph-image.tsx` (branded
  navy OG card via next/og); `app/sitemap.ts` (all static + event +
  athlete + tour routes) and `app/robots.ts`. Event pages now set OG
  image = hero photo + a real description (tier/dates/city/purse);
  athlete pages set OG image = headshot.
- Build passes (83 routes incl. /opengraph-image, /sitemap.xml,
  /robots.txt). Deployed via `vercel --prod`.
- Live: https://ppatour-website.vercel.app

### 2026-05-22 — Venue fixes + roster to 40 pros
- Applied broadcast-sheet venue corrections: Texas Open → Courts of
  McKinney (city McKinney); Malibu → Pepperdine University; Sacramento →
  Life Time Arden; Newport → Tennis Club at Newport Beach; Greater Zion →
  Ivins, UT. Map queries + Texas guide copy updated.
- Re-pulled the 4.1 GB media library, processed **16 more pros** (Jack
  Sock, Tyler Loong, Connor Garnett, Augie Ge, Pablo Tellez, Andre
  Mercado, Eddie Perez, Jaume Martinez Vich, Kaitlyn Christian, Etta
  Tuionetoa, Judit Castillo, Genie Erokhina, Rachel Rohrabacher, Callie
  Smith, Allyce Jones, Lina Padegimaite) → **roster now 40**. Same square-
  crop/optimize pipeline; only the 40 selected committed (library deleted).
- Build passes (80 routes). Deployed via `vercel --prod`.
- Live: https://ppatour-website.vercel.app

### 2026-05-22 — Exact per-event TV schedule from the sheet
- Parsed the PPA Championship-Court broadcast sheet → `lib/broadcast.ts`
  (`eventBroadcasts` keyed by slug, 16 events). Real round-by-round
  windows: PBTV streams every round; Tennis Channel / FS1 / FS2 / FOX /
  CBS carry the TV windows (e.g. Vegas QF/SF/Champ on Tennis Channel;
  Masters Sunday Men's Doubles on CBS + FS1 tape).
- Event Watch section now renders the real schedule (Round · Day ·
  Channel · Window) when a slug has sheet data, templated fallback
  otherwise. Sheet dates align with our calendar.
- Sheet also has venue corrections worth applying later: Texas Open =
  Courts of McKinney; Malibu = Pepperdine; Sacramento = Life Time Arden;
  Newport = Tennis Club at Newport Beach; St. George = Ivins.
- Verified: build passes (64 routes); Vegas/Cincinnati broadcast tables
  show real windows. Deployed via `vercel --prod`.
- Live: https://ppatour-website.vercel.app

### 2026-05-22 — Real pros (profiles + rankings) + TV guide logos
- **Pro roster:** `lib/athletes.ts` — 13 real PPA pros with official
  headshots (600×600) mirrored from ppatour.com → `/public/ppa/pros/`.
  Short ORIGINAL bios (not copied — copyright). `divisionRankings`
  (home-content) + `playersToWatch` rebuilt to reference real athletes
  by slug.
  - ⚠️ **Dropbox blocker:** the shared-folder link only bulk-exports
    Dropbox helper DBs (not the images) via `dl=1`; can't enumerate it
    headless. Fell back to ppatour.com's public headshots. Anna Leigh
    Waters' headshot 404'd at the known path → not in set yet. If Bryce
    wants the official Dropbox versions, need direct per-file links / a
    real zip / a connected Dropbox integration.
- **Profile pages:** new `/athletes/[slug]` (13) — hero headshot, rank
  badge, divisions, bio, per-division points-race standings, "more pros."
  Homepage rankings rows + players-to-watch + /athletes roster + event
  players-to-watch all show headshots and link to profiles. Event
  Defending-Champions updated to real names.
- **TV guide:** pulled the Google Sheet (real PBTV/Tennis Channel/FS1/
  FOX/CBS schedule). Downloaded **real PBTV + Tennis Channel logos** →
  `/public/ppa/networks/`. Event Watch section now shows those logos and
  the broadcast labels reflect the real mix (PBTV every day · Tennis
  Channel/FOX on QF/SF/Final). Per-event exact CSV mapping still TODO.
- Verified: build passes (53 routes); profile pages, rankings headshots,
  TV logos all render.
- Deployed via `vercel --prod`.
- Live: https://ppatour-website.vercel.app

### 2026-05-22 — Real Nationals photos (for the Pardoe demo)
- Bryce: use the photos from pbnationals.com for Nationals. Pulled 4
  real shots → `/public/ppa/nationals-*.jpg` (hero, action-2, crowd-1/2).
- Nationals event image → `nationals-action-2.jpg`; added optional
  `gallery?: string[]` to `Tournament` and a conditional **"The Scene /
  Inside {event}"** gallery band on `/events/[slug]` (1 wide + 2, real
  photos) — only renders when an event has a gallery.
- Homepage hero now uses `next.image` (was hardcoded stock) → leads with
  the real Nationals crowd shot, matching the "Next Event" label.
- Verified: build passes; hero + event hero + 3-photo gallery all use
  the real images.
- Deployed via `vercel --prod`.
- Live: https://ppatour-website.vercel.app

### 2026-05-21 — Real schedule (ppatour.com/schedule)
- Pulled the live PPA schedule and replaced placeholder events with the
  real **2026–27 main-tour calendar** (18 stops, Aug 2026 → May 2027):
  Nationals (Cary, Slam), Cincinnati Cup, Vegas Open, Chicago Open
  (Northbrook), Virginia Beach Open, Proton Daytona Open (Pictona/Holly
  Hill), Malibu Cup, Carvana Masters (Palm Springs), Minneapolis Open
  (Lakeville), Cape Coral Open, Carvana Mesa Cup, Newport Beach Open,
  Texas Open (Dallas), Greater Zion Cup (Black Desert/St. George), PPA
  Open (TBA), Sacramento Open, Atlanta Championships, PPA Finals (San
  Clemente). Real dates/cities/tiers/presenters. `next event` = Nationals.
- Kept one real Challenger (Atlanta) in data to keep the 1,000+ filter
  honest — excluded from homepage/schedule (verified: 18 main-tour slugs,
  0 Challengers on schedule).
- `lib/event-guides.ts` rekeyed to the real slugs + 6 new city guides
  (Daytona, Minneapolis, Cape Coral, Newport Beach, Greater Zion/St.
  George, Sacramento). ppa-open (TBA) has no guide → trip section
  gracefully hidden. Empty-state location display fixed.
- Verified: build passes (40 routes); schedule mirrors ppatour.com.
- Deployed via `vercel --prod`.
- Live: https://ppatour-website.vercel.app

### 2026-05-21 — Event pages = the destination (trip + watch hub)
- Goal: event pages are the main driver (not straight-to-tickets);
  "Ragnar for those coming, PGA Tour for those at home." For Connor AM.
- **Drive-to-event-page:** homepage hero CTA → `Explore the Event`
  (event page); homepage + schedule cards → `Event Guide →` (whole card
  links to event page, no direct tixr); global ScoreTicker NEXT CTA →
  `Event Details →` (event page). `getTickerState` now carries
  `eventSlug` (was `ticketsUrl`). Tickets now convert ON the event page.
- **Event page rebuilt as a dual-audience hub** (`/events/[slug]`),
  6 tabs (Overview · Order of Play · Watch · Plan Your Trip · Players ·
  Tickets):
  - **Order of Play** — day-by-day with gates + first-serve times + live
    channel per day (templated from the date range).
  - **Watch (PGA-style)** — broadcast schedule table (round/channel/date)
    + how-to-watch cards (FOX/FS1, YouTube, MATCHDAY).
  - **Plan Your Trip (Ragnar-style)** — `lib/event-guides.ts` per-event:
    airport + getting there, parking, Where to Stay / Eat / Things to Do,
    and a **live Google Maps embed** of the venue (keyless `output=embed`).
    Guides written for all 12 main-tour stops.
  - Players/Divisions/Champions + Tickets tiers retained.
- Verified: build passes (35 routes); event page all 6 sections + map
  iframe render; surfaces drive to event pages.
- Deployed via `vercel --prod` (git auto-deploy still down).
- Live: https://ppatour-website.vercel.app

### 2026-05-21 — Premium pass: real tier system + 1,000+-only showcase
- Goal: world-class premium sports brand; biggest gap = tournament
  pages; **showcase ONLY 1,000+ events on homepage + schedule.**
- Researched real PPA tiers: **Worlds 3,000 · Slam 2,000 · Cup 1,500 ·
  Open 1,000 · Challenger 125–500.** Rebuilt `placeholder-data.ts`
  around `tierKey` + `TIER_META`, `prizeMoney`, `presentedBy`. Fuller
  2026 season: 12 main-tour stops (Atlanta Slam, Vegas/Chicago/Dallas/
  VB Opens, Cincinnati/Malibu/Mesa Cups, Nationals/Masters Slams, World
  Champs, PPA Finals) + 2 Challengers.
- **1,000+ only enforced** via `getMainTourEvents()` (the single source
  for homepage + schedule). Verified: homepage = 6 main-tour cards,
  schedule = 12, **zero Challengers on either**; Challenger detail pages
  exist but are unlinked. Schedule filter is now tier-based within the
  main tour (All / Slams & Worlds / Cups / Opens).
- **Event pages elevated** (premium): tier badge (`Slam · 2,000 PTS`),
  "Presented by {partner}", prize-purse in hero + facts band, tier label
  in facts. Kept sticky tabs, tickets, divisions, champions, schedule.
- Helpers `tierPoints/tierShort/tierLabel`; consumers (page, ScheduleGrid,
  events/[slug]) updated. Build passes (35 routes).
- Live (via `vercel --prod` — git auto-deploy still down):
  https://ppatour-website.vercel.app

### 2026-05-21 — Event pages "help & love" + Connor's asks
- Source: Pickleball Inc tracker (pickleball-inc.vercel.app) — "Pardoe"
  = Connor Pardoe (CEO). His asks for the new site: **no Toys R Us /
  partner-only ads / 1000+ schedule filter**, and **individual event
  pages = top priority**.
- **Connor's asks:** Toys R Us — already zero refs (clean). Partner-only
  ads — already satisfied (only official partners appear anywhere).
  **1,000+ schedule filter** — built: `/events` now uses
  `components/events/ScheduleGrid.tsx` (client) with All / 1,000+ /
  Grand Slams pills, defaulting to 1,000+.
- **Individual event page upgraded** (`/events/[slug]`): sticky in-page
  tab nav (Overview/Schedule/Divisions/Players/Tickets/Watch, anchors +
  `scroll-mt-[150px]`, sits below the 100px header stack), Divisions
  section, Defending Champions, and a real **Tickets** section (3 tiers
  priced off the event base + Suites/Hospitality card, all UTM-tagged to
  tixr). Kept schedule, players, watch, travel, more-stops.
- Verified: build passes (27 routes); event page tabs/tickets/divisions
  render; schedule filter active.
- **Blocked (needs Bryce/assets), reported back:** Byron Nelson /
  Canyon Springs + North Carolina events need real details + Dropbox
  photos; Tyler/Wesley GitHub access + Zoom training (human/admin);
  "better Match Day section (Chris Cantillo)" needs direction; CMS /
  §7 state machine / real search / content pass / SEO / AWS cutover.
- Live: https://ppatour-website.vercel.app
- **⚠️ Deploy gotcha:** `git push` to `main` did NOT trigger a Vercel
  build today (newest auto-deploy was 2 days stale). Had to deploy
  manually: `vercel --prod --scope gull-stack --yes`. **Going forward,
  deploy via the CLI after pushing** until the GitHub integration is
  reconnected — don't assume push = deploy.

### 2026-05-19 — Tour programs + richer event detail
- **/tour/[slug]** is now a real page for all 6 extended-tour programs
  (Junior PPA / Senior Open / State Championships / PPA Camps / Travel /
  Hospitality) — driven by `lib/tour-programs.ts`. Each has a hero,
  body paragraphs, "what's included" list, CTA, and cross-links to the
  other five. Catch-all falls back to ComingSoon for unknown slugs.
- **/events/[slug]** expanded from a stub to a real event hub: quick-
  facts band (Dates / Venue / Points / Tier), day-by-day schedule
  (computed from start/end), "Players to Watch" sidebar, Where to Watch
  grid, Travel + Hospitality cross-links, "More Stops" carousel.
  (Full §7 LIVE/RECAP state machine still ahead — this is the richer
  UPCOMING surface.)
- Verified: build passes (27 routes total — was 16 at session start).
- Live: https://ppatour-website.vercel.app

### 2026-05-19 — About subpages (sponsors / how-it-works / what-is-pickleball)
- `/about/sponsors` — title-partner spotlight (Carvana big), 6-card
  official-partners grid with logos + roles, "Partnership Inquiry" CTA.
- `/about/how-it-works` — five-step season explainer, points-tier table
  (Main Draw / Grand Slam / Finals), 6-division list, Watch/Play CTAs.
- `/about/what-is-pickleball` — newcomer page: 4 Q&A basics, "rules in
  60 seconds" numbered list, growth stats band, next-step CTAs to
  Watch / Athletes / Play.
- These now beat the catch-all ComingSoon because specific routes
  win over `[slug]` in Next.js.
- Verified: build passes (21 routes).
- Live: https://ppatour-website.vercel.app

### 2026-05-19 — Real internal pages (news, watch, athletes, play, about)
- The five biggest internal stubs are now real pages — no more
  ComingSoon for the things people click into from the homepage:
  - `/news` — featured + secondary + list (15 PPA articles), sidebar
    with Pickleball.com links + section nav, streaming email capture.
  - `/watch` — Live Scores rail (reused), Next Broadcast hero with
    YouTube CTA, Where-to-Watch grid with deep cards (FOX/FS1, YouTube,
    MATCHDAY).
  - `/athletes` — Players to Watch grid, full 6-division Points Race
    component, scale summary.
  - `/play` — three-step "into the tour" funnel, category grid
    (Junior/Senior/State Champs/Camps/Travel/Hospitality), dual
    "Register to Play" CTAs to pickleballtournaments.com.
  - `/about` — story/mission with stats band, mission paragraphs,
    sidebar of subpage links.
- `news[]` extended 5 → 15 items; homepage news section now
  `news.slice(0, 5)`.
- Verified: build passes; 18 routes prerender.
- Live: https://ppatour-website.vercel.app

### 2026-05-19 — Division-split rankings, deeper nav, deeper footer
- **PointsRace** (`components/home/PointsRace.tsx`, client): 6 tabs
  (Men's/Women's × Singles/Doubles/Mixed) — was one combined table.
  `lib/home-content.ts` `pointsRace` removed; replaced by
  `divisionRankings` (6 divisions × ~6 entries each).
- **Header expanded:** new "Tour ▾" and "About ▾" dropdown submenus
  (group-hover on desktop, tap-to-expand on mobile), external "Shop"
  link (Pickleball Central), and a search icon → `/search`.
- **Deeper footer:** restructured into three link groups — Pro Tour,
  PPA, Pickleball Inc. — matching ppatour.com. Social row + legal bar
  at the bottom.
- **ComingSoon catch-alls** so nothing 404s: `/about/[slug]`,
  `/tour/[slug]`, `/news`, `/search`. Titles derived from the slug.
- Verified: build passes (18 routes).
- Live: https://ppatour-website.vercel.app

### 2026-05-19 — Real partner logos
- Bryce asked for real sponsor logos (was wordmarks). Confirmed via
  AskUserQuestion, then mirrored all 7 from ppatour.com's CDN to
  `/public/ppa/sponsors/` (Carvana, Veolia, JOOLA, Humana, Ensure,
  Proton, Six Zero — same files the live site serves).
- `Partner` type extended w/ `logo` + intrinsic `logoWidth/Height`
  (next/Image needs them).
- PartnerSpotlight rebuilt as a white card on a light section so logos
  render on their natural canvas — was dark navy. Section bg
  `bg-ppa-navy-deep` → `bg-ppa-paper`. Marquee items are now actual
  logo images in a white inner bar; spotlight shows logo + role + note
  + dots.
- Verified: build passes; spotlight logo loaded (naturalWidth 1024);
  all 14 marquee images loaded (7 ×2 for seamless loop).
- Live: https://ppatour-website.vercel.app

### 2026-05-19 — Scores → auto-scrolling drag rail
- Live scores grid → `components/home/ScoreRail.tsx` (client): a real
  `overflow-x-auto` rail that auto-advances right via rAF, pauses on
  hover, and is drag-scrollable (mouse pointer-drag) / swipe-scrollable
  (native touch). Match list rendered ×2 for a seamless loop; edge-fade
  mask; `prefers-reduced-motion` disables auto-advance.
- Verified: build passes; scroll container functional (scrollLeft
  sticks); grab cursor applied. Auto-scroll uses rAF so it pauses in
  hidden/background tabs by design — observed in the preview (tab was
  hidden) but runs normally on a visible page.
- Live: https://ppatour-website.vercel.app

### 2026-05-19 — Live scores, newsroom, social
- **Live scores** — new "Live & Latest" section after the stat band:
  6 match cards (2 LIVE w/ pulsing indicator, 2 FINAL, 2 UPCOMING),
  game-by-game scores, division/round/court. `matches[]` in
  home-content.ts.
- **Newsroom** — new "Latest News" section: a two-column split — "From
  the PPA Tour" (our own, 5 articles → `/news`) and "From Pickleball.com"
  (4 external links, open off-site with ↗). `news[]` + `ecosystemNews[]`.
- **Social** — SiteFooter now carries a "Follow the Tour" row: Instagram,
  X, YouTube, TikTok, Facebook (inline SVG icons, @ppatour handles —
  confirm with social team).
- Homepage is now 13 sections. All copy/scores/handles are placeholder.
- Verified: build passes; DOM confirms all sections + score states.
- Live: https://ppatour-website.vercel.app

### 2026-05-19 — ppatour.com audit + dynamic Partners section
- Audited live ppatour.com. Gaps vs. our rebuild logged for Bryce:
  sponsors area, homepage live-scores module, rankings split by 6
  divisions, ecosystem news feed, Shop + Search nav, social links,
  deep 3-group footer, nav submenus.
- Built the **Partners section** (replaces ppatour.com's static logo
  grid). New `lib/home-content.ts` `partners[]` (Carvana title partner
  + 6 official partners w/ roles + notes). Two dynamic pieces:
  `components/home/PartnerSpotlight.tsx` (client, auto-rotates every
  4.5s, clickable dots) + a CSS marquee strip of the full roster.
  Section sits after Watch/Play, before Where to Watch.
- **Turbopack gotcha:** plain `@keyframes`/`.class { animation }` in
  globals.css compiled in `next build` but the **dev server silently
  dropped every rule from the first `@keyframes` onward.** Fix: register
  motion as Tailwind v4 theme animations — `--animate-marquee` /
  `--animate-fade` + `@keyframes` *inside* `@theme` → real
  `animate-*` utilities the dev pipeline honors. Marquee edge-fade is an
  inline `mask-image`; hover-pause via `group-hover:[animation-play-state:paused]`;
  `motion-reduce:animate-none` for a11y.
- Verified: build passes; marquee `animationName: ppa-marquee`;
  spotlight rotation + 7 dots confirmed.
- Live: https://ppatour-website.vercel.app

### 2026-05-18 — ESPN-style content build-out
- Feedback: site felt thin — wanted "much bigger" = more substance,
  ESPN-style storytelling, "why people should care," LIV energy.
  Clarified with Bryce: keep current scale + event hero, add editorial
  depth (all four story modules).
- New `lib/home-content.ts` — storylines (1 lead + 4 secondary),
  pointsRace (10-row standings), playersToWatch (3, with narrative
  hooks), explainers (4). All placeholder copy for the demo.
- Homepage now 10 sections: hero → stat band → **Top Storylines**
  (ESPN lead-story + secondary feed, each with a "why it matters" line)
  → **The Points Race** (broadcast-style standings table, rank/points/
  movement) → schedule → **Players to Watch** (rank-badged cards w/
  story hooks) → **Why It Matters** (numbered new-fan explainers) →
  watch/play → broadcast → email. Old thin "Inside the Tour" + "Meet
  the Pros" sections replaced.
- Scale unchanged per Bryce ("size is fine"). Lead-story scrim
  strengthened (`scrim-soft`→`scrim-hero`) for text legibility.
- Verified: build passes; all 10 sections render; doc ~8,960px.
- Live: https://ppatour-website.vercel.app

### 2026-05-18 — Scale + heading-font rework
- Feedback: everything too big, hero ate the whole viewport, Gobold
  headlines read "ridiculous." Decisions with Bryce: **Gotham Black for
  all headings** (Gobold dropped entirely — single-typeface system),
  **compact hero**, smaller global scale.
- `font-display` now → Gotham; `.font-display` base rule sets weight 900
  + tight tracking. Gobold removed from `layout.tsx` (font file still on
  disk, unused).
- Hero: `min-h-92svh`→`58svh`, h1 clamp `3–8.5rem`→`1.9–3.25rem`
  (renders ~52px). Stat band now sits above the fold.
- Global type cut ~50–60%: section h2 `5xl/7xl`→`2xl/3xl`, schedule/story/
  pro/broadcast/CTA sizes all down; section padding `py-20`→`py-12`;
  schedule cards `aspect-3/4`→`16/10` in a `sm:2 / lg:3` grid. Applied to
  homepage, `/events`, `/events/[slug]`, ComingSoon, LeadMagnetCapture.
- Verified: build passes (16 pages); compact hero confirmed (418px /
  720px viewport); h1 = Gotham Black 52px, h2 = 30px.
- Deployed: https://ppatour-website.vercel.app
- **Standing instruction from Bryce:** always push/deploy for this repo
  without re-asking — it's a demo site.

### 2026-05-18 — Official brand applied (Carvana PPA Tour)
- Bryce supplied the official **Carvana PPA Tour Brand Guide** + tournament
  logo kit. Rebranded the site off the guide (images skipped — API image-size
  limit; worked from the guide PDF text + SVGs).
- **Palette** (replaces the guessed red system): navy `#0C2B44`, deep navy
  `#07223A`, bright blue `#228BE6` (accent/CTA), CTA-hover `#005D9B`,
  sky `#4DC1EF`, yellow `#E7E700`, paper `#F3F5F7`, line `#D7DEE4`.
  §13 brand-hex open question is now **resolved**.
- **Fonts** (replaces Anton/Archivo): **Gobold Bold** display + **Gotham**
  body (Book/Medium/Bold/Black), self-hosted in `app/fonts/` via
  `next/font/local`. Font files are from the official kit.
- Token rename across all files: `ppa-ink`→`ppa-navy`, `ppa-coal`→
  `ppa-navy-deep`, `ppa-red`→`ppa-blue`, `ppa-red-dark`→`ppa-blue-deep`.
  Added `ppa-navy-soft`, `ppa-sky`. Scrims retinted near-black→navy.
- Official logo: horizontal white lockup now in Header + Footer (was a text
  wordmark). `public/ppa/logos/` holds white/blue horizontal + primary white.
  `app/icon.svg` = holding-shape favicon (default create-next-app one removed).
- Verified: `next build` passes (16 pages); hero renders on-brand; DOM +
  computed styles confirm all 8 sections, navy/paper backgrounds, Gobold/
  Gotham fonts, logo SVG. (Mid-page preview screenshots still flake — known
  environmental issue.)
- **Still interim:** imagery is the scraped stand-ins from the old site.
  **Not yet deployed** — awaiting Bryce's go-ahead to push/deploy.

### 2026-05-18 — Redesign v2 (LIV Golf direction)
- Direction set with Bryce: lead with LIV Golf energy; light/premium
  editorial body with dark hero + feature blocks; more distinctive type;
  art-directed imagery; **main-tour events only (1,000+ ranking points).**
- Type system: **Anton** (display) + **Archivo** (body) — replaced Oswald.
- Palette: light `ppa-paper` body, near-black `ppa-ink` hero/feature blocks,
  `ppa-red #e4002b`. (Brand hex still unconfirmed — §13.)
- Homepage: oversized LIV-style hero, dark stat band, numbered main-tour
  schedule cards, editorial feature grid, athlete roster (grayscale→color).
- `placeholder-data.ts` now holds 6 main-tour events (Atlanta, Las Vegas,
  Chicago, Virginia Beach, Nationals, Masters) with `points` field.
- **Gotcha:** `<Image fill>` behind sibling overlays did not paint until the
  img was promoted to its own compositing layer — fixed with
  `will-change-transform` on all fill images. Image scrims also moved to
  plain-rgba `.scrim-*` classes in globals.css (Tailwind oklab gradients
  were unreliable).
- Live: https://ppatour-website.vercel.app

### 2026-05-18 — Homepage redesign (cinematic)
- First homepage build was too flat/generic. Redesigned toward "BNP Paribas
  Open x LIV Golf": dark `ppa-ink` base, Oswald display font, full-bleed
  imagery, bold uppercase type.
- Pulled real PPA Tour action photography + content from `ppatour.com` into
  `public/ppa/` (14 interim assets — hero/action shots, destination photos,
  3 athlete headshots, logo). These are stand-ins; swap for proper assets
  via Sanity later.
- Homepage now: full-bleed hero, image-backed Watch/Play fork, destination
  event rail, editorial story grid, athlete cards, where-to-watch.
- Restyled Header/Footer/ComingSoon + schedule + event pages dark.
- **Note:** `ppa-red` nudged to `#d81e3c`. Brand hex still unconfirmed (§13).
- Live: https://ppatour-website.vercel.app

### 2026-05-18 — Phase 2: homepage + global components
- Built the first real homepage on the new stack. Live (production):
  https://ppatour-website.vercel.app
- Brand theme added to `globals.css` (`@theme`): `ppa-red #c8102e`,
  `ppa-navy #0a1733`, `ppa-yellow #ffd21f` (+ dark variants). **Approximate
  hex — confirm against the official brand guide (§13 open question).**
- Global components in `components/global/`: `ScoreTicker` (NEXT/LIVE modes,
  §9.1), `Header` (mobile drawer, §9.5), `CookieBanner` (footer-only, §9.4),
  `SiteFooter`, `LeadMagnetCapture` (§9.8), `ComingSoon`.
- Homepage (`app/page.tsx`): next-event hero, two-path Watch/Play fork,
  Next Stop stack, Story of the Match carousel, sponsors row, email capture.
- `lib/utm.ts` — `withUtm()` appends attribution to every outbound commerce
  link (revenue lever #1). `lib/placeholder-data.ts` — 3 placeholder
  tournaments + ticker/date helpers (NO live data; replace with Sanity +
  scoring API).
- Routes: `/events` (schedule list), `/events/[slug]` (UPCOMING-state stub —
  NOT the full §7 state machine yet), `/watch` `/play` `/athletes` `/about`
  (branded Coming Soon). `/api/lead-capture` is a stub that logs (no
  Customer.io yet).
- **State:** homepage + nav shipped on placeholder data. No CMS, no scoring
  API, no GA4/GTM, no tests/CI.
- **Next:** the §7 tournament state machine (LIVE state + sticky division
  tabs — the #1 UX fix), then `/watch` + `/play` hubs, schedule filters, and
  athlete profiles. Wire Sanity + scoring API + GTM. Resolve §13 open
  questions (brand hex, scoring/tixr/Customer.io creds, CMS confirm).

### 2026-05-18 — Phase 0: repo + scaffold
- Created GitHub repo `brycedmorgan/ppatour-website` (public) and local folder
  `/Users/bryce/Documents/pickleball/ppatour-website`.
- Scaffolded with `create-next-app` (Next.js 16.2.6, App Router, TypeScript
  strict, Tailwind v4, ESLint, `@/*` import alias, no `src/` dir).
- Initialized shadcn/ui (`components/ui/button.tsx`, `lib/utils.ts`).
- Laid down the §5 directory scaffold (`.gitkeep` placeholders) for marketing /
  content / events / athletes / api routes, component groups, and `lib/`.
- Saved the passoff brief as `CLAUDE_CODE_PASSOFF_v2.md`.
- Deployed to Vercel (`gull-stack` scope): project `ppatour-website`, live at
  https://ppatour-website-mpohate97-gull-stack.vercel.app — auto-deploys on
  push to `main`.
- **State:** empty scaffold, default create-next-app homepage. Nothing built yet.
- **Next:** Phase 0 remaining items — Sanity studio decision, GTM container,
  env vars, Playwright + Vitest + CI. Then
  Phase 2 build starts with the global components (§9). Resolve §13 open
  questions with Bryce/Jason (repo org transfer, scoring API creds, tixr API,
  CMS confirm, brand hex values).
