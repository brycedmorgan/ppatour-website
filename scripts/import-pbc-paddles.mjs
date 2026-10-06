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
const NEAR = join(ROOT, "lib/data/pbc-near-misses.json");
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

/**
 * Confirmed equivalences the token rule cannot derive: Kew slug → PBC product
 * URL. Add a line ONLY when a human has confirmed the two are the same paddle
 * (Hannah / John Kew / the PBC product page itself). Near-misses the rule
 * rejected are written to lib/data/pbc-near-misses.json for exactly that review.
 */
const ALIASES = {
  // Confirmed by Joseph (Hannah's team) on the 9/18 master list, "Joseph Adjustments"
  // tab, returned 2026-10-02. See docs/PADDLE-LAB.md "Near-misses to confirm".
  "adidas-metalbone-14-5-polypropylene-14-5mm": "https://pickleballcentral.com/adidas-metalbone-14-5-2025-pickleball-paddle/",
  "crbn-crbn-1x-14mm": "https://pickleballcentral.com/crbn-1x-power-series-carbon-fiber-paddle/",
  "crbn-crbn-2x-16mm": "https://pickleballcentral.com/crbn-2x-power-series-carbon-fiber-paddle/",
  "crbn-trufoam-barrage-2-14mm": "https://pickleballcentral.com/crbn2-trufoam-barrage-pickleball-paddle/",
  "crbn-trufoam-barrage-4-14mm": "https://pickleballcentral.com/crbn4-trufoam-barrage-pickleball-paddle/",
  "crbn-trufoam-waves-2-14mm": "https://pickleballcentral.com/crbn-trufoam-waves-2-square-pickleball-paddle/",
  "diadem-icon-v2-xl-13-7mm": "https://pickleballcentral.com/diadem-icon-v2-xl-carbon-fiber-pickleball-paddle/",
  "diadem-warrior-19mm": "https://pickleballcentral.com/diadem-warrior-v1-carbon-fiber-paddle/",
  "diadem-warrior-blucore-standard-19mm-19mm": "https://pickleballcentral.com/diadem-warrior-blucore-v3-standard-pickleball-paddle/",
  "engage-alpha-pro-elongated-16mm": "https://pickleballcentral.com/engage-pursuit-alpha-pro-16mm-pickleball-paddle/",
  "engage-pursuit-pro-innovation-15-2mm": "https://pickleballcentral.com/engage-pursuit-pro1-innovation-15-2mm-pickleball-paddle/",
  "franklin-c45-aurelius-12-7-mm-12-7mm": "https://pickleballcentral.com/franklin-c45-anna-leigh-waters-aurelius-alw-carbon-fiber-pickleball-paddle/",
  "franklin-c45-aurelius-14-mm-14mm": "https://pickleballcentral.com/franklin-c45-anna-leigh-waters-aurelius-alw-carbon-fiber-pickleball-paddle/",
  "franklin-c45-aurelius-16-mm-16mm": "https://pickleballcentral.com/franklin-c45-anna-leigh-waters-aurelius-alw-carbon-fiber-pickleball-paddle/",
  "franklin-c45-pariss-todd-13-25mm": "https://pickleballcentral.com/franklin-c45-parris-todd-13-25mm-pickleball-paddle/",
  "franklin-carbon-stk-14-5mm": "https://pickleballcentral.com/franklin-signature-carbon-stk-pickleball-paddle/",
  "franklin-tour-dynasty-16mm": "https://pickleballcentral.com/franklin-fs-tour-dynasty-16mm-carbon-fiber-pickleball-paddle/",
  "gamma-airbender-16mm": "https://pickleballcentral.com/gamma-rcf-airbender-16mm-raw-carbon-fiber-pickleball-paddle/",
  "gamma-airbender-13mm": "https://pickleballcentral.com/gamma-rcf-airbender-13mm-pickleball-paddle/",
  "gamma-obsidian-16-16mm": "https://pickleballcentral.com/gamma-rcf-obsidian-16mm-raw-carbon-fiber-control-pickleball-paddle/",
  "gearbox-gbx-power-hybdrid-16mm": "https://pickleballcentral.com/gearbox-gbx-power-hybrid-pickleball-paddle/",
  "gearbox-gx2-integra-16mm": "https://pickleballcentral.com/gearbox-gx2-integra-xl-16mm-pickleball-paddle/",
  "gearbox-pro-ultimate-hyper-16mm": "https://pickleballcentral.com/gearbox-pro-ultimate-hyper-8-0-16mm-pickleball-paddle/",
  "head-boom-pro-ex15-15mm": "https://pickleballcentral.com/head-boom-pro-ex15-2026-pickleball-paddle/",
  "holbrook-pro-aero-metallic-t-16mm": "https://pickleballcentral.com/holbrook-aero-t-metallic-16mm-carbon-fiber-pickleball-paddle/",
  "honolulu-pickleball-co-j2fc-plus-16mm": "https://pickleballcentral.com/honolulu-sword-shield-j2fc-pickleball-paddle/",
  "honolulu-pickleball-co-j2nf-16mm": "https://pickleballcentral.com/honolulu-sword-shield-j2nf-pickleball-paddle/",
  "honolulu-pickleball-co-j6cr-blue-grit-16mm": "https://pickleballcentral.com/honolulu-j6cr-crystal-blue-endurance-surface-pickleball-paddle/",
  "joola-hyperion-3s-16mm": "https://pickleballcentral.com/joola-ben-johns-hyperion-3s-16mm-pickleball-paddle/",
  "joola-hyperion-cfs-gen-1-16mm": "https://pickleballcentral.com/joola-ben-johns-hyperion-cfs-16-graphite-paddle/",
  "joola-kosmos-pro-v-16mm": "https://pickleballcentral.com/joola-kosmos-pro-v-federico-staksrud-16mm-pickleball-paddle/",
  "joola-magnus-3s-16mm": "https://pickleballcentral.com/joola-tyson-mcguffin-magnus-3s-16mm-pickleball-paddle/",
  "joola-perseus-3s-14mm": "https://pickleballcentral.com/joola-ben-johns-perseus-3s-14mm-pickleball-paddle/",
  "joola-perseus-3s-16mm": "https://pickleballcentral.com/joola-ben-johns-perseus-3s-16mm-pickleball-paddle/",
  "joola-perseus-pro-iv-14mm-14mm": "https://pickleballcentral.com/joola-ben-johns-perseus-pro-iv-14mm-pickleball-paddle/",
  "joola-perseus-pro-iv-16mm-16mm": "https://pickleballcentral.com/joola-ben-johns-perseus-pro-iv-16mm-pickleball-paddle/",
  "joola-scorpeus-3s-16mm": "https://pickleballcentral.com/joola-collin-johns-scorpeus-3s-16mm-pickleball-paddle/",
  "joola-scorpeus-pro-iv-16mm": "https://pickleballcentral.com/joola-collin-johns-scorpeus-pro-iv-16mm-pickleball-paddle/",
  "luzz-inferno-frozen-16mm": "https://pickleballcentral.com/luzz-pro4-inferno-frozen-pickleball-paddle/",
  "luzz-pro-4-inferno-16mm": "https://pickleballcentral.com/luzz-pro4-inferno-pickleball-paddle/",
  "nox-x-foam-jc6-16mm": "https://pickleballcentral.com/nox-x-foam-jc6-16mm-by-judit-castillo-pickleball-paddle/",
  "pikkl-hurricane-pro-16mm": "https://pickleballcentral.com/pikkl-hurricane-pro-16mm-carbon-fiber-pickleball-paddle/",
  "pikkl-hurricane-pro-14mm": "https://pickleballcentral.com/pikkl-hurricane-pro-14mm-carbon-fiber-pickleball-paddle/",
  "pikkl-vantage-pro-16mm": "https://pickleballcentral.com/pikkl-vantage-pro-16mm-carbon-fiber-pickleball-paddle/",
  "pikkl-vantage-pro-14mm": "https://pickleballcentral.com/pikkl-vantage-pro-14mm-carbon-fiber-pickleball-paddle/",
  "proton-series-3-project-flamingo-15mm": "https://pickleballcentral.com/proton-series-three-pickleball-paddle-project-flamingo/",
  "proton-series-3-project-peacock-15mm": "https://pickleballcentral.com/proton-series-three-project-peacock-15mm-elongated-pickleball-paddle/",
  "proton-series-four-15mm": "https://pickleballcentral.com/proton-series-four-pickleball-paddle-project-roadrunner/",
  "proton-series-one-type-a-15mm": "https://pickleballcentral.com/proton-series-one-type-a-square-15mm-pickleball-paddle/",
  "proton-series-three-15-6mm": "https://pickleballcentral.com/proton-series-three-pickleball-paddle-15mm/",
  "proxr-jolt-13mm": "https://pickleballcentral.com/proxr-jolt-signature-pickleball-paddle/",
  "rpm-q2-elongated-16-16mm": "https://pickleballcentral.com/rpm-q2-elongated-pickleball-paddle/",
  "rpm-q2-widebody-16-16mm": "https://pickleballcentral.com/rpm-q2-widebody-pickleball-paddle/",
  "selkirk-dauntless-elongated-16mm": "https://pickleballcentral.com/slk-dauntless-elongated-pickleball-paddle/",
  "selkirk-dauntless-widebody-16mm": "https://pickleballcentral.com/slk-dauntless-widebody-pickleball-paddle/",
  "selkirk-labs-007-invikta-10mm": "https://pickleballcentral.com/selkirk-labs-project-007-invikta-10mm-pickleball-paddle/",
  "selkirk-labs-007-invikta-14mm": "https://pickleballcentral.com/selkirk-labs-project-007-invikta-14mm-pickleball-paddle/",
  "selkirk-luxx-ii-control-air-invikta-19mm": "https://pickleballcentral.com/selkirk-luxx-control-air-infinigrit-invikta-pickleball-paddle/",
  "selkirk-slk-era-elongated-16mm": "https://pickleballcentral.com/selkirk-slk-era-elongated-pickleball-paddle/",
  "selkirk-slk-era-widebody-16mm": "https://pickleballcentral.com/selkirk-slk-era-widebody-pickleball-paddle/",
  "six-zero-double-black-diamond-16mm": "https://pickleballcentral.com/six-zero-double-black-diamond-control-16mm-paddle/",
  "six-zero-double-black-diamond-14mm": "https://pickleballcentral.com/six-zero-double-black-diamond-control-14mm-paddle/",
  "six-zero-infinity-black-diamond-16mm": "https://pickleballcentral.com/six-zero-infinity-edgeless-black-diamond-power-pickleball-paddle/",
  "six-zero-infinity-double-black-diamond-16mm": "https://pickleballcentral.com/six-zero-infinity-edgeless-double-black-diamond-control-pickleball-paddle/",
  "versix-vector-15mm": "https://pickleballcentral.com/versix-vector-xl-pickleball-paddle/",
  "vulcan-dark-matter-16mm": "https://pickleballcentral.com/vulcan-chpt-01-dark-matter-hybrid-pickleball-paddle/",
  "vulcan-kyrgios-16mm": "https://pickleballcentral.com/vulcan-chpt-01-kyrgios-elongated-pickleball-paddle/",
};

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
  const nearMisses = [];
  let matched = 0;
  for (const lab of paddles) {
    const alias = ALIASES[lab.slug];
    if (alias) {
      const p = products.find((x) => x.url === alias);
      if (!p) throw new Error(`alias for ${lab.slug} points at a URL not in the catalogue: ${alias}`);
      matched++;
      result[lab.slug] = { url: p.url, title: p.title, image: p.image, price: p.price, availability: p.availability, sku: p.sku };
      continue;
    }
    const brand = tight(lab.brand);
    const model = tokens(lab.model.replace(/\b\d{1,2}(?:\.\d)?\s?mm\b/gi, " "));
    const brandToks = new Set(tokens(lab.brand));
    const loose = products
      .filter((p) => p.tight.startsWith(brand) || (p.brand && tight(p.brand) === brand))
      .filter((p) => model.every((t) => p.toks.includes(t)))
      .filter((p) => lab.thicknessMm == null || p.mm == null || p.mm === lab.thicknessMm);
    const candidates = loose
      // ⚠ Extra tokens in the PBC title must be noise, never a version. "Hurache-X
      // Power" matched "Hurache-X Power 2" and "Perseus 3S" matched "Perseus Pro
      // 3S" before this line; a stray digit, "Pro", "Plus", "V2" or a player's
      // name means a different paddle, and no photo beats the wrong one.
      // Two derivable exceptions: the thickness written without "mm" ("Rhapsody
      // 13" for a 13 mm paddle) and a shape word that equals Kew's own shape for
      // the paddle ("Waves 1 Elongated"). Both are facts on the lab record.
      .filter((p) =>
        p.toks.every(
          (t) =>
            model.includes(t) ||
            brandToks.has(t) ||
            NOISE.has(t) ||
            (lab.thicknessMm != null && t === String(lab.thicknessMm)) ||
            (lab.shape && t === lab.shape.toLowerCase()),
        ),
      )
      .filter((p) => lab.thicknessMm == null || p.mm == null || p.mm === lab.thicknessMm)
      .map((p) => ({
        p,
        // fewer stray tokens = closer title; a stated matching thickness beats an unstated one
        score: p.toks.length - model.length + (p.mm == null && lab.thicknessMm != null ? 2 : 0),
      }))
      .sort((a, b) => a.score - b.score);
    if (!candidates.length) {
      // Brand + model + thickness agreed but a stray token blocked it. That is
      // the review list for the alias table, not a match.
      if (loose.length) nearMisses.push({ slug: lab.slug, kew: `${lab.name} ${lab.thicknessMm ?? ""}mm`.trim(), pbc: loose.slice(0, 4).map((p) => ({ title: p.title, url: p.url })) });
      continue;
    }
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
  return { result, ambiguous, matched, nearMisses };
}

/* ---------------- main ---------------- */

async function main() {
  let catalog;
  if (FETCH || !existsSync(CATALOG)) catalog = await crawl();
  else catalog = JSON.parse(readFileSync(CATALOG, "utf8")).products;

  const paddles = JSON.parse(readFileSync(PADDLES, "utf8")).paddles;
  const { result, ambiguous, matched, nearMisses } = match(paddles, catalog);
  console.log(`matched ${matched} of ${paddles.length} lab paddles to a PBC product (${catalog.length} in catalogue)`);
  for (const a of ambiguous) console.log(`  ambiguous, skipped: ${a}`);
  console.log(`${nearMisses.length} near-misses for human review (brand+model agree, a stray token blocked it)`);
  if (REPORT_ONLY) return;
  writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");
  writeFileSync(NEAR, JSON.stringify(nearMisses, null, 2) + "\n");
  console.log(`wrote ${OUT} and ${NEAR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
