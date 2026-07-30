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
 * ── CONTRACT STATUS (2026-07-30) ──────────────────────────────────────────
 * CONFIRMED:
 *   · Host is api.pickleball.com. Probed: the partner token returns 200 on
 *     /v2/data/partner_rankings there. api.pickleballdev.net is the dev host.
 *   · Path is /v2/data/news — confirmed by Kenan. NOT /v2/news, and
 *     /v2/articles does not exist (both were guesses of mine).
 *   · Auth header is PB-API-TOKEN, NOT the doc's `Authorization: <key>`,
 *     which 301s. Verified against the working partner_rankings call.
 *   · Credentials: the token this project already holds IS the PPA platform
 *     (platformID 9), so none of the doc's four keys are needed here. Its two
 *     prod keys 401 on api.pickleball.com with "get platform: record not
 *     found" and look stale — Canada will need a valid one.
 *
 * BLOCKED on one grant, and not discoverable from outside:
 *   · GET /v2/data/news -> 403
 *     {"Error":"platform access denied: platformID=9 path=/data/news"}
 *     Identical with ?category=PPA&tag=news attached. The gateway rejects on
 *     platform before routing, so response field names, the exact filter
 *     values and the pagination params cannot be read until platformID 9 is
 *     allowlisted. `mapArticle` therefore accepts the plausible spellings;
 *     collapse it to the real ones once a payload is visible.
 *
 * Until then getPickleballNews() returns an empty list with a reason and
 * nothing renders — deliberately. The four "From Pickleball.com" items this
 * replaced were invented headlines pointing at the homepage, and the house rule
 * is to show nothing rather than publish content we do not have.
 */

/**
 * Production host, confirmed by probe: the existing `PB_API_TOKEN` returns 200
 * on /v2/data/partner_rankings here. `api.pickleballdev.net` is the dev host.
 */
const DEFAULT_BASE = "https://api.pickleball.com";

/** Region category — "PPA" here, "PPA Canada" on the Canada build, etc. */
const DEFAULT_CATEGORY = "PPA";
const DEFAULT_TAG = "news";

/** Confirmed by Kenan 2026-07-30: it is /v2/data/news, not /v2/news. */
const NEWS_PATH = "/v2/data/news";

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

/**
 * Credentials default to the partner token this project already uses, because
 * that token IS the PPA platform: probing showed it resolves to platformID 9 —
 * the same platform as the "PPA Dev" key in the integration doc — and it
 * already authenticates against the production host. So none of the doc's four
 * keys are needed for ppatour.com; there is one credential to rotate, not two.
 *
 * `PB_NEWS_API_KEY` / `PB_NEWS_API_BASE_URL` remain optional overrides, which is
 * what the Canada build (and any future region on its own platform) sets.
 */
function config() {
  const key = process.env.PB_NEWS_API_KEY || process.env.PB_API_TOKEN;
  if (!key) return null;
  const base =
    process.env.PB_NEWS_API_BASE_URL || process.env.PB_API_BASE_URL || DEFAULT_BASE;
  return {
    key,
    base: base.replace(/\/$/, ""),
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
