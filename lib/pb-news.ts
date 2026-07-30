/**
 * Live PPA news from pickleball.com, surfaced on ppatour.com.
 *
 * Server-only: the API token never reaches the browser. Articles are never
 * copied or stored — they are fetched under ISR so the feed stays in sync, and
 * every card links OUT to the original on pickleball.com rather than
 * republishing the body (no duplicate content, no canonical juggling).
 *
 * ── CONTRACT (verified against api.pickleball.com, 2026-07-30) ─────────────
 *   GET /v2/data/news
 *   header  PB-API-TOKEN: <token>          (NOT `Authorization`, which 301s)
 *   params  is_active=true                 REQUIRED — 400 without it
 *           is_blog=false                  REQUIRED — 400 without it
 *           subcategory_uuid=<PPA>         the PPA filter (see below)
 *           current_page, page_size        1-indexed pagination
 *   returns { total_records, current_page, page_size, next_page, prev_page,
 *             results: { news_articles: [ … ] } }
 *
 * ⚠ THE DOC'S FILTER DOES NOT WORK. `category=PPA` is silently IGNORED — it
 * returns all 3,870 articles, i.e. the entire pickleball.com newsroom including
 * MLP, APP, gear and fashion. There is no "PPA" category at all: news_category
 * is one of News / People / Culture / Learn / Gear / Fashion. Shipping the doc's
 * filter would have leaked non-PPA content straight onto the site.
 *
 * PPA content is a SUBCATEGORY. `subcategory_uuid=5a3a363b-…` returns 1,444
 * articles, every one under parent category "News", and the titles are
 * unmistakably tour coverage ("PPA Finals hopefuls", "Championship Sunday",
 * "captures first PPA gold medal"). The UUID is not self-describing and the
 * lookup endpoints (/v2/data/news_categories, …_subcategories, …_tags) are all
 * 403 for this platform, but the UUID was confirmed another way: pickleball.com's
 * public news index embeds it as {"title":"PPA Tour","slug":"ppa"}. Still
 * env-overridable, and worth asking whether any OTHER subcategory also carries
 * PPA content.
 *
 * ⚠ SORTING IS BROKEN SERVER-SIDE. `sort_by` selects a field and validates it
 * (a bad value 400s), but `sort_order` has no effect: asc, desc, ASC, DESC,
 * descending, 1 and -1 all return the same ascending order. So newest-first is
 * achieved by walking to the LAST page and reversing — verified: the final page
 * holds "PPA Tour calendar gets a shakeup" (2026-07-01), the genuine newest.
 *
 * ── ENV NAMES: deliberately NOT the doc's ──────────────────────────────────
 * The doc says `PB_API_BASE_URL` / `PB_API_KEY`. `PB_API_BASE_URL` is already
 * https://api.pickleball.com here and is read by ten modules (rankings, events,
 * scores, brackets, athlete stats, ticker, tournaments…) — reusing it would
 * repoint all of them. Credentials default to the token this project already
 * holds, which IS the PPA platform (platformID 9), so none of the doc's four
 * keys are needed. PB_NEWS_* stay as overrides for the Canada build.
 */

const DEFAULT_BASE = "https://api.pickleball.com";
const NEWS_PATH = "/v2/data/news";

/**
 * The "PPA Tour" subcategory. CONFIRMED, not inferred: pickleball.com's own news
 * index embeds
 *   {"uuid":"5a3a363b-8618-4e10-ab61-242612d4dbfd","title":"PPA Tour",
 *    "slug":"ppa","categoryUuid":"579527f7-…"}   ← parent category "News"
 * so this is the tour feed, nested under News. Env-overridable all the same.
 */
const DEFAULT_SUBCATEGORY = "5a3a363b-8618-4e10-ab61-242612d4dbfd";

/** Public article URL. www redirects to the bare host, so skip the hop. */
const PUBLIC_BASE = "https://pickleball.com/news";

/** Rows per request when walking to the last page. */
const PAGE = 60;

export type PbArticle = {
  /** Absolute pickleball.com URL — cards link out, so this is required. */
  url: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  imageAlt: string;
  author: string | null;
  /** ISO date, or "" when the payload has none. */
  publishedAt: string;
  /** Parent editorial category — "News", "People", … */
  category: string;
};

export type PbNewsResult = {
  articles: PbArticle[];
  /**
   * `live` only when the API answered. Anything else means nothing should
   * render — and tells monitoring the difference between "no articles" and
   * "we cannot reach the feed", which otherwise look identical.
   */
  source: "live" | "unconfigured" | "denied" | "error";
  reason?: string;
};

type ApiRow = {
  slug?: string;
  title?: string;
  description?: string;
  content?: string;
  image_url?: string;
  image_alt_text?: string;
  small_news_card_img_url?: string;
  author_full_name?: string;
  publish_date_displayed?: string;
  date_created?: string;
  external_url?: string;
  news_category?: { title?: string } | null;
};

type ApiEnvelope = {
  total_records?: number;
  results?: { news_articles?: ApiRow[] };
};

const EMPTY = (source: PbNewsResult["source"], reason?: string): PbNewsResult => ({
  articles: [],
  source,
  reason,
});

function config() {
  const key = process.env.PB_NEWS_API_KEY || process.env.PB_API_TOKEN;
  if (!key) return null;
  const base =
    process.env.PB_NEWS_API_BASE_URL || process.env.PB_API_BASE_URL || DEFAULT_BASE;
  return {
    key,
    base: base.replace(/\/$/, ""),
    subcategory: process.env.PB_NEWS_SUBCATEGORY_UUID || DEFAULT_SUBCATEGORY,
  };
}

const clean = (s: string | undefined) =>
  (s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

/**
 * Image paths are not URL-encoded upstream — one real filename is
 * `…/maggie:mary brascia .jpeg`, whose raw spaces break next/image. Encode
 * without double-encoding anything already escaped.
 */
function safeImage(raw: string | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  try {
    return encodeURI(decodeURI(s));
  } catch {
    return null;
  }
}

function mapRow(row: ApiRow): PbArticle | null {
  const title = clean(row.title);
  const slug = (row.slug ?? "").trim();
  // Prefer the pickleball.com page (verified 200). external_url is only a
  // fallback for outlet-sourced items with no page of their own.
  const url = slug
    ? `${PUBLIC_BASE}/${slug}`
    : /^https?:\/\//.test(row.external_url ?? "")
      ? (row.external_url as string)
      : "";
  if (!url || !title) return null;

  return {
    url,
    title,
    excerpt: clean(row.description) || clean(row.content).slice(0, 220),
    imageUrl: safeImage(row.image_url) ?? safeImage(row.small_news_card_img_url),
    imageAlt: clean(row.image_alt_text),
    author: clean(row.author_full_name) || null,
    publishedAt: (row.publish_date_displayed || row.date_created || "").trim(),
    category: clean(row.news_category?.title),
  };
}

/**
 * PPA news from pickleball.com, newest first. Never throws: any failure returns
 * an empty list with a reason so the page renders without the section rather
 * than erroring or inventing content.
 */
export async function getPickleballNews(limit = 6): Promise<PbNewsResult> {
  if (limit <= 0) return { articles: [], source: "live" };
  const cfg = config();
  if (!cfg) return EMPTY("unconfigured", "no PB_NEWS_API_KEY or PB_API_TOKEN");

  const endpoint = (page: number, size: number) =>
    `${cfg.base}${NEWS_PATH}?` +
    new URLSearchParams({
      is_active: "true",
      is_blog: "false",
      subcategory_uuid: cfg.subcategory,
      current_page: String(page),
      page_size: String(size),
    });

  async function get(page: number, size: number): Promise<ApiEnvelope> {
    const res = await fetch(endpoint(page, size), {
      headers: { "PB-API-TOKEN": cfg!.key },
      // 10 minutes: fresh enough for news, and it keeps a busy page off the API.
      next: { revalidate: 600, tags: ["pb-news"] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const err = new Error(`HTTP ${res.status} ${body.slice(0, 180)}`) as Error & {
        status?: number;
      };
      err.status = res.status;
      throw err;
    }
    return (await res.json()) as ApiEnvelope;
  }

  try {
    // One cheap call for the count, because the newest articles live on the LAST
    // page (see the sorting note above) and its number depends on the total.
    const head = await get(1, 1);
    const total = head.total_records ?? 0;
    if (total === 0) return { articles: [], source: "live" };

    const lastPage = Math.max(1, Math.ceil(total / PAGE));
    const rows = (await get(lastPage, PAGE)).results?.news_articles ?? [];
    let newest = [...rows].reverse();

    // The final page can be short; top up from the page before so `limit` is
    // still satisfiable.
    if (newest.length < limit && lastPage > 1) {
      const prev = (await get(lastPage - 1, PAGE)).results?.news_articles ?? [];
      newest = [...newest, ...prev.reverse()];
    }

    const articles = newest
      .map(mapRow)
      .filter((a): a is PbArticle => a !== null)
      .slice(0, limit);

    if (rows.length > 0 && articles.length === 0) {
      return EMPTY("error", `${rows.length} rows returned but none were usable`);
    }
    return { articles, source: "live" };
  } catch (err) {
    const status = (err as Error & { status?: number }).status;
    if (status === 401 || status === 403) {
      return EMPTY("denied", `HTTP ${status} — token not authorized for ${NEWS_PATH}`);
    }
    return EMPTY("error", err instanceof Error ? err.message : String(err));
  }
}

/** Formats an ISO-ish date for a card; "" when the payload had no date. */
export function pbArticleDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
