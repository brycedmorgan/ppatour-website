/**
 * Checks for lib/bracket-merge.ts — run with:
 *
 *   node --experimental-strip-types scripts/bracket-merge.test.ts
 *
 * No test runner in this repo, and this needs none: the module is pure, and
 * every case below is a shape the live feed has actually produced during an
 * event. Worth keeping because the failures it guards are invisible in review
 * — the bracket looks fine until an upstream hiccup lands mid-poll.
 *
 * ⚠ THE "all-TBD" CASE IS THE ONE THAT EARNED ITS KEEP. It failed on the first
 * implementation: the bracket-level guard kept the right structure and then
 * applied the blanked match data straight over the top of it, so the names
 * disappeared anyway. That is what the per-match `matchProgress` guard fixed.
 */
import { mergeBracket } from "../lib/bracket-merge.ts";

const side = (name: string | null, winner = false) => ({
  participant: name ? { id: name, name } : null,
  games: [11, null, null] as (number | null)[],
  winner,
});
const match = (id: string, a: string | null, b: string | null, w = false) => ({
  id, roundIndex: 0, status: "scheduled" as const,
  sides: [side(a, w), side(b)] as [ReturnType<typeof side>, ReturnType<typeof side>],
});
const brk = (rounds: { name: string; matches: ReturnType<typeof match>[] }[], div = "d1") =>
  ({ eventId: "e1", divisionId: div, divisionName: "MD", format: "single-elim" as const, rounds }) as never;

const good = brk([
  { name: "R64", matches: [match("m1", "Ben", "Fed"), match("m2", "JW", "Tyson")] },
  { name: "SF",  matches: [match("m3", "TBD", "TBD")] },
]);
const empty  = brk([]);
const thin   = brk([{ name: "R64", matches: [match("m1", "Ben", "Fed", true)] }]);
const wiped  = brk([
  { name: "R64", matches: [match("m1", null, null), match("m2", null, null)] },
  { name: "SF",  matches: [match("m3", null, null)] },
]);
const richer = brk([
  { name: "R64", matches: [match("m1", "Ben", "Fed", true), match("m2", "JW", "Tyson")] },
  { name: "SF",  matches: [match("m3", "Ben", "TBD")] },
  { name: "F",   matches: [match("m4", "TBD", "TBD")] },
]);
const other = brk([{ name: "R64", matches: [match("x1", "A", "B")] }], "d2");

const n = (b: unknown) => (b as { rounds: { matches: unknown[] }[] } | null)
  ? (b as { rounds: { matches: unknown[] }[] }).rounds.reduce((s, r) => s + r.matches.length, 0) : 0;
const won = (b: unknown, id: string) => {
  const m = (b as { rounds: { matches: { id: string; sides: { winner: boolean }[] }[] }[] })
    .rounds.flatMap(r => r.matches).find(x => x.id === id);
  return m ? m.sides[0].winner : null;
};

let pass = 0, fail = 0;
const check = (label: string, cond: boolean) => { cond ? pass++ : fail++; console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`); };

check("empty poll keeps the good bracket",        n(mergeBracket(good, empty)) === 3);
check("null poll keeps the good bracket",         n(mergeBracket(good, null)) === 3);
check("undefined poll keeps the good bracket",    n(mergeBracket(good, undefined)) === 3);
check("first load accepts incoming",              n(mergeBracket(null, good)) === 3);
check("thin poll keeps 3 matches (no shrink)",    n(mergeBracket(good, thin)) === 3);
check("thin poll still applies its result",       won(mergeBracket(good, thin), "m1") === true);
check("all-TBD poll does not blank named sides",  n(mergeBracket(good, wiped)) === 3 &&
      JSON.stringify(mergeBracket(good, wiped)).includes("Ben"));
check("richer poll is adopted (4 matches)",       n(mergeBracket(good, richer)) === 4);
check("richer poll carries the new winner",       won(mergeBracket(good, richer), "m1") === true);
check("division switch replaces, never merges",   n(mergeBracket(good, other)) === 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
