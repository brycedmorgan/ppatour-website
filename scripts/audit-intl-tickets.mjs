/**
 * Do our international ticket claims still match what the sister tours say?
 *
 *   npm run intl:tickets
 *
 * WHY THIS EXISTS. Wesley, 9/1 (Asana "Incorrect info for international
 * events"): "Moving forward, what is the best way to make sure everyone is on
 * the same page so links go up when tickets launch?"
 *
 * Nothing about international tickets can reach this site on its own. The
 * `ppa_tournaments` feed carries NO ticket link (221 rows, 28 fields — only
 * `logo_url` and a registration `details_url`), and the nightly Tixr sync is
 * hardcoded to the US storefront (`GROUP_ID = 1164`). So every sister-tour
 * ticket link depends on a person remembering to tell us, which is exactly how
 * three stops came to be wrong at once.
 *
 * This is the safety net that needs nothing from anyone: the sister tours
 * advertise their own tickets on their own sites, so we can watch that and
 * report where it disagrees with us. It REPORTS, NEVER REWRITES — a ticket
 * claim is a commercial statement, and the fix belongs in
 * lib/sister-tour-tickets.ts under a comment naming who said so.
 *
 * ⚠ CONFIDENCE IS TIERED ON PURPOSE, BECAUSE THE OBVIOUS CHECK PRODUCES FALSE
 * ALARMS. "Fetch the stop's page, look for a Tixr link" reports the Australia
 * Pickleball Cup as NOT on sale — its ticket link lives on their news post and
 * their homepage, not on its tournament page. So a missing link on one page is
 * never enough to fail a claim; only a tour-wide absence is.
 *
 * ⚠ AND IT MATCHES THE TOUR'S OWN GROUP SLUG, NOT ANY TIXR LINK. PPA Canada's
 * homepage links `tixr.com/groups/ppa` — the US tour's storefront, a nav link.
 * Counting that as "Canada tickets are live" would invent a sale.
 *
 * FAILS (exit 1), both event-attributed and high-confidence:
 *   1. We claim on sale, and the tour's own group appears NOWHERE on their site
 *      — we are probably over-claiming.
 *   2. We claim nothing (or free), and their group appears on that stop's OWN
 *      event page — a launch we missed. This is the case that would have caught
 *      the Kuala Lumpur Cup before it was filed.
 * REPORTS without failing:
 *   3. One line per tour: whether their storefront appears site-wide, and which
 *      upcoming stops we do and do not mark as on sale. This is the nudge for
 *      the Adelaide case — link present site-wide, stop not marked — which is
 *      worth a human glance but is not evidence of anything on its own.
 *   4. Any Tixr group on their site that is NOT the one we use (a storefront
 *      migration, or two slugs in circulation).
 *   5. Upcoming international stops with no known event page — visible coverage,
 *      so a silent gap never reads as a clean pass.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * One entry per sister tour we can watch.
 *
 * `group` is the tour's OWN Tixr storefront slug — null when they sell nothing
 * (PPA Canada today). `sitePages` is a deliberately small, hand-picked sweep:
 * the pages where these tours actually put a ticket link. Their homepage is the
 * load-bearing one; the Australia Cup's link appears there and on a news post,
 * never on its tournament page.
 */
const TOURS = [
  {
    id: "asia",
    label: "PPA Tour Asia",
    country: "Asia",
    group: "upaasia",
    sitePages: ["https://www.ppatour-asia.com/", "https://www.ppatour-asia.com/news/"],
  },
  {
    id: "australia",
    label: "PPA Tour Australia",
    country: "Australia",
    group: "ppaaustralia",
    sitePages: [
      "https://ppatour.com.au/",
      "https://ppatour.com.au/calendar/",
      "https://ppatour.com.au/news/",
    ],
  },
  {
    id: "canada",
    label: "PPA Tour Canada",
    country: "Canada",
    // They advertise no storefront of their own — their homepage links the US
    // group. If they ever open one, put its slug here.
    group: null,
    sitePages: [
      "https://ppatourcanada.ca/",
      "https://ppatourcanada.ca/schedule/",
      "https://ppatourcanada.ca/news/",
    ],
  },
];

/* ---- env ---- */

function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

/* ---- our own claims + link tables, parsed from source ---- */

/**
 * What lib/sister-tour-tickets.ts says, by UUID and by curated slug.
 * THROWS if it parses nothing — a parser that silently stopped matching would
 * report every stop as "we claim nothing", i.e. a clean-looking lie.
 */
function readClaims() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "sister-tour-tickets.ts"), "utf8");
  const claims = new Map();
  for (const block of ["BY_UUID", "BY_CURATED_SLUG"]) {
    const start = src.indexOf(`const ${block}`);
    if (start === -1) throw new Error(`${block} not found in lib/sister-tour-tickets.ts`);
    const body = src.slice(start, src.indexOf("\n};", start));
    for (const m of body.matchAll(/"([^"]+)":\s*\{\s*state:\s*"([^"]+)"/g)) {
      claims.set(m[1], m[2]);
    }
  }
  if (claims.size === 0) {
    throw new Error(
      "Parsed no ticket claims out of lib/sister-tour-tickets.ts — the shape changed. Fix this parser before trusting the report.",
    );
  }
  return claims;
}

/** Event-page URLs from the three link tables, keyed by uuid / ptSlug / curatedSlug. */
function readLinkTables() {
  const files = [
    ["asia-tour-links.ts", "ASIA_TOUR_EVENTS", (p) => `https://ppatour-asia.com/tournament/${p}/`],
    [
      "australia-tour-links.ts",
      "AUSTRALIA_TOUR_EVENTS",
      (p) => `https://ppatour.com.au/tournaments/${p}/`,
    ],
    [
      "canada-tour-links.ts",
      "CANADA_TOUR_EVENTS",
      (p) => `https://ppatourcanada.ca/tournament/${p}/`,
    ],
  ];
  const byKey = new Map();
  let rows = 0;
  for (const [file, constName, toUrl] of files) {
    const src = fs.readFileSync(path.join(ROOT, "lib", file), "utf8");
    const body = src.slice(src.indexOf(constName));
    for (const m of body.matchAll(
      /\{\s*(?:\/\/[^\r\n]*[\r\n]+\s*)*name:\s*"([^"]+)",[\s\S]*?\}/g,
    )) {
      const block = m[0];
      const p = /path:\s*"([^"]+)"/.exec(block)?.[1];
      if (!p) continue;
      rows += 1;
      const url = toUrl(p);
      for (const key of ["uuid", "ptSlug", "curatedSlug"]) {
        const v = new RegExp(`${key}:\\s*"([^"]+)"`).exec(block)?.[1];
        if (v) byKey.set(v, url);
      }
    }
  }
  if (rows < 20) {
    throw new Error(
      `Parsed only ${rows} rows across the three link tables — the shape changed. Fix this parser.`,
    );
  }
  return byKey;
}

/* ---- the calendar ---- */

const NON_TOUR_NAME = /minor league|the dink\b|dink minor/i;
function isJunk(t) {
  return (
    t.is_canceled ||
    t.is_stub ||
    t.is_advertise_only ||
    t.tournament_status === "Cancelled" ||
    /additional events/i.test(t.title) ||
    /\btemplate\b|\btest event\b|\bTBD\b/i.test(t.title) ||
    NON_TOUR_NAME.test(t.title) ||
    !t.start_date
  );
}

function inferCountry(org) {
  if (/australia/i.test(org)) return "Australia";
  if (/asia/i.test(org)) return "Asia";
  if (/canada/i.test(org)) return "Canada";
  if (/italy|spain|europe/i.test(org)) return "Europe";
  return undefined;
}

/** Upcoming international stops: the live feed, plus curated merge-ins. */
async function upcomingStops(env) {
  const token = env.PB_API_TOKEN || process.env.PB_API_TOKEN;
  if (!token) {
    console.error("PB_API_TOKEN not set (.env.local) — cannot read the calendar.");
    process.exit(2);
  }
  const base = (env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
  const res = await fetch(`${base}/v2/data/ppa_tournaments?current_page=1&page_size=300`, {
    headers: { "PB-API-TOKEN": token },
  });
  if (!res.ok) {
    console.error(`Feed returned ${res.status}.`);
    process.exit(2);
  }
  const all = (await res.json()).results?.tournaments ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const stops = all
    .filter((t) => !isJunk(t))
    .filter((t) => t.organization_name !== "Pro Pickleball Association")
    .filter((t) => (t.end_date || t.start_date).slice(0, 10) >= today)
    .map((t) => ({
      name: t.title,
      start: t.start_date.slice(0, 10),
      country: inferCountry(t.organization_name || ""),
      uuid: t.tournament_uuid,
      // ⚠ BOTH KEYS, ALWAYS. The Australia and Canada tables key on
      // `tournament_uuid`, but the older Asia table keys on the
      // pickleballtournaments permalink — so a uuid-only lookup silently
      // reports every Asia stop as "no known event page", which is exactly the
      // stop this check exists to watch (the Kuala Lumpur Cup).
      keys: [
        t.tournament_uuid,
        /pickleballtournaments\.com\/tournaments\/([^/?#]+)/i
          .exec(t.details_url ?? "")?.[1]
          ?.toLowerCase(),
      ].filter(Boolean),
    }));

  // Curated stops the feed has no row for (PPA Canada's Ottawa + Toronto).
  const src = fs.readFileSync(path.join(ROOT, "lib", "placeholder-data.ts"), "utf8");
  const kebab = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  for (const m of src.matchAll(/\{\s*name:\s*"([^"]+)",([^}]*showWhenAbsentFromFeed:\s*true[^}]*)\}/g)) {
    const attrs = m[2];
    const start = /start:\s*"([^"]+)"/.exec(attrs)?.[1] ?? "";
    const end = /end:\s*"([^"]+)"/.exec(attrs)?.[1] ?? start;
    const country = /country:\s*"([^"]+)"/.exec(attrs)?.[1];
    if (end < today) continue;
    stops.push({ name: m[1], start, country, uuid: null, keys: [kebab(m[1])] });
  }
  return stops.sort((a, b) => a.start.localeCompare(b.start));
}

/* ---- fetching ---- */

const cache = new Map();
async function getPage(url) {
  if (cache.has(url)) return cache.get(url);
  let body = "";
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    // ⚠ Normalise the doubled scheme: ppatour.com.au's own Cup page ships
    // `https://https://www.tixr.com/...`, which is broken on their side but is
    // still evidence that they advertise tickets.
    body = res.ok ? (await res.text()).replace(/https:\/\/https:\/\//g, "https://") : "";
  } catch {
    body = "";
  }
  cache.set(url, body);
  return body;
}

const groupsIn = (html) => [
  ...new Set([...html.matchAll(/tixr\.com\/groups\/([a-z0-9-]+)/gi)].map((m) => m[1].toLowerCase())),
];

/* ---- report ---- */

const env = loadEnv();
const claims = readClaims();
const links = readLinkTables();
const stops = await upcomingStops(env);

console.log("International ticket status — our claim vs the sister tours' own sites\n");

let failed = false;
const fails = [];
const unchecked = [];

for (const tour of TOURS) {
  const mine = stops.filter((s) => s.country === tour.country);
  if (mine.length === 0) continue;

  // Site-wide sweep once per tour.
  const siteGroups = new Set();
  for (const p of tour.sitePages) for (const g of groupsIn(await getPage(p))) siteGroups.add(g);
  const siteHasOwn = tour.group ? siteGroups.has(tour.group) : false;
  const foreign = [...siteGroups].filter((g) => g !== tour.group && g !== "ppa");

  console.log(`${tour.label} — storefront ${tour.group ? `tixr.com/groups/${tour.group}` : "(none known)"}`);
  console.log(`  site-wide ticket link: ${siteHasOwn ? "PRESENT" : "absent"}`);

  for (const s of mine) {
    const ours = s.keys.map((k) => claims.get(k)).find(Boolean) ?? "unknown";
    const page = s.keys.map((k) => links.get(k)).find(Boolean) ?? null;
    if (!page) unchecked.push(`${tour.label}: ${s.name} (${s.start}) — no known event page`);
    const pageGroups = page ? groupsIn(await getPage(page)) : [];
    const pageHasOwn = Boolean(tour.group) && pageGroups.includes(tour.group);

    let verdict = "ok";
    if (ours === "on-sale" && !pageHasOwn && !siteHasOwn) {
      verdict = "OVER-CLAIM";
      fails.push(
        `${tour.label}: we say tickets are ON SALE for "${s.name}" (${s.start}), but ${tour.group ?? "their"} storefront appears nowhere on their site.`,
      );
    } else if (ours !== "on-sale" && pageHasOwn) {
      verdict = ours === "free" ? "CONTRADICTION" : "MISSED LAUNCH";
      fails.push(
        `${tour.label}: "${s.name}" (${s.start}) advertises tickets on its OWN event page, but we say "${ours}".`,
      );
    }

    console.log(
      `  ${verdict === "ok" ? "ok  " : "FAIL"} ${s.start}  ${s.name}` +
        `\n         ours=${ours}  their event page=${page ? (pageHasOwn ? "ticket link" : "no ticket link") : "unknown"}`,
    );
  }

  if (foreign.length) {
    console.log(`  INFO their site also links Tixr group(s) we do not use: ${foreign.join(", ")}`);
  }
  console.log("");
}

if (unchecked.length) {
  console.log(`INFO ${unchecked.length} upcoming stop(s) could not be checked:`);
  for (const u of unchecked) console.log(`    ${u}`);
  console.log("");
}

// Stops on tours we do not watch at all (Europe today) — coverage, not a pass.
const unwatched = stops.filter((s) => !TOURS.some((t) => t.country === s.country));
if (unwatched.length) {
  console.log(`INFO ${unwatched.length} upcoming stop(s) on tours with no site to watch:`);
  for (const s of unwatched) {
    console.log(`    ${s.start}  ${s.name}  (${s.country ?? "unknown region"})  ours=${s.keys.map((k) => claims.get(k)).find(Boolean) ?? "unknown"}`);
  }
  console.log("");
}

if (fails.length) {
  failed = true;
  console.log("DISAGREEMENTS TO RESOLVE:");
  for (const f of fails) console.log(`  - ${f}`);
  console.log("\nFix in lib/sister-tour-tickets.ts, with a comment naming the source.");
}

if (failed) process.exitCode = 1;
else console.log("OK — every claim we publish agrees with what the sister tours advertise.");
