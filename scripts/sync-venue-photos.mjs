#!/usr/bin/env node
/**
 * Sync venue photography from Jackalope → this repo.
 *
 * Jackalope's Brand Photo Library (`ziff/brand-photos.js`) maps ~346 photos to
 * a venue id and a type. The bytes live in a PRIVATE Vercel Blob store, so the
 * public site can't hotlink them — we pull once, optimize, and commit.
 *
 *   node scripts/sync-venue-photos.mjs                 # every mapped venue
 *   node scripts/sync-venue-photos.mjs aag-mesa cary   # just these venues
 *
 * Writes:
 *   public/ppa/venues/<venue-id>/<type>-NN.jpg
 *   lib/data/venue-photos.json      (the manifest lib/venue-photos.ts reads)
 *
 * Requires BLOB_READ_WRITE_TOKEN for the Jackalope ("ziff") Blob store:
 *   cd ~/pickleball/ziff && vercel env pull .env.blob   # then export from there
 * The store is private and shared with travel/brand, so treat the token as a
 * secret — it is never committed and never shipped to the browser.
 *
 * Selection rules mirror how the site uses the photos: aerial + venue lead
 * (Connor: events lead with venue/aerial photography), crowd is capped, and
 * per-venue totals are capped so the repo doesn't balloon.
 */
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ZIFF_PHOTOS = path.resolve(ROOT, "../ziff/brand-photos.js");
const OUT_DIR = path.join(ROOT, "public/ppa/venues");
const MANIFEST = path.join(ROOT, "lib/data/venue-photos.json");

/** Types worth shipping to the public site, in gallery priority order. */
const TYPES = ["aerial", "venue", "featured", "vip", "box-suite", "cabana", "crowd"];
/** Per-venue caps — keeps the repo lean and the gallery tight. */
const CAP_BY_TYPE = { aerial: 6, venue: 6, featured: 4, vip: 2, "box-suite": 2, cabana: 2, crowd: 6 };
const LONG_EDGE = 2000; // plenty for a full-bleed hero; next/image resizes down

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

/** Parse the BRAND_PHOTOS rows out of Jackalope's brand-photos.js. */
async function readLibrary() {
  if (!existsSync(ZIFF_PHOTOS)) {
    fail(`Can't find Jackalope's photo library at ${ZIFF_PHOTOS}.\n  Clone Gull-Stack/ziff next to this repo and retry.`);
  }
  const src = await readFile(ZIFF_PHOTOS, "utf8");
  const rows = [];
  const re = /\{\s*url:'([^']+)'\s*,\s*type:'([^']+)'\s*,\s*venue:'([^']+)'\s*,\s*event:"([^"]*)"\s*(?:,\s*caption:'([^']*)')?\s*(?:,\s*credit:'([^']*)')?/g;
  let m;
  while ((m = re.exec(src))) {
    // url is the in-app proxy: /api/photos/file?p=<encoded blob pathname>
    const q = m[1].split("?p=")[1];
    if (!q) continue;
    rows.push({
      pathname: decodeURIComponent(q),
      type: m[2],
      venue: m[3],
      event: m[4] || "",
      caption: m[5] || "",
      credit: m[6] || "PPA Tour",
    });
  }
  return rows;
}

/** Pick the shots to ship for one venue, honoring the per-type caps. */
function select(rows) {
  const out = [];
  for (const type of TYPES) {
    const cap = CAP_BY_TYPE[type] ?? 0;
    out.push(...rows.filter((r) => r.type === type).slice(0, cap));
  }
  return out;
}

async function main() {
  const only = new Set(process.argv.slice(2));
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    fail(
      "BLOB_READ_WRITE_TOKEN is not set — the Jackalope photo store is private.\n" +
        "  cd ~/pickleball/ziff && vercel env pull .env.blob\n" +
        "  export BLOB_READ_WRITE_TOKEN=$(grep BLOB_READ_WRITE_TOKEN ~/pickleball/ziff/.env.blob | cut -d= -f2- | tr -d '\"')\n" +
        "  node scripts/sync-venue-photos.mjs",
    );
  }

  const [{ head }, sharp] = await Promise.all([
    import("@vercel/blob"),
    import("sharp").then((m) => m.default).catch(() => null),
  ]);
  if (!sharp) fail("sharp is required to optimize the photos: npm i -D sharp");

  const library = await readLibrary();
  const venues = [...new Set(library.map((r) => r.venue))].filter(
    (v) => !only.size || only.has(v),
  );
  if (!venues.length) fail(`No venues matched ${[...only].join(", ")}.`);

  const manifest = existsSync(MANIFEST)
    ? JSON.parse(await readFile(MANIFEST, "utf8"))
    : {};

  for (const venue of venues) {
    const picks = select(library.filter((r) => r.venue === venue));
    if (!picks.length) {
      console.log(`· ${venue}: nothing to sync`);
      continue;
    }
    const dir = path.join(OUT_DIR, venue);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    const entries = [];
    const seq = {};
    for (const p of picks) {
      try {
        // head() resolves a private blob to a short-lived downloadUrl.
        const meta = await head(p.pathname, { token });
        const res = await fetch(meta.downloadUrl ?? meta.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());

        seq[p.type] = (seq[p.type] ?? 0) + 1;
        const file = `${p.type}-${String(seq[p.type]).padStart(2, "0")}.jpg`;
        await sharp(buf)
          .rotate()
          .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 82, mozjpeg: true })
          .toFile(path.join(dir, file));

        entries.push({
          src: `/ppa/venues/${venue}/${file}`,
          type: p.type,
          caption: p.caption || p.event,
          credit: p.credit,
        });
      } catch (err) {
        console.warn(`  ! ${venue}/${p.pathname}: ${err.message}`);
      }
    }

    if (entries.length) {
      manifest[venue] = entries;
      console.log(`✓ ${venue}: ${entries.length} photos`);
    } else {
      delete manifest[venue];
      await rm(dir, { recursive: true, force: true });
      console.log(`· ${venue}: 0 downloaded`);
    }
  }

  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`);
  const total = Object.values(sorted).reduce((n, v) => n + v.length, 0);
  console.log(`\nManifest: ${Object.keys(sorted).length} venues · ${total} photos → lib/data/venue-photos.json`);
}

main().catch((e) => fail(e.stack ?? String(e)));
