import type { AthleteStats } from "@/lib/athlete-stats";

/**
 * Bio passthrough — reconcile scraped biography prose against the live player
 * API before it renders.
 *
 * The bios in `published-athletes.json` were scraped once from the old
 * WordPress profiles and froze whatever was true that day. The stat rail
 * directly above them reads from the live medals endpoint. So Ben Johns' page
 * showed **188 Career Titles** in the rail and "123+ PPA Tour titles … 36
 * singles titles, 41 doubles titles … As of 2024" in the prose underneath — on
 * the most-visited profile on the site. Anna Leigh Waters read 181 against a
 * live 196.
 *
 * This substitutes the live number wherever the prose states a career total we
 * can source. It is deliberately a REPLACER, never a writer:
 *
 *   - It only ever rewrites digits that are already in the sentence. It never
 *     adds a claim, a sentence, or an adjective.
 *   - Every rule needs a live value. No stats (API down, unknown player) → the
 *     prose is returned untouched, exactly as before.
 *   - It only fires when the numbers actually disagree, so a bio that was
 *     already right is never rewritten.
 *
 * ⚠ The hard case is that "titles" in these bios means two different things.
 * "36 singles titles" is a career total and should track the API. "16
 * consecutive mixed doubles titles with Anna Leigh Waters" is a STREAK, and
 * replacing 16 with the career mixed total would turn a true sentence into a
 * false one. Same for "21 Triple Crowns", which the medals endpoint doesn't
 * model at all. So every pattern here carries a negative guard for streak
 * language, and anything we can't source is left alone rather than guessed.
 */

/** Words that turn a count into a streak rather than a career total. */
const STREAK = /\b(?:consecutive|straight|in a row|running|unbeaten|win streak)\b/i;
/**
 * Language that scopes a count to a partner or a single event.
 *
 * ⚠ The word-boundary goes on each alternative, NOT after the group. Trailing
 * `\b` after `with\s+[A-Z]` can never match: the capital is followed by a
 * lowercase letter, which is not a boundary, so "3 gold medals with Andrei"
 * silently sailed through the guard and got rewritten to a career total.
 */
const SCOPED = /^\s*(?:together\b|with\s+[A-Z]|apiece\b|each\b)/;

/**
 * Is this count something other than a career total?
 *
 * ⚠ Three distinct traps, all found by dry-running the roster:
 *  - STREAK — "16 consecutive mixed doubles titles". The window is deliberately
 *    tight (30 chars BEFORE only). These bios are run-ons, and a ±60 window let
 *    a "consecutive" belonging to a later clause suppress a valid substitution
 *    two clauses earlier.
 *  - PARENTHETICAL — "(31 titles together)", "(8 with Matt Wright)". A count
 *    inside brackets is qualifying the sentence, never the career.
 *  - SCOPED — "won 3 gold medals with Andrei Daeascu" is one event's haul.
 */
function notACareerTotal(text: string, index: number, length: number): boolean {
  const before = text.slice(Math.max(0, index - 30), index);
  const after = text.slice(index + length, index + length + 30);
  if (STREAK.test(before)) return true;
  if (SCOPED.test(after)) return true;
  // Inside parentheses: an unmatched "(" between the last ")" and here.
  const head = text.slice(0, index);
  const open = head.lastIndexOf("(");
  const close = head.lastIndexOf(")");
  if (open > close) return true;
  return false;
}

export type BioSubstitution = {
  kind: "total" | "singles" | "doubles" | "mixed";
  from: string;
  to: string;
};

function replaceCount(
  text: string,
  re: RegExp,
  live: number | null,
  kind: BioSubstitution["kind"],
  log: BioSubstitution[],
): string {
  if (live == null || live <= 0) return text;
  return text.replace(re, (match, prefix: string, digits: string, suffix: string, offset: number) => {
    if (notACareerTotal(text, offset, match.length)) return match;
    if (Number(digits) === live) return match;
    /**
     * Drop a trailing "+". The scrape wrote "123+" to mean "at least 123",
     * which was honest for a frozen number. The live figure is exact, so
     * "188+" would be claiming an approximation we no longer need — and it
     * reads as sloppy next to a stat rail showing a clean 188.
     */
    const tail = suffix.replace(/^\+/, "");
    log.push({ kind, from: match.trim(), to: `${prefix}${live}${tail}`.trim() });
    return `${prefix}${live}${tail}`;
  });
}

/**
 * Rewrite one paragraph. Exported for the dry-run script that checks every
 * substitution across the roster before any of this ships.
 */
export function reconcileParagraph(
  para: string,
  stats: AthleteStats | null,
  log: BioSubstitution[] = [],
): string {
  const medals = stats?.medals;
  if (!medals) return para;

  let out = para;

  // "36 singles titles" / "41 doubles titles" / "22 mixed doubles titles"
  out = replaceCount(
    out,
    /(\b)(\d{1,3})(\+?\s+singles titles)/gi,
    medals.singles?.gold ?? null,
    "singles",
    log,
  );
  out = replaceCount(
    out,
    /(\b)(\d{1,3})(\+?\s+(?:men's |women's )?doubles titles)/gi,
    medals.doubles?.gold ?? null,
    "doubles",
    log,
  );
  out = replaceCount(
    out,
    /(\b)(\d{1,3})(\+?\s+mixed(?: doubles)? titles)/gi,
    medals.mixed?.gold ?? null,
    "mixed",
    log,
  );

  // Career totals: "123+ PPA Tour titles", "over 181 gold medals",
  // "196 career titles". Runs last so the per-discipline rules claim their
  // sentences first and this can't swallow them.
  out = replaceCount(
    out,
    /(\b)(\d{1,3})(\+?\s+(?:PPA Tour )?(?:gold medals|career titles|titles\b))/gi,
    medals.total?.gold ?? null,
    "total",
    log,
  );

  // The number is current now, so a vintage qualifier on it is a lie.
  if (log.length) {
    out = out.replace(/\bAs of \d{4},\s*/gi, "");
    out = out.replace(/\bas of \d{4}\b,?\s*/gi, "");
  }

  return out;
}

/**
 * Apply the passthrough to a full bio. Returns the paragraphs plus what
 * changed, so a caller (or a test) can see every substitution.
 */
export function reconcileBio(
  paragraphs: string[],
  stats: AthleteStats | null,
): { paragraphs: string[]; substitutions: BioSubstitution[] } {
  if (!stats?.medals) return { paragraphs, substitutions: [] };
  const substitutions: BioSubstitution[] = [];
  const out = paragraphs.map((p) => reconcileParagraph(p, stats, substitutions));
  return { paragraphs: out, substitutions };
}
