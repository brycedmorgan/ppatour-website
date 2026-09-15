/**
 * Junior PPA rankings importer — Jake Weinbach's "2026 Junior PPA Points"
 * sheet -> lib/data/junior-rankings.json.
 *
 *   node scripts/import-junior-rankings.mjs <export.md> --updated "Sep 14, 2026"
 *   node scripts/import-junior-rankings.mjs <export.md> --updated "..." --check
 *
 * ⚠ THE SHEET IS NOT PUBLICLY READABLE, so unlike scripts/audit-tv-schedule.mjs
 * this cannot pull it live — `export?format=csv` returns 401. The refresh path
 * is: read the sheet through the Google Drive connector, save the markdown it
 * returns, and point this script at that file. If Daniela or Jake ever set the
 * sheet to "anyone with the link can view", this becomes a live fetch and the
 * manual step disappears.
 *
 * ⚠ THE EXPORT CARRIES NO TAB NAMES — every non-blank line is a table row, so
 * there is nothing in the file that says which board is which. Twenty-four
 * ranking tables arrive in a fixed order and that order is the ONLY structural
 * signal. Assigning divisions positionally and hoping is exactly how girls'
 * data ends up published under a boys' heading, so the position is treated as a
 * PROPOSAL that must then be CONFIRMED against data we already trust:
 *
 *   1. There must be exactly 24 ranking tables. Fewer or more throws.
 *   2. Each table's names are compared against all 24 divisions of the existing
 *      junior-rankings.json. The best-matching division MUST be the one the
 *      position proposes, or the import throws. Measured on the 9/15 import,
 *      every block matched its assigned division at 81-100% while the runner-up
 *      sat far below, so this is a wide margin rather than a coin flip.
 *   3. Ages are checked against the bracket as a WARNING, not an error — the
 *      9/15 sheet has a 15-year-old in a 14U board, which is the event team's
 *      business and not a reason to refuse an import.
 *   4. A board that arrives with under half the rows we already hold throws,
 *      so a truncated or half-loaded export cannot quietly shrink the site.
 *
 * ⚠ AND THE SHEET IS ORDERED U12 -> U18 WHERE THE SITE READS 18U -> 12U. The
 * groups of four ascend by age; the site's own division list descends. Mapping
 * one onto the other without noticing publishes the under-12 board as the
 * under-18 one. That reversal is the single most dangerous thing in this file
 * and it is why DIVISION_ORDER below is written out in full rather than
 * generated from the site's list.
 */
import { readFileSync, writeFileSync } from "node:fs";

const OUT = "lib/data/junior-rankings.json";

/**
 * The 24 ranking tables in the order the sheet emits them: three disciplines,
 * each boys-then-girls, each ascending 12U -> 18U. Written out in full, in the
 * SHEET's order, so the ascending/descending mismatch with the site is visible
 * here rather than hidden in an index calculation.
 */
const DIVISION_ORDER = [
  "Boys Singles 12U", "Boys Singles 14U", "Boys Singles 16U", "Boys Singles 18U",
  "Girls Singles 12U", "Girls Singles 14U", "Girls Singles 16U", "Girls Singles 18U",
  "Boys Doubles 12U", "Boys Doubles 14U", "Boys Doubles 16U", "Boys Doubles 18U",
  "Girls Doubles 12U", "Girls Doubles 14U", "Girls Doubles 16U", "Girls Doubles 18U",
  "Boys Mixed Doubles 12U", "Boys Mixed Doubles 14U", "Boys Mixed Doubles 16U", "Boys Mixed Doubles 18U",
  "Girls Mixed Doubles 12U", "Girls Mixed Doubles 14U", "Girls Mixed Doubles 16U", "Girls Mixed Doubles 18U",
];

/** The order the site renders them in — what we write out. */
const SITE_ORDER = [
  "Boys Singles 18U", "Boys Singles 16U", "Boys Singles 14U", "Boys Singles 12U",
  "Girls Singles 18U", "Girls Singles 16U", "Girls Singles 14U", "Girls Singles 12U",
  "Boys Doubles 18U", "Boys Doubles 16U", "Boys Doubles 14U", "Boys Doubles 12U",
  "Girls Doubles 18U", "Girls Doubles 16U", "Girls Doubles 14U", "Girls Doubles 12U",
  "Boys Mixed Doubles 18U", "Boys Mixed Doubles 16U", "Boys Mixed Doubles 14U", "Boys Mixed Doubles 12U",
  "Girls Mixed Doubles 18U", "Girls Mixed Doubles 16U", "Girls Mixed Doubles 14U", "Girls Mixed Doubles 12U",
];

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const updated = args[args.indexOf("--updated") + 1];
const checkOnly = args.includes("--check");
if (!file || !updated || updated.startsWith("--")) {
  console.error('usage: node scripts/import-junior-rankings.mjs <export.md> --updated "Sep 14, 2026" [--check]');
  process.exit(2);
}

const cells = (line) => line.split("|").map((s) => s.trim()).slice(1, -1);
const norm = (s) => s.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
const bracketOf = (label) => Number(/(\d+)U$/.exec(label)[1]);

const raw = readFileSync(file, "utf8");
const blocks = raw
  .split(/\n\s*\n/)
  .map((b) => b.split("\n").filter((l) => l.trim()))
  .filter((b) => b.length);

/**
 * A ranking table is one that carries a `Ranking | Name | Points | Age` header.
 *
 * ⚠ THE HEADER IS NOT THE FIRST LINE. The export opens each table with an empty
 * row and a markdown alignment row, so the real header sits at index 2 — this
 * scans the opening lines rather than assuming a position, since an export that
 * drops the blank row would otherwise silently match nothing and look like "the
 * sheet has no rankings in it", which is exactly what it looked like at first.
 */
const boards = blocks.filter((b) =>
  b.slice(0, 5).some((line) => {
    const h = cells(line).map((c) => c.toLowerCase());
    return h[0] === "ranking" && h[1] === "name" && h[2] === "points" && h[3] === "age";
  }),
);

if (boards.length !== DIVISION_ORDER.length) {
  throw new Error(
    `Expected ${DIVISION_ORDER.length} ranking tables, found ${boards.length}. The sheet's shape changed — ` +
      `re-derive the mapping by hand before touching DIVISION_ORDER.`,
  );
}

const prev = JSON.parse(readFileSync(OUT, "utf8"));
const prevByLabel = new Map(prev.divisions.map((d) => [d.label, new Set(d.rows.map((r) => norm(r[1])))]));

const parsed = new Map();
const warnings = [];

boards.forEach((b, i) => {
  const label = DIVISION_ORDER[i];
  const rows = b
    .map(cells)
    .filter((r) => r.length >= 4 && /^\d+$/.test(r[0]) && r[1])
    .map((r) => [Number(r[0]), r[1].replace(/\s+/g, " ").trim(), Number(String(r[2]).replace(/,/g, "")), Number(r[3])])
    .filter((r) => Number.isFinite(r[2]) && Number.isFinite(r[3]));

  if (!rows.length) throw new Error(`Table ${i} (${label}) parsed to zero rows.`);

  // GUARD 2 — the position's proposal must be confirmed by the names themselves.
  const names = new Set(rows.map((r) => norm(r[1])));
  const scored = [...prevByLabel.entries()]
    .map(([l, set]) => {
      let hit = 0;
      for (const n of names) if (set.has(n)) hit += 1;
      return { label: l, pct: hit / names.size };
    })
    .sort((a, b2) => b2.pct - a.pct);
  if (scored[0].label !== label) {
    const assigned = scored.find((s) => s.label === label);
    throw new Error(
      `Table ${i} was assigned "${label}" by position, but its players best match ` +
        `"${scored[0].label}" (${(scored[0].pct * 100).toFixed(0)}% against ` +
        `${((assigned?.pct ?? 0) * 100).toFixed(0)}% for the assigned division). ` +
        `The sheet's tab order has changed — fix DIVISION_ORDER, do not override this check.`,
    );
  }

  // GUARD 3 — ages, as a warning only.
  const over = rows.filter((r) => r[3] > bracketOf(label));
  if (over.length) {
    warnings.push(`${label}: ${over.length} player(s) above the bracket age (${over.map((r) => `${r[1]} ${r[3]}`).join(", ")})`);
  }

  // GUARD 4 — refuse a board that has collapsed.
  const before = prevByLabel.get(label)?.size ?? 0;
  if (before && rows.length < before * 0.5) {
    throw new Error(`${label}: ${rows.length} rows against ${before} already published — refusing to halve a board.`);
  }

  parsed.set(label, { label, rows, match: scored[0].pct, before });
});

console.log(`parsed ${parsed.size} divisions from ${file}\n`);
let total = 0;
for (const label of SITE_ORDER) {
  const d = parsed.get(label);
  total += d.rows.length;
  const delta = d.rows.length - d.before;
  console.log(
    `  ${label.padEnd(26)} ${String(d.rows.length).padStart(4)} rows  (${delta >= 0 ? "+" : ""}${delta})  ` +
      `confirmed ${(d.match * 100).toFixed(0)}%`,
  );
}
console.log(`\n  total ${total} rows`);
if (warnings.length) {
  console.log("\nwarnings (not fatal):");
  for (const w of warnings) console.log("  ! " + w);
}

if (checkOnly) {
  console.log("\n--check: nothing written.");
  process.exit(0);
}

writeFileSync(
  OUT,
  `${JSON.stringify(
    {
      updated,
      source: "2026 Junior PPA Points (Jake Weinbach) — supplied by Daniela Almendarez",
      divisions: SITE_ORDER.map((l) => ({ label: l, rows: parsed.get(l).rows })),
    },
    null,
    2,
  )}\n`,
);
console.log(`\nwrote ${OUT}`);
