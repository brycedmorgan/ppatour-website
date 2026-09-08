# Website recap — Veolia Pickleball National Championships

**Event window:** 2026-08-31 → 2026-09-06 · Cary Tennis Center, Cary, NC
**Recap generated:** 2026-09-08 18:25 UTC
**Event source:** feed

## 1. Audience

- **503,602 page views** across the tournament
- Peak day **2026-09-06** at **128,207** — 4.7x the day before it opened
- Peak hour **19:00 UTC**, 8,720 page views
- **66,043,520 edge requests** total

| Day | Page views | Document loads | Icon 404s |
| --- | --- | --- | --- |
| 2026-08-30 | 27,138 | 29,953 | 10,131 |
| 2026-08-31 | 35,798 | 31,442 | 14,218 |
| 2026-09-01 | 51,713 | 40,692 | 7,475 |
| 2026-09-02 | 60,759 | 45,256 | 6,282 |
| 2026-09-03 | 64,825 | 53,976 | 6,733 |
| 2026-09-04 | 69,300 | 52,382 | 8,155 |
| 2026-09-05 | 93,000 | 74,520 | 11,044 |
| 2026-09-06 | 128,207 | 89,499 | 15,408 |
| 2026-09-07 | 52,311 | 44,961 | 8,851 |

**Top pages**

| Page | Views |
| --- | --- |
| `/` | 147,551 |
| `/events/2026/veolia-pickleball-national-championships` | 99,528 |
| `/events` | 35,455 |
| `/vacations` | 14,602 |
| `/rankings` | 14,489 |
| `/watch` | 6,889 |
| `/news` | 6,610 |
| `/athletes/anna-leigh-waters` | 5,317 |
| `/athletes` | 4,200 |
| `/leaderboards` | 3,607 |

## 1b. Against the last tournament

No prior tournament is on record yet. Audience data is only retained for about
nine days at source, so earlier events cannot be measured retroactively — the
comparison starts from the next event. History lives in `docs/recaps/metrics.json`.

## 2. Delivery during the event

- **52 production deploys**, **0 failed**
- Per day: 08-31 12 · 09-01 14 · 09-02 2 · 09-03 2 · 09-04 9 · 09-05 12 · 09-06 1
- **WPR snapshot refresh:** 1 of 4 sampled builds wrote a fresh snapshot
  - ⚠ 2026-09-05T20:42:18.753Z — [wpr-snapshot] upstream unavailable (partner_rankings F p3: HTTP 429) — keeping existing snapshot.
  - ⚠ 2026-09-05T20:18:10.855Z — [wpr-snapshot] upstream unavailable (partner_rankings M p3: HTTP 429) — keeping existing snapshot.
  - ⚠ 2026-09-05T20:11:33.373Z — [wpr-snapshot] upstream unavailable (partner_rankings M p3: HTTP 429) — keeping existing snapshot.

  > A build that keeps the previous snapshot ships the boards committed to
  > git. That copy has a 7-day expiry (`SNAPSHOT_MAX_AGE_MS`), and past it
  > every athlete page reverts to live board paging — the thing the snapshot
  > exists to prevent.

## 3. What shipped during the event

75 commits landed while the event was live.

<details><summary><strong>fix</strong> — 21</summary>

- `09-05 14:08` fix(athletes): cache the render — 20 pages were re-rendering on every request
- `09-05 13:36` fix(cache): params is a Request-time API, so page fetches were never cached
- `09-05 12:14` fix(cache): drop force-dynamic — default-cache cannot override it
- `09-05 11:46` fix(cache): force-dynamic was disabling the Data Cache on every fetch
- `09-05 11:09` fix(rankings): revert the board cache to the fetch-level Data Cache
- `09-05 11:00` fix(ticker): put the edge in front of the degraded state too
- `09-05 10:38` fix(ticker): stop timing out mid-way through the endpoint's own latency curve
- `09-05 10:18` fix(rankings): cache the board RESULT, and stop player saves purging it
- `09-05 10:18` fix(ticker): the quiet state is cacheable, and a 429 no longer makes us call harder
- `09-04 14:04` fix(athletes): WPR lookups read the whole board, not just the top 250
- `09-04 10:37` fix(europe): a Europe stop is not a "Challenger"
- `09-04 10:32` fix(europe): 25 broken images, and rebuild the page on the site's own components
- `09-04 08:57` fix(nationals): weather reschedule — Fri + Sat TV windows split into two blocks
- `09-01 15:47` fix(live): the score-ticker date stacks above the rail on a phone
- `09-01 13:06` fix(live): scores were clipped by a missing min-w-0; photos on the scores board
- `09-01 11:44` fix(athletes): read the feed's own Semifinalist field, and correct the cause note
- `09-01 11:26` fix(athletes): Semifinals counted third place only, never fourth
- `09-01 11:33` fix(events): correct the international ticket info, and link sister-tour stops to their own sites
- `09-01 09:38` fix(live): every Watch Live button opens the first match on the rail
- `08-31 21:27` fix(live): narrow the box-score cards, swap the green winner tint for brand blue
- `08-31 18:10` fix(promo): drop the consent gate, and cut the backdrop above the cookie banner

</details>

<details><summary><strong>feat</strong> — 13</summary>

- `09-04 12:43` feat(europe): the 24 player portraits are in, and two source files were not portraits
- `09-04 09:15` feat(europe): ship /europe unlisted behind one flag — noindex, no links, no sitemap
- `09-04 07:37` feat(europe): /europe ships — 26 signed pros, the Europe rules, a form with no address
- `09-04 09:15` feat(europe): ship /europe unlisted behind one flag — noindex, no links, no sitemap
- `09-04 07:37` feat(europe): /europe ships — 26 signed pros, the Europe rules, a form with no address
- `09-03 16:09` feat(paddle-lab): every PBC paddle is in the lab; lab stats on athlete pages
- `09-03 11:54` feat(paddle-lab): PBC photos + live prices, predictive search, what the pros play
- `09-03 11:23` feat: Paddle Lab at /paddle-lab — browse, 468 paddle pages, compare, How We Test
- `09-01 14:32` feat(events): watch the sister tours for ticket launches instead of waiting to be told
- `09-01 11:26` feat(events): Plan Your Trip ends at first serve; tickets go to Tixr
- `09-01 10:27` feat(athletes): 24 new pro profiles from the New Player Profile questionnaire
- `08-31 16:51` feat(promo): Canes and the Cup popup on the homepage
- `08-31 15:52` feat(live): scores and brackets show the Pro Qualifier, each on its own rule

</details>

<details><summary><strong>perf</strong> — 2</summary>

- `09-05 15:42` perf(rankings): snapshot the division boards too — the last 10% of the calls
- `09-05 15:11` perf(rankings): snapshot the boards so a page view costs no ranking calls

</details>

<details><summary><strong>content</strong> — 8</summary>

- `09-04 09:34` content(sponsors): remove AstraZeneca / Fasenra from the roster entirely
- `09-04 09:23` content(sponsors): pull the AstraZeneca mark from the site
- `09-03 21:16` content(broadcast): Nationals Fri + Sat TV windows split for weather
- `09-03 10:31` content(athletes): Hunter Johnson onto the MEHAU S5 AIRPOOM
- `09-02 09:31` content(canes-night): Jalen Chatfield replaces Cam Ward
- `09-01 17:27` content(events): Worlds is the Opendoor Pickleball World Championships
- `09-01 12:03` content(athletes): the stats block is PPA Tour, not "Career"
- `09-01 11:26` content(sponsors): only category leaders show a designation

</details>

<details><summary><strong>docs</strong> — 19</summary>

- `09-04 12:29` docs(paddle-lab): link the near-miss review sheet sent to Hannah
- `09-04 08:57` docs: session log — Nationals weather reschedule (Fri + Sat TV windows)
- `09-03 16:13` docs: session log — Paddle Lab pt. 3 (PBC union, athlete lab stats)
- `09-03 12:00` docs: session log — note the hero photo commit from the parallel session
- `09-03 11:29` docs: session log — Paddle Lab shipped to preview
- `09-02 23:12` docs: MATCHDAY export baseline; 12M of 13.6M rows are logs
- `09-02 23:06` docs: MATCHDAY repo access landed; supabase inventory from the clone
- `09-02 16:28` docs: MATCHDAY Lovable plan + top-up facts, verified in-workspace
- `09-02 16:17` docs: MATCHDAY Lovable billing context (credit cap, ownership)
- `09-02 15:13` docs(roadmap): MATCHDAY off Lovable, waiting on repo invite
- `09-02 15:05` docs: MATCHDAY migration, email to Chris + proposed Nov 9-15 cutover
- `09-02 14:41` docs: MATCHDAY off-Lovable migration notes + session log
- `09-02 11:57` docs: texted Chris the Asia calendar answer
- `09-02 11:55` docs: the Asia list of 10 is Wade's 2026 list, all live; 2027 has three undated Q1 stops
- `09-02 11:31` docs: 2027 international gap is upstream — feed and sister-tour sites carry no 2027 Asia/Australia rows
- `09-01 15:56` docs: quantify the 2020 and 2021 damage, and why we cannot self-serve those years
- `09-01 15:55` docs: the 1,000-point floor is today's scale applied backwards
- `09-01 14:59` docs: correct the cause of the low title counts — a 1,000-point floor, not a missing tag
- `09-01 11:26` docs: log Connor's 9/1 website pass

</details>

<details><summary><strong>chore</strong> — 7</summary>

- `09-06 15:53` chore(data): sync PPA Tixr ticket prices
- `09-05 15:42` chore(data): sync PPA Tixr ticket prices
- `09-04 16:39` chore(data): sync PPA Tixr ticket prices
- `09-03 16:44` chore(data): sync PPA Tixr ticket prices
- `09-02 16:55` chore(data): sync PPA Tixr ticket prices
- `09-01 17:03` chore(data): sync PPA Tixr ticket prices
- `08-31 19:18` chore(data): sync PPA Tixr ticket prices

</details>

<details><summary><strong>Merge</strong> — 1</summary>

- `09-04 12:42` Merge remote-tracking branch 'origin/main'

</details>

<details><summary><strong>Paddle</strong> — 2</summary>

- `09-04 09:04` Paddle Lab compare: align the cards, and say why the rows are empty
- `09-03 11:59` Paddle Lab: a real hero photograph behind the search

</details>

<details><summary><strong>session</strong> — 1</summary>

- `09-03 11:37` session log: MATCHDAY access landed, October cutover

</details>

<details><summary><strong>News</strong> — 1</summary>

- `09-01 10:59` News hero: show a designed graphic whole, headline on a band below

</details>

## 4. What broke

> Bryce's direction on this report: *"Spend the effort on the half the
> analytics CAN'T see: what broke, and what we'd change on the page next
> time."* Everything above is generated. Everything below is written.

_One entry per incident: what a visitor saw, the cause, the fix, and whether it is still open._

| # | What a visitor saw | Cause | Fix | Status |
| --- | --- | --- | --- | --- |
| 1 | _…_ | _…_ | _…_ | _open / closed_ |

## 5. Still open going into the next event

_Anything from section 4 that did not close, plus risks the event exposed._

- _…_

## 6. What we would change on the page next time

_Content and layout, not infrastructure — what the event taught us about the pages themselves._

- _…_

