/**
 * PPA Tour newsroom — full articles behind every headline. Demo editorial:
 * original copy grounded in the site's own season data (roster, rankings,
 * calendar, purses, broadcast). No direct quotes are attributed to real
 * players. Swap for Sanity CMS when the content pipeline lands.
 *
 * ── APPROVAL GATE (Connor's directive, 7/20) ─────────────────────────────
 * Nothing AI-written goes live or silently mutates without a human click.
 * Every NEW or REWRITTEN article MUST be committed with `status: "draft"`.
 * Drafts never render anywhere (no index, no page, no sitemap, no event
 * coverage, no homepage). Dylan approves by flipping `status` to
 * "published" in a follow-up commit. When Sanity lands, this field maps
 * onto Sanity's native draft/publish and Dylan approves in the Studio.
 * Full workflow: docs/CONTENT-APPROVAL.md
 */

export type NewsArticle = {
  slug: string;
  /**
   * Approval gate — REQUIRED. New/updated AI-generated articles start as
   * "draft" (invisible site-wide) until Dylan flips them to "published".
   */
  status: "published" | "draft";
  category: string;
  title: string;
  /** Display date, e.g. "May 17" (2026). */
  date: string;
  dek: string;
  image: string;
  whyItMatters: string;
  /** Ties coverage to a tour stop — event pages render these under "Coverage". */
  eventSlug?: string;
  /** Featured athletes (slugs) — merged with auto-detected name mentions. */
  players?: string[];
  body: string[];
};

/**
 * ⚠ EMPTY ON PURPOSE — Bryce, 8/5. The 15 demo articles that lived here were
 * AI-written editorial about REAL, NAMED pros: original copy grounded in the
 * site's own season data, but not reporting. Fine as a demo, wrong on a live
 * tour site that the whole company was about to be pointed at.
 *
 * ⚠ THIS DID NOT EMPTY THE NEWSROOM. /news, search, the homepage rail and the
 * sitemap all read `lib/news.ts`, which merges this list with the 811 migrated
 * WordPress posts + 39 PPA Blog entries — every one of them written and
 * published by a human. Those are untouched and remain the entire feed.
 *
 * What DID go dark: `newsForEvent()` is native-only, so event pages no longer
 * render a Coverage section (every call site already guards on
 * `coverage.length > 0`). Mapping the 322 WP posts that carry an event
 * category onto this site's event slugs is what lights it back up — see the
 * note on `newsForEvent` in lib/news.ts.
 *
 * The approval gate below stays exactly as it was. Real articles land here as
 * `status: "draft"` and Dylan publishes them (docs/CONTENT-APPROVAL.md), or
 * they arrive from Sanity when that pipeline lands.
 */
export const newsArticles: NewsArticle[] = [];

/**
 * Approved articles only — the ONLY list any page should render from.
 * Drafts (pending Dylan's approval) are invisible everywhere.
 */
export const publishedArticles: NewsArticle[] = newsArticles.filter(
  (a) => a.status === "published",
);

/** A single approved article; drafts resolve to undefined (→ 404). */
export function getArticle(slug: string): NewsArticle | undefined {
  return publishedArticles.find((a) => a.slug === slug);
}

/** Approved coverage attached to a tour stop — the event's editorial history. */
export function getArticlesForEvent(eventSlug: string): NewsArticle[] {
  return publishedArticles.filter((a) => a.eventSlug === eventSlug);
}
