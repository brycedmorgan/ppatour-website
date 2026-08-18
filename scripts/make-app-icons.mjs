/**
 * Home-screen icon set for the installable app (app/manifest.ts).
 *
 * Source is the square primary mark, `public/ppa/logos/ppa-primary-white.svg`,
 * composited on brand navy — a transparent PNG shows as a black square in the
 * iOS springboard and as a white one on Android.
 *
 * Two shapes, deliberately:
 *   · `icon-<n>.png`      — 88% mark. The "any" purpose icon.
 *   · `icon-maskable.png` — 62% mark. Android crops maskable icons to a circle
 *                           or squircle; anything outside the middle 80% is not
 *                           guaranteed to survive, so the mark sits well inside.
 *   · `apple-touch-icon`  — 180px, what iOS Add to Home Screen reads.
 *
 * Run: node scripts/make-app-icons.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const NAVY = { r: 0x0c, g: 0x2b, b: 0x44, alpha: 1 };
const SRC = "public/ppa/logos/ppa-primary-white.svg";
const OUT = "public/app-icons";

const svg = await readFile(SRC);

async function icon(size, scale, name) {
  const mark = Math.round(size * scale);
  const logo = await sharp(svg, { density: 600 })
    .resize(mark, mark, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const png = await sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
  await writeFile(`${OUT}/${name}`, png);
  console.log(`${OUT}/${name}  ${size}×${size}`);
}

await icon(192, 0.88, "icon-192.png");
await icon(512, 0.88, "icon-512.png");
await icon(512, 0.62, "icon-maskable-512.png");
await icon(180, 0.88, "apple-touch-icon.png");
