import { notFound } from "next/navigation";
import { getPost, listPosts } from "@/lib/newsroom/store";
import { CATEGORY_SUGGESTIONS } from "@/lib/newsroom/posts";
import { isTourStop, tournaments } from "@/lib/placeholder-data";
import { PostEditor } from "../../../_components/PostEditor";

export const metadata = { title: "Edit post" };

type Params = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Params) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  // Categories already in use come first, then the house suggestions.
  const used = (await listPosts()).map((p) => p.category).filter(Boolean);
  const categories = [...new Set([...used, ...CATEGORY_SUGGESTIONS])];

  // Tour stops for the "Tour stop" picker, newest first, one row per slug.
  const seen = new Set<string>();
  const events = [...tournaments]
    .filter((t) => isTourStop(t))
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .filter((t) => (seen.has(t.slug) ? false : (seen.add(t.slug), true)))
    .map((t) => ({ slug: t.slug, name: `${t.name} (${t.startDate.slice(0, 4)})` }));

  return <PostEditor key={post.id} post={post} categories={categories} events={events} />;
}
