/**
 * A generated profile paragraph for athletes whose curated bio is missing or
 * thin (docs/SEO.md, Phase 1 item 11: 15 athlete pages under 300 words).
 *
 * ⚠ EVERY CLAUSE IS CONDITIONAL ON A FIELD THE PAGE ALREADY RENDERS. Nothing
 * here is inferred, estimated or templated from a "typical pro": no field, no
 * clause. The result is prose built from the Quick Info table, the live rank
 * chip, the medal strip and the In the Bag callout — the same variables, so it
 * cannot contradict them. A doubles partner is deliberately absent: the
 * profile holds no partner field, so there is nothing honest to say.
 *
 * Pure and import-free so `scripts/athlete-bio.test.ts` runs it under
 * `node --experimental-strip-types`.
 */

export type BioFacts = {
  name: string;
  country?: string | null;
  /** As published: "Men's Doubles", "Women's Mixed Doubles", "Men's Singles". */
  divisions?: string[] | null;
  /** Year, e.g. "2025". */
  turnedPro?: string | null;
  /** "Boynton Beach, FL" / "Herstal, Belgium". */
  resides?: string | null;
  /** "Right" / "Left" (the feed's `handed`) or "Right-Handed" (quick info). */
  plays?: string | null;
  age?: number | null;
  /** Live WPR rank; 0/null = unranked, and nothing is said. */
  rank?: number | null;
  board?: "Men's" | "Women's" | null;
  points?: number | null;
  medals?: { gold: number; silver: number; semifinals: number } | null;
  paddle?: string | null;
};

/** A bio shorter than this (all paragraphs joined) gets the generated one appended. */
export const THIN_BIO_CHARS = 300;

/**
 * The placeholder `loadAthlete` uses when no source has a bio. Named so the
 * page can recognise and drop it once a fact-based paragraph is available —
 * "ranked among the world's best" is a claim, and an unranked pro's page
 * should not open with it.
 */
export function genericBio(name: string): string {
  return `${name} is a professional pickleball player ranked among the world's best in the Carvana PPA Tour's World Pickleball Rankings.`;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "a, b and c" */
function listJoin(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** "Men's Mixed Doubles" → "mixed doubles"; "Women's Singles" → "women's singles". */
function prettyDivision(d: string): string {
  return d
    .trim()
    .replace(/^(Men's|Women's)\s+Mixed Doubles$/i, "Mixed Doubles")
    .toLowerCase();
}

function handedness(plays: string | null | undefined): string | null {
  if (!plays) return null;
  const p = plays.toLowerCase();
  if (p.includes("left")) return "left-handed";
  if (p.includes("right")) return "right-handed";
  return null;
}

export function generatedBio(f: BioFacts): string[] {
  const name = f.name.trim();
  if (!name) return [];
  const first = name.split(/\s+/)[0];
  const divisions = (f.divisions ?? []).map(prettyDivision).filter(Boolean);

  const opening: string[] = [];
  opening.push(
    `${name} is a professional pickleball player${f.country ? ` from ${f.country}` : ""} on the Carvana PPA Tour${
      divisions.length ? `, competing in ${listJoin(divisions)}` : ""
    }.`,
  );
  if (f.rank && f.rank > 0) {
    opening.push(
      `${first} is currently No. ${f.rank} in the ${f.board ? `${f.board} ` : ""}World Pickleball Rankings${
        f.points && f.points > 0 ? ` with ${f.points.toLocaleString("en-US")} points` : ""
      }.`,
    );
  }

  const career: string[] = [];
  const m = f.medals;
  if (m && (m.gold > 0 || m.silver > 0 || m.semifinals > 0)) {
    const bits: string[] = [];
    if (m.gold > 0) bits.push(`won ${plural(m.gold, "PPA Tour title")}`);
    if (m.silver > 0) bits.push(`reached ${plural(m.silver, "final")}`);
    if (m.semifinals > 0) bits.push(`made ${plural(m.semifinals, "semifinal")}`);
    career.push(`On tour, ${first} has ${listJoin(bits)}.`);
  }
  const facts: string[] = [];
  if (f.turnedPro) facts.push(`turned pro in ${f.turnedPro}`);
  if (f.resides) facts.push(`is based in ${f.resides}`);
  const hand = handedness(f.plays);
  if (hand) facts.push(`plays ${hand}`);
  if (facts.length) {
    career.push(`${first}${f.age != null && f.age > 0 ? `, ${f.age},` : ""} ${listJoin(facts)}.`);
  }
  if (f.paddle) career.push(`${first} plays the ${f.paddle}.`);

  return [opening.join(" "), career.join(" ")].filter(Boolean);
}
