/**
 * Broadcast paddle masterlist → `lib/data/athlete-paddles.json`.
 *
 *   node scripts/import-paddles.mjs            # write the JSON
 *   node scripts/import-paddles.mjs --report   # resolve + print, write nothing
 *
 * SOURCE OF TRUTH IS `lib/data/broadcast-paddles.csv` — the event team's
 * "Pro Paddles Broadcast - Masterlist". A pro who is not in that file gets NO
 * paddle on the site (Wesley, 8/5). That is the whole point of this importer:
 * before it, the paddle came from the 2024 profile scrape
 * (`published-athletes.json` → `quick_info.paddle`), which nobody maintains.
 *
 * ⚠ NAMES IN THE MASTERLIST DO NOT MATCH OUR ROSTER, AND THAT IS THE HARD PART.
 * It carries misspellings ("Federico Stakstrud", "Ella Cosmos"), short forms
 * ("Augie Ge" for Augustus Ge, "L.W. Kong" for Lingwei Kong), and rows that are
 * a surname alone ("Caruso", "Bhatia"). So resolution is deliberately
 * conservative and every rule below refuses rather than guesses:
 *
 *   1. an explicit alias, when a human has verified the pair
 *   2. an exact name match
 *   3. a misspelling — edit distance ≤ 2, and only when ONE candidate is
 *      strictly closer than the next
 *   4. a surname, and only when exactly one athlete can own it
 *
 * ⚠ AMBIGUITY IS LEFT ALONE, per the 8/5 duplicate-profile ruling. "Bhatia"
 * could be Armaan or Aryaan; "M. Alhouni" could be Mohaned or Mota. Publishing
 * a paddle endorsement on the wrong brother is worse than publishing none, and
 * these are commercial relationships. Unresolved rows are PRINTED, never
 * silently dropped — hand the list back to the event team and the fix is a
 * fuller name in the CSV, not code.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = join(ROOT, "lib/data/broadcast-paddles.csv");
const OUT = join(ROOT, "lib/data/athlete-paddles.json");
const REPORT_ONLY = process.argv.includes("--report");

/**
 * Verified by hand, because no rule can derive them.
 * Add a line here only when you are certain the two names are one person.
 */
const ALIASES = {
  // Empty by design. The one case that needed it — the masterlist's "Tyra
  // Black" against the scrape's "Hurricane Tyra Black" — is handled properly by
  // reading CURATED_TO_CANONICAL below, which is the repo's own mapping and
  // cannot drift from it. Add a line here only for a pair no rule can derive.
};

/**
 * ⚠ ONLY OFFICIAL-PARTNER BRANDS ARE RE-SPELLED, AND FOR A FUNCTIONAL REASON:
 * `lib/athlete-gear.ts` matches the paddle string against the live `partners`
 * roster to decide whether to print "Official Partner of the PPA Tour", and it
 * matches on the partner's own name. The CSV writes "SixZero"; the partner is
 * "Six Zero", so left alone those four pros would silently lose the badge.
 * Everything else keeps the event team's spelling verbatim.
 */
const BRAND_DISPLAY = {
  joola: "JOOLA",
  sixzero: "Six Zero",
  "six zero": "Six Zero",
  proton: "Proton",
  // The CSV itself spells this one both ways; unify on the majority spelling.
  "11six24": "11SIX24",
};

/* ---------------- csv ---------------- */

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim()));
}

/* ---------------- roster ---------------- */

const norm = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();

/**
 * The site publishes a profile from TWO rosters and a page is keyed by whichever
 * slug its route uses, so both have to be in here or a curated-only pro (Jay
 * Devilliers, Dekel Bar) would resolve to nothing and lose a paddle he has.
 */
function loadRoster() {
  const published = JSON.parse(readFileSync(join(ROOT, "lib/data/published-athletes.json"), "utf8"));
  const src = readFileSync(join(ROOT, "lib/athletes.ts"), "utf8");
  const curated = [...src.matchAll(/slug:\s*"([^"]+)",\s*\n\s*name:\s*"([^"]+)"/g)]
    .map((m) => ({ slug: m[1], name: m[2] }));

  // ⚠ A regex over a TS file is brittle by nature, so it fails LOUDLY rather
  // than quietly returning fewer pros — a silent drop here would look exactly
  // like "that player isn't in the CSV".
  if (curated.length < 30) {
    throw new Error(
      `lib/athletes.ts: parsed only ${curated.length} curated athletes (expected 40+). ` +
      `The file's shape changed — fix this regex before trusting the output.`,
    );
  }

  /**
   * ⚠ ONE PRO CAN HOLD TWO SLUGS, AND BOTH RENDER A PAGE. The curated roster
   * keys Augustus Ge as `augie-ge` and Gabriel Tardio as `gabe-tardio`, while
   * the scrape keys them `augustus-ge` and `gabriel-tardio` — and
   * `generateStaticParams` builds from both sets. So a person is a GROUP of
   * slugs here, and the paddle is written against every slug in the group;
   * keying only one would leave the other page bare for no visible reason.
   *
   * Grouping is by name and only ACROSS the two rosters. Two same-name entries
   * within one roster would be two different people (the board carries two Ben
   * Johnses), and that is ambiguity, not a duplicate.
   */
  const groups = new Map();
  const add = (name, slug, isCurated) => {
    const key = norm(name);
    if (!groups.has(key)) groups.set(key, { name, names: [], slugs: [], sources: new Set() });
    const g = groups.get(key);
    if (g.sources.has(isCurated ? "curated" : "published")) {
      g.duplicateWithinRoster = true; // two distinct people sharing a name
      return;
    }
    g.sources.add(isCurated ? "curated" : "published");
    if (!g.names.includes(name)) g.names.push(name);
    // The two rosters usually agree on the slug; only the handful that don't
    // (augie-ge / augustus-ge) produce a second one.
    if (!g.slugs.includes(slug)) g.slugs.push(slug);
  };
  for (const c of curated) add(c.name, c.slug, true);
  for (const p of published) add(p.name, p.slug, false);

  /**
   * ⚠ NAME GROUPING ALONE MISSES THE PROS THE TWO ROSTERS SPELL DIFFERENTLY.
   * The curated roster calls her Tyra Black; the scrape calls her Hurricane
   * Tyra Black — different names, so two groups, and her page (`/athletes/
   * tyra-black`) would have come out bare while `hurricane-tyra-black` carried
   * the paddle. `CURATED_TO_CANONICAL` in lib/published-athletes.ts is the
   * repo's existing answer to precisely this, so read it rather than keeping a
   * second list here that can drift from it. Same for Paris/Parris Todd and
   * Megan/Meghan Dizon.
   */
  const mapSrc = readFileSync(join(ROOT, "lib/published-athletes.ts"), "utf8");
  const block = mapSrc.match(/CURATED_TO_CANONICAL[^{]*\{([^}]*)\}/);
  const pairs = block ? [...block[1].matchAll(/"([^"]+)":\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]) : [];
  if (pairs.length < 3) {
    throw new Error(
      `lib/published-athletes.ts: parsed ${pairs.length} CURATED_TO_CANONICAL pairs (expected 5). ` +
      `Fix this parse — without it, pros the two rosters name differently lose their paddle on one of their two pages.`,
    );
  }

  const groupOf = (slug) => [...groups.values()].find((g) => g.slugs.includes(slug));
  for (const [curatedSlug, canonicalSlug] of pairs) {
    const a = groupOf(curatedSlug);
    const b = groupOf(canonicalSlug);
    if (!a || !b || a === b) continue;
    for (const s of b.slugs) if (!a.slugs.includes(s)) a.slugs.push(s);
    for (const n of b.names) if (!a.names.includes(n)) a.names.push(n);
    a.duplicateWithinRoster ||= b.duplicateWithinRoster;
    groups.delete(norm(b.name));
  }

  return {
    roster: [...groups.values()],
    curatedCount: curated.length,
    publishedCount: published.length,
    aliasPairs: pairs.length,
  };
}

function lev(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

/* ---------------- resolve ---------------- */

function buildResolver(roster) {
  // Indexed under EVERY name the person is known by, so a merged pro resolves
  // from either roster's spelling ("Tyra Black" and "Hurricane Tyra Black").
  const byName = new Map();
  const bySurname = new Map();
  for (const a of roster) {
    for (const name of a.names) {
      const n = norm(name);
      if (!byName.has(n)) byName.set(n, []);
      if (!byName.get(n).includes(a)) byName.get(n).push(a);
      const last = n.split(" ").at(-1);
      if (!bySurname.has(last)) bySurname.set(last, []);
      if (!bySurname.get(last).includes(a)) bySurname.get(last).push(a);
    }
  }

  /**
   * Do two given-name tokens plausibly denote the same person?
   *
   * ⚠ A SHARED FIRST LETTER IS NOT ENOUGH — that would read "Zoey Wang" as
   * "Chao Yi Wang"'s row. The masterlist uses short forms (Gabe/Gabriel,
   * Augie/Augustus, Chris/Christopher, Greg/Gregory), which is a shared PREFIX,
   * so that is what this tests. Three characters is the floor; below it "Jo"
   * would tie Joel to John. Initials are handled separately, and only when the
   * surname already narrows to one person.
   */
  const firstNameOk = (csvFirst, rosterFirst) => {
    if (!csvFirst || csvFirst === rosterFirst) return true;
    let shared = 0;
    while (shared < csvFirst.length && shared < rosterFirst.length && csvFirst[shared] === rosterFirst[shared]) shared++;
    if (shared >= 3) return true;
    // "L.W. Kong" → "lw" vs "lingwei"; "G. Morelli" → "g".
    return csvFirst.length <= 2 && rosterFirst.startsWith(csvFirst[0]);
  };

  return function resolve(rawName) {
    const n = norm(rawName);

    const alias = ALIASES[n];
    if (alias) {
      const hit = roster.find((a) => a.slugs.includes(alias));
      return hit ? { athlete: hit, how: "alias" } : { reason: `alias target "${alias}" is not on the roster` };
    }

    const exact = byName.get(n);
    if (exact?.length === 1) {
      if (exact[0].duplicateWithinRoster)
        return { reason: `AMBIGUOUS: two different athletes are named "${exact[0].name}"` };
      return { athlete: exact[0], how: "exact" };
    }
    if (exact?.length > 1) return { reason: `AMBIGUOUS: ${exact.length} roster entries named "${rawName}"` };

    // Misspelling. Guarded: same opening letter, long enough that a distance of
    // 2 is a typo rather than a different person, and a clear winner.
    if (n.length >= 8) {
      const near = [];
      for (const a of roster) {
        let best = Infinity;
        for (const nm of a.names) {
          const nn = norm(nm);
          if (nn[0] !== n[0]) continue;
          best = Math.min(best, lev(n, nn));
        }
        if (best <= 2) near.push({ a, d: best });
      }
      near.sort((x, y) => x.d - y.d);
      if (near.length && (near.length === 1 || near[0].d < near[1].d))
        return { athlete: near[0].a, how: `misspelling (distance ${near[0].d})` };
      if (near.length > 1)
        return { reason: `AMBIGUOUS misspelling: ${near.map((x) => x.a.name).join(", ")}` };
    }

    // Surname, with or without a given name in front of it.
    const toks = n.split(" ");
    const last = toks.at(-1);
    const first = toks.length > 1 ? toks[0] : null;
    const anyFirstOk = (g) => g.names.some((nm) => firstNameOk(first, norm(nm).split(" ")[0]));
    const cands = bySurname.get(last) ?? [];
    if (cands.length === 1) {
      if (anyFirstOk(cands[0])) return { athlete: cands[0], how: first ? "surname + given name" : "surname only" };
      return { reason: `surname "${last}" matches ${cands[0].name}, but the given names disagree` };
    }
    if (cands.length > 1) {
      const narrowed = cands.filter(anyFirstOk);
      if (narrowed.length === 1) return { athlete: narrowed[0], how: "surname + given name" };
      return { reason: `surname "${last}" is shared by ${cands.length}: ${cands.map((c) => c.name).join(", ")}` };
    }

    return { reason: "no athlete on either roster matches this name" };
  };
}

/* ---------------- run ---------------- */

const { roster, curatedCount, publishedCount } = loadRoster();
const resolve = buildResolver(roster);
const rows = parseCsv(readFileSync(CSV, "utf8"));
const header = rows.shift();
if (norm(header[0]) !== "name") throw new Error(`Unexpected CSV header: ${header.join(",")}`);

const entries = new Map();     // slug -> record
const conflicts = new Map();   // slug -> [display, display]
const unresolved = [];
const blank = [];
const matched = [];

for (const r of rows) {
  const [rawName, mfr, model] = r.map((f) => (f ?? "").trim());
  if (!rawName) continue;

  // A row with no paddle is not a paddle. Lindsey Newman is in the masterlist
  // with every equipment column empty; she gets nothing, same as an absent pro.
  if (!mfr || !model) { blank.push(rawName); continue; }

  const res = resolve(rawName);
  if (!res.athlete) { unresolved.push([rawName, `${mfr} ${model}`, res.reason]); continue; }

  const brand = BRAND_DISPLAY[mfr.toLowerCase()] ?? mfr;
  /**
   * ⚠ Some model cells already carry the brand. Rachel Rohrabacher's reads
   * "Friday Fever 102E" under manufacturer "Friday", and prepending blindly
   * published "Friday Friday Fever 102E" on her profile. Only skip the prefix
   * when the model genuinely STARTS with the brand — "Selkirk" inside a model
   * name later on must not swallow it.
   */
  const modelHasBrand = norm(model).startsWith(norm(brand) + " ") || norm(model) === norm(brand);
  const paddle = (modelHasBrand ? model : `${brand} ${model}`).replace(/\s+/g, " ").trim();
  /**
   * ⚠ The retail search term is NOT always the display string. One row lists two
   * paddles in a single cell ("TORNAZO, PRO-BLADE 2"), and searching Pickleball
   * Central for both at once returns nothing — a "Buy This Paddle" button that
   * finds no product is worse than a narrower search. Display stays verbatim.
   */
  const firstModel = model.split(",")[0];
  const searchTerm = (modelHasBrand ? firstModel : `${brand} ${firstModel}`).replace(/\s+/g, " ").trim();

  const key = res.athlete.slugs[0];
  const prior = entries.get(key);
  if (prior && prior.paddle !== paddle) {
    // Two rows, two different paddles, no way to know which is current.
    conflicts.set(key, [prior.paddle, paddle]);
    continue;
  }
  if (prior) continue; // same paddle listed twice — one record is enough

  entries.set(key, {
    paddle,
    searchTerm,
    name: res.athlete.name,
    source: rawName,
    slugs: res.athlete.slugs,
  });
  matched.push([rawName, res.athlete.name, res.athlete.slugs.join(" + "), res.how]);
}

// A conflict retracts the record entirely — see the ambiguity rule up top.
for (const slug of conflicts.keys()) entries.delete(slug);

const report = (title, list, fmt = (x) => x.join("  |  ")) => {
  console.log(`\n${title} (${list.length})`);
  for (const x of list) console.log("  " + fmt(x));
};

console.log(`roster: ${roster.length} (curated ${curatedCount} + published ${publishedCount}, de-duped)`);
console.log(`csv rows: ${rows.length}`);
report("MATCHED BY SOMETHING OTHER THAN AN EXACT NAME — check these",
  matched.filter((m) => m[3] !== "exact"));
report("IN THE CSV WITH NO PADDLE — shows nothing", blank.map((b) => [b]));
report("CONFLICTING ROWS — no paddle shown, needs the event team",
  [...conflicts.entries()].map(([slug, [a, b]]) => [slug, `"${a}"  vs  "${b}"`]));
report("UNRESOLVED — no paddle shown", unresolved);

console.log(`\npros with a paddle: ${entries.size}`);
console.log(`exact-name matches: ${matched.filter((m) => m[3] === "exact").length}`);

// One record per slug the site can render for that person.
const bySlug = {};
for (const rec of entries.values())
  for (const slug of rec.slugs)
    bySlug[slug] = { paddle: rec.paddle, searchTerm: rec.searchTerm, name: rec.name, source: rec.source };

console.log(`slugs written: ${Object.keys(bySlug).length}`);

if (REPORT_ONLY) {
  console.log("\n--report: nothing written.");
} else {
  const sorted = Object.fromEntries(Object.entries(bySlug).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(OUT, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`\nwrote ${OUT}`);
}
