/**
 * WordPress → news import (one-time extraction, re-runnable).
 *
 * Pulls the wp-admin "Posts" menu ONLY — post_type=post, 811 published
 * articles at root URLs (ppatour.com/{slug}/). Deliberately NOT imported:
 * `ppa-blog` (39 evergreen instructional posts, separate menu + taxonomy),
 * `page` (41), `athlete` (218 — already in lib/data/published-athletes.json),
 * `junior-winner` (27), `team-members` (7), and the 4,411-item media library
 * beyond files these posts actually reference.
 *
 * ── The taxonomy problem this solves ─────────────────────────────────────
 * WP jams three axes into one 168-term category tree, and they separate
 * mechanically (verified against the live API 2026-07-29):
 *   player  → the 79 children of the `players` category (+ dave-fleming,
 *             misfiled under `office`)          → NewsPost.players
 *   event   → root-level terms carrying a year  → NewsPost.wpEvent
 *   section → the 20 remaining roots            → NewsPost.category
 * `tournaments` (280) / `players` (246) / `news` (216) are NOT formats —
 * 387 of 811 posts carry more than one, and the top combos are those three
 * colliding. The real formats are the recurring editorial series below them.
 *
 * Nothing here writes to git. Outputs:
 *   lib/data/news-posts.json   normalized posts (the import payload)
 *   <scratch>/wp-inventory.csv review sheet — one row per post
 *   <scratch>/wp-media-manifest.json remote assets to rehost (step 2)
 *
 * Usage:  node scripts/import-wp-posts.mjs [--out <dir>] [--limit N]
 */

import { writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

const WP = process.env.WP_BASE_URL || "https://ppatour.com";
const API = `${WP}/wp-json/wp/v2`;
const ROOT = path.resolve(import.meta.dirname, "..");

const argv = process.argv.slice(2);
const argOf = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const SCRATCH = argOf("--out") || path.join(ROOT, ".wp-import");
const LIMIT = Number(argOf("--limit")) || Infinity;

/* ─────────────────────────── bylines ───────────────────────────
 * 7 of the 17 WP accounts are raw logins. Real names supplied by Wesley
 * 2026-07-29; the three unattributable accounts become the house byline.  */
const BYLINES = {
  "e-parker": "Evan Parker",
  "h-johns": "Hannah Johns",
  "n-boschult": "Nathan Boschult",
  "l-borski": "Liv Borski",
  "e-santerre": "Emma Santerre",
  yiyunzhou: "PPA Tour",
  "pete-7twodesign": "PPA Tour",
  "m-cudzinowski": "PPA Tour",
};
const HOUSE_BYLINE = "PPA Tour";

/* ──────────────────── section → site category ────────────────────
 * Ordered: FIRST match wins, so `stats-wrap + news + tournaments` is a
 * Recap, not Tour News. Targets are the categories already in use in
 * lib/news-articles.ts — no new buckets introduced.
 *
 * `series` retains the originating WP series slug regardless, so
 * featured-sponsor can be split back out of Feature (or draw-reveals out
 * of Analysis) later without re-importing.                              */
const CATEGORY_RULES = [
  ["stats-wrap", "Recap"],
  ["draw-reveals", "Analysis"],
  ["storylines", "Analysis"],
  ["food-for-thought", "Analysis"],
  ["featured-player", "Profile"],
  ["whats-the-call", "Explainer"],
  ["bag-check", "Explainer"],
  ["all-access", "Feature"],
  ["just-for-fun", "Feature"],
  ["featured-sponsor", "Feature"],
  ["ppa-partner", "Feature"],
  ["office", "Tour News"],
  ["pickleball-com", "Tour News"],
  ["national-pickleball-month", "Tour News"],
  ["ppa-and-mlp-asia", "Tour News"],
  ["news", "Tour News"],
];
/** Topic labels, not formats — never decide `category`. */
const NON_SECTION = new Set(["tournaments", "players", "uncategorized"]);
const FALLBACK_CATEGORY = "Tour News";

/** Rescues the 74 posts carrying no section category, by title shape. */
const TITLE_RULES = [
  [/championship sunday|standout stats/i, "Recap", "stats-wrap"],
  [/^storylines|storylines (for|from)/i, "Analysis", "storylines"],
  [/draw reveal|the draw/i, "Analysis", "draw-reveals"],
];

/** Tag noise: brand boilerplate + year stamps. Kept in tagsRaw either way. */
const TAG_NOISE =
  /^(ppa|ppa tour|pickleball|ppa tour \d{4}|ppa \d{4}|pickleball \d{4}|\d{4})$/i;

/* ─────────────────────────── helpers ─────────────────────────── */

const NAMED = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘",
  rdquo: "”", ldquo: "“", eacute: "é", uuml: "ü", deg: "°",
};
function decode(s = "") {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);
}
const stripTags = (html = "") =>
  decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function get(url, attempt = 0) {
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "ppatour-website-import" },
      signal: AbortSignal.timeout(45_000),
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 4) throw new Error(`HTTP ${res.status}`);
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status} ${url}`), { fatal: res.status < 500 });
    return await res.json();
  } catch (err) {
    if (err.fatal || attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, Math.min(600 * 2 ** attempt, 5000)));
    return get(url, attempt + 1);
  }
}

/** Pages an endpoint to exhaustion. WP caps per_page at 100. */
async function getAll(endpoint, fields, extra = "") {
  const out = [];
  for (let page = 1; ; page++) {
    const rows = await get(`${API}/${endpoint}?per_page=100&page=${page}&_fields=${fields}${extra}`);
    if (!Array.isArray(rows) || rows.length === 0) break;
    out.push(...rows);
    process.stdout.write(`\r  ${endpoint}: ${out.length}   `);
    if (rows.length < 100) break;
  }
  process.stdout.write("\n");
  return out;
}

/* ─────────────────────────── extract ─────────────────────────── */

console.log(`WordPress import — ${WP} (post_type=post only)\n`);

const [rawCats, rawTags, rawUsers] = await Promise.all([
  getAll("categories", "id,name,slug,count,parent"),
  getAll("tags", "id,name,slug,count"),
  getAll("users", "id,name,slug"),
]);

const posts = await getAll(
  "posts",
  "id,slug,date,date_gmt,modified,link,title,excerpt,content,author,categories,tags,featured_media,yoast_head_json",
  "&status=publish&orderby=date&order=desc",
);

/* Featured images: batch-resolve only the IDs these posts actually use. */
const mediaIds = [...new Set(posts.map((p) => p.featured_media).filter(Boolean))];
const media = {};
for (let i = 0; i < mediaIds.length; i += 100) {
  const batch = mediaIds.slice(i, i + 100);
  const rows = await get(
    `${API}/media?include=${batch.join(",")}&per_page=100&_fields=id,source_url,alt_text,media_details`,
  );
  for (const m of rows) {
    media[m.id] = {
      url: m.source_url,
      alt: decode(m.alt_text || ""),
      width: m.media_details?.width ?? null,
      height: m.media_details?.height ?? null,
    };
  }
  process.stdout.write(`\r  media: ${Object.keys(media).length}/${mediaIds.length}   `);
}
process.stdout.write("\n");

/* ────────────────────── classify the taxonomy ────────────────────── */

const catById = Object.fromEntries(rawCats.map((c) => [c.id, c]));
const tagById = Object.fromEntries(rawTags.map((t) => [t.id, t]));
const userById = Object.fromEntries(rawUsers.map((u) => [u.id, u]));

const playersRootId = rawCats.find((c) => c.slug === "players")?.id;
const isPlayerCat = (c) => c.parent === playersRootId || c.slug === "dave-fleming";
const isEventCat = (c) => c.parent === 0 && /(^|-)20\d{2}(-|$)/.test(c.slug) && !isPlayerCat(c);
const isSectionCat = (c) => !isPlayerCat(c) && !isEventCat(c);

/* Athlete resolution against the 180 profiles this site already publishes. */
const roster = JSON.parse(readFileSync(path.join(ROOT, "lib/data/published-athletes.json"), "utf8"));
const bySlug = new Map(roster.map((a) => [a.slug, a]));
const byName = new Map(roster.map((a) => [slugify(a.name), a]));

/**
 * WP category slug → roster slug, where the blog's name differs from the
 * roster's. Supplied by Wesley 2026-07-29.
 *
 * ⚠ `leigh-waters` → `anna-leigh-waters` is per his explicit instruction, but
 * Leigh Waters is Anna Leigh's mother and former doubles partner, and WP keeps
 * them as distinct categories (anna-leigh-waters 191 posts, leigh-waters 28).
 * Flagged back to him — delete this one line if those 28 posts turn out to be
 * about Leigh herself.
 */
const ATHLETE_ALIASES = {
  "gabe-tardio": "gabriel-tardio",
  "tyra-black": "hurricane-tyra-black",
  "leigh-waters": "anna-leigh-waters",
};

const resolveAthlete = (cat) => {
  const aliased = ATHLETE_ALIASES[cat.slug];
  if (aliased) {
    const hit = bySlug.get(aliased);
    if (hit) return hit;
    throw new Error(`ATHLETE_ALIASES: "${cat.slug}" → "${aliased}" is not in the roster`);
  }
  return bySlug.get(cat.slug) ?? byName.get(slugify(decode(cat.name))) ?? null;
};

/* ─────────────────────────── transform ─────────────────────────── */

const IMG_RE = /<img[^>]+src=["']([^"']+)["']/gi;
const IFRAME_RE = /<iframe[^>]+src=["']([^"']+)["']/gi;
/**
 * Known WP/page-builder shortcode names only. A generic `\[(\w+)` pattern
 * flags journalistic bracket insertions inside quotes ("[Tyson] despite…")
 * on ~40 posts and buries the real warnings — verified none of those were
 * actual shortcodes.
 */
const SHORTCODE_RE =
  /\[(gallery|caption|embed|playlist|audio|video|vc_[a-z_]+|et_pb_[a-z_]+|contact-form-7|wpforms|ninja_form|su_[a-z_]+)[\s\]/]/gi;

const wpHost = new URL(WP).host;
const out = [];
const assets = new Map();
const warnings = [];

for (const p of posts.slice(0, LIMIT)) {
  const terms = (p.categories || []).map((id) => catById[id]).filter(Boolean);
  const sections = terms.filter(isSectionCat).map((c) => c.slug);
  const usable = sections.filter((s) => !NON_SECTION.has(s));
  const title = decode(p.title?.rendered || "");

  // category: series priority → title rescue → Tour News
  let category = null;
  let series = null;
  for (const [slug, target] of CATEGORY_RULES) {
    if (usable.includes(slug)) { category = target; series = slug; break; }
  }
  if (!category) {
    for (const [re, target, s] of TITLE_RULES) {
      if (re.test(title)) { category = target; series = s; break; }
    }
  }
  const categoryResolvedBy = series && CATEGORY_RULES.some(([s]) => s === series) && usable.includes(series)
    ? "series"
    : series ? "title-pattern" : "fallback";
  if (!category) category = FALLBACK_CATEGORY;

  // players: resolved to local profiles; unresolved kept as plain names
  const playerCats = terms.filter(isPlayerCat);
  const players = [];
  const playerNames = [];
  for (const c of playerCats) {
    const a = resolveAthlete(c);
    if (a) players.push(a.slug);
    else playerNames.push(decode(c.name));
  }

  // event: label only — event pages come from a live API, resolved separately
  const eventCat = terms.filter(isEventCat)[0] ?? null;

  const html = p.content?.rendered || "";
  if (stripTags(html).length < 50) warnings.push(`${p.slug}: body is empty or near-empty in WP`);
  const inline = [];
  for (const m of html.matchAll(IMG_RE)) inline.push(m[1]);
  const embeds = [...html.matchAll(IFRAME_RE)].map((m) => m[1]);

  for (const src of inline) {
    let host = "";
    try { host = new URL(src, WP).host; } catch { continue; }
    if (host === "mail.google.com") {
      warnings.push(`${p.slug}: inline image points at mail.google.com (already dead upstream) — strip`);
      continue;
    }
    if (host === wpHost) assets.set(src, { kind: "inline", post: p.slug });
  }
  const featured = media[p.featured_media] ?? null;
  if (featured?.url) assets.set(featured.url, { kind: "featured", post: p.slug });
  else warnings.push(`${p.slug}: no featured image`);

  const shortcodes = [...new Set([...html.matchAll(SHORTCODE_RE)].map((m) => m[1].toLowerCase()))];
  if (shortcodes.length) warnings.push(`${p.slug}: unrendered shortcode-like tokens [${shortcodes.join(", ")}]`);

  const tagNames = (p.tags || []).map((id) => tagById[id]?.name).filter(Boolean).map(decode);
  const y = p.yoast_head_json || {};

  out.push({
    slug: p.slug,
    wpId: p.id,
    status: "published",
    source: "wordpress",
    category,
    series,
    categoryResolvedBy,
    title,
    dek: stripTags(p.excerpt?.rendered || ""),
    author: BYLINES[userById[p.author]?.slug] ?? userById[p.author]?.name ?? HOUSE_BYLINE,
    publishedAt: p.date,
    publishedAtGmt: p.date_gmt,
    modifiedAt: p.modified,
    /** Rendered Gutenberg HTML. Sanitize + rewrite asset URLs before render. */
    bodyHtml: html,
    image: featured,
    players,
    playerNames,
    wpEvent: eventCat ? { slug: eventCat.slug, name: decode(eventCat.name) } : null,
    tags: tagNames.filter((t) => !TAG_NOISE.test(t)),
    tagsRaw: tagNames,
    wpCategories: terms.map((c) => c.slug),
    embeds,
    inlineImages: inline,
    /** Old root-level URL — source for the 301 map. */
    legacyUrl: p.link,
    seo: {
      title: decode(y.title || ""),
      description: decode(y.description || ""),
      canonical: y.canonical || "",
    },
  });
}

/* ─────────────────────────── write ─────────────────────────── */

await mkdir(SCRATCH, { recursive: true });
await mkdir(path.join(ROOT, "lib/data"), { recursive: true });

const jsonPath = path.join(ROOT, "lib/data/news-posts.json");
await writeFile(jsonPath, JSON.stringify(out, null, 2));

const csvCell = (v) => {
  const s = Array.isArray(v) ? v.join(" | ") : String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const COLS = [
  "slug", "publishedAt", "category", "series", "categoryResolvedBy", "author",
  "players", "playerNames", "wpEvent", "tags", "hasImage", "inlineImages",
  "embeds", "words", "title",
];
const csv = [
  COLS.join(","),
  ...out.map((p) =>
    [
      p.slug, p.publishedAt.slice(0, 10), p.category, p.series ?? "", p.categoryResolvedBy,
      p.author, p.players, p.playerNames, p.wpEvent?.slug ?? "", p.tags,
      p.image ? "yes" : "NO", p.inlineImages.length, p.embeds.length,
      stripTags(p.bodyHtml).split(/\s+/).filter(Boolean).length, p.title,
    ].map(csvCell).join(","),
  ),
].join("\n");
const csvPath = path.join(SCRATCH, "wp-inventory.csv");
await writeFile(csvPath, csv);

const mediaManifest = [...assets.entries()].map(([url, meta]) => ({ url, ...meta }));
await writeFile(path.join(SCRATCH, "wp-media-manifest.json"), JSON.stringify(mediaManifest, null, 2));
await writeFile(path.join(SCRATCH, "wp-import-warnings.txt"), warnings.join("\n"));

/*
 * No redirect map is emitted any more: `app/[slug]` serves each post at the
 * same root URL WordPress used, so there is nothing to redirect. Slugs are
 * verified collision-free against the site's route segments in next.config.ts.
 */

/* ─────────────────────────── report ─────────────────────────── */

const tally = (key) =>
  Object.entries(out.reduce((a, p) => ((a[p[key] ?? "—"] = (a[p[key] ?? "—"] || 0) + 1), a), {}))
    .sort((a, b) => b[1] - a[1]);

console.log(`\nimported ${out.length} posts\n`);
console.log("category:");
for (const [k, n] of tally("category")) console.log(`   ${String(n).padStart(4)}  ${k}`);
console.log("\nresolved by:");
for (const [k, n] of tally("categoryResolvedBy")) console.log(`   ${String(n).padStart(4)}  ${k}`);
console.log("\nauthor:");
for (const [k, n] of tally("author")) console.log(`   ${String(n).padStart(4)}  ${k}`);
console.log(`\nplayer links resolved:  ${out.filter((p) => p.players.length).length} posts`);
console.log(`unresolved player names: ${new Set(out.flatMap((p) => p.playerNames)).size}`);
console.log(`event label present:     ${out.filter((p) => p.wpEvent).length} posts`);
console.log(`missing featured image:  ${out.filter((p) => !p.image).length} posts`);
console.log(`assets to rehost:        ${mediaManifest.length}`);
console.log(`warnings:                ${warnings.length}`);
console.log(`\n  ${path.relative(ROOT, jsonPath)}`);
console.log(`  ${csvPath}`);
console.log(`  ${path.join(SCRATCH, "wp-media-manifest.json")}`);

console.log(`  ${path.join(SCRATCH, "wp-import-warnings.txt")}`);
