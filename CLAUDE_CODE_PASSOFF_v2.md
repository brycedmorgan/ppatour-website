# PPA Tour Website Rebuild — Claude Code Passoff (v2)
**Audience:** A Claude Code agent operating in a fresh repo with no prior context. This document is the sole brief. Read it end-to-end before touching code.
**Owner:** Bryce Morgan (President + CMO, PPA Tour) · **Marketing lead:** Tyler Dodd · **Content:** Will Doughton · **Infra/AWS:** Jason
**Companion doc (source of truth):** `Option B — Content-First Strategy` (April 2026). Based on Microsoft Clarity heat-map data (90 days) + Google Analytics 4 (90 days) + StoryBrand Complete Website Plan + Integrated Marketing Framework. This passoff translates that strategy into an engineering plan; when in doubt, the strategy doc wins.

---

## 1. The Strategic "Why" — Read This First
You are not rebuilding a website. You are correcting a category error.

**The core insight:** `ppatour.com` is a content site masquerading as a destination. **0%** of commerce happens on `ppatour.com` today — every ticket purchase happens on `tixr.com`, every amateur registration happens on `pickleballtournaments.com`. The site gets **4.18M sessions/quarter** but owns **none** of the conversion funnel.

The right architecture is to lean into that split, not fight it:
- **`ppatour.com`** = best content, discovery, and streaming experience in pickleball.
- **`tixr`** = ticketing specialist (PCI-compliant, already optimized).
- **`pickleballtournaments.com`** = amateur registration specialist (already optimized).

Our job is three things:
1. **Drive qualified traffic to the commerce partners** via the best content experience in pickleball.
2. **Own the audience** through email, streaming, and athlete engagement.
3. **Make the handoff** from `ppatour.com` to the commerce layer feel like one seamless experience — not a redirect hop.

**Why this matters for every engineering decision you make:** Do not embed checkout. Do not build a cart. Do not replicate registration forms. Build the content/discovery/streaming layer to be world-class, and make the redirect to commerce feel native (shared design language, UTM preservation, return-to-site CTA after purchase). Every hour spent reinventing commerce is an hour stolen from content.

**The five revenue levers (priority order, from the strategy doc):**
1. **Cross-domain tracking + UTMs on every ad/email** — fixes the $708K self-referral artifact. No design dependency. Ships Week 1.
2. **Cart + registration abandonment emails on the commerce platforms** — ~$5.6M/year at 10% recovery of 112K abandoned carts + 99K abandoned registrations per quarter. Partnership work, not engineering.
3. **Mobile tournament tabs + live-state template** — single biggest UX bug. ~$420K/year per percentage point of outbound-click lift to commerce.
4. **Co-design the commerce handoff** with tixr + pickleballtournaments — shared styling, UTM preservation, return-to-site page.
5. **Email capture everywhere** — when partners own checkout, email is our only moat. Target: 10× list growth in 90 days.

---

## 2. Decisions Already Made — Do Not Re-Litigate
- **Off WordPress, permanently.** No PHP, no plugins, no migration of the old CMS.
- **Content-first, not transactional.** Don't embed commerce. Partner with tixr + pickleballtournaments.
- **No rebrand.** Keep PPA colors, logo, identity (red `#C8102E`-ish + dark navy + yellow accent; confirm exact hex from current brand guide).
- **Pros over amateurs on the homepage.** Amateur experience lives at `/play`.
- **Schedule defaults to $1,000+ events** (Connor's call). Challenger / sub-$500 / international filtered out by default; user can toggle them in.
- **Remove header Register + Tickets buttons** (current 0.1% click rate).
- **Kill the homepage news sidebar.**
- **Cincinnati event removed** from the schedule (partnership ended).
- **World Rankings (separate project)** launches ~4 weeks before North Carolina Open. Coordinate with that team; do not block on it.
- **Hosting:** Vercel for staging/preview (Phase 0–2), AWS for production (Jason wires AWS once stable).
- **Mobile-first.** 74% of traffic is mobile and converts at ~half the desktop rate. Every layout decision starts at 375px.

---

## 3. Tech Stack — RECOMMENDED CHANGE FROM v1 PASSOFF
The v1 passoff proposed a **Next.js + 11ty hybrid**. **Do not do that.** Two build systems, two mental models, a monorepo to glue them together, two deploy paths, and double the surface area for a coding agent to reason about. The justification ("11ty for fast static") doesn't hold — Next.js with SSG + ISR is competitive on static performance and is one stack.

### Recommended stack
| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15+ (App Router)** | Single stack for static (SSG/ISR) + dynamic (RSC, Server Actions, streaming). Best fit for live scores/brackets/search + content. Vercel-native; deploys cleanly to AWS later. |
| Language | **TypeScript (strict mode)** | Non-negotiable. Strict null checks on. |
| Styling | **Tailwind CSS** | Utility-first. No CSS modules. No styled-components. |
| Components | **shadcn/ui** (Radix under the hood) | Copy-paste components, fully owned, accessible by default. |
| CMS | **Sanity** (headless) | Best editor experience for non-technical content team (Will Doughton). Strong image pipeline. Live preview works with Next.js App Router. Alternative: Contentful. Avoid: MDX-in-repo for anything Will edits. |
| Live scoring data | **Existing scoring API** (currently used by WordPress plugin). Fetch server-side via RSC; revalidate on a short interval. | Bryce to confirm endpoint + auth. See §11 Open Questions. |
| Search | **Algolia** (or **Typesense** self-hosted) | Schedule + athlete search needs to be instant. Heat map shows users tapping search; bury it = fail. |
| Email capture | **Customer.io** (Bryce confirm — already in use for amateur side) | Three lead magnets, exit intent, post-stream signup. |
| Analytics | **Google Tag Manager → GA4** | Reuse existing GTM container ID if possible. Cross-domain config is part of Phase 1. |
| Image pipeline | **Next.js `<Image>`** + Sanity CDN | All images responsive, lazy, AVIF/WebP. |
| Hosting | **Vercel** (Phase 0–2) → **AWS** (Phase 3, Jason wires) | Use Vercel previews on every PR. |
| Repo | New GitHub repo under existing org (path TBD — Bryce/Jason confirm) | One repo, one app, one deploy. |

### What you are NOT building
- A CMS. Sanity is the CMS.
- A checkout. Tixr is the checkout.
- A registration form. Pickleballtournaments.com is the registration form.
- A video player. Embed YouTube / Pickleball TV.
- An auth system. Phase 2 has no logged-in user state. Email capture is unauthenticated.

---

## 4. Two-Phase Roadmap (10 weeks total)
This sequencing comes directly from the strategy doc — do not reorder.

### Phase 1 — Instrument & Unblock (Weeks 1–3)
**Goal:** Make the data tell the truth. Fix no-cost friction. Everything downstream depends on this.

| Week | Workstream | Detail | Owner | Impact |
|---|---|---|---|---|
| 1 | Cross-domain GA4 + UTM tagging | Add `tixr.com`, `pickleballtournaments.com`, `pickleballbrackets.com` to GA4 referral exclusion / cross-domain list. UTM-tag every paid social, paid search, Customer.io send. Outbound click events on every Buy/Register button. | Engineering + Marketing | Eliminates $708K self-referral artifact. Unblocks all measurement. |
| 1 | Abandonment rescue emails | Build cart-abandoned + registration-abandoned sequences on tixr + pickleballtournaments (Customer.io / partner platforms). | Partnership (Bryce) — NOT engineering work | ~$5.6M/year at 10% recovery |
| 1–2 | Zero-cost site wins on current WP site | Sticky site-wide score ticker, shrunk cookie banner, tap-to-maps addresses, fix camp date copy errors, paid social landing-page audit. | Engineering (light touch on WP) | Friction lift while v2 is built |

**Phase 1 KPIs:**
- Self-referral artifact: $708K → **<$10K within 14 days** of cross-domain config.
- 95%+ of ad/email sessions carry full UTMs within 30 days.
- Outbound Buy/Register click rate: establish baseline.

### Phase 2 — Rebuild the Content Site (Weeks 3–8)
**Goal:** Ship the redesign on the new stack. Commerce still redirects out, but the handoff has proper UTMs by now.

| Weeks | Deliverable |
|---|---|
| 3–5 | **Mobile tournament template (state machine).** UPCOMING + LIVE states. Sticky horizontal division tabs (fixes the #1 mobile UX bug). Bracket round shortcut buttons. Bracket cells link to athlete profiles. Sticky mobile commerce/watch bars. |
| 4–5 | **Homepage + Schedule rebuild.** Strip homepage to: ticker, two-path routing, live/next-event hero. Schedule: search-forward hero, filter chips, "Up Next" card, tappable full-card targets, $1,000+ default filter. |
| 5–7 | **/watch + /play hubs + lead magnets.** Fan and amateur hubs. Where-to-Watch matrix. Three lead magnets (fan PDF, amateur PDF, streaming signup). |
| 7–8 | **Event lifecycle email sequences + referral amplification.** Announce → Build → Urgency → Live → Aftermath per tournament. Identify top real referrers (majorleaguepickleball.co at $107K is #1) and amplify. |

**Phase 2 KPIs:**
- Mobile division-tab clicks: 0 → **3+ in mobile top 10** within 30 days of template launch.
- Outbound click lift to commerce: **+40%**.
- Email list growth: **10× monthly opt-in rate** within 90 days.
- Bracket → athlete traffic: halve the current 18× gap.

### Phase 3 — Production migration to AWS (post-launch)
Jason owns this. Out of scope for the rebuild build itself.

---

## 5. Repo Scaffold (Phase 0 — Week 1)
```
/ (root)
├── app/                         # Next.js App Router
│   ├── (marketing)/             # /, /about, /faq, /partners — SSG
│   ├── (content)/
│   │   ├── watch/               # /watch hub
│   │   ├── play/                # /play hub
│   │   └── news/                # /news/[slug] — storylines from Sanity
│   ├── events/
│   │   ├── [slug]/page.tsx      # Tournament page — state machine (§7)
│   │   └── page.tsx             # /events schedule (§8)
│   ├── athletes/
│   │   └── [slug]/page.tsx      # /athletes/[slug]
│   ├── api/
│   │   ├── scores/route.ts      # Proxy to scoring API w/ cache
│   │   ├── tixr-inventory/[id]/route.ts
│   │   └── lead-capture/route.ts
│   ├── layout.tsx               # Root layout — sticky ticker injected here
│   └── globals.css
├── components/
│   ├── global/
│   │   ├── ScoreTicker.tsx      # §9.1 — site-wide, LIVE/NEXT state
│   │   ├── StickyCommerceBar.tsx
│   │   ├── StickyWatchBar.tsx
│   │   ├── CookieBanner.tsx     # §9.4 — shrunk, footer-only
│   │   └── Header.tsx           # §9.5 — Logo · Watch · Play · Athletes · Events · About
│   ├── tournament/
│   │   ├── TournamentPageUpcoming.tsx
│   │   ├── TournamentPageLive.tsx
│   │   ├── DivisionTabsSticky.tsx   # the #1 UX fix
│   │   ├── BracketRoundButtons.tsx  # R16 · QF · SF · F
│   │   └── BracketCell.tsx          # always links to /athletes/[slug]
│   ├── schedule/
│   ├── watch/
│   ├── play/
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── sanity/                   # CMS client + queries
│   ├── scoring/                  # scoring API client
│   ├── tixr/                     # tixr inventory client
│   ├── analytics/                # GTM/GA4 helpers, outbound click tracking
│   └── utm.ts                    # UTM preservation utilities
├── content/                      # type defs + small static content
├── public/
├── sanity/                       # Sanity schema files
├── tailwind.config.ts
├── tsconfig.json (strict: true)
└── next.config.mjs
```
**Phase 0 tasks (do in order):**
1. Create new GitHub repo under existing org (path: Bryce/Jason confirm).
2. `npx create-next-app@latest` — App Router, TypeScript, Tailwind, ESLint, src dir = no, import alias `@/*`.
3. Add shadcn/ui (`npx shadcn-ui@latest init`).
4. Set up Sanity studio (`/studio` route or sibling repo — confirm with Bryce).
5. Wire Vercel: preview deploys on every PR, prod deploy on `main`.
6. Set up GTM container; if existing container ID is reusable, plumb that in.
7. Environment variables: scoring API key, tixr API key, Sanity project ID/dataset, GTM ID, Customer.io site ID.
8. Set up Playwright + Vitest. CI: lint + typecheck + unit + e2e smoke on every PR.

---

## 6. The Ten Design Principles (from strategy doc, page 9) — Enforce in Code Review
Every PR must pass these as an implicit checklist:
1. **Mobile-first, not mobile-friendly.** Build every component at 375px first, expand up.
2. **Live data above the fold, always.** Scores, brackets, next-match info in the first 15% of every page.
3. **One sticky score ticker, site-wide.** It rides the header on every page (§9.1).
4. **Tournament template is a state machine.** Same URL, different render (§7).
5. **Two heroes, two hubs, two journeys.** `/watch` (fan, 60%) and `/play` (amateur, 40%). Homepage routes; hubs convert.
6. **Every bracket cell is an athlete link.** No exceptions. The bracket is the funnel.
7. **Remove friction before adding features.** Cookie banner, tap-to-maps, flatten bracket rounds first.
8. **Make the data trustworthy before shipping features.** Phase 1 is non-negotiable.
9. **Co-design the commerce handoff.** Don't redesign the redirect — partner with tixr/pickleballtournaments on shared styling. (This is Bryce's partnership work; engineering preserves UTMs + session IDs.)
10. **Email is the moat.** Every page has at least one capture surface.

---

## 7. Tournament Page — State Machine Spec (the #1 priority page)
Same URL pattern: `/events/[slug]`. Two render modes based on tournament dates + live-status flag.

### State machine logic (server-side, per request)
```
fetch tournament from Sanity (or scoring API)
if (now < tournament.startDate - 30 days):
    return UpcomingState (commerce-first variant — see §7.1)
if (now >= tournament.startDate AND now <= tournament.endDate AND tournament.liveMatches.length > 0):
    return LiveState (scoreboard-first — see §7.2)
if (now >= tournament.startDate AND now <= tournament.endDate AND tournament.liveMatches.length === 0):
    return UpcomingState (between-matches subvariant)  // shows day schedule + last-completed
if (now > tournament.endDate):
    return RecapState (results + highlights — Phase 2 stretch)
```

### 7.1 UPCOMING state (commerce-first)
**Above the fold (mobile, 375px tall):**
- Sticky score ticker (global) — shows `NEXT: Tournament Name · MAY 2 · ▶ Buy Tickets` if this is the next event, else generic next-event content.
- **Hero block:**
  - "NEXT · Atlanta · May 2 · 7 DAYS" pill (countdown updates client-side).
  - Tournament name (e.g., "Veolia Atlanta Championships").
  - Subtitle: dates + venue.
  - **Primary CTA: `▶ Buy Tickets`** (red, full-width-ish) — opens tixr in new tab with full UTM + session ID preservation.
  - **Secondary CTA: `Register to Play`** — opens pickleballtournaments with full UTM preservation.
  - **Scarcity pill** (if tixr inventory API returns it): "VIP 12 seats left" (live from §11.tixr inventory cache).

**Below the fold:**
- Quick Action Grid (2×2 on mobile): Ticket Info · Register · How to Watch · Schedule.
- Venue block: name + address. **Address is a tap-to-maps universal link** (`https://maps.apple.com/?q=...` on iOS, `geo:` on Android, `https://www.google.com/maps/search/?api=1&query=...` fallback). One-line tap target, not a paragraph.
- Anchor sections: Format · Players to Watch · Broadcast Schedule · Where to Watch matrix.

**Sticky bottom CTA bar (mobile, always-visible):**
- `FROM $49 · ▶ BUY TICKETS` (left price, right CTA). Stays pinned regardless of scroll depth. Opens the embedded picker (tixr deep link).

**Buy Tickets handoff requirements (critical):**
- Preserve UTM params end-to-end.
- Append `utm_source=ppatour&utm_medium=website&utm_campaign=<slug>&utm_content=<button-id>`.
- Pass through any session IDs.
- Tixr must be in GA4 cross-domain allowlist by Phase 1 Week 1.
- On purchase, tixr returns user to `/events/[slug]/whats-next` (post-purchase content page — Phase 2 deliverable; stub the URL now). This page reinforces "you're going" + offers email signup + broadcast info + nearby events. Owned by us, not tixr.

### 7.2 LIVE state (scoreboard-first) — fixes the #1 UX bug on the site
**Above the fold (mobile):**
- Sticky global score ticker (LIVE mode): `● LIVE  Court 1: Johns/Johns vs Tardio/Devilliers  11–7  ▶ Watch on YouTube`. Pulsing red dot. Tap = Watch link.
- **Hero block:**
  - `● LIVE · GREATER ZION` red pill.
  - "Day 5 · Finals" (current round/day).
  - **Primary CTA: `▶ Watch on YouTube`** (or Pickleball TV / FS1, resolved from §11.broadcast).
- **STICKY HORIZONTAL DIVISION TABS** (the single biggest UX fix on the site):
  - Men's D · Women's D · Mixed D (tabs depend on tournament structure).
  - Horizontal scrollable on mobile. Stays sticky as user scrolls bracket rounds.
  - **Selected division persists in URL** (`?div=mens-d`) for shareability.
- **Bracket round shortcut buttons** directly under tabs: `R16 · QF · SF · F`. One-tap. **Not an accordion.** Each round is a tappable button; selected round shows below.
- Bracket cells under selected round/division:
  - Each cell shows two player names + score (if completed) or scheduled time (if upcoming).
  - **Every player name is a `Link` to `/athletes/[slug]`.** No exceptions.
  - Cells use `<BracketCell>` component (§9.7).

**Sticky bottom CTA bar (mobile, LIVE variant):**
- Black bar: `● LIVE NOW · Men's Singles Final · ▶ WATCH` (red Watch button). Replaces the commerce bar during live events.

**State-change visual signals:**
- Red gradient hero + pulsing LIVE chip + black scoreboard ticker — visually distinct from upcoming state's blue/navy palette.

---

## 8. Homepage Spec
**Mobile (72% of traffic) — above the fold MUST contain:**
1. Sticky global ticker (LIVE or NEXT mode).
2. Header (logo + hamburger).
3. **Live-state hero** (if any tournament is currently live) OR **next-event hero** (else): tournament name, date, court info, `▶ Watch Live` + `Brackets` CTAs.
4. **Two-path routing fork:** `🏆 I Want to Watch → /watch` and `🎾 I Want to Play → /play`. Side-by-side cards.

**Below the fold:**
- "NEXT STOP" stack — vertical list of next 2–3 events with `BUY TICKETS` or `TICKETS · EARLY BIRD` per card.
- Short-form video carousel ("Story of the Match" — YouTube Shorts embeds).
- Sponsor banners — targeted (not a generic carousel).
- Email capture (footer or inline).

**REMOVE from the homepage** (these are in the current site and must not appear):
- Long hero carousel.
- 10+ section vertical scroll.
- News sidebar (kill it entirely).
- Testimonials on homepage (move to hubs).
- "About" paragraphs on homepage (move to /about).
- Header Register + Tickets buttons (0.1% click rate).

**Desktop (28% of traffic):** Same content, denser layout. The two-path fork sits side-by-side under the hero. Don't over-engineer desktop — it's a minority.

---

## 9. Global Components — Build These First
These ride every page. Build, snapshot-test, and ship before page work begins.

### 9.1 `<ScoreTicker />` — site-wide header element
Two modes, same component:
```tsx
type TickerMode =
  | { mode: 'LIVE'; court: string; players: [string, string]; score: string; watchUrl: string }
  | { mode: 'NEXT'; tournamentName: string; eventDate: ISODate; ticketsUrl: string };
```
- **LIVE mode:** pulsing red `●` + `LIVE` chip + court + matchup + score + `▶ Watch on YouTube` link (or PBTV/FS1 from broadcast resolver).
- **NEXT mode:** blue `NEXT` chip + tournament name + date + `▶ Buy Tickets`.
- **Selection logic** (server-side, revalidated every 30s during events): query scoring API for live matches; if any, return LIVE mode with the most-viewed/feature match. Else, query Sanity for next tournament chronologically.
- **CLS:** ticker MUST have a reserved height. No layout shift on hydration. Use SSR; don't render via client effect.
- **Mobile:** Single line, horizontally scrollable if content overflows.

### 9.2 `<StickyCommerceBar />` — mobile only, UPCOMING tournament pages
- Bottom-anchored fixed bar, full viewport width.
- Left: price anchor (`FROM $49`).
- Right: primary CTA (`▶ BUY TICKETS`) — opens tixr deep link with UTMs.
- Always visible; never overlaps tap targets above it (add `pb-20` to page content).

### 9.3 `<StickyWatchBar />` — mobile only, LIVE tournament pages
- Replaces `<StickyCommerceBar />` when tournament is live.
- Black background. `● LIVE NOW · [Match Name] · ▶ WATCH`.

### 9.4 `<CookieBanner />` — compliance minimum
- One-line footer bar: `"We use cookies for analytics. Manage · Accept"`.
- Dismissible. Sets cookie; never re-shows for 365 days.
- **Never overlays content on mobile.** Footer-only.
- The current banner is a top-5 click hotspot — that's friction, not engagement. Fix it.

### 9.5 `<Header />` — site nav
Nav items: **Logo · Watch · Play · Athletes · Events · About**.
- No header Buy Tickets / Register buttons. (Current 0.1% click rate.)
- Mobile: hamburger drawer.
- Header height is fixed; sticky ticker sits below it (or above, depending on z-order — confirm with mobile sketch in strategy doc page 10).

### 9.6 `<TapToMapsAddress />` — utility component
- Wraps any venue address.
- iOS: `maps://?q=...`
- Android: `geo:0,0?q=...`
- Fallback: `https://www.google.com/maps/search/?api=1&query=...`
- Use `navigator.userAgent` server-rendering-safe sniff OR pass all three and let the browser pick.

### 9.7 `<BracketCell />` — used in every bracket
```tsx
<BracketCell
  topPlayer={{ id: 'ben-johns', name: 'B. Johns', partnerId: 'c-johns', partnerName: 'C. Johns' }}
  bottomPlayer={{ id: 'fed-tardio', name: 'Tardio', partnerId: 'devilliers', partnerName: 'Devilliers' }}
  score={[11, 11, 7, 9]}     // or 'NEXT', 'LIVE', etc.
  status="completed"          // 'live' | 'upcoming' | 'completed'
/>
```
- **Every player name renders as a `Link` to `/athletes/[slug]`.** This is the #1 traffic-redistribution lever (current bracket-to-athlete ratio is 18×).
- Status 'live' = pulsing red dot.

### 9.8 `<LeadMagnetCapture />` — email capture surface
- Three variants: fan ("Your First PPA Event" PDF), amateur ("5 Mistakes at Your First Tournament" PDF), streaming (post-stream signup).
- Posts to `/api/lead-capture` → Customer.io.
- Inline placement + exit-intent variant.

---

## 10. Page Inventory (Priority Order)

### P0 — must ship in initial Phase 2 launch
1. **Homepage** — routing engine (§8).
2. **Tournament page** — state machine, `/events/[slug]` (§7). Same template handles every event.
3. **Schedule page** — `/events`, search-forward, filter chips, $1,000+ default filter, tappable cards.
4. **`/watch` (Fan Hub)** — Where-to-Watch matrix, storylines from Sanity, authority stats (150K+ fans · 25 events · $5.2M prizes — confirm numbers with Bryce), testimonials (3+), lead magnet.
5. **`/play` (Amateur Hub)** — 3-step plan (Register → Compete → Rise), skill quiz, open-registration list, amateur testimonials, lead magnet.
6. **Athlete profile pages** — `/athletes/[slug]`. Bio, recent matches, upcoming matches, head-to-head, social, win/loss, ranking. Linked from every bracket cell.

### P1 — post-launch (Phase 2 tail or Phase 3)
- About page (refresh — current is outdated, wrong photos).
- News / Storylines index (driven by Sanity).
- Partners page.
- FAQ.
- Per-event subsite capability — flexible template that allows light rebranding inside the system (e.g., Carolina, Masters). Implement as Sanity-driven theme overrides on `/events/[slug]`.

---

## 11. Critical Integrations

### 11.1 Scoring API
- Current WP plugin pulls from official scoring API.
- API returns tournament names in raw bracket format ("team make doubles pro talking range") — **confirm whether normalization happens API-side or client-side** (Open Question §13).
- Build as: `lib/scoring/client.ts` — typed client. Used by `<ScoreTicker />`, tournament live state, and `/api/scores` route.
- Revalidation: 30s during live events, 5m otherwise. Use Next.js `revalidate` + tag-based revalidation for instant updates.

### 11.2 Tixr (ticketing) — handoff, not embedded
- Buy Tickets buttons redirect to `tixr.com` with full UTM + session ID preservation. **Never embed.**
- Pull live inventory via tixr API where possible to display scarcity pills ("VIP 12 seats left"). Cache 5m.
- Add tixr to GA4 cross-domain allowlist (Phase 1 Week 1).
- Bryce owns the partnership conversation to co-design checkout styling.
- Post-purchase: tixr returns user to `/events/[slug]/whats-next` (PPA-owned page; Phase 2 deliverable).

### 11.3 Pickleballtournaments.com (amateur registration) — handoff, not embedded
- Register buttons redirect. Preserve UTMs + session IDs.
- Add to GA4 cross-domain allowlist (Phase 1 Week 1).
- Their existing Customer.io handles abandonment rescue (partnership work, not engineering).

### 11.4 Broadcast schedule resolver
- Tyler flagged: broadcast schedule is manually updated in too many places. **One source of truth lives in Sanity** (`broadcastSchedule` document type per tournament).
- Component: `<WhereToWatchMatrix />` — resolves per-event to the correct platform (YouTube · PBTV · FS1) with one-click Watch links.

### 11.5 YouTube / Pickleball TV / FS1
- Embed YouTube live + highlights (`<YouTubeEmbed videoId="..." />`).
- Surface YouTube Shorts in a "Story of the Match" carousel on homepage.
- "Where to Watch" matrix on `/watch` and per-tournament page.

### 11.6 Future: Chatbot
- Eventually: chat assistant ("How do I play this tournament?" → registration link; "How do I buy tickets?" → tixr link).
- **Stub the surface area now** (a hidden `<ChatLauncher />` slot in `<Layout>`) but do not implement.

### 11.7 Analytics — GA4 via GTM
- All page views, all outbound clicks, all lead captures.
- Cross-domain config (Phase 1 Week 1):
  - GA4 admin → Data Streams → ppatour.com → Configure tag settings → Configure your domains.
  - Add: `tixr.com`, `pickleballtournaments.com`, `pickleballbrackets.com`.
  - Add to referral exclusion list so they stop showing up as new sessions.
- UTM helper (`lib/utm.ts`):
  - On every outbound link to tixr / pickleballtournaments, append/preserve UTMs.
  - Custom event `outbound_click` with `{ destination, tournament_slug, button_id }`.
- Server-side events from tixr / pickleballtournaments side (partnership work — Bryce).

---

## 12. Performance, SEO, Accessibility — Hard Requirements
- **Lighthouse mobile score:** 90+ on every P0 page. CI gate.
- **Core Web Vitals:** all green. LCP < 2.5s, CLS < 0.1, INP < 200ms. Especially watch CLS on sticky elements (reserve height).
- **Above-the-fold rule:** scores, brackets, next-match info must appear in the first 15% of every page. 88% of users never scroll past 50% on the current site.
- **Image strategy:** Next.js `<Image>` with proper sizing. Sanity CDN. AVIF/WebP. Never serve uncompressed.
- **URL structure (clean, stable):**
  - `/events/[slug]`
  - `/athletes/[slug]`
  - `/watch`, `/play`
  - `/news/[slug]`
  - No query-string-based content routing.
- **SEO:**
  - Per-page `<meta>` + OG.
  - Structured data: `Event` (Schema.org SportsEvent) per tournament; `Person` for athletes; `BreadcrumbList` site-wide.
  - Auto-generated `sitemap.xml` (Next.js metadata API) + `robots.txt`.
  - Canonical URLs on every page.
- **Accessibility:** WCAG 2.1 AA. Keyboard navigable. Sticky tabs have proper ARIA tab semantics. Color contrast checked against PPA red/navy (be careful with red-on-red).
- **No layout shift from sticky elements on load.** Reserve height in CSS.

---

## 13. Open Questions for Bryce
These must be resolved before or during Week 1 of Phase 2:
- [ ] **GitHub repo path** Jason has set up (or needs to set up).
- [ ] **Scoring API docs + auth credentials** + confirmation of name-normalization location (server vs. client).
- [ ] **Tixr API access + scope** for inventory scarcity pulls.
- [ ] **GTM container ID** to reuse, or new container.
- [ ] **CMS choice confirmation** — Sanity vs Contentful. (Recommend Sanity. Will Doughton should weigh in on editor experience.)
- [ ] **Per-event subsite flexibility** — how customizable does the Carolina/Masters template need to be? (Affects Sanity schema.)
- [ ] **Will Doughton start date** for storyline content for `/watch`.
- [ ] **Customer.io credentials / API access** for lead capture.
- [ ] **Exact brand color hex values** (red, navy, yellow accent) — pull from current brand guide.
- [ ] **Bryce + Tyler approval on the kill list** — header buttons, news sidebar, homepage carousel, testimonials-on-homepage, Cincinnati event removal.

---

## 14. What the v1 Passoff Got Wrong (Notes for the Agent)
You may see a `v1` of this passoff floating around. The v1 had two material issues:
1. **It proposed a Next.js + 11ty hybrid.** This passoff (v2) supersedes that. Use Next.js alone (§3).
2. **It was thin on the "why."** It listed pages and features without grounding them in the GA4/Clarity data that justifies every design choice. The strategy doc (`Option B`) is the source of truth — when this passoff and v1 disagree, this one wins; when this passoff and the strategy doc disagree, the strategy doc wins.

---

## 15. Success Metrics — Use These to Self-Check Your Work
Before opening a PR, ask: which of these does this change move?

**Phase 1 (data trustworthy):**
- Self-referral artifact < $10K (from $708K baseline) within 14 days of cross-domain config.
- 95%+ ad/email sessions carry full UTMs within 30 days.
- Cart abandonment recovery > 10% (~$5.6M/yr lift) — partner side.

**Phase 2 (content site works):**
- Mobile division-tab clicks: 3+ in mobile top 10 within 30 days (from 0 today).
- +40% qualified outbound clicks to tixr / pickleballtournaments.
- 10× email list growth in 90 days.
- Bracket → athlete traffic gap halved (from 18× ratio).

**Handoff (partnership quality):**
- UTM preservation rate ppatour → tixr: 98%+.
- Post-handoff conversion rate at tixr: +20% after handoff redesign.
- Return-to-site rate post-purchase: 30%+ within 7 days.

---

## 16. Files Available in This Project (Bryce's working folder)
- `Option B - Content-First Strategy.pdf` — the 20-page strategy doc. Source of truth.
- `CLAUDE_CODE_PASSOFF_v2.md` — this file.
- (v1 passoff exists as historical context only — do not implement from it.)

---
**Last updated:** 2026-05-18 · **Doc owner:** Bryce Morgan
