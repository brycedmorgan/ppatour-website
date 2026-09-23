# SEO — portfolio review (ppatour.com · pickleballcentral.com · pickleball.com)

Written 2026-09-23 after Bryce: "I'm a little worried about all of our SEO across the board."
Method: live crawl of each site (homepage, robots, sitemaps, one page per template, JSON-LD,
titles, TTFB) + `docs/seo-baseline` (SEMrush 8/8) + SERP spot checks. **Not** done: GSC,
Core Web Vitals field data (PSI API quota was exhausted), a fresh SEMrush pull (no key on this box).

## ppatour.com — technically sound, content engine is the gap
- Baseline trend (SEMrush US): organic keywords 46,039 (Feb 26) → 11,918 (Aug 26); traffic 75.8k → 66.5k/mo.
  The keyword drop started **before** the 8/4 rebuild (Mar–Jul). Needs a Sept re-pull to see the rebuild's effect.
- Good: canonical, sane robots, 1,135-URL sitemap all 200, SportsEvent/Place/Offer on events,
  Person/FAQ/Product on athletes, BreadcrumbList. Athlete pages are the traffic engine (6k of 21.8k launch-week visitors).
- Gaps: (1) ~800 legacy articles live at flat root slugs with **no NewsArticle/Article schema**; `/ppa-blog/` newest 2026-02-04
  (37 posts) — the evergreen "how to play / rules / gear" blog is thin vs the-kitchen/the-dink;
  (2) homepage H1 is the hero event card ("Rate Las Vegas Open"), not the brand/keyword;
  (3) rankings page has no structured data despite ranking #1 for "pickleball rankings" (2,400/mo);
  (4) sitemap has no `lastmod` on athletes/events.

## pickleballcentral.com — BigCommerce, strong, needs housekeeping not surgery
- Ranks top-2 for "pickleball paddles" and #1 organic for "best pickleball paddles 2026" (spot check).
  Product pages carry full Product/Offer/AggregateRating/Review JSON-LD. Blog is active (Sep 16 latest).
- Gaps: (1) sitemap = 1,671 products / 228 categories / 119 brands / 724 posts / 33 pages with **zero `lastmod`**;
  (2) category pages: ~200 words copy, no ItemList schema, product grid is Searchspring (client-rendered → 0 product cards in HTML);
  (3) blog posts have **no Article schema, no visible dates**, ~724 posts back to 2017 with no pruning;
  (4) `/the-ultimate-paddle-guide/` is robots-blocked AND live with a self-canonical — should 301 to `/paddle-guide/` (10.7k words, the real asset);
  (5) 79 scripts incl. Google Optimize (dead since 2023), Yotpo, Searchspring, Rebillia — CWV risk, TTFB ~0.65s on categories, `no-store`;
  (6) the "best paddles" SERP is owned by review/affiliate media (Pickleball Effect, Pickleball Studio, Matt's, Pickleheads) — PBC's
  counter is editorial ranking pages + Paddle Lab data, not more category copy.

## pickleball.com — biggest asset, weakest plumbing; a re-skin alone won't fix it
- SEMrush: 16,906 kw / ~26k organic/mo with authority score 37 on an exact-match category domain. It is under-earning by an order of magnitude.
- Structural: homepage is a **link hub to 6 other domains** (pickleballtournaments, teamleagues, leagues, clubs, pickleballtv, justcourts);
  `/tournaments` `/clubs` `/shop` `/places` `/ratings` all 404. Authority is fragmented across domains instead of compounding on one.
- Broken basics: player pages `<title>` = "Search Icon"; news articles use the site default title, numeric URLs (`/news/196`), 0 JSON-LD, no dates;
  homepage/rankings H1 is the logo `<img>`; rankings table is client-rendered (no "Ben Johns" in HTML);
  **sitemaps are effectively empty** (players-sitemap = 1 URL, news-sitemap = 1 URL, tournaments index = 0);
  CloudFront returns 403 to Googlebot/bingbot UAs from outside Google IPs (likely WAF anti-spoof; verify real Googlebot in GSC URL Inspection);
  TTFB ~0.6s vs 0.16s on ppatour.
- Note GA4 property `358407319` mixes pickleball.com with brackets/tournaments — see ANALYTICS.md before quoting numbers.

## Recommended sequence
1. **Now, cheap (PBC + PPA):** lastmod in sitemaps; Article schema + dates on both blogs; 301 the old paddle guide; drop dead scripts;
   ItemList on PBC categories; fix PPA homepage H1; add structured data to /rankings.
2. **Measurement first:** GSC access for all three properties to one place; monthly SEMrush pull (key needed); split GA4.
3. **pickleball.com decision (Q4):** architecture, not skin — one domain, one nav, real indexable pages for players/news/rankings/
   places/tournaments discovery (subfolders, with the transactional apps staying on their domains), server-rendered, proper sitemaps.
   Paddle Lab already slated to move here (Taylor 9/10). New MLP site shipping is the reason to align the two builds' stack and schema.
