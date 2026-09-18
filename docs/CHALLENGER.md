# Challenger Series → ppatour.com

**Goal:** fold ppachallenger.com (WordPress on Flywheel) into this site as
`/tour/challenger`, 301 every old URL one to one, and retire the Flywheel plan.
Bryce asked for thoughts 2026-09-18; the answer was "yes, fold it in."

**Status (2026-09-18, evening):** BUILT. Bryce: "Do it. Start building it.
We don't need Jeff for this we have access."

- `/tour/challenger` — `app/(marketing)/tour/challenger/page.tsx`. One page,
  eight anchored sections (About · Schedule · How It Works · Points · Path to
  the Tour · Rankings · Sponsors · Host). Schedule is the live feed filtered to
  U.S. Challengers; past stops list with Results ↗ to pickleballtournaments.com.
- Rankings — `components/tour/ChallengerRankings.tsx` over
  `lib/data/challenger-rankings.json`, a snapshot of the five TablePress boards
  (2,082 rows, "Last Updated July 27th, 2026"). The date prints on the page.
- Nav: "Challenger Series" first in the Tour menu. `challenger` entry in
  `lib/tour-programs.ts` (sitemap, search, cross-links). `HAS_OWN_ROUTE`.
- Host: a Challenger block on `/about/host-tournament#challenger` with both
  lists from the old page; the old "Classic Series RFP" form is retired.
- Redirects: `CHALLENGER_DOMAIN_REDIRECTS` in `next.config.ts`, host-scoped to
  ppachallenger.com + www, inert until DNS moves. Tournament posts go to
  `/tour/challenger/#schedule` (see §3 note), everything else to its section.
- **Points copy says 125 or 250** (the old site's own words). Our curated data
  marks 500 on four 2026 stops; the page states no per-stop level in prose and
  lets the card badge answer. Still worth one look from Jeff, not a blocker.

---

## 1. Why `/tour/challenger`, not `/challenger/`

The site already puts every extended-tour program under `/tour/*`
(`/tour/junior`, `/tour/senior`, `/tour/camps`, `/tour/hospitality`,
`/tour/state-championships`). Challenger is the sixth program. Same folder,
same nav, same sitemap loop in `app/sitemap.ts`. A top-level `/challenger/`
would be the only program outside that pattern.

Build it as a specific route (`app/(marketing)/tour/challenger/page.tsx`) that
wins over `/tour/[slug]`, exactly like Junior. Add a `challenger` entry to
`lib/tour-programs.ts` so nav, search and sitemap pick it up.

## 2. When to switch

The last 2026 U.S. Challenger is **Charlotte, Sept 25–27**. Grand Rapids is
live this weekend (Sept 18–20). Do not move DNS before **Sept 28**. After that
the U.S. calendar is clear until 2027 (the two Asia 125 Challengers in Oct and
Dec are not on ppachallenger.com).

## 3. URL inventory — 43 URLs, from the three WordPress sitemaps

Pulled 2026-09-18 from `page-sitemap.xml`, `tournament-sitemap.xml`,
`points-sitemap.xml`.

### Pages (13)

| Old URL | Page holds |
|---|---|
| `/` | Hero, schedule strip, links |
| `/about/` | Mission copy + upcoming strip |
| `/how-it-works/` | The real content: divisions, points table, wild cards, rankings, Showdown |
| `/schedule/` | Upcoming + past tournaments |
| `/rankings/` | Hand-maintained table, 5 divisions, **last updated July 27, 2026** |
| `/points/250-points/` | Empty taxonomy archive |
| `/host-a-ppa-tour-tournament/` | Host page + a stale "Classic Series RFP" form (asks for 2024 dates) |
| `/sponsors/` | JOOLA + apparel logos, "Become a Sponsor" form |
| `/contact-us/` | Contact form, topic dropdown |
| `/what-is-pickleball/` | Generic explainer |
| `/privacy-policy/` `/terms-of-use/` `/content-policy/` `/opt-out-preferences/` | Legal |

### Tournament posts (29)

Every one has a matching event in our feed. Feed slug and date confirmed
against the live `/events` payload 2026-09-18.

| Old post | Feed event (`/events/<year>/<slug>`) |
|---|---|
| `/tournament/2025-columbia-sc/` | `2025/columbia-ppa-challenger` |
| `/tournament/2025-baton-rouge-la/` | `2025/baton-rouge-ppa-challenger` |
| `/tournament/2025-portland-me/` | `2025/new-england-ppa-challenger` |
| `/tournament/2025-punta-gorda-fl/` | `2025/punta-gorda-ppa-challenger` |
| `/tournament/2025-boise-id/` | `2025/boise-ppa-challenger` |
| `/tournament/2025-fairport-ny/` | `2025/ppa-flower-city-challenger-presented-by-valenti-pickleball` |
| `/tournament/2025-eau-claire-wi/` | `2025/wisconsin-ppa-challenger` |
| `/tournament/2025-fairfield-ca/` | `2025/fairfield-suisun-valley-ppa-challenger-presented-by-caymus-suisun` |
| `/tournament/2025-orlando-fl/` | `2025/citrus-classic-ppa-challenger` |
| `/tournament/charleston-ppa-challenger/` | `2025/charleston-metro-ppa-challenger` |
| `/tournament/2025-little-rock-ar/` | `2025/rock-city-rally-ppa-challenger` |
| `/tournament/2025-raleigh-nc/` | `2025/raleigh-ppa-challenger` |
| `/tournament/2026-punta-gorda-fl/` | `2026/punta-gorda-ppa-challenger` |
| `/tournament/2026-tucson-az/` | `2026/tucson-ppa-challenger` |
| `/tournament/2026-houston-tx/` | `2026/houston-ppa-challenger` |
| `/tournament/2026-harbour-island-fl/` | `2026/adventhealth-tampa-bay-challenger` |
| `/tournament/2026-newport-beach-ca/` | `2026/newport-beach-ppa-challenger` |
| `/tournament/2026-opelika-al/` | `2026/opelika-ppa-challenger` |
| `/tournament/2026-black-desert-ut/` | `2026/black-desert-ppa-challenger` |
| `/tournament/2026-wilson-nc/` | `2026/wilson-ppa-challenger` |
| `/tournament/2026-fort-collins-co/` | `2026/fracas-in-fort-collins-ppa-challenger` |
| `/tournament/2026-boise-id/` | `2026/boise-ppa-challenger` |
| `/tournament/2026-portland-me/` | `2026/portland-ppa-challenger` |
| `/tournament/2026-macon-ga/` | `2026/macon-ppa-challenger` |
| `/tournament/2026-eau-claire-wi/` | `2026/wisconsin-ppa-challenger` |
| `/tournament/2026-seattle-wa/` | `2026/seattle-ppa-challenger` |
| `/tournament/2026-atlanta-ga/` | `2026/atlanta-ppa-challenger` |
| `/tournament/2026-grand-rapids-mi/` | `2026/grand-rapids-ppa-challenger` |
| `/tournament/2026-charlotte-nc/` | `2026/charlotte-ppa-challenger` |

Peachtree City (Aug 28–30) on the WP schedule is the feed's
`atlanta-ppa-challenger`. WP has no post for it.

**⚠ Prerequisite for the 1:1 map:** Challengers have **no internal page**
today. `lib/events-api.ts` sets `hasInternalPage: !isChallenger`, so a
Challenger card links out to pickleballtournaments.com. Flip that for U.S.
Challengers (and confirm `/events/[year]/[slug]` renders a thin but honest
page for one) before the redirects go live. Otherwise every tournament post
has to fall back to `/tour/challenger#schedule`, which is the "all to one
page" move that loses rankings.

## 4. Redirect map — ready for `next.config.ts`

Host-scoped so it only fires for the old domain once DNS points at Vercel.
Same shape as the `vacations.ppatour.com` rule already in `LEGACY_REDIRECTS`.

```ts
// ppachallenger.com → /tour/challenger (Sept 2026). Host-scoped: DNS for the
// old domain points at this project; every old path lands on its real page.
const CHALLENGER_HOST = [{ type: "host" as const, value: "ppachallenger.com" }];
const CHALLENGER_HOST_WWW = [{ type: "host" as const, value: "www.ppachallenger.com" }];
const CHALLENGER_PAGES: Array<[string, string]> = [
  ["/", "/tour/challenger"],
  ["/about", "/tour/challenger"],
  ["/how-it-works", "/tour/challenger/how-it-works"],
  ["/schedule", "/tour/challenger#schedule"],
  ["/rankings", "/tour/challenger/rankings"],
  ["/points/250-points", "/tour/challenger/how-it-works#points"],
  ["/host-a-ppa-tour-tournament", "/about/host-tournament"],
  ["/sponsors", "/tour/challenger#sponsors"],
  ["/contact-us", "/about/contact"],
  ["/what-is-pickleball", "/about/what-is-pickleball"],
  ["/privacy-policy", "/about/privacy"],
  ["/terms-of-use", "/about/terms"],
  ["/content-policy", "/about/terms"],
  ["/opt-out-preferences", "/about/privacy"],
];
const CHALLENGER_TOURNAMENTS: Array<[string, string]> = [
  ["2025-columbia-sc", "2025/columbia-ppa-challenger"],
  ["2025-baton-rouge-la", "2025/baton-rouge-ppa-challenger"],
  ["2025-portland-me", "2025/new-england-ppa-challenger"],
  ["2025-punta-gorda-fl", "2025/punta-gorda-ppa-challenger"],
  ["2025-boise-id", "2025/boise-ppa-challenger"],
  ["2025-fairport-ny", "2025/ppa-flower-city-challenger-presented-by-valenti-pickleball"],
  ["2025-eau-claire-wi", "2025/wisconsin-ppa-challenger"],
  ["2025-fairfield-ca", "2025/fairfield-suisun-valley-ppa-challenger-presented-by-caymus-suisun"],
  ["2025-orlando-fl", "2025/citrus-classic-ppa-challenger"],
  ["charleston-ppa-challenger", "2025/charleston-metro-ppa-challenger"],
  ["2025-little-rock-ar", "2025/rock-city-rally-ppa-challenger"],
  ["2025-raleigh-nc", "2025/raleigh-ppa-challenger"],
  ["2026-punta-gorda-fl", "2026/punta-gorda-ppa-challenger"],
  ["2026-tucson-az", "2026/tucson-ppa-challenger"],
  ["2026-houston-tx", "2026/houston-ppa-challenger"],
  ["2026-harbour-island-fl", "2026/adventhealth-tampa-bay-challenger"],
  ["2026-newport-beach-ca", "2026/newport-beach-ppa-challenger"],
  ["2026-opelika-al", "2026/opelika-ppa-challenger"],
  ["2026-black-desert-ut", "2026/black-desert-ppa-challenger"],
  ["2026-wilson-nc", "2026/wilson-ppa-challenger"],
  ["2026-fort-collins-co", "2026/fracas-in-fort-collins-ppa-challenger"],
  ["2026-boise-id", "2026/boise-ppa-challenger"],
  ["2026-portland-me", "2026/portland-ppa-challenger"],
  ["2026-macon-ga", "2026/macon-ppa-challenger"],
  ["2026-eau-claire-wi", "2026/wisconsin-ppa-challenger"],
  ["2026-seattle-wa", "2026/seattle-ppa-challenger"],
  ["2026-atlanta-ga", "2026/atlanta-ppa-challenger"],
  ["2026-grand-rapids-mi", "2026/grand-rapids-ppa-challenger"],
  ["2026-charlotte-nc", "2026/charlotte-ppa-challenger"],
];
const CHALLENGER_REDIRECTS = [CHALLENGER_HOST, CHALLENGER_HOST_WWW].flatMap((has) => [
  ...CHALLENGER_PAGES.map(([source, destination]) => ({
    source, has, destination: `https://www.ppatour.com${destination}`, permanent: true,
  })),
  ...CHALLENGER_TOURNAMENTS.map(([slug, dest]) => ({
    source: `/tournament/${slug}`, has, destination: `https://www.ppatour.com/events/${dest}`, permanent: true,
  })),
  // Anything else on the old domain: the program page, never a 404.
  { source: "/:path*", has, destination: "https://www.ppatour.com/tour/challenger", permanent: true },
]);
```

Trailing slashes: Next normalises them, so `/about/` and `/about` both match.
Verify with a real browser after cutover, never `curl -L`
(see memory: webhook trailing-slash 308).

## 5. Section plan — `/tour/challenger`

One landing page plus two sub-pages. Bryce's four sections, plus the two the
old site's traffic already needs.

| Route | Section | Source of the facts |
|---|---|---|
| `/tour/challenger` | **What the Challenger Series is** — hero, mission, "Pathway To Become A Pro" | WP `/about/` |
| `/tour/challenger` | **What to expect / what's on** — next stops (from `getEvents()` filtered to `tierKey === "challenger"` and U.S.), past results link | Feed, same as Junior page |
| `/tour/challenger` | **Sponsors** — JOOLA (Paddle Sponsor, "Powered by JOOLA"), apparel partner, Become a Sponsor → existing `/api/sponsor-inquiry` form | WP `/sponsors/` |
| `/tour/challenger/how-it-works` | **How it works** — divisions, pro eligibility, prize pool, wild cards | WP `/how-it-works/` |
| `/tour/challenger/how-it-works#points` | **How points work** — the 125 / 250 table, 52-week window, top-16 rule | WP `/how-it-works/` |
| `/tour/challenger/how-it-works#path` | **Path to the pro tour** — wild cards into Opens, the Showdown | WP `/how-it-works/` |
| `/tour/challenger/rankings` | **Rankings** — five divisions | ⚠ no live source, see §7 |
| `/about/host-tournament` | **Host a Challenger** — existing page, add a Challenger block | WP `/host-a-ppa-tour-tournament/` |

## 6. Copy draft

Every number below is the old site's own copy, verbatim. Nothing is invented.
Where the old site is stale, the line is marked **[CONFIRM]** and must be
checked before it ships. Voice: plain, short, second person where it fits.

### Hero

**PPA Tour Challenger Series**
*Powered by JOOLA*

The pathway to the pro tour. Eighteen stops, skill divisions 3.0 to 5.0, and a
Pro Division that earns PPA ranking points, prize money and a wild card into a
PPA Tour Open.

[Register to play] [How it works] [Rankings]

### What the Challenger Series is

The PPA Tour runs the Challenger Series to grow the game from the ground up.
Amateur players get a PPA-run event in their own region. Rising pros get a
place to earn points, prize money and a shot at the Carvana PPA Tour.

Every stop brings the PPA Tour brand to a local club: professional play
management, live streaming, and the same registration system as the Tour.

### How it works

**Who can play.** Every event offers skill divisions 3.0 through 5.0 and a Pro
Division. PPA Tour pros ranked inside the top 20 of a division cannot enter
that division at a Challenger.

**What the pros play for.** Each event carries a $10,000 prize pool, split
among the medalists in the Pro Division. Winners in men's and women's singles,
men's and women's doubles, and mixed doubles earn PPA ranking points.

**The wild card.** Win a Challenger pro event and you earn a wild-card entry
into the main draw of a PPA Tour Open of your choosing. Each Open takes at most
two wild-card winners.

**The calendar.** The 2026 Challenger Series runs 18 tournaments across 15
states. Four of them are 250-level events: Punta Gorda, Newport Beach, Grand
Rapids and Seattle. **[CONFIRM: the feed marks Opelika 250 and Newport Beach
125. One side is wrong.]**

### How points work

Each Challenger awards either 125 or 250 points to the champion. Points go
deeper into the draw at both levels.

| Finish | Challenger 125 | Challenger 250 |
|---|---|---|
| 1st | 125 | 250 |
| 2nd | 100 | 200 |
| 3rd | 75 | 150 |
| 4th | 50 | 100 |
| Semifinal | 40 | 80 |
| Quarterfinal | 25 | 50 |
| Round of 16 | 12 | 24 |
| Round of 32 | 6 | 12 |
| Round of 64 | 3 | 6 |

**[CONFIRM: the old table lists both "4th place" and "Semi-Final" as separate
rows. Jeff's How Pro Pickleball Works doc says there is no third-place match on
the Tour. Ask whether Challengers still play one.]**

**Rankings.** The Challenger rankings update after every event. They count
points from the past 52 weeks and from the current calendar year. A player's
best 16 finishes count toward the leaderboard.

### Path to the pro tour

Challenger points do two things. They rank you against every other player on
the series, and they get you into the room.

1. **Win a stop** and you hold a wild card into a PPA Tour Open main draw.
2. **Finish the season near the top** and you are invited to the PPA Challenger
   Showdown, played at Brookhaven Country Club during the PPA World
   Championships. The highest-ranked players without a PPA contract compete for
   a spot on the PPA Tour. **[CONFIRM 2026 dates, format and qualifying counts.
   The old page still shows the 2025 schedule (Nov 6–8) and calls it the
   "inaugural" season.]**

### Sponsors

Thank you to the partners who make the Challenger Series possible.
*JOOLA, Official Paddle of the PPA Challenger Series.* **[CONFIRM the apparel
partner's name; the old page shows a logo, not a name.]**

Want your brand in front of players in 15 states? [Become a sponsor] →
existing sponsor inquiry form, tagged `challenger`.

### Host a Challenger (block on `/about/host-tournament`)

**What the PPA brings:** pickleballtournaments.com registration and an
experienced event team, ticketing, professional play management, live
streaming, balls, national marketing, custom signage and the prize money.

**What you bring:** at least 16 courts, a championship court for 250 or more,
WiFi that carries a stream, a DJ or MC, parking, volunteers, venue and ticket
staff, check-in and player-hospitality staff, a podium and awards, player swag
bags and local promotion.

Use the existing inquiry form. Retire the WP "Classic Series RFP" form; it
still asks for 2024 dates.

## 6b. What shipped vs. this draft

The redirect map in §4 was written before the build and had `/tour/challenger/how-it-works`
and `/rankings` as sub-routes. Shipped as ANCHORS on one page instead
(`#how-it-works`, `#points`, `#rankings`), the Senior Open pattern. The
`next.config.ts` rules are the truth; §4 is the draft.

## 7. Open questions — who answers

| Question | Owner | Why it blocks |
|---|---|---|
| Where do Challenger rankings live as data? WP is a hand-typed table, 7 weeks stale. Ask for a rankings endpoint or a scoped WPR call. | Kenan / Egon (pickleball.com API) | `/tour/challenger/rankings` has no source without it |
| Points per event: 125 vs 250 disagreements between WP and the feed (Newport Beach, Opelika, and the feed's 500s on Wilson, Boise, Portland, Wisconsin) | Jeff Watson | The points table and event cards must agree |
| Showdown 2026: dates, format, who qualifies | Jeff Watson / Connor | The "path to the pro tour" section |
| Where do the WP host and sponsor Gravity Forms leads go today? Export before the site goes dark. | Bryce (WP admin) | Leads in flight |
| Renew ppachallenger.com and keep it forever; point DNS at Vercel after Sept 28 | Bryce / Jason (GoDaddy) | Redirects |
| Search Console: export top pages and queries for ppachallenger.com before cutover | Bryce | Confirms the map covers what ranks |
| JOOLA "Powered by" naming on the new page: does the $100k Challenger Paddle Sponsor line require the title lockup? | Patrick | Hero copy |

## 8. Build order

1. `lib/tour-programs.ts` entry + `app/(marketing)/tour/challenger/page.tsx`
   (landing, from the Junior page pattern). Sub-pages `how-it-works` and
   `rankings` (rankings ships only when it has a source).
2. `hasInternalPage` for U.S. Challengers; confirm one event page renders.
3. Host block on `/about/host-tournament`; sponsor form tag.
4. `next.config.ts`: paste §4. Add `ppachallenger.com` + `www` to the Vercel
   project. Deploy, wait for ● Ready.
5. DNS after Sept 28. Verify 10 sample URLs in a browser. Downgrade Flywheel.
