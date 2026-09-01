/**
 * The scores board's qualifier→pro switch, across the dates that matter.
 * Pure — no browser, no feed. Run: npx tsx scratchpad/verify-scores-day.ts
 */
import { showQualifierBoard } from "../lib/scores-stage";
import type { ScoreMatch, ScoresResult } from "../lib/scores-api";

const m = (status: ScoreMatch["status"], dateKey: string): ScoreMatch =>
  ({ id: `${status}-${dateKey}-${Math.round(Math.abs(Math.sin(dateKey.length)) * 1e6)}`, divisionId: "d", division: "Men's Doubles",
     roundNumber: 1, roundLabel: "R32", matchNumber: 1, court: "", dateKey, dateLabel: dateKey,
     status, teams: [{ players: ["A"], seed: 1, games: [], winner: false }, { players: ["B"], seed: 2, games: [], winner: false }] }) as ScoreMatch;

const result = (mainMatches: ScoreMatch[], qualMatches: ScoreMatch[] | null): ScoresResult =>
  ({ tournamentId: "t", divisions: [{ id: "d", name: "Men's Doubles" }], matches: mainMatches,
     qualifier: qualMatches ? { divisions: [{ id: "q", name: "Men's Doubles" }], matches: qualMatches } : null,
     champions: [], standings: [], headshots: {} }) as ScoresResult;

const QUAL_PLAYED = [m("final", "2026-08-31"), m("live", "2026-08-31"), m("scheduled", "9999-12-31")];

const CASES: [string, ScoresResult | null, string | null, boolean][] = [
  ["qualifying day — qualifier played, main draw idle",        result([m("scheduled", "9999-12-31")], QUAL_PLAYED), "2026-08-31", true],
  ["NEXT DAY — the ticker rolls over, nothing else changed",   result([m("scheduled", "9999-12-31")], QUAL_PLAYED), "2026-09-01", false],
  ["two days later",                                           result([m("scheduled", "9999-12-31")], QUAL_PLAYED), "2026-09-02", false],
  ["day before qualifying (device clock behind)",               result([m("scheduled", "9999-12-31")], QUAL_PLAYED), "2026-08-30", true],
  ["main draw has started — pro wins on qualifying day itself", result([m("live", "2026-08-31")], QUAL_PLAYED),      "2026-08-31", false],
  ["main draw completed (finished event)",                      result([m("final", "2026-08-30")], QUAL_PLAYED),     "2026-08-31", false],
  ["no qualifier bracket in the payload",                       result([m("scheduled", "9999-12-31")], null),        "2026-08-31", false],
  ["qualifier present but nothing played yet (pre-event)",      result([m("scheduled", "9999-12-31")], [m("scheduled", "9999-12-31")]), "2026-08-31", false],
  ["late-night qualifier bucketed to the NEXT UTC day",
    result([m("scheduled", "9999-12-31")], [m("final", "2026-08-31"), m("final", "2026-09-01")]), "2026-09-01", false],
  ["before mount (device date not read yet)",                   result([m("scheduled", "9999-12-31")], QUAL_PLAYED), null,         false],
  ["no data at all",                                            null,                                                "2026-08-31", false],
];

let pass = 0, fail = 0;
for (const [label, data, today, expected] of CASES) {
  const got = showQualifierBoard(data, today);
  const ok = got === expected;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(58)} today=${String(today).padEnd(11)} → ${got ? "QUALIFIER" : "pro draw"}${ok ? "" : `  (expected ${expected ? "QUALIFIER" : "pro draw"})`}`);
  ok ? pass++ : fail++;
}
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
