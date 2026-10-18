/**
 * Podium lookup for the event page's structured data — sync, build-time, free.
 *
 * Reads the committed `lib/data/tournament-history.json` (the same record the
 * /about/history page renders) and answers "who won this stop" for a
 * `Tournament`. Deliberately NOT the live tail in lib/tournament-history.ts and
 * NOT `getScores`: the event route is `force-static` and already fights the
 * partner API's rate limit (see the 9/17 note in the page), and a podium that
 * is a few days behind is fine for a search engine — the on-page ChampionsBanner
 * polls /api/scores and is live. Re-running `scripts/gen-tournament-history.mjs`
 * folds a just-finished stop in.
 *
 * ⚠ SERVER-ONLY BY CONVENTION: the JSON is 120 KB. Call it from the page and
 * hand the result to `buildEventJsonLd` (which NationalsLive, a client
 * component, also calls) — never import this from a client component.
 *
 * Match order: tournament UUID (exact), then the published name on the same
 * start date (curated stops carry no UUID — Nationals included).
 */
import raw from "@/lib/data/tournament-history.json";
import type { HistoryEvent } from "@/lib/tournament-history";
import type { Tournament } from "@/lib/placeholder-data";

const HISTORY = raw as HistoryEvent[];

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function eventResultsFor(
  t: Pick<Tournament, "name" | "startDate" | "tournamentUuid">,
): HistoryEvent | null {
  if (t.tournamentUuid) {
    const byUuid = HISTORY.find((h) => h.uuid === t.tournamentUuid);
    if (byUuid) return byUuid;
  }
  const name = fold(t.name);
  const start = t.startDate.slice(0, 10);
  return HISTORY.find((h) => h.startDate === start && fold(h.name) === name) ?? null;
}
