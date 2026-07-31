#!/usr/bin/env node
/**
 * Sync every ticket price for the Professional Pickleball Association Tixr group.
 *
 *   node scripts/sync-tixr-prices.mjs
 *
 * Writes:
 *   lib/data/tixr-ticket-prices.json   full snapshot: every event + every ticket tier + price
 *   lib/data/tixr-price-changes.json   append-only log of what changed vs the previous run
 *
 * How it works:
 *   1. Call Tixr's group events endpoint (one request) — it returns every event
 *      in the PPA group *including* the full sales/tiers structure for each:
 *        https://www.tixr.com/api/groups/1164/events?page_number=1&page_length=200
 *      (1164 is the PPA group id; subdomain "ppa"). No auth required.
 *   2. Flatten each event's sales -> tiers into one ticket row each, capturing
 *      both the face value (base_price) and the all-in price the buyer pays
 *      (all_in_price), plus the tier's sale_state (OPEN / SOLD_OUT / HIDE / ...).
 *   3. Diff against the previous snapshot and append any price / availability
 *      changes (and added/removed tickets and events) to the change log.
 *
 * NOTE: run this from a network that can reach tixr.com. Tixr fronts the site
 * with bot protection but the JSON API responds to a normal GET with a
 * browser-like User-Agent, which is what this script sends.
 *
 * Re-run daily (cron / CI / Vercel cron). It is a point-in-time snapshot;
 * `generated_at` is written into the file so the site can show an "as of" time.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SNAPSHOT_PATH = resolve(ROOT, "lib/data/tixr-ticket-prices.json");
const INDEX_PATH = resolve(ROOT, "lib/data/tixr-price-index.json");
const CHANGELOG_PATH = resolve(ROOT, "lib/data/tixr-price-changes.json");

const GROUP = "ppa";
const GROUP_ID = 1164; // Tixr internal id for the "Professional Pickleball Association" group
const GROUP_URL = `https://www.tixr.com/groups/${GROUP}`;
const GROUP_EVENTS_API = `https://www.tixr.com/api/groups/${GROUP_ID}/events?page_number=1&page_length=200`;
/**
 * Keep this current. Tixr's filter rejects stale Chrome versions: with every
 * other header identical, Chrome/125.0 returns 403 on both attempts and
 * Chrome/131.0.0.0 returns 200. That single token was the difference.
 */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Which series a ticket-bearing event belongs to, derived from its name. */
function seriesOf(name = "") {
  if (/challenger series/i.test(name)) return "PPA Challenger Series";
  if (/major league pickleball|\bmlp\b/i.test(name)) return "Major League Pickleball";
  return "PPA Tour";
}

/**
 * Tixr fronts the site with a bot filter that 403s a bare User-Agent request —
 * a UA plus `Accept: application/json,text/html` is NOT enough, which is why
 * earlier runs failed. Sending Referer, Origin and Accept-Language alongside a
 * full browser Accept flips it to 200. Verified against
 * /api/groups/1164/events: UA-only -> 403, these headers -> 200.
 *
 * Note the public HTML page (tixr.com/groups/ppa) still 403s even with these —
 * only the JSON API is reachable. That's fine, the API is what we want.
 */
const API_HEADERS = {
  "User-Agent": UA,
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: GROUP_URL,
  Origin: "https://www.tixr.com",
};

async function getJSON(url) {
  const res = await fetch(url, { headers: API_HEADERS });
  if (!res.ok) {
    throw new Error(
      `GET ${url} -> ${res.status}` +
        (res.status === 403
          ? " (Tixr bot filter — check API_HEADERS; a bare User-Agent is rejected)"
          : ""),
    );
  }
  return res.json();
}

/** Turn one Tixr event payload into our flat snapshot record. */
function extractEvent(id, d) {
  const currency = (d.currencies && d.currencies[0]) || "USD";
  const tickets = [];
  for (const s of d.sales || []) {
    const base =
      s.priceRegulationBreakout && s.priceRegulationBreakout.basePrice != null
        ? s.priceRegulationBreakout.basePrice
        : null;
    for (const t of s.tiers || []) {
      tickets.push({
        name: t.name,
        category: s.category,
        sale_state: s.state, // OPEN | SOLD_OUT | HIDE | ...
        base_price: base,
        all_in_price: t.price,
      });
    }
  }
  tickets.sort(
    (a, b) =>
      (a.category || "").localeCompare(b.category || "") ||
      a.name.localeCompare(b.name) ||
      (a.base_price ?? 1e12) - (b.base_price ?? 1e12)
  );
  const iso = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : null);
  return {
    event_id: String(id),
    name: d.name,
    series: seriesOf(d.name || ""),
    status: d.status,
    start_date: iso(d.startDate),
    end_date: iso(d.endDate),
    venue: d.venue
      ? {
          name: d.venue.name,
          city: d.venue.address && d.venue.address.city,
          state: d.venue.address && d.venue.address.state,
        }
      : null,
    url: d.url || `${GROUP_URL}/events/${id}`,
    currency,
    tickets,
  };
}

/** Stable key for a single ticket tier within an event. */
export const ticketKey = (t) => `${t.category}|${t.name}`;

export { extractEvent, seriesOf };

/** Compare two snapshots and return a list of human-readable change entries. */
export function diffSnapshots(prev, next, stamp) {
  const changes = [];
  const prevEvents = new Map((prev?.events || []).map((e) => [e.event_id, e]));
  const nextEvents = new Map((next.events || []).map((e) => [e.event_id, e]));

  for (const [id, ne] of nextEvents) {
    const pe = prevEvents.get(id);
    if (!pe) {
      changes.push({ at: stamp, type: "event_added", event_id: id, event: ne.name });
      continue;
    }
    const prevTickets = new Map(pe.tickets.map((t) => [ticketKey(t), t]));
    const nextTickets = new Map(ne.tickets.map((t) => [ticketKey(t), t]));
    for (const [k, nt] of nextTickets) {
      const pt = prevTickets.get(k);
      if (!pt) {
        changes.push({
          at: stamp, type: "ticket_added", event_id: id, event: ne.name,
          ticket: nt.name, base_price: nt.base_price, all_in_price: nt.all_in_price,
        });
        continue;
      }
      if (pt.base_price !== nt.base_price || pt.all_in_price !== nt.all_in_price) {
        changes.push({
          at: stamp, type: "price_change", event_id: id, event: ne.name, ticket: nt.name,
          base_price: { from: pt.base_price, to: nt.base_price },
          all_in_price: { from: pt.all_in_price, to: nt.all_in_price },
        });
      }
      if (pt.sale_state !== nt.sale_state) {
        changes.push({
          at: stamp, type: "availability_change", event_id: id, event: ne.name,
          ticket: nt.name, sale_state: { from: pt.sale_state, to: nt.sale_state },
        });
      }
    }
    for (const [k, pt] of prevTickets) {
      if (!nextTickets.has(k)) {
        changes.push({
          at: stamp, type: "ticket_removed", event_id: id, event: pe.name, ticket: pt.name,
        });
      }
    }
  }
  for (const [id, pe] of prevEvents) {
    if (!nextEvents.has(id)) {
      changes.push({ at: stamp, type: "event_removed", event_id: id, event: pe.name });
    }
  }
  return changes;
}

async function main() {
  const stamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const groupEvents = await getJSON(GROUP_EVENTS_API);
  if (!Array.isArray(groupEvents)) throw new Error("Group events API did not return an array");
  console.log(`Fetched ${groupEvents.length} events from the PPA group`);

  // Refuse to publish a collapsed result. Tixr blocks datacenter IPs hard, and a
  // block can come back as an empty (or near-empty) 200 rather than an error. If
  // that got written, every event's price would vanish and the live site would
  // flip to "Tickets Coming Soon" across the board — then commit and deploy it.
  // Bail loudly instead and leave the last good snapshot in place.
  const prevSnapshot = existsSync(SNAPSHOT_PATH)
    ? JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"))
    : null;
  const prevCount = prevSnapshot?.event_count ?? 0;
  const floor = Math.max(1, Math.floor(prevCount * 0.5));
  if (prevCount > 0 && groupEvents.length < floor) {
    throw new Error(
      `Tixr returned ${groupEvents.length} events but the last good snapshot had ` +
        `${prevCount}. That looks like a bot-block or an API change, not a real ` +
        `change. Refusing to overwrite the snapshot. Re-run, or run it locally ` +
        `where Tixr answers residential IPs.`
    );
  }

  const events = groupEvents.map((d) => extractEvent(d.id, d));

  events.sort(
    (a, b) => (a.start_date || "").localeCompare(b.start_date || "") || a.name.localeCompare(b.name)
  );

  const seriesBreakdown = {};
  for (const e of events) seriesBreakdown[e.series] = (seriesBreakdown[e.series] || 0) + 1;
  const ticketTypeCount = events.reduce((n, e) => n + e.tickets.length, 0);

  const snapshot = {
    source: GROUP_URL,
    group: "Professional Pickleball Association",
    generated_at: stamp,
    event_count: events.length,
    ticket_type_count: ticketTypeCount,
    series_breakdown: seriesBreakdown,
    field_notes: {
      base_price: "Face value set by the organizer (USD). null when the tier is sold out / not on public sale.",
      all_in_price: "Price the buyer pays including Tixr fees/taxes (USD). 0 for sold-out/placeholder tiers.",
      sale_state: "OPEN = on sale, SOLD_OUT = sold out, HIDE = not publicly listed / hidden tier.",
      status: "Tixr event publication status.",
    },
    events,
  };

  /**
   * Compact index alongside the full snapshot: Tixr event id -> resolved
   * admission price + whether it's listed. Exists purely for bundle size.
   *
   * lib/placeholder-data.ts needs these two values, and it is imported by client
   * components (ScheduleGrid, NationalsLive…). Importing the full snapshot there
   * shipped all 864 ticket records — a 156KB client chunk — for two numbers per
   * event. This file is a couple of KB and carries no tier detail.
   *
   * The full snapshot stays server-only, for the event page's tier list and the
   * OG card.
   */
  const NOT_ADMISSION =
    /king of the court|king'?s court|camp|clinic|skills lab|play with a pro|on court with|glow in the dark|family night|register here|discount|vacations/i;
  const index = {};
  for (const e of events) {
    const open = (e.tickets || []).filter(
      (t) => t.sale_state === "OPEN" && t.base_price != null && t.base_price > 0,
    );
    const grounds = open.find((t) => /grounds pass/i.test(t.name));
    const admission = open.find((t) => !NOT_ADMISSION.test(t.name));
    const from = grounds ? grounds.base_price : (admission ? admission.base_price : null);
    index[String(e.event_id)] = { from, onSale: from != null };
  }
  // Second floor, same reasoning as above: the group listing can come back
  // intact while every per-event ticket call is blocked, which yields prices for
  // nobody. Don't publish that either.
  const onSaleNow = Object.values(index).filter((e) => e.onSale).length;
  const prevOnSale = existsSync(INDEX_PATH)
    ? Object.values(JSON.parse(readFileSync(INDEX_PATH, "utf8")).prices ?? {}).filter(
        (e) => e.onSale
      ).length
    : 0;
  if (prevOnSale > 0 && onSaleNow === 0) {
    throw new Error(
      `Resolved 0 on-sale prices but the last index had ${prevOnSale}. Treating ` +
        `that as a blocked/changed API, not a real sell-out. Snapshot not written.`
    );
  }

  writeFileSync(
    INDEX_PATH,
    JSON.stringify({ generated_at: stamp, prices: index }, null, 2) + "\n",
  );
  console.log(`Wrote ${INDEX_PATH} (${Object.keys(index).length} events)`);

  const changes = diffSnapshots(prevSnapshot, snapshot, stamp);

  mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
  writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`Wrote ${SNAPSHOT_PATH} (${events.length} events, ${ticketTypeCount} tickets)`);

  if (changes.length) {
    const log = existsSync(CHANGELOG_PATH)
      ? JSON.parse(readFileSync(CHANGELOG_PATH, "utf8"))
      : { entries: [] };
    log.entries.push(...changes);
    log.updated_at = stamp;
    writeFileSync(CHANGELOG_PATH, JSON.stringify(log, null, 2) + "\n");
    console.log(`Logged ${changes.length} change(s) to ${CHANGELOG_PATH}`);
  } else if (prevSnapshot) {
    console.log("No changes since last run.");
  }
}

/**
 * Only run the network sync when invoked directly (not when imported for tests).
 *
 * Must go through pathToFileURL: on Windows process.argv[1] is
 * "C:\Users\...\sync-tixr-prices.mjs" while import.meta.url is
 * "file:///C:/Users/.../sync-tixr-prices.mjs", so the old
 * `file://${process.argv[1]}` comparison never matched — the script exited 0
 * having done nothing at all. It would have worked on the Linux CI runner and
 * silently no-op'd on the machine it was written from.
 */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
