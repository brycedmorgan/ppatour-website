# PPA Tour Europe on ppatour.com

Bryce's call, 2026-08-24: PPA Tour Europe is built **into** ppatour.com as a
region, not beside it as a fifth website.

Written after reading `#ppa-tour-europe` (Slack, 7/31 → 8/24) and Albert
Escofet's `PPA_Tour-Europe_Website_comments.pdf` (Smash Pickleball Agency,
posted by Payton Pemberton 8/12).

---

## ⚠ Read this before doing anything else

**Europe is the last region where we still have the choice.**

The regional sites are not one situation. They are two, and they need opposite
plans.

| Region | Site | Stack | Domain registrant | Can we redirect it? |
|---|---|---|---|---|
| USA | ppatour.com | Next.js / Vercel | ours | — it is the spine |
| Australia | ppatour.com.au | WordPress / LiteSpeed | **PACIFIC PICKLEBALL PTY LTD** (Sange Carter) | **No.** Not our domain. |
| Asia | ppatour-asia.com | WordPress / Cloudflare | GoDaddy, reg. 2025-04-30 | Unverified. Partner-run. |
| Spain | ppatourspain.com | nginx / AWS | GoDaddy, reg. 2026-03-24, AWS DNS | Partner-run (Smash) |
| Europe | ppatoureurope.com | **GoDaddy parking lander** | GoDaddy, reg. 2024-04-20 | **Yes — nothing is on it.** |

Australia and Asia are **licensed regional operators**, not vendors. The Asia
site links out to `upa-asia.com`, `mlp-asia.com` and
`majorleaguepickleball.net.au` — a whole parallel brand family. Pacific
Pickleball Pty Ltd owns the `.com.au` outright. Converging those two is a
contract conversation, not a routing change, and this document does not propose
it.

Europe has no site yet. That is the whole opportunity. Once Smash ships one,
Europe joins the column we cannot fix.

---

## What the site already does that nobody in the thread knew

**ppatour.com is already the global calendar.** `lib/events-api.ts` reads the
`ppa_tournaments` endpoint, which is every PPA org — US, Australia, Asia, Spain,
Italy — in one feed.

**"Europe" is already a first-class region in the data model.** `COUNTRY_BY_CODE`
in `lib/events-api.ts` maps 17 European ISO-3 codes to a single `Europe` value.
Connor's decision, 7/31: *"Europe is one entry, not a country list — the sister
tours run Italy/Slovenia/Spain today and the filter shouldn't grow a row every
time they add a stop."* `inferCountry()` also catches any org string matching
`/italy|spain|europe/i`.

**The region filter ships today.** `components/events/ScheduleGrid.tsx` renders
All Regions / USA / Asia / Australia / Europe / Canada, in Connor's order (7/31).

So a Europe stop entering the feed already appears on the calendar, already
carries a country chip, and is already filterable. No code required.

---

## Albert's 11 asks, audited against shipped routes

| # | Ask (Smash doc) | Status on ppatour.com |
|---|---|---|
| 1 | Homepage | ✅ `/` — needs a regional variant |
| 2 | Calendar | ✅ `/events` + region filter |
| 3 | News | ✅ `/news` |
| 4 | Rankings | ✅ `/rankings` |
| 5 | Results | ✅ `/brackets`, `/leaderboards`, event pages |
| 6 | Contact Us | ✅ `/about/contact` |
| 7 | How It Works | ✅ `/about/how-it-works` |
| 8 | Player Profiles | ✅ `/athletes/[slug]` — **UNBLOCKED 9/4.** 26 signed pros shipped. |
| 9 | Main menu SHOP link | ⚠ `/shop` is built but hidden. See [`SHOP.md`](SHOP.md). **Do not promise Europe merch.** |
| 10 | Medal ladder | ❌ Net new. Asia-site feature, no equivalent here. Not built. |
| 11 | Photo / video gallery | ❌ Net new. **Waiting on Catie's photos from the first event** (promised 9/3). No placeholder section shipped — an empty gallery is worse than none. |

Seven of eleven already ship. Two are net new. One is commercially blocked. One
is blocked on people, not engineering.

Ask 8 is Albert's loudest note — the doc says, in full, *"There is no Player's
Profile?"* with a reference screenshot. The athlete system already runs 179 US
pros. It needs Europe's roster and photography. Katherina Preis said 8/7 she can
get good quality pictures of every signed player. **That is the unblock, and it
is a person, not a sprint.**

⚠ When those photos arrive, attribute them from provenance. Never by looking.
See the rule in `lib/athlete-heroes.ts` and Wishlist §2 in
[`roadmap.md`](roadmap.md).

---

## The architecture

### Region is a path. Language is a prefix. They are two different axes.

```
ppatour.com/europe          — regional home
ppatour.com/de/europe       — same page, German shell
ppatour.com/es/europe       — same page, Spanish shell
```

Germans live in Spain. Brits live in Portugal. Fusing region and language breaks
both. `/tour/[slug]` already exists as a program template
(`app/(marketing)/tour/[slug]/page.tsx`, driven by `lib/tour-programs.ts`) and is
the natural precedent for a regional route.

`hreflang` tags do the SEO work. One canonical URL per region+locale pair.

### ⚠ Geo-IP suggests. It must never redirect.

A hard geo-redirect:

- **Breaks SEO.** Googlebot crawls from US datacenters. It would only ever see
  the US site, and every European page would go unindexed.
- **Breaks every shared link.** A German posts a Madrid event page, an American
  clicks it and lands somewhere else.
- **Traps travelers and VPN users** with no way out.

Correct behaviour: routing middleware reads the geo hint, a **dismissible
banner** offers the switch, the choice persists in a cookie, and the region
switcher is visible on every page. The URL is never decided by an IP address.

### Translation is a recurring cost, not a launch task

Scope it before committing. Translate the **shell** — nav, filter labels,
buttons, How It Works, static pages — into 4–5 languages. Leave news, blog and
player bios in English until a region commits to writing in-language.

Half-translated pages read as broken, and Google demotes thin machine
translation. If a string is machine translated, label it.

### Domains become redirects

`ppatoureurope.com` → `ppatour.com/europe`, 301, path-preserving. Same for
`ppatourspain.com` and `ppatouritaly.com` — which is what Payton proposed on
8/6 before anyone had looked at the stack.

`ppatour.com.au` and `ppatour-asia.com` stay where they are and keep linking
out. `lib/asia-tour-links.ts` already does this, by hand, with
`npm run asia:audit` to catch drift. That file is the ongoing cost of the silo
model, written down.

---

## The domain portfolio — CONFIRMED 2026-08-24

**`ppatoureurope.com` is ours.** Verified against `domainexport_20260419_149pm.csv`,
the authoritative export Jason Santerre (CTO) attached on **2026-04-19** in the
merger due-diligence thread with Emily Olsen — *"all the domains we manage under
our company account."* Row 446: **Active, auto-renew On.** The redirect plan has
no ownership hole.

The company GoDaddy account holds the whole regional set:

| Row | Domain | Expires | Auto-renew |
|---|---|---|---|
| 440 | ppatour.com | 6/25/2033 | On |
| 443 | ppatourafrica.com | 4/19/2026 | On |
| 444 | ppatourasia.com | 4/19/2026 | On |
| 446 | **ppatoureurope.com** | 4/19/2026 | On |
| 448 | ppatourfrance.com | 2/10/2027 | On |
| 449 | ppatourindia.com | 4/19/2026 | On |
| 450 | ppatouritaly.com | 2/10/2027 | On |
| 453 | ppatourlatinamerica.com | 2/10/2027 | On |
| 456 | ppatoursouthamerica.com | 4/19/2026 | On |

⚠ **`ppatourspain.com` is NOT in the company account.** The export jumps row 456
`ppatoursouthamerica` straight to row 457 `ppavacations.com`. It was registered
2026-03-24 and runs on AWS nameservers, so it is **Smash's own domain** and
predates the export — its absence is real, not a timing artefact. Redirecting
Spain is a request to Smash, not a DNS change we can make.

⚠ **`ppatourasia.com` is ours and parked** while the Asia partner runs
`ppatour-asia.com`, one hyphen apart. A fan who guesses the domain gets a GoDaddy
lander. Worth fixing regardless of what happens with Europe.

`ppatourgermany.com` and `ppatouruk.com` are **unregistered** as of 8/24.

**Where the file lives:** Gmail thread *"Due diligence request - domains and social
media accounts"*, Jason Santerre's 4/19 reply. Note his standing instruction in
that message — anyone holding a company domain in a personal account should
transfer it in. Derk Pardoe holds `ppatournaments.com` that way.

---

## Email — `europe@ppatour.com` is LIVE (created 2026-08-24)

Built in Google Workspace admin as a **Google Group**, which costs nothing and
consumes no licence. Answers Jeff Watson's 8/11 ask.

- **Address:** `europe@ppatour.com` · group id `03jtnz0s23kfa0r`
- **Owner:** Bryce. **Members:** Chris Patrick, Jeff Watson, Katherina Preis
  (all `@pickleball.com`).
- **Access type: Custom.** ⚠ The default *Public* preset does **not** let
  External post, which would bounce every inbound mail from a player, licensee or
  journalist. **"Who can post" is set to include External** — that single setting
  is what makes the address work at all. Do not let a preset overwrite it.
- **Who can join: Only invited users**, so staff can't add themselves and start
  receiving Europe inquiries.

**Still open:** individual addresses for the licensee teams. Each one is a **paid
Workspace seat** for an outside agency's staff, so it needs a headcount first
(asked of Chris Patrick, 8/24). **Kate Young creates the accounts, not Bryce.**
⚠ If they land on `pickleball.com` the naming rule is `first.last@`; only OGs
have a bare first name.

## What actually blocks Europe launching

Not engineering. In order:

1. **The 20 stops are not in the feed.** Chris Patrick announced Germany,
   France, Andorra, Portugal, UK, Spain and Italy on 7/31. As of 8/24 the live
   `/events` page carries **2 Spain stops and 1 Italy stop.** Jeff Watson asked
   for confirmed dates on 7/31 — *"Lmk all the 100% confirmed dates when you have
   them pls"* — and the thread has no answer three weeks later. Until the stops
   are in PB Tournaments, there is no Europe calendar, no Europe results and no
   Europe rankings, on any website anyone builds. **Chris Patrick.**
2. **The player roster and photography.** Blocks Albert's #1 ask. **Katherina
   Preis.**
3. **Smash's new hire.** Payton reported 8/6 that Smash hired someone to manage
   the Europe site technically. Under this plan that person is a content admin in
   our CMS, not a webmaster. Say it early. Smash hosts the majority of Europe
   events, so this needs to be a conversation, not a surprise.
4. **Europe email addresses.** Payton asked 8/6 and again 8/19, still no answer.
   Google Workspace task — `pickleball.com` and `ppatour.com` are one org.

## Also, unrelated to the website but found while reading the channel

⚠ **The `@ppatoureurope` Instagram password was posted in plaintext** in the
public `#ppa-tour-europe` channel on 2026-08-07. Rotate it.

---

## Decisions this document does not make

- Whether Asia and Australia ever converge. Contract question.
- The shop. See [`SHOP.md`](SHOP.md) — Europe inherits that blocker unchanged.
- Which languages ship first. Needs Katherina's read on where the players and
  the audience actually are.


---

## What shipped 2026-09-04 — `/europe` is live in the repo

Built from the content Payton Pemberton posted to `#ppa-tour-europe` on 9/3
(the Europe rules differences, the roster Drive folder, the contact-form ask).

**The route.** `app/(marketing)/europe/page.tsx`, prerendered, 5-minute
revalidate. Linked from the header About menu, the footer, the sitemap and site
search. Sections: schedule, roster, event types, entry & eligibility, rules,
contact.

**The schedule is the live feed, filtered — this page owns no calendar.**
`getEvents()` → `country === "Europe"`. Four stops render today: PPA Italy 125
Portorož, PPA Italy 125 Brescia, PPA Spain P250 Barcelona, PPA Spain P500
Barcelona. That is still 4 of the ~20 Chris Patrick announced on 7/31. An empty
or thin schedule here is a PB Tournaments data gap, never a bug in the page —
the copy degrades to "the 2026–2027 calendar is being confirmed" rather than
inventing dates.

⚠ **Six ISO-3 codes were missing from `COUNTRY_BY_CODE` and are now added:**
`AND` (Andorra — in the 7/31 announcement, and the original gap this doc
flagged), plus `SVK`, `HUN`, `IRL`, `LVA`, `SRB` — every one of which is a
country on the signed roster, so each was a stop that would have silently
dropped out of the Europe filter.

**The roster answers Albert's loudest ask.** `lib/europe-roster.ts` holds 26
signed pros from Catie Preis's "PPA Europe Roster Profile Info" sheet — country,
age, sponsors, Instagram, and her bios. They fold into `lib/athletes.ts`, so
each one mints a real `/athletes/[slug]` page rather than a parallel
`/europe/players/*` route that would duplicate the seven pros already in the
WordPress scrape.

⚠ **`slug` is the pickleball.com player slug, copied from the sheet, never
derived from the name.** It is the same key the WPR board uses, so a Europe pro
on the board picks up a live world rank for free. Several do not match the name:
Matteo Cugliari is `mat-teo`, Ellie Tomkinson is `eleanor-tomkinson`, Katie
Morris is `katie-morris-3`, Héctor Sánchez Vidal is `hector-sanchez-vidal-1`.

**Contact is a form with no address on the page.** Payton, 9/3: *"Don't
publicize the email but have the form forward to us."* `formType="europe"` →
`FORM_INBOX_EUROPE` → the `europe@ppatour.com` group. Do not add a mailto row.

**The rulebook link points at the page, not the PDF.** The live document is
`upaa.unitedpickleball.com/official-rulebook/`. The PDF behind it is currently
`V0.9-8.24.26-UPA-A-Rulebook-.pdf` — a versioned path that will rotate, which is
why the page is the link. The site says it governs **both amateur and pro**
divisions, as asked.

⚠ **A naming discrepancy worth resolving with Payton.** He asked for the "UPA
2026-2027 Rulebook". What UPA-A publishes is titled the **2026 UPA-A Rulebook**,
effective 22 May 2026, currently at V0.9. Either a 2026-2027 edition exists that
is not on the public site, or the season label is informal. The page says
"UPA-A Rulebook" with no year, which is true either way.

### Still open on Europe

1. **The 25 portraits are not in the repo.** They are in Catie's Drive folder
   (`Euro Player Portrait Pictures`), which is not link-shared, and neither the
   `gcloud` token nor a browser session could pull them — Drive redirects the
   download to `drive.usercontent.google.com` and 403s. The roster renders
   initials placeholders until they land in `/public/europe/pros/<slug>.jpg`.
   Unblock: `gcloud auth application-default login --scopes=...drive.readonly`.
2. **Alexia Alvarez has no portrait and no bio** in the sheet at all. She ships
   as a visible gap on purpose. Catie owns it.
3. **The gallery.** Catie's photos from the first event, promised 9/3.
4. **The media credential form.** Payton was drafting it 9/3.
5. **Licensee email accounts.** Payton named five people 9/3: David Botti,
   Daniel Botti, Francesco Foschi, Eddie Jackson, Albert Escofet. Each is a paid
   Workspace seat. **Kate Young creates them, not Bryce.** Not urgent per Payton.
6. **`europe@ppatour.com` membership.** Payton asked 9/3 to remove Jeff Watson
   and add himself. Not yet done — Workspace admin task.
7. **The remaining ~16 stops.** Chris Patrick. Unchanged since 7/31, and still
   the thing that decides whether any of this has a calendar to show.


---

## Unlisted, not private — the launch flag (2026-09-04)

Bryce: *"I want them to be able to see it, but not be live for everyone yet.
Maybe push it but no link to it?"* That is what shipped.

**`EUROPE_PUBLIC` in [`lib/europe-launch.ts`](../lib/europe-launch.ts) is the one
line.** Flip it to `true` and the nav item, the footer link, site search, the
sitemap entries, the noindex directives and the preview banner all resolve
together. Five files read it; none of them needs editing to launch.

| Surface | While `false` | Verified in the build |
|---|---|---|
| `/europe` | Renders in full, `noindex, nofollow`, carries a "Preview — not yet live" banner | ✅ |
| Header About menu · footer · site search | No Europe entry at all | ✅ 0 hits on the homepage |
| `app/sitemap.ts` | No `/europe`, and none of the 19 minted athlete URLs | ✅ |
| The 19 athlete pages the roster **minted** | `noindex, nofollow` | ✅ `arwid-dahlin` |
| The 7 Europe pros who **already had** a scraped profile | Untouched — indexable, still in the sitemap | ✅ `karolina-owczarek` |

⚠ **THE SEVEN ARE THE POINT OF `isUnlistedEuropeAthlete`.** Owczarek, Platel,
Cugliari, Amaro, Paque, Seccia and Protzek had public, indexed profiles long
before Europe was a page. Adding a portrait and a tagline is not a reason to pull
them from the index — that would be a live SEO regression dressed up as a launch
control. Only URLs this work created are held back.

⚠ **UNLISTED IS NOT PRIVATE, AND NOBODY SHOULD BE TOLD IT IS.** Anyone with the
link sees the page. That is the right weight for a public tour's schedule and
roster, and the wrong weight for anything commercially sensitive. A real gate is
HTTP Basic auth in a `proxy.ts` — the shape the 8/5 `/live` work used — not this
flag.

⚠ **AND THERE IS DELIBERATELY NO robots.txt `Disallow`.** Blocking the crawl
stops Google reading the `noindex` it is meant to obey, and a disallowed URL that
someone links to externally can still surface as a bare, contentless result.
**Noindex WITH crawling allowed is the state that actually keeps a page out of
the index.** Do not "tighten" this by adding a Disallow.

⚠ `lib/europe-launch.ts` **imports nothing, and that is load-bearing.**
`Header.tsx` is a client component, so anything that file pulls in ships to every
browser on every page. The first draft imported `europeRoster` and the
179-profile `published-athletes` JSON for the helper that now lives in
`lib/europe-visibility.ts`. Same split as `lib/score-names.ts` beside
`lib/score-headshots.ts`. **Keep it dependency-free.**

---

## Subfolder, not subdomain — settled 2026-09-04

Bryce raised `europe.ppatour.com` and deferred the call. **It stays
`ppatour.com/europe`**, and the three things he named as reasons to reconsider —
region-varying sponsors, languages, and geo-aware loading — are the reasons *not*
to. Every one of them is a data or edge-routing problem, and a subdomain solves
none of them while costing something real.

**1. Authority is the measurable argument, and we have our own numbers.**
Google treats a subdomain as substantially a separate site for link equity.
`ppatour.com` carries 10,976 keywords and turned organic traffic around after
eighteen months of decline — 62,703 in Jul-26 to 74,198 in the first month on the
rebuild ([`roadmap.md`](roadmap.md), and the board deck). A subfolder inherits
that on day one. `europe.ppatour.com` starts at zero and spends a year earning
back something we already own. **We are also about to point `ppatoureurope.com`
at it with a 301** — the whole value of that redirect is consolidating authority
into one property, which a subdomain immediately re-splits.

**2. It re-creates the silo the 8/24 decision existed to avoid.** Australia and
Asia are separate sites, and `lib/asia-tour-links.ts` — a hand-maintained URL
table with `npm run asia:audit` to catch drift — is the written-down cost of that
model. A Europe subdomain is the same shape with better ownership. It would drift
the same way: two headers, two footers, two analytics properties, two Search
Console properties, two sets of partner logos to keep current.

**3. Region-varying sponsors is a data problem.** The fix is a `regions` field on
`Partner` in `lib/home-content.ts` and a region argument on `partnersByTier()`,
so a Europe surface renders the Europe roster and the US surface renders the US
one. That works identically on a path or a host. ⚠ **And it is a commercial
question before it is a code one** — Connor's Gold-and-below designation rule
(9/1) is per-partner, and whether a US Platinum partner appears on a European
page is a contract question for Patrick and Jacob, not a routing decision.

**4. Language is the argument that sounds strongest for a subdomain and is
actually the opposite.** hreflang works on subdirectories, subdomains and ccTLDs
alike, so there is no SEO reason to prefer a host. What differs is maintenance:
`ppatour.com/de/europe` is one property, one certificate, one analytics stream,
one Search Console account. `de.ppatour.com` × 5 languages × 2 regions is ten.
**Region is a path and language is a prefix** — the rule already in this document
— and both are path segments precisely so they can vary independently. Germans
live in Spain.

**5. Geo-aware loading happens at the edge, on either.** Vercel Routing
Middleware reads the geo hint before the cache and can rewrite or suggest on any
path. The binding rule is unchanged and is about behaviour, not hosting:
**geo-IP suggests, never redirects.**

### The one case that would justify a subdomain

If Europe ever runs on a **different stack with an independent release cadence** —
Smash's own CMS, their own deploys, their own team shipping without us. That is a
licensing decision, and Bryce's 8/24 call was the opposite: Europe is ours, with
Smash's hire as a content admin in our CMS.

**Going subfolder-first is the reversible choice.** `/europe` → a subdomain later
is a DNS record and a redirect map. Subdomain-first and consolidating later means
301ing every URL and re-earning the authority in between. If independent deploys
ever become the real requirement without the licensing change, Vercel
microfrontends give that under one domain — a third option that keeps the path.


---

## Two corrections from Bryce, same afternoon (2026-09-04)

### ⚠ The roster shipped 25 broken images, and the fallback I documented never fired

`P()` in `lib/europe-roster.ts` built `/europe/pros/<slug>.jpg` **unconditionally**,
so all 25 records carried a path to a file that is not in the repo. The
silhouette fallback keys on a MISSING `portrait`, so it fired for exactly one
record — Alexia Alvarez, the only pro with no path — and the other 25 rendered
broken images on production. The session note claiming "the roster renders
initials until the portraits land" was **wrong**, and wrong in the direction that
looks fine in a build and fails in a browser.

`PORTRAITS_IN_REPO` now gates the helper. The per-player mapping stays written
down; **flip the flag in the same commit that adds the files, never before.**
**A path is not a picture** — the only safe check is whether the bytes are in
`public/`.

### ⚠ It has to be the site's components, not the site's aesthetic

Bryce, on the first draft: *"This should follow the same feel, look, and
structure we have for the other events and pages. I'm not sure why this is so
different."* He was right, and the reason is worth naming: the page reproduced
the site's *visual language* — the eyebrow rule, the hairline grids, the display
type — while hand-rolling the two components that carry the most behaviour. The
result reads as almost-right, which is worse than obviously wrong.

What the bespoke versions silently dropped:

| Surface | Hand-rolled | Now |
|---|---|---|
| Schedule | A 2-col card grid of my own | **`FeaturedEvents`** — the same big cards, tier badges, date formatting and three link states as `/events` and the homepage |
| Roster | A 4-col portrait grid | **`AthleteRoster`** — search, gender / discipline / rank filters, live world rank, follow chips, and the branded placeholder for a missing portrait |
| Hero | A flat paper-coloured band | The house full-bleed photo + `.scrim-hero` + CTA row, as on `/tour/[slug]` and every event page |

**A regional page is a page OF this site.** Every fix to `FeaturedEvents` or
`AthleteRoster` now lands on `/europe` for free, and neither can drift.
**Do not reintroduce a bespoke card here.**

### The region switcher

`components/global/RegionSwitcher.tsx`, at the top of `/europe`. Bryce asked for
it and the architecture section above already specified it: *"the region
switcher is visible on every page."*

⚠ **Two of the four regions leave the site, and that is not a gap we can close.**
Asia and Australia are licensed regional operators on their own domains, so those
entries are external links marked with a `↗`, the same treatment their event
cards already get. Europe is a path because Europe is the last region we could
fold in.

⚠ **It never redirects anyone.** A visitor picks a region. Geo-IP may one day
suggest one; the URL is never decided by an IP address.

⚠ **It is NOT in the global header yet, deliberately** — while `EUROPE_PUBLIC` is
false, a site-wide switcher naming Europe would advertise the page the flag
exists to keep unlisted. Promote it into `Header.tsx` in the same change that
flips the flag.
