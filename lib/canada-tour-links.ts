/**
 * PPA Tour Canada — event links to the Canada tour's own event pages.
 *
 * Wesley, 9/1 (Asana "Incorrect info for international events"): "We'd like the
 * Canada ones to be directed to their page on PPA Canada for now." They publish
 * a real page per tournament at ppatourcanada.ca/tournament/{year}/{event}/ —
 * the same URL shape the Asia tour uses, and the same change made for Asia (8/6)
 * and Australia (9/1).
 *
 * ⚠ THE DOMAIN IS THE `.ca`, AND THIS IS NOT A DETAIL. `ppatourcanada.com` is
 * listed FOR SALE on Spaceship, and `ppacanada.com` / `ppacanada.ca` both serve
 * an empty 114-byte response. Only `ppatourcanada.ca` is the real site
 * ("PPA Tour Canada (PPA) | The Pro Tour of Pickleball"). Do not "fix" this to
 * the .com — that would point our calendar at a domain-sale lander.
 *
 * ⚠ TWO OF THESE THREE STOPS ARE NOT IN THE FEED AT ALL, which is why this table
 * is not enough on its own. Queried live 9/1: `ppa_tournaments` carries exactly
 * two "PPA Tour Canada" rows — the completed Vancouver 250 (Aug 21–23) and the
 * Vancouver 125 (Dec 3–6). Ottawa and Toronto exist only in the curated
 * calendar, so they also need the `showWhenAbsentFromFeed` opt-in on their rows
 * in `lib/placeholder-data.ts` to render at all. A row here links a card; it
 * does not create one.
 *
 * ⚠ ONE ROW PER PAGE THEY ACTUALLY PUBLISH — NEVER A GUESSED PATH. All three
 * paths below were fetched 9/1 and returned 200 with an event-specific title
 * ("Ottawa 125 | PPA Tour Canada"); a made-up slug returns a genuine 404
 * ("Page not found | PPA Tour Canada"), so 200 + title is a sound signal. Each
 * page also states its own dates, and all three match both their public
 * schedule and Wesley's note: Ottawa Oct 22–25, Toronto Nov 26–29, Vancouver
 * Dec 3–6.
 *
 * ⚠ A "July 2–5, 2026" DATE APPEARS ON ALL THREE PAGES — it is site chrome (a
 * featured/other-stops module), not any of these events' dates. Don't read it
 * as a conflict.
 *
 * ⚠ THE COMPLETED VANCOUVER 250 IS DELIBERATELY ABSENT. Their site publishes no
 * page for it, so it keeps its pickleballtournaments listing. Adding a guessed
 * path is how a card starts pointing at a 404.
 *
 * ⚠ NO TICKETS HERE. None of the three pages carries a Tixr link, so Canada gets
 * no storefront default in `lib/sister-tour-tickets.ts` and these cards keep
 * reading "Tickets soon" — which is true, rather than a link to a shop that
 * does not list them.
 */

/** Host the Canada tour serves from. NOT the .com — see the note above. */
export const CANADA_TOUR_HOST = "ppatourcanada.ca";

type CanadaEvent = {
  /** Their page title, verbatim — this table is maintained by hand, by a human. */
  name: string;
  /** Path under ppatourcanada.ca/tournament/ — `{year}/{event}`. */
  path: string;
  /**
   * `tournament_uuid` from the ppa_tournaments feed, where the feed has this
   * stop at all. Absent for Ottawa and Toronto, which it does not carry.
   */
  uuid?: string;
  /** Last segment of the feed's `details_url`, as a secondary key. */
  ptSlug?: string;
  /**
   * Slug in the curated calendar. Load-bearing for Ottawa and Toronto — with no
   * feed row, it is the ONLY key that can ever match them.
   */
  curatedSlug?: string;
};

export const CANADA_TOUR_EVENTS: readonly CanadaEvent[] = [
  {
    name: "Ottawa 125",
    path: "2026/ottawa-125",
    // Not in the feed — curated only.
    curatedSlug: "ppa-canada-125-ottawa",
  },
  {
    name: "Toronto 125",
    path: "2026/toronto-125",
    // Not in the feed — curated only.
    curatedSlug: "ppa-canada-125-toronto",
  },
  {
    name: "Vancouver 125",
    path: "2026/vancouver-125",
    uuid: "ef8ddffc-5971-421b-bc2c-b4066a89d89a",
    ptSlug: "ppa-canada-vancouver-125",
    curatedSlug: "ppa-canada-125-vancouver",
  },
];

function canadaUrl(path: string): string {
  return `https://${CANADA_TOUR_HOST}/tournament/${path}/`;
}

const BY_UUID = new Map(
  CANADA_TOUR_EVENTS.filter((e) => e.uuid).map((e) => [e.uuid!, canadaUrl(e.path)]),
);
const BY_PT_SLUG = new Map(
  CANADA_TOUR_EVENTS.filter((e) => e.ptSlug).map((e) => [e.ptSlug!, canadaUrl(e.path)]),
);
const BY_CURATED_SLUG = new Map(
  CANADA_TOUR_EVENTS.filter((e) => e.curatedSlug).map((e) => [e.curatedSlug!, canadaUrl(e.path)]),
);

/** Last path segment of a pickleballtournaments.com listing URL. */
function pickleballTournamentsSlug(detailsUrl: string | undefined): string | null {
  if (!detailsUrl) return null;
  const m = /pickleballtournaments\.com\/tournaments\/([^/?#]+)/i.exec(detailsUrl);
  return m ? m[1].toLowerCase() : null;
}

/**
 * The Canada tour's own page for a feed event — by UUID first, then by the
 * pickleballtournaments permalink. Undefined for anything not in the table, so
 * the caller keeps the feed's URL.
 */
export function canadaTourUrlForEvent(
  uuid: string | undefined,
  detailsUrl: string | undefined,
): string | undefined {
  if (uuid && BY_UUID.has(uuid)) return BY_UUID.get(uuid);
  const slug = pickleballTournamentsSlug(detailsUrl);
  return slug ? BY_PT_SLUG.get(slug) : undefined;
}

/**
 * The Canada tour's own page for a CURATED calendar slug. Unlike the Asia and
 * Australia equivalents this is NOT only a fallback: Ottawa and Toronto are
 * curated-only stops, so this is their live path too.
 */
export function canadaTourUrlForCuratedSlug(slug: string): string | undefined {
  return BY_CURATED_SLUG.get(slug);
}
