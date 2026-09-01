/**
 * The single newsroom accessor: the 811 migrated WordPress posts plus the
 * hand-written articles in `lib/news-articles.ts`, merged into one date-sorted
 * feed.
 *
 * ⚠ SERVER-ONLY — this pulls in `lib/wp-news.ts` and therefore the ~6.3 MB
 * archive. See the header of that file for why the WP posts are deliberately
 * NOT merged into `lib/news-articles.ts` or `lib/home-content.ts` (both sit in
 * the import graph of client components).
 *
 * `lib/news-articles.ts` stays the source of truth for native articles and
 * keeps its approval gate — WP posts arrive already `status: "published"`
 * because they were published by a human in WordPress; the draft gate exists
 * for AI-written copy (docs/CONTENT-APPROVAL.md).
 */

import { publishedArticles, type NewsArticle } from "@/lib/news-articles";
import {
  getWpPost,
  wpBlogSummaries,
  wpPostSummaries,
  type WpPost,
  type WpPostType,
} from "@/lib/wp-news";
import { resolveAsset } from "@/lib/wp-media";
import { postPlainText } from "@/lib/news-html";
import { getAthlete } from "@/lib/athletes";
import { detectAthleteMentions } from "@/lib/article-players";
import { getPublishedAthlete, publishedProfileSlug } from "@/lib/published-athletes";

export type NewsSource = "native" | "wordpress";

/** List/card projection — no post body. */
export type NewsCard = {
  slug: string;
  href: string;
  category: string;
  title: string;
  dek: string;
  /** null when the post has no usable featured image (12 WP posts). */
  image: string | null;
  imageAlt: string;
  author: string;
  /** ISO-ish timestamp; the sort key. */
  publishedAt: string;
  /** Pre-formatted "Jul 22, 2026" — built from date parts, not a Date object. */
  displayDate: string;
  source: NewsSource;
  /** Originating WP editorial series, or null for native articles. */
  series: string | null;
  /**
   * "ppa-blog" for the 39 evergreen posts, which live under `/ppa-blog/` and
   * must NOT also be served at the root. Native articles and the 811 migrated
   * posts are both "post".
   */
  postType: WpPostType;
  eventSlug?: string;
  /** Hero standfirst under the H1; unset on every WP post. Native only. */
  subtitle?: string;
  /**
   * Per-article ticket CTA override; unset = the next tour stop. Native only.
   * See the field docs on `NewsArticle` for why an announcement needs it.
   */
  ctaUrl?: string;
  ctaLabel?: string;
  /** Hero-only `object-position` override; unset = `object-center`. Native only. */
  imagePosition?: string;
  /**
   * Hero image is a designed GRAPHIC (its own lockup/logos/type), not a photo.
   * ArticleView then shows it whole (uncropped) with the headline on a band
   * below instead of overlaid on top. Native only; unset = the photo hero.
   */
  heroGraphic?: boolean;
};

/**
 * The URL prefix each archive keeps. These are the paths WordPress served and
 * Google indexed — `trailingSlash: true` makes them byte-identical — so this
 * is a preservation rule, not a routing preference. See next.config.ts.
 */
export function newsHref(slug: string, postType: WpPostType): string {
  return postType === "ppa-blog" ? `/ppa-blog/${slug}` : `/${slug}`;
}

/** Native articles carry no year in their display date; the site is 2026. */
const NATIVE_YEAR = 2026;
const HOUSE_BYLINE = "PPA Tour";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Formats from the string's own date parts. Constructing a Date would reparse
 * WP's timezone-less stamps as local time and could shift the rendered day
 * between a local build and a UTC one.
 */
function displayDateFromIso(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "May 17" → "2026-05-17T12:00:00", so natives sort against WP stamps. */
function isoFromNativeDate(date: string): string {
  const [mon, day] = date.trim().split(/\s+/);
  const m = MONTHS.findIndex((x) => x.toLowerCase() === mon?.slice(0, 3).toLowerCase());
  const d = Number(day);
  if (m === -1 || !d) return `${NATIVE_YEAR}-01-01T12:00:00`;
  return `${NATIVE_YEAR}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}T12:00:00`;
}

/**
 * Titles are plain-text fields everywhere they are used (card, <h1>, <title>,
 * OG image), but 57 of the migrated posts wrap theirs in <strong>: WordPress
 * stores markup in `title.rendered`, and the importer decoded `&lt;strong&gt;`
 * into a real tag. React then escapes it, so the tag shows up as visible text.
 */
function cleanTitle(title: string): string {
  return title
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * WordPress auto-generated excerpts carry two artifacts that read as sloppy
 * once the dek is displayed on a card: 737 of the 811 migrated posts end with
 * the "Read more" link text, and one leads with an "Author: Name" byline.
 *
 * Cleaned here rather than in the importer so it applies to the stored data
 * without a re-import (WordPress is being decommissioned, so re-running the
 * import is not a durable fix), and so cards, the article page, and the SEO
 * description fallback all get the same string.
 */
function cleanDek(dek: string): string {
  let s = dek
    // Exactly the label plus a first + last name. A greedier match would also
    // swallow the capitalized first word of the actual sentence.
    .replace(/^author\s*:\s*[A-Z][\p{L}'’-]+\s+[A-Z][\p{L}'’-]+\s*/iu, "")
    .replace(/\s*\bread\s*more\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  // Trailing punctuation is often mid-sentence after the link text is removed.
  s = s.replace(/[,;:]$/, "");
  // Signal truncation rather than leaving a sentence hanging.
  if (s && !/[.!?"'’”]$/.test(s)) s += "…";
  return s;
}

function nativeToCard(a: NewsArticle): NewsCard {
  const publishedAt = isoFromNativeDate(a.date);
  return {
    slug: a.slug,
    href: `/${a.slug}`,
    category: a.category,
    title: cleanTitle(a.title),
    dek: cleanDek(a.dek),
    image: a.image,
    imageAlt: "",
    imagePosition: a.imagePosition,
    author: a.author || HOUSE_BYLINE,
    publishedAt,
    displayDate: displayDateFromIso(publishedAt),
    source: "native",
    series: null,
    postType: "post",
    eventSlug: a.eventSlug,
    subtitle: a.subtitle,
    ctaUrl: a.ctaUrl,
    ctaLabel: a.ctaLabel,
    heroGraphic: a.heroGraphic,
  };
}

function wpToCard(p: {
  slug: string;
  category: string;
  title: string;
  dek: string;
  author: string;
  publishedAt: string;
  series: string | null;
  postType: WpPostType;
  image: { url: string; alt: string } | null;
}): NewsCard {
  return {
    slug: p.slug,
    href: newsHref(p.slug, p.postType),
    category: p.category,
    title: cleanTitle(p.title),
    dek: cleanDek(p.dek),
    image: p.image ? resolveAsset(p.image.url) : null,
    imageAlt: p.image?.alt ?? "",
    author: p.author,
    publishedAt: p.publishedAt,
    displayDate: displayDateFromIso(p.publishedAt),
    source: "wordpress",
    series: p.series,
    postType: p.postType,
  };
}

let cardCache: NewsCard[] | null = null;

/** Every published post, newest first. Built once per server process. */
export function allNews(): NewsCard[] {
  if (cardCache) return cardCache;
  cardCache = [
    ...publishedArticles.map(nativeToCard),
    ...wpPostSummaries().map(wpToCard),
  ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return cardCache;
}

export function newsCount(): number {
  return allNews().length;
}

/** Categories present in the feed with their counts, largest first. */
export function newsCategories(): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const n of allNews()) counts.set(n.category, (counts.get(n.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export type NewsPage = {
  items: NewsCard[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  category: string | null;
};

/**
 * One page of the feed. Pagination is over the filtered length, so counts and
 * page numbers stay consistent when a category filter is applied.
 */
export function newsPage(opts: { page?: number; pageSize?: number; category?: string | null } = {}): NewsPage {
  const pageSize = Math.max(1, opts.pageSize ?? 24);
  const category = opts.category ?? null;
  const pool = category
    ? allNews().filter((n) => n.category.toLowerCase() === category.toLowerCase())
    : allNews();
  const totalPages = Math.max(1, Math.ceil(pool.length / pageSize));
  const page = Math.min(Math.max(1, Math.floor(opts.page ?? 1)), totalPages);
  return {
    items: pool.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: pool.length,
    totalPages,
    category,
  };
}

/** Full detail for one post — a union so the page renders the right body. */
export type NewsDetail =
  | { source: "native"; card: NewsCard; article: NewsArticle }
  | { source: "wordpress"; card: NewsCard; post: WpPost };

export function getNewsDetail(slug: string): NewsDetail | undefined {
  const article = publishedArticles.find((a) => a.slug === slug);
  if (article) return { source: "native", card: nativeToCard(article), article };
  const post = getWpPost(slug);
  if (post) return { source: "wordpress", card: wpToCard(post), post };
  return undefined;
}

/** Every renderable slug — generateStaticParams and the sitemap. */
export function allNewsSlugs(): string[] {
  return allNews().map((n) => n.slug);
}

/* ─────────────────────────── the PPA Blog ─────────────────────────── */

/**
 * The 39 evergreen instructional posts, newest first.
 *
 * They are deliberately ALSO in `allNews()` — one archive for search, the
 * sitemap and related posts — but they carry their own URL prefix and their
 * own index at /blog, because that is how WordPress published them and how
 * they are indexed. "how to play pickleball" and "pickleball scoring guide"
 * are among the best-ranking pages the tour owns.
 */
export function allBlog(): NewsCard[] {
  return wpBlogSummaries().map(wpToCard);
}

/**
 * Posts served at the ROOT — everything except the blog. `app/[slug]` is the
 * catch-all for unknown root paths, so handing it a blog slug would publish
 * the same article at two URLs and split its own ranking.
 */
export function rootNews(): NewsCard[] {
  return allNews().filter((n) => n.postType !== "ppa-blog");
}

export type BlogSection = { slug: string; label: string; count: number };

/**
 * Sections present in the blog archive, in the importer's chip order.
 *
 * ⚠ Two posts carry no `blog-category` in WordPress (Pickleball Kitchen Rules,
 * Is Pickleball an Olympic Sport?). They are reachable in "All" and through
 * search, and are deliberately not assigned a section here — inventing a
 * taxonomy for someone else's editorial is not this file's call.
 */
export function blogSections(): BlogSection[] {
  const counts = new Map<string, number>();
  for (const p of wpBlogSummaries()) {
    for (const s of p.blogCategories ?? []) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return [...counts.entries()].map(([slug, count]) => ({
    slug,
    label: blogSectionLabel(slug),
    count,
  }));
}

/** "pickleball-learning" → "Learning". WP prefixes every term with the sport. */
export function blogSectionLabel(slug: string): string {
  return slug
    .replace(/^pickleball-/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** One section's posts, or the whole archive when `section` is null. */
export function blogPage(section: string | null): NewsCard[] {
  const all = wpBlogSummaries();
  const pool = section
    ? all.filter((p) => (p.blogCategories ?? []).includes(section))
    : all;
  return pool.map(wpToCard);
}

/**
 * Related posts: same category first, then most recent, excluding `slug`.
 */
export function relatedNews(slug: string, category: string, limit = 3): NewsCard[] {
  const pool = allNews().filter((n) => n.slug !== slug);
  const sameCategory = pool.filter((n) => n.category === category);
  return [...sameCategory, ...pool.filter((n) => n.category !== category)].slice(0, limit);
}

/* ─────────────────────── players in a story ─────────────────────── */

export type NewsPlayer = {
  /** Link slug — already resolved to one with a page. */
  slug: string;
  name: string;
  /** null for the 33 referenced athletes outside the curated roster. */
  headshot: string | null;
  division: string | null;
};

function toNewsPlayer(canonicalSlug: string): NewsPlayer | null {
  // Resolves the curated shorthand when one exists — `/athletes/[slug]` is keyed
  // by it, so linking the canonical slug would 404 (gabriel-tardio et al).
  const resolved = publishedProfileSlug(canonicalSlug);
  if (!resolved) return null;
  const curated = getAthlete(resolved);
  if (curated) {
    return {
      slug: curated.slug,
      name: curated.name,
      headshot: curated.headshot,
      division: curated.divisions[0] ?? null,
    };
  }
  const published = getPublishedAthlete(canonicalSlug);
  if (published) {
    return {
      slug: canonicalSlug,
      name: published.name,
      headshot: null,
      division: published.divisions[0] ?? null,
    };
  }
  return null;
}

/**
 * The "Players in This Story" rail — every athlete the story names who has a
 * profile to send the reader to.
 *
 * Two sources, in this order:
 *  1. Explicit tags. WordPress's player categories on a migrated post, or the
 *     `players` array on a native article. Editorial intent, so it leads.
 *  2. Names detected in the headline, dek and body (`lib/article-players.ts`),
 *     ranked by how often the piece says them.
 *
 * ⚠ TAGS ALONE WERE NOT ENOUGH, WHICH IS THE WHOLE POINT OF THE UNION. Only
 * 385 of 811 migrated posts carry any tag; another 218 name a published
 * athlete with no tag at all, and 314 of the tagged ones name athletes the
 * tags omit. The header of `lib/article-players.ts` has the measurements and
 * the reason the detector reads our published roster rather than the ranking
 * board.
 */
export function newsPlayersFor(detail: NewsDetail): NewsPlayer[] {
  const tagged =
    detail.source === "wordpress" ? detail.post.players : (detail.article.players ?? []);
  const text =
    detail.source === "wordpress"
      ? `${detail.post.title} ${detail.post.dek} ${postPlainText(detail.post.bodyHtml)}`
      : [detail.card.title, detail.article.dek, ...detail.article.body].join(" ");

  // `toNewsPlayer` resolves both to the slug the profile route prerenders, so
  // a tag and a mention of the same person collapse to one entry.
  const ordered: NewsPlayer[] = [];
  const seen = new Set<string>();
  for (const slug of [...tagged, ...detectAthleteMentions(text).map((m) => m.slug)]) {
    const player = toNewsPlayer(slug);
    if (!player || seen.has(player.slug)) continue;
    seen.add(player.slug);
    ordered.push(player);
  }
  return ordered;
}

/**
 * Coverage attached to a tour stop.
 *
 * Native articles only for now. The 322 WP posts carrying an event category
 * hold a WP label (`wpEvent`) that has not been mapped to this site's internal
 * event slugs — most of them are 2023–24 stops with no page here. Resolving
 * that mapping lights those up with no change to callers.
 */
export function newsForEvent(eventSlug: string): NewsCard[] {
  return allNews().filter((n) => n.eventSlug === eventSlug);
}

/* ─────────────────────────── keyword search ─────────────────────────── */

/**
 * Search runs on the server against `searchParams`, matching the section chips
 * and pagination on /news — no client bundle, works without JS, and it composes
 * with the category filter for free.
 *
 * Post BODIES are indexed, not just titles and tags. Measured on this archive:
 * "ben johns" matches 438 posts with bodies included versus 169 on metadata
 * alone, which is the difference between a useful archive search and one that
 * only finds headlines. The cost is a 62ms one-time index build (~3MB, memoized
 * per process) and ~1ms per query.
 */
type SearchEntry = {
  card: NewsCard;
  title: string;
  tags: string;
  dek: string;
  meta: string;
  body: string;
};

let searchIndex: SearchEntry[] | null = null;

function buildSearchIndex(): SearchEntry[] {
  if (searchIndex) return searchIndex;
  searchIndex = allNews().map((card) => {
    const detail = getNewsDetail(card.slug);
    const tags = detail?.source === "wordpress" ? detail.post.tags : [];
    const body =
      detail?.source === "wordpress"
        ? postPlainText(detail.post.bodyHtml)
        : (detail?.article.body.join(" ") ?? "");
    return {
      card,
      title: card.title.toLowerCase(),
      tags: tags.join(" ").toLowerCase(),
      dek: card.dek.toLowerCase(),
      meta: `${card.category} ${card.author} ${card.series ?? ""}`.toLowerCase(),
      body: body.toLowerCase(),
    };
  });
  return searchIndex;
}

/** Field weights — a title hit should outrank a passing body mention. */
const WEIGHT = { title: 12, tags: 6, dek: 4, meta: 3, body: 1 };

function scoreEntry(e: SearchEntry, terms: string[], phrase: string): number {
  let score = 0;
  for (const t of terms) {
    // Every term must appear somewhere (AND), else the result is irrelevant.
    let hit = 0;
    if (e.title.includes(t)) hit += WEIGHT.title;
    if (e.tags.includes(t)) hit += WEIGHT.tags;
    if (e.dek.includes(t)) hit += WEIGHT.dek;
    if (e.meta.includes(t)) hit += WEIGHT.meta;
    if (e.body.includes(t)) hit += WEIGHT.body;
    if (hit === 0) return 0;
    score += hit;
  }
  // Reward the whole query appearing intact — "anna leigh waters" beating three
  // posts that each mention one of those words.
  if (terms.length > 1) {
    if (e.title.includes(phrase)) score += WEIGHT.title * 2;
    else if (e.body.includes(phrase) || e.dek.includes(phrase)) score += WEIGHT.dek;
  }
  return score;
}

export type NewsSearchResult = NewsPage & { query: string };

/**
 * Ranked matches, paginated. Falls back to the plain feed for a blank query so
 * callers can treat search as just another filter.
 */
export function searchNews(
  opts: { query?: string; page?: number; pageSize?: number; category?: string | null } = {},
): NewsSearchResult {
  const query = (opts.query ?? "").trim().replace(/\s+/g, " ");
  if (!query) return { ...newsPage(opts), query: "" };

  const phrase = query.toLowerCase();
  const terms = [...new Set(phrase.split(" ").filter((t) => t.length > 1))];
  if (terms.length === 0) return { ...newsPage(opts), query };

  const category = opts.category ?? null;
  const scored: { card: NewsCard; score: number }[] = [];
  for (const e of buildSearchIndex()) {
    if (category && e.card.category.toLowerCase() !== category.toLowerCase()) continue;
    const score = scoreEntry(e, terms, phrase);
    if (score > 0) scored.push({ card: e.card, score });
  }
  // Score first, then recency — two equally relevant posts should read newest-first.
  scored.sort((a, b) =>
    b.score - a.score || b.card.publishedAt.localeCompare(a.card.publishedAt),
  );

  const pageSize = Math.max(1, opts.pageSize ?? 24);
  const totalPages = Math.max(1, Math.ceil(scored.length / pageSize));
  const page = Math.min(Math.max(1, Math.floor(opts.page ?? 1)), totalPages);
  return {
    items: scored.slice((page - 1) * pageSize, page * pageSize).map((s) => s.card),
    page,
    pageSize,
    total: scored.length,
    totalPages,
    category,
    query,
  };
}
