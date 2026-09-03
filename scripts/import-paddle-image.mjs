/**
 * Turn a Pickleball Central product photo into a transparent-background PNG for
 * the "In the Bag" callout on a player profile.
 *
 * The callout sits inside the light Quick Info rail, and PBC's product shots are
 * a paddle on a solid white JPEG canvas. Dropped in as-is, every paddle reads as
 * a white rectangle sitting on the page. Knocking the background out is what
 * makes it look like the paddle is ON the profile rather than pasted onto it.
 *
 *   node scripts/import-paddle-image.mjs \
 *     --url https://www.pickleballcentral.com/franklin-c45-hybrid-14mm-pickleball-paddle/ \
 *     --slug franklin-c45-hybrid
 *
 * Writes public/ppa/paddles/<slug>.png and prints the lib/paddle-images.ts entry
 * to paste in (the map is hand-kept on purpose — see that file's header).
 *
 * ⚠ THE BACKGROUND IS REMOVED BY FLOOD FILL FROM THE EDGES, NOT BY A WHITE
 * THRESHOLD. A threshold would punch holes through every white letter on the
 * paddle face — "Franklin", the 14MM stamp, the UPA-A certification mark. Only
 * white that is reachable from the border without crossing the paddle is
 * removed, so enclosed white stays.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/** Distance from pure white, per channel, still counted as background. JPEG ringing
 *  around a dark paddle lifts the neighbouring white a few levels, so 0 is too tight. */
const BG_TOLERANCE = 18;
/** Longest edge of the written PNG. The callout renders it ~112px wide, so this is
 *  comfortably 2x for retina without shipping a 1000px asset for a thumbnail. */
const OUT_MAX = 480;

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : null;
}

async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res;
}

/** The product page's og:image, upgraded from PBC's 386px card variant to 1280px. */
async function productImageUrl(pageUrl) {
  const html = await (await get(pageUrl)).text();
  const m = html.match(/<meta property="og:image" content="([^"]+)"/i);
  if (!m) throw new Error(`no og:image on ${pageUrl}`);
  return m[1]
    .replace(/\.\d+\.\d+\.(jpg|jpeg|png)(\?|$)/i, ".1280.1280.$1$2")
    .replace(/&amp;/g, "&");
}

/**
 * Flood fill the background to alpha 0, starting from every border pixel.
 * Iterative stack, not recursion — a 1280² image overflows the call stack.
 */
function knockOutBackground(data, width, height) {
  const isBg = (i) =>
    data[i] >= 255 - BG_TOLERANCE &&
    data[i + 1] >= 255 - BG_TOLERANCE &&
    data[i + 2] >= 255 - BG_TOLERANCE;

  const seen = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) {
    stack.push(x, (height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    stack.push(y * width, y * width + width - 1);
  }

  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    const i = p * 4;
    if (!isBg(i)) continue;
    seen[p] = 1;
    data[i + 3] = 0;
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) stack.push(p - 1);
    if (x < width - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - width);
    if (y < height - 1) stack.push(p + width);
  }
  return seen;
}

/**
 * Tight crop to what survived. PBC pads every shot to a square canvas, so without
 * this the paddle renders small inside a mostly-empty box and the different
 * products all sit at different visual sizes.
 */
function contentBox(data, width, height) {
  let top = height, left = width, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] === 0) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  if (right < 0) throw new Error("nothing left after background removal");
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function main() {
  const slug = arg("slug");
  const pageUrl = arg("url");
  const filePath = arg("file");
  if (!slug || (!pageUrl && !filePath)) {
    console.error("usage: --url <pbc product url> --slug <output-slug>");
    console.error("   or: --file <local image path> --slug <output-slug>");
    process.exitCode = 1;
    return;
  }

  /**
   * ⚠ `--file` EXISTS BECAUSE NOT EVERY PADDLE IS SOLD ON PICKLEBALL CENTRAL.
   * A brand the tour has no retail relationship with hands art over directly
   * (MEHAU did, for the S5 AIRPOOM) and there is no product page here to scrape
   * an og:image from. Everything after this point is identical either way —
   * including the "is this actually a white-background product shot" guard,
   * which is the part that must not be skipped for supplied art.
   */
  let buf;
  if (filePath) {
    console.log(`source  ${filePath}`);
    buf = await readFile(filePath);
  } else {
    const imgUrl = await productImageUrl(pageUrl);
    console.log(`source  ${imgUrl}`);
    buf = Buffer.from(await (await get(imgUrl)).arrayBuffer());
  }

  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const removed = knockOutBackground(data, info.width, info.height);

  /**
   * ⚠ REFUSE A SOURCE THAT ISN'T A WHITE-BACKGROUND PRODUCT SHOT.
   *
   * Some listings lead with a lifestyle photo — the CRBN TruFoam Barrage 4 is a
   * paddle on an orange studio backdrop, next to its cover. Flood fill finds no
   * white to remove, writes a fully opaque rectangle, and the profile publishes
   * a coloured box with someone else's art direction in it. That failed
   * SILENTLY the first time, which is the part worth guarding. A real cut-out
   * removes a third of the canvas or more; anything under this is not one.
   */
  const cleared = removed.reduce((n, v) => n + v, 0) / (info.width * info.height);
  if (cleared < 0.2) {
    throw new Error(
      `only ${(cleared * 100).toFixed(1)}% of the canvas was background — this ` +
        `listing's lead photo is not a white-background product shot. Find a ` +
        `product image on the listing, or leave the paddle without one.`,
    );
  }

  const box = contentBox(data, info.width, info.height);

  const out = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract(box)
    .resize({
      width: OUT_MAX,
      height: OUT_MAX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer({ resolveWithObject: true });

  const dir = path.join(process.cwd(), "public", "ppa", "paddles");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${slug}.png`);
  await writeFile(file, out.data);

  console.log(`wrote   public/ppa/paddles/${slug}.png`);
  console.log(`        ${out.info.width}x${out.info.height}, ${(out.data.length / 1024).toFixed(1)} KB`);
  console.log("\nlib/paddle-images.ts entry:\n");
  console.log(
    `  "<normalized paddle name>": { src: "/ppa/paddles/${slug}.png", width: ${out.info.width}, height: ${out.info.height} },`,
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
