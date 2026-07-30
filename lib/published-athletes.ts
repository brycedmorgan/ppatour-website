/**
 * Published athlete profiles — the full roster of pros with a published page on
 * ppatour.com (scraped once into `lib/data/published-athletes.json`).
 *
 * This is the biographical enrichment layer: bio, quick facts (residence, DOB,
 * height, plays, turned pro, paddle), divisions, and country for ~180 athletes,
 * keyed by the **canonical** player slug (the same slug the Pickleball.com
 * Partner API uses — see `lib/rankings-api.ts`). Live rank/points/headshots
 * still come from the API; this module supplies the words.
 *
 * Bios in the source are single run-on strings with section headers ("Quick
 * Facts", "Background & Career", "Playing Style", "Career Highlights",
 * "Related Articles") mashed inline and, in some cases, duplicated text. We
 * clean them at module load into de-duplicated narrative paragraphs.
 */

import raw from "@/lib/data/published-athletes.json";
import { getAthlete } from "@/lib/athletes";

export type QuickInfo = {
  /** City, State/Country of residence. */
  resides: string | null;
  /** ISO date (YYYY-MM-DD) of birth. */
  dob: string | null;
  /** Height as published (e.g. `5'9"`). */
  height: string | null;
  /** Handedness, normalized to "Right-Handed" / "Left-Handed". */
  plays: string | null;
  /** Year the athlete turned pro. */
  turnedPro: string | null;
  /** Current paddle. */
  paddle: string | null;
};

export type PublishedAthlete = {
  /** Canonical slug (matches the API `player_slug`). */
  slug: string;
  name: string;
  country: string;
  /** Lowercase ISO-2 for the circle-flag CDN, or "" if unknown. */
  countryCode: string;
  divisions: string[];
  quickInfo: QuickInfo;
  /** Cleaned narrative paragraphs (headers/boilerplate/dupes stripped). */
  bio: string[];
  /** Short descriptor from the source headline, if any. */
  headline: string | null;
  /** Source profile on ppatour.com. */
  sourceUrl: string;
};

/** Raw shape of each record in the JSON. */
type RawAthlete = {
  name: string;
  slug: string;
  url: string;
  country: string;
  divisions: string[];
  quick_info: {
    resides: string | null;
    dob: string | null;
    height: string | null;
    plays: string | null;
    turned_pro: string | null;
    paddle: string | null;
  };
  bio: string | null;
};

/**
 * Curated shorthand slug (in `lib/athletes.ts`) → canonical slug used by the
 * API and this published data. Kept here so both layers share one source.
 */
export const CURATED_TO_CANONICAL: Record<string, string> = {
  "gabe-tardio": "gabriel-tardio",
  "tyra-black": "hurricane-tyra-black",
  "paris-todd": "parris-todd",
  "megan-dizon": "meghan-dizon",
  "eddie-perez": "edward-perez",
};

const COUNTRY_ISO: Record<string, string> = {
  USA: "us",
  "American Samoan": "as",
  Argentina: "ar",
  Australia: "au",
  Belarus: "by",
  Belgium: "be",
  Bolivia: "bo",
  Brazil: "br",
  Bulgaria: "bg",
  Canada: "ca",
  China: "cn",
  "Chinese Taipei": "tw",
  Colombia: "co",
  Croatia: "hr",
  France: "fr",
  Germany: "de",
  India: "in",
  Israel: "il",
  Japan: "jp",
  Libya: "ly",
  Lithuania: "lt",
  Peru: "pe",
  Poland: "pl",
  Romania: "ro",
  Slovakia: "sk",
  Slovenia: "si",
  "South Africa": "za",
  "South Korea": "kr",
  Spain: "es",
  Venezuela: "ve",
};

export function countryCodeFor(country: string): string {
  return COUNTRY_ISO[country] ?? "";
}

/* ---------------- bio cleaning ---------------- */

const KEEP_ORDER = [
  "Background & Early Career",
  "Background & Career",
  "Background and Career",
  "Background",
  "Playing Style & Strengths",
  "Playing Style",
  "Career Highlights",
  "Career Achievements",
  "Notable Achievements",
  "Notable Results",
  "Achievements",
  "Personal Life",
  "Personal",
];
const STOP_HEADERS = ["Related Articles", "Off the Court", "Off Court"];
const ALL_HEADERS = ["Quick Facts", ...KEEP_ORDER, ...STOP_HEADERS];
const STOP = new Set(STOP_HEADERS);

const norm = (s: string | null | undefined) => (s || "").replace(/\s+/g, " ").trim();

/** Tidy scrape artifacts: spaces before punctuation, stray double spaces. */
function tidy(s: string): string {
  return s
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function canonHeader(h: string): string {
  const key = norm(h).toLowerCase();
  return ALL_HEADERS.find((x) => x.toLowerCase() === key) || norm(h);
}

function splitSentences(t: string): string[] {
  return t
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'“])/)
    .map(norm)
    .filter(Boolean);
}

function dedupeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 60);
}

// Built once.
const HEADER_SPLITTER = (() => {
  const pattern = ALL_HEADERS.slice()
    .sort((a, b) => b.length - a.length)
    .map((h) =>
      h
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/ /g, "\\s+")
        .replace(/&/g, "(?:&|and)"),
    )
    .join("|");
  return new RegExp(`\\s+(${pattern})\\s+`, "g");
})();

function cleanBio(rawBio: string | null, name: string): { headline: string | null; paragraphs: string[] } {
  const text = norm(rawBio);
  if (!text) return { headline: null, paragraphs: [] };

  // Split into alternating [body, header, body, header, ...].
  const segs: { type: "body" | "header"; text: string }[] = [];
  let prev = 0;
  let match: RegExpExecArray | null;
  HEADER_SPLITTER.lastIndex = 0;
  while ((match = HEADER_SPLITTER.exec(text)) !== null) {
    segs.push({ type: "body", text: text.slice(prev, match.index) });
    segs.push({ type: "header", text: norm(match[1]) });
    prev = HEADER_SPLITTER.lastIndex;
  }
  segs.push({ type: "body", text: text.slice(prev) });

  // Pull "{Name}: {Headline} {narrative}" out of the first body segment.
  let intro = segs[0].text;
  let headline: string | null = null;
  const colon = intro.indexOf(": ");
  if (colon !== -1 && colon <= name.length + 4) {
    const after = intro.slice(colon + 2);
    const first = name.split(" ")[0];
    let cut = -1;
    if (name && after.indexOf(name) > 0) cut = after.indexOf(name);
    else if (first && after.indexOf(first) > 0) cut = after.indexOf(first);
    if (cut > 0 && cut < 120) {
      headline = norm(after.slice(0, cut));
      intro = norm(after.slice(cut));
    } else {
      intro = norm(after);
    }
  }

  // Bucket bodies by canonical section, keeping the intro first.
  const buckets: Record<string, string> = { __intro: intro };
  for (let i = 1; i < segs.length; i += 2) {
    const canon = canonHeader(segs[i].text);
    const body = norm(segs[i + 1]?.text);
    if (STOP.has(canon)) break; // drop everything after "Related Articles" etc.
    if (canon === "Quick Facts" || !KEEP_ORDER.includes(canon)) continue;
    buckets[canon] = (buckets[canon] ? `${buckets[canon]} ` : "") + body;
  }

  const order = ["__intro", ...KEEP_ORDER];
  const seen = new Set<string>();
  const paragraphs: string[] = [];
  for (const key of order) {
    if (!buckets[key]) continue;
    const kept: string[] = [];
    for (const s of splitSentences(buckets[key])) {
      const k = dedupeKey(s);
      // Drop dupes, tiny fragments, and leftover "Paddle:" boilerplate
      // (the paddle lives in structured quickInfo).
      if (k.length < 8 || seen.has(k) || /\bPaddle:/i.test(s)) continue;
      seen.add(k);
      kept.push(s);
    }
    if (kept.length) paragraphs.push(tidy(kept.join(" ")));
  }
  return { headline, paragraphs };
}

/* ---------------- public API ---------------- */

function normalizePlays(plays: string | null): string | null {
  if (!plays) return null;
  const p = plays.toLowerCase();
  if (p.includes("left")) return "Left-Handed";
  if (p.includes("right")) return "Right-Handed";
  return plays;
}

export const publishedAthletes: PublishedAthlete[] = (raw as RawAthlete[]).map((r) => {
  const { headline, paragraphs } = cleanBio(r.bio, r.name);
  return {
    slug: r.slug,
    name: r.name,
    country: r.country || "",
    countryCode: countryCodeFor(r.country || ""),
    divisions: r.divisions ?? [],
    quickInfo: {
      resides: r.quick_info?.resides ?? null,
      dob: r.quick_info?.dob ?? null,
      height: r.quick_info?.height ?? null,
      plays: normalizePlays(r.quick_info?.plays ?? null),
      turnedPro: r.quick_info?.turned_pro ?? null,
      paddle: r.quick_info?.paddle ?? null,
    },
    bio: paragraphs,
    headline,
    sourceUrl: r.url,
  };
});

const BY_SLUG: Record<string, PublishedAthlete> = Object.fromEntries(
  publishedAthletes.map((a) => [a.slug, a]),
);

const BY_NAME: Record<string, PublishedAthlete> = Object.fromEntries(
  publishedAthletes.map((a) => [normalizeName(a.name), a]),
);

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Look up a published profile by slug. Accepts either the canonical slug or a
 * curated shorthand slug (mapped via {@link CURATED_TO_CANONICAL}).
 */
export function getPublishedAthlete(slug: string): PublishedAthlete | undefined {
  return BY_SLUG[slug] ?? BY_SLUG[CURATED_TO_CANONICAL[slug] ?? ""];
}

/** Canonical slug → curated shorthand (the inverse of CURATED_TO_CANONICAL). */
const CANONICAL_TO_CURATED: Record<string, string> = Object.fromEntries(
  Object.entries(CURATED_TO_CANONICAL).map(([curated, canonical]) => [canonical, curated]),
);

/**
 * The slug `/athletes/[slug]` actually prerenders for this athlete, or null
 * when we publish no profile for them.
 *
 * Two traps this closes: the page is keyed by the CURATED shorthand when one
 * exists (so `gabriel-tardio` lives at `/athletes/gabe-tardio`), and the old
 * WordPress site had 218 athlete entries against the 180 published here — so a
 * legacy slug resolving to nothing is normal, not exceptional.
 */
export function publishedProfileSlug(slug: string): string | null {
  const curated = CANONICAL_TO_CURATED[slug] ?? slug;
  if (getAthlete(curated)) return curated;
  return getPublishedAthlete(slug) ? slug : null;
}

/**
 * A never-404 link for an athlete: their profile when we have one, otherwise
 * the roster index. Used for athlete references inside migrated WordPress posts,
 * where the archive names players we don't publish (Sam Querrey, Quang Duong…).
 */
export function athleteProfileHref(slug: string): string {
  const resolved = publishedProfileSlug(slug);
  return resolved ? `/athletes/${resolved}` : "/athletes";
}

/** Look up a published profile by full name (accent/spacing-insensitive). */
export function getPublishedByName(name: string): PublishedAthlete | undefined {
  return BY_NAME[normalizeName(name)];
}

/** True year an athlete turned pro (parsed from the ISO date), else null. */
export function turnedProYear(a: PublishedAthlete): string | null {
  const tp = a.quickInfo.turnedPro;
  if (!tp) return null;
  const y = tp.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : null;
}

/** Age in whole years from the DOB, or null if unknown/unparseable. */
export function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}
