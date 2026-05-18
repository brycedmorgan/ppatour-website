import { formatDate, getTickerState } from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

/**
 * Site-wide score ticker (§9.1). Two modes (LIVE / NEXT), same component.
 * Server-rendered with a reserved height so it never causes layout shift.
 */
export function ScoreTicker() {
  const state = getTickerState();

  return (
    <div className="flex h-9 w-full items-center overflow-x-auto bg-ppa-ink text-[11px] font-semibold uppercase tracking-wide text-white">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 whitespace-nowrap px-4">
        {state.mode === "LIVE" ? (
          <>
            <span className="flex items-center gap-1.5 bg-ppa-red px-2 py-0.5 text-[10px] font-bold tracking-[0.15em]">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
            <span className="text-white/55">{state.court}</span>
            <span className="text-white">
              {state.players[0]} vs {state.players[1]}
            </span>
            <span className="font-bold text-ppa-yellow">{state.score}</span>
            <a
              href={state.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-ppa-yellow hover:text-white"
            >
              ▶ Watch Live
            </a>
          </>
        ) : (
          <>
            <span className="bg-ppa-red px-2 py-0.5 text-[10px] font-bold tracking-[0.15em]">
              Next Event
            </span>
            <span className="text-white">{state.tournamentName}</span>
            <span className="text-white/55">{formatDate(state.eventDate)}</span>
            <a
              href={withUtm(state.ticketsUrl, {
                campaign: "score-ticker",
                content: "ticker-buy-tickets",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-ppa-yellow hover:text-white"
            >
              Buy Tickets →
            </a>
          </>
        )}
      </div>
    </div>
  );
}
