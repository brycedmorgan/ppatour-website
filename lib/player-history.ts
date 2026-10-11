/**
 * A pro's recent PPA tournaments and matches (server-only) — the "recent
 * results" block on the app player screen and the athlete profile.
 * Bryce, 10/11: "we should be adding their recent scores and tournaments".
 *
 * ⚠ THERE IS NO PER-PLAYER RESULTS ENDPOINT, SO THIS IS ASSEMBLED FROM DRAWS.
 * Looked for one on 10/11: our token reaches `users/{slug}` (bio) and
 * `player_medals` (career counts) only; pickleball.com's player pages sit
 * behind CloudFront and MATCHDAY builds its history the same way, by syncing
 * every event's matches. So: the last {@link EVENT_COUNT} finished tour stops,
 * each run through `playerRuns` (lib/player-event) — the same draw path the
 * player screen already shows for the current event.
 *
 * Cost: a finished draw is cached for a year (lib/live-cache-window
 * FINISHED_WINDOW_S, plus the per-instance memo in lib/brackets-api), so after
 * the first pull per event this is joins over memory. The FIRST cold pull is
 * one index + one call per division per event; events load
 * {@link CONCURRENCY} at a time so a cold instance never fans out ~80 upstream
 * calls at once into the partner API's 429s.
 *
 * ⚠ KEYED BY NAME, like everything the draws carry. A namesake who also
 * played a main draw would be merged in; no such pair on the boards today
 * plays the same events (the second Ben Johns is No. 682).
 */
import { getEvents } from "@/lib/events-api";
import { eventHref, hasTournamentEnded, isTourStop, type Tournament } from "@/lib/placeholder-data";
import { playerRuns, type PlayerStep } from "@/lib/player-event";

const EVENT_COUNT = 10;
const MATCH_COUNT = 15;
const CONCURRENCY = 3;

export type HistoryEvent = {
  eventId: string;
  name: string;
  /** Our event page; null for international stops, which link out. */
  href: string | null;
  startDate: string;
  endDate: string;
  divisions: { division: string; partners: string[]; finish: string; medal: "gold" | "silver" | "bronze" | null }[];
};

export type HistoryMatch = PlayerStep & {
  eventId: string;
  eventName: string;
  endDate: string;
  division: string;
};

export type PlayerHistory = { events: HistoryEvent[]; matches: HistoryMatch[] };

/** Finished tour stops with a draw to read, newest first. */
async function recentStops(now?: number): Promise<Tournament[]> {
  const { events } = await getEvents();
  return events
    .filter((t) => isTourStop(t) && t.tournamentUuid && hasTournamentEnded(t, now))
    .sort((a, b) => b.endDate.localeCompare(a.endDate))
    .slice(0, EVENT_COUNT);
}

async function inBatches<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, size + i).map(fn))));
  return out;
}

/** Never throws — an empty history just hides the section. */
export async function playerHistory(name: string, now?: number): Promise<PlayerHistory> {
  if (!name.trim()) return { events: [], matches: [] };
  try {
    const stops = await recentStops(now);
    const runsByStop = await inBatches(stops, CONCURRENCY, (t) => playerRuns(t.tournamentUuid as string, name));

    const events: HistoryEvent[] = [];
    const matches: HistoryMatch[] = [];
    stops.forEach((t, i) => {
      const runs = runsByStop[i];
      if (!runs.length) return;
      const eventId = t.tournamentUuid as string;
      events.push({
        eventId,
        name: t.name,
        href: t.region === "international" ? null : eventHref(t),
        startDate: t.startDate,
        endDate: t.endDate,
        divisions: runs.map((r) => {
          const steps = r.sections.flatMap((s) => s.steps);
          // The partner is whoever stood beside them most recently.
          const partners = [...steps].reverse().find((s) => s.partners.length)?.partners ?? [];
          // A finished event can still read "Next: …" when the feed never
          // placed a result; no finish beats a stale one.
          const finish = /^(Next|On court)/.test(r.summary) ? "" : r.summary.replace(/^Out in /, "");
          return { division: r.division, partners, finish, medal: r.medal };
        }),
      });
      // Latest round first within each division, divisions in feed order.
      for (const r of runs) {
        const played = r.sections.flatMap((s) => s.steps).filter((s) => s.status === "final");
        for (const s of played.reverse()) matches.push({ ...s, eventId, eventName: t.name, endDate: t.endDate, division: r.division });
      }
    });
    return { events, matches: matches.slice(0, MATCH_COUNT) };
  } catch {
    return { events: [], matches: [] };
  }
}
