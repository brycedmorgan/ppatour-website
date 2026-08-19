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
  "veolia-pickleball-national-championships": {},
};

export function onSiteFor(slug: string): OnSiteInfo {
  return ON_SITE_BY_SLUG[slug] ?? {};
}

/** Does this stop have anything on-site to show beyond parking and schedule? */
export function hasOnSiteInfo(slug: string): boolean {
  return Object.values(onSiteFor(slug)).some((v) => typeof v === "string" && v.trim() !== "");
}
