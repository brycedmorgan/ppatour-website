/**
 * Hannah Johns, 9/23: the 2020 Texas Open (Sep 30) is missing its Men's Doubles
 * podium — every other division is there. Her figures:
 *
 *   Gold   Ben Johns / Matt Wright
 *   Silver Tyson McGuffin / Riley Newman
 *   Bronze Steve Deakin / Joey Farias
 *
 * ⚠ THE ARCHIVE, NOT THE GENERATED FILE. `ppa_tournaments` starts in mid-2023,
 * so 2020 exists only in lib/data/tournament-history-archive.json, which
 * gen-tournament-history.mjs passes through untouched. Editing
 * tournament-history.json instead would be reverted by the next run.
 *
 * ⚠ Written at indent 1 with a trailing newline and CRLF endings, which is
 * byte-identical to the committed file — verified before writing, so the diff
 * is exactly this insertion and none of the other 115 records move.
 */
import { readFileSync, writeFileSync } from "node:fs";

const P = "lib/data/tournament-history-archive.json";
const raw = readFileSync(P, "utf8");
const crlf = /\r\n/.test(raw);
const doc = JSON.parse(raw);

// Guard: the serialization must round-trip before we change anything.
const reserialize = (d) => {
  const s = `${JSON.stringify(d, null, 1)}\n`;
  return crlf ? s.split("\n").join("\r\n") : s;
};
if (reserialize(doc) !== raw) {
  throw new Error("archive does not round-trip — refusing to write (would rewrite every line)");
}

const rec = doc.archive.find((t) => t.endDate === "2020-09-30" && t.name === "Texas Open");
if (!rec) throw new Error("2020-09-30 Texas Open not found");
if (rec.divisions.some((d) => d.division === "Men's Doubles")) {
  throw new Error("Men's Doubles already present — nothing to do");
}

const DIVISION_ORDER = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
];

rec.divisions.push({
  division: "Men's Doubles",
  champion: "Ben Johns / Matt Wright",
  runnerUp: "Tyson McGuffin / Riley Newman",
  third: "Steve Deakin / Joey Farias",
});
rec.divisions.sort(
  (a, b) => DIVISION_ORDER.indexOf(a.division) - DIVISION_ORDER.indexOf(b.division),
);

if (rec.divisions.length !== 5) throw new Error(`expected 5 divisions, got ${rec.divisions.length}`);
if (rec.divisions.some((d) => DIVISION_ORDER.indexOf(d.division) < 0)) {
  throw new Error("unknown division label after sort");
}

writeFileSync(P, reserialize(doc), "utf8");
console.log("2020 Texas Open now:", rec.divisions.map((d) => d.division).join(" | "));
