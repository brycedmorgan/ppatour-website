# ppatour.com — SEO plan and roadmap

Written 2026-09-23 (review), expanded same day into a plan after Bryce: "Go dig deeper and build a
plan and roadmap." Method: full crawl of the 1,135-URL sitemap (every URL fetched, titles,
descriptions, canonicals, H1s, JSON-LD, word counts, dates), legacy-URL redirect tests, the code
paths that emit metadata, `docs/seo-baseline` (SEMrush 8/8), SERP spot checks. **Update 2026-09-24:** GSC and SEMrush baselines pulled through Jackalope's `/api/seo/*` endpoints
(the service account reads both properties; the SEMrush key lives on the Vercel project) →
[`seo-baseline/gsc-semrush-2026-09-24.md`](seo-baseline/gsc-semrush-2026-09-24.md). Phase 1 shipped
to `main` the same day (9 commits, branch `seo/phase-1`, not yet pushed). Still not measured: Core Web
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

### Phase 1 — Technical fixes — SHIPPED TO MAIN 9/24 (awaiting push; see CLAUDE.md session log for per-item notes)
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
