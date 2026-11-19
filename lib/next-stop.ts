import {
  getNextTournament,
  hasTournamentEnded,
  isTournamentLive,
} from "@/lib/placeholder-data";

export type NextStopState = "live" | "next" | "none";

/**
 * The tour stop to promote, as one comparable string: `state|slug`.
 *
 * ⚠ A STRING, BECAUSE THE PAGES THAT SHOW IT ARE CACHED. Athlete pages can be a
 * day old, so the browser recomputes this after hydration. React compares
 * snapshots by identity, and a string stays equal when nothing changed.
 */
export function nextStopSnapshot(now?: number): string {
  const t = getNextTournament(now);
  const state: NextStopState = hasTournamentEnded(t, now)
    ? "none"
    : isTournamentLive(t, now)
      ? "live"
      : "next";
  return `${state}|${t.slug}`;
}
