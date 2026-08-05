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
 *
 * ⚠ `slug` MUST be the API's `player_slug`, and the scrape does not guarantee
 * it. WordPress hands a second post for an existing name a `-2` slug, and four
 * of those reached the JSON and shipped as duplicate pages — /athletes read the
 * scrape, so `elsie-hendershot-2` rendered the only Elsie Hendershot card,
 * missed every live lookup (they key on the API slug, so rank 0 and no
 * headshot), and pointed at the thinner of her two pages. Corrected here in the
 * data, each against the live board: `elsie-hendershot`, `danna-funaro`,
 * `ella-cosma`, and `edward-perez` (whose duplicate was folded into the primary
 * record — its bio was a verbatim subset, and `divisions` was the one field it
 * added).
 *
 * ⚠ `luana-stanciu-1` KEEPS ITS SUFFIX. That is the API's own canonical slug
 * for her — there is no `luana-stanciu` on either board — so "strip the -N" is
 * exactly the wrong rule. `lib/athlete-slugs.ts` explains the test that works
 * (the board, not the string) and enforces it at render time;
 * `scripts/audit-athlete-slugs.mjs` checks the file itself.
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
  "Major League Pickleball",
  "Career Highlights",
  "Career Achievements",
  "Notable Achievements",
  "Notable Results",
  "Achievements",
];
/**
 * Everything from one of these to the end of the bio is dropped.
 *
 * "Frequently Asked Questions" is the SEO Q&A block the old WordPress profiles
 * carried under the biography. It's in 32 raw bios and, unrecognised, it read
 * as prose — 13 published pages ended with sentences like "Frequently Asked
 * Questions About Kate Fahey Is Kate Fahey on the PPA Tour? Yes, Kate Fahey is
 * a professional pickleball player…". It is never body copy; stop at it.
 *
 * ⚠ "Personal Life" / "Personal" moved here from KEEP_ORDER (Wesley, 8/5 — see
 * {@link isPersonalLife}). A whole section about a pro's private life is exactly
 * what we don't publish. No raw bio carries either header today (verified: 0
 * matches, and 0 occurrences of a standalone capitalised "Personal" anywhere in
 * the 179 bios, so the bare form can't truncate a bio mid-prose) — they are here
 * for the NEXT scrape, which is the whole point of fixing this in code.
 */
const STOP_HEADERS = [
  "Related Articles",
  "Frequently Asked Questions",
  "Off the Court",
  "Off Court",
  "Personal Life",
  "Personal",
];

/**
 * Headers that are ALSO ordinary prose, so they only count as a header at a
 * sentence boundary followed by a new capitalised clause.
 *
 * ⚠ "Major League Pickleball" appears in 87 raw bios and in 86 of them it is an
 * inline mention ("competes in Major League Pickleball (MLP)"). Matching it the
 * way the other headers are matched would split 86 bios mid-sentence. Verified
 * against the full roster: this rule fires on ben-johns only — the one bio where
 * it genuinely is a section header — and leaves the other 86 untouched.
 */
const BOUNDARY_HEADERS = ["Major League Pickleball"];

/**
 * Every recognised header — used to canonicalise a matched header string and to
 * decide which sections survive.
 *
 * ⚠ `PLAIN_HEADERS` is what the unguarded half of the splitter matches, and it
 * MUST exclude `BOUNDARY_HEADERS`. A boundary header listed here would be
 * matched anywhere, which is precisely what it's meant to avoid: with
 * "Major League Pickleball" left in this alternation, 86 bios split mid-sentence
 * on their ordinary "competes in Major League Pickleball (MLP)" mention.
 */
const ALL_HEADERS = ["Quick Facts", ...KEEP_ORDER, ...STOP_HEADERS];
const PLAIN_HEADERS = ALL_HEADERS.filter((h) => !BOUNDARY_HEADERS.includes(h));
const STOP = new Set(STOP_HEADERS);

/* ---------------- personal-life redaction ---------------- */

/**
 * Spouses, partners and marital status. These are never on-court facts, so the
 * whole sentence goes. `fianc` / `pregnan` / `divorc` / `widow` are matched as
 * stems because no other English word starts that way, which saves spelling out
 * fiance/fiancé/fiancée.
 *
 * ⚠ "partner" is deliberately absent. On this site it means DOUBLES partner.
 */
const RELATIONSHIP =
  /\b(?:wife|wives|husband|husbands|spouse|spouses|girlfriend|boyfriend|newlywed\w*|marriage|married|wedding)\b|\bfianc|\bdivorc|\bwidow|\bpregnan/i;

/**
 * Adjectives and counts that legitimately sit between a possessive and a family
 * noun ("their two young daughters", "the couple's two-year-old daughter").
 *
 * ⚠ THIS IS A WHITELIST ON PURPOSE, and a generic `\w+{0,3}` in its place is the
 * bug it exists to prevent: "volunteering his time teaching kids pickleball"
 * puts two ordinary words between "his" and "kids", so a loose gap match reads
 * a coaching sentence as a family one and deletes it.
 */
const CHILD_MODIFIER =
  /(?:\d+|two|three|four|five|six|seven|eight|twin|young|younger|youngest|old|older|oldest|eldest|little|new|newborn|adult|beautiful|proud|step|year|years|month|months|old)/
    .source;

/**
 * ⚠ `twins` IS PLURAL-ONLY, and singular "twin" must never be a noun here.
 * Three sentences were lost to `twins?` before this was tightened, and all three
 * were about FELLOW PROS: Hunter Johnson's ATP ranking and ITF titles won
 * alongside "his twin brother Yates", and both Kawamotos' tennis careers with
 * "her twin sister" — who is also her doubles partner. Siblings are not in scope
 * (see {@link isPersonalLife}); "twin" survives only as a modifier, so "their
 * twin daughters" still matches on "daughters".
 */
const CHILD_NOUN = /(?:sons?|daughters?|child|children|kids?|bab(?:y|ies)|twins)/.source;

/**
 * Children, but ONLY when possessed by the athlete or their spouse.
 *
 * ⚠ The possessive tie is the entire test, because the bare nouns are ordinary
 * pickleball vocabulary. Verified against all 179 raw bios — these all stay, and
 * a rule without the tie deleted every one of them:
 *   · "coaching adults, teens, and children for over three years"
 *   · "volunteering his time teaching kids pickleball"
 *   · "enjoys traveling, cooking, working with kids"
 *   · "'the kids are the future of the sport,' and I truly believe this"
 * Upbringing with nobody named also stays ("the sixth of eight children", "the
 * middle child of seven siblings") — no possessive, so no match.
 */
const OWN_CHILDREN = new RegExp(
  [
    // "his son", "her youngest daughter", "their two young daughters", "Maja's two kids"
    `\\b(?:his|her|their|our|my|[A-Z][a-z]+['’]s)\\s+(?:${CHILD_MODIFIER}[\\s-]+){0,3}${CHILD_NOUN}\\b`,
    // "the birth of her son", "welcomed his first child"
    `\\bbirth of (?:his|her|their|my)\\b`,
    // "the mother of two children", "the proud parents of two daughters"
    `\\b(?:mother|father|parents|dad|mom|stepmother|stepfather)\\s+(?:of|to)\\s+(?:(?:${CHILD_MODIFIER})[\\s-]+){0,3}${CHILD_NOUN}\\b`,
    `\\bexpecting (?:a|an|his|her|their)\\b`,
    `\\bgrandchild`,
  ].join("|"),
);

/**
 * True when a sentence is about a pro's private life rather than their
 * pickleball. Wesley, 8/5: don't publish family details — the ask started with
 * Jack Sock's bio ("Sock welcomed his first child alongside his wife Laura"),
 * and applies to every pro.
 *
 * ⚠ SENTENCES ARE DROPPED WHOLE, NEVER REWRITTEN. Same rule as `lib/bio-live.ts`
 * — we substitute or remove, we do not author prose. So a sentence that carries
 * a career fact AND a family detail loses both, and there are five of those
 * across the roster (brooke-buckner's start date, lina-padegimaite's training,
 * lindsey-newman's 2021 Nationals win, tina-pisnik's move to Chicago, and
 * martin-emmrich's tennis background + how he started). Recovering those means
 * an editor rewriting the sentence in the source data — the alternative is this
 * cleaner inventing sentences, which is worse.
 */
function isPersonalLife(s: string): boolean {
  return RELATIONSHIP.test(s) || OWN_CHILDREN.test(s);
}

/**
 * Strip personal-life sentences from already-assembled paragraphs.
 *
 * Scraped bios are redacted inside {@link cleanBio}, so this exists for the
 * OTHER bios the profile page can render: the hand-written curated ones in
 * `lib/athletes.ts` (clean today, but nothing stopped the next hand-edit) and
 * any future source. `/athletes/[slug]` runs its fallback bio through this so
 * the rule holds for every pro, not just the 179 with a scraped profile.
 */
export function redactPersonalLife(paragraphs: string[]): string[] {
  return paragraphs
    .map((p) => splitSentences(p).filter((s) => !isPersonalLife(s)))
    .filter((kept) => kept.length > 0)
    .map((kept) => tidy(kept.join(" ")));
}

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
const rx = (h: string) =>
  h
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/ /g, "\\s+")
    .replace(/&/g, "(?:&|and)");

/**
 * Two alternations, because the two header classes need different guards:
 * group 1 is the unambiguous headers (match anywhere), group 2 the
 * prose-colliding ones (sentence boundary + a following capital only).
 * Read `match[1] ?? match[2]` at the call site.
 */
const HEADER_SPLITTER = (() => {
  const plain = PLAIN_HEADERS.slice()
    .sort((a, b) => b.length - a.length)
    .map(rx)
    .join("|");
  const bounded = BOUNDARY_HEADERS.slice()
    .sort((a, b) => b.length - a.length)
    .map(rx)
    .join("|");
  return new RegExp(
    `\\s+(${plain})\\s+|(?<=[.!?])\\s+(${bounded})\\s+(?=[A-Z])`,
    "g",
  );
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
    segs.push({ type: "header", text: norm(match[1] ?? match[2]) });
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
  const first = name.split(" ")[0] ?? "";
  /** A question that names the subject is an SEO FAQ item, never bio prose. */
  const isFaqQuestion = (s: string) =>
    s.trimEnd().endsWith("?") &&
    ((name.length > 0 && s.includes(name)) || (first.length > 2 && s.includes(first)));

  /**
   * FAQ answers are only dropped when they're boilerplate — a restatement of
   * something the profile already says.
   *
   * ⚠ Do NOT drop every answer. Some carry facts that appear nowhere else:
   * Anna Leigh Waters' "181 gold medals and 39 Triple Crowns" is the answer to
   * "How many titles has she won?" and is the ONLY place that number lives.
   * Dropping answers wholesale silently deleted it.
   */
  const isBoilerplateAnswer = (s: string) =>
    /^(?:yes|no)\b/i.test(s) ||
    /^check the (?:ppa )?tour schedule/i.test(s) ||
    /is a professional pickleball player/i.test(s) ||
    /competes in [^.]*on the ppa tour\.?$/i.test(s) ||
    /\bplays with (?:a|the)\b/i.test(s);


  for (const key of order) {
    if (!buckets[key]) continue;
    const kept: string[] = [];
    const sentences = splitSentences(buckets[key]);
    let dropAnswer = false;
    for (const s of sentences) {
      /**
       * SEO FAQ pairs, dropped a pair at a time rather than by truncating.
       *
       * ⚠ Do NOT "stop at the first question" — 35 bios carry real closing
       * prose ("He continues to develop his game…") AFTER a FAQ item, and
       * truncating would eat it. Each question takes exactly its own next
       * sentence, which is the answer; anything else survives.
       */
      if (isFaqQuestion(s)) {
        dropAnswer = true;
        continue;
      }
      const wasAnswer = dropAnswer;
      dropAnswer = false;
      if (wasAnswer && isBoilerplateAnswer(s)) continue;

      // Spouses, children, marital status — never published. See isPersonalLife.
      if (isPersonalLife(s)) continue;

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
