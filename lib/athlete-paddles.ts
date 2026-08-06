/**
 * The paddle a pro is on, from the event team's broadcast masterlist.
 *
 * ⚠ THE MASTERLIST IS THE ONLY SOURCE. A pro who is not in it shows NO paddle —
 * not a blank row, not a guess, nothing (Wesley, 8/5). `paddleFor` returning
 * null is the normal case for 88 of our 180 profiles, and every consumer must
 * treat it as "this athlete has no equipment section", never as missing data to
 * fill from somewhere else.
 *
 * ⚠ IN PARTICULAR, DO NOT FALL BACK TO `quickInfo.paddle`. That field is still
 * in `published-athletes.json` because it came with the 2024 profile scrape,
 * and it is exactly what this module replaces: it had a paddle for 108 pros,
 * nobody maintains it, and 49 of those disagreed with the masterlist or named a
 * pro the masterlist doesn't cover at all. A stale endorsement is a commercial
 * claim about a brand relationship that may have ended.
 *
 * Regenerate after an updated masterlist lands:
 *
 *   node scripts/import-paddles.mjs --report   # see what resolves, write nothing
 *   node scripts/import-paddles.mjs            # rewrite the JSON
 *
 * The importer prints every row it could NOT place. Read that list — a pro
 * missing from the site is usually a short or misspelled name in the CSV, and
 * the fix belongs in the CSV, not in a special case here.
 */
import raw from "@/lib/data/athlete-paddles.json";

export type PaddleRecord = {
  /** Display string, e.g. "JOOLA Perseus Pro V 16mm". Brand + model, verbatim. */
  paddle: string;
  /**
   * What to search Pickleball Central for. Usually identical to `paddle`, but
   * one masterlist row names two paddles in a single cell ("TORNAZO, PRO-BLADE
   * 2") and searching for both returns nothing — so the display stays verbatim
   * while the retail link uses the first model.
   */
  searchTerm: string;
  /** Roster name this was matched to — for auditing the importer's matching. */
  name: string;
  /** The name as the masterlist spells it, which is often not ours. */
  source: string;
};

const BY_SLUG = raw as Record<string, PaddleRecord>;

/**
 * The pro's paddle, or null when the masterlist doesn't cover them.
 *
 * Takes the slug the route is rendering. No alias handling is needed here: a
 * pro who has two page slugs (Tyra Black is `tyra-black` AND
 * `hurricane-tyra-black`; Augustus Ge is `augie-ge` AND `augustus-ge`) is
 * written under both by the importer, so whichever page renders finds it.
 */
export function paddleFor(slug: string): PaddleRecord | null {
  return BY_SLUG[slug] ?? null;
}

/** How many profiles carry a paddle — used by the importer's own audit output. */
export const paddleCount = Object.keys(BY_SLUG).length;
