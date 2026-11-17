import Link from "next/link";
import { listPosts } from "@/lib/newsroom/store";
import { requireEditor } from "@/lib/newsroom/auth";
import { syncCodePosts } from "@/lib/newsroom/sync";
import { newsroomBase } from "@/lib/newsroom/session";
import { PostCard } from "../../_components/PostCard";
import { NewPostButton } from "../../_components/NewPostButton";

export const metadata = { title: "Posts" };

// "Start from a Google Doc" reads the doc and asks the AI to fill the post: allow a minute or two.
export const maxDuration = 300;

type Search = { searchParams: Promise<{ status?: string; q?: string }> };

const FILTERS = [
  { key: "", label: "All" },
  { key: "published", label: "Live" },
  { key: "draft", label: "Drafts" },
];

export default async function NewsroomPosts({ searchParams }: Search) {
  const sp = await searchParams;
  const status = sp.status === "published" || sp.status === "draft" ? sp.status : "";
  const q = (sp.q ?? "").trim().toLowerCase();
  // New hand-written code posts join the dashboard on their own (lib/newsroom/sync.ts).
  await syncCodePosts((await requireEditor()).sub);
  const all = await listPosts();
  const posts = all.filter(
    (p) =>
      (!status || p.status === status) &&
      (!q || `${p.title} ${p.dek} ${p.author} ${p.category}`.toLowerCase().includes(q)),
  );

  const href = (s: string) => {
    const u = new URLSearchParams();
    if (s) u.set("status", s);
    if (q) u.set("q", q);
    const qs = u.toString();
    return `${newsroomBase()}/posts/${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase leading-none">Posts</h1>
        </div>
        <NewPostButton />
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-1" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={href(f.key)}
              aria-current={status === f.key ? "page" : undefined}
              className={`px-3 py-1.5 text-sm font-semibold ${
                status === f.key ? "bg-ppa-navy text-white" : "border border-ppa-line bg-white hover:border-ppa-blue"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <form className="ml-auto flex" action={`${newsroomBase()}/posts/`}>
          {status && <input type="hidden" name="status" value={status} />}
          <label className="sr-only" htmlFor="nr-q">
            Search posts
          </label>
          <input
            id="nr-q"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search posts"
            className="w-56 border border-ppa-line bg-white px-3 py-1.5 text-sm focus:border-ppa-blue focus:outline-none"
          />
        </form>
      </div>

      <p className="mt-4 text-sm text-ppa-navy/60">
        {posts.length} of {all.length} posts. The 811 posts migrated from WordPress stay in the
        archive and aren&apos;t edited here.
      </p>

      {posts.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <p className="mt-4 border border-ppa-line bg-white p-6 text-sm text-ppa-navy/65">
          No posts match.
        </p>
      )}
    </>
  );
}
