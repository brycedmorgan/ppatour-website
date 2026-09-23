/**
 * Pull the hotels Engine holds near each tour venue and write the snapshot the
 * event pages read (`lib/data/engine-properties.json`).
 *
 * Usage:
 *   npx tsx scripts/engine-nearby.ts            # report only, writes nothing
 *   npx tsx scripts/engine-nearby.ts --write    # refresh the snapshot
 *   npx tsx scripts/engine-nearby.ts --radius 8 # miles, default 5
 *
 * ⚠ THE SANDBOX API LIVES ON ITS OWN HOSTNAME, AND POINTING AT THE WRONG ONE
 * LOOKS EXACTLY LIKE A BROKEN CERTIFICATE. `partner-api.engine.com` is
 * PRODUCTION; our mTLS pair is a SANDBOX credential and belongs to
 * `partner-api-sandbox.engine.com`. Sent to the production host it completes the
 * TLS handshake cleanly — the edge there never asks for a client certificate —
 * and then resets every HTTP/2 stream at ~130ms, identically for a real path and
 * a bogus one. That reads as "our cert is rejected" and it is not: the cert is
 * never examined. Confirmed 9/23 by calling the sandbox host with the same pair
 * and getting HTTP 200. `ENGINE_API_BASE_URL` in .env.local carries the host.
 *
 * ⚠ THE SEARCH IS CENTRED ON THE VENUE'S COORDINATES WHERE WE HOLD THEM, AND ON
 * ITS VERIFIED STREET ADDRESS OTHERWISE. `ContentService.ListProperties` accepts
 * either as the radius centre. Coordinates are preferred because they are exact
 * and reproducible — an address is re-geocoded by Engine on every run, so the
 * same query could quietly return a different centre if their geocoder changes.
 *
 * ⚠ A VENUE WITH NEITHER IS SKIPPED, NOT SEARCHED ON ITS CITY. Falling back to
 * "Las Vegas, NV" would centre a 5-mile radius on a downtown that is nowhere near
 * the courts and list hotels a fan cannot walk to, with nothing on the page
 * looking wrong. Same rule as everywhere else here: no data beats wrong data.
 */
import { readFileSync, writeFileSync } from "node:fs";
import http2 from "node:http2";
import { VENUE_LOCATIONS } from "../lib/venue-locations";
import { getMainTourEvents } from "../lib/placeholder-data";

const SNAPSHOT = "lib/data/engine-properties.json";

function env(): Record<string, string> {
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .filter((l) => l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
  );
}

/**
 * The amenities worth a chip, in the order they should read.
 *
 * ⚠ CURATED, AND ORDERED BY WHAT A FAN DRIVING TO A TOURNAMENT ACTUALLY ASKS.
 * Engine lists up to twelve per hotel — air conditioning and high-speed internet
 * among them, which in 2026 tell nobody anything. Free parking is first because
 * it is the one that decides where somebody stays when they are driving to a
 * venue with a paid lot. Anything not on this list is dropped rather than
 * truncated, so the chips are the same kind of fact on every row.
 */
const AMENITY_KEEP = [
  "LODGING_AMENITY_CODE_FREE_PARKING",
  "LODGING_AMENITY_CODE_FREE_BREAKFAST",
  "LODGING_AMENITY_CODE_FREE_AIRPORT_SHUTTLE",
  "LODGING_AMENITY_CODE_SWIMMING_POOL",
  "LODGING_AMENITY_CODE_FITNESS_CENTER",
  "LODGING_AMENITY_CODE_PET_FRIENDLY",
  "LODGING_AMENITY_CODE_ELECTRIC_VEHICLE_CHARGING",
];

type RawProperty = {
  property?: {
    id?: string;
    name?: string;
    physicalAddress?: {
      addressLine?: string[];
      locality?: string;
      administrativeArea?: string;
    };
    heroImageUri?: string;
    starRating?: string;
    amenities?: { amenityName?: string; amenityCode?: string }[];
  };
  distance?: { value?: number; unit?: string };
};

function get(host: string, path: string, cert: string, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(`https://${host}`, { cert, key });
    let body = "";
    const fail = (e: Error) => {
      try { client.close(); } catch { /* already closed */ }
      reject(e);
    };
    const timer = setTimeout(() => fail(new Error("timeout")), 30_000);
    client.on("error", fail);
    const req = client.request({ ":method": "GET", ":path": path });
    req.setEncoding("utf8");
    req.on("data", (d) => (body += d));
    req.on("error", fail);
    req.on("end", () => {
      clearTimeout(timer);
      try { client.close(); } catch { /* already closed */ }
      try { resolve(JSON.parse(body)); } catch { reject(new Error(body.slice(0, 200))); }
    });
    req.end();
  });
}

async function main() {
  const e = env();
  const host = (e.ENGINE_API_BASE_URL || "").replace(/^https:\/\//, "");
  const cert = Buffer.from(e.ENGINE_CLIENT_CERT || "", "base64").toString();
  const key = Buffer.from(e.ENGINE_CLIENT_KEY || "", "base64").toString();
  if (!host || !cert || !key) throw new Error("ENGINE_API_BASE_URL / ENGINE_CLIENT_CERT / ENGINE_CLIENT_KEY missing from .env.local");

  const write = process.argv.includes("--write");
  const rIdx = process.argv.indexOf("--radius");
  const radiusMiles = rIdx > -1 ? Number(process.argv[rIdx + 1]) : 5;
  const engineEnv = host.includes("sandbox") ? "sandbox" : "production";

  console.log(`host ${host}  (${engineEnv})   radius ${radiusMiles} mi\n`);

  const events: Record<string, unknown> = {};
  let listed = 0;

  for (const t of getMainTourEvents()) {
    const loc = t.venue ? VENUE_LOCATIONS[t.venue] : undefined;
    const hasCoords = typeof loc?.latitude === "number" && typeof loc?.longitude === "number";
    if (!loc || (!hasCoords && !loc.streetAddress)) {
      console.log(`SKIP  ${t.slug} — no coordinates and no verified street address for "${t.venue ?? "(no venue)"}"`);
      continue;
    }
    const q = new URLSearchParams();
    let centre: string;
    if (hasCoords) {
      q.set("request.criteria.radius.coordinates.latitude", String(loc.latitude));
      q.set("request.criteria.radius.coordinates.longitude", String(loc.longitude));
      centre = `${loc.latitude}, ${loc.longitude} (venue coordinates)`;
    } else {
      q.set("request.criteria.radius.physicalAddress.addressLine", loc.streetAddress!);
      q.set("request.criteria.radius.physicalAddress.locality", loc.addressLocality);
      q.set("request.criteria.radius.physicalAddress.administrativeArea", loc.addressRegion);
      if (loc.postalCode) q.set("request.criteria.radius.physicalAddress.postalCode", loc.postalCode);
      q.set("request.criteria.radius.physicalAddress.countryCode", loc.addressCountry);
      centre = `${loc.streetAddress}, ${loc.addressLocality}, ${loc.addressRegion} (geocoded by Engine)`;
    }
    q.set("request.criteria.radius.radius.value", String(radiusMiles));
    q.set("request.criteria.radius.radius.unit", "DISTANCE_UNIT_MILE");
    q.set("request.criteria.sortMode", "PROPERTY_SORT_MODE_DISTANCE");
    q.set("request.criteria.excludePropertiesWithoutHeroImage", "true");
    // The "view all" modal shows every property in the snapshot, so pull a real
    // set rather than just enough for the four visible rows. 50 is Engine's
    // documented range (max 500) and keeps the committed file small.
    q.set("request.pageSize", "50");

    let res: { properties?: RawProperty[] };
    try {
      res = (await get(host, `/content/v1/property?${q}`, cert, key)) as { properties?: RawProperty[] };
    } catch (err) {
      console.log(`FAIL  ${t.slug} — ${(err as Error).message}`);
      continue;
    }

    const properties = (res.properties ?? [])
      .map((row) => {
        const p = row.property ?? {};
        if (!p.id || !p.name) return null;
        return {
          id: p.id,
          name: p.name,
          addressLine: p.physicalAddress?.addressLine?.[0],
          city: p.physicalAddress?.locality,
          region: p.physicalAddress?.administrativeArea,
          // The response's own distance, never recomputed here.
          distanceMiles:
            row.distance?.unit === "DISTANCE_UNIT_MILE" && typeof row.distance.value === "number"
              ? Number(row.distance.value.toFixed(2))
              : undefined,
          heroImageUri: p.heroImageUri,
          starRating: p.starRating,
          amenities: AMENITY_KEEP.map(
            (code) => (p.amenities ?? []).find((a) => a.amenityCode === code)?.amenityName,
          ).filter((n): n is string => !!n),
        };
      })
      .filter(Boolean);

    events[t.slug] = {
      venue: t.venue,
      searchedBy: centre,
      properties,
    };
    listed += properties.length;
    console.log(`OK    ${t.slug} — ${properties.length} properties near ${t.venue}  [${hasCoords ? "lat/lng" : "address"}]`);
  }

  console.log(`\n${Object.keys(events).length} events, ${listed} properties.`);
  if (!write) {
    console.log("Report only. Re-run with --write to refresh the snapshot.");
    return;
  }
  writeFileSync(
    SNAPSHOT,
    JSON.stringify(
      {
        _comment:
          "Generated by scripts/engine-nearby.ts. Do not hand-edit. The event pages ignore this file unless engineEnv matches ENGINE_ENV in lib/engine-booking.ts.",
        generatedAt: new Date().toISOString().slice(0, 10),
        engineEnv,
        radiusMiles,
        events,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Wrote ${SNAPSHOT}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
