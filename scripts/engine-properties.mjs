#!/usr/bin/env node
/**
 * Resolve Engine (Omni) property IDs for the hotels we publish on event pages.
 *
 *   npm run engine:properties -- --list    # hotels + paste-ready map, no API
 *   npm run engine:properties              # resolve against the API, writes nothing
 *   npm run engine:properties -- --write
 *
 * ⚠ A SCRIPT, NOT A RUNTIME FETCH, AND THAT IS THE WHOLE DESIGN. Resolving these
 * at render time would mean shipping the mTLS private key to Vercel and paying a
 * handshake on page renders, for data that changes about never. Run this on a dev
 * machine, review the diff, commit the map — the same shape as
 * `import-paddles.mjs`, `sync-event-marks.mjs` and `sync-tixr-prices.mjs`. The
 * certificate never leaves the laptop and production stays static and fail-safe.
 *
 * ⚠ IT REFUSES TO WRITE FROM SANDBOX CREDENTIALS. Our deep links point at
 * members.engine.com — the PRODUCTION consumer site — so a property ID resolved
 * against the sandbox catalogue may name a building that does not exist there,
 * and a fan clicking "Book on Engine" under a hotel's name would land on the
 * wrong page or a dead one. No link beats a wrong link (the dead Chicago hotel,
 * 7/29; the two Australia registration links, 8/6). Override deliberately with
 * --allow-sandbox if you are testing the matcher itself.
 *
 * Endpoint: GET /content/v1/property (ContentService_ListProperties) over HTTP/2.
 * The REST gateway does NOT answer HTTP/1.1 — it resets the stream — so this uses
 * node:http2 directly rather than fetch. No new dependency either way.
 */

import http2 from "node:http2";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(import.meta.dirname, "..");
const ENGINE_TS = path.join(REPO, "lib", "engine.ts");
const GUIDES_TS = path.join(REPO, "lib", "event-guides.ts");
const HOTELS_FEED = "https://jackalopehq.vercel.app/api/public/hotels";

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const ALLOW_SANDBOX = args.includes("--allow-sandbox");
const INCLUDE_GUIDES = args.includes("--include-guides");
const VERBOSE = args.includes("--verbose");
/**
 * List the hotels that need an Engine property ID and emit a paste-ready map —
 * no credentials, no API call.
 *
 * ⚠ THIS IS THE PATH THAT ACTUALLY WORKS TODAY, not a convenience. Every stream
 * to partner-api.engine.com is reset (verified 8/19: TCP connects and TLS
 * handshakes clean with `authorized=true`, then every HTTP/2 stream resets —
 * with or without the client cert, on real and deliberately bogus paths, as REST
 * and as gRPC framing — while HTTP/2 to other hosts from the same machine
 * returns 200). So the catalogue cannot be read at all, and the certificate we
 * hold is a SANDBOX one anyway, which this script refuses to write from.
 *
 * The ID does not need the API: it is in the URL when a signed-in Engine user
 * opens a property — members.engine.com/properties/P0000000000000102095. So one
 * person with an Engine login can fill these in by hand, and each line lights
 * that hotel's dated deep link up on both event surfaces at once.
 */
const LIST = args.includes("--list");

/* ---------------------------------------------------------------- credentials */

/**
 * Read `.env.local` directly. A standalone script gets none of Next's env
 * loading, and this repo has no dotenv dependency to borrow.
 */
function loadEnv() {
  const file = path.join(REPO, ".env.local");
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = { ...loadEnv(), ...process.env };

function pem(name) {
  const raw = env[name];
  if (!raw) return null;
  // Stored base64-encoded because PEMs are multi-line and env storage mangles
  // newlines. Accept a raw PEM too, so a hand-pasted value still works.
  if (raw.includes("-----BEGIN")) return raw.replace(/\\n/g, "\n");
  try {
    return Buffer.from(raw, "base64").toString("utf8");
  } catch {
    return null;
  }
}

const CERT = pem("ENGINE_CLIENT_CERT");
const KEY = pem("ENGINE_CLIENT_KEY");
const API_ENV = (env.ENGINE_API_ENV || "").toLowerCase();
const HOST = env.ENGINE_API_BASE_URL || "https://partner-api.engine.com";

/**
 * ⚠ NOT ENFORCED FOR --list, WHICH IS THE WHOLE POINT OF THAT MODE. It reads a
 * public feed and our own source, makes no API call, and is the only path that
 * works while the endpoint is unreachable — so requiring a certificate for it
 * locked the usable half of this script behind the credential the unusable half
 * needs. Caught by running the COMMITTED tree in a worktree with no .env.local,
 * where it exited 1 having listed zero hotels; it had only ever been run on a
 * machine that happened to have the cert.
 */
if (!LIST && (!CERT || !KEY)) {
  console.error(
    "Missing ENGINE_CLIENT_CERT / ENGINE_CLIENT_KEY.\n" +
      "Add them to .env.local, base64-encoded. They are the Omni mTLS pair from Engine.\n" +
      "\nNo credentials? --list needs none: npm run engine:properties -- --list",
  );
  process.exit(1);
}

/* ------------------------------------------------------------------- the API */

/**
 * One ListProperties search. Resolves to an array of candidates.
 *
 * ⚠ REJECTS LOUDLY RATHER THAN RETURNING NOTHING. An unreachable API and a
 * genuine "no such hotel" are the same empty array to a caller, and this repo's
 * recurring bug is a lookup that silently degrades to nothing and reads as data.
 */
function searchProperties(freeformText, { radiusMiles = 5, pageSize = 10 } = {}) {
  return new Promise((resolve, reject) => {
    const q = new URLSearchParams({
      "request.criteria.radius.freeformSearchText": freeformText,
      "request.criteria.radius.radius.value": String(radiusMiles),
      "request.criteria.radius.radius.unit": "DISTANCE_UNIT_MILE",
      "request.criteria.sortMode": "PROPERTY_SORT_MODE_DISTANCE",
      "request.pageSize": String(pageSize),
    });
    const client = http2.connect(HOST, { cert: CERT, key: KEY });
    let settled = false;
    const done = (fn, v) => {
      if (settled) return;
      settled = true;
      try {
        client.close();
      } catch {
        /* closing a reset session throws; nothing to do */
      }
      fn(v);
    };
    client.on("error", (e) => done(reject, e));
    const req = client.request({
      ":method": "GET",
      ":path": `/content/v1/property?${q}`,
      accept: "application/json",
    });
    let body = "";
    let status = 0;
    req.setEncoding("utf8");
    req.on("response", (h) => (status = Number(h[":status"])));
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      if (status !== 200) {
        return done(reject, new Error(`HTTP ${status}: ${body.slice(0, 200)}`));
      }
      try {
        const json = JSON.parse(body);
        done(
          resolve,
          (json.properties ?? []).map((row) => ({
            ...(row.property ?? row),
            distance: row.distance,
          })),
        );
      } catch (e) {
        done(reject, new Error(`Unparseable response: ${String(e)}`));
      }
    });
    req.on("error", (e) => done(reject, e));
    setTimeout(() => done(reject, new Error("timeout")), 20000);
    req.end();
  });
}

/* ----------------------------------------------------------------- our hotels */

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * GET + parse JSON over node:https with `agent: false`, deliberately NOT `fetch`.
 *
 * ⚠ THIS IS AN EXIT-CODE FIX, NOT A STYLE PREFERENCE. `fetch` is undici, which
 * holds the socket open in a keep-alive pool for seconds after the body is read.
 * Calling `process.exit()` while that handle is live aborts Node on Windows with
 * "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING) ... async.c, line 76"
 * and the process exits 127 — on a completely successful run. That is the same
 * false failure `audit-asia-links` hit on 8/6, and a script that exits non-zero
 * when it worked is a script nobody can put in a check. `agent: false` opens one
 * connection and closes it, so the handle is gone before we exit.
 */
function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { agent: false }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`hotels feed HTTP ${res.statusCode}`));
        return;
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.setTimeout(20000, () => req.destroy(new Error("hotels feed timeout")));
  });
}

/** The official blocks Kristen manages — these are the rows that actually render. */
async function feedHotels() {
  const json = await getJson(HOTELS_FEED);
  const out = [];
  for (const ev of json.events ?? []) {
    for (const h of ev.hotels ?? []) {
      if (!h?.name) continue;
      out.push({
        name: h.name,
        // The address is what makes a match trustworthy — a hotel brand has
        // hundreds of properties and only the street disambiguates them.
        query: [h.name, h.address, ev.loc].filter(Boolean).join(", "),
        source: `feed · ${ev.key || ev.name}`,
      });
    }
  }
  return out;
}

/**
 * The static guide hotels, which render for any stop with no published block.
 *
 * ⚠ These carry NO address — only a name and an editorial note — so they are
 * off by default. Matching "Malibu Beach Inn" on name alone is exactly how you
 * pin the wrong building.
 */
function guideHotels() {
  const src = fs.readFileSync(GUIDES_TS, "utf8");
  const out = [];
  // Per event block: capture the slug, then its `hotels: [ ... ]` array only —
  // scoped so `dining` and `doing` entries can't be read as places to stay.
  const blocks = src.matchAll(/^ {2}"([a-z0-9-]+)":\s*\{([\s\S]*?)^ {2}\},/gm);
  for (const [, slug, body] of blocks) {
    const arr = /hotels:\s*\[([\s\S]*?)\],/.exec(body);
    if (!arr) continue;
    for (const m of arr[1].matchAll(/\{\s*name:\s*"([^"]+)"/g)) {
      out.push({ name: m[1], query: `${m[1]}, ${slug.replace(/-/g, " ")}`, source: `guide · ${slug}` });
    }
  }
  if (out.length < 10) {
    // A silent drop here looks exactly like "those hotels aren't on Engine".
    throw new Error(`guide parse found only ${out.length} hotels — the file shape changed`);
  }
  return out;
}

/* ------------------------------------------------------------------ matching */

/**
 * Pick a property for one of our hotels.
 *
 * ⚠ AMBIGUITY IS LEFT UNRESOLVED, NEVER GUESSED — the 8/5 pt. 8 duplicate-profile
 * ruling applied to buildings. Two candidates whose names both match ours is two
 * different hotels until a human says otherwise, and the wrong one is a fan at
 * the wrong address.
 */
function chooseMatch(hotel, candidates) {
  const want = norm(hotel.name);
  const exact = candidates.filter((c) => norm(c.name) === want);
  if (exact.length === 1) return { status: "matched", property: exact[0], how: "exact name" };
  if (exact.length > 1) return { status: "ambiguous", candidates: exact, how: `${exact.length} exact-name matches` };

  // Every word of our name present in theirs (handles "Home2 Suites Raleigh-Durham
  // Airport" vs "Home2 Suites by Hilton Raleigh Durham Airport").
  const words = want.split(" ").filter((w) => w.length > 2);
  const contains = candidates.filter((c) => {
    const got = norm(c.name);
    return words.every((w) => got.includes(w));
  });
  if (contains.length === 1) return { status: "matched", property: contains[0], how: "name subset" };
  if (contains.length > 1) return { status: "ambiguous", candidates: contains, how: `${contains.length} subset matches` };
  return { status: "unmatched", candidates, how: candidates.length ? `${candidates.length} nearby, none matched` : "no results" };
}

/* --------------------------------------------------------------------- write */

function writeMap(entries) {
  const src = fs.readFileSync(ENGINE_TS, "utf8");
  const marker = /const ENGINE_PROPERTY_BY_HOTEL: Record<string, string> = \{[\s\S]*?\};/;
  if (!marker.test(src)) throw new Error("ENGINE_PROPERTY_BY_HOTEL not found in lib/engine.ts");
  const body = entries.length
    ? "{\n" +
      entries
        .map(([k, v, name]) => `  // ${name}\n  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
        .join("\n") +
      "\n}"
    : "{}";
  fs.writeFileSync(
    ENGINE_TS,
    src.replace(marker, `const ENGINE_PROPERTY_BY_HOTEL: Record<string, string> = ${body};`),
  );
}

/* ---------------------------------------------------------------------- main */

async function main() {
  if (LIST) {
    const rows = [...(await feedHotels()), ...(INCLUDE_GUIDES ? guideHotels() : [])];
    const seen = new Map();
    for (const h of rows) if (!seen.has(norm(h.name))) seen.set(norm(h.name), h);
    const unique = [...seen.values()];

    console.log(
      `${unique.length} hotel(s) need an Engine property ID` +
        `${INCLUDE_GUIDES ? " (including the static guide hotels)" : " (published blocks only; add --include-guides for the rest)"}\n`,
    );
    for (const h of unique) {
      console.log(`  ${h.name}`);
      console.log(`      where:  ${h.query}`);
      console.log(`      source: ${h.source}`);
      console.log(`      key:    ${JSON.stringify(norm(h.name))}`);
    }

    console.log("\n--- paste into ENGINE_PROPERTY_BY_HOTEL in lib/engine.ts ---");
    console.log("// Property IDs read from members.engine.com/properties/<ID> while signed in.");
    console.log("// Add only the hotels you actually looked up — a missing line renders no");
    console.log("// link, which is the correct fallback; a wrong line sends a fan to the");
    console.log("// wrong building.");
    for (const h of unique) {
      console.log(`  // ${h.name} — ${h.query}`);
      console.log(`  // ${JSON.stringify(norm(h.name))}: "P0000000000000000000",`);
    }
    process.exit(0);
  }

  if (WRITE && API_ENV === "sandbox" && !ALLOW_SANDBOX) {
    console.error(
      "REFUSING TO WRITE: ENGINE_API_ENV=sandbox.\n\n" +
        "The deep links this map feeds point at members.engine.com, which is the\n" +
        "PRODUCTION consumer site. A sandbox property ID may name a building that\n" +
        "does not exist there, so a fan would click a hotel's name and land\n" +
        "somewhere else. Get production credentials, or pass --allow-sandbox if you\n" +
        "are only testing the matcher.",
    );
    process.exit(1);
  }

  const hotels = [...(await feedHotels()), ...(INCLUDE_GUIDES ? guideHotels() : [])];
  // One row per distinct hotel name; the same building recurs across seasons.
  const seen = new Map();
  for (const h of hotels) if (!seen.has(norm(h.name))) seen.set(norm(h.name), h);
  const unique = [...seen.values()];

  console.log(`Engine property resolution — ${unique.length} hotels, env=${API_ENV || "unset"}\n`);

  const matched = [];
  const ambiguous = [];
  const unmatched = [];

  for (const h of unique) {
    let candidates;
    try {
      candidates = await searchProperties(h.query);
    } catch (e) {
      console.error(`\nAPI UNREACHABLE at ${h.name}: ${e.code || e.message}`);
      if (e.code === "ECONNRESET") {
        console.error(
          "\nEvery HTTP/2 stream to partner-api.engine.com is reset immediately. Not a\n" +
            "code fault — the failure point was measured (8/19):\n" +
            "\n" +
            "  DNS resolves to 3 addresses; TCP :443 connects.\n" +
            "  TLS HANDSHAKE SUCCEEDS: authorized=true, server CN=partner-api.engine.com,\n" +
            "    negotiating both h2 and http/1.1, with AND without our client cert.\n" +
            "  Then every stream resets in ~150ms, identically for GET and POST, the real\n" +
            "    path and a deliberately bogus one, plain REST and gRPC framing\n" +
            "    (content-type: application/grpc), cert present and cert absent.\n" +
            "  HTTP/2 to www.google.com and engine.com from this machine returns 200.\n" +
            "\n" +
            "So it is NOT an egress-IP block (TCP and TLS both complete), NOT a rejected\n" +
            "or expired certificate (clean handshake, cert in date to Aug 2027), and NOT\n" +
            "wrong protocol framing (a gRPC listener answers an unknown method with\n" +
            "HTTP 200 + grpc-status=12, not a reset). Something terminates our requests\n" +
            "after TLS and before routing.\n" +
            "\n" +
            "Ask Engine: is this sandbox certificate activated for partner-api, and is\n" +
            "the account entitled to ContentService? Quote the reset-after-handshake\n" +
            "detail — it rules out the allowlist answer they will reach for first.\n" +
            "\n" +
            "The property map does not need this API:  npm run engine:properties -- --list",
        );
      }
      process.exit(2);
    }
    const result = chooseMatch(h, candidates);
    if (result.status === "matched") {
      matched.push([norm(h.name), result.property.id, h.name]);
      console.log(`  MATCHED    ${h.name}\n             ${result.property.id} · ${result.property.name} (${result.how})`);
    } else if (result.status === "ambiguous") {
      ambiguous.push(h);
      console.log(`  AMBIGUOUS  ${h.name} — ${result.how}, left unresolved`);
      for (const c of result.candidates) console.log(`             ${c.id} · ${c.name}`);
    } else {
      unmatched.push(h);
      console.log(`  UNMATCHED  ${h.name} — ${result.how}`);
      if (VERBOSE) for (const c of candidates) console.log(`             ${c.id} · ${c.name}`);
    }
  }

  console.log(
    `\n${matched.length} matched · ${ambiguous.length} ambiguous · ${unmatched.length} unmatched`,
  );

  if (!WRITE) {
    console.log("\nReport only — nothing written. Re-run with --write to update lib/engine.ts.");
    process.exit(0);
  }
  writeMap(matched);
  console.log(`\nWrote ${matched.length} entries to lib/engine.ts.`);
  process.exit(0);
}

// ⚠ process.exit(), never process.exitCode — the latter tripped a libuv
// assertion on Windows and exited 127 on a clean pass (see audit-asia-links, 8/6).
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
