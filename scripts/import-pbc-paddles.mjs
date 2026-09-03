/**
 * Pickleball Central paddle catalogue → photos, live prices and exact product
 * URLs for the Paddle Lab.
 *
 *   node scripts/import-pbc-paddles.mjs --fetch    # crawl PBC, write the catalogue, then match
 *   node scripts/import-pbc-paddles.mjs            # match from the committed catalogue only
 *   node scripts/import-pbc-paddles.mjs --report   # match + print, write nothing
 *
 * Two outputs:
 *   lib/data/pbc-paddle-catalog.json   every paddle product on PBC: url, title,
 *                                      image, price, availability, sku. Raw.
 *   lib/data/paddle-pbc.json           lab slug → the ONE PBC product for it.
 *
 * ⚠ PBC's category and search pages are rendered client-side (Searchanise), so
 * there is nothing to scrape there — see the warning in lib/pbc-links.ts. The
 * crawl reads the product SITEMAP (xmlsitemap.php?type=products), keeps the
 * paddle URLs, and reads each product page's og:image + JSON-LD offer. That is
 * ~800 pages; the catalogue is committed so a build never re-crawls.
 *
 * ⚠ MATCHING REFUSES RATHER THAN GUESSES. PBC titles and John Kew's names
 * differ ("JOOLA Perseus Pro 3S Dual 16mm Pickleball Paddle" vs "JOOLA" +
 * "Perseus 3S" + 16). A match needs the brand to agree, every token of Kew's
 * model name to appear in the PBC title, and the core thickness to agree when
 * both state one. Ties between two PBC products are dropped and printed. A
 * wrong photo on a paddle page is worse than the brand tile.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = join(ROOT, "lib/data/pbc-paddle-catalog.json");
const OUT = join(ROOT, "lib/data/paddle-pbc.json");
const PADDLES = join(ROOT, "lib/data/paddles.json");
const FETCH = process.argv.includes("--fetch");
const REPORT_ONLY = process.argv.includes("--report");

const UA = "Mozilla/5.0 (compatible; ppatour-paddle-lab/1.0; +https://www.ppatour.com/paddle-lab/)";
const SITEMAP = "https://pickleballcentral.com/xmlsitemap.php?type=products&page=";

/** Sitemap URLs that say "paddle" but are not a paddle. */
const NOT_A_PADDLE =
  /-(used|cover|eraser|bag|grip|tape|holder|display|rack|weight|lead|hanger|bundle|set|demo|case|sleeve|kit|gift|card|edge|guard|strap|ball|net|shirt|hat|shoe)s?(-|\/|$)/i;

/* ---------------- crawl ---------------- */

async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,application/xml" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function sitemapPaddleUrls() {
  const urls = [];
  for (let page = 1; page < 20; page++) {
    // The page after the last one 404s rather than returning an empty map.
    let xml;
    try {
      xml = await get(SITEMAP + page);
    } catch {
      break;
    }
    const found = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    if (found.length < 2) break;
    urls.push(...found);
  }
  return urls.filter((u) => /paddle/i.test(u) && !NOT_A_PADDLE.test(u));
}

function attr(html, re) {
  const m = html.match(re);
  return m ? m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'") : null;
}

/**
 * og:image is the 386×513 thumbnail. BigCommerce serves the same file at any
 * stencil size, so rewrite to 800×800 — big enough for the paddle page hero.
 *   /products/7858/images/37755/NAME.386.513.jpg  →
 *   /images/stencil/800x800/products/7858/37755/NAME.jpg
 */
function bigImage(og) {
  if (!og) return null;
  const m = og.match(/^(https:\/\/cdn11\.bigcommerce\.com\/[^/]+)\/products\/(\d+)\/images\/(\d+)\/(.+?)\.\d+\.\d+\.(jpe?g|png|webp)(\?.*)?$/i);
  if (!m) return og;
  return `${m[1]}/images/stencil/800x800/products/${m[2]}/${m[3]}/${m[4]}.${m[5]}`;
}

function parseProduct(url, html) {
  const title = attr(html, /<meta property="og:title" content="([^"]*)"/);
  const og = attr(html, /<meta property="og:image" content="([^"]*)"/);
  const availability = attr(html, /<meta property="og:availability" content="([^"]*)"/);
  const price = attr(html, /"price":\s*"([\d.]+)"/);
  const sku = attr(html, /"sku":\s*"([^"]+)"/);
  const brand = attr(html, /"brand":\s*\{[^}]*?"name":\s*"([^"]+)"/);
  if (!title) return null;
  return {
    url,
    title,
    image: bigImage(og),
    price: price ? Number(price) : null,
    availability: availability ?? null,
    sku,
    brand,
  };
}

async function crawl() {
  const urls = await sitemapPaddleUrls();
  console.log(`sitemap: ${urls.length} paddle product URLs`);
  const out = [];
  let i = 0;
  const workers = Array.from({ length: 8 }, async () => {
    while (i < urls.length) {
      const url = urls[i++];
      try {
        const p = parseProduct(url, await get(url));
        if (p) out.push(p);
      } catch (e) {
        console.log(`  skip ${url}: ${e.message}`);
      }
      if (out.length % 100 === 0) console.log(`  ${out.length}/${urls.length}`);
    }
  });
  await Promise.all(workers);
  out.sort((a, b) => a.url.localeCompare(b.url));
  writeFileSync(CATALOG, JSON.stringify({ crawledAt: new Date().toISOString().slice(0, 10), products: out }, null, 2) + "\n");
  console.log(`catalogue: ${out.length} products → ${CATALOG}`);
  return out;
}

/* ---------------- match ---------------- */

const tight = (s) => s.toLowerCase().replace(/\+/g, "plus").replace(/[^a-z0-9]+/g, "");

function tokens(s) {
  return s
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/\bpickleball\b|\bpaddles?\b/g, " ")
    .replace(/[^a-z0-9.]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function thicknessOf(s) {
  const m = s.match(/\b(\d{1,2}(?:\.\d)?)\s?mm\b/i);
  return m ? Number(m[1]) : null;
}

/** Words a PBC title may carry beyond the brand + model without meaning a different paddle. */
const NOISE = new Set(["edition", "dual", "series", "the", "official", "with", "by", "and", "new", "certified", "usap", "upa", "upaa", "pickleball", "paddle", "paddles"]);

function match(paddles, catalog) {
  const bad = /\b(used|bundle|demo|set of|cover)\b/i;
  const products = catalog.filter((p) => !bad.test(p.title)).map((p) => ({
    ...p,
    tight: tight(p.title),
    toks: tokens(p.title.replace(/\b\d{1,2}(?:\.\d)?\s?mm\b/gi, " ")),
    mm: thicknessOf(p.title),
  }));

  const result = {};
  const ambiguous = [];
  let matched = 0;
  for (const lab of paddles) {
    const brand = tight(lab.brand);
    const model = tokens(lab.model.replace(/\b\d{1,2}(?:\.\d)?\s?mm\b/gi, " "));
    const brandToks = new Set(tokens(lab.brand));
    const candidates = products
      .filter((p) => p.tight.startsWith(brand) || (p.brand && tight(p.brand) === brand))
      .filter((p) => model.every((t) => p.toks.includes(t)))
      // ⚠ Extra tokens in the PBC title must be noise, never a version. "Hurache-X
      // Power" matched "Hurache-X Power 2" and "Perseus 3S" matched "Perseus Pro
      // 3S" before this line; a stray digit, "Pro", "Plus", "V2" or a player's
      // name means a different paddle, and no photo beats the wrong one.
      .filter((p) => p.toks.every((t) => model.includes(t) || brandToks.has(t) || NOISE.has(t)))
      .filter((p) => lab.thicknessMm == null || p.mm == null || p.mm === lab.thicknessMm)
      .map((p) => ({
        p,
        // fewer stray tokens = closer title; a stated matching thickness beats an unstated one
        score: p.toks.length - model.length + (p.mm == null && lab.thicknessMm != null ? 2 : 0),
      }))
      .sort((a, b) => a.score - b.score);
    if (!candidates.length) continue;
    const best = candidates[0];
    const tie = candidates.filter((c) => c.score === best.score);
    if (tie.length > 1 && new Set(tie.map((c) => c.p.title)).size > 1) {
      ambiguous.push(`${lab.name} ${lab.thicknessMm ?? ""}mm → ${tie.map((c) => c.p.title).join(" | ")}`);
      continue;
    }
    matched++;
    const { url, title, image, price, availability, sku } = best.p;
    result[lab.slug] = { url, title, image, price, availability, sku };
  }
  return { result, ambiguous, matched };
}

/* ---------------- main ---------------- */

async function main() {
  let catalog;
  if (FETCH || !existsSync(CATALOG)) catalog = await crawl();
  else catalog = JSON.parse(readFileSync(CATALOG, "utf8")).products;

  const paddles = JSON.parse(readFileSync(PADDLES, "utf8")).paddles;
  const { result, ambiguous, matched } = match(paddles, catalog);
  console.log(`matched ${matched} of ${paddles.length} lab paddles to a PBC product (${catalog.length} in catalogue)`);
  for (const a of ambiguous) console.log(`  ambiguous, skipped: ${a}`);
  if (REPORT_ONLY) return;
  writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");
  console.log(`wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
