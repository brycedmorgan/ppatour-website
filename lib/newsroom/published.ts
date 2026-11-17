/**
 * Published dashboard posts, as the public site reads them. SERVER-ONLY.
 *
 * One small "version" read per instance per 10 seconds; the posts themselves
 * are re-read only when it changed. Every dashboard save also calls
 * revalidatePath("/", "layout"), so pages pick the change up on their next
 * request.
 *
 * ⚠ FAILS OPEN. A slow or unreachable database serves the last good copy, or
 * none — and with none, lib/news.ts still has the hand-written posts in code
 * (lib/news-articles.ts, lib/news-posts-authored.ts) as the fallback. An outage
 * must never take the newsroom down with it.
 */
import type { PbArticle } from "@/lib/pb-news";
import {
  SETTINGS,
  getSetting,
  listPosts,
  storeVersion,
  type DashboardPost,
} from "@/lib/newsroom/store";

/** Saved by the dashboard's Home page screen: pinned pickleball.com articles, in order. */
export type HomePbPicks = { pins: PbArticle[] };

const PROBE_MS = 10_000;
const TIMEOUT_MS = 2_500;

type Memo = {
  version: string;
  checkedAt: number;
  posts: DashboardPost[];
  /** Every slug a code post must NOT be served at (see publishedDashboardPosts). */
  shadowed: Set<string>;
  pins: PbArticle[];
};
let memo: Memo | null = null;
let inflight: Promise<Memo> | null = null;

function timeboxed<T>(p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
  ]);
}

async function refresh(): Promise<Memo> {
  try {
    const version = await timeboxed(storeVersion());
    if (memo && memo.version === version) {
      memo = { ...memo, checkedAt: Date.now() };
      return memo;
    }
    const [all, picks] = await Promise.all([
      timeboxed(listPosts()),
      timeboxed(getSetting<HomePbPicks>(SETTINGS.homePbPicks)),
    ]);
    const posts = all.filter((p) => p.status === "published");
    const shadowed = new Set(all.flatMap((p) => [p.slug, p.importedFrom?.slug ?? ""]).filter(Boolean));
    memo = { version, checkedAt: Date.now(), posts, shadowed, pins: picks?.pins ?? [] };
  } catch (err) {
    console.error("[newsroom] read failed, serving last good copy:", (err as Error).message);
    memo = {
      version: memo?.version ?? "",
      posts: memo?.posts ?? [],
      shadowed: memo?.shadowed ?? new Set(),
      pins: memo?.pins ?? [],
      checkedAt: Date.now(),
    };
  }
  return memo;
}

async function current(): Promise<Memo> {
  if (memo && Date.now() - memo.checkedAt < PROBE_MS) return memo;
  inflight ??= refresh().finally(() => {
    inflight = null;
  });
  return inflight;
}

/**
 * Published dashboard posts, a version string to key downstream memos on, and
 * `shadowed`: the slugs where a CODE post must not be served. That is every
 * dashboard post's slug, drafts included, plus the original slug of every
 * imported post. Without the drafts, unpublishing an imported post would bring
 * its code copy back; without the original slug, renaming one would leave the
 * code copy live at the old URL. Deleting the dashboard post is what restores
 * the code copy.
 */
export async function publishedDashboardPosts(): Promise<{
  version: string;
  posts: DashboardPost[];
  shadowed: Set<string>;
}> {
  return current();
}

/**
 * The home page's pickleball.com articles: the editors' pins in their order,
 * then the newest articles fill any empty slot (Wesley, 11/17: "pin + newest
 * fills"), so the section never goes stale or empty. A pin is a SNAPSHOT of the
 * article taken when it was picked, so an older story stays pinned after it
 * drops out of the newest page of the feed.
 */
export async function homePickleballNews(
  newest: PbArticle[],
  limit: number,
): Promise<PbArticle[]> {
  const { pins } = await current();
  const seen = new Set<string>();
  const out: PbArticle[] = [];
  for (const a of [...pins, ...newest]) {
    if (out.length >= limit || seen.has(a.url)) continue;
    seen.add(a.url);
    out.push(a);
  }
  return out;
}
