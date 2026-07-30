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
import { getWpPost, wpPostSummaries, type WpPost } from "@/lib/wp-news";
import { resolveAsset } from "@/lib/wp-media";
import { athletes, getAthlete } from "@/lib/athletes";
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
  eventSlug?: string;
};

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
    title: a.title,
    dek: cleanDek(a.dek),
    image: a.image,
    imageAlt: "",
    author: HOUSE_BYLINE,
    publishedAt,
    displayDate: displayDateFromIso(publishedAt),
    source: "native",
    series: null,
    eventSlug: a.eventSlug,
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
  image: { url: string; alt: string } | null;
}): NewsCard {
  return {
    slug: p.slug,
    href: `/${p.slug}`,
    category: p.category,
    title: p.title,
    dek: cleanDek(p.dek),
    image: p.image ? resolveAsset(p.image.url) : null,
    imageAlt: p.image?.alt ?? "",
    author: p.author,
    publishedAt: p.publishedAt,
    displayDate: displayDateFromIso(p.publishedAt),
    source: "wordpress",
    series: p.series,
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
 * The "Players in This Story" rail. Native articles keep their auto-detection
 * over the body text; WP posts use the athlete slugs the importer resolved from
 * WordPress's player categories.
 */
export function newsPlayersFor(detail: NewsDetail): NewsPlayer[] {
  if (detail.source === "wordpress") {
    return detail.post.players
      .map(toNewsPlayer)
      .filter((p): p is NewsPlayer => p !== null);
  }
  const a = detail.article;
  const mentioned = athletes
    .filter((p) => [a.dek, ...a.body].some((t) => t.includes(p.name)))
    .map((p) => p.slug);
  return [...new Set([...(a.players ?? []), ...mentioned])]
    .map(toNewsPlayer)
    .filter((p): p is NewsPlayer => p !== null);
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
