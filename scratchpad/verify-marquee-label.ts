/**
 * The marquee's round label: qualifier rows say "Pro Qualifiers", main-draw
 * rows keep the feed's round. Pure — no browser, no feed.
 * Run: npx tsx scratchpad/verify-marquee-label.ts
 */
type Row = { title: string; round: string };

// Mirrors lib/ticker-api's isQualifierRow + cleanDivision.
const isQualifierRow = (t?: string) => /qualif/i.test(t ?? "");
const cleanDivision = (t: string) =>
  t.replace(/\s*Pro (?:Main Draw|Qualifier)\s*/i, "").replace(/\bMens\b/i, "Men's").replace(/\bWomens\b/i, "Women's").trim();
// Mirrors components/live/LiveBar's roundLabel.
const roundLabel = (m: { round: string; qualifier: boolean }) => (m.qualifier ? "Pro Qualifiers" : m.round);

const CASES: [Row, string, string][] = [
  // title (as the feed sends it)              round          expected label      expected division
  [{ title: "Mens Singles Pro Qualifier",   round: "Round 64" },     "Pro Qualifiers", "Men's Singles"],
  [{ title: "Womens Doubles Pro Qualifier", round: "Quarter Finals" },"Pro Qualifiers", "Women's Doubles"],
  [{ title: "Mixed Doubles Pro Qualifier",  round: "Semi-Finals" },  "Pro Qualifiers", "Mixed Doubles"],
  [{ title: "Mens Doubles Pro Main Draw",   round: "Round 32" },     "Round 32",       "Men's Doubles"],
  [{ title: "Womens Singles Pro Main Draw", round: "Final" },        "Final",          "Women's Singles"],
  [{ title: "Mixed Doubles Pro Main Draw",  round: "Championship" }, "Championship",   "Mixed Doubles"],
  [{ title: "",                              round: "Round 16" },     "Round 16",       ""],
];

let pass = 0, fail = 0;
for (const [row, expLabel, expDiv] of CASES) {
  const qualifier = isQualifierRow(row.title);
  const label = roundLabel({ round: row.round, qualifier });
  const div = cleanDivision(row.title);
  const ok = label === expLabel && div === expDiv;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${(row.title || "(no title)").padEnd(30)} round=${row.round.padEnd(14)} → "${label}" / "${div}"` +
      (ok ? "" : `   expected "${expLabel}" / "${expDiv}"`),
  );
  ok ? pass++ : fail++;
}
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
