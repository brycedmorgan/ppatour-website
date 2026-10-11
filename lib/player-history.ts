/**
 * A pro's recent PPA tournaments and matches (server-only) — the "recent
 * results" block on the app player screen and the athlete profile.
 * Bryce, 10/11: "we should be adding their recent scores and tournaments".
 *
 * ⚠ THERE IS NO PER-PLAYER RESULTS ENDPOINT, SO THIS IS ASSEMBLED FROM DRAWS.
 * Looked for one on 10/11: our token reaches `users/{slug}` (bio) and
 * `player_medals` (career counts) only; pickleball.com's player pages sit
 * behind CloudFront and MATCHDAY builds its history the same way, by syncing
 * every event's matches. So: finished tour stops, newest first, until the
 * player has {@link EVENT_COUNT} (see recentStops), each run through `playerRuns` (lib/player-event) — the same draw path the
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
import { getBracketDraw, getBracketIndex, isEmptyDraw } from "@/lib/brackets-api";
import { playerRuns, type PlayerStep } from "@/lib/player-event";

/** Tour stops THIS PLAYER played — not stops on the calendar (see recentStops). */
const EVENT_COUNT = 10;
const MATCH_COUNT = 15;
const CONCURRENCY = 3;
/** How far back to look, and the most stops one request may read. */
const WINDOW_DAYS = 400;
const MAX_STOPS = 30;
/** Stops read with no result for this name before giving up. */
const GIVE_UP_AFTER = 12;

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

export type PlayerHistory = {
  events: HistoryEvent[];
  matches: HistoryMatch[];
  /** A stop's draws failed to load, so a result may be missing — cache briefly. */
  partial?: boolean;
};

/**
 * Finished tour stops with a draw to read, newest first.
 *
 * ⚠ A WINDOW, NOT "THE LAST TEN STOPS" (fixed 10/11). The first cut took the
 * ten newest stops, and ten stops is not ten events a pro played: the feed
 * tags the college tour's "The Nationals" a slam and PickleSlam an Open, so
 * those two took slots, and the Texas Open and Greater Zion Cup — both won by
 * Anna Leigh Waters — fell off the end. The caller now reads newest-first
 * until the PLAYER has {@link EVENT_COUNT} events, so a stop they skipped, an
 * Asia 1000 or a mis-tiered non-pro event costs a fetch, never a slot.
 *
 * (The May–August hole on every profile is real, not this bug: the feed has
 * no US tour stop between the PPA Finals, May 10, and Nationals, Aug 31 —
 * the MLP summer. The curated Orlando Open / Los Angeles Slam rows in
 * lib/placeholder-data are not in the feed and have no draw.)
 */
async function recentStops(now?: number): Promise<Tournament[]> {
  const { events } = await getEvents();
  const cutoff = new Date((now ?? Date.now()) - WINDOW_DAYS * 864e5).toISOString().slice(0, 10);
  return events
    .filter(
      (t) =>
        isTourStop(t) &&
        t.tournamentUuid &&
        hasTournamentEnded(t, now) &&
        t.endDate >= cutoff &&
        // College-tour events carry a pro tier in the feed; no pro plays them.
        !/college/i.test(t.name),
    )
    .sort((a, b) => b.endDate.localeCompare(a.endDate))
    .slice(0, MAX_STOPS);
}

/**
 * How deep in a draw a round is, for ordering one event's matches newest
 * first across divisions. The draws carry no per-match date we can sort on,
 * so depth stands in: a semifinal was played after a quarterfinal in any
 * division. Pools are earliest; an unrecognised name sits mid-pack.
 */
function roundDepth(round: string): number {
  // Names as lib/brackets-api writes them: "Final", "SF", "QF", "R16"… for a
  // knockout; "Losers Round N" / "Losers Final"; "Round N" for pools and
  // round-robin.
  const losers = /^losers round (\d+)/i.exec(round);
  if (losers) return 40 + Number(losers[1]);
  if (/^losers final/i.test(round)) return 85;
  const rr = /^round (\d+)/i.exec(round);
  if (rr) return 10 + Number(rr[1]);
  if (/semi|^sf\b/i.test(round)) return 90;
  if (/bronze/i.test(round)) return 95;
  if (/final|gold/i.test(round) && !/quarter/i.test(round)) return 100;
  if (/quarter|^qf\b/i.test(round)) return 80;
  const r = /^r(?:ound of )?\s*(\d+)/i.exec(round);
  if (r) return 70 - Math.log2(Number(r[1]) || 2);
  return 50;
}

/**
 * Their runs at each stop, newest first, {@link CONCURRENCY} stops at a time,
 * stopping once they have {@link EVENT_COUNT} stops with a result. A top pro
 * is done in about four batches; a pro who plays less reaches further back.
 */
/**
 * Did this stop's draws load? `playerRuns` returns [] both for "not in this
 * draw" and for a failed fetch, and the two must not look alike: on 10/11 the
 * live answer for Anna Leigh Waters dropped Las Vegas and Atlanta, both of
 * which she played, for an hour at a time. A 429 on one division's match call
 * builds that division as an EMPTY draw, so an empty draw at a finished stop
 * means "failed". A stop with no Pro divisions at all is taken as genuinely
 * empty (the mis-tiered PickleSlam row), or it would mark every answer that
 * reaches it partial forever. Same memo as playerRuns, so no extra fetch.
 */
async function stopLoaded(eventId: string): Promise<boolean> {
  const { divisions } = await getBracketIndex(eventId);
  const draws = await Promise.all(divisions.map((d) => getBracketDraw(eventId, d.id)));
  return draws.every((d) => d !== null && !isEmptyDraw(d));
}

async function runsUntilFull(stops: Tournament[], name: string) {
  const out: Awaited<ReturnType<typeof playerRuns>>[] = [];
  let played = 0;
  let readEmpty = 0;
  let partial = false;
  for (let i = 0; i < stops.length && played < EVENT_COUNT; i += CONCURRENCY) {
    const batch = await Promise.all(
      stops.slice(i, i + CONCURRENCY).map(async (t) => {
        const runs = await playerRuns(t.tournamentUuid as string, name);
        return { runs, loaded: runs.length > 0 || (await stopLoaded(t.tournamentUuid as string)) };
      }),
    );
    out.push(...batch.map((b) => b.runs));
    played += batch.filter((b) => b.runs.length > 0).length;
    readEmpty += batch.filter((b) => b.runs.length === 0 && b.loaded).length;
    partial ||= batch.some((b) => !b.loaded);
    // Absent from a dozen stops that DID load: a typo, a namesake or a casual
    // player. Don't walk all MAX_STOPS cold draws for them (public route) —
    // and during a 429 storm, when nothing loads, stop at twice that anyway.
    if (played === 0 && (readEmpty >= GIVE_UP_AFTER || i + CONCURRENCY >= 2 * GIVE_UP_AFTER)) break;
  }
  return { runsByStop: out, partial };
}

/** Never throws — an empty history just hides the section. */
export async function playerHistory(name: string, now?: number): Promise<PlayerHistory> {
  if (!name.trim()) return { events: [], matches: [] };
  try {
    const stops = await recentStops(now);
    const { runsByStop, partial } = await runsUntilFull(stops, name);

    const events: HistoryEvent[] = [];
    const matches: HistoryMatch[] = [];
    stops.slice(0, runsByStop.length).forEach((t, i) => {
      const runs = runsByStop[i];
      // The last batch can overshoot by up to CONCURRENCY - 1 events.
      if (!runs.length || events.length >= EVENT_COUNT) return;
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
          // A lost Final reads "Silver" even when the feed left the silver
          // field empty; style it as the medal it is.
          const medal = r.medal ?? (finish === "Silver" ? "silver" : null);
          return { division: r.division, partners, finish, medal };
        }),
      });
      // Deepest round first across every division at this stop, so a pro in
      // three draws shows all three finals before anyone's round of 32.
      const atStop = runs.flatMap((r) =>
        r.sections
          .flatMap((s) => s.steps)
          .filter((s) => s.status === "final")
          // Newest first before the sort, so equal depths keep that order.
          .reverse()
          .map((s) => ({ ...s, eventId, eventName: t.name, endDate: t.endDate, division: r.division })),
      );
      atStop.sort((a, b) => roundDepth(b.round) - roundDepth(a.round));
      matches.push(...atStop);
    });
    return { events, matches: matches.slice(0, MATCH_COUNT), ...(partial ? { partial } : {}) };
  } catch {
    return { events: [], matches: [] };
  }
}
