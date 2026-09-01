"use client";

import Link from "next/link";
import {
  formatMatchScore,
  liveWatchUrl,
  pickFeaturedMatch,
  teamLabel,
  useLiveTicker,
  useTourIsLive,
} from "@/components/live/use-live-ticker";
import { formatDate, getTickerState } from "@/lib/placeholder-data";

/**
 * Site-wide score ticker (§9.1). Reserved height so it never causes layout shift.
 *
 * ⚠ IT SHOWS WHATEVER IS ACTUALLY ON, AND IT USED TO BE INCAPABLE OF THAT.
 * The LIVE branch was fed by `getLiveTickerState()` — a HARDCODED "Ben Johns vs
 * Federico Staksrud · 11–9, 9–11, 8–6 · Championship Court" that was never
 * played — and it was reachable only on the `/live` preview. So the bar above
 * every page on the site could say exactly two things: a fabricated scoreline,
 * or "Next Event". During a live tournament it said Next Event.
 *
 * It reads `/api/ticker` now (Pickleball.com `homepage_score_ticker`, polled
 * every 15s through a CDN-cached proxy), which auto-selects whichever partner
 * has matches running — PPA, PPA Australia or PPA Asia. `getLiveTickerState` is
 * deleted; there is no fabricated state left to fall back to.
 *
 * Three states, and the badge never overstates what it knows:
 *   LIVE       a match is in progress → players, live score, watch link
 *   UP NEXT    the tournament's window has matches but none in progress yet
 *   NEXT EVENT nothing on the wire at all → the calendar's next stop, as before
 */
export function ScoreTicker() {
  const { ordered } = useLiveTicker();
  const { live, simulating, now } = useTourIsLive();
  // Same clock the rest of the chrome reads, so a shifted preview names the
  // event the page is actually showing rather than today's next stop.
  const state = getTickerState(now);

  /**
   * ⚠ UNDER A SIMULATED CLOCK THE FEED IS SUPPRESSED UNTIL THE SIMULATED MOMENT
   * IS LIVE, and only then. /live can pretend it is a different day; the score
   * feed cannot — it answers for right now. So previewing `?in=30` used to show
   * real in-progress matches in this bar while the hero beneath it counted down
   * to an event that had not started, which is two clocks on one screen.
   *
   * In production `simulating` is false and this does nothing: the bar shows
   * whatever the feed says is on, which is the whole point of it.
   */
  const featured = simulating && !live ? undefined : pickFeaturedMatch(ordered);

  if (featured) {
    const isLive = featured.status === "live";
    const score = formatMatchScore(featured);
    return (
      <div className="flex h-9 w-full items-center overflow-hidden bg-ppa-navy text-[11px] font-semibold uppercase tracking-wide text-white">
        <div className="mx-auto flex w-full min-w-0 max-w-6xl items-center gap-3 whitespace-nowrap px-4">
          {isLive ? (
            <span className="flex shrink-0 items-center gap-1.5 bg-ppa-live px-2 py-0.5 text-[10px] font-bold tracking-[0.15em]">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
          ) : (
            <span className="shrink-0 bg-ppa-blue px-2 py-0.5 text-[10px] font-bold tracking-[0.15em]">
              {featured.status === "final" ? "Final" : "Up Next"}
            </span>
          )}
          <span className="hidden shrink-0 text-white/55 sm:inline">
            {featured.court || featured.round}
          </span>
          <span className="min-w-0 truncate text-white">
            {teamLabel(featured.teams[0])} vs {teamLabel(featured.teams[1])}
          </span>
          {/* Only a played game produces a score; an up-next match has none, and
              printing "0–0" would read as a match under way. */}
          {score && <span className="shrink-0 font-bold text-ppa-yellow">{score}</span>}
          {/* A walkover is final with nothing to print in the score slot; say so
              rather than leaving the bar looking truncated. */}
          {!score && featured.outcome === "walkover" && (
            <span className="shrink-0 text-white/55">Walkover</span>
          )}
          {!score && !featured.outcome && featured.time && (
            <span className="hidden shrink-0 text-white/55 md:inline">{featured.time}</span>
          )}
          {isLive ? (
            /* Same resolution as every other "Watch Live" button on the site:
               the first match on the rail, else the PickleballTV stream. The
               featured match IS `ordered[0]` here — `pickFeaturedMatch` reads a
               list already sorted live-first — so this names the same match it
               is describing, and shares one fallback with the rest. */
            <a
              href={liveWatchUrl(ordered)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto shrink-0 text-ppa-yellow hover:text-white"
            >
              ▶ Watch Live
            </a>
          ) : (
            <Link href="/watch" className="ml-auto shrink-0 text-ppa-yellow hover:text-white">
              Scores &amp; Brackets →
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-9 w-full items-center overflow-hidden bg-ppa-navy text-[11px] font-semibold uppercase tracking-wide text-white">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl items-center gap-3 whitespace-nowrap px-4">
        <span className="shrink-0 bg-ppa-blue px-2 py-0.5 text-[10px] font-bold tracking-[0.15em]">
          Next Event
        </span>
        <span className="min-w-0 truncate text-white">{state.tournamentName}</span>
        <span className="hidden text-white/55 sm:inline">{formatDate(state.eventDate)}</span>
        <Link
          href={`/events/${state.eventDate.slice(0, 4)}/${state.eventSlug}`}
          className="ml-auto shrink-0 text-ppa-yellow hover:text-white"
        >
          Event Details →
        </Link>
      </div>
    </div>
  );
}
