/**
 * Audit the site's broadcast data against the production scheduling sheet.
 *
 *   node scripts/audit-tv-schedule.mjs            # pulls the live sheet
 *   node scripts/audit-tv-schedule.mjs local.csv  # or diff a saved export
 *
 * Two checks, both of which have failed in real life:
 *   1. lib/tv-schedule.ts (/watch + /watch/tv) vs the sheet, window by window.
 *   2. lib/broadcast.ts (per-event Watch tables) vs lib/tv-schedule.ts. These
 *      are two hand transcriptions of one sheet and they drift silently — on
 *      7/26 two events' TC windows disagreed, and until 8/18 two MLP rows were
 *      filed under the Virginia Beach Open.
 *
 * Exits 1 on any mismatch, so it can gate a sync. It reports rather than
 * rewrites: a window is a commercial commitment to a broadcast partner, and the
 * sheet's event names don't match the site's, so the join is by hand (EVENT_MAP).
 *
 * ⚠ The sheet is the source of truth for WINDOWS ONLY. Event names come from the
 * PPA feed (standing ruling, 8/3) — don't "fix" a name to match the sheet.
 */
import { readFileSync } from "node:fs";

const SHEET_ID = "1WKzm6SnjedJPGXsPpQYphhRsHhJaaZ3BK9ZOtnHAr08";
const SHEET_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

/**
 * Sheet event-header prefix → the site's event name in lib/tv-schedule.ts.
 * A sheet block with no entry here is ignored (the completed 2025/26 season,
 * the MLP regular season, studio shows). Add a row when a stop is published.
 */
const EVENT_MAP = {
  "PPA National Championships": "Veolia Pickleball National Championships",
  "PPA Arizona Open": "Veolia Arizona Open",
  "PPA Las Vegas Open": "Rate Las Vegas Open",
  "PPA Chicago Cup": "Veolia Chicago Cup",
  "PPA Virginia Beach Open": "Virginia Beach Open",
  "MLP Nations Cup": "MLP Cup",
  "PPA World Pickleball Championships": "Pickleball World Championships",
  "PPA Florida Open": "Proton Daytona Beach Open",
  // ⚠ The 8/13 sheet still calls this one "PPA Malibu Cup"; the tour renamed it
  // to the Showcase on 8/26. The KEY is the sheet's spelling and the VALUE is
  // ours, so this row is exactly where that mismatch is supposed to live —
  // don't "fix" the key until the sheet itself is reissued.
  "PPA Malibu Cup": "Veolia Malibu Showcase",
};

/** Channels the site models. CBS/FOX/MSG windows exist on the sheet but are not
 *  carried in lib/tv-schedule.ts, so they're skipped rather than reported. */
const MODELLED = ["PBTV", "Tennis Channel", "FS1", "FS2"];

const DOW = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };
const MON = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** "1PM ET - 9PM ET" → "1PM – 9PM" (the site's display form). */
function normWindow(raw) {
  const m = raw.trim().match(/^(.+?)\s*ET\s*-\s*(.+?)(?:\s*ET)?$/);
  return m ? `${m[1].trim()} – ${m[2].trim()}` : null;
}

/** Strip TS so the data modules can be imported without a build step. */
async function importTs(path, decls) {
  let src = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
  src = src
    .replace(/export type [\s\S]*?\n};\n/g, "")
    .replace(/\/\*\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/export function [\s\S]*$/, "");
  for (const [from, to] of decls) src = src.replace(from, to);
  return import("data:text/javascript," + encodeURIComponent(src));
}

// ---------------------------------------------------------------- read sheet
const arg = process.argv[2];
let csv;
if (arg) {
  csv = readFileSync(arg, "utf8");
  console.log(`sheet: ${arg}`);
} else {
  const res = await fetch(SHEET_CSV, { redirect: "follow" });
  if (!res.ok) {
    console.error(`Could not read the sheet (HTTP ${res.status}). It must be link-readable, or pass a saved CSV export as an argument.`);
    process.exit(2);
  }
  csv = await res.text();
  console.log("sheet: live export");
}
const rows = parseCsv(csv);
const asOf = (rows[0]?.[0] ?? "").match(/as of\s*([\d/]+)/i);
console.log(`sheet header: ${asOf ? `as of ${asOf[1]}` : "(no 'as of' date found)"}\n`);

const sheet = new Map();
let cur = null, date = null, dow = null;
for (const r of rows) {
  const a = (r[0] ?? "").trim();
  const isDate = /^\d{1,2}\/\d{1,2}$/.test(a);
  if (a && !isDate && !/^(DAYLIGHT|END OF|DATE)/i.test(a)) {
    const key = Object.keys(EVENT_MAP).find((k) => a.startsWith(`${k}:`));
    cur = key ? EVENT_MAP[key] : null;
    if (cur && !sheet.has(cur)) sheet.set(cur, []);
    date = dow = null;
    continue;
  }
  if (!cur) continue;
  if (isDate) {
    const [mo, d] = a.split("/").map(Number);
    date = `${MON[mo]} ${d}`;
    dow = DOW[(r[1] ?? "").trim()] ?? null;
  }
  const channel = (r[3] ?? "").trim();
  const window = normWindow(r[2] ?? "");
  if (!date || !window || !MODELLED.includes(channel)) continue;
  sheet.get(cur).push({ date, dow, channel, window, tape: (r[6] ?? "").trim() === "TAPE" });
}

// ----------------------------------------------------------- read site data
const tvMod = await importTs("lib/tv-schedule.ts", [
  [/export const tvSchedule: TvEvent\[\]/, "export const tvSchedule"],
]);
const site = tvMod.tvSchedule;
const bMod = await importTs("lib/broadcast.ts", [
  [/export const eventBroadcasts: Record<string, BroadcastSlot\[\]>/, "export const eventBroadcasts"],
]);
const broadcasts = bMod.eventBroadcasts;

// -------------------------------------------------------------------- check
let fails = 0;
const wKey = (w) => `${w.date} ${w.dow} · ${w.channel} · ${w.window}${w.tape ? " (TAPE)" : ""}`;

console.log("1. lib/tv-schedule.ts vs the sheet");
for (const [name, expected] of sheet) {
  const ev = site.find((e) => e.name === name);
  if (!ev) {
    fails++;
    console.log(`   ✗ ${name} — on the sheet, absent from lib/tv-schedule.ts`);
    continue;
  }
  const got = ev.days.flatMap((d) =>
    d.windows.map((w) => ({ date: d.date, dow: d.dow, channel: w.channel, window: w.window, tape: !!w.tape })),
  );
  const want = expected.map(wKey).sort();
  const have = got.map(wKey).sort();
  const missing = want.filter((x) => !have.includes(x));
  const extra = have.filter((x) => !want.includes(x));
  if (!missing.length && !extra.length) {
    console.log(`   ✓ ${name} — ${have.length} windows`);
  } else {
    fails++;
    console.log(`   ✗ ${name}`);
    missing.forEach((x) => console.log(`       sheet has, site is missing:  ${x}`));
    extra.forEach((x) => console.log(`       site has, sheet dropped:     ${x}`));
  }
}
for (const ev of site) {
  if (!sheet.has(ev.name)) {
    console.log(`   – ${ev.name} — not on this sheet (add to EVENT_MAP if it should be)`);
  }
}

console.log("\n2. lib/broadcast.ts vs lib/tv-schedule.ts (lockstep)");
const bWindow = (w) => {
  const m = w.match(/^(.+?)\s*ET\s*-\s*(.+?)\s*ET$/);
  return m ? `${m[1].trim()} – ${m[2].trim()}` : w;
};
const bKey = (channel, window, tape) => `${channel} · ${window}${tape ? " (TAPE)" : ""}`;
for (const ev of site) {
  if (!ev.slug) continue;
  const slots = broadcasts[ev.slug];
  if (!slots) {
    console.log(`   – ${ev.slug} — no entry; its event page renders the templated table`);
    continue;
  }
  const have = slots
    .filter((s) => MODELLED.includes(s.platform))
    .map((s) => bKey(s.platform, bWindow(s.window), s.type === "TAPE"))
    .sort();
  const want = ev.days
    .flatMap((d) => d.windows.map((w) => bKey(w.channel, w.window, !!w.tape)))
    .sort();
  const missing = want.filter((x) => !have.includes(x));
  const extra = have.filter((x) => !want.includes(x));
  if (!missing.length && !extra.length) {
    console.log(`   ✓ ${ev.slug} — ${have.length} slots agree`);
  } else {
    fails++;
    console.log(`   ✗ ${ev.slug} — the two files disagree`);
    missing.forEach((x) => console.log(`       tv-schedule has, broadcast is missing: ${x}`));
    extra.forEach((x) => console.log(`       broadcast has, tv-schedule is missing: ${x}`));
  }
}

console.log(
  fails
    ? `\n${fails} mismatch(es). Reconcile BOTH files — /watch and the event pages read different ones.`
    : "\nAll checks pass: both files match the sheet and each other.",
);
process.exitCode = fails ? 1 : 0;
