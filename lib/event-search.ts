import type { Tournament } from "@/lib/placeholder-data";

/**
 * The searchable text behind an event, and the term matcher that reads it.
 *
 * This is the whole of "smart search" on /events — everything a fan might
 * plausibly type at a schedule and expect the right stop back. It is shared by
 * the /events grid (client, live filtering) and site-wide search (server), so
 * the two can never disagree about whether "Washington" finds Seattle.
 *
 * ⚠ THE BUG THAT STARTED THIS: the haystack was `name city state venue`, and
 * `state` holds the POSTAL ABBREVIATION. So "Seattle PPA Challenger" — Seattle,
 * WA — was unreachable by the word "Washington", and the same held for all 50
 * states. A fan searching a schedule types where they live, not its two-letter
 * code.
 *
 * ⚠ `Tournament.state` IS OVERLOADED and that governs the design here. On the
 * domestic tour it is a US postal code ("WA", "NC"); on international stops it
 * carries a COUNTRY name ("Australia", "Italy", "China", "Malaysia") and is
 * sometimes empty. So the expansion is a lookup that only fires on a known
 * two-letter US code — never a transform applied to the field — or "Italy"
 * would be run through a state table it has no business in.
 *
 * Nothing here invents a fact about an event. Every added term is either
 * already on the record (points, tier, dates, presenter, region) or a
 * geographic name for the place the record already states.
 */

/* ───────────────────────────── vocabulary ───────────────────────────── */

/** US postal code → state name. Fires only on an exact 2-letter match. */
const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin",
  WY: "Wyoming", DC: "Washington DC", PR: "Puerto Rico",
};

/**
 * Curated metro / regional aliases, keyed by the event's own city.
 *
 * These exist because the tour books SUBURBAN venues and markets them by the
 * metro: the World Championships play Farmers Branch and everyone calls it
 * Dallas; Nationals play Cary and the market is Raleigh. Without these, the
 * search is unreachable by the name the event is actually sold under.
 *
 * ⚠ Plain geography only — the metro a city sits in, or the name that city is
 * commonly travelled to as. Nothing about the event itself goes in here, and a
 * city whose metro is already in the event name (Northbrook → "Veolia Chicago
 * Cup") needs no entry. Add one only when you can state the fact plainly.
 */
const CITY_ALIASES: Record<string, string> = {
  Cary: "Raleigh Durham Research Triangle RDU North Carolina Triangle",
  "Farmers Branch": "Dallas Fort Worth DFW Metroplex North Texas",
  "Holly Hill": "Daytona Beach Florida",
  "Rancho Mirage": "Palm Springs Indian Wells Coachella Valley Greater Palm Springs",
  "Peachtree City": "Atlanta Metro Atlanta",
  Lakeville: "Minneapolis Saint Paul Twin Cities",
  Northbrook: "Chicago Chicagoland North Shore",
  Rockford: "Grand Rapids West Michigan",
  Ivins: "Saint George St George Zion Southern Utah",
  Englewood: "Sarasota Southwest Florida",
  "Cape Coral": "Fort Myers Southwest Florida",
  "San Clemente": "Orange County Southern California SoCal San Diego",
  "Newport Beach": "Orange County Southern California SoCal",
  Malibu: "Los Angeles LA Southern California SoCal",
  Mesa: "Phoenix Scottsdale Greater Phoenix Valley of the Sun",
  "Las Vegas": "Nevada Sin City",
  "Virginia Beach": "Hampton Roads Tidewater",
  McKinney: "Dallas Fort Worth DFW Metroplex North Texas",
  "Palm Springs": "Coachella Valley Greater Palm Springs",
};

/** Region words a fan might type for a domestic or international stop. */
const REGION_WORDS: Record<string, string> = {
  Asia: "Asia Asian international",
  Australia: "Australia Australian Oceania international",
  Canada: "Canada Canadian international",
  Europe: "Europe European international",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Tier vocabulary. Deliberately generous on synonyms a fan types but the site
 * doesn't print — "slam" for a Major (the retired name, still in every fan's
 * head) and the Challenger point levels.
 */
const TIER_WORDS: Record<string, string> = {
  worlds: "worlds world championships major slam",
  slam: "major slam championship",
  cup: "cup",
  open: "open",
  challenger: "challenger challengers",
};

const TIER_POINTS: Record<string, number> = {
  worlds: 3000,
  slam: 2000,
  cup: 1500,
  open: 1000,
};

/* ───────────────────────────── text builder ───────────────────────────── */

/** Every word a search term is allowed to hit for this event, lowercased. */
export function eventSearchText(t: Tournament): string {
  const parts: string[] = [t.name, t.city, t.state, t.venue, t.presentedBy ?? ""];

  // State — expand only a real US postal code. International records carry a
  // country name in this same field and must fall through untouched.
  const stateName = US_STATES[t.state?.trim().toUpperCase() ?? ""];
  if (stateName) parts.push(stateName, "USA United States America domestic");
  else if (!t.region) parts.push("USA United States America domestic");

  if (t.city) parts.push(CITY_ALIASES[t.city] ?? "");
  if (t.region === "international") parts.push("international");
  if (t.country) parts.push(REGION_WORDS[t.country] ?? t.country);

  // Tier and points — "major", "cup", "challenger", "1000", "1,000 points".
  parts.push(TIER_WORDS[t.tierKey] ?? t.tierKey);
  // Bare digits only — query punctuation is stripped before matching, so a
  // "1,000" in the haystack would be unreachable by the "1000" a fan types.
  const pts = t.points ?? TIER_POINTS[t.tierKey];
  if (pts) parts.push(String(pts), "points");

  // Dates — month name, abbreviation falls out of the full name as a substring,
  // plus both years so a range spanning New Year is findable from either.
  for (const iso of [t.startDate, t.endDate]) {
    if (!iso) continue;
    const [y, m] = iso.split("-");
    parts.push(y, MONTHS[Number(m) - 1] ?? "");
  }
  if (t.season) parts.push(t.season, t.season.replace("-", " "));
  if (t.status === "completed") parts.push("past results completed");

  return parts.filter(Boolean).join(" ").toLowerCase();
}

/* ───────────────────────────── matching ───────────────────────────── */

/** Fold accents and curly punctuation so "Portoroz" finds "Portorož". */
function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’]/g, "'")
    .toLowerCase();
}

/**
 * Levenshtein distance, bailing out as soon as it exceeds `max`. Only ever run
 * over one query term against one haystack token, so the cost is bounded by
 * word length, not document length.
 */
function withinDistance(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      row.push(v);
      if (v < best) best = v;
    }
    if (best > max) return false;
    prev = row;
  }
  return prev[b.length] <= max;
}

/**
 * A term matches the haystack when it appears as a substring, when its singular
 * form does ("challengers" → "challenger"), or — for a long enough term — when
 * some word in the haystack is within one or two typos of it.
 *
 * ⚠ The typo tolerance is gated at 5 characters and scales with length. Shorter
 * than that and edit distance 1 turns nearly every term into a wildcard: "cup"
 * would match "cap", "cut" and "cub". A search that finds everything is the
 * same as one that finds nothing.
 */
function termMatches(term: string, hay: string, tokens: string[]): boolean {
  if (hay.includes(term)) return true;
  if (term.length > 3 && term.endsWith("s") && hay.includes(term.slice(0, -1))) return true;
  if (term.length < 5) return false;
  const max = term.length >= 8 ? 2 : 1;
  return tokens.some((tok) => tok.length >= 4 && withinDistance(term, tok, max));
}

export type EventMatcher = (t: Tournament) => boolean;

/**
 * Build a matcher for one query. Terms are ANDed — "chicago cup" must satisfy
 * both — which is what makes multi-word queries narrow rather than widen.
 *
 * Returned as a closure over the parsed query so the per-event work is just the
 * text build plus a few `includes`, and the query is parsed once per keystroke
 * instead of once per event.
 */
export function eventMatcher(query: string): EventMatcher {
  const terms = fold(query)
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) return () => true;
  return (t: Tournament) => {
    const hay = fold(eventSearchText(t));
    const tokens = hay.split(/\s+/);
    return terms.every((term) => termMatches(term, hay, tokens));
  };
}
