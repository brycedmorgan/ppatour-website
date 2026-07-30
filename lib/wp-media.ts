/**
 * Asset indirection for the migrated WordPress archive.
 *
 * The 1,553 images those 811 posts reference still live at
 * ppatour.com/wp-content/… . That works today (the WP site is up) and
 * **breaks at cutover**, when this site takes the ppatour.com domain and the
 * old install stops serving. Rehosting is therefore launch-blocking, and it is
 * currently blocked on `BLOB_READ_WRITE_TOKEN`, which is not set in this
 * environment — the same blocker as `scripts/sync-venue-photos.mjs`.
 *
 * Every render path goes through `resolveAsset()`, so the rehost is a pure
 * data swap: the sync script writes upstream-URL → blob-URL pairs into
 * `lib/data/wp-media-map.json` and nothing else changes.
 */

import mediaMap from "@/lib/data/wp-media-map.json";
import deadAssets from "@/lib/data/wp-dead-assets.json";

const MAP = mediaMap as Record<string, string>;

/**
 * Assets that 404 on the WordPress install itself — breakage we inherited, not
 * something the migration introduced. Maintained by `sync-wp-media.mjs`, which
 * records only hard 404s. Currently 3 tournament-draw PDFs on one Draw Reveal
 * post whose siblings uploaded fine.
 */
const DEAD_ASSETS = new Set(deadAssets as string[]);

export function isDeadAsset(url: string): boolean {
  return DEAD_ASSETS.has(url);
}

/** Hosts we knowingly hotlink until the rehost lands. Must match next.config. */
export const WP_IMAGE_HOSTS = ["ppatour.com", "images.pickleball.com"] as const;

/** Dead upstream — a Gmail paste in one post's body. Always dropped. */
const DEAD_HOSTS = new Set(["mail.google.com"]);

/**
 * Rehosted URL when we have one, otherwise the original. Returns null for
 * assets known to be dead, so callers can omit the element entirely.
 */
export function resolveAsset(url: string): string | null {
  if (!url) return null;
  const mapped = MAP[url];
  if (mapped) return mapped;
  if (DEAD_ASSETS.has(url)) return null;
  try {
    if (DEAD_HOSTS.has(new URL(url, "https://ppatour.com").host)) return null;
  } catch {
    return null;
  }
  return url;
}

/**
 * Same mapping for a LINK target rather than an embedded asset — never returns
 * null, so an unmapped href is left alone instead of being stripped.
 *
 * Needed because 37 posts (the Draw Reveal series) link 180 tournament-draw
 * PDFs straight out of wp-content. Those are not images, so they were invisible
 * to the first pass of the rehost and would have 404'd at cutover.
 */
export function resolveLink(url: string): string {
  return MAP[url] ?? url;
}

/** True once every referenced asset has been rehosted off the WP install. */
export function isRehostComplete(): boolean {
  return Object.keys(MAP).length > 0;
}

export function rehostedCount(): number {
  return Object.keys(MAP).length;
}
