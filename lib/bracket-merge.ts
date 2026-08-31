/**
 * Fold a freshly polled bracket into the one already on screen.
 *
 * ⚠ WHY THIS EXISTS: THE PANEL USED TO DO `setBracket(d.bracket)` EVERY 15
 * SECONDS, guarded only by "did we get JSON at all". So any degraded poll —
 * an upstream timeout, a partial draw, a division that momentarily returns
 * zero rounds — replaced a complete, correct bracket with a worse one. That is
 * the bracket "disappearing", and it is also the layout "changing shape": a
 * payload with fewer rounds redraws the whole tree narrower, then the next
 * poll redraws it back.
 *
 * The upstream fixes (8/26) stopped the SERVER caching or serving an empty
 * draw. This is the other half: the CLIENT must not throw away what it already
 * has just because one request came back thinner.
 *
 * The rule is simply that a bracket never gets less complete. Each poll:
 *   • an empty or missing payload is ignored — the screen keeps what it has;
 *   • the richer of (on screen, just arrived) supplies the STRUCTURE, so the
 *     round and match layout is stable and only ever grows;
 *   • the newest data supplies each MATCH, keyed by id — so scores, winners,
 *     who advanced and where they advanced to update in place, which is all a
 *     poll is actually for.
 *
 * The effect is what a delta endpoint would give us without one: the feed
 * re-sends the whole draw, and we apply only what changed.
 */
import type { Bracket, BracketMatch } from "@/lib/bracket-types";

function allMatches(b: Bracket): BracketMatch[] {
  return b.rounds.flatMap((r) => r.matches);
}

/**
 * How much real content a bracket carries.
 *
 * Matches dominate, with named sides as the tie-break: a draw can come back
 * with the right number of matches but every player blanked to TBD, which
 * looks structurally fine and is still a regression a fan would notice. Named
 * sides only ever increase as a draw fills in, so a drop is always a fault.
 */
function completeness(b: Bracket): number {
  const matches = allMatches(b);
  const named = matches.reduce(
    (n, m) => n + m.sides.filter((s) => s.participant && s.participant.name).length,
    0,
  );
  return matches.length * 1000 + named;
}

/**
 * How far along a single match is.
 *
 * ⚠ THE BRACKET-LEVEL CHECK IS NOT ENOUGH ON ITS OWN, which a test caught: a
 * poll can return the right number of matches with every player blanked back
 * to TBD. That loses to `completeness` overall, so the structure is kept — but
 * the match data was still being applied on top, blanking the names anyway.
 * Each match therefore has to refuse its own regression.
 *
 * Safe because a match only ever moves forwards: a seeded name never becomes
 * TBD again, a played game never unplays. A genuine correction upstream (a
 * name swapped for another) scores equal and still wins, since ties go to the
 * newer data.
 */
function matchProgress(m: BracketMatch): number {
  const named = m.sides.filter((s) => s.participant && s.participant.name).length;
  const games = m.sides.reduce(
    (n, s) => n + s.games.filter((g) => g !== null).length,
    0,
  );
  const decided = m.sides.some((s) => s.winner) ? 1 : 0;
  const phase = m.status === "final" ? 2 : m.status === "live" ? 1 : 0;
  return named * 100 + games * 10 + decided * 4 + phase;
}

/**
 * The bracket to render after a poll.
 *
 * Returns `current` unchanged when the poll brought nothing usable, so a
 * caller can pass the result straight to state.
 */
export function mergeBracket(
  current: Bracket | null,
  incoming: Bracket | null | undefined,
): Bracket | null {
  // Nothing arrived, or an empty shell arrived — keep the screen as it is.
  if (!incoming || allMatches(incoming).length === 0) return current;
  if (!current) return incoming;

  // A different draw entirely (division switch) replaces rather than merges;
  // merging two unrelated brackets by match id would splice them together.
  if (current.divisionId !== incoming.divisionId || current.eventId !== incoming.eventId) {
    return incoming;
  }

  // Structure comes from whichever is more complete; match data always comes
  // from the poll, so a thin response still delivers new scores without
  // costing us the rounds it forgot to mention.
  const skeleton = completeness(incoming) >= completeness(current) ? incoming : current;
  const fresh = new Map(allMatches(incoming).map((m) => [m.id, m]));
  const held = new Map(allMatches(current).map((m) => [m.id, m]));

  return {
    ...skeleton,
    rounds: skeleton.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((m) => {
        const a = fresh.get(m.id);
        const b = held.get(m.id);
        if (!a) return b ?? m;
        if (!b) return a;
        // Ties go to the poll, so corrections land; regressions are refused.
        return matchProgress(a) >= matchProgress(b) ? a : b;
      }),
    })),
  };
}
