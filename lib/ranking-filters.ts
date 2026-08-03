/**
 * Filters for the World Pickleball Rankings boards — name search and region.
 *
 * Shared deliberately between the client board (/rankings filters ~2,075 rows
 * in the browser) and the server-paginated /leaderboards, so the two pages
 * can't drift on what "matches" means. Pure functions, no server-only imports.
 *
 * ⚠ REGION IS DERIVED FROM `RankingEntry.countryCode`, NOT STORED ON THE ROW.
 * That is a payload decision, not a style one. /rankings renders the complete
 * boards, so anything added per row is multiplied by ~2,075 — a `region` field
 * would have cost ~25 KB of RSC payload on a document the 8/1 perf pass fought
 * down from 3.96 MB. The two-letter code is already in the payload for the
 * circle-flag, so deriving from it is free.
 */

/** Connor's five, in his order (7/31), plus the catch-all — see below. */
export type PlayerRegion = "usa" | "asia" | "australia" | "europe" | "canada" | "world";

/** A region filter value, including the unfiltered default. */
export type RegionFilter = PlayerRegion | "all";

/**
 * The filter options in display order.
 *
 * ⚠ THE FIVE REGIONS CONNOR SET FOR /events DO NOT COVER THE RANKED FIELD, and
 * that is the whole reason "Rest of World" exists. His five are right for
 * events — the tour only runs stops in those five places — but players come
 * from everywhere: measured against the live feed on 8/3, **47 of 2,075 ranked
 * pros are from neither the Americas-minus-Canada nor Africa**, i.e. Brazil
 * (10), Puerto Rico (5), Mexico (5), Colombia (5), Venezuela (4), Peru (3),
 * Chile, Argentina, Bolivia, Ecuador, Saint Lucia, plus South Africa, Morocco,
 * Libya, Zambia and Tunisia. Shipping the five alone would have made those 47
 * unreachable by any filter value — the exact failure the 7/31 events work
 * treated as a bug when the sub-1,000 stops had no reachable filter.
 *
 * So: Connor's five, in Connor's order, and nobody is unreachable.
 */
export const REGION_OPTIONS: { value: RegionFilter; label: string }[] = [
  { value: "all", label: "All Regions" },
  { value: "usa", label: "USA" },
  { value: "asia", label: "Asia" },
  { value: "australia", label: "Australia" },
  { value: "europe", label: "Europe" },
  { value: "canada", label: "Canada" },
  { value: "world", label: "Rest of World" },
];

const REGION_KEYS = new Set<string>(REGION_OPTIONS.map((o) => o.value));

/** Narrow an untrusted string (a searchParam) to a region filter. */
export function toRegionFilter(value: string | undefined): RegionFilter {
  return value && REGION_KEYS.has(value) ? (value as RegionFilter) : "all";
}

/**
 * Lowercase ISO 3166-1 alpha-2 → region. Keyed lowercase because
 * `RankingEntry.countryCode` is lowercased in the mapper (it feeds the
 * circle-flag CDN path).
 *
 * Deliberately NOT reusing `COUNTRY_BY_CODE` in lib/events-api.ts: that map is
 * three-letter codes for event HOST countries and only needs the places the
 * tour visits. This one is two-letter codes for player nationality and has to
 * answer for every passport on the board.
 *
 * Written out well past the countries currently on the board, for the same
 * reason events-api lists all of Europe: a Portuguese or Emirati pro should
 * land in the right region without a code change.
 */
const REGION_BY_COUNTRY_CODE: Record<string, PlayerRegion> = {
  us: "usa",
  ca: "canada",

  /* Oceania, filed under Connor's "Australia" label.
     ⚠ This follows the precedent already set in events-api's COUNTRY_BY_CODE,
     where `NZL: "Australia"` — the region is the Australia sister tour's
     footprint, not the country. It does mean the 32 New Zealanders on the
     board answer to "Australia". Consistent with /events; worth a ruling if
     anyone objects, in which case this is the one line to split. */
  au: "australia", nz: "australia", fj: "australia", pg: "australia",
  sb: "australia", vu: "australia", ws: "australia", to: "australia",
  ki: "australia", tv: "australia", nr: "australia", fm: "australia",
  mh: "australia", pw: "australia", ck: "australia", nu: "australia",
  nc: "australia", pf: "australia", gu: "australia", as: "australia",
  mp: "australia", wf: "australia", tk: "australia", nf: "australia",

  /* Asia. */
  af: "asia", bh: "asia", bd: "asia", bt: "asia", bn: "asia", kh: "asia",
  cn: "asia", hk: "asia", in: "asia", id: "asia", ir: "asia", iq: "asia",
  jp: "asia", jo: "asia", kz: "asia", kp: "asia", kr: "asia", kw: "asia",
  kg: "asia", la: "asia", lb: "asia", mo: "asia", my: "asia", mv: "asia",
  mn: "asia", mm: "asia", np: "asia", om: "asia", pk: "asia", ps: "asia",
  ph: "asia", qa: "asia", sa: "asia", sg: "asia", lk: "asia", sy: "asia",
  tw: "asia", tj: "asia", th: "asia", tl: "asia", tm: "asia", ae: "asia",
  uz: "asia", vn: "asia", ye: "asia",
  // Israel is geographically Asian; it plays European in most federations.
  // Filed geographically here — 2 players, and the flag says Israel either way.
  il: "asia",

  /* Europe. The transcontinental ones (Turkey, Georgia, Armenia, Azerbaijan,
     Russia, Cyprus) are filed European by the usual sporting convention. */
  al: "europe", ad: "europe", am: "europe", at: "europe", az: "europe",
  by: "europe", be: "europe", ba: "europe", bg: "europe", hr: "europe",
  cy: "europe", cz: "europe", dk: "europe", ee: "europe", fo: "europe",
  fi: "europe", fr: "europe", ge: "europe", de: "europe", gi: "europe",
  gr: "europe", gg: "europe", hu: "europe", is: "europe", ie: "europe",
  im: "europe", it: "europe", je: "europe", lv: "europe", li: "europe",
  lt: "europe", lu: "europe", mt: "europe", md: "europe", mc: "europe",
  me: "europe", nl: "europe", mk: "europe", no: "europe", pl: "europe",
  pt: "europe", ro: "europe", ru: "europe", sm: "europe", rs: "europe",
  sk: "europe", si: "europe", es: "europe", se: "europe", ch: "europe",
  tr: "europe", ua: "europe", gb: "europe", va: "europe", xk: "europe",

  /* Everything else — the Americas below Canada, the Caribbean and Africa —
     falls through to "world". Puerto Rico is deliberately NOT mapped to "usa":
     the feed gives it its own country and its own flag, and PR competes
     separately in international pickleball. */
};

/** The region a ranked player belongs to; "world" when we don't recognise the code. */
export function playerRegion(countryCode: string): PlayerRegion {
  return REGION_BY_COUNTRY_CODE[countryCode.toLowerCase()] ?? "world";
}

/**
 * Fold a name to a comparable form: lowercase, accents stripped, punctuation
 * flattened to spaces. So "martinez" finds "Martínez" — a search box that can't
 * match an accented name is worse than no search box for the pros most likely
 * to have one. Ten names on the current board are accented.
 *
 * The combining-marks range is used instead of `\p{Diacritic}`: unicode
 * property escapes need an ES2018 target and tsconfig pins ES2017.
 */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Does this player's name match the query? Every whitespace-separated term must
 * appear, in any order — so "johns ben" finds Ben Johns, and a trailing space
 * mid-typing never zeroes the board. An empty (or punctuation-only) query
 * matches everything rather than nothing.
 *
 * ⚠ EACH TERM IS ALSO TESTED AGAINST THE SEPARATOR-STRIPPED NAME, and that is
 * not cosmetic: **32 names on the board carry a hyphen, apostrophe or period**,
 * and folding punctuation to a space alone meant "foglkulich" could not find
 * "Daniel Fogl-Kulich" — nobody types the hyphen. Verified across all 32.
 */
export function matchesPlayerName(name: string, query: string): boolean {
  const q = fold(query);
  if (!q) return true;
  const hay = fold(name);
  const tight = hay.replace(/ /g, "");
  return q.split(" ").every((term) => hay.includes(term) || tight.includes(term));
}

/** True when either filter is doing something. */
export function isFiltering(query: string, region: RegionFilter): boolean {
  return query.trim() !== "" || region !== "all";
}
