# Athletes on the site — how they get here, and where their information comes from

Written 2026-08-07, updated 2026-08-11, against `origin/main`. Every count and
file path below was checked against the code rather than remembered, and the API
sections were probed against the live endpoints rather than inferred.

---

## The short version

There is no single "athlete database". A pro's page is assembled at request time
from **three independent layers**, and a pro can be on one, two or all three:

| Layer | What it is | What it supplies | Who maintains it | Size today |
|---|---|---|---|---|
| **1. The live board** | Pickleball.com Partner API (`partner_rankings`) | Rank, points, country + flag, cutout headshot, DUPR, career medals | Pickleball.com — **automatic** | ~2,075 ranked pros |
| **2. Published profiles** | `lib/data/published-athletes.json` | Bio, Quick Info (resides / DOB / height / plays / turned pro), divisions | **Us, by hand** | 179 records |
| **3. Curated roster** | `lib/athletes.ts` + `public/ppa/pros/*.jpg` | Official studio headshot, one-line tagline | **Us, by hand** | 40 pros |

Any one of the three is enough to render a page. What differs is how good the
page is — and, crucially, **only layer 2 puts an athlete in the `/athletes`
grid.**

---

## What the profile page shows, and where each field comes from

`app/athletes/[slug]/page.tsx` → `loadAthlete()` merges the three layers in a
fixed priority. First non-empty source wins:

| On the page | 1st choice | 2nd | 3rd | If nothing |
|---|---|---|---|---|
| Name | curated | published | live board | — |
| **World Rank / Points** | **live board only** | — | — | shows a dash |
| Headshot | curated studio crop | live board cutout | — | initials chip |
| Bio | published | curated summary | — | one generic sentence |
| Divisions | published | curated | — | hidden |
| Quick Info | published | — | — | hidden |
| Tagline | curated | published headline | generic line | — |
| Career medals, age, height, handedness, hometown | stats endpoint (`lib/athlete-stats.ts`) | — | — | hidden |
| Paddle / "In the Bag" | broadcast masterlist | — | — | **hidden — correct** |

⚠ **DUPR is fetched but rendered nowhere.** `lib/athlete-stats.ts` pulls
`duprSingles` / `duprDoubles` on every profile and nothing displays them — the
ratings were pulled from the page on 29 Jul per Connor. If you're looking for
where DUPR shows up, the answer is that it doesn't.

⚠ **Rank never falls back.** `lib/athletes.ts` carries a `bestRank` field that is
a hand-maintained *career-best* from May 2026 and is wrong for 31 of the 40 pros
(Andre Mercado reads 10; he is live 108). It is deliberately never rendered. No
live rank → a dash, not a stale number.

---

## Which pros get a page at all

`generateStaticParams` builds a page for:

- every slug in the curated roster (40), **plus**
- every published profile (179), **plus**
- the **top 25 men and top 25 women** on the live board.

Anything else is rendered on demand. Live lookups (`getWprPlayerBySlug`,
`getWprIndex`) scan the **first 250 rows of each gender board**, so a ranked pro
inside the top 250 gets a working page — rank, points, headshot — the moment they
appear upstream, with no code change from us. Below 250 and not in our own two
files, there is nothing to build a page from, and the URL **redirects to
`/athletes`** rather than 404ing.

⚠ **A page is not a card.** The `/athletes` grid is built from
`publishedAthletes` and nothing else. So a newly ranked pro can have a perfectly
good profile page that is unreachable by browsing — you'd only find them through
`/rankings`, search, or a direct link. Getting them into the grid means adding a
record by hand (below).

---

## Adding an athlete

### Case A — they're ranked on the board, and that's enough

**Do nothing.** They inherit a page with live rank, points, flag and the API's
cutout headshot. It will have no bio and no Quick Info, and they won't appear in
the `/athletes` grid.

The board refreshes daily (Data Cache, tagged `ATHLETES_CACHE_TAG`, refreshed by
the `/api/revalidate-athletes` cron), so upstream changes reach the site within a
day without a deploy.

### Case B — you want a real profile: bio, Quick Info, and a card on /athletes

Add a record to **`lib/data/published-athletes.json`**. This is the file that
matters most and the one with the least tooling around it.

⚠ **There is no importer script for this file.** The 179 records came from a
one-time scrape of the old WordPress profiles on ppatour.com; nothing regenerates
them. Adding a pro is a hand-edited JSON record, reviewed like code.

The shape, verbatim:

```json
{
  "name": "Ben Johns",
  "slug": "ben-johns",
  "url": "https://ppatour.com/athlete/ben-johns/",
  "country": "USA",
  "divisions": ["Men's Doubles", "Men's Mixed Doubles", "Men's Singles"],
  "quick_info": {
    "resides": "Boca Raton, FL",
    "dob": "1999-03-18",
    "height": "6′ 0”",
    "plays": "Right-handed",
    "turned_pro": "2016-01-01",
    "paddle": "JOOLA Perseus"
  },
  "bio": "Ben Johns: The Greatest Pickleball Player of All Time Ben Johns is widely regarded…"
}
```

Notes on the fields:

- **`slug` is the join key — see the section below. Get this wrong and the
  profile silently loses its rank, points and headshot.**
- `bio` is one long string. It is cleaned at load: section headers are split into
  paragraphs, duplicated text collapsed, and everything from "Related Articles",
  "Frequently Asked Questions" or "Off the Court" onward is dropped. You do not
  need to pre-format it, but do not paste an FAQ block expecting it to render.
- `country` drives the flag via a name→ISO table in `lib/published-athletes.ts`.
  A country not in that table shows no flag — add a line if needed.
- `divisions` drives the divisions chips and, when the board doesn't know the
  player, their gender.
- ⚠ **`quick_info.paddle` is dead.** It came with the 2024 scrape, nobody
  maintains it, and equipment now comes from the masterlist (below). Leave it
  alone; don't rely on it; don't add it as a way to give someone a paddle.

Then run **`npm run athletes:audit`** before committing. It checks the file
against the live board and fails on duplicate slugs, duplicate names, and slugs
the board says are duplicates of another profile.

### Case C — a top pro who should have a studio headshot and a tagline

Add an entry to **`lib/athletes.ts`** and drop a square, optimized JPG at
`public/ppa/pros/<slug>.jpg` (existing ones are ~700px, 80–120 KB, centre-cropped
from the official media library). This is what makes the 40 flagship profiles
look better than the rest, and it also supplies headshots to the homepage
rankings module and champions banners.

**Keep the curated slug identical to the board's `player_slug`.** If they
genuinely have to differ, the pair goes in `CURATED_TO_CANONICAL` in
`lib/published-athletes.ts` — that map is what keeps one person from rendering as
two pages (e.g. `tyra-black` → `hurricane-tyra-black`).

⚠ **But that map does not cover everything, and the gap is invisible.**
`getWprPlayerBySlug` aliases through it, so rank, points and the flag survive.
`getAthleteStats`, `getDivisionRanks` and `getAthleteVideoData` are all called
with the **route** slug and do not alias, so an aliased pro loses **career
medals, division ranks and highlight videos** — and the page renders perfectly,
just without those sections. That is the live cost today for `gabe-tardio`,
`tyra-black`, `paris-todd`, `megan-dizon` and `eddie-perez`. Don't add a sixth
pair casually; either use the canonical slug or fix the aliasing first.

---

## ⚠ The slug is the whole thing, and it is where this breaks

`slug` in the published JSON **must be the Partner API's `player_slug`**. That
string is the join that puts a live rank, points and a headshot on the page.

WordPress breaks it: it mints a `-2` slug whenever a second post is created under
an existing name. Four of those shipped as real, duplicate pages
(`elsie-hendershot-2`, `danna-funaro-2`, `ella-cosma-2`, `edward-perez-2`). Each
one *won* on `/athletes` — it rendered the only card for that athlete, missed
every live lookup (rank 0, no headshot) and linked to the thinner of the two
pages.

**"Strip the trailing number" is exactly the wrong fix:**

- `luana-stanciu-1` **is** the API's own canonical slug for world No. 91 — there
  is no `luana-stanciu` on the board.
- `ben-johns-3` (No. 682) and `patrick-smith-10` (No. 1192) are **real,
  different people** who share a name with a higher-ranked pro.

The arbiter is the board, never the string: a slug is a duplicate only when the
board doesn't list it **and** lists exactly one player with that name. Ambiguity
is left alone. `lib/athlete-slugs.ts` enforces this at render time (and degrades
to doing nothing if the API is unavailable — a duplicate page is bad, a page for
the *wrong person* is worse). `npm run athletes:audit` catches what render time
can't.

⚠ **The audit has a blind spot: it checks slugs against the boards it can page
through, so a slug that matches nobody at all is not necessarily reported.**
Resolving all 179 published slugs against `/v1/data/users/{slug}` directly on
2026-08-11 turned up one that **404s: `connor-allen-mogle`.** The API knows him as
`connor-mogle` (a real `proLevelId: 5` tour pro), so that profile renders with no
rank, no points, no headshot, no medals and no highlights — exactly the silent
failure this section is about. Fixing it moves the URL, so it needs a redirect
alongside the data edit.

---

## Is there a "PPA Pro" flag in the API?

Yes — **`proLevelId` on `/v1/data/users/{slug}`**, with `badgeTitle` as its
human-readable label. Probed live 2026-08-11 against all 179 published profiles
and a spread of the ranked boards.

| `proLevelId` | `badgeTitle` | What it means | Our 179 profiles |
|---|---|---|---|
| `5` | `TOUR PRO` | The tour-pro designation | **169** |
| `1` | *(empty)* | Has a `turnedPro` date and a `ppaRanking`, but no badge | 8 |
| `4` | `TITAN` / `CONTENDER` / `BALLER` / *(empty)* | Rec player — see the warning below | 1 |

⚠ **`badgeTitle` is overloaded and must not be read as a tour field.** For
`proLevelId: 4` accounts it carries Pickleball.com's own gamified skill tiers
(TITAN, CONTENDER, BALLER). `badgeTitle === "TOUR PRO"` is safe; "has a
badgeTitle" is not. Gate on `proLevelId`.

⚠ **It is not a ranking threshold, which is what makes it useful.** Men's No. 61
is a `4`; No. 151 is a `5`. It's a status flag maintained upstream, not something
derived from points. Rec accounts also have no `turnedPro` date, which is a
decent secondary signal.

⚠ **You cannot filter the board by it.** Every plausible parameter
(`pro_level_id`, `proLevelId`, `is_pro`, `badge_title`, `tour_pro`,
`player_type`, `scope_title`) was passed to `partner_rankings` and **all eight
were silently ignored** — identical `total_records` to the control, the same trap
`category=PPA` sets on the news feed. The lookup tables that would explain the
level numbering (`/data/pro_levels`, `/data/player_tags`, `/data/partners`,
`/data/governing_bodies`) are all **403 for our token** (`platformID=9`).

⚠ **And the ranking row doesn't carry it.** A `partner_rankings` row has no
`proLevelId` and no `badgeTitle` (full row: uuid, name, points, ranking, image,
age, gender, city/state/country, events played, live-scoring fields). So reading
the flag costs **one `/v1/data/users/{slug}` call per player** — fine for a
one-off audit, too expensive to gate a 2,000-row board on.

**What it's good for:** an audit check that a profile we publish is actually a
tour pro, and a sanity check when adding someone. **What it can't do today:**
generate the roster — there's no way to ask the API "give me every TOUR PRO".
Getting that is a `partner_rankings` filter param or access to `/data/pro_levels`,
both of which are asks for Pickleball.com.

Note the board is already PPA-scoped via `partner=ppa` + `bracket_level_id=2`, so
"is on our board at all" remains the practical working definition — `proLevelId`
is the sharper one where you need it.

---

## Equipment (paddles)

Source of truth is the event team's **"Pro Paddles Broadcast - Masterlist"**,
kept at `lib/data/broadcast-paddles.csv`.

```
npm run paddles:report   # resolve and print, write nothing
npm run paddles:import   # rewrite lib/data/athlete-paddles.json
```

- 97 slugs / 92 pros currently carry a paddle. **88 of our 180 profiles show
  none, and that is the correct outcome** — the Quick Info row and the whole "In
  the Bag" section drop out together.
- The importer matches names in four passes (verified alias → exact →
  misspelling → surname) and **refuses rather than guesses**. Ambiguous rows
  (`Bhatia` — Armaan or Aryaan?) are left unresolved and printed to stdout.
- **A pro missing a paddle is almost always a bad CSV row**, not a code problem.
  The fix belongs in the CSV: a fuller first name, one row per person, equipment
  columns filled in.
- Brand → "Official Partner of the PPA Tour" is matched against the live partner
  roster, so it self-corrects when a sponsorship ends. "Buy This Paddle" always
  points at Pickleball Central, our retail partner — never a competitor's store.
- The whole section can be switched off in one place: `SHOW_EQUIPMENT` at the top
  of `app/athletes/[slug]/page.tsx`.

---

## Things worth knowing before you edit a bio

- **Bios are reconciled against live stats at render** (`lib/bio-live.ts`). Where
  the prose states a career title total, the live medals figure is substituted,
  so the words can't contradict the stat rail above them. It only ever rewrites
  digits already in the sentence — it never writes a number into prose that
  didn't have one, and it no-ops entirely if stats are unavailable.
- **Privacy edits are per-athlete data edits, not code rules.** Family details
  were removed from Jack Sock's bio at his request by deleting those sentences
  from the JSON. A roster-wide rule was built once, stripped 24 sentences from 20
  other pros, and was reverted at Wesley's direction. Don't rebuild it, and don't
  "tidy" the other profiles that mention a spouse or child.

---

## What the site still can't show

Not missing by oversight — the data isn't available to us yet:

- **Career earnings, win/loss records, win streaks** — the board carries a
  `prizeMoney` field but no match record.
- **Per-event results / "where the points came from"** — the athlete feed exposes
  no per-event history, so Jeff's ranking wheel is still blocked on it.
- **Ranking movement arrows** (up/down since last week) — needs a stored
  snapshot; we only ever see today's board.
- **An athlete → news rail.** The profile page renders no news at all today
  (verified: zero news imports). The reverse exists — article pages carry a
  "Players in This Story" rail — so this is inverting an index we already have,
  not new data.
- **Paddle photos and specs.** Thickness and model number are parsed out of the
  masterlist but not displayed.

---

## Routine checks

| Command | What it tells you |
|---|---|
| `npm run athletes:audit` | Duplicate slugs/names in the profile file, and every slug checked against the live boards. Fails the run on real problems; lists genuine same-name pairs as FYI. |
| `npm run paddles:report` | Which masterlist rows resolve to a pro and which don't. Writes nothing. |

Both need `PB_API_TOKEN` (read from `.env.local`).

---

## Who to ask for what

| Need | Owner |
|---|---|
| A pro's rank, points, flag, cutout headshot | Nobody — it's the live board. If it's wrong, it's wrong at Pickleball.com. |
| A pro's paddle, or a paddle that's wrong | Event team, via the broadcast masterlist CSV |
| Studio headshots | PPA media library (the official shoot exports) |
| Bio and Quick Info for a new pro | Us — hand-added to `published-athletes.json` |
| Anything in the "can't show" list above | Needs a feed we don't have; raise with Wesley |
