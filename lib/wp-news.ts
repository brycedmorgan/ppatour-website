/**
 * The migrated WordPress archive — 811 posts from the wp-admin "Posts" menu.
 * Produced by `scripts/import-wp-posts.mjs`; see that file for the taxonomy
 * derivation and the byline map.
 *
 * ⚠ SERVER-ONLY. `lib/data/news-posts.json` is ~6.3 MB because it carries
 * every post body. NEVER import this module (or anything re-exporting its
 * heavy accessors) from a file with "use client" — the whole archive would be
 * bundled into browser JS. `components/events/NationalsLive.tsx`,
 * `PartnerSpotlight`, `PointsRace` and `ScoreRail` are client components, and
 * `lib/home-content.ts` is in their import graph, which is exactly why the WP
 * archive is NOT merged into `lib/home-content.ts` or `lib/news-articles.ts`.
 * Client components must receive posts as props from a server parent.
 *
 * The `server-only` package isn't a dependency here, so this boundary is held
 * by convention + the summary index below rather than a build-time guard.
 */

import raw from "@/lib/data/news-posts.json";

/** Featured image as it exists upstream, pre-rehost. */
export type WpImage = {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
};

export type WpPost = {
  slug: string;
  wpId: number;
  status: "published";
  source: "wordpress";
  /** Mapped onto the site's existing category set by the importer. */
  category: string;
  /** Originating WP editorial series (stats-wrap, all-access, …) or null. */
  series: string | null;
  /** How `category` was decided — "series" | "title-pattern" | "fallback". */
  categoryResolvedBy: string;
  title: string;
  dek: string;
  author: string;
  /** ISO timestamp from WP. The real sort key. */
  publishedAt: string;
  publishedAtGmt: string;
  modifiedAt: string;
  /** Rendered Gutenberg HTML. Run through `renderPostHtml()` before output. */
  bodyHtml: string;
  image: WpImage | null;
  /** Athlete slugs resolved against lib/data/published-athletes.json. */
  players: string[];
  /** Player-category names with no profile on this site — plain text, no link. */
  playerNames: string[];
  /** WP event category. Not yet resolved to an internal event slug. */
  wpEvent: { slug: string; name: string } | null;
  tags: string[];
  tagsRaw: string[];
  wpCategories: string[];
  embeds: string[];
  inlineImages: string[];
  /** Original root-level ppatour.com URL — source of the 301 map. */
  legacyUrl: string;
  seo: { title: string; description: string; canonical: string };
};

const posts = raw as WpPost[];

/** Newest first. */
const byDateDesc = (a: WpPost, b: WpPost) =>
  b.publishedAt.localeCompare(a.publishedAt);

const sorted: WpPost[] = [...posts].sort(byDateDesc);

const bySlug = new Map(sorted.map((p) => [p.slug, p]));

/**
 * Everything except the body — safe to hand to a list view without dragging
 * 4.5M characters of HTML along. Still server-side; just far cheaper.
 */
export type WpPostSummary = Omit<
  WpPost,
  "bodyHtml" | "tagsRaw" | "wpCategories" | "embeds" | "inlineImages" | "seo"
>;

const SUMMARY_OMIT = [
  "bodyHtml",
  "tagsRaw",
  "wpCategories",
  "embeds",
  "inlineImages",
  "seo",
] as const satisfies readonly (keyof WpPost)[];

/**
 * Deletes the heavy keys rather than rebuilding the object field-by-field, so
 * a new field added to `WpPost` shows up in summaries automatically instead of
 * being silently dropped.
 */
function toSummary(p: WpPost): WpPostSummary {
  const out: Record<string, unknown> = { ...p };
  for (const key of SUMMARY_OMIT) delete out[key];
  return out as WpPostSummary;
}

/** All migrated posts, newest first, bodies stripped. */
export function wpPostSummaries(): WpPostSummary[] {
  return sorted.map(toSummary);
}

/** One post with its body. Undefined for an unknown slug. */
export function getWpPost(slug: string): WpPost | undefined {
  return bySlug.get(slug);
}

export function wpPostCount(): number {
  return sorted.length;
}

/** Every migrated slug — for generateStaticParams and the sitemap. */
export function wpPostSlugs(): string[] {
  return sorted.map((p) => p.slug);
}
