"use client";

import { LiveScoreTicker } from "@/components/live/LiveScoreTicker";
import { useLiveTicker } from "@/components/live/use-live-ticker";
import type { TickerResult } from "@/lib/ticker-api";

/**
 * The /watch "Live Now · Scores & Brackets" band — heading and scoreboard rail.
 *
 * ⚠ Renders NOTHING unless a match is actually in progress (Wesley, 8/5). The
 * band used to be unconditional, so out of competition /watch published a
 * "LIVE NOW" heading over three permanently-spinning skeleton cards: the ticker
 * holds its loading state when nothing is live rather than fabricate matches,
 * which is right for the ticker and reads as broken under a heading that claims
 * live. Same class of bug the 8/1 audit fixed on /live, one surface over.
 *
 * The gate is client-side, on the cards' own 15s poll, so the band appears by
 * itself at first serve on a tab that was already open — and disappears again
 * when the last match on court finishes.
 *
 * It owns the hook and hands the matches down (`matches`), which keeps /watch on
 * a single poll and makes it impossible for the heading to claim live over an
 * empty rail.
 */
export function WatchLiveNow({ initialData }: { initialData: TickerResult }) {
  const { ordered } = useLiveTicker({ initialData });

  // "Actually live" = a match in progress. Finals and up-next rows arrive in the
  // same ±1-day feed window and neither one makes the LIVE NOW label true.
  if (!ordered.some((m) => m.status === "live")) return null;

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-ppa-blue" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                Live Now
              </p>
            </div>
            <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
              Scores &amp; Brackets
            </h2>
          </div>
        </div>
        <div className="mt-6">
          {/* Same live cards + data as the /live broadcast ticker, on a
              transparent backdrop with no date badge. Controlled off this
              component's hook — the rail doesn't poll.
              ⚠ The card count used to be pinned here (`visibleCards={3}`); it
              is a viewport media query now, so this page and the broadcast
              header can't disagree about how many matchups fit. */}
          <LiveScoreTicker showDate={false} transparent matches={ordered} />
        </div>
      </div>
    </section>
  );
}
