# Paddle Lab — `/paddle-lab`

A paddle research tool: search, filter and compare paddles on measured test
data, read editorial, click through to Pickleball Central. Requested by Hannah
Johns (Senior Chief Editor) on 2026-08-28, from her "Paddle Lab (V1)" brief.
Bryce's call on 2026-09-03: build it in this stack now. Hannah's brief said
pickleball.com; that is a hosting decision for later (a path rewrite from
pickleball.com onto this app is the likely shape).

## ⚠ GATED SINCE 2026-09-10 — password, no links, no index

The lab is built and complete, and no member of the public can reach it.

**What happened.** Gordon Kaye, Chief Experience Officer at JOOLA, emailed
Connor Pardoe on 2026-09-10 after finding `/paddle-lab/` from a player profile.
His argument, in his words: JOOLA spends $1.5M+ with the tour this year, $2M+
next, plus ~$500k funding into Pickleball Central, and the tour is "doing a
great job promoting hundreds of paddles and dozens of brands in a manner
considerably better than the brands that actually support you." Two further
points, both real:

1. **Every buy link goes to pickleballcentral.com**, so PBC reads as
   co-signing the measurements, not just selling the paddle.
2. **The numbers contradict our own testing standard.** UPA-A publishes a max
   of 2100 RPM. Most of the lab's top all-court paddles show 2200+, because
   these are John Kew's independent tests and nothing syncs them to UPA-A.
   Kaye's phrase: it "challenges the authenticity and validity of your own
   testing standards."

Taylor Loomis, same morning: *"We should pull this down for now until we have a
better path. Probably lives only on pickleball.com."* Bryce replied to Taylor
and Connor that the lab will move to pickleball.com, and was built here only
because this stack is where it could be built and demoed. Bryce's instruction:
*"Please make this not linkable.... and password protected."*

**How the gate is built.**

| Piece | Where |
|---|---|
| The switch | `lib/paddle-lab-access.ts` → `PADDLE_LAB_PUBLIC = false` |
| The password | `proxy.ts` — HTTP Basic auth on `/paddle-lab` and everything under it |
| Credentials | `PADDLE_LAB_USER` (default `ppa`) + `PADDLE_LAB_PASSWORD`, set in Vercel Production, Preview and Development |
| Nav + footer | `components/global/Header.tsx`, `components/global/SiteFooter.tsx` — the item is gone, not hidden with CSS |
| Sitemap | `app/sitemap.ts` — the three lab paths and all 818 paddle URLs are out |
| Athlete pages | `app/athletes/[slug]/page.tsx` — `LabStatsMini` and "See it in the Paddle Lab" are gone; the PBC product photo stays, because a shop photo is not lab data |
| Index signals | `noindex` in `app/paddle-lab/layout.tsx`, plus `X-Robots-Tag: noindex, nofollow` on the 401 itself |

**It fails closed.** No `PADDLE_LAB_PASSWORD` in the environment means every
request is refused. A gate that silently opens when a deploy loses a variable is
worse than no gate.

**No robots.txt `Disallow`, on purpose.** A disallowed URL can never be
recrawled, so Google would keep any already-indexed `/paddle-lab/` URL as a
bare, contentless result forever. A crawlable 401 carrying `noindex` is what
actually gets the pages dropped. Google's Removals tool in Search Console is the
fast path for anything already indexed — that is a person's job, not the build's.

**Reopening it is one line, and it is not a developer's call.** Flipping
`PADDLE_LAB_PUBLIC` to `true` restores the nav item, the footer link, the
sitemap entries and the athlete-page stats, and drops the password. Three things
land first: terms with John Kew (Hannah Johns owns that conversation), an answer
to the UPA-A vs Kew RPM conflict, and a partner-brand position Gordon Kaye can
live with. And the agreed home is pickleball.com, not here.

## Routes

| Route | What | Rendering |
|---|---|---|
| `/paddle-lab/` | Landing: hero + search, four tiles, trending/newest rail, How We Test, PBC quiz link | static |
| `/paddle-lab/paddles/` | Browse all, filters in the URL (`?brand=&price=&shape=&tilt=&spin=&thickness=&weight=&skill=&sort=&q=`) | static shell, client filter |
| `/paddle-lab/[slug]/` | One paddle: header, shop CTA, compare button, metric bars, specs, editorial, similar | static, 468 pages, `dynamicParams = false` |
| `/paddle-lab/compare/?p=a,b,c,d` | Up to four side by side. URL is the source of truth; `&swap=<slug>` puts the picker in swap mode | dynamic, noindex |
| `/paddle-lab/how-we-test/` | Partnership, data source, editorial process, glossary, certification, what we won't do | static |

Nav: About mega-panel + About mobile submenu + footer "PPA" column. Athlete
pages: "See the lab data →" under the In the Bag buy button when the pro's
paddle string resolves to exactly one lab record (`labPaddleForName`). ⚠ ALL OF
THAT IS SWITCHED OFF while `PADDLE_LAB_PUBLIC` is false — see the gate section
above. This table describes the lab as it will be, not as the public sees it.

## Data: two files, two kinds of thing

**The grid** — `lib/data/paddles.json`. Written ONLY by
`scripts/import-paddle-lab.mjs` from `lib/data/paddle-lab-kew.csv`, a
committed snapshot of the Google Sheet that johnkewpickleball.com/paddle-database
loads at runtime. 468 paddles, 83 brands, 64 source columns. Nothing in the app
computes a rating; the 0–100 bars are John's own "Scaled Z-Score" columns.
The only derived things are filter buckets (price band, weight band, thickness
band) in `lib/paddle-lab-shared.ts`, and those are UI groupings.

```
npm run lab:report    # parse the snapshot, print counts, write nothing
npm run lab:import    # parse → lib/data/paddles.json
npm run lab:refresh   # re-download the sheet into the snapshot first, then import
```

The importer refuses if the sheet's header changes, reports duplicate rows
(4 today) rather than merging them, and copies NONE of John's affiliate columns
(`Link to Purchase`, `Discount Code`, `Discount`, `Discounted Price`).

**The prose** — `lib/data/paddle-lab-editorial.json`, keyed by slug. Hannah's
team owns it. Every field optional:

```json
{
  "joola-perseus-3s-16mm": {
    "skill": ["intermediate", "advanced"],
    "summary": "One or two sentences. Shows on the card and at the top of the page.",
    "review": "Paragraphs separated by blank lines.",
    "pros": ["…"], "cons": ["…"],
    "pbcUrl": "https://www.pickleballcentral.com/<exact product page>/",
    "trending": true,
    "reviewedBy": "Hannah Johns", "reviewedOn": "2026-09-10"
  }
}
```

Skill level is the ONE place opinion enters the lab, and the How We Test page
says so. The "Best Beginner Paddles" tile and the Skill filter are empty until
editors tag paddles. "Trending" falls back to newest-tested until a `trending`
flag exists, and the rail is labelled "Newly tested" while it does.

## Shop links

`lib/pbc-links.ts` ladder, same as athlete pages: pinned `pbcUrl` → PBC brand
page (17 brands verified) → `/paddles/`. UTM: `campaign=paddle-lab`,
`content=shop-cta`, `term=<slug>`. Clicks count as `partner_click` in GA4
(pickleballcentral.com is already in OutboundClickTracker). PBC's Paddle Finder
quiz is linked from the landing page with `content=paddle-finder-quiz`.

⚠ PBC moves to Shopify in January 2027 (tracked as Jan 18). Every brand-page
and product URL may change. Pinned URLs live in ONE file (the editorial JSON),
so the fix is a find-and-replace there plus a refresh of `BRAND_PAGES` in
pbc-links.ts. Do not scatter PBC URLs anywhere else.

## The list is the union of Kew and PBC (Bryce, 9/3 pt. 3)

Bryce: "why did we not pull in paddles from PBC and link to them to purchase?"
So the lab's list is now every tested paddle PLUS every paddle Pickleball
Central sells that Kew hasn't measured. `lib/paddle-lab.ts` builds the union at
load: 468 tested + 350 shop-only = **818 paddles**, each with a page, a buy
button and (for shop-only) a photo and live price. Shop-only records carry
`tested: false`, `shape: "Unknown"`, empty metrics; their page says "Not yet
tested" and the card says the same instead of three dashes. The browse page
has a "Lab-tested only" toggle (`?tested=1`). Sold-out products (PBC
`availability: oos`, 75 at crawl) are labelled, never hidden.

Athlete pages: a tested paddle now shows five headline stats with bars inside
the In the Bag card (`LabStatsMini`), and the card's photo falls back to the
lab's PBC product shot when the feed has none.

### Near-misses to confirm (alias table)

Review sheet sent to Hannah, Samin and Taylor on 2026-09-04 (73 rows, Y/N in
the last column):
https://docs.google.com/spreadsheets/d/1hOCvqEgXsKXVA5r0Sy6SqjMWWLhBSGfwQ7kQe2rhm20/edit
When it comes back, each Y becomes one `ALIASES` line, then `npm run lab:pbc`.

`lib/data/pbc-near-misses.json` (59 today) lists Kew paddles where brand,
model and thickness agree with a PBC product but a stray title token blocked
the match ("Hurache-X Power" vs "Hurache-X Power 2", "Perseus 3S" vs "Perseus
Pro 3S Dual"). A human confirms each pair, then adds `kewSlug: pbcUrl` to
`ALIASES` in `scripts/import-pbc-paddles.mjs` and re-runs `npm run lab:pbc`.
Never resolve one by loosening the rule.

## Images and live prices (Pickleball Central crawl)

`scripts/import-pbc-paddles.mjs` crawls PBC's product sitemap (their category
and search pages are client-rendered, so there is nothing else to scrape),
reads each paddle product page's `og:image` + JSON-LD offer, and writes
`lib/data/pbc-paddle-catalog.json` (487 products, raw). A second pass matches
lab paddles to catalogue products and writes `lib/data/paddle-pbc.json`
(slug → url, title, image, price, availability, sku).

```
npm run lab:pbc          # re-match from the committed catalogue
npm run lab:pbc:crawl    # re-crawl PBC (~800 pages, a few minutes), then match
```

**82 of 468 matched (2026-09-03).** The matcher refuses ties and any PBC title
with a token beyond brand + model + a short noise list. That is deliberate: a
first pass without the token rule matched "Hurache-X Power" to "Hurache-X Power
2" and "Perseus 3S" to "Perseus Pro 3S". A wrong photo on a paddle page is
worse than the brand tile. The unmatched 386 get one of two things:

- an editor's `pbcUrl` pin in the editorial JSON (the matcher's output is then
  irrelevant for that paddle: the pin wins for the shop link; the photo still
  comes from the crawl only if matched), or
- a future alias table in the script, once Hannah/John confirm which Kew names
  equal which PBC titles (JOOLA's "Perseus 3S" vs "Perseus Pro 3S Dual" is the
  big one: 24 tour pros play JOOLA).

Photo priority in `PaddleTile`: curated cut-out → PBC photo (white plate) →
brand tile. Price shown is PBC's when matched ("when we last checked"), else
John's recorded list price. `next.config.ts` allowlists `cdn11.bigcommerce.com`.

## Landing page extras (Bryce, 9/3)

- **Predictive search** (`LabSearch`): brands, then paddles, then "see all".
  In-memory over a ~40 KB index passed from the server page.
- **What the pros play** (`ProsByBrand`, `lib/paddle-lab-pros.ts`): head count
  per brand from the broadcast masterlist (`athlete-paddles.json`, 91 pros),
  top models per brand, a few names. Links to the lab page only when
  `labPaddleForName` resolves exactly one record.

## Metric semantics we assert (verify with John before launch)

- Power = `Serve Speed-MPH (Power)`, Pop = `Punch Volley Speed-MPH (Pop)`;
  the retired radar columns are ignored. 251 of 468 paddles have these.
- Play style = `Tilt Band` folded to power / balanced / pop. 216 have none.
- Spin Durability Tier is shown as published with NO direction claimed; we do
  not know whether Tier 1 or Tier 4 is "better". Ask John.
- Certification strings (15 spellings) fold to 8 buckets in the importer; the
  raw string still shows on the paddle page.
- "Notable gap" dot on compare = two scaled scores ≥ 15 points apart. Display
  threshold only.

## Licensing — NOT SIGNED

The sheet is public and Hannah says John is on board, but there are no terms.
This is a preview build until there are. Terms need: attribution wording,
refresh cadence, whether we may show the whole database or a subset, whether
he is paid, and whether PBC affiliate revenue is shared. The How We Test page
already credits him by name and links his database on every paddle page.

## Launch checklist

- [ ] Kew terms signed (Hannah / Bryce)
- [ ] Hannah confirms the metric semantics above with John
- [ ] Editorial JSON: at least the "Best Beginner" set tagged so the tile isn't empty
- [ ] PBC product feed for photos + live prices (Traver)
- [ ] Decide the host: pickleball.com path rewrite vs ppatour.com/paddle-lab
- [ ] PPL (Pro Pickleball Labs) data: Hannah's brief names them as a second source; they publish no public database. Ask what they'd supply.

## Hero photography (added 2026-09-03)

The landing hero is a full-bleed photograph — `public/ppa/action-champ-sunday.jpg`,
a pro at the moment of contact — behind `.scrim-hero-lab`.

**Two things about it are deliberate and should not be "fixed":**

1. **Nobody is named and no paddle is credited.** Attributing an athlete from a
   frame is how the wrong player ends up on a page, and the How We Test page says
   "nobody pays to be here" — crediting a paddle brand on the hero of a neutral
   lab would undercut that. The `alt` is empty because the image is decorative;
   the headline carries the meaning.
2. **`.scrim-hero-lab` is its own scrim and needed to be.** Every other hero on
   this site puts a short headline over the FOOT of a photo, so the house scrims
   are bottom-weighted (0.08 at the top). This hero's content column — eyebrow,
   headline, paragraph, search field, stat row — runs the full height, so a
   bottom-weighted gradient leaves the eyebrow on bare photograph. It never thins
   past 0.74 (6.9:1 white-on-worst-case at the top, 14.4:1 at the foot), carries
   an extra even veil below lg where the headline wraps through the busiest part
   of the crowd, and is masked at lg so the right edge reads as photography.

To swap the photo, change the `src` in `app/paddle-lab/page.tsx`. Anything wide,
sunlit and paddle-forward works; `action-singles.jpg` is the strongest
alternative (full-stretch lunge, ball on the paddle face, dark backdrop) but its
paddle sits at the far LEFT of the frame, directly under the headline.

## The two catalogues, and how compare has to behave (2026-09-04)

The lab is **818 paddles: 468 John Kew has measured and 350 Pickleball Central
sells that he has not.** A shop-only record is `tested: false` — a photo, a
price and a buy button, and `null` for every metric.

Browse already handles this (a "Not yet tested" card state and a **Lab-tested
only** filter). **Compare did not**, and it produced the one screen where the
gap is unreadable: three untested paddles side by side, every row "Unknown" or
an em dash, and nothing saying why.

**⚠ THE PICKER WAS THE ACTUAL CAUSE, NOT THE TABLE.** It filtered by query and
took the first 8 in alphabetical order, and the two catalogues interleave.
Measured: a search for **"joola" returned eight untested paddles and zero
tested ones** in that top 8 — so a fan comparing JOOLA paddles could not reach a
measured one from the search box at all. Tested now rank first (joola 8/8
tested, hyperion and scorpeus lead with theirs), and an untested row reads
"In the shop, not tested yet" where the specs would be.

Two other rules on that page:

- **The card is a flex column and the name reserves two lines.** Paddle names
  wrap unevenly, so a plain stack put the price and the Shop button at a
  different height in every column — on the one screen whose whole job is
  reading across. Buttons are pinned with `mt-auto` so they align whatever the
  name does.
- **The explanation goes ABOVE the table, once, naming the paddles.** Twenty
  blank cells read as a broken page; one sentence reads as the truth.

