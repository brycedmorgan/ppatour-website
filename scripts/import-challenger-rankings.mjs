/**
 * Challenger Series leaderboard importer.
 *
 *   node scripts/import-challenger-rankings.mjs <workbook.xlsx>           # report only
 *   node scripts/import-challenger-rankings.mjs <workbook.xlsx> --write   # rewrite the JSON
 *
 * Source: Jacob Guidry's Google Sheet "(UPDATED) CHALLENGER TOUR POINTS 2026
 * SEASON", exported as .xlsx (File → Download → Microsoft Excel, or the Drive
 * connector's export). Output: lib/data/challenger-rankings.json, which is all
 * /tour/challenger reads. Nothing refreshes it on its own — see
 * docs/CHALLENGER.md §7.
 *
 * ⚠ THE PUBLISHED RANK IS COMPUTED FROM POINTS, NOT COPIED FROM THE SHEET'S
 * RANK COLUMN. The sheet is maintained by hand and its rank column drifts —
 * the 9/26 revision listed Men's Singles No. 2 above No. 1, repeated ranks on
 * different point totals and skipped others. The points are the source of
 * truth: rows are ordered by points, sheet order breaks ties, and the rank is
 * the position — the sheet's own convention (four players on 100 are 28, 29,
 * 30, 31 there, not 28, 28, 28, 28). Every row whose rank differs is printed,
 * so a human can see exactly what the page will say that the sheet does not.
 *
 * It refuses rather than guesses: an unknown tab, a non-numeric points cell, a
 * duplicate name inside a division or an empty board all collect as problems,
 * and `--write` exits 1 if any survive. Division labels are read out of the
 * existing JSON, so the picker and search keep working.
 *
 * No dependencies: an .xlsx is a zip of XML, read with node:zlib.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

const [, , xlsxPath, ...flags] = process.argv;
const WRITE = flags.includes("--write");
const OUT = new URL("../lib/data/challenger-rankings.json", import.meta.url);

if (!xlsxPath) {
  console.error("usage: node scripts/import-challenger-rankings.mjs <workbook.xlsx> [--write]");
  process.exit(2);
}

/** Minimal zip reader: central directory → { name: Buffer }. */
function unzip(buf) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("not a zip file");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = {};
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    const lName = buf.readUInt16LE(local + 26);
    const lExtra = buf.readUInt16LE(local + 28);
    const data = buf.subarray(local + 30 + lName + lExtra, local + 30 + lName + lExtra + size);
    files[name] = method === 0 ? data : inflateRawSync(data);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const decode = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");

const files = unzip(readFileSync(xlsxPath));
const text = (n) => files[n]?.toString("utf8") ?? "";

const shared = [...text("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
  decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")),
);

const rels = Object.fromEntries(
  [...text("xl/_rels/workbook.xml.rels").matchAll(/<Relationship [^>]*>/g)].map((m) => [
    /Id="([^"]+)"/.exec(m[0])[1],
    /Target="([^"]+)"/.exec(m[0])[1].replace(/^\/?(xl\/)?/, "xl/"),
  ]),
);
const sheets = [...text("xl/workbook.xml").matchAll(/<sheet [^>]*>/g)].map((m) => ({
  name: decode(/name="([^"]+)"/.exec(m[0])[1]),
  path: rels[/r:id="([^"]+)"/.exec(m[0])[1]],
}));

/** Rows of a sheet as arrays of cell strings, by column letter A.. */
function readSheet(path) {
  const rows = [];
  for (const r of text(path).matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const c of r[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = /r="([A-Z]+)\d+"/.exec(c[1])[1];
      const col = ref.split("").reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
      const type = /t="([^"]+)"/.exec(c[1])?.[1];
      const body = c[2] ?? "";
      let v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
      if (type === "s" && v != null) v = shared[Number(v)];
      else if (type === "inlineStr") v = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("");
      row[col] = v == null ? "" : decode(String(v)).trim();
    }
    rows.push(row);
  }
  return rows;
}

const TAB_TO_LABEL = {
  "WOMENS SINGLES": "Women's Singles",
  "WOMENS DOUBLES": "Women's Doubles",
  "MENS SINGLES": "Men's Singles",
  "MENS DOUBLES": "Men's Doubles",
  MIXED: "Mixed Doubles",
};

const existing = JSON.parse(readFileSync(OUT, "utf8"));
const knownLabels = new Set(existing.divisions.map((d) => d.label));
const problems = [];
const divisions = [];

for (const sheet of sheets) {
  const label = TAB_TO_LABEL[sheet.name];
  if (!label) {
    problems.push(`unknown tab "${sheet.name}"`);
    continue;
  }
  if (!knownLabels.has(label)) problems.push(`label "${label}" is not in the existing JSON`);

  const raw = readSheet(sheet.path);
  const header = raw.findIndex((r) => /PLAYER/i.test(r[1] ?? ""));
  const entries = [];
  const seen = new Set();
  for (const r of raw.slice(header + 1)) {
    const name = (r[1] ?? "").replace(/\s+/g, " ").trim();
    const pointsCell = (r[3] ?? "").trim();
    if (!name && !pointsCell) continue;
    if (!name) {
      problems.push(`${label}: points "${pointsCell}" with no name`);
      continue;
    }
    // A trailing "*" on a points cell is a hand annotation, not part of the number.
    const points = Number(pointsCell.replace(/\*+$/, ""));
    if (!Number.isFinite(points) || pointsCell === "") {
      problems.push(`${label}: ${name} has non-numeric points "${pointsCell}"`);
      continue;
    }
    // "450.0" is just how the export stores a number; only flag real annotations.
    if (/[^\d.]/.test(pointsCell)) problems.push(`${label}: ${name} points "${pointsCell}" read as ${points} (note only)`);
    const key = name.toLowerCase();
    if (seen.has(key)) {
      problems.push(`${label}: duplicate name ${name}`);
      continue;
    }
    seen.add(key);
    entries.push({ name, points, sheetRank: Number(r[0]) || null, order: entries.length });
  }
  if (entries.length === 0) problems.push(`${label}: empty board`);

  entries.sort((a, b) => b.points - a.points || a.order - b.order);
  const rows = entries.map((e, i) => ({ ...e, rank: i + 1 }));

  const moved = rows.filter((e) => e.sheetRank !== e.rank);
  const old = existing.divisions.find((d) => d.label === label);
  console.log(
    `\n${label}: ${rows.length} rows (was ${old?.rows.length ?? 0}) · leader ${rows[0]?.name} ${rows[0]?.points} · ${moved.length} rows ranked differently from the sheet's rank column`,
  );
  for (const e of moved.slice(0, 25)) console.log(`   sheet ${String(e.sheetRank).padStart(4)} → page ${String(e.rank).padStart(4)}  ${e.name} (${e.points})`);
  if (moved.length > 25) console.log(`   … and ${moved.length - 25} more`);

  divisions.push({ label, rows: rows.map((e) => [e.rank, e.name, e.points]) });
}

const hard = problems.filter((p) => !p.endsWith("(note only)"));
if (problems.length) {
  console.log(`\nProblems (${hard.length} blocking):`);
  for (const p of problems) console.log("  - " + p);
}

if (WRITE) {
  if (hard.length) {
    console.error("\nRefusing to write: fix the blocking problems above.");
    process.exit(1);
  }
  const updated = flags.find((f) => f.startsWith("--updated="))?.slice(10);
  if (!updated) {
    console.error('\n--write needs --updated="Month D, YYYY" (the date the page prints).');
    process.exit(1);
  }
  const order = existing.divisions.map((d) => d.label);
  divisions.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  const source =
    `Google Sheet "(UPDATED) CHALLENGER TOUR POINTS 2026 SEASON" (Jacob Guidry), ` +
    `imported ${new Date().toISOString().slice(0, 10)} with scripts/import-challenger-rankings.mjs; rank = position by points`;
  const out = { ...existing, updated, source, divisions };
  const json = JSON.stringify(out, null, 1) + "\n";
  const raw = readFileSync(OUT, "utf8");
  writeFileSync(OUT, raw.includes("\r\n") ? json.replace(/\n/g, "\r\n") : json);
  console.log(`\nWrote ${divisions.reduce((n, d) => n + d.rows.length, 0)} rows → lib/data/challenger-rankings.json (updated: ${updated})`);
}
