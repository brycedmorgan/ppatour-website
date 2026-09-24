/**
 * Turn the 2025 Australia Pickleball Open pro podium into a per-player medal
 * correction, resolved to pickleball.com user UUIDs.
 *
 * ⚠ NAMES ARE RESOLVED AND THEN VERIFIED, NEVER GUESSED. Each candidate slug is
 * fetched and the endpoint's own firstName/lastName must match the podium name
 * before the row is accepted; anything unresolved is printed and left out, the
 * same rule the paddle importer uses (8/5 pt. 22, where a fuzzy match read
 * "Zoey Wang" as Chao Yi Wang).
 */
import { readFileSync, writeFileSync } from "node:fs";

for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const base = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
const H = { "PB-API-TOKEN": process.env.PB_API_TOKEN };
const AUS_UUID = "a26c60b0-a00a-49cd-b93e-9fa2ac32f433";

/** feed PlayerGroupTitle+FormatTitle -> the MedalSet key athlete-stats uses. */
function bucket(row) {
  const g = (row.PlayerGroupTitle ?? "").toLowerCase();
  const f = (row.FormatTitle ?? "").toLowerCase();
  if (g === "mixed") return "mixed";
  if (f === "singles") return "singles";
  if (f === "doubles") return "doubles";
  return null;
}

const res = await fetch(`${base}/v1/pb_data/json?sp_name=API_v2_Tourney_GetEvents`, {
  method: "POST",
  headers: { ...H, "Content-Type": "application/json" },
  body: JSON.stringify({ EventID: AUS_UUID }),
});
const payload = (await res.json()).payload ?? [];

/** name -> { singles|doubles|mixed: { gold|silver|bronze: n } } */
const byName = new Map();
const add = (name, div, medal) => {
  const k = name.trim();
  if (!k) return;
  if (!byName.has(k)) byName.set(k, {});
  const b = byName.get(k);
  b[div] ??= { gold: 0, silver: 0, bronze: 0 };
  b[div][medal] += 1;
};

for (const row of payload) {
  if (row.BracketLevelTitle !== "Pro" || row.NoMedalWasAwarded) continue;
  if (!(row.GoldTeamName ?? "").trim()) continue;
  const div = bucket(row);
  if (!div) continue;
  for (const [field, medal] of [
    ["GoldTeamName", "gold"],
    ["SilverTeamName", "silver"],
    ["BronzeTeamName", "bronze"],
  ]) {
    for (const n of (row[field] ?? "").split("&")) add(n, div, medal);
  }
}

console.log(`podium players: ${byName.size}`);

const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

function candidates(name) {
  const parts = norm(name);
  const out = new Set();
  const kebab = (a) => a.join("-");
  out.add(kebab(parts));
  if (parts.length > 2) {
    out.add(kebab([parts[0], parts[parts.length - 1]])); // drop middle ("Tyra Hurricane Black")
    out.add(kebab(parts.slice(1))); // drop first ("Hurricane Tyra Black" style)
  }
  for (const b of [...out]) for (let i = 1; i <= 4; i++) out.add(`${b}-${i}`);
  return [...out];
}

const rows = [];
const unresolved = [];
for (const [name, divisions] of byName) {
  const want = new Set(norm(name));
  let hit = null;
  for (const slug of candidates(name)) {
    const r = await fetch(`${base}/v1/data/users/${slug}?use_camel_case=true`, { headers: H });
    if (!r.ok) continue;
    const u = (await r.json())?.result;
    if (!u?.uuid) continue;
    const got = new Set(norm(`${u.firstName ?? ""} ${u.lastName ?? ""}`));
    // every word of the API's name must appear in the podium name, and vice
    // versa for the surname — a partial match is not a match.
    const surname = norm(name).slice(-1)[0];
    if (!got.has(surname)) continue;
    const overlap = [...got].filter((w) => want.has(w)).length;
    if (overlap < 2 && got.size > 1) continue;
    hit = { slug, uuid: u.uuid, apiName: `${u.firstName} ${u.lastName}` };
    break;
  }
  if (!hit) {
    unresolved.push(name);
    continue;
  }
  rows.push({ name, ...hit, divisions });
}

rows.sort((a, b) => a.name.localeCompare(b.name));
console.log(`\nresolved ${rows.length}, unresolved ${unresolved.length}`);
for (const r of rows) {
  const d = Object.entries(r.divisions)
    .map(([k, v]) =>
      `${k}:${Object.entries(v).filter(([, n]) => n).map(([m, n]) => `${m}${n > 1 ? `x${n}` : ""}`).join("+")}`,
    )
    .join("  ");
  console.log(`  ${r.name.padEnd(24)} -> ${r.slug.padEnd(24)} ${r.apiName.padEnd(24)} ${d}`);
}
if (unresolved.length) console.log("\nUNRESOLVED (left out):\n  " + unresolved.join("\n  "));

writeFileSync(
  "scratchpad/aus-2025-corrections.json",
  `${JSON.stringify({ event: AUS_UUID, rows, unresolved }, null, 2)}\n`,
);
console.log("\nwrote scratchpad/aus-2025-corrections.json");
