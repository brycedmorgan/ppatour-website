/**
 * On-site facts for the "Today at the event" screen — the ones nothing else in
 * this repo can answer.
 *
 * ⚠ WHAT IS NOT HERE, AND WHY. Parking, ADA parking, the shuttle and rideshare
 * already live in `lib/event-guides.ts` as the event team's own verbatim copy,
 * read through `parkingFor()`. Order of play lives in `lib/event-schedule.ts`.
 * Court assignments come live from the scores feed. Duplicating any of those
 * here would create a second answer to the same question, and on-site copy is
 * exactly where two answers means somebody walks to the wrong place.
 *
 * So this file holds five fields, and a stop appears only once a named person
 * has supplied them.
 *
 * ⚠ EVERY FIELD IS OPTIONAL AND A MISSING ONE RENDERS NOTHING. Never write a
 * plausible default. On 8/5 hand-written parking copy was deleted from all 18
 * event pages because it quoted prices nobody had sourced — "$20/day, or free
 * with a Reserved+ ticket" — and that is the same failure available here in
 * every field. A gate that does not exist sends a family to a locked fence.
 *
 * OWNER: Nationals (Cary) is Haley Brezec's — Bryce, 8/19. Anything she has not
 * supplied stays absent.
 */
export type OnSiteInfo = {
  /**
   * The venue site map the ops team already produces. A path under /public or
   * a Blob URL — an image, not a PDF, so it renders inline on a phone at the
   * gate rather than downloading.
   */
  venueMapUrl?: string;
  /**
   * The map's intrinsic pixel size. REQUIRED alongside `venueMapUrl`:
   * next/image needs a ratio to reserve space, and hardcoding one in the page
   * would squash the next stop's map if it arrives in the other orientation —
   * which is exactly what happened here when a landscape v9 was replaced by a
   * portrait kiosk v1 on the same day.
   */
  venueMapWidth?: number;
  venueMapHeight?: number;
  /** Which gate to use, in the event team's words. */
  entry?: string;
  /** Bag policy — size limits, what is prohibited. */
  bagPolicy?: string;
  /** Where will call is, and its hours if they differ from gates. */
  willCall?: string;
  /** Food and drink on site, one or two lines. */
  food?: string;
  /** The one thing to know before you go that nothing above covers. */
  note?: string;
};

/**
 * Keyed by tournament slug. Empty until a stop's owner supplies the fields.
 *
 * ⚠ An entry with every field blank is the same as no entry: the screen renders
 * what it has and says nothing about what it does not.
 */
const ON_SITE_BY_SLUG: Record<string, OnSiteInfo> = {
  // Nationals — Aug 31–Sep 6, Cary Tennis Park. Owner: Haley Brezec.
  // Parking, ADA, shuttle and rideshare are already answered by the event
  // team's submitted copy in lib/event-guides.ts; these five are the gap.
  "veolia-pickleball-national-championships": {
    /**
     * The ops team's kiosk map, v1 — it REPLACED the landscape v9 the same day
     * (Bryan Renahan, 8/27). Encoded from a 2592×3456 PNG to 2000px webp
     * (279KB): webp because this is flat, vector-style art where it beat both
     * JPEG and palette PNG outright, and 2000px because the job of the image is
     * small text (court numbers, "6800 Good Hope Church Rd") that people
     * pinch-zoom into.
     *
     * ⚠ IT IS PORTRAIT (3:4) WHERE v9 WAS LANDSCAPE (4:3). The venue slot must
     * therefore NOT force an aspect ratio — a portrait map in a 4:3 box renders
     * small between two fat gutters. It sizes to the dimensions below instead,
     * so the next stop can supply either orientation.
     *
     * ⚠ And it renders `object-contain` with no Ken Burns pan and no scrim,
     * unlike the aerial photo it stands in place of: each of those crops,
     * drifts, or covers part of the artwork.
     *
     * What the kiosk cut drops against v9 — the Veolia branding rail, the
     * sponsor logos, the stage-music list and the dates — this site now renders
     * natively and better, so this is the stronger web asset, not a lesser one.
     */
    venueMapUrl: "/ppa/venue-maps/cary-tennis-park.webp",
    venueMapWidth: 2000,
    venueMapHeight: 2667,
  },
};

export function onSiteFor(slug: string): OnSiteInfo {
  return ON_SITE_BY_SLUG[slug] ?? {};
}

/** Does this stop have anything on-site to show beyond parking and schedule? */
export function hasOnSiteInfo(slug: string): boolean {
  return Object.values(onSiteFor(slug)).some((v) => typeof v === "string" && v.trim() !== "");
}
