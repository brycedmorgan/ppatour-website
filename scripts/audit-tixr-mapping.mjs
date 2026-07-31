#!/usr/bin/env node
/**
 * Audit our event -> Tixr mapping. READ-ONLY — writes nothing, safe any time.
 *
 *   node scripts/audit-tixr-mapping.mjs
 *
 * WHY
 * ---
 * The site shows a price and a Buy Tickets button only when we hold a Tixr
 * listing with a resolvable price. That fails SILENTLY in both directions and
 * neither failure shows up in a build:
 *
 *   STALE MAPPING    we point at a Tixr id that no longer exists. Tixr recycles
 *                    listings — Las Vegas 178513 became 195857 mid-season — and
 *                    the site quietly reverts to "Tickets Coming Soon" on an
 *                    event that is actually on sale.
 *   MISSING MAPPING  Tixr has a live on-sale listing no slug of ours points at,
 *                    so we say "coming soon" while fans can already buy.
 *
 * Tixr names listings differently from us ("Veolia PPA Cincinnati" vs our
 * "Cincinnati Open"), so unmapped listings are reported for a HUMAN to match on
 * name + date + city. This script never guesses a mapping: a ticket link to the
 * wrong event is worse than no link.
 *
 * Everything Tixr-shaped is imported from sync-tixr-prices.mjs so the two can't
 * disagree about what a ticket or an admission tier is.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  API_HEADERS,
  GROUP_EVENTS_API,
  NOT_ADMISSION,
  extractEvent,
} from "./sync-tixr-prices.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Trailing Tixr event id from a tickets URL — same rule as lib/tixr-price-index.ts. */
function idFromUrl(url) {
  const m = String(url || "").match(/-(\d{4,})(?:[/?#]|$)/);
  return m ? m[1] : null;
}

/**
 * slug -> Tixr id from COMMERCE_BY_SLUG in lib/placeholder-data.ts, read as text
 * because that module uses the `@/` path alias which bare Node can't resolve.
 */
function readCommerceMap() {
  const src = readFileSync(resolve(ROOT, "lib/placeholder-data.ts"), "utf8");
  const start = src.indexOf("COMMERCE_BY_SLUG");
  if (start === -1) throw new Error("COMMERCE_BY_SLUG not found in lib/placeholder-data.ts");
  const block = src.slice(start, src.indexOf("\n};", start));
  const out = new Map();
  for (const m of block.matchAll(/"([a-z0-9-]+)":\s*\{([\s\S]*?)\}/g)) {
    const ref = m[2].match(/tixrEvent\("([^"]+)"\)/);
    if (ref) out.set(m[1], { ref: ref[1], id: idFromUrl(ref[1]) });
  }
  if (out.size === 0) throw new Error("Parsed COMMERCE_BY_SLUG but found no tixrEvent() entries");
  return out;
}

/**
 * slug -> event end date, from the curated event table in lib/placeholder-data.ts.
 * Used only to tell "this event is over, of course Tixr dropped the listing" from
 * "this event is coming and its ticket link is dead". Slug is kebab(name), the
 * same derivation placeholder-data uses.
 */
function readEventDates() {
  const src = readFileSync(resolve(ROOT, "lib/placeholder-data.ts"), "utf8");
  const out = new Map();
  for (const m of src.matchAll(
    /\{\s*name:\s*"([^"]+)"[^}]*?end:\s*"(\d{4}-\d{2}-\d{2})"/g
  )) {
    const slug = m[1]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    out.set(slug, m[2]);
  }
  return out;
}

/**
 * The two NOT_ADMISSION copies must agree — one drives card prices, the other the
 * event page's tier list. Compare the source literals, not behaviour, so drift is
 * caught before a ticket name happens to expose it.
 */
function checkRegexParity() {
  const libSrc = readFileSync(resolve(ROOT, "lib/tixr-prices.ts"), "utf8");
  const m = libSrc.match(/const NOT_ADMISSION =\s*(\/[\s\S]*?\/i);/);
  if (!m) return "could not find NOT_ADMISSION in lib/tixr-prices.ts";
  return m[1] === String(NOT_ADMISSION)
    ? null
    : `NOT_ADMISSION differs between the two files:\n      script: ${String(NOT_ADMISSION)}\n      lib   : ${m[1]}`;
}

/** Admission tiers that are actually on sale, cheapest first. */
function openAdmission(rec) {
  return rec.tickets
    .filter(
      (t) =>
        t.sale_state === "OPEN" &&
        t.base_price != null &&
        t.base_price > 0 &&
        !NOT_ADMISSION.test(t.name)
    )
    .sort((a, b) => a.base_price - b.base_price);
}

function where(rec) {
  const v = rec.venue || {};
  return [v.city, v.state].filter(Boolean).join(", ");
}

async function main() {
  const res = await fetch(GROUP_EVENTS_API, { headers: API_HEADERS });
  if (!res.ok) throw new Error(`Tixr group API -> ${res.status}`);
  const payload = await res.json();
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("Tixr returned no events — treat as a block, not an empty group");
  }

  const records = payload.map((d) => extractEvent(d.id, d));
  const byId = new Map(records.map((r) => [r.event_id, r]));
  const commerce = readCommerceMap();
  const mapped = new Set([...commerce.values()].map((v) => v.id).filter(Boolean));

  console.log(`Tixr PPA group : ${records.length} listings`);
  console.log(`Our commerce map: ${commerce.size} events linked to Tixr\n`);

  let needsHuman = 0;

  const parity = checkRegexParity();
  console.log("ADMISSION-RULE PARITY");
  console.log(parity ? `  ! ${parity}` : "  ok — both files use the same rule");
  if (parity) needsHuman++;

  // A dead id on an event that has already finished is expected — Tixr takes the
  // listing down afterwards and the site shows "Completed", not a price. Only
  // flag dead ids on events still to come, which is where a fan sees the harm.
  const endBySlug = readEventDates();
  const today = new Date().toISOString().slice(0, 10);
  const allStale = [...commerce].filter(([, v]) => v.id && !byId.has(v.id));
  const stale = allStale.filter(([slug]) => (endBySlug.get(slug) ?? "9999") >= today);
  const stalepast = allStale.length - stale.length;

  console.log(
    `\nSTALE MAPPINGS — dead Tixr id on an UPCOMING event: ${stale.length}` +
      (stalepast ? `  (+${stalepast} on finished events, expected)` : "")
  );
  for (const [slug, v] of stale) {
    console.log(
      `  ! ${slug} -> id ${v.id} is gone; site shows "Tickets Coming Soon" on a live event`
    );
    needsHuman++;
  }
  if (!stale.length) console.log("  none");

  // Split the unmapped listings by WHY they're unmapped, or the real signal
  // drowns: Tixr sells each finals day as its own listing under a parent we
  // already link, and the group also carries MLP, which isn't on this site.
  const unmapped = records.filter(
    (r) => !mapped.has(r.event_id) && openAdmission(r).length > 0
  );
  const mappedRecords = [...mapped].map((id) => byId.get(id)).filter(Boolean);

  // Match a session listing to its parent stop on CITY + DATE CONTAINMENT, not on
  // name. Tixr's own naming is inconsistent — the Worlds parent is "2026 World
  // Pickleball Championships" while its day listings are "2026 Pickleball World
  // Championships …" (words transposed), so a name/prefix test silently fails and
  // reports eight normal day sessions as unexplained. A name prefix is still
  // accepted as a second route, for a session at a venue we have no city for.
  const DAY_TOKEN =
    /\b(mon|tues|wednes|thurs|fri|satur|sun)day\b|round of|quarterfinal|semifinal|championship|session|qualifier|morning|evening/i;
  const parentOf = (r) =>
    mappedRecords.find((p) => {
      if (p.event_id === r.event_id) return false;
      if (r.name.toLowerCase().startsWith(p.name.toLowerCase() + " ")) return true;
      const sameCity =
        p.venue?.city && r.venue?.city &&
        p.venue.city.toLowerCase() === r.venue.city.toLowerCase();
      const within =
        p.start_date && p.end_date && r.start_date &&
        r.start_date >= p.start_date && r.start_date <= p.end_date;
      return Boolean(sameCity && within && DAY_TOKEN.test(r.name));
    });

  const sessions = new Map(); // parent name -> child records
  const mlp = [];
  const unexplained = [];
  for (const r of unmapped) {
    const parent = parentOf(r);
    if (parent) {
      const list = sessions.get(parent.name) || [];
      list.push(r);
      sessions.set(parent.name, list);
    } else if (r.series === "Major League Pickleball") {
      mlp.push(r);
    } else {
      unexplained.push(r);
    }
  }

  const line = (r) => {
    const from = openAdmission(r)[0];
    console.log(
      `  ? ${r.event_id}  from $${from.base_price}  ${r.name}${
        where(r) ? ` — ${where(r)}` : ""
      }${r.start_date ? ` — ${r.start_date}` : ""}`
    );
    console.log(`      ${r.url}`);
  };

  console.log(
    `\nUNEXPLAINED LIVE LISTINGS — on sale, not a session of a stop we link, not MLP: ${unexplained.length}`
  );
  for (const r of unexplained) {
    line(r);
    needsHuman++;
  }
  if (!unexplained.length) console.log("  none");

  const sessionCount = [...sessions.values()].reduce((n, l) => n + l.length, 0);
  console.log(
    `\nPER-DAY SESSION LISTINGS — expected; we link the parent stop: ${sessionCount}`
  );
  for (const [parent, list] of sessions) {
    console.log(`  . ${parent} -> ${list.length} day listing(s)`);
  }
  if (!sessionCount) console.log("  none");

  console.log(`\nMAJOR LEAGUE PICKLEBALL — separate property, not on this site: ${mlp.length}`);
  if (!mlp.length) console.log("  none");

  const shells = records.filter((r) => openAdmission(r).length === 0);
  console.log(
    `\nSHELL LISTINGS — published but nothing sellable, so "coming soon" is correct: ${shells.length}`
  );
  for (const r of shells) {
    console.log(
      `  . ${r.event_id}  ${r.name}${where(r) ? ` — ${where(r)}` : ""}  (${r.tickets.length} tier(s), none open)`
    );
  }
  if (!shells.length) console.log("  none");

  console.log(
    `\n${needsHuman === 0 ? "OK — nothing to decide." : `${needsHuman} item(s) need a human decision.`}`
  );

  // Advisory by design: most unmapped listings are legitimately not ours to link
  // (per-day session listings, MLP events sharing the group). Exiting non-zero
  // would make this unrunnable in CI without constant babysitting.
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(String(err.message || err));
    process.exit(1);
  });
}
