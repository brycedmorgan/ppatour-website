/**
 * "PPA Tour Explained (2026-27)" — the official explainer series on the PPA
 * Tour YouTube channel (@PPAtour).
 *
 * ⚠ CURATED, NOT FETCHED, and that is the point. `lib/youtube.ts` pages a
 * playlist through the YouTube Data API and needs `YOUTUBE_API_KEY` — it
 * returns [] without one, which is right for a replay gallery (a missing
 * gallery is no worse than an empty one) and wrong here: these four are fixed
 * editorial placements on /rankings and /about/how-it-works, and they must
 * render on a machine with no key, in a preview, and at build time. So the ids
 * are literals and the pages stay static.
 *
 * Titles are the real YouTube titles, read from the oEmbed endpoint
 * (`youtube.com/oembed?url=…`) rather than typed from the video — with the
 * "| PPA Tour Explained (2026-27)" series suffix trimmed, since the section
 * heading already says the series name. Re-read oEmbed if one is retitled
 * upstream; nothing here detects that automatically.
 *
 * Blurbs are ours, describing what each video answers. They are not YouTube
 * descriptions and are not scraped.
 *
 * Thumbnails come straight from i.ytimg.com, which next.config.ts already
 * allowlists for the replay galleries. `maxresdefault` (1280×720) was confirmed
 * present for all four ids — it is NOT guaranteed for every YouTube video, so
 * anything added here should be checked, or dropped to `hqdefault`, which
 * always exists.
 */

export type ExplainerVideo = {
  /** YouTube video id. */
  id: string;
  /** Real YouTube title, series suffix trimmed. */
  title: string;
  /** One line on what the video answers — ours, not YouTube's. */
  blurb: string;
};

/** Display name of the series, used as the section eyebrow on both pages. */
export const EXPLAINER_SERIES = "PPA Tour Explained";

/** youtu.be/8sigzOPK1Kc */
const BECOME_A_PRO: ExplainerVideo = {
  id: "8sigzOPK1Kc",
  title: "How Do You Become a Pro Pickleball Player?",
  blurb:
    "What a UPA contract is, the three routes to earning one, and the Gold / Standard / Futures levels.",
};

/** youtu.be/mtXaDNk1foY */
const RANKINGS_WHY: ExplainerVideo = {
  id: "mtXaDNk1foY",
  title: "Why the PPA Tour Created the World Pickleball Rankings",
  blurb:
    "The case for one composite ranking across men's/women's doubles, mixed and singles.",
};

/** youtu.be/giFcIZXEXFY */
const RANKINGS_HOW: ExplainerVideo = {
  id: "giFcIZXEXFY",
  title: "How Do the New World Pickleball Rankings Work?",
  blurb:
    "The 50/35/15 weighting, the rolling 52-week window, and how a ranking becomes a seed.",
};

/** youtu.be/XDA7rA79zxM */
const ONE_POINT_SYSTEM: ExplainerVideo = {
  id: "XDA7rA79zxM",
  title: "One Tour, One Point System: How the New PPA Tour Works",
  blurb:
    "Worlds, majors, cups and opens on one calendar, paying into one set of points.",
};

/**
 * /about/how-it-works — all four, ordered to mirror that page's own sections
 * (Who Is a Pro → Rankings & Seeding → Tournaments & Draws → Points & Prize
 * Money) so the grid reads in the same order as the jump nav above it.
 */
export const HOW_IT_WORKS_VIDEOS: readonly ExplainerVideo[] = [
  BECOME_A_PRO,
  RANKINGS_WHY,
  RANKINGS_HOW,
  ONE_POINT_SYSTEM,
];

/**
 * /rankings — the two Wesley named on 8/5 ("the last 2 will be on /rankings",
 * i.e. the 3rd and 4th URLs he sent: mtXaDNk1foY then XDA7rA79zxM).
 *
 * ⚠ Note for whoever revisits this: taken by TITLE the two rankings videos are
 * RANKINGS_WHY and RANKINGS_HOW, so "How Do the New World Pickleball Rankings
 * Work?" is currently on /about/how-it-works but NOT on the rankings page it
 * describes. That follows the instruction as given rather than second-guessing
 * it. If it was a slip, the fix is one identifier: swap ONE_POINT_SYSTEM for
 * RANKINGS_HOW below. Both stay on /about/how-it-works either way.
 */
export const RANKINGS_VIDEOS: readonly ExplainerVideo[] = [
  RANKINGS_WHY,
  ONE_POINT_SYSTEM,
];
