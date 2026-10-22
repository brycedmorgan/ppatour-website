/**
 * Mirror every Pickleball Central paddle photo into public/ so the Paddle Lab
 * (and pickleball.com, which builds from these files) stops hotlinking PBC.
 *
 *   node scripts/mirror-pbc-images.mjs
 *
 * ⚠ WHY: the catalogue's `image` pointed at cdn11.bigcommerce.com. PBC moves to
 * Shopify on Mon 18 Jan 2027 and every one of those URLs dies at cutover —
 * ~480 paddle pages would fall back to the brand tile overnight.
 *
 * Writes public/ppa/paddles/pbc/<pbc-url-slug>.<ext> and rewrites each
 * product's `image` in lib/data/pbc-paddle-catalog.json to that local path,
 * keeping the original in `sourceImage`. Idempotent: files already on disk are
 * not re-downloaded. Run after a crawl (`npm run lab:pbc:crawl` does), then the
 * matcher copies the local path into paddle-pbc.json.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = join(ROOT, "lib/data/pbc-paddle-catalog.json");
const DIR = join(ROOT, "public/ppa/paddles/pbc");
const WEB = "/ppa/paddles/pbc";
const UA = "Mozilla/5.0 (compatible; ppatour-paddle-lab/1.0; +https://www.ppatour.com/paddle-lab/)";

mkdirSync(DIR, { recursive: true });
const cat = JSON.parse(readFileSync(CATALOG, "utf8"));

const slugOf = (url) => url.replace(/\/+$/, "").split("/").pop().toLowerCase().replace(/[^a-z0-9-]/g, "-");

let fetched = 0, kept = 0, failed = [];
const queue = cat.products.filter((p) => p.image || p.sourceImage);
async function one(p) {
  const src = p.sourceImage || p.image;
  if (!/^https?:\/\//.test(src)) { kept++; return; }
  const ext = (src.match(/\.(jpe?g|png|webp)(\?|$)/i)?.[1] || "jpg").toLowerCase().replace("jpeg", "jpg");
  const file = `${slugOf(p.url)}.${ext}`;
  if (!existsSync(join(DIR, file))) {
    const res = await fetch(src, { headers: { "user-agent": UA } }).catch(() => null);
    if (!res?.ok) { failed.push(`${p.url} (${res?.status ?? "network"})`); return; }
    writeFileSync(join(DIR, file), Buffer.from(await res.arrayBuffer()));
    fetched++;
  } else kept++;
  p.sourceImage = src;
  p.image = `${WEB}/${file}`;
}
for (let i = 0; i < queue.length; i += 8) await Promise.all(queue.slice(i, i + 8).map(one));

writeFileSync(CATALOG, JSON.stringify(cat, null, 2) + "\n");
console.log(`mirrored ${fetched} new, ${kept} already local, ${failed.length} failed`);
if (failed.length) console.log(failed.join("\n"));
