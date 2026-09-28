import bundled from "@/lib/data/wpr-snapshot.json";
import { readStored, storedVersion } from "@/lib/pb-cache";

/**
 * The World Pickleball Rankings snapshot every board read is answered from:
 * whichever is NEWER of the copy bundled at build time and the copy the daily
 * job stores in Postgres.
 *
 * ⚠ WHY THIS EXISTS (9/28). The snapshot used to be the bundled JSON alone, so
 * the rankings only changed when someone deployed. The daily refresh was meant
 * to be a Deploy Hook fired by `/api/cron/rebuild`, and in 23 days it never
 * produced a single deploy — so the boards were only ever as fresh as the last
 * code push. On 9/28 production was serving a board captured at a bad moment the
 * previous afternoon (Ben Johns 17,832.5 against a live 18,432.5, Staksrud and
 * Patriquin swapped at No. 4/5), and it would have stayed until the next push.
 *
 * `/api/cron/rankings` now builds the snapshot itself once a day and stores it
 * here. A page view still makes ZERO `partner_rankings` calls — it reads one
 * Postgres row — which is the whole property the 9/5 snapshot exists for.
 *
 * ⚠ THE BUNDLED FILE IS STILL THE SAFETY NET. No DATABASE_URL, no row yet, a
 * slow query, a corrupt row: all resolve to the bundled copy, which is what the
 * site served before this file existed. The 7-day expiry in the two readers
 * still applies to whichever copy wins.
 */

export type WprSnapshot = {
  generatedAt?: string;
  boards?: Record<string, { total: number; players: unknown[] }>;
  divisions?: Record<string, unknown[]>;
};

/** Row name in `api_cache`. Written by /api/cron/rankings. */
export const WPR_SNAPSHOT_KEY = "wpr-snapshot:latest";
/**
 * Its own tag, deliberately NOT `rankings`: a `?tag=rankings` purge exists to
 * drop the per-URL board rows, and taking this row with it would silently put
 * the site back on the (older) bundled copy.
 */
export const WPR_SNAPSHOT_TAG = "wpr-snapshot";

/**
 * How often one instance re-checks the row's version. The check is a single
 * `updated_at` read, and the ~700 KB value is only re-read when it changed.
 *
 * ⚠ KEEP THIS SHORT. The job revalidates every page right after writing; an
 * instance that regenerates a page inside this window from a pre-write memo
 * would bake yesterday's board into a page that then holds for a day.
 */
const CHECK_MS = 5_000;

const BUNDLED = bundled as WprSnapshot;

let current: { snap: WprSnapshot; version: string | null } | null = null;
let checkedAt = 0;
let inFlight: Promise<WprSnapshot> | null = null;

const stamp = (s: WprSnapshot | null | undefined) => {
  const t = Date.parse(s?.generatedAt ?? "");
  return Number.isFinite(t) ? t : 0;
};

function isSnapshot(v: unknown): v is WprSnapshot {
  const s = v as WprSnapshot | null;
  return Boolean(s && typeof s.generatedAt === "string" && s.boards && typeof s.boards === "object");
}

async function refresh(): Promise<WprSnapshot> {
  const version = await storedVersion(WPR_SNAPSHOT_KEY);
  if (current && version === current.version) return current.snap;
  if (!version) {
    current = { snap: BUNDLED, version: null };
    return BUNDLED;
  }
  const row = await readStored(WPR_SNAPSHOT_KEY);
  const stored = row && isSnapshot(row.value) ? row.value : null;
  const snap = stored && stamp(stored) > stamp(BUNDLED) ? stored : BUNDLED;
  current = { snap, version };
  return snap;
}

/** The snapshot to answer board reads from. Never throws, never null. */
export async function getWprSnapshot(): Promise<WprSnapshot> {
  if (current && Date.now() - checkedAt < CHECK_MS) return current.snap;
  if (inFlight) return inFlight;
  inFlight = refresh()
    .catch(() => current?.snap ?? BUNDLED)
    .finally(() => {
      checkedAt = Date.now();
      inFlight = null;
    });
  return inFlight;
}

/** The build-time copy, for the few synchronous callers. */
export function bundledWprSnapshot(): WprSnapshot {
  return BUNDLED;
}
