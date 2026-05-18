import { formatDate, getTickerState } from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

/**
 * Site-wide score ticker (§9.1). Two modes (LIVE / NEXT), same component.
 * Server-rendered with a reserved height so it never causes layout shift.
 */
export function ScoreTicker() {
  const state = getTickerState();

  return (
    <div className="flex h-9 w-full items-center overflow-x-auto bg-ppa-navy-light text-xs font-medium text-white">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 whitespace-nowrap px-4">
        {state.mode === "LIVE" ? (
          <>
            <span className="flex items-center gap-1.5 rounded-sm bg-ppa-red px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
            <span className="text-white/70">{state.court}</span>
            <span className="font-semibold">
              {state.players[0]} vs {state.players[1]}
            </span>
            <span className="font-bold text-ppa-yellow">{state.score}</span>
            <a
              href={state.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto font-semibold text-ppa-yellow hover:underline"
            >
              ▶ Watch on YouTube
            </a>
          </>
        ) : (
          <>
            <span className="rounded-sm bg-ppa-yellow px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ppa-navy">
              Next
            </span>
            <span className="font-semibold">{state.tournamentName}</span>
            <span className="text-white/70">{formatDate(state.eventDate)}</span>
            <a
              href={withUtm(state.ticketsUrl, {
                campaign: "score-ticker",
                content: "ticker-buy-tickets",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto font-semibold text-ppa-yellow hover:underline"
            >
              ▶ Buy Tickets
            </a>
          </>
        )}
      </div>
    </div>
  );
}
