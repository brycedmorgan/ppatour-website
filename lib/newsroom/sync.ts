/**
 * Keeps the dashboard in step with the hand-written posts in code. SERVER-ONLY.
 *
 * Wesley, 11/17: a post added in code (lib/news-articles.ts,
 * lib/news-posts-authored.ts) instead of through the Newsroom should show up in
 * the Newsroom on its own, not wait for someone to press "Import hand-written
 * posts". So every dashboard screen that lists posts calls syncCodePosts()
 * first: it copies in any code post the dashboard lacks, exactly as the Import
 * button does.
 *
 * - Only NEW code posts. A code post already copied in is never re-copied or
 *   overwritten, so the dashboard copy keeps every edit made to it.
 * - A copied-in post the editors DELETE stays out (SETTINGS.importSkipped);
 *   otherwise the next page load would bring back what they just removed.
 * - The code posts only change with a deploy, so each server instance does the
 *   work once per set of code slugs; later loads skip straight past it.
 * - Two instances racing to copy the same post: the posts table's UNIQUE slug
 *   refuses the second, which is caught and ignored.
 * - Never breaks the dashboard: a failure is logged and the page renders.
 */
import { randomUUID } from "node:crypto";
import { SETTINGS, getSetting, listPosts, putPost } from "@/lib/newsroom/store";
import { codePosts, importablePosts } from "@/lib/newsroom/posts";

export type ImportSkipped = { slugs: string[] };

let doneFor: string | null = null;
let inflight: Promise<number> | null = null;

export async function importSkipped(): Promise<Set<string>> {
  const v = await getSetting<ImportSkipped>(SETTINGS.importSkipped);
  return new Set(Array.isArray(v?.slugs) ? v.slugs : []);
}

/** Copies in any code post the dashboard lacks. Returns how many were added. */
export async function syncCodePosts(by: string): Promise<number> {
  const key = codePosts()
    .map((c) => c.slug)
    .join("|");
  if (doneFor === key) return 0;
  inflight ??= (async () => {
    try {
      const [existing, skip] = await Promise.all([listPosts(), importSkipped()]);
      let added = 0;
      for (const p of importablePosts(existing, by, randomUUID, skip)) {
        try {
          await putPost(p);
          added++;
        } catch (err) {
          console.error(`[newsroom] auto-import of ${p.slug} skipped:`, (err as Error).message);
        }
      }
      doneFor = key;
      return added;
    } catch (err) {
      console.error("[newsroom] auto-import failed:", (err as Error).message);
      return 0;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
