#!/usr/bin/env node
/**
 * Import venue photography from the per-event photo zips into this repo.
 *
 * Bryce 7/28: "I gave you a ton of photos for this event" — the official event
 * zips (the same source that fed Jackalope's Brand Photo Library) sit in
 * ~/Downloads. This reads them directly, so we don't need Blob credentials to
 * get real venue shots onto the site.
 *
 *   node scripts/import-venue-photos.mjs                # every mapped zip
 *   node scripts/import-venue-photos.mjs brookhaven     # one venue
 *
 * Writes the same outputs as scripts/sync-venue-photos.mjs (the Jackalope Blob
 * path), so the two are interchangeable and the site reads one manifest:
 *   public/ppa/venues/<venue-id>/<type>-NN.jpg
 *   lib/data/venue-photos.json
 *
 * Selection follows the standing rule for this library: venue and aerial lead
 * (they're what a ticket buyer and a sponsor actually want to see), crowd is
 * capped, and player/sponsor/junior folders are skipped — those aren't venue
 * photography.
 */
import { readFile, writeFile, mkdir, rm, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, "..");
const ZIP_DIR = path.join(os.homedir(), "Downloads");
const OUT_DIR = path.join(ROOT, "public/ppa/venues");
const MANIFEST = path.join(ROOT, "lib/data/venue-photos.json");

/** Event photo zip → Jackalope venue id (see lib/venue-photos.ts for the
 *  venue id → event slug half of the join). */
const ZIP_TO_VENUE = [
  ["01 THE MASTERS", "mission-hills-ca", "Carvana Pickleball Masters"],
  ["02 DESERT RIDGE OPEN", "jw-desert-ridge", "Desert Ridge Open"],
  ["03 MESA ARIZONA CUP", "aag-mesa", "Arizona Athletic Grounds · Mesa"],
  ["04 INDOOR USA CHAMPIONSHIP", "lt-lakeville-mn", "Life Time Lakeville"],
  ["05 AUSTIN OPEN", "elevation-lakeway-tx", "Elevation Athletic Club · Lakeway"],
  ["06 NORTH CAROLINA CUP", "cary", "Cary Tennis Park"],
  ["07 HOUSTON OPEN", "lt-houston", "Life Time Houston"],
  ["18 PICKLEBALL WORLD CHAMPIONSHIPS", "brookhaven", "Brookhaven Country Club"],
  ["22 MILWAUKEE OPEN", "baird-center-wi", "Baird Center · Milwaukee"],
  ["23 PPA TOUR FINALS", "lt-sanclemente", "Life Time Rancho San Clemente"],
];

/** Folders that are not venue photography. */
const SKIP_DIR = /sponsor|junior|player dinner|player photos|celebration|athlete/i;
const IS_IMAGE = /\.(jpe?g|png)$/i;

/** Classify a photo from its path — drone/aerial wins, then the folder. */
function classify(rel) {
  const p = rel.toLowerCase();
  if (/drone|aerial/.test(p)) return "aerial";
  if (/blvd|boulevard|activation/.test(p)) return "activation";
  if (/venue *& *crowd|crowd/.test(p)) return "crowd";
  if (/venue/.test(p)) return "venue";
  if (/best photos|top 10/.test(p)) return "featured";
  return null;
}

const CAP = { aerial: 6, venue: 8, featured: 4, activation: 3, crowd: 6 };
const ORDER = ["aerial", "venue", "featured", "activation", "crowd"];
const LONG_EDGE = 1800;

async function listZipEntries(zip) {
  const { stdout } = await run("unzip", ["-Z1", zip], { maxBuffer: 32 * 1024 * 1024 });
  return stdout.split("\n").filter((l) => IS_IMAGE.test(l) && !SKIP_DIR.test(l));
}

async function main() {
  const only = new Set(process.argv.slice(2));
  const sharp = await import("sharp").then((m) => m.default);
  const files = await readdir(ZIP_DIR);

  const manifest = existsSync(MANIFEST)
    ? JSON.parse(await readFile(MANIFEST, "utf8"))
    : {};

  for (const [prefix, venue, label] of ZIP_TO_VENUE) {
    if (only.size && !only.has(venue)) continue;
    const zipName = files.find((f) => f.startsWith(prefix) && f.endsWith(".zip"));
    if (!zipName) {
      console.log(`· ${venue}: no zip matching "${prefix}" in ${ZIP_DIR}`);
      continue;
    }
    const zip = path.join(ZIP_DIR, zipName);

    // Bucket by type, honoring the caps.
    const entries = await listZipEntries(zip);
    const picked = [];
    for (const type of ORDER) {
      const of = entries.filter((e) => classify(e) === type).sort();
      picked.push(...of.slice(0, CAP[type]).map((rel) => ({ rel, type })));
    }
    if (!picked.length) {
      console.log(`· ${venue}: nothing classified as venue photography`);
      continue;
    }

    const dir = path.join(OUT_DIR, venue);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    const out = [];
    const seq = {};
    for (const { rel, type } of picked) {
      try {
        // -p streams one entry to stdout without unpacking the whole archive.
        const { stdout } = await run("unzip", ["-p", zip, rel], {
          encoding: "buffer",
          maxBuffer: 256 * 1024 * 1024,
        });
        if (!stdout?.length) throw new Error("empty");
        seq[type] = (seq[type] ?? 0) + 1;
        const file = `${type}-${String(seq[type]).padStart(2, "0")}.jpg`;
        await sharp(stdout)
          .rotate()
          .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 76, mozjpeg: true })
          .toFile(path.join(dir, file));
        out.push({
          src: `/ppa/venues/${venue}/${file}`,
          type,
          caption: label,
          credit: "PPA Tour",
        });
      } catch (err) {
        console.warn(`  ! ${venue}/${rel}: ${err.message}`);
      }
    }

    if (out.length) {
      manifest[venue] = out;
      const by = ORDER.map((t) => `${out.filter((o) => o.type === t).length}${t[0]}`).join(" ");
      console.log(`✓ ${venue}: ${out.length} photos (${by})`);
    }
  }

  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`);
  const total = Object.values(sorted).reduce((n, v) => n + v.length, 0);
  console.log(`\nManifest: ${Object.keys(sorted).length} venues · ${total} photos`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
