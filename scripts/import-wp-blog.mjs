/**
 * WordPress → blog import (one-time extraction, re-runnable).
 *
 * Pulls the wp-admin "PPA Blog" menu — post_type=ppa-blog, 39 evergreen
 * instructional posts at `ppatour.com/ppa-blog/{slug}/`. This is the archive
 * `scripts/import-wp-posts.mjs` deliberately skipped: it is a separate post
 * type with its own `blog-category` taxonomy and its own sitemap, so the
 * "Posts" crawl never touched it.
 *
 * WHY IT MATTERS: these are the best-ranking evergreen pages on ppatour.com
 * ("how to play pickleball", "pickleball scoring guide", "what is an erne").
 * Until this ran, next.config sent `/ppa-blog/:slug*` to `/news` — 39 ranking
 * URLs collapsing into one index, which Google reads as a soft 404 and drops.
 * Flagged by Hannah Johns 2026-08-04.
 *
 * ── Differences from the Posts importer ──────────────────────────────────
 * The taxonomy problem that file solves does not exist here. `blog-category`
 * has exactly four terms, all genuine sections, no player or event axis mixed
 * in. So the category is read straight off the term instead of being derived.
 *
 * The flip side: with no player categories, the "Players in This Story" rail
 * has no source. Athlete slugs are resolved by matching published roster names
 * against the title and body — conservative (full-name match only), and title
 * hits sort first.
 *
 * Output: lib/data/blog-posts.json, in the same shape as news-posts.json plus
 * `postType`, `blogCategory` and `blogCategories`, so it can be concatenated
 * into the same accessors and swept by `sync-wp-media.mjs` unchanged.
 *
 * Usage:  node scripts/import-wp-blog.mjs [--out <dir>] [--limit N]
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

/** Same map as the Posts importer — the two archives share WP accounts. */
const BYLINES = {
  "e-parker": "Evan Parker",
  "h-johns": "Hannah Johns",
  "n-boschult": "Nathan Boschult",
  "l-borski": "Liv Borski",
  "e-santerre": "Emma Santerre",
  yiyunzhou: "PPA Tour",
  "pete-7twodesign": "PPA Tour",
  "m-cudzinowski": "PPA Tour",
  "w-ahlfeld": "PPA Tour",
};
const HOUSE_BYLINE = "PPA Tour";

/**
 * The newsroom category these carry in the merged feed. One bucket, not four —
 * `blogCategory` keeps the WP section for the /blog filter chips, and the
 * newsroom's existing chips (Recap, Analysis, Feature…) stay a closed set.
 */
const NEWS_CATEGORY = "Blog";

/**
 * blog-category slug → display label for the /blog filter. WP's names all lead
 * with "Pickleball", which is redundant inside a pickleball blog and makes the
 * chips wrap on mobile.
 */
const SECTION_LABELS = {
  "pickleball-learning": "Learning",
  "pickleball-gear": "Gear",
  "pickleball-terminology": "Terminology",
  "pickleball-players": "Players",
};
/** Chip order — broadest first, matching how the archive actually skews. */
const SECTION_ORDER = [
  "pickleball-learning",
  "pickleball-gear",
  "pickleball-terminology",
  "pickleball-players",
];

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

console.log(`WordPress import — ${WP} (post_type=ppa-blog)\n`);

const [rawSections, rawUsers] = await Promise.all([
  getAll("blog-category", "id,name,slug,count"),
  getAll("users", "id,name,slug"),
]);

const posts = await getAll(
  "ppa-blog",
  "id,slug,date,date_gmt,modified,link,title,excerpt,content,author,featured_media,blog-category,yoast_head_json",
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

const sectionById = Object.fromEntries(rawSections.map((c) => [c.id, c]));
const userById = Object.fromEntries(rawUsers.map((u) => [u.id, u]));

for (const s of rawSections) {
  if (!SECTION_LABELS[s.slug]) {
    console.warn(`⚠ new blog-category "${s.slug}" (${s.count} posts) — add it to SECTION_LABELS`);
  }
}

/**
 * Athlete resolution. No player taxonomy on this post type, so names are
 * matched out of the copy against the roster the site already publishes.
 * Full-name only: a bare "Ben" would hit half the archive.
 */
const roster = JSON.parse(readFileSync(path.join(ROOT, "lib/data/published-athletes.json"), "utf8"));
/** Longest names first, so "Anna Leigh Waters" wins over a "Leigh Waters" substring. */
const rosterByLength = [...roster].sort((a, b) => b.name.length - a.name.length);
const MAX_PLAYERS = 5;

function detectPlayers(title, bodyText) {
  const inTitle = [];
  const inBody = [];
  const claimed = [];
  for (const a of rosterByLength) {
    // Skip a name already contained in a longer name we matched (Leigh Waters
    // inside Anna Leigh Waters) — it is the same mention, not a second player.
    if (claimed.some((n) => n.includes(a.name))) continue;
    if (title.includes(a.name)) {
      inTitle.push(a.slug);
      claimed.push(a.name);
    } else if (bodyText.includes(a.name)) {
      inBody.push(a.slug);
      claimed.push(a.name);
    }
  }
  return [...inTitle, ...inBody].slice(0, MAX_PLAYERS);
}

/* ─────────────────────────── transform ─────────────────────────── */

const IMG_RE = /<img[^>]+src=["']([^"']+)["']/gi;
const IFRAME_RE = /<iframe[^>]+src=["']([^"']+)["']/gi;
const SHORTCODE_RE =
  /\[(gallery|caption|embed|playlist|audio|video|vc_[a-z_]+|et_pb_[a-z_]+|contact-form-7|wpforms|ninja_form|su_[a-z_]+)[\s\]/]/gi;

const wpHost = new URL(WP).host;
const out = [];
const assets = new Map();
const warnings = [];

for (const p of posts.slice(0, LIMIT)) {
  const title = decode(p.title?.rendered || "");
  const terms = (p["blog-category"] || []).map((id) => sectionById[id]).filter(Boolean);
  const sections = SECTION_ORDER.filter((s) => terms.some((t) => t.slug === s)).concat(
    terms.map((t) => t.slug).filter((s) => !SECTION_ORDER.includes(s)),
  );
  if (sections.length === 0) warnings.push(`${p.slug}: no blog-category`);

  const html = p.content?.rendered || "";
  const bodyText = stripTags(html);
  if (bodyText.length < 50) warnings.push(`${p.slug}: body is empty or near-empty in WP`);

  const inline = [];
  for (const m of html.matchAll(IMG_RE)) inline.push(m[1]);
  const embeds = [...html.matchAll(IFRAME_RE)].map((m) => m[1]);

  for (const src of inline) {
    let host = "";
    try { host = new URL(src, WP).host; } catch { continue; }
    if (host === wpHost) assets.set(src, { kind: "inline", post: p.slug });
  }
  const featured = media[p.featured_media] ?? null;
  if (featured?.url) assets.set(featured.url, { kind: "featured", post: p.slug });
  else warnings.push(`${p.slug}: no featured image`);

  const shortcodes = [...new Set([...html.matchAll(SHORTCODE_RE)].map((m) => m[1].toLowerCase()))];
  if (shortcodes.length) warnings.push(`${p.slug}: unrendered shortcode-like tokens [${shortcodes.join(", ")}]`);

  const y = p.yoast_head_json || {};

  out.push({
    slug: p.slug,
    wpId: p.id,
    status: "published",
    source: "wordpress",
    /** Drives the URL prefix in lib/news.ts — these do NOT live at the root. */
    postType: "ppa-blog",
    category: NEWS_CATEGORY,
    /** Primary WP section, for the /blog filter chips. */
    blogCategory: sections[0] ?? null,
    blogCategories: sections,
    /** Kept for parity with news posts; the section is the closest analogue. */
    series: sections[0] ?? null,
    categoryResolvedBy: sections.length ? "blog-category" : "fallback",
    title,
    dek: stripTags(p.excerpt?.rendered || ""),
    author: BYLINES[userById[p.author]?.slug] ?? userById[p.author]?.name ?? HOUSE_BYLINE,
    publishedAt: p.date,
    publishedAtGmt: p.date_gmt,
    modifiedAt: p.modified,
    bodyHtml: html,
    image: featured,
    players: detectPlayers(title, bodyText),
    playerNames: [],
    wpEvent: null,
    tags: sections.map((s) => SECTION_LABELS[s] ?? s),
    tagsRaw: terms.map((t) => decode(t.name)),
    wpCategories: sections,
    embeds,
    inlineImages: inline,
    /** Old URL — and the one this site keeps serving, byte-for-byte. */
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

/**
 * Collision guard. Blog posts are served at /ppa-blog/{slug} and news posts at
 * /{slug}, so a shared slug would not collide in routing — but both feed one
 * `getNewsDetail()` lookup keyed by slug alone, and the loser would silently
 * become unreachable. Verified clean 2026-08-04; this fails the import rather
 * than shipping a shadowed post.
 */
const newsSlugs = new Set(
  JSON.parse(readFileSync(path.join(ROOT, "lib/data/news-posts.json"), "utf8")).map((p) => p.slug),
);
const collisions = out.map((p) => p.slug).filter((s) => newsSlugs.has(s));
if (collisions.length) {
  throw new Error(
    `slug collision with news-posts.json (${collisions.length}): ${collisions.join(", ")}\n` +
      "Both archives share one slug-keyed lookup — resolve before importing.",
  );
}

await writeFile(path.join(ROOT, "lib/data/blog-posts.json"), JSON.stringify(out, null, 2));

const csvCell = (v) => {
  const s = Array.isArray(v) ? v.join(" | ") : String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const COLS = [
  "slug", "publishedAt", "blogCategory", "author", "players", "hasImage",
  "inlineImages", "embeds", "words", "title",
];
const csv = [
  COLS.join(","),
  ...out.map((p) =>
    [
      p.slug, p.publishedAt.slice(0, 10), p.blogCategory ?? "", p.author, p.players,
      p.image ? "yes" : "NO", p.inlineImages.length, p.embeds.length,
      stripTags(p.bodyHtml).split(/\s+/).filter(Boolean).length, p.title,
    ].map(csvCell).join(","),
  ),
].join("\n");
await writeFile(path.join(SCRATCH, "wp-blog-inventory.csv"), csv);

const mediaManifest = [...assets.entries()].map(([url, meta]) => ({ url, ...meta }));
await writeFile(path.join(SCRATCH, "wp-blog-media-manifest.json"), JSON.stringify(mediaManifest, null, 2));
await writeFile(path.join(SCRATCH, "wp-blog-import-warnings.txt"), warnings.join("\n"));

/* ─────────────────────────── report ─────────────────────────── */

const tally = (key) =>
  Object.entries(out.reduce((a, p) => ((a[p[key] ?? "—"] = (a[p[key] ?? "—"] || 0) + 1), a), {}))
    .sort((a, b) => b[1] - a[1]);

console.log(`\nimported ${out.length} blog posts\n`);
console.log("section:");
for (const [k, n] of tally("blogCategory")) console.log(`   ${String(n).padStart(3)}  ${k}`);
console.log("\nbyline:");
for (const [k, n] of tally("author")) console.log(`   ${String(n).padStart(3)}  ${k}`);
console.log(`\nassets referenced: ${assets.size}`);
console.log(`posts with a detected player: ${out.filter((p) => p.players.length).length}`);
console.log(`\nwarnings: ${warnings.length}  → ${path.join(SCRATCH, "wp-blog-import-warnings.txt")}`);
console.log(`inventory  → ${path.join(SCRATCH, "wp-blog-inventory.csv")}`);
console.log(`data       → lib/data/blog-posts.json`);
