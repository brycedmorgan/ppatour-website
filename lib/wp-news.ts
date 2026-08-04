/**
 * The migrated WordPress archive — 811 posts from the wp-admin "Posts" menu
 * plus the 39 evergreen posts from the separate "PPA Blog" post type.
 * Produced by `scripts/import-wp-posts.mjs` and `scripts/import-wp-blog.mjs`;
 * see those files for the taxonomy derivation and the byline map.
 *
 * ⚠ THE TWO ARCHIVES DIFFER IN EXACTLY ONE WAY THAT MATTERS: their URL.
 * WordPress served posts at `ppatour.com/{slug}/` and blog entries at
 * `ppatour.com/ppa-blog/{slug}/`, and both shapes are indexed. `postType` is
 * what carries that distinction downstream — `lib/news.ts` turns it into the
 * card href, and `app/[slug]` filters on it so a blog entry is never also
 * served at the root. Everything else (search, sitemap, related, media
 * rehosting) treats the two as one archive on purpose.
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
import rawBlog from "@/lib/data/blog-posts.json";

/** Featured image as it exists upstream, pre-rehost. */
export type WpImage = {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
};

/**
 * Which wp-admin menu the post came from — and therefore which URL it keeps.
 * "post" → `/{slug}`, "ppa-blog" → `/ppa-blog/{slug}`.
 */
export type WpPostType = "post" | "ppa-blog";

export type WpPost = {
  slug: string;
  wpId: number;
  status: "published";
  source: "wordpress";
  postType: WpPostType;
  /** Mapped onto the site's existing category set by the importer. */
  category: string;
  /** Blog only: the WP `blog-category` term, for the /blog filter chips. */
  blogCategory?: string | null;
  /** Blog only: every section the post carries, in chip order. */
  blogCategories?: string[];
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

/**
 * news-posts.json predates `postType` and carries no such field — it is the
 * root-URL archive by definition, so it is stamped here rather than by
 * re-running an importer against a WordPress install that is being switched
 * off. blog-posts.json writes its own.
 */
const posts: WpPost[] = [
  ...(raw as Omit<WpPost, "postType">[]).map((p) => ({ ...p, postType: "post" as const })),
  ...(rawBlog as WpPost[]),
];

/** Newest first. */
const byDateDesc = (a: WpPost, b: WpPost) =>
  b.publishedAt.localeCompare(a.publishedAt);

const sorted: WpPost[] = [...posts].sort(byDateDesc);

/**
 * ⚠ ONE MAP FOR BOTH ARCHIVES, so a slug present in both would silently
 * shadow the loser. `scripts/import-wp-blog.mjs` fails the import on a
 * collision rather than letting that reach a build.
 */
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

/** The PPA Blog archive only, newest first, bodies stripped. */
export function wpBlogSummaries(): WpPostSummary[] {
  return sorted.filter((p) => p.postType === "ppa-blog").map(toSummary);
}
