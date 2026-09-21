/**
 * The PPA Challenger Showdown — the end of the Challenger Series season,
 * played inside the Opendoor Pickleball World Championships.
 *
 * Source: Brooke Ansley's website request, 9/21/26 ("Update Challenger
 * Showdown Information"). It closes the `Showdown 2026: dates, format, who
 * qualifies` ask in docs/CHALLENGER.md §7, which had been open since the
 * ppachallenger.com fold-in on 9/18 — the old WordPress page still described
 * the 2025 edition, so /tour/challenger shipped with two sentences and no
 * dates rather than republishing them.
 *
 * ⚠ ONE SOURCE, TWO PAGES. /tour/challenger renders the full section and the
 * Worlds event page renders these days inside its own order of play. Both read
 * this file. Do NOT retype any of it into either page — a qualifying count or
 * a day that disagrees with itself across two surfaces is this repo's most
 * familiar bug, and it is worse here than usual because these are the rules a
 * player plans a season around.
 *
 * ⚠ THE DATES ARE DERIVED, NOT SUPPLIED, AND THAT IS WRITTEN DOWN ON PURPOSE.
 * The request carried a "When" heading with nothing under it. What it does
 * give is the weekday of each block — singles pool play Thursday, doubles pool
 * play Friday, semifinals and finals Saturday — and the host event's own dates
 * are ours: Nov 2–8, 2026 (`pickleball-world-championships` in
 * lib/placeholder-data.ts), which contains exactly one Thursday, Friday and
 * Saturday. So Nov 5, 6 and 7 are the only reading of her own copy, not a
 * plausible week picked to fill a gap.
 *
 * ⚠ AND THAT MAKES THEM FRAGILE IN ONE SPECIFIC WAY: if Worlds ever moves,
 * these ISO dates keep pointing at the old week and silently stop matching the
 * event page's day rows — the same trap as FIRST_SERVE_BY_SLUG, which derives
 * its keys from an event's start date. Re-check this file whenever the Worlds
 * dates change, and replace it outright the moment the event team sends real
 * Showdown dates.
 *
 * ⚠ THE HOST EVENT IS NAMED FROM THE FEED, NOT FROM THE REQUEST. She writes
 * "UPA OpenDoor World Championships"; the feed — the source of truth for event
 * names since 8/3 — says "Opendoor Pickleball World Championships", which is
 * what every other surface on this site prints.
 *
 * ⚠ ONE RULE FROM THE REQUEST IS DELIBERATELY NOT PUBLISHED. It closes with
 * "For the 2027 Challenger Showdown, players will be permitted to compete in
 * multiple disciplines if they are within the qualifying rankings for each
 * discipline." The body of the same request describes "the 2026 Challenger
 * Showdown" awarding contracts for 2027, so it is genuinely ambiguous whether
 * that rule applies to this November or the one after. A player reads an
 * eligibility rule and enters a second draw on it; publishing it under the
 * wrong year is the kind of error that costs somebody an entry. It ships the
 * moment Brooke says which edition it belongs to — see PENDING below.
 */

/** A day of the Showdown, inside the host event's week. */
export type ShowdownDay = {
  /** ISO date — the key the host event's order of play matches on. */
  iso: string;
  /** "Thu" — the weekday her copy actually names. */
  dow: string;
  /** What is played that day. */
  label: string;
};

/** Which qualifies, and how many. Straight from the request. */
export type ShowdownQualifier = {
  division: string;
  detail: string;
};

export const challengerShowdown = {
  name: "PPA Challenger Showdown",
  season: "2026",
  /** The event it is played inside — `slug` in lib/placeholder-data.ts. */
  hostSlug: "pickleball-world-championships",
  hostName: "Opendoor Pickleball World Championships",
  venue: "Brookhaven Country Club",
  city: "Farmers Branch, TX",

  /**
   * ⚠ Derived from the weekdays in the request plus the host event's Nov 2–8
   * window. See the ⚠ block at the top of this file before changing them.
   */
  days: [
    { iso: "2026-11-05", dow: "Thu", label: "Men's & Women's Singles pool play" },
    { iso: "2026-11-06", dow: "Fri", label: "Men's, Women's & Mixed Doubles pool play" },
    { iso: "2026-11-07", dow: "Sat", label: "Semifinals & finals, all events" },
  ] satisfies ShowdownDay[],

  qualifying: [
    {
      division: "Singles",
      detail: "The top 8 men and the top 8 women on the Challenger rankings.",
    },
    {
      division: "Gender doubles",
      detail: "The top 16 men and the top 16 women — 8 teams in each.",
    },
    {
      division: "Mixed doubles",
      detail: "The top 8 men and the top 8 women — 8 teams.",
    },
  ] satisfies ShowdownQualifier[],

  /**
   * The partner-selection deadline. A player-facing date with a clock on it,
   * so it is printed rather than summarised.
   */
  partnerDeadline: "October 26",

  /**
   * ⚠ EIGHT CONTRACTS ACROSS FIVE DISCIPLINES — the number is players, not
   * winners per event, and the request states it that way.
   */
  contracts: 8,
  contractSeason: "2027",
} as const;

/**
 * Still open with Brooke Ansley, and both are reasons a line is missing rather
 * than wrong. Delete an entry when it lands; delete the block when both do.
 *
 * 1. The Showdown's own dates. The days above are read off her weekdays and the
 *    Worlds window — right unless something moves, and unconfirmed either way.
 * 2. Which edition the multiple-discipline rule applies to (see the ⚠ above).
 */
export const SHOWDOWN_PENDING = true;

/**
 * The Showdown's days inside this event, or none.
 *
 * ⚠ THE SLUG IS NOT ENOUGH, AND THAT IS NOT THEORETICAL. Annual editions share
 * a slug on this site — the live feed carries `pickleball-world-championships`
 * twice, the completed 2025 edition (Nov 3–9, 2025) and this one — and
 * `/events/[year]/[slug]` renders a page for each. A slug-only test would
 * therefore advertise a 2027 PPA Tour contract on last year's event page. So
 * the caller passes the event's own window and the days must fall inside it.
 *
 * ⚠ THAT ALSO MAKES THE DERIVED DATES SELF-CHECKING: if Worlds ever moves, the
 * days stop falling inside its window and this returns nothing, so the page
 * goes quiet rather than publishing a week that is no longer right.
 */
export function showdownDaysFor(
  slug: string,
  startIso: string,
  endIso: string,
): readonly ShowdownDay[] {
  if (slug !== challengerShowdown.hostSlug) return [];
  const days = challengerShowdown.days.filter((d) => d.iso >= startIso && d.iso <= endIso);
  // All of them or none — a partial match means the host event moved under us,
  // and half a schedule is worse than none.
  return days.length === challengerShowdown.days.length ? days : [];
}
