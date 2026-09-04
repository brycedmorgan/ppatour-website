/**
 * Europe player portraits → /public/europe/pros/<slug>.jpg
 *
 * Source: Katherina 'Catie' Preis's Drive folder "Euro Player Portrait Pictures".
 * The folder is NOT link-shared, so the files cannot be fetched by URL — they
 * are downloaded through a signed-in browser session and land in ~/Downloads
 * under the player's display name. This script maps those filenames onto the
 * roster slug and encodes them to the site's headshot standard.
 *
 * ⚠ THE FILENAME IS THE ONLY THING THAT SAYS WHO IS IN THE PICTURE, AND THAT IS
 * THE RULE, NOT A LIMITATION. Attribution comes from provenance — Catie named
 * the file, we map the name — never from looking at the frame. Most tour
 * photography is doubles and a wrong face on a player's own profile is a claim
 * about a person. Same rule as lib/athlete-heroes.ts.
 *
 * ⚠ THE MAP IS EXPLICIT AND MUST STAY THAT WAY. Fuzzy-matching a filename to a
 * roster name is how "Zoey Wang" became Chao Yi Wang in the paddle importer
 * (8/5 pt. 22). An unmapped file is REPORTED and skipped, never guessed at.
 *
 * Encoding matches /public/ppa/pros/: 700px square, centred horizontally,
 * biased to the upper third so the crop lands on the face, mozjpeg q80.
 *
 * Usage: node scripts/import-europe-portraits.mjs [sourceDir]
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const SRC = process.argv[2] ?? path.join(os.homedir(), "Downloads");
const OUT = path.join(process.cwd(), "public", "europe", "pros");
const SIZE = 700;

/** Catie's filename stem (no extension) → roster slug. */
const BY_FILE = {
  "Karolina Owczarek Portrait": "karolina-owczarek",
  "Theo Platel Portrait": "theo-platel",
  "Bartosz Karbownik Portrait": "bartosz-karbownik",
  "Molly O'Donoghue Portrait": "molly-odonoghue",
  "Mikolaj Biedermann Portrait": "mikolaj-biedermann",
  "Alberto Seccia Portrait": "alberto-seccia",
  "Raquel Amaro Portrait": "raquel-amaro",
  "Boris Paque Portrait": "boris-paque",
  "James Ling Portrait": "james-ling",
  "Ellie Tomkinson Portrait": "eleanor-tomkinson",
  "Cyril Peltier Portrait": "cyril-peltier",
  "Myriam Enmer Portrait": "myriam-enmer",
  "Hector Sanchez Portrait": "hector-sanchez-vidal-1",
  "Viktoria Kanichova Portrait (1)": "viktoria-kanichova",
  "Matteo Cugliari Portrait": "mat-teo",
  "Anna Marija Bukina Portrait": "anna-marija-bukina",
  "Arwid Dahlin Portrait": "arwid-dahlin",
  "Katie Morris Portrait": "katie-morris-3",
  "Krisztian Kaszoni Portrait": "krisztian-kaszoni",
  "Adrian Jimenez Portrait": "adrian-jimenez-pueyo",
  "Thaila Rodrigues Portrait": "thaila-rodrigues",
  "Marina Sicic Portrait": "marina-sicic",
  "Jesus Campos Portrait": "jesus-campos",
  "Giovanna Mandon Portrait": "giovanna-mandon",
};

/**
 * ⚠ TWO SOURCE FILES ARE NOT USABLE HEADSHOTS, AND BOTH WERE FOUND BY RENDERING
 * A CONTACT SHEET AND LOOKING AT IT — nothing in the pipeline could have caught
 * either. Build a contact sheet after any re-import.
 *
 * `Tom Protzek Portrait.jpg` is a PHONE SCREENSHOT OF A FILE VIEWER: 738x1600,
 * with a close button, a Share button and an Edit / Comment / Resize / Remove
 * toolbar around a small studio photo. Cropping the photo out of it would
 * publish an upscaled screenshot. He is on the WPR board and already resolves a
 * real pickleball.com headshot, so SKIPPING him is strictly better than shipping
 * this — the roster falls through to the live one. Remove him from this list the
 * day Catie sends the actual file.
 */
const SKIP = {
  "Tom Protzek Portrait":
    "phone screenshot of a file viewer, not a portrait — falls back to his live pickleball.com headshot",
};

/**
 * Per-player crop overrides, as fractions of the source frame.
 *
 * ⚠ FRAMING BY EYE IS FINE; IDENTITY BY EYE IS NOT. This map only decides where
 * the square sits, never who is in it — that still comes from the filename. See
 * the header note.
 *
 * `Ellie Tomkinson Portrait` is the one that needs it: a full-body action frame
 * on a court rather than a head-and-shoulders portrait, so the default
 * centred-square crop rendered her tiny inside a lot of empty court. `cx`/`cy`
 * are the subject's head, `scale` is the square's side as a fraction of the
 * frame's shorter edge.
 */
const CROP = {
  "Ellie Tomkinson Portrait": { cx: 0.55, cy: 0.19, scale: 0.59 },
};

fs.mkdirSync(OUT, { recursive: true });

const files = fs
  .readdirSync(SRC)
  .filter((f) => /portrait/i.test(f) && /\.(jpe?g|png)$/i.test(f));

let done = 0;
const missing = new Set(Object.values(BY_FILE));
const unmapped = [];
const skipped = [];

for (const file of files) {
  const stem = file.replace(/\.[^.]+$/, "");
  if (SKIP[stem]) {
    skipped.push(`${file} — ${SKIP[stem]}`);
    continue;
  }
  const slug = BY_FILE[stem];
  if (!slug) {
    unmapped.push(file);
    continue;
  }
  const src = path.join(SRC, file);
  const img = sharp(src).rotate();
  const meta = await img.metadata();
  const o = CROP[stem];
  const side = Math.round(
    o ? Math.min(meta.width, meta.height) * o.scale : Math.min(meta.width, meta.height),
  );
  // Default: centred horizontally, biased to the upper third vertically so a
  // full-body or three-quarter portrait crops to the face rather than the torso.
  // An override centres the square on the subject's head instead.
  const clamp = (v, max) => Math.round(Math.min(Math.max(v, 0), max));
  const left = o
    ? clamp(o.cx * meta.width - side / 2, meta.width - side)
    : clamp((meta.width - side) / 2, meta.width - side);
  const top = o
    ? clamp(o.cy * meta.height - side * 0.38, meta.height - side)
    : clamp((meta.height - side) * 0.18, meta.height - side);
  const out = path.join(OUT, `${slug}.jpg`);
  await img
    .extract({ left, top, width: side, height: side })
    .resize(SIZE, SIZE, { fit: "cover" })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(out);
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`  ${slug}.jpg  ${meta.width}x${meta.height} -> ${SIZE}px  ${kb} KB`);
  missing.delete(slug);
  done++;
}

console.log(`\n${done} portraits written to public/europe/pros/`);
if (skipped.length) {
  console.log(`\n⚠ ${skipped.length} file(s) deliberately SKIPPED:`);
  for (const f of skipped) console.log(`   ${f}`);
}
if (unmapped.length) {
  console.log(`\n⚠ ${unmapped.length} file(s) matched no roster slug and were SKIPPED:`);
  for (const f of unmapped) console.log(`   ${f}`);
}
if (missing.size) {
  console.log(`\n⚠ ${missing.size} roster slug(s) have no portrait:`);
  for (const s of missing) console.log(`   ${s}`);
}
