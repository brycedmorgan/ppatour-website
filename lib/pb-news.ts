/**
 * Live news/blog articles from pickleball.com, surfaced on ppatour.com.
 *
 * Server-only: the API key never reaches the browser. Articles are never
 * copied or stored — they are fetched under ISR so the feed stays in sync with
 * pickleball.com, and every card links OUT to the original article rather than
 * republishing the body (no duplicate content, no canonical juggling).
 *
 * ── ENV NAMES: deliberately NOT the ones in the integration doc ────────────
 * The doc specifies `PB_API_BASE_URL` / `PB_API_KEY`. `PB_API_BASE_URL` is
 * already `https://api.pickleball.com` in this project and is read by ten
 * modules (rankings, events, scores, brackets, athlete stats, ticker,
 * tournaments…). Reusing it would repoint all of them at the news host and take
 * down most of the dynamic site, so this integration uses its own prefix.
 *
 * ── CONTRACT STATUS (probed live 2026-07-30) ──────────────────────────────
 * CONFIRMED by probing api.pickleballdev.net:
 *   · Auth header is `PB-API-TOKEN` — NOT the doc's `Authorization: <key>`,
 *     which returns 301/404. Verified by getting 200 on /v2/data/partner_rankings
 *     with the same key.
 *   · The router recognizes the resource path `/news`; it echoes `path=/news`.
 *   · The dev host accepts the two DEV keys. Both PROD keys return 401 there,
 *     so production is a different host and still needs confirming.
 *
 * BLOCKED, and not discoverable until access is granted:
 *   · Both dev keys authenticate but are refused on the news path:
 *       {"Code":403,"Error":"platform access denied: platformID=9 path=/news"}
 *     PPA Dev = platformID 9, Canada Dev = platformID 37.
 *   · So the exact filter params, response field names, and pagination params
 *     are still unverified. `mapArticle` below is written defensively to accept
 *     the plausible spellings; once the real payload is visible, delete the
 *     alternatives and keep what is real.
 *
 * Until the grant lands, `getPickleballNews()` returns an empty list with a
 * reason. Nothing renders — deliberately. The four "From Pickleball.com" items
 * this replaces were invented headlines pointing at the homepage, and the house
 * rule here is to show nothing rather than publish numbers or copy we do not
 * have (see the rankings API fallback).
 */

const DEFAULT_BASE = "https://api.pickleballdev.net";

/** Region category — "PPA" here, "PPA Canada" on the Canada build, etc. */
const DEFAULT_CATEGORY = "PPA";
const DEFAULT_TAG = "news";

/** Provisional: the path the router acknowledged. Confirm with Kenan. */
const NEWS_PATH = "/v2/news";

export type PbArticle = {
  /** Absolute pickleball.com URL — cards link out, so this is required. */
  url: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  author: string | null;
  /** ISO date, or "" when the payload has none. */
  publishedAt: string;
  category: string;
  tags: string[];
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

const EMPTY = (source: PbNewsResult["source"], reason?: string): PbNewsResult => ({
  articles: [],
  source,
  reason,
});

function config() {
  const key = process.env.PB_NEWS_API_KEY;
  if (!key) return null;
  return {
    key,
    base: (process.env.PB_NEWS_API_BASE_URL || DEFAULT_BASE).replace(/\/$/, ""),
    category: process.env.PB_NEWS_CATEGORY || DEFAULT_CATEGORY,
    tag: process.env.PB_NEWS_TAG || DEFAULT_TAG,
  };
}

/** First non-empty string among the candidate keys. */
function pick(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}

function pickNested(row: Record<string, unknown>, path: string[]): string {
  let cur: unknown = row;
  for (const p of path) {
    if (!cur || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur.trim() : "";
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Maps one API row into `PbArticle`. Field names are unverified (see the
 * contract note above), so each value tries the plausible spellings and falls
 * back to "". A row with no resolvable URL or title is dropped rather than
 * rendered as a broken card.
 */
function mapArticle(raw: unknown): PbArticle | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  // `permalink` belongs with the absolute-URL candidates, not the slug ones:
  // treating it as a slug produced ".../news/https://www.pickleball.com/news/x".
  const explicitUrl = pick(row, "url", "link", "permalink", "permalink_url", "canonical_url", "web_url");
  const slug = pick(row, "slug", "url_slug", "post_name");
  const url = /^https?:\/\//.test(explicitUrl)
    ? explicitUrl
    : // Belt and braces: a slug field that already holds a full URL is used as-is.
      /^https?:\/\//.test(slug)
      ? slug
      : slug
        ? `https://www.pickleball.com/news/${slug.replace(/^\/+/, "")}`
        : "";

  const title = pick(row, "title", "headline", "name", "post_title");
  if (!url || !title) return null;

  const rawExcerpt =
    pick(row, "excerpt", "summary", "description", "dek", "subtitle", "post_excerpt") ||
    pick(row, "content", "contentHtml", "body", "post_content").slice(0, 400);

  const image =
    pick(row, "heroImageUrl", "hero_image_url", "image", "image_url", "featured_image", "thumbnail", "cover_image") ||
    pickNested(row, ["image", "url"]) ||
    pickNested(row, ["featured_image", "url"]) ||
    pickNested(row, ["hero", "url"]);

  const author =
    pick(row, "author", "author_name", "byline", "post_author") || pickNested(row, ["author", "name"]);

  const tagsRaw = row.tags ?? row.tag_names ?? row.taxonomy_tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw
        .map((t) => (typeof t === "string" ? t : typeof t === "object" && t ? pick(t as Record<string, unknown>, "name", "title", "slug") : ""))
        .filter(Boolean)
    : [];

  return {
    url,
    title: stripHtml(title),
    excerpt: stripHtml(rawExcerpt),
    imageUrl: image || null,
    author: author || null,
    publishedAt: pick(row, "publishedAt", "published_at", "date", "publish_date", "created_at", "post_date"),
    category: pick(row, "category", "category_name") || pickNested(row, ["category", "name"]),
    tags,
  };
}

/** The array of rows can plausibly sit under any of these keys. */
function extractRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  for (const key of ["articles", "news", "posts", "data", "items", "results"]) {
    const v = d[key];
    if (Array.isArray(v)) return v;
    // The partner API nests one level: { results: { player_rankings: [...] } }
    if (v && typeof v === "object") {
      for (const inner of Object.values(v as Record<string, unknown>)) {
        if (Array.isArray(inner)) return inner;
      }
    }
  }
  return [];
}

/**
 * PPA-category news from pickleball.com. Never throws: any failure returns an
 * empty list with a reason so the page renders without the section rather than
 * erroring or inventing content.
 *
 * @param limit how many articles the caller wants (page size).
 */
export async function getPickleballNews(limit = 6): Promise<PbNewsResult> {
  const cfg = config();
  if (!cfg) return EMPTY("unconfigured", "PB_NEWS_API_KEY is not set");

  const params = new URLSearchParams({
    category: cfg.category,
    tag: cfg.tag,
    current_page: "1",
    page_size: String(Math.max(1, limit)),
  });
  const url = `${cfg.base}${NEWS_PATH}?${params}`;

  try {
    const res = await fetch(url, {
      // Confirmed by probe: PB-API-TOKEN, not `Authorization`.
      headers: { "PB-API-TOKEN": cfg.key },
      // 10 minutes: fresh enough for news, and it keeps a busy page off the API.
      next: { revalidate: 600, tags: ["pb-news"] },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 401 || res.status === 403) {
      const body = await res.text().catch(() => "");
      return EMPTY(
        "denied",
        `HTTP ${res.status} — the key is not authorized for ${NEWS_PATH}. ${body.slice(0, 160)}`,
      );
    }
    if (!res.ok) return EMPTY("error", `HTTP ${res.status} on ${NEWS_PATH}`);

    const rows = extractRows(await res.json());
    const articles = rows.map(mapArticle).filter((a): a is PbArticle => a !== null);
    // A 200 that yields nothing usable means the shape moved — surface it as an
    // error so it does not read as "pickleball.com published nothing".
    if (rows.length > 0 && articles.length === 0) {
      return EMPTY("error", `${rows.length} rows returned but none matched the expected shape`);
    }
    return { articles: articles.slice(0, limit), source: "live" };
  } catch (err) {
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
