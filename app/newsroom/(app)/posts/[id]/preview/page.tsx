import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/news/ArticleView";
import { dashboardToCard } from "@/lib/news";
import { getPost } from "@/lib/newsroom/store";
import { newsroomBase } from "@/lib/newsroom/session";

export const metadata = { title: "Preview" };

type Params = { params: Promise<{ id: string }> };

/** The saved version of a post, drafts included, rendered as the site will. */
export default async function PreviewPostPage({ params }: Params) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  return (
    <div className="-mx-4 -mt-8 md:-mx-8">
      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-3 bg-ppa-yellow px-4 py-2 text-sm font-semibold text-ppa-navy">
        <span>
          Preview{post.status === "draft" ? " · draft, not on the site" : " · live"}. Shows the last
          saved version.
        </span>
        <Link href={`${newsroomBase()}/posts/${post.id}/`} className="ml-auto underline">
          Back to editing
        </Link>
      </div>
      <ArticleView detail={{ source: "dashboard", card: dashboardToCard(post), post }} />
    </div>
  );
}
