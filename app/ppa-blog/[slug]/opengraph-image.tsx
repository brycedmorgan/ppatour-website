import { OG_SIZE } from "@/lib/og";
import { articleOgImage } from "@/lib/news-og";
import { allBlog, getNewsDetail } from "@/lib/news";

export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = getNewsDetail(slug)?.card ?? allBlog()[0];
  return articleOgImage(card, "PPA TOUR BLOG");
}
