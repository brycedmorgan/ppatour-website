/**
 * PPA Tour Australia — event links to the Australia tour's own event pages.
 *
 * Wesley, 9/1 (Asana "Incorrect info for international events"): the Australia
 * stops on our calendar were linking out to their pickleballtournaments.com
 * listing. PPA Tour Australia publishes a real page per tournament at
 * ppatour.com.au/tournaments/{slug}/, so the cards now point there instead —
 * the same change Wade asked for on the Asia side on 8/6.
 *
 * ⚠ THIS CHANGES THE LINK, NOT THE PAGE. Australia stops have no internal
 * /events/{year}/{slug} page (`hasInternalPage` stays false) — the card, the
 * Next Six band and site search all link OUT, and this is where they now go.
 *
 * ⚠ THE PRIMARY KEY IS THE TOURNAMENT UUID, NOT THE PERMALINK — and that is the
 * one deliberate difference from `asia-tour-links.ts`. The feed carries
 * `tournament_uuid` on 221 of 221 rows, all distinct, and it is the brackets
 * engine's own identity for the tournament: it survives BOTH a title rename and
 * a pickleballtournaments permalink change. The Asia table keys on the
 * permalink, which survives only the first of those. `ptSlug` is kept as a
 * secondary key so a row still matches if a UUID is ever reissued.
 *
 * ⚠ IT FAILS SAFE. Every lookup returns undefined for anything not listed, and
 * the caller keeps the feed's pickleballtournaments URL — so a new stop, or an
 * upstream key change, degrades to today's behaviour rather than to a dead
 * link. It degrades SILENTLY, which is the actual risk, so
 * `npm run australia:audit` prints both sides of the drift.
 *
 * ⚠ ONE ROW PER PAGE THEY ACTUALLY PUBLISH — NEVER A GUESSED PATH. Their site
 * exposes exactly 10 tournament pages (WordPress `tournaments` post type, read
 * from /wp-json/wp/v2/tournaments). All 10 were fetched and verified 200 with
 * an event-specific `<title>`; a missing slug returns a real 404 titled
 * "Page not found", so 200 + title is a sound signal. The join to the feed is
 * two-factor — their page title states the tier AND the city
 * ("PPA 1500 | Brisbane, Australia"), and both are on the feed row — so no row
 * below rests on a slug that merely looks right.
 *
 * ⚠ 10 PAGES COVER 10 OF THE 36 AUSTRALIA ROWS THAT RENDER on /events (34
 * completed + 2 upcoming). The other 26 keep their platform listing, which is
 * correct: their site does not publish a page for them. Notably `PPA125 Sydney`
 * (2026-03-12) has none — `/tournaments/ppa-125-sydney-nsw/` is a verified 404.
 * More pages will appear as they publish them; the audit lists what is missing.
 */

/** Host the Australia tour serves from. */
export const AUSTRALIA_TOUR_HOST = "ppatour.com.au";

type AustraliaEvent = {
  /** Their page title, verbatim — this table is maintained by hand, by a human. */
  name: string;
  /** Slug under ppatour.com.au/tournaments/. */
  path: string;
  /** `tournament_uuid` from the ppa_tournaments feed — the primary key. */
  uuid: string;
  /** Last segment of the feed's `details_url`, as a secondary key. */
  ptSlug?: string;
  /** Slug in the curated calendar, for the API-unreachable fallback. */
  curatedSlug?: string;
};

/**
 * Verified against the live `ppa_tournaments` feed on 9/1 — every row below is
 * in it under the "PPA Tour Australia" org, and every `path` was fetched and
 * confirmed to render that event's own page.
 */
export const AUSTRALIA_TOUR_EVENTS: readonly AustraliaEvent[] = [
  /* ---- 2026 completed ---- */
  {
    name: "PPA 125 | Moreton Bay, QLD",
    path: "ppa-125-moreton-bay-qld",
    uuid: "0d1647e3-7939-4284-8796-9a2586289b43",
    ptSlug: "ppa-tour-australia-ppa125-moreton-bay",
  },
  {
    name: "PPA 250 | Tweeds Heads, NSW",
    path: "ppa-250-tweeds-heads-nsw",
    uuid: "9bd79fe9-f48a-4223-989d-e14626a03a36",
    ptSlug: "ppa-tour-australia-ppa250-tweed-heads",
  },
  {
    name: "PPA 125 | Wellington, NZ",
    path: "ppa-125-wellington-nz",
    uuid: "95a9e3aa-3ca8-49e8-94de-48140719a0ef",
    ptSlug: "ppa-tour-australia-ppa125-new-zealand",
  },
  {
    name: "PPA Junior | Victorian Open, VIC",
    path: "ppa-junior-victorian-open-vic",
    uuid: "5cda9435-5576-4691-b260-4ebf58897d4b",
    ptSlug: "junior-ppa-tour-australia-victorian-open",
  },
  {
    // ⚠ Their page is titled Melbourne; the curated row is
    // "PPA Australia 250 Melbourne" (7/15–19) and the feed row starts 7/16.
    name: "PPA 250 | Melbourne, VIC",
    path: "ppa-250-melbourne-vic",
    uuid: "824d2643-9153-4dbc-a0f5-f202f8d326be",
    ptSlug: "ppa-tour-australia-ppa250-melbourne",
    curatedSlug: "ppa-australia-250-melbourne",
  },
  {
    name: "PPA Junior | Queensland Open, QLD",
    path: "ppa-junior-queensland-open-qld",
    uuid: "8888e773-3f2e-4481-9fbe-f6b6f6082105",
    ptSlug: "junior-ppa-tour-australia-queensland-open",
  },
  {
    name: "PPA Junior | New South Wales Open, NSW",
    path: "ppa-junior-new-south-wales-open-nsw",
    uuid: "9e6b1362-a7dd-463b-8102-c81459d8c250",
    ptSlug: "junior-ppa-tour-australia-nsw-open",
  },
  {
    name: "PPA 125 | Gold Coast, QLD",
    path: "ppa-125-gold-coast-qld",
    uuid: "8e81ca62-11c2-41d4-85b8-fda8491c5c20",
    ptSlug: "ppa125-gold-coast",
    curatedSlug: "ppa-australia-gold-coast",
  },

  /* ---- 2026 upcoming ---- */
  {
    // The Australia Pickleball Cup — the stop Wesley's note was about.
    name: "PPA 1500 | Brisbane, Australia",
    path: "ppa-1500-australia",
    uuid: "7d0583f0-2e25-4042-b369-07f8e21e8508",
    ptSlug: "ppa1500-australia-pickleball-cup",
    curatedSlug: "ppa-1500-australia-pickleball-open",
  },
  {
    name: "PPA 125 | Adelaide, SA",
    path: "ppa-125-adelaide-sa",
    uuid: "52db97aa-e2cd-4fc9-80ac-22ec0058cccb",
    ptSlug: "ppa125-adelaide",
  },
];

function australiaUrl(path: string): string {
  return `https://${AUSTRALIA_TOUR_HOST}/tournaments/${path}/`;
}

const BY_UUID = new Map(AUSTRALIA_TOUR_EVENTS.map((e) => [e.uuid, australiaUrl(e.path)]));
const BY_PT_SLUG = new Map(
  AUSTRALIA_TOUR_EVENTS.filter((e) => e.ptSlug).map((e) => [e.ptSlug!, australiaUrl(e.path)]),
);
const BY_CURATED_SLUG = new Map(
  AUSTRALIA_TOUR_EVENTS.filter((e) => e.curatedSlug).map((e) => [
    e.curatedSlug!,
    australiaUrl(e.path),
  ]),
);

/** Last path segment of a pickleballtournaments.com listing URL. */
function pickleballTournamentsSlug(detailsUrl: string | undefined): string | null {
  if (!detailsUrl) return null;
  const m = /pickleballtournaments\.com\/tournaments\/([^/?#]+)/i.exec(detailsUrl);
  return m ? m[1].toLowerCase() : null;
}

/**
 * The Australia tour's own page for a feed event — by UUID first, then by the
 * pickleballtournaments permalink. Undefined for anything not in the table, so
 * the caller keeps the feed's URL.
 */
export function australiaTourUrlForEvent(
  uuid: string | undefined,
  detailsUrl: string | undefined,
): string | undefined {
  if (uuid && BY_UUID.has(uuid)) return BY_UUID.get(uuid);
  const slug = pickleballTournamentsSlug(detailsUrl);
  return slug ? BY_PT_SLUG.get(slug) : undefined;
}

/**
 * The Australia tour's own page for a CURATED calendar slug — the fallback
 * path, used when the events API is unreachable. Undefined for every other
 * event.
 */
export function australiaTourUrlForCuratedSlug(slug: string): string | undefined {
  return BY_CURATED_SLUG.get(slug);
}
