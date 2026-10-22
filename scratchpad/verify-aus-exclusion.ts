/**
 * Does the Australia-2025 correction land? Runs the real adapter against the
 * live API and prints the medal counts a profile page would show, beside the
 * raw endpoint numbers.
 *
 *   npx tsx scratchpad/verify-aus-exclusion.ts
 */
import { readFileSync } from "node:fs";
import { getAthleteStats } from "../lib/athlete-stats";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}



const base = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
const H = { "PB-API-TOKEN": process.env.PB_API_TOKEN as string };

/** Straight from the endpoint, with no correction applied. */
async function rawGold(slug: string) {
  const u = await fetch(`${base}/v1/data/users/${slug}?use_camel_case=true`, { headers: H });
  const uuid = (await u.json())?.result?.uuid;
  if (!uuid) return null;
  const m = await fetch(
    `${base}/v2/data/users/${uuid}/player_medals?partners=ppa,upa&scope_title=Pro`,
    { headers: H },
  );
  const j = await m.json();
  const d = (j?.result && typeof j.result === "object" && "GoldMedals" in j.result) ? j.result : j;
  return {
    gold: d.GoldMedals ?? 0,
    silver: d.SilverMedals ?? 0,
    bronze: d.BronzeMedals ?? 0,
    semis: d.Semifinalist ?? 0,
  };
}

// 15 medallists + two controls who were not at the event.
const CASES: Array<[string, string]> = [
  ["lacy-schneemann", "3 titles -> 1 (Hannah's stated check)"],
  ["vivian-glozman", "1 title -> 0"],
  ["kaitlyn-christian", "5 titles -> 4"],
  ["gabriel-tardio", "30 titles -> 28"],
  ["tyson-mcguffin", "titles -2"],
  ["jay-devilliers", "bronze -2, semis -2"],
  ["jessie-irvine", "silver -1, bronze -1"],
  ["allyce-jones", "silver -1, bronze -1"],
  ["quang-duong", "silver -1, bronze -1"],
  ["alix-truong", "bronze -1"],
  ["collin-johns", "bronze -1"],
  ["andie-dikosavljevic", "bronze -1"],
  ["cj-klinger", "silver -1 (UPPERCASE uuid case)"],
  ["somer-dalla-bona", "silver -1 (hyphenated surname)"],
  ["tyra-hurricane-black", "silver -1"],
  ["ben-johns", "CONTROL — not at this event, must not move"],
  ["anna-leigh-waters", "CONTROL — verified-gold floor must still apply"],
];

async function main() {
  let failures = 0;
  for (const [slug, note] of CASES) {
    const raw = await rawGold(slug);
    const s = await getAthleteStats(slug);
    if (!raw || !s?.medals) {
      console.log(`${slug.padEnd(22)} NO DATA`);
      failures += 1;
      continue;
    }
    const t = s.medals.total;
    const d = (a: number, b: number) => (a === b ? "  " : b < a ? ` -${a - b}` : ` +${b - a}`);
    console.log(
      `${slug.padEnd(22)} gold ${String(raw.gold).padStart(3)} -> ${String(t.gold).padStart(3)}${d(raw.gold, t.gold).padEnd(4)}` +
        `silver ${String(raw.silver).padStart(3)} -> ${String(t.silver).padStart(3)}${d(raw.silver, t.silver).padEnd(4)}` +
        `bronze ${String(raw.bronze).padStart(3)} -> ${String(t.bronze).padStart(3)}${d(raw.bronze, t.bronze).padEnd(4)}` +
        `semis ${String(raw.semis).padStart(3)} -> ${String(t.semifinals).padStart(3)}${d(raw.semis, t.semifinals).padEnd(4)}` +
        `| ${note}`,
    );
    // per-division sums must still add up to the total
    const sum = (k: "gold" | "silver" | "bronze") =>
      s.medals!.singles[k] + s.medals!.doubles[k] + s.medals!.mixed[k];
    if (sum("gold") > t.gold) {
      console.log(`    !! division golds ${sum("gold")} exceed total ${t.gold}`);
      failures += 1;
    }
    if (t.gold < 0 || t.silver < 0 || t.bronze < 0 || t.semifinals < 0) {
      console.log("    !! negative count");
      failures += 1;
    }
  }

  console.log(failures ? `\n${failures} PROBLEM(S)` : "\nno negative or inconsistent counts");

}

main();
