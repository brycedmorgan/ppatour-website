import Link from "next/link";
import { House } from "lucide-react";
import { listPosts, getSetting, SETTINGS } from "@/lib/newsroom/store";
import { codePosts } from "@/lib/newsroom/posts";
import { requireEditor } from "@/lib/newsroom/auth";
import { importSkipped, syncCodePosts } from "@/lib/newsroom/sync";
import type { HomePbPicks } from "@/lib/newsroom/published";
import { newsroomBase } from "@/lib/newsroom/session";
import { PostCard, fmtDate } from "../_components/PostCard";
import { NewPostButton } from "../_components/NewPostButton";
import { ImportButton } from "../_components/ImportButton";

export const metadata = { title: "Overview" };

// "Start from a Google Doc" reads the doc and asks the AI to fill the post: allow a minute or two.
export const maxDuration = 300;

export default async function NewsroomOverview() {
  // New hand-written code posts join the dashboard on their own (lib/newsroom/sync.ts).
  await syncCodePosts((await requireEditor()).sub);
  const [posts, picks, skipped] = await Promise.all([
    listPosts(),
    getSetting<HomePbPicks>(SETTINGS.homePbPicks),
    importSkipped(),
  ]);
  const inDashboard = new Set(posts.map((p) => p.importedFrom?.slug ?? p.slug));
  const notImported = codePosts().filter((c) => !inDashboard.has(c.slug) && !skipped.has(c.slug));
  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.length - published;
  const recent = [...posts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  const pins = picks?.pins ?? [];

  const stats = [
    { label: "Live posts", value: published, href: `${newsroomBase()}/posts/?status=published` },
    { label: "Drafts", value: drafts, href: `${newsroomBase()}/posts/?status=draft` },
    { label: "Pinned on home page", value: `${pins.length} of 4`, href: `${newsroomBase()}/home-picks/` },
  ];

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase leading-none">Overview</h1>
        </div>
        <NewPostButton />
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="border border-ppa-line bg-white p-4 transition-colors hover:border-ppa-blue"
          >
            <p className="font-display text-3xl leading-none">{s.value}</p>
            <p className="mt-1 text-sm text-ppa-navy/65">{s.label}</p>
          </Link>
        ))}
      </div>

      {notImported.length > 0 && (
        <section className="mt-6 border-l-4 border-ppa-blue bg-white p-4">
          <h2 className="font-semibold">Move the hand-written posts in</h2>
          <p className="mb-3 mt-1 max-w-2xl text-sm text-ppa-navy/70">
            {notImported.length} posts written before the Newsroom (stats wraps, previews, partner
            posts) still live in the site&apos;s code. Importing copies them here so they can be
            edited. Nothing changes on the site.
          </p>
          <ImportButton count={notImported.length} />
        </section>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg uppercase">Recently edited</h2>
            <Link href={`${newsroomBase()}/posts/`} className="text-sm text-ppa-blue hover:underline">
              All posts
            </Link>
          </div>
          {recent.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recent.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <p className="border border-ppa-line bg-white p-6 text-sm text-ppa-navy/65">
              No posts yet. Start one with New post.
            </p>
          )}
        </section>

        <aside className="self-start border border-ppa-line bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg uppercase">Home page</h2>
            <Link
              href={`${newsroomBase()}/home-picks/`}
              aria-label="Edit home page picks"
              className="text-ppa-blue hover:text-ppa-blue-deep"
            >
              <House className="size-5" aria-hidden />
            </Link>
          </div>
          <p className="text-xs text-ppa-navy/60">pickleball.com articles on the home page</p>
          <ol className="mt-3 space-y-2">
            {Array.from({ length: 4 }, (_, i) => pins[i]).map((a, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="font-display text-ppa-blue">{i + 1}</span>
                {a ? (
                  <span className="line-clamp-2">{a.title}</span>
                ) : (
                  <span className="italic text-ppa-navy/50">Newest article</span>
                )}
              </li>
            ))}
          </ol>
          {pins[0]?.publishedAt && (
            <p className="mt-3 text-xs text-ppa-navy/50">Top pin from {fmtDate(pins[0].publishedAt)}</p>
          )}
        </aside>
      </div>
    </>
  );
}
