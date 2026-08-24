# Analytics — measurement estate, and the property that is lying to us

Written 2026-08-24 after Bryce asked "something seems off on our PPA Tour
analytics." Something is. This doc is the finding, the roadmap out, and the
decisions that need a person rather than a commit.

Tag wiring lives in [`LAUNCH.md`](LAUNCH.md). This doc is about **what the
numbers mean**, not what fires.

---

## The finding

**GA4 property `PPA - GA4` (`358407319`) is five websites in one bucket, and
ppatour.com is the small one.**

Account *Vibe Pickleball* → *Professional Pickleball ...* → property `358407319`.
Admin → Data streams:

| Stream | Stream ID | Measurement ID | Default URL | State 2026-08-24 |
|---|---|---|---|---|
| PPA - GA4 | 4707280233 | — | propickleballassociation.com | no data 48h — **dead** |
| PPA Tour | 5816480422 | — | www.ppatour.com | no data 48h — **dead duplicate** |
| PPA Tour \| New | 6289331495 | `G-NKVE1BRLK7` | www.ppatour.com | live — **this is us** |
| tixr.com/groups/ppa | 9693545954 | — | www.tixr.com | live |
| **All Pickleball Variations** | **9706788521** | **`G-QCCT4TV3JR`** | **pickleballbrackets.com** | live — **the flood** |

`All Pickleball Variations` is one stream carrying five hostnames:
`pickleballbrackets.com`, `pickleballtournaments.com`, `pickleball.com`,
`sso.pickleball.com`, `pickleballleagues.com`.

### What it costs us

Last 28 days (Jul 27 – Aug 23, 2026), *Pages and screens*:

| Scope | Views | Active users |
|---|---:|---:|
| Property total (unfiltered) | 16,041,613 | 1,008,333 |
| `Hostname contains ppatour.com` | 319,977 | 88,064 |
| **ppatour.com's share** | **2.0%** | **8.7%** |

The default top-five pages in a report titled *PPA* are:

1. Find nearby Pickleball Tournaments — 2,597,462 views (16.2%) — pickleballtournaments.com
2. Pickleball Brackets Software… — 754,689 — pickleballbrackets.com
3. `(not set)` — 641,020 — sso.pickleball.com
4. Pickleball.com - All Things Pickleball — 426,567 — pickleball.com
5. Explore Pickleball Leagues — 176,231 — pickleballleagues.com

Not one ppatour.com page appears until the filter goes on.

**So: every unfiltered metric this property reports — users, sessions, top
pages, bounce rate, average engagement time, device mix, geography — is
substantially Pickleball Brackets, not the PPA Tour.** Anything read off it and
carried into a deck, a sponsor conversation or a board slide has been wrong.

### It poisons Jackalope too

`api/marketing/ga4.js` in the Jackalope repo queries property `358407319`. It is
currently inert because `GA4_SA_KEY` is unset — see the Session Log entries on
the marketing funnel. **Do not set that credential before the hostname filter is
in the query.** Lighting it up as-is renders a per-event funnel that is 98%
someone else's traffic, and it will look plausible.

### Two smaller things, both real

1. **Duplicate ppatour.com stream.** `PPA Tour` (5816480422) and `PPA Tour | New`
   (6289331495) both claim `www.ppatour.com`. Only the New one fires today, so
   nothing double-counts right now. It is a landmine, not a live bug.
2. **www / apex split in the data.** Rows land under both `www.ppatour.com` and
   `ppatour.com`, with different page-title formats. Verified 2026-08-24: the
   apex 301s to `www` and the live title is *"Carvana PPA Tour — The Pro Tour of
   Pickleball"*, so the bare-domain rows are pre-redirect history rather than an
   open leak. Confirm the date each host stops before treating any page-level
   total as complete.

### Verified, so nobody re-checks it

- Live `www.ppatour.com` HTML fires `G-NKVE1BRLK7` **and nothing else**. The
  secondary property `G-VFNFRP66Z5` is still dark (`NEXT_PUBLIC_GA_MEASUREMENT_ID_SECONDARY`
  unset), as `LAUNCH.md` says it should be.
- `G-QCCT4TV3JR` shows **0 connected site tags** and *Data flowing*. Pickleball
  Brackets deploy it directly on their own sites.

---

## ⚠ Standing rule until this is fixed

**Never quote a number from property `358407319` without
`Hostname contains ppatour.com` applied.** Not to Connor, not to a sponsor, not
into a deck, not into Jackalope. The unfiltered number is not a PPA number.

---

## Roadmap

### Now — do these before anything else

1. **Put a saved comparison on the property** — `Hostname contains ppatour.com`,
   named something unmissable like *"ppatour.com ONLY"*. Non-destructive,
   reversible, ~5 minutes, and it stops the bleeding for every human who opens
   the property tomorrow. This is the patch, not the fix.
2. **Add the hostname filter to `api/marketing/ga4.js`** in Jackalope, before
   `GA4_SA_KEY` is ever set. One `dimensionFilter` on `hostName`.
3. **Audit what has already gone out.** Any deck, sponsor one-pager or board
   slide sourced from this property since the streams were combined is
   overstated. Find them before someone else does. Start with the sponsorship
   decks and the audience/reach numbers.

### Next — needs Bryce, then a build

4. **Decide the property split** (see below). Everything structural waits on it.
5. **Delete the two dead streams** (`4707280233`, `5816480422`) once the split is
   decided — not before, so we do not lose a diagnostic mid-decision.
6. **Re-baseline ppatour.com** once the property is clean. The SEO baseline in
   `docs/seo-baseline/` was taken against GSC, not GA4, so it is unaffected —
   but any GA4-sourced "day zero" comparison needs redoing.
7. **Mark `ticket_click` + `register_click` as key events.** Still open from
   `LAUNCH.md`. Worth more once the property is not 98% noise.

### Later — decision, not code

- **Who owns the measurement estate.** Nobody does today. That is how five
  unrelated domains ended up in one property and stayed there. See below.

---

## The decision that needs the sit-down

**How do we separate ppatour.com from Pickleball Brackets, without breaking
their reporting?**

`G-QCCT4TV3JR` is live on Pickleball Brackets' production sites. **We cannot
just delete that stream** — it kills their measurement, and it is not our
measurement to kill. Three ways this resolves:

| Option | What happens | Cost |
|---|---|---|
| **A — Filter in place** | Saved comparison + a property-level data filter. Streams stay as they are. | Cheapest, fastest, reversible. But the property stays wrong for anyone who ignores the filter, and every API consumer must remember it. Treats the symptom forever. |
| **B — New clean property for ppatour.com** | Stand up a PPA-only property, point `G-NKVE1BRLK7` there or add a second tag. | Clean going forward, but **history does not move.** We would be starting ppatour.com's GA4 history over ~3 weeks after launch. |
| **C — Move the brackets streams out** | Pickleball Brackets gets its own property; `358407319` becomes genuinely PPA. | The right end state. Needs their owner's agreement, and their historical data stays behind in our property. |

**A is the patch. C is the answer. B is the compromise if C stalls.**
Recommend doing **A this week regardless**, because it costs nothing and is
reversible, then holding the conversation for C.

### Open questions for the sit-down

- **Who owns `G-QCCT4TV3JR`?** Somebody at Pickleball Brackets deployed it. That
  person has to be in the room for option C.
- **Why is it here at all?** Was combining these deliberate — a "whole pickleball
  ecosystem" view for someone — or an accident nobody caught? The answer changes
  whether C is a cleanup or a removal of something a stakeholder relies on.
- **Who reads this property today, and for what?** Everyone downstream inherits
  the error. Find them before changing the shape underneath them.
- **What has already been published off these numbers?** This is the one with a
  clock on it.
- **Who owns measurement going forward?** Post-fix, one named person, or it
  drifts back.

---

## Session facts worth keeping

- Property: `358407319`, account *Vibe Pickleball*.
- Our stream: `PPA Tour | New` / `6289331495` / `G-NKVE1BRLK7`.
- The flood: `All Pickleball Variations` / `9706788521` / `G-QCCT4TV3JR`.
- Nothing was changed in GA4 on 2026-08-24 — the finding is read-only. Filters,
  streams and settings are untouched.
