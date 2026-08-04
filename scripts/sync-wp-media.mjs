/**
 * Rehosts every asset the migrated WordPress archive depends on, off the WP
 * install and onto this project's Vercel Blob store.
 *
 * WHY THIS IS LAUNCH-BLOCKING: the 811 imported posts reference 1,734 assets
 * under ppatour.com/wp-content. Those URLs work today only because the
 * WordPress site is up, and they DIE AT CUTOVER when this site takes the
 * ppatour.com domain. Nothing on the page layer changes here — every render
 * path goes through `resolveAsset()` / `resolveLink()` in lib/wp-media.ts, so
 * this script only has to populate `lib/data/wp-media-map.json`.
 *
 * Three asset classes, and missing the third is an easy mistake:
 *   featured  777  post hero images (rendered via next/image)
 *   inline    776  <img> inside post bodies
 *   document  181  PDFs/video linked by <a href> — 180 tournament-draw PDFs
 *                  across the Draw Reveal series. NOT captured by an <img>
 *                  scan, so the first pass reported a false 100% PASS.
 *
 * Actual result (2026-07-29): 890 MB fetched → 187.6 MB stored for the images
 * (79% smaller), plus 46 MB of documents stored byte-for-byte.
 *
 * Design notes:
 *  - Featured images render through next/image (which resizes), so they keep
 *    headroom at 2000px. Inline body images CANNOT — they're plain <img> inside
 *    dangerouslySetInnerHTML — so whatever is stored is what ships to the
 *    browser, hence the tighter 1400px cap.
 *  - The transcode is only kept when it's actually smaller. Re-encoding the 207
 *    already-webp sources inflates them (one measured 224 KB → 232 KB).
 *  - Deterministic blob keys + incremental map writes make the job idempotent
 *    and resumable; a partial run degrades per-image because resolveAsset()
 *    falls back to the original URL.
 *
 * Usage:
 *   node scripts/sync-wp-media.mjs --dry-run [--limit 30]   # no token needed
 *   node scripts/sync-wp-media.mjs                          # real sync
 *   node scripts/sync-wp-media.mjs --verify                 # cutover gate
 *   node scripts/sync-wp-media.mjs --force                  # re-do mapped ones
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
/**
 * Both migrated archives. blog-posts.json joined the sweep on 2026-08-04 when
 * the 39 PPA Blog posts were imported — their 64 assets sit under the same
 * doomed ppatour.com/wp-content paths as everything else and die at cutover
 * identically. Same map, same blob store, same `resolveAsset()` on the render
 * side; nothing else in this script had to change.
 */
const POST_FILES = [
  path.join(ROOT, "lib/data/news-posts.json"),
  path.join(ROOT, "lib/data/blog-posts.json"),
];
const MAP = path.join(ROOT, "lib/data/wp-media-map.json");
/**
 * Upstream URLs that return 404 on the WordPress site itself — already-broken
 * links we inherited, not something the migration caused. Recorded so the
 * cutover gate can reach PASS honestly (it reports the count rather than
 * hiding it) and so the renderer can unwrap the dead links instead of shipping
 * a click-through to a 404. Only a hard 404 lands here; timeouts and 5xx stay
 * failures to be retried.
 */
const DEAD = path.join(ROOT, "lib/data/wp-dead-assets.json");

/**
 * Next loads `.env.local` automatically; a bare `node scripts/…` does not. Load
 * it here so the token is picked up however this is invoked. Ignored when the
 * file is absent (CI passes real env vars instead).
 */
try {
  process.loadEnvFile(path.join(ROOT, ".env.local"));
} catch {
  /* no .env.local — rely on the ambient environment */
}

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const numOf = (f, d) => {
  const i = argv.indexOf(f);
  return i === -1 ? d : Number(argv[i + 1]) || d;
};

const DRY = has("--dry-run");
const VERIFY = has("--verify");
const FORCE = has("--force");
const LIMIT = numOf("--limit", Infinity);
const CONCURRENCY = numOf("--concurrency", 5);

/** Long-edge caps. Featured is resized again by next/image; inline is not. */
const CAP = { featured: 2000, inline: 1400 };
const QUALITY = 78;

/**
 * Only hosts that STOP SERVING at cutover need rehosting. `images.pickleball.com`
 * is a sibling-company CDN that survives the domain move (and is already
 * allowlisted in next.config), so rehosting it would be pointless churn — and
 * would make the --verify gate demand work that isn't needed.
 */
const DOOMED_HOSTS = new Set(["ppatour.com", "www.ppatour.com"]);

/* ─────────────────────────── asset inventory ─────────────────────────── */

/**
 * Every image the archive actually references, deduped, each tagged with the
 * largest cap it needs (an image used as both a hero and inline gets
 * `featured`).
 */
function inventory() {
  const posts = POST_FILES.flatMap((f) => JSON.parse(readFileSync(f, "utf8")));
  const assets = new Map(); // url -> { url, kind, posts:Set }
  const note = (url, kind, slug) => {
    if (!url) return;
    let host;
    try {
      host = new URL(url).host;
    } catch {
      return;
    }
    if (!DOOMED_HOSTS.has(host)) return;
    const prev = assets.get(url);
    if (prev) {
      // featured wins over inline (bigger cap); document never re-labels.
      if (kind === "featured" && prev.kind !== "document") prev.kind = "featured";
      prev.posts.add(slug);
      return;
    }
    assets.set(url, { url, kind, posts: new Set([slug]) });
  };
  for (const p of posts) {
    if (p.image?.url) note(p.image.url, "featured", p.slug);
    for (const src of p.inlineImages ?? []) note(src, "inline", p.slug);
    // Non-image assets linked from the body — 180 tournament-draw PDFs across
    // the Draw Reveal series, plus a video. These are NOT in `inlineImages`
    // (which only captures <img src>) and die at cutover just like the images.
    for (const m of (p.bodyHtml ?? "").matchAll(/<a[^>]+href="([^"]+)"/gi)) {
      if (m[1].includes("/wp-content/")) note(m[1], "document", p.slug);
    }
  }
  return [...assets.values()];
}

function loadMap() {
  try {
    return JSON.parse(readFileSync(MAP, "utf8"));
  } catch {
    return {};
  }
}

/* ───────────────────────────── key naming ───────────────────────────── */

/**
 * `…/wp-content/uploads/2023/07/My Photo.jpg` → `wp/2023/07/my-photo.webp`.
 * Deterministic so re-runs overwrite rather than duplicate. WP filenames carry
 * oddities (spaces, double extensions like `DSC_2542_600x600.jpg.webp`).
 */
function blobKey(url, ext) {
  const { pathname } = new URL(url);
  const after = pathname.split("/wp-content/uploads/")[1] ?? pathname.replace(/^\//, "");
  const dir = path.posix.dirname(after);
  const base = path.posix
    .basename(after)
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
  return `wp/${dir === "." ? "" : dir + "/"}${base || "asset"}.${ext}`;
}

/**
 * WP keeps the full-size original alongside every `-1024x683` derivative. For
 * hero images that derivative is a hard quality cap, so try the original first
 * and fall back. 233 of the referenced URLs are derivatives.
 */
function originalCandidate(url) {
  const m = url.match(/^(.*)-\d{2,4}x\d{2,4}(\.[a-z0-9]+)$/i);
  return m ? `${m[1]}${m[2]}` : null;
}

/* ───────────────────────────── processing ───────────────────────────── */

async function fetchBuffer(url, timeoutMs = 45_000) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "user-agent": "ppatour-website-media-sync" },
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Downloads, optionally upgrades a derivative URL to its original, transcodes,
 * and returns whichever of {original, transcoded} is smaller.
 */
/** Loaded on demand: --verify never transcodes, so it must not need sharp. */
let sharpLib = null;
async function sharpFor(buf) {
  if (!sharpLib) sharpLib = (await import("sharp")).default;
  return sharpLib(buf);
}

async function prepare(asset) {
  let source = asset.url;
  let buf;

  // Documents (PDFs, video) are stored byte-for-byte — no resize, no transcode.
  if (asset.kind === "document") {
    buf = await fetchBuffer(asset.url, 90_000);
    const ext = (asset.url.split("?")[0].match(/\.([a-z0-9]+)$/i)?.[1] ?? "bin").toLowerCase();
    return {
      buffer: buf,
      ext,
      source,
      inBytes: buf.length,
      outBytes: buf.length,
      transcoded: false,
    };
  }

  // Prefer WP's full-size original over a `-576x1024` derivative for BOTH kinds:
  // we re-cap and re-encode anyway, so starting from the original is strictly
  // better quality at the same output size.
  const orig = originalCandidate(asset.url);
  if (orig) {
    try {
      buf = await fetchBuffer(orig);
      source = orig;
    } catch {
      /* the derivative is all WP kept */
    }
  }
  if (!buf) buf = await fetchBuffer(asset.url);

  const cap = CAP[asset.kind];
  let out = buf;
  let ext = (source.split("?")[0].match(/\.([a-z0-9]+)$/i)?.[1] ?? "jpg").toLowerCase();
  let transcoded = false;

  try {
    const webp = await (await sharpFor(buf))
      .rotate() // honor EXIF, else phone photos land sideways
      .resize({ width: cap, height: cap, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    // Only keep it if it actually helps — re-encoding webp sources inflates them.
    if (webp.length < buf.length) {
      out = webp;
      ext = "webp";
      transcoded = true;
    }
  } catch (err) {
    // Corrupt or unsupported source: fall through and store the bytes as-is.
    console.warn(`    ! transcode failed (${err.message.slice(0, 50)}) — storing original`);
  }

  return { buffer: out, ext, source, inBytes: buf.length, outBytes: out.length, transcoded };
}

const CONTENT_TYPE = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  pdf: "application/pdf",
  mov: "video/quicktime",
  mp4: "video/mp4",
};

/* ─────────────────────────────── runner ─────────────────────────────── */

/**
 * Fixed-size worker pool. Each runner pulls the next index and awaits its own
 * work, so at most `limit` requests hit the source site at once.
 */
async function pool(items, limit, worker) {
  let next = 0;
  const runner = async () => {
    while (next < items.length) {
      const i = next++;
      await worker(items[i], i);
    }
  };
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, runner),
  );
}

const all = inventory();
const map = loadMap();
const deadList = (() => {
  try {
    return JSON.parse(readFileSync(DEAD, "utf8"));
  } catch {
    return [];
  }
})();
const dead = new Set(deadList);

if (VERIFY) {
  const live = all.filter((a) => !dead.has(a.url));
  const missing = live.filter((a) => !map[a.url]);
  const pct = ((live.length - missing.length) / Math.max(1, live.length)) * 100;
  console.log(`referenced assets : ${all.length}`);
  console.log(`dead upstream     : ${all.length - live.length} (404 on WP itself, links unwrapped)`);
  console.log(`rehosted          : ${live.length - missing.length} of ${live.length} (${pct.toFixed(1)}%)`);
  console.log(`still on WP       : ${missing.length}`);
  if (missing.length) {
    console.log("\nThese break at cutover:");
    for (const a of missing.slice(0, 15)) console.log(`  ${a.url}`);
    if (missing.length > 15) console.log(`  … and ${missing.length - 15} more`);
    console.log("\nGATE: NOT READY for the ppatour.com DNS cutover.");
    process.exit(1);
  }
  console.log("\nGATE: PASS — no post depends on the WordPress install.");
  process.exit(0);
}

const todo = all
  .filter((a) => !dead.has(a.url))
  .filter((a) => FORCE || !map[a.url])
  .slice(0, LIMIT);

let put = null;
if (!DRY) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(
      "BLOB_READ_WRITE_TOKEN is not set.\n" +
        "Run with --dry-run to validate the pipeline without uploading, or export the token.",
    );
    process.exit(1);
  }
  ({ put } = await import("@vercel/blob"));
}

console.log(
  `${DRY ? "DRY RUN — no uploads" : "SYNC"} · ${todo.length} of ${all.length} assets · ` +
    `concurrency ${CONCURRENCY}\n`,
);

let done = 0;
let failed = 0;
let deadCount = 0;
let inTotal = 0;
let outTotal = 0;
let upgraded = 0;
let transcodedCount = 0;
const failures = [];
let sinceFlush = 0;

await pool(todo, CONCURRENCY, async (asset, i) => {
  const label = `[${String(i + 1).padStart(4)}/${todo.length}]`;
  try {
    const r = await prepare(asset);
    const key = blobKey(r.source, r.ext);

    if (!DRY) {
      const res = await put(key, r.buffer, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: CONTENT_TYPE[r.ext] ?? "application/octet-stream",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      map[asset.url] = res.url;
      // Flush incrementally so an interrupted run resumes instead of restarting.
      if (++sinceFlush >= 10) {
        writeFileSync(MAP, JSON.stringify(map, null, 2));
        sinceFlush = 0;
      }
    }

    inTotal += r.inBytes;
    outTotal += r.outBytes;
    if (r.source !== asset.url) upgraded++;
    if (r.transcoded) transcodedCount++;
    done++;
    const pct = r.inBytes ? (100 - (r.outBytes / r.inBytes) * 100).toFixed(0) : "0";
    console.log(
      `${label} ${key.padEnd(52)} ${(r.inBytes / 1024).toFixed(0).padStart(5)}KB → ` +
        `${(r.outBytes / 1024).toFixed(0).padStart(5)}KB (${pct}%)`,
    );
  } catch (err) {
    // A hard 404 means the asset is gone from WordPress itself — record it as
    // inherited breakage rather than retrying forever. Anything else (timeout,
    // 5xx) stays a failure worth another run.
    if (err.status === 404) {
      dead.add(asset.url);
      deadCount++;
      console.log(`${label} DEAD(404 on WP) ${asset.url.split("/").pop()}`);
    } else {
      failed++;
      failures.push({ url: asset.url, error: err.message });
      console.log(`${label} FAIL ${asset.url.slice(-60)} — ${err.message.slice(0, 60)}`);
    }
  }
});

if (!DRY) {
  writeFileSync(MAP, JSON.stringify(map, null, 2));
  writeFileSync(DEAD, JSON.stringify([...dead].sort(), null, 2));
}

const mb = (b) => (b / 1024 / 1024).toFixed(1);
console.log(`\n${DRY ? "dry run" : "sync"} complete`);
console.log(`  processed        : ${done}`);
console.log(`  failed           : ${failed}`);
console.log(`  dead upstream (404 on WP): ${deadCount}`);
console.log(`  transcoded       : ${transcodedCount} (${done - transcodedCount} kept as-is, already smaller)`);
console.log(`  upgraded to original: ${upgraded}`);
console.log(`  bytes            : ${mb(inTotal)}MB → ${mb(outTotal)}MB`);
if (done) {
  const projected = (outTotal / done) * all.length;
  console.log(`  projected all ${all.length}: ${mb(projected)}MB`);
}
if (!DRY) console.log(`  map entries      : ${Object.keys(map).length} / ${all.length}`);
if (failures.length) {
  console.log("\nfailures:");
  for (const f of failures.slice(0, 20)) console.log(`  ${f.url}\n    ${f.error}`);
}
if (DRY) console.log("\nNo uploads performed and wp-media-map.json untouched.");
