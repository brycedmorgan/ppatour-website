# PickleWave — where its data actually comes from

Reverse-engineered 2026-07-25 by loading picklewave.com, ppatour.com,
pickleballtournaments.com, and pickleball.com in a browser and capturing every
network call + grepping the JS bundles.

## TL;DR

PickleWave has **no special access and no API of its own to steal**. It is a
Ruby on Rails app (Hotwire/Turbo, Postgres) that ingests data **server-side**
into its own database, then serves fully rendered pages. Every upstream source
it uses is Pickleball Inc's own public data — the same feeds ppatour.com
already sits on top of. Bryce can get all of it first-party from Jason, cleaner
than PickleWave scrapes it.

## The upstream sources (what to ask Jason for)

**1. PickleballBrackets engine — the system of record for every match.**
All PPA/APP/amateur brackets, draws, teams, scores, and courts live here.
`pickleball.com`'s own results API confirms it: every tournament record says
`"Platform": "PickleballBrackets"` with a
`DetailsURL: pickleballbrackets.com/ptd.aspx?eid=<GUID>`. Event, activity, and
bracket IDs are GUIDs. This is the database PickleWave's match IDs, brackets,
and results ultimately mirror. Internal API access to this = everything.

**2. pickleball.com public JSON API (`pickleball.com/api/v1|v2/...`).**
Unauthenticated, open today. Captured live:
- `GET /api/v1/results/getTournamentsOnDate?date=2026-07-25` — every
  tournament running on a date, worldwide, with full metadata (IDs, venue,
  geo, registration counts, logos, slugs).
- `GET /api/v2/results/getTeamLeaguesResultsOnDate?date=...` — team leagues.
- `GET /api/v1/rankings/getLookupCountries` — rankings lookups (the rankings
  family lives under `/api/v1/rankings/*`).

**3. pickleballtournaments.com JSON API (`/tournaments/api/...`).**
Also unauthenticated. Captured live:
- `GET /tournaments/api/tourneyEvents?slug=<tournament-slug>` — every event
  in a tournament with eventId/activityId GUIDs, draw status, medal teams,
  bracket type, dates.
The on-court / live-scores views (`/tournaments/<slug>/on-court`) are Next.js
server-rendered from the same backend — internally it's the brackets engine
again (`NEXT_PUBLIC_PBRACKETS_URL`, `brackets.pickleballtournaments.com` are
in the JS env).

**4. ppatour.com's own WordPress AJAX API.**
`GET ppatour.com/wp-admin/admin-ajax.php?action=get_rankings&division_type=5&gender=M&race=true&bracket_level_id=2&page=1&page_size=50`
— the PPA rankings + Race data, public. (Note for the rebuild: this is the
endpoint the current WP site exposes; the rebuild should hit the source
rankings service instead.)

**5. DUPR — player ratings.**
PickleWave shows DUPR singles/doubles ratings, age, location on every player
profile. That's DUPR data (partner API or scraped profiles), not Pickleball
Inc data. For the PPA site: DUPR has a partner API; PPA already has the
relationship.

**6. YouTube — the "replay for every match" trick.**
PPA streams every court to the **@ppastreamedcourts** YouTube channel
(pickleballtournaments.com links to it directly). PickleWave maps matches to
those court-stream VODs (+ APP's equivalent channels). That's just the
YouTube Data API against channels PPA owns. This is the piece Connor said
"would have replaced Match Day" — PPA owns the source footage.

**7. Computed in-house (not sourced anywhere):** PickleWave's ELO ratings
(default 1500), "Pickles" counts, win streaks, H2H, pick'em. All derived from
the match data above. Nothing to license — trivially reproducible once the
match feed is in a database.

## How the site itself is built (relevant if buying/rebuilding it)

Rails + Turbo/Stimulus, server-rendered (that's part of why its SEO is so
good — every page is static HTML to Google). Own auth (Devise), Paddle for
payments, AdSense + Amazon affiliate for revenue, Cloudflare in front. An
`/admin/player_deduplications` tool leaked in the JS — he's merging duplicate
player records across PPA/APP/MLP feeds, which is the actual hard work in the
product.

## What this means

- For the **PPA site/app rebuild**: ask Jason for direct access to the
  brackets engine (PickleballBrackets/PT.com backend) + the pickleball.com
  API gateway. That's live scores, draws, results, players, rankings — the
  same information, first-party, real-time, no scraping.
- The gap PickleWave wins on is **presentation + SEO structure** (a page per
  match/player/tournament, all server-rendered), not data access. PPA owns
  the data AND the domain authority; the moat he has is executed structure,
  not sources.
- His replay catalog is built on PPA's own YouTube channels — worth
  remembering in any content-rights conversation with him.
