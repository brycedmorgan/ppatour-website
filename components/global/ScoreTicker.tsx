"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDate, getLiveTickerState, getTickerState } from "@/lib/placeholder-data";

/**
 * Site-wide score ticker (§9.1). Two modes (LIVE / NEXT), same component.
 * The `/live` route forces the LIVE state to preview an active tournament.
 * Reserved height so it never causes layout shift.
 */
export function ScoreTicker() {
  const pathname = usePathname();
  const state = pathname === "/live" ? getLiveTickerState() : getTickerState();

  return (
    <div className="flex h-9 w-full items-center overflow-hidden bg-ppa-navy text-[11px] font-semibold uppercase tracking-wide text-white">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl items-center gap-3 whitespace-nowrap px-4">
        {state.mode === "LIVE" ? (
          <>
            <span className="flex items-center gap-1.5 bg-ppa-live px-2 py-0.5 text-[10px] font-bold tracking-[0.15em]">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
            <span className="hidden text-white/55 sm:inline">{state.court}</span>
            <span className="min-w-0 truncate text-white">
              {state.players[0]} vs {state.players[1]}
            </span>
            <span className="shrink-0 font-bold text-ppa-yellow">{state.score}</span>
            <a
              href={state.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto shrink-0 text-ppa-yellow hover:text-white"
            >
              ▶ Watch Live
            </a>
          </>
        ) : (
          <>
            <span className="bg-ppa-blue px-2 py-0.5 text-[10px] font-bold tracking-[0.15em]">
              Next Event
            </span>
            <span className="min-w-0 truncate text-white">{state.tournamentName}</span>
            <span className="hidden text-white/55 sm:inline">
              {formatDate(state.eventDate)}
            </span>
            <Link
              href={`/events/${state.eventSlug}`}
              className="ml-auto shrink-0 text-ppa-yellow hover:text-white"
            >
              Event Details →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
