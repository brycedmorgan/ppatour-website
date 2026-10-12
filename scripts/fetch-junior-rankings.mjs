/**
 * Pulls the 24 ranking tabs of Jake Weinbach's "2026 Junior PPA Points" sheet
 * and writes them in the markdown shape scripts/import-junior-rankings.mjs reads.
 *
 *   node scripts/fetch-junior-rankings.mjs /tmp/junior.md
 *   node scripts/import-junior-rankings.mjs /tmp/junior.md --updated "Oct 8, 2026" --check
 *
 * Works because the sheet was link-shared on 10/12. If it goes private again,
 * every request 401s and the old path (Drive connector export) is the fallback.
 *
 * ⚠ gviz answers a tab name it doesn't know with the FIRST tab, not an error,
 * so a renamed tab would silently publish the wrong board. Two guards: no two
 * tabs may come back identical here, and the importer then confirms each board
 * against the names already published.
 */
import { writeFileSync } from "node:fs";

const ID = "16Aw29vD15ITlDU1Q2hFxnfzy_gBMWOyz_m9sR8VeMcw";
// Exact tab names, in the importer's DIVISION_ORDER (two carry a trailing space).
const TABS = [
  "Boys Singles 12U", "Boys Singles 14U", "Boys Singles 16U", "Boys Singles 18U",
  "Girls Singles 12U ", "Girls Singles 14U", "Girls Singles 16U", "Girls Singles 18U",
  "Boys Doubles 12U", "Boys Doubles 14U", "Boys Doubles 16U ", "Boys Doubles 18U",
  "Girls Doubles 12U", "Girls Doubles 14U", "Girls Doubles 16U", "Girls Doubles 18U",
  "Boys Mixed Doubles 12U", "Boys Mixed Doubles 14U", "Boys Mixed Doubles 16U", "Boys Mixed Doubles 18U",
  "Girls Mixed Doubles 12U", "Girls Mixed Doubles 14U", "Girls Mixed Doubles 16U", "Girls Mixed Doubles 18U",
];

const parseCsv = (text) =>
  text.split(/\r?\n/).filter(Boolean).map((line) => {
    const out = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') q = false;
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out;
  });

const blocks = [];
const firstRows = new Set();
for (const tab of TABS) {
  const url = `https://docs.google.com/spreadsheets/d/${ID}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodeURIComponent(tab)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${tab}: HTTP ${res.status}`);
  const rows = parseCsv(await res.text()).filter((r) => /^\d+$/.test((r[0] ?? "").trim()) && (r[1] ?? "").trim());
  const sig = rows.map((r) => `${r[1].trim()}:${r[2].trim()}`).join("/");
  // A misspelt tab name returns the FIRST tab, not an error — catch duplicates here.
  if (firstRows.has(sig)) throw new Error(`${tab}: identical to an earlier tab — tab name did not match`);
  firstRows.add(sig);
  console.log(`${tab.trim().padEnd(24)} ${String(rows.length).padStart(4)} rows  top: ${rows.slice(0, 3).map((r) => r[1].trim()).join("/")}`);
  blocks.push(
    ["| Ranking | Name | Points | Age |", "| :-: | :-: | :-: | :-: |",
      ...rows.map((r) => `| ${r[0].trim()} | ${r[1].trim()} | ${r[2].trim()} | ${r[3].trim()} |`)].join("\n"),
  );
}
writeFileSync(process.argv[2], blocks.join("\n\n") + "\n");
console.log(`wrote ${process.argv[2]}`);
