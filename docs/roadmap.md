# ppatour.com — roadmap

What we are trying to do here, what is next, and what we want but cannot build
yet. Detailed API asks live in [`DATA-ASKS.md`](DATA-ASKS.md); the dated history
lives in the Session Log in the repo root `CLAUDE.md`.

The site is the **content / discovery / streaming** layer. Commerce redirects out
to partners (Tixr for tickets, pickleballtournaments.com for amateur
registration). Pickleball Vacations is the one deliberate exception, and even
there Stripe hosts the checkout.

---

## Now — in flight

| Item | State | Blocker |
|---|---|---|
| Athlete hero images | Slot shipped 8/15; **1 of 179 filled** (Anna Leigh Waters) | Named per-player photography — see Wishlist |
| Punta Cana bookings | LIVE at $4,800 double, 1 room left | none; Lainey controls rooms in Jackalope |
| MLP per-player timeline | Endpoint approved, awaiting their push | `team_leagues_rosters` going live (DATA-ASKS §6) |
| "Playing next" on profiles | Not started | Player→events endpoint (DATA-ASKS §5) |

## The fan app

ppatour.com is installable as of 8/18 — manifest, app shell, always-on score
bar. The full plan, the decisions behind it and what is still blocked live in
[`app-plan.md`](app-plan.md). Next up there: a service worker for offline, an
install prompt, a follow list, then the on-site event mode (blocked on an
owner per event, not on code).

## Next — buildable today, no external dependency

1. **Add `team_leagues_rosters` to Jackalope's probe** (`lib/pbapi.js`
   `TEAM_LEAGUE_ENDPOINTS`). One line. Without it we cannot detect the endpoint
   going live, so Slack is our only signal.
2. **Discipline-level "where their points come from"** on athlete profiles. The
   WPR weighting is verified exact for all 2,033 ranked pros (DATA-ASKS §4), so
   this needs no new access.
3. **Per-event placements per player** by walking the bracket feed — buildable
   now as a cron-warmed job (DATA-ASKS §4a).
4. **Mirror the Trip Builder into `NationalsLive.tsx`.** The `-live` route
   renders its own trip section and drifts from the main event page.
5. **Fill `HEROES_BY_SLUG`** for marquee pros as named photos arrive.

## Later — wants a decision, not code

- **Site chrome during a live event.** The homepage flips itself live, but
  `TopBar` and `StickyBuyBar` are still pathname-gated to `/live`. Making
  `StickyBuyBar` live-aware turns the tour's #1 ticket CTA into "Watch Live" on
  every page for the duration of an event. Commercial call, not a cleanup.
- **News home** — ppatour.com vs pickleball.com. Open since 7/28.
- **MLP's absence from the site.** Still unaddressed.

---

## Wishlist — we want this, we cannot build it yet

Each of these is blocked on data or a person, never on engineering time. Do not
approximate them; every one has a plausible-looking fake that would publish
something untrue.

### 1. "Playing next" on every athlete profile
**Want:** Anna Leigh Waters' page says which stop she plays next.
**Blocked on:** the player→events endpoint (DATA-ASKS §5).
**⚠ The tempting fake:** inverting `lib/event-field.ts`. It only knows the field
once a draw publishes — event week — so before that any list is a guess. The
page already distinguishes "In the Draw" from "Ones to Watch" for this reason.

### 2. A hero photo on all 179 profiles
**Want:** every pro gets the treatment ALW has.
**Blocked on:** per-player photography. The tour's library is filed by **venue**,
not by player — the `type:'athletes'` rows are all captioned "Player walk-in"
under a venue id — so nothing names who is in a frame.
**⚠ The tempting fake:** identifying faces ourselves. Most tour photography is
doubles and both women in a PPA women's final are frequently blonde. Attribute
from provenance or not at all (`lib/athlete-heroes.ts`).

### 3. Registered-player counts on event pages
**Blocked on:** the same endpoint as §1. Currently renders an honest
"Registration Count Coming" chip.

### 4. Real amateur division days in the Trip Builder
**Want:** "your bracket plays Saturday" instead of "the day posts with the order
of play".
**Blocked on:** division/day data, unpublished until after the registration
deadline.

### 5. True per-day watch odds
**Want:** "likely to play into Sunday" backed by history rather than rank.
**Blocked on:** each pro's historical round-by-round results (Dillon Segur's
source). Today's projection is labelled as a projection everywhere it appears.

### 6. Career earnings, W/L, win streaks, ranking movement arrows
**Blocked on:** feeds we do not have. Asked 7/28, still open.

### 7. Event Coverage back on event pages
**Want:** the "Coverage" section repopulated.
**Blocked on:** mapping the 322 migrated WP posts carrying an event category onto
this site's event slugs. Data work, not access.
