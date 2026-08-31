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
| 8 | Player Profiles | ✅ `/athletes/[slug]` — **blocked on Europe roster + photos** |
| 9 | Main menu SHOP link | ⚠ `/shop` is built but hidden. See [`SHOP.md`](SHOP.md). **Do not promise Europe merch.** |
| 10 | Medal ladder | ❌ Net new. Asia-site feature, no equivalent here. |
| 11 | Photo / video gallery | ❌ Net new. Ask what it is for before building. |

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
