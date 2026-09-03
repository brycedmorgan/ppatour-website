# Paddle Lab — `/paddle-lab`

A paddle research tool: search, filter and compare paddles on measured test
data, read editorial, click through to Pickleball Central. Requested by Hannah
Johns (Senior Chief Editor) on 2026-08-28, from her "Paddle Lab (V1)" brief.
Bryce's call on 2026-09-03: build it in this stack now. Hannah's brief said
pickleball.com; that is a hosting decision for later (a path rewrite from
pickleball.com onto this app is the likely shape).

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
paddle string resolves to exactly one lab record (`labPaddleForName`).

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

## Images

Only the six curated cut-outs in `lib/paddle-images.ts` render a photo; every
other paddle gets the branded navy tile (`PaddleTile`). Product photography
needs a PBC feed (SKU → image → price → handle), which is also the right way to
get live prices and the Shopify-era URLs. Ask in DATA-ASKS.md.

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
