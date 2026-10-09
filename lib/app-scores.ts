import { getEvents } from "@/lib/events-api";
import {
  eventHref,
  getMainTourEvents,
  hasTournamentEnded,
  isTournamentLive,
  type Tournament,
} from "@/lib/placeholder-data";

export type ScoresEvent = {
  /** PT tournament UUID — what /api/scores and /api/brackets key on. */
  eventId: string;
  name: string;
  slug: string;
  href: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  logoUrl?: string;
  live: boolean;
};

/**
 * Which tournament the app's Scores screen opens on.
 *
 * The running tour stop if there is one, else the most recent finished one —
 * the ESPN rule: the scores screen always has scores on it. It never falls back
 * to a FUTURE stop, which has no draw and would render an empty shell.
 *
 * Same title→UUID join as the homepage (HomeContent `liveEventId`): the
 * calendar decides what is on, the events feed supplies the UUID. No UUID → no
 * event, never a hardcoded fallback (see the Atlanta note in HomeContent).
 */
export async function resolveScoresEvent(now?: number): Promise<ScoresEvent | null> {
  const { events } = await getEvents();
  const uuidFor = (t: Tournament) =>
    t.tournamentUuid ?? events.find((e) => e.slug === t.slug)?.tournamentUuid;
  const logoFor = (t: Tournament) =>
    t.logoUrl ?? events.find((e) => e.slug === t.slug)?.logoUrl;

  const main = getMainTourEvents();
  const live = main.find((t) => isTournamentLive(t, now) && uuidFor(t));
  const recent = [...main]
    .filter((t) => hasTournamentEnded(t, now) && uuidFor(t))
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
  const pick = live ?? recent;
  if (!pick) return null;

  return {
    eventId: uuidFor(pick) as string,
    name: pick.name,
    slug: pick.slug,
    href: eventHref(pick),
    city: pick.city,
    state: pick.state,
    startDate: pick.startDate,
    endDate: pick.endDate,
    logoUrl: logoFor(pick),
    live: Boolean(live),
  };
}
