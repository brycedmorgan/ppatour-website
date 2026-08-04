import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/news/ArticleView";
import { getNewsDetail, rootNews } from "@/lib/news";

type Params = { params: Promise<{ slug: string }> };

/**
 * Articles live at the ROOT (`/{slug}`), matching the URLs WordPress served, so
 * nothing that was ever shared or indexed changes shape. Next matches static
 * segments first, so /events, /athletes, /news and friends are unaffected;
 * verified none of the 826 slugs collides with a real route.
 *
 * All 826 (15 native + 811 migrated) are prerendered. `dynamicParams` stays at
 * its default, so this also becomes the catch-all for unknown root paths — they
 * 404 through notFound() exactly as before.
 *
 * ⚠ `rootNews()`, not `allNews()`. The 39 PPA Blog posts share this archive but
 * WordPress served them under `/ppa-blog/`, which is the URL Google holds and
 * `app/ppa-blog/[slug]` now serves. Prerendering them here as well would
 * publish every one of them at two URLs competing for the same rankings.
 */
export function generateStaticParams() {
  return rootNews().map((n) => ({ slug: n.slug }));
}

/** The blog is served by its own route; a blog slug here is the wrong URL. */
function rootDetail(slug: string) {
  const detail = getNewsDetail(slug);
  return detail && detail.card.postType !== "ppa-blog" ? detail : undefined;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const detail = rootDetail(slug);
  if (!detail) return { title: "News" };
  const { card } = detail;
  // Migrated posts carry their Yoast title/description, so search snippets
  // survive the move instead of being regenerated.
  const seo = detail.source === "wordpress" ? detail.post.seo : null;
  const title = seo?.title?.trim() || card.title;
  const description = seo?.description?.trim() || card.dek;
  return {
    title: card.title,
    description,
    openGraph: {
      title,
      description,
      images: card.image ? [card.image] : undefined,
      type: "article",
      publishedTime: card.publishedAt,
      authors: [card.author],
    },
    twitter: { card: "summary_large_image", images: card.image ? [card.image] : undefined },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const detail = rootDetail(slug);
  if (!detail) notFound();
  return <ArticleView detail={detail} />;
}
