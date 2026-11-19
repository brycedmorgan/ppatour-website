# ppatour.com — SEO plan and roadmap

Written 2026-09-23 (review), expanded same day into a plan after Bryce: "Go dig deeper and build a
plan and roadmap." Method: full crawl of the 1,135-URL sitemap (every URL fetched, titles,
descriptions, canonicals, H1s, JSON-LD, word counts, dates), legacy-URL redirect tests, the code
paths that emit metadata, `docs/seo-baseline` (SEMrush 8/8), SERP spot checks. **Update 2026-09-24:** GSC and SEMrush baselines pulled through Jackalope's `/api/seo/*` endpoints
(the service account reads both properties; the SEMrush key lives on the Vercel project) →
[`seo-baseline/gsc-semrush-2026-09-24.md`](seo-baseline/gsc-semrush-2026-09-24.md). Phase 1 shipped
to `main` the same day (9 commits; **live on www since, verified by full 1,139-URL crawl 10/7**). Still not measured: Core Web
Vitals field data. The PBC plan lives in `~/pickleball/ziff/docs/PBC-SEO-PLAN.md`.

**Shareable version (private artifact, share from its own menu):**
https://claude.ai/artifact/V77Y5AsxHDavMPXrQmuMxp

## 1. What this is, and why it is not small

ppatour.com is a 1,135-page content site rebuilt on Next.js and launched 2026-08-04, sitting on a
domain whose ranking footprint fell **74%** in the six months before launch (SEMrush US organic
keywords 46,039 in Feb 2026 → 11,918 in Aug 2026; monthly organic visits 75.8k → 66.5k). The
rebuild did not cause that; it also has not yet been shown to reverse it. Brand queries ("ppa
tour", "ppa pickleball", "ppa tour schedule") carry ~30% of organic traffic and are safe. Growth
has to come from three places the site is not built to win yet: athletes as entities (already the
top route), events as recurring local pages, and an evergreen "learn pickleball" library that
today has 37 posts against competitors with hundreds. The GA4 property is contaminated (see
`ANALYTICS.md`), so today nobody can quote a trustworthy organic number for this site.

## 2. Where it stands (crawl 2026-09-23)

| Template | URLs | 200 | Median words | Schema present | Main gaps |
|---|---:|---:|---:|---|---|
| Legacy articles (root slugs) | 822 | 821 | 930 | none beyond site-wide | no Article schema; 609 titles >60 chars; 92 descriptions >160; 507 dated 2023 |
| Athletes | 217 | 217 | 543 | Person, Place, Breadcrumb (FAQ/Product on top pros) | 216 titles >60; 63 descriptions >160; 15 pages <300 words; 2 duplicate pairs |
| ppa-blog (evergreen) | 37 | 37 | 1,129 | none | newest 2026-02-04; 14 titles >60 |
| Events | 28 | 28 | 1,242 | SportsEvent, Place, Offer, Breadcrumb | Newport Beach 2025 and 2027 share a title |
| About / Tour / Watch / other | 31 | 31 | 318–1,293 | FAQ on one page | 6 thin about pages |
| Rankings, Leaderboards, News, Blog indexes | 4 | 4 | 434–1,591 | none | rankings ranks #1 for "pickleball rankings" with no schema |

Other facts from the crawl:
- Every sitemap URL returns 200 except one (`/stats-wrap-vulcan-indoor-national-championships-finals/`, connection failed twice; re-test).
- Old WordPress URLs redirect correctly but in **3 hops** (`ppatour.com/athlete/x/` → www → `/athletes/x` → `/athletes/x/`). Same for `/schedule/` and `/player-rankings/`.
- Homepage H1 is the hero event card ("Rate Las Vegas Open"), not a brand or topic statement.
- `/news/` paginates with `?page=N` (crawlable), so the 822 legacy posts are reachable, ~34 pages deep.
- Duplicate athlete pages: `raquel-amaro` / `raquel-amaro-veloso`, `james-ling` / `james-ling-2`.
- Sitemap: 856 of 1,135 entries carry `lastmod`; athletes and events carry none.
- Homepage JS is 251 KB compressed across 15 scripts (PBC is 826 KB / 25). Performance is not the problem here.
- Backlink profile (SEMrush 8/8): 4,058 referring domains, authority 44, but the top referrers by volume are the old host (`flywheelsites.com`, 7,071 links) and `brubakers.us` (9,421). Worth a look, not a disavow yet.
- SERP spot checks 9/23: `/rankings/` #1 for "pickleball rankings"; `/athletes/ben-johns/` #3 for "Ben Johns pickleball" behind two pickleball.com results; `/news/` #8 for "pickleball news"; nothing on page 1 for "how to play pickleball" or "pickleball rules"; `/watch/` #7 for "pickleball on tv today" behind DirecTV, TV Guide, Fubo, pickleballtv.com.

## 2b. What Search Console says (Aug 25 – Sep 21 vs prior 28 days)

- **232,471 clicks vs 85,578** (Nationals inside the window; rebuild live since Aug 4); CTR 11.5% vs 5.8%; position 5.5 vs 6.7.
  So the SEMrush "keywords" decline is breadth, not clicks. Both are true.
- The gap is CTR on big-impression pages: `/watch/` 1.5% on 206k impressions, `/athletes/` 0.6% on 154k,
  Anna Leigh Waters 1.5% on 114k, Ben Johns 1.9% on 65k at position 8.1 (pickleball.com holds two results above).
- "ppa" alone: 126k impressions, 15% CTR at position 3.5–4 — the biggest single term gap.
- Event pages convert impressions well (Arizona Open 28% CTR, Nationals 18%). Athlete pages for rising players do too (Tama 15.5%, Kate Fahey 14%).

## 3. The plan

Everything in Phase 1 is code in this repo. Phase 2 is content plus code. Phase 3 is people.

### Phase 0 — Measure — DONE 9/24 except the GA4 split
1. ~~GSC access~~ — the Jackalope service account already reads `sc-domain:ppatour.com` (siteFullUser). Baseline saved 9/24.
2. ~~SEMrush seat~~ — `SEMRUSH_API_KEY` is on the Jackalope Vercel project; `/api/seo/overview?brand=ppa` serves it. Baseline saved 9/24. Next: a monthly cron that writes the JSON here.
3. GA4: ship Option A from `ANALYTICS.md` (hostname-filtered explorations) so organic sessions for ppatour.com are quotable. Replicate the PBC performance endpoint in Jackalope for PPA.

### Phase 1 — Technical fixes — LIVE (verified 10/7; see §3b for what's still partial)
| # | Change | Where | Pages affected |
|---|---|---|---|
| 1 | `NewsArticle` JSON-LD (headline, datePublished, dateModified, author, image, publisher) on every article | `app/[slug]/page.tsx`, `components/news/ArticleView` | 822 |
| 2 | `BlogPosting` JSON-LD on evergreen posts | `app/ppa-blog/[slug]/page.tsx` | 37 |
| 3 | Title cap: articles and athletes use `title.absolute` with a shorter suffix ("· PPA Tour") when the full title exceeds 60 chars; descriptions truncated to 155 at a word boundary | `lib/news.ts`, `app/athletes/[slug]/profile.tsx`, layout template | 825 titles, 155 descriptions |
| 4 | Duplicate athletes: 301 the `-veloso` and `-2` slugs to the canonical page; drop from sitemap | `next.config.ts`, `lib/published-athletes` | 2 |
| 5 | Event titles carry the year ("Newport Beach Open 2027") | `app/events/[year]/[slug]/page.tsx` | 28 |
| 6 | Homepage H1 becomes a brand/topic statement; hero card heading drops to h2 | `app/page.tsx` | 1 |
| 7 | Collapse legacy redirects to one hop: rules emit `https://www.ppatour.com/…/` directly | `next.config.ts` | all `/athlete/`, `/schedule`, `/player-rankings`, `/tournament/` |
| 8 | `lastmod` on athletes (last result date) and events (last edit) | `app/sitemap.ts` | 245 |
| 9 | Rankings and Leaderboards: `Dataset` + `ItemList` (top 10 as ListItems) and a server-rendered summary paragraph | `app/rankings`, `app/leaderboards` | 2 |
| 10 | Events: add `eventStatus`, `performer` (top seeds), `offers.url` (Tixr), `subEvent` per day | `lib/event-schema.ts` | 28 |
| 11 | Thin athletes: generated bio paragraph from results data (titles, best finish, partner, paddle) for pages under 300 words | `app/athletes/[slug]/profile.tsx` | 15 now, template for all |
| 12 | Entity autolinking: first mention of a published athlete or current event in an article body links to its page | `components/news/ArticleView` | 859 |
| 13 | Google News sitemap (`/news-sitemap.xml`, last 48 hours, `<news:news>`) and submit in GSC | `app/news-sitemap.xml/route.ts` | new |

### Phase 2 — Content engine (10/20 → 12/12; no deploys Nov 2–8, Worlds)
- **Evergreen library.** `/blog/` already claims "How to Play, Gear, Rules & Terminology" in its title and has 37 posts. Competitors on those queries: USA Pickleball, Pickleheads, The Dink, Selkirk, Paddletek. PPA's angle is the pros. Twelve pillar pages, two a week, each with a pro quote and a video: how to play, rules (with the 2027 rulebook changes), scoring, the kitchen, court dimensions, terminology glossary, how to watch (TV + stream, updated weekly), how rankings work, how to become a pro, how a PPA event works (draws, brackets, Championship Sunday), tournament bag / travel, paddle basics (links to PBC while Paddle Lab's home is decided). Each pillar gets `FAQPage` and links out to athletes and events.
- **Events as evergreen local pages.** Keep every year's page live with results (2025 Newport Beach stays), add "past champions" and venue FAQ (shade, parking, food, RV — the same list the contact-form triage is missing), and target "[city] pickleball tournament", "PPA [city]", "[event] tickets".
- **Athlete entity work.** pickleball.com outranks us for our own players. Decide with Taylor which domain is canonical for the player entity; at minimum both pages link to each other and share `sameAs`. Fill the hero image slot (1 of 179 today).
- **News.** Cadence is healthy (Sep 17, 21, 22). With `NewsArticle` + the news sitemap, apply to Google Publisher Center; that is the path to Top Stories for "ppa tour results".
- **Team page + Bryce Morgan page** (planned 9/22, target 10/27) is a Phase 2 item: `Person` schema, `sameAs` to brycedmorgan.com and LinkedIn.

### Phase 3 — Authority (Dec → Feb)
- Digital PR calendar tied to what the tour already produces: schedule release, rankings milestones, prize purse records, Junior PPA Select, PPA Canada/Italy debuts. Each gets a linkable data page on ppatour.com, not just a press release.
- Owned network links: pickleball.com, MLP, PBC, pickleballtv.com each link to the canonical PPA page for events and athletes (today pickleball.com links to PBC three times and to PPA once, in the footer).
- Backlink audit of the top 50 referring domains (the flywheel and brubakers volumes look like site-wide footer links from the old host and a fan site).

### Phase 1 — what the branch could not do
- **Apex hop is a Vercel domain-level 308** (`ppatour.com` → `www`), applied before app redirects. `APEX_LEGACY_REDIRECTS` is in `next.config.ts` and inert until that domain redirect is switched off in Vercel → Domains. Do it outside an event weekend.
- **Athlete `lastmod`** omitted: no per-athlete date exists in any source we hold.
- **Rankings `Dataset`** renders only with live rankings (`PB_API_TOKEN`); confirm on production with the Rich Results Test.

### 9/24 evening — what happened after the deploy
- **Search Console had only the six dead WordPress sitemaps** (post-, page-, athlete-, tournament-, category-, post_tag-sitemap.xml), all erroring since April; neither new sitemap was registered. Submitted `sitemap.xml` (1,135 URLs read) and `news-sitemap.xml` (Success), removed the six. The one remaining "URL not allowed" is the deliberate cross-host `ppatoureurope.com/` entry — fine for sitemaps, rejected by the ppatour.com property; a ppatoureurope.com GSC property would accept it.
- **Rich Results Test on production:** article → Article valid; event → Event + Breadcrumb valid; rankings → Dataset valid; athlete → Breadcrumb valid but **Product invalid** (no offers/review). Fixed the same night: the paddle node is now `Thing` + `additionalType: Product` (`profile.tsx`), pushed.
- **Apex redirect flip in Vercel** (ppatour.com → www is a domain-level 308): not done from this session — the harness classifies domain changes as off-limits. Vercel → ppatour-website → Domains → ppatour.com → Edit → clear "Redirect to". Do it on a non-event day.

## 3b. Re-audit 2026-10-07 (full crawl, 1,139 sitemap URLs)

All 200, none noindex, every canonical self-referencing, exactly one H1 per page. Phase 1 is live
except where noted. Raw crawl: session scratchpad `ppa/crawl.jsonl` (not kept).

| Item | Status |
|---|---|
| P1-3 title cap | Partial — the cap shortens the suffix only. 385 article titles still >60 (177 >70, some >200); 112 athletes >60 (max 65). Next: cut the headline itself at a word boundary in `lib/news.ts` |
| P1-7 one-hop redirects | www only. `ppatour.com/athlete/x/` and `http://ppatour.com` still 2 hops until the Vercel apex flip (do it on a non-event day, after Chicago 10/11) |
| P1-8 lastmod | Athletes 0/215, events 11/28 |
| P1-10 event schema | `subEvent` missing — not in code on main |
| P1-11 thin athletes | 3 left <300 words: augie-ge, danny-phillips, connor-allen-mogle |

**Shipped 10/7:** `/watch/` and `/athletes/` titles, descriptions, H1s rewritten around the query
(206k impr @ 1.5% CTR and 154k @ 0.6%). Check GSC CTR on 10/31 against the 9/24 baseline.

**GSC page indexing, read 10/7 (report last updated 10/3):** 1.54K indexed, 11.2K not indexed —
but filtered to `sitemap.xml`, **~1.11K of 1,139 are indexed and only 28 are not** (27 "discovered,
not yet crawled": newer international athletes like arwid-dahlin, bartosz-karbownik, plus
/events/2022/miami-open/; 1 duplicate). The 11.2K are URLs Google found elsewhere:
- 5,635 crawled-not-indexed: mostly `/_next/static/chunks/*?dpl=` script/style files, `/leaderboards/?gender=&page=`
  variants, a few athletes. Noise, not lost pages.
- 611 × 401: gated Paddle Lab (`/paddle-lab/*`, Basic auth + `X-Robots-Tag: noindex` since 9/10). Expected.
- 589 × 404: old WordPress patterns — `/players/<slug>/`, root `/<athlete-slug>/`, `/meet-the-team/`,
  `/blog-category/*`, `/<post>/feed/`, junk (`/At`, `/default.htm`). **First four 308 since 10/7** (next.config.ts +
  root athlete slugs in app/[slug]/page.tsx); `/meet-the-team/` → /about/ until /team ships. Junk stays 404.
- 47 × 403: old `/wp-content/uploads/*.pdf` (draws, Player/Tournament Handbooks), denied by the Vercel
  firewall (`x-vercel-mitigated: deny`). Handbook PDFs → /about/player-handbook/
  live 10/7 via a Firewall bypass rule for those two paths only; other /wp-content/ stays 403.
- 139 "Google chose different canonical" (email 10/7): all last crawled Aug 4–6, 9/10 on the apex host;
  launch-week leftovers, falling. **Apex flip done 10/8** (Vercel domain redirect off; next.config
  APEX_LEGACY_REDIRECTS now serve apex → www in one hop, verified live); GSC Validate fix started 10/8.

**New issues found 10/7, ranked:**
1. Unknown athlete slugs 307 → /athletes/ (soft 404). Return 404, or 301 when an alias matches.
2. `/tournament/<slug>/` all land on /events/, not the matching event page.
3. Athlete Person `sameAs` is socials only — no pickleball.com profile (Phase 2 entity work needs it).
4. No `og:url` site-wide; athletes also lack `og:type`, `og:site_name`.
5. `/ppa-blog/` index 404s (noindex, no H1) while its 37 posts are in the sitemap.
6. `/search/` in the sitemap; `/favicon.ico` 404.
7. Duplicate article: `/championship-sunday-standout-stats-from-the-carvana-mesa-cup/` and its `-2`.

## 7. Scorched-earth schema pass (2026-10-18) — and the honest answer on Google score boxes

Bryce, 10/18: *"when you search NFL on Google, it shows the score boxes with game scores. Ours
doesn't. How do we get to that point? Let's go scorched earth on schema markup."*

### 7a. Why the NFL gets a score box and no markup will give us one

**Google's sports score boxes are not driven by schema markup.** The scores, standings and
schedule panels (the "sports OneBox") come from licensed data feeds Google ingests directly from
leagues and from its sports-data partners — historically STATS LLC, today Sportradar / Stats
Perform / Genius Sports class providers — under commercial agreements. Google does not crawl
nfl.com for the box; nfl.com's own pages carry **no JSON-LD at all** (checked 10/18: `/games/`
and `/schedules/` ship zero `application/ld+json` blocks). Same for ufc.com. The box exists
because the NFL's data is in Google's sports knowledge graph, not because of anything on nfl.com.

What *is* true: Google has widened the set of leagues with boxes well beyond the big four —
its own blog says 380+ women's competitions were added through "media and league partnerships".
Smaller leagues get in one of two ways:

1. **A direct feed to Google's sports partnerships team** (league → Google). No public
   application form; it is a partnership conversation.
2. **Distribution through a provider Google already ingests** (league → Sportradar / Genius /
   Stats Perform → Google). This is how most non-major leagues appear.

**So the path is a data-rights conversation, not a code change.** The site's job is to make the
tour and its players unambiguous *entities* so that when the feed lands, Google can attach it —
and to win every SERP feature that *is* markup-driven in the meantime. That is what this pass does.

**Owner asks (not code):**
- **Google sports partnerships.** Ask our Google Ads rep / agency contact to route us to the
  Sports Partnerships team; the pitch is PPA + MLP live scoring (we own the data via
  pickleballtournaments.com, PB-API already serves per-match scores to this site).
  **SENT 10/19** as a reply on the June "Pickleball and Google" thread from Trent Marco
  (Teleperformance on behalf of Google, referred by Chris Patrick) asking for a route to that
  team. The only other Google contacts in the inbox are the same growth-program reps; no named
  Google employee yet. Chase 10/26 if silent.
- **Sportradar / Genius / Stats Perform.** If a betting-data or distribution deal is in flight
  anywhere in the company, Google sports results are a line item to put in that conversation.
  Genius has the PGA Tour; Sportradar has NBL1 — individual-sport tours are in scope.
- **Knowledge Graph entity — the real gap.** *The PPA Tour has no Wikidata item and no Wikipedia
  article.* `en.wikipedia.org/wiki/PPA_Tour` is a **redirect** to a section of "Pickleball in the
  United States" (checked 10/18 via the API — so are "Professional Pickleball Association",
  "Major League Pickleball" and "United Pickleball Association"). Most of our pros redirect to
  "List of professional pickleball players". Google builds knowledge panels and sports entities on
  Wikidata; without an item, "ppa tour" has no entity to hang a box on. **(a) DONE 10/18:**
  Wikidata items created from Bryce's browser — **PPA Tour = Q141769292** (14 statements, sourced:
  instance of, sport, country, inception 2018, parent org, official website/name, every social
  handle, LinkedIn), **United Pickleball Association = Q141769280** (has part: PPA Tour + MLP,
  inception 2024-02-29); MLP (Q128285945, pre-existing) now carries UPA as parent. The org
  JSON-LD `sameAs` points at Q141769292. **(b) SENT 10/19:** Nathan Boschult emailed a sourced
  draft article (founding, Carvana, UPA merger, Pickleball Inc raise, international, rankings;
  broadcasting left for him to source) with the route: own account, COI on the user page,
  Articles for Creation, then set the Wikipedia sitelink on Q141769292. Expect a few weeks of
  review. Same later for Ben Johns-tier pros who still redirect to the list page.
- **MLP Search Console access.** Asked Caitlin (Slack DM 10/19) to add the Jackalope read-only
  service account to the MLP property so the organic read covers all three brands.

### 7b. What shipped (code, all templates)

| Template | Before | After (10/18) |
|---|---|---|
| **Event page** (`lib/event-schema.ts`) | `SportsEvent` with name/dates/place/offer/organizer; `performer` = top 8 seeds | Stable `@id`s (event, place, org); `competitor` + `performer`; **one `subEvent` per pro division** (5), each with its **podium as `competitor` Persons** linked by `@id` to athlete pages once the stop is over (from the committed tournament history, `lib/event-results.ts`); "Champions: …" sentence in `description`; **`BroadcastEvent` nodes per platform** (PBTV / Tennis Channel / FS1 / FS2 / CBS from `lib/broadcast.ts`) via `broadcastOfEvent`; second image (the 1200×630 OG card); `offers` dropped once completed; `isAccessibleForFree` on free stops. Builder is client-safe (NationalsLive still calls it); the 120 KB history JSON is only read server-side. |
| **Events index** (`/events/`) | nothing | `ItemList` of every upcoming Tour stop with an internal page, each a `SportsEvent` summary pointing at its leaf page |
| **Site-wide org** (`app/layout.tsx`) | name, logo, 5 socials | `alternateName` [PPA Tour, Professional Pickleball Association, PPA], `legalName`, `description`, `slogan`, `foundingDate` 2018, `parentOrganization` UPA, `knowsAbout`, `areaServed`, `logo` as ImageObject, `sameAs` + LinkedIn (`/company/ppatour`, verified 200) + the Wikipedia redirect; `WebSite.inLanguage` |
| **Athlete** (`profile.tsx`) | `Person` with socials, paddle, FAQ | `@id` = `/athletes/<slug>/#person` (the same id event podiums and article `about` point at), `mainEntityOfPage`, `nationality` as `Country`, `affiliation` → org, **`sameAs` + Wikipedia/Wikidata** for the 10 pros that have their own item (`lib/athlete-sameas.ts`, verified against the Wikidata API — the rest redirect to a list page and are deliberately left out) |
| **News / blog** (`lib/article-schema.ts`) | `NewsArticle`/`BlogPosting` | `about` (top 3 players in the story) + `mentions` (the rest) as Person `@id`s — the same list the "Players in This Story" rail renders; `publisher` carries the org `@id` |
| Rankings / Leaderboards | `Dataset` + `ItemList` | unchanged (already valid) |

**10/7 issue list, closed in the same pass:** (1) unknown athlete slug → real **404**, not a 307 to
the index (aliases still 308); (2) `/tournament/<slug>/` → **the matching event page**, newest
season (`app/tournament/[slug]`), schedule only when no match; (5) `/ppa-blog/` → `/blog/`;
(6) `/search` out of the sitemap, `/favicon.ico` served (rewrite to the PNG icon). Open: (3)
`sameAs` to pickleball.com profiles — needs their URL pattern (Jason); (4) `og:url` — Next sets
no per-route OG url from the layout, left; (7) the two Mesa Cup stats wraps are both real posts
(2025 and 2026 editions sharing a title) — editorial retitle, not a redirect.

### 7c. What this gets us on Google (markup-driven features)

- **Event rich results / event carousel** for "ppa tour [city]", "pickleball tournament [city]":
  already eligible; the podium + division sub-events make the completed pages the best answer
  for "who won [event]". Google wants a **street address** on `location` — **done 10/18**: every 2026–27 Tour venue
  (and the curated past ones) is in `lib/venue-locations.ts`, each checked against the venue's own
  site (35 keys incl. feed spellings). The 2027 Cape Coral record's venue was changed from "Cape Coral Racquet Club" (unconfirmed) to the
  feed's "The Courts, Cape Coral". Left off as unconfirmed: Liberty Park's street.
- **Knowledge panel** for the tour: the org node now carries enough to seed one, but Google
  will not show a panel without a Wikidata/Wikipedia entity (7a).
- **Top Stories**: `NewsArticle` + news sitemap were Phase 1; `about` Persons now connect stories
  to players. Still owed: Publisher Center application (Phase 2).
- **Sitelinks search box, breadcrumbs**: already live.

### 7d. Verification

Rich Results Test / `validator.schema.org` on one URL per template after deploy:
`/events/2026/veolia-arizona-open/` (completed, podium), `/events/2026/pickleball-world-championships/`
(upcoming, offer, broadcasts), `/athletes/ben-johns/` (sameAs), a native article, `/events/`.
Then GSC → Enhancements → Events on 10/31 alongside the CTR read already scheduled.

### 7e. Organic read, 2026-10-18 (GSC `sc-domain:ppatour.com`, via Jackalope `/api/seo/gsc?brand=ppa&yoy=1`)

| Window (ends 10/15) | Clicks | vs last year | vs prior period | Impressions YoY | CTR | Avg position |
|---|---|---|---|---|---|---|
| 28 days (9/18–10/15) | 245,784 | **+43.9%** (170,840) | +29.5% (189,726) | −11% | 13.2% (LY 8.1%) | 5.1 (LY 8.1) |
| 90 days (7/18–10/15) | 538,187 | −8.5% (588,497) | +25.9% (427,346) | −42% | 9.7% (LY 6.2%) | 5.8 (LY 12.6) |

- The 90-day window straddles the 8/4 relaunch: July–August gave back clicks, September–October are
  well ahead. The impression drop is the old site's long-tail of pages ranking in the 20s; clicks are
  the measure. Mobile clicks +50% YoY in the 28-day window.
- Brand dependence is the problem to work: of the top-25 queries (28d), 93% of clicks are brand
  (`ppa tour`, `ppa pickleball`, `ppa`, event names with "ppa"). Non-brand leaders are
  `pickleball rankings` (1,650), event names without "ppa", and player names (Kiora Kunimoto, Gabe
  Tardio). This is what Phase 2 content + the athlete schema are for.
- `ppa` (the 10/7 gap): now 16% CTR at position 3.8 on 169k impressions (was 2.4% at 6.5).
- Old URLs still earn: `ppatour.com/player-rankings/` 12.9k clicks in 90d on the apex, redirected.
  Nothing to do; it decays as Google re-canonicalises.
- MLP: the GSC service account has no access to `https://www.majorleaguepickleball.co/` (needs a
  Users-and-permissions grant on that property). PBC 28d: 35,252 clicks, −13% vs prior 28 (its own plan).

### 7f. Organic to revenue, 2026-11-18 (Bryce: last 3 months vs previous 3, new site)

Web search, `sc-domain:ppatour.com`, daily table. Revenue = Tixr `rev_orders`, league PPA, status COMPLETE,
buyer-paid gross. "Online" leaves out `ref_type` BACKSTAGE and DOOR.

| | Last 90 days (8/18–11/15/26) | Previous 90 (5/20–8/17/26) | Same 90 last year (8/19–11/16/25) |
|---|---:|---:|---:|
| Google clicks | 611,326 | 261,204 | 633,167 |
| Impressions | 5,371,481 | 5,021,984 | 7,954,847 |
| CTR | 11.38% | 5.20% | 7.96% |
| Average position | 5.3 | 6.2 | 10.2 |
| Online Tixr revenue | $2,202,886 | $818,931 | $1,494,309 |
| **Organic ticket revenue, ESTIMATE** | **~$169K** | **~$62K** | **~$175K** |

- **The estimate:** Tixr revenue with a ppatour.com referrer ÷ Google clicks, on the old site, × organic share of site sessions. Fall 2025: $346,630 ÷ 633,167 = $0.547. Summer 2026 (5/20–8/4): $102,679 ÷ 219,302 = $0.468. Organic share: 50.6% (Jackalope `wa_daily`, 8/30–10/5); 47.3% since 11/13. Low case for the last 90 days: ~$135K (summer rate, 47.3%). About 78% of gross is net.
- ⚠ The method holds revenue per click at the old site's rate, so it cannot show a conversion gain. The last-year figure assumes the same 50.6% share.
- **The +134% vs the previous 90 is mostly season.** May to August has few Tour stops. Year over year the last 90 days are −3.4%. Since launch (8/5–11/15): −10.9% clicks. The 18 days before launch (7/18–8/4): −31.7%. Search Console history starts 7/17/25, so no longer pre-launch YoY exists. Event weeks do not line up year to year, so single weeks and months swing (Sep +31.3%, Oct +8.5%, 11/1–11/15 −18.0%).
- Query split, last 90 days YoY: brand clicks +6.5%, non-brand −13.5%.
- ⚠ **Tixr can no longer see ppatour.com.** Orders with a ppatour.com referrer: 1,642 in fall 2025, 5 in the last 90 days. The ticket links carry `rel="noopener noreferrer"`. Tixr's order data has no UTM field. Dropping `noreferrer` on Tixr links restores the site-level count.
- GA4 read 11/19 (Explore, property 358407319, Event name = `ticket_click`, Hostname contains www.ppatour.com, Oct 22 – Nov 18 2026). The block on 11/18 had cleared; cause unknown.
  - 13,921 ticket clicks from 6,707 users.
  - By session channel: Organic Search 8,018 (58%), Unassigned 3,364, Direct 1,593, Referral 377, Organic Social 314, Email 151, AI Assistant 55 (0.4%), Organic Video 37, Organic Shopping 12.
  - Top pages: Worlds 4,439 · Daytona 2,752 · Malibu Cup 1,527 · Masters 2027 1,262 · Mesa Cup 962 · Cape Coral 692 · home 880. Athlete and rankings pages are not in the top 10. The new block shipped 11/18, so re-read around 12/2.
  - Organic Search is the main source of ticket clicks. AI is real but small. Unassigned (24%) is GA4 losing the source, not a channel.
- Not counted: amateur registration, Vacations, sponsorship value.

### 7g. AI results, 2026-11-18

- **Google AI features** (Search Console → Generative AI, beta, impressions only, history starts 5/18/26): 1,460,294 impressions in 8/18–11/15 vs 1,183,913 in 5/20–8/17 (+23.3%). Regular web impressions rose 7.0% in the same windows. Daily average: 13,372 on the old site (5/20–8/4), 15,675 on the new site (8/5–11/15). Google gives no AI click figure and no last-year comparison.
- Top pages, 3 months: `/` 325,279 · `/rankings/` 172,869 · `/events/` 90,319 · Anna Leigh Waters 79,012 · Ben Johns 58,889.
- **AI assistant visits** (Jackalope `wa_events`, 11/13 on): 413 of 53,683 sessions (0.77%). ChatGPT is 406. One Daytona-week sample.
- ⚠ ChatGPT arrives with `utm_source=chatgpt.com` and no referrer, so Jackalope files it under channel `campaign`. Referrer-only counts miss it (565 sessions for 8/30–10/5). That window's `campaign` channel held 2,748 sessions, so AI was at most about 0.4% of sessions.
- **Tixr orders with an AI referrer:** 3 orders, $455 in the last 90 days; 2 orders, $242 in the previous 90; none in the same 90 last year.
- **Revenue estimate, last 90 days:** about $2K–$3K. About 4,800–9,300 AI visits × $0.277 per session (§7f rate) + the $455 above. At five times that conversion rate, about $13K.
- Crawler access: `robots.txt` allows all, `/llms.txt` is live, and test requests using GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot and PerplexityBot names got 200. Those were not real crawler IPs.

### 7h. What to improve next, 2026-11-18

**Status: items 1 to 4 shipped 11/18. Correction to item 1:** the sticky buy bar is a real ticket path on these pages once a visitor scrolls 480px. The new block adds one inside the content, so its lift may be small. Judge it by `utm_content=athlete-next-stop` and `rankings-next-stop`.


Search Console, last 28 days via Jackalope: 142,727 clicks. Live HTML and `origin/main` read the same day. Page speed not measured: the PageSpeed API returned 429 (daily quota).

1. **Ticket path on athlete and rankings pages.** The top-25 list alone gives athlete pages 18,059 clicks and `/rankings/` 14,914, at least 23% of clicks. Inside `<main>` these pages have no Tixr link. The only ones sit outside it: footer "Tickets" and a site-wide "Buy Tickets — $25". HTML read only, not checked rendered. Use a generic "next on tour" block: no player-to-event feed exists (`DATA-ASKS.md` §5), so never imply the player is in the field.
2. **Drop `noreferrer` from Tixr links, keep `noopener`.** See §7f (1,642 → 5 referred orders).
3. **`/events/` has no canonical tag** (163,516 impressions, 11,808 clicks). `app/events/page.tsx` sets `alternates.types`, which replaces the layout's `alternates.canonical`. Add `canonical` there.
4. **Star player snippets.** "anna leigh waters": 38,728 impressions, 551 clicks, 1.4%, position 2.9. "ben johns": 14,964, 257, 1.7%, position 2.1. "tama shimabukuro": 7,096, 1,700, 24.0%, position 1.7.
5. **Give AI its own channel in Jackalope** (§7g).
6. **Set `NEXT_PUBLIC_CLARITY_ID`.** No Clarity tag appears in the live HTML.

Not problems: `/watch/` (1.0% CTR) and `/athletes/` (1.2%) mostly collect sitelink impressions on "ppa" and "ppa tour". The query `ppa` is now 54,617 impressions, 8.2% CTR, position 3.8 (was 2.4%, 6.5 in August). `/tickets/` is a 404, but ticket searches are small (under 200 impressions per query on any one page).

## 4. Measures and checkpoints

| Checkpoint | Date | Measure |
|---|---|---|
| Baseline | 10/3 | GSC 16-month export in `docs/seo-baseline/`; SEMrush Sept pull |
| Phase 1 shipped | 10/17 | Rich Results Test passes on one URL per template; redirect hops = 1 |
| First read | 10/31 | SEMrush keywords vs 11,918 (Aug); GSC non-brand clicks vs baseline |
| Content half-way | 11/21 | 6 pillars live and indexed |
| Q4 read | 12/15 | SEMrush keywords target ≥ 20,000; Top Stories appearance for a results query |
| Season read | 2/27/27 | Organic sessions (filtered GA4) +20% YoY; keywords ≥ 25,000 |

## 5. Effort, honestly

Phase 1 is roughly three weeks of one engineer in this repo. Phase 2 is a writer (about 40 hours for
12 pillars, pro quotes sourced by the content team) plus a week of code. Phase 3 is comms time, not
engineering. The measurement asks (GSC, SEMrush, GA4 split) are the gating items and none of them
are code.

## 6. pickleball.com (out of scope here, but it decides two items above)

Empty sitemaps, "Search Icon" title tags on player pages, numeric news URLs, zero JSON-LD, six
outbound domains from the homepage. It outranks ppatour.com for our own athletes on domain
strength alone. The architecture decision (one consumer hub vs link hub) is Taylor's and Q4's;
Paddle Lab's home and the athlete-entity canonical both wait on it.
