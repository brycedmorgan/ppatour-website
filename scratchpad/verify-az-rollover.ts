/**
 * The Arizona Open's real payload, run through the switch on each day of the
 * stop — and under the three ways tomorrow can arrive.
 * Run: npx tsx scratchpad/verify-az-rollover.ts
 */
import "./load-env";
import { getScores, type ScoresResult, type ScoreMatch } from "../lib/scores-api";
import { showQualifierBoard } from "../lib/scores-stage";

const UUID = "62c01642-1bb2-4f9a-9998-599f8fdefe5c";

const clone = (r: ScoresResult): ScoresResult => JSON.parse(JSON.stringify(r));

async function main() {
  const live = await getScores(UUID);
  console.log(`live payload: main ${live.matches.length} matches, qualifier ${live.qualifier?.matches.length ?? 0}\n`);

  console.log("── the real payload, as each day arrives ──");
  for (const d of ["2026-09-13","2026-09-14","2026-09-15","2026-09-16","2026-09-20"]) {
    console.log(`  ${d}  →  ${showQualifierBoard(live, d) ? "PRO QUALIFIERS" : "pro draw"}`);
  }

  console.log("\n── the three ways tomorrow can arrive ──");
  // A: main draw under way
  const a = clone(live);
  (a.matches[0] as ScoreMatch).status = "live";
  console.log(`  main draw has started, still Sep 14   →  ${showQualifierBoard(a, "2026-09-14") ? "PRO QUALIFIERS" : "pro draw"}`);

  // B: qualifying played out, date rolls
  const b = clone(live);
  for (const m of b.qualifier!.matches) { m.status = "final"; m.dateKey = "2026-09-14"; }
  console.log(`  qualifying complete, Sep 15           →  ${showQualifierBoard(b, "2026-09-15") ? "PRO QUALIFIERS" : "pro draw"}`);
  console.log(`  qualifying complete, still Sep 14     →  ${showQualifierBoard(b, "2026-09-14") ? "PRO QUALIFIERS" : "pro draw"}`);

  // C: qualifying never played (washed out), date rolls anyway
  const c = clone(live);
  console.log(`  qualifying NEVER played, Sep 15       →  ${showQualifierBoard(c, "2026-09-15") ? "PRO QUALIFIERS" : "pro draw"}`);
}
main();
