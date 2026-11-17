import { notFound } from "next/navigation";
import { getPost } from "@/lib/newsroom/store";
import { categoryOptions, eventOptions } from "@/lib/newsroom/posts";
import { PostEditor } from "../../../_components/PostEditor";

export const metadata = { title: "Edit post" };

type Params = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Params) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  return (
    <PostEditor
      key={post.id}
      post={post}
      categories={await categoryOptions()}
      events={eventOptions()}
    />
  );
}
