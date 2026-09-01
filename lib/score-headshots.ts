/**
 * Headshots for the names that appear on the scores board (server-only).
 *
 * ⚠ THE SCORES FEED CARRIES NO PHOTOS. `/v1/ppa/tournaments/{id}/tournament_events/{eventId}`
 * gives `teamOnePlayerOneFirstName` / `LastName` / `Uuid` and nothing else —
 * probed against the live API on 9/1. The live ticker's photos come from a
 * different endpoint (`/v2/data/homepage_score_ticker`, which does carry
 * `teamOnePlayerOnePicture`) and that one only covers this week's matches, so it
 * cannot illustrate Tuesday's round of 64 on Saturday. The ranking boards are
 * the one source that covers the whole field for every round.
 *
 * ⚠ AMBIGUOUS NAMES ARE DROPPED, AND THAT RULE IS THE WHOLE POINT OF THIS FILE.
 * The boards carry ~2,000 players and around twenty shared names — including two
 * Ben Johnses, world No. 1 and world No. 682. Publishing the wrong man's face on
 * a match he did not play is worse than publishing no face, so a name held by
 * more than one ranked player resolves to nothing and the row falls back to
 * initials. Same rule the article player-rail uses.
 */
import { getFullRankings } from "@/lib/rankings-api";
import { normalizeScoreName } from "@/lib/score-names";

const TTL_MS = 60 * 60 * 1000;
let cache: { value: Record<string, string>; expires: number } | null = null;
let inFlight: Promise<Record<string, string>> | null = null;

/**
 * A curated headshot — one we published ourselves, under `/ppa/pros/`.
 *
 * `rankings-api` already resolves these for the pros we hold a profile for, so
 * a local path is the marker that this row is one of OUR athletes rather than
 * a name off the wider board. That is what breaks the Ben Johns tie below.
 */
const isCurated = (url: string) => url.startsWith("/ppa/");

async function build(): Promise<Record<string, string>> {
  /** name → every distinct photo the boards offer for it. */
  const candidates = new Map<string, Set<string>>();
  try {
    const boards = await getFullRankings();
    for (const d of boards.divisions) {
      for (const e of d.entries) {
        const key = normalizeScoreName(e.name);
        if (!key) continue;
        if (!candidates.has(key)) candidates.set(key, new Set());
        if (e.headshot) candidates.get(key)!.add(e.headshot);
      }
    }
  } catch {
    // No boards → no photos. The board renders initials, same as today.
  }

  const out: Record<string, string> = {};
  for (const [key, urls] of candidates) {
    if (urls.size === 0) continue;
    // One face under this name — the ordinary case, including the same pro
    // appearing on the singles, doubles AND mixed boards.
    if (urls.size === 1) {
      out[key] = [...urls][0];
      continue;
    }
    /**
     * ⚠ TWO FACES UNDER ONE NAME. Measured on Nationals: this is what dropped
     * BEN JOHNS — world No. 1 and world No. 682 share a name, so the strict
     * rule gave the tour's biggest star an initials chip.
     *
     * A curated `/ppa/pros/` photo breaks the tie, and only when exactly one
     * candidate has one. It means we deliberately published a profile for that
     * person, there is one such profile per name, and a PPA pro main draw is
     * the one place that pro is certain to be. Two curated photos under one
     * name would be a genuine ambiguity we cannot resolve — that still drops.
     */
    const curated = [...urls].filter(isCurated);
    if (curated.length === 1) out[key] = curated[0];
  }
  return out;
}

/** name → headshot URL, for every unambiguously-named ranked pro. Never throws. */
export async function scoreHeadshots(): Promise<Record<string, string>> {
  if (cache && cache.expires > Date.now()) return cache.value;
  if (!inFlight) {
    inFlight = build()
      .then((value) => {
        cache = { value, expires: Date.now() + TTL_MS };
        return value;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
