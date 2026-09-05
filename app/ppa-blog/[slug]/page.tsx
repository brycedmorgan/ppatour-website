import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/news/ArticleView";
import { allBlog, getNewsDetail } from "@/lib/news";

type Params = { params: Promise<{ slug: string }> };

/**
 * The 39 evergreen PPA Blog posts, at the exact URL WordPress served them from.
 *
 * ⚠ `/ppa-blog/` IS THE CANONICAL PATH — keep it. It reads like an internal WP
 * artifact, and it is, but every one of these posts carries a Yoast canonical of
 * `https://ppatour.com/ppa-blog/{slug}/` and they are the best-ranking evergreen
 * pages the tour owns ("how to play pickleball", "pickleball scoring guide",
 * "what is an erne"). With `trailingSlash: true` the indexed URL is served
 * byte-for-byte, no redirect hop, no equity lost. Prettifying the path to
 * /blog/{slug} would trade that for 39 unnecessary 301s.
 *
 * Until 2026-08-04 next.config sent `/ppa-blog/:slug*` to `/news`, so all 39
 * collapsed into one index — a soft 404 in Google's eyes, and worse than a
 * plain 404. Hannah Johns caught it. The redirect is gone; this route replaces
 * it. See `scripts/import-wp-blog.mjs`.
 */
export function generateStaticParams() {
  return allBlog().map((n) => ({ slug: n.slug }));
}

/** Guards against a root-post slug being requested under this prefix. */
function blogDetail(slug: string) {
  const detail = getNewsDetail(slug);
  return detail && detail.card.postType === "ppa-blog" ? detail : undefined;
}

/**
 * ⚠ SAME TRAP AS /athletes/[slug] (9/5): this page renders ArticleView, which
 * calls `getRankingBySlug` for the "Players in This Story" rail — and that
 * reads the WHOLE ranking board. Every data call here happens after
 * `await params`, a Request-time API, and the DEFAULT `fetchCache: "auto"`
 * "will not cache fetch requests that are discovered AFTER Request-time APIs
 * are used". So the board was re-paged from upstream on any render that was not
 * served from cached HTML — up to ten requests per gender, for a rail of
 * headshots. `default-cache` restores each fetch’s own revalidate + tags.
 */
export const fetchCache = "default-cache";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const detail = blogDetail(slug);
  if (!detail) return { title: "PPA Blog" };
  const { card } = detail;
  // Yoast title/description carried over, so the search snippet these pages
  // already rank with survives the move.
  const seo = detail.source === "wordpress" ? detail.post.seo : null;
  const title = seo?.title?.trim() || card.title;
  const description = seo?.description?.trim() || card.dek;
  return {
    title: card.title,
    description,
    // No `images` here: the folder's file-based opengraph-image.tsx generates
    // the branded article card; a raw `images` entry produced a competing
    // second og:image tag.
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: card.publishedAt,
      authors: [card.author],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function BlogArticlePage({ params }: Params) {
  const { slug } = await params;
  const detail = blogDetail(slug);
  if (!detail) notFound();
  return <ArticleView detail={detail} />;
}
