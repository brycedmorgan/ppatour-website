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

## Session Log

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
- **Next:** exact per-event TV mapping from the broadcast sheet
  (/tmp/tvguide.csv has it).
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
  `/Users/bryce/Documents/ppatour-website`.
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
