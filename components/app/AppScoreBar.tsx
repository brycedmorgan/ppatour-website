"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { TickerMatch } from "@/lib/ticker-api";
import {
  formatMatchScore,
  pickFeaturedMatch,
  teamLabel,
  useLiveTicker,
} from "@/components/live/use-live-ticker";
import { eventHref, formatDate, getNextTournament } from "@/lib/placeholder-data";

/**
 * The app's score bar: always on, pinned above the tab bar, cycling every live
 * match on the tour.
 *
 * This is the decision Bryce made on 8/18 — in the fan app the score bar wins
 * the bottom edge, and `StickyBuyBar` (the tour's #1 ticket CTA) stands down.
 * On the web the buy bar is untouched. Two funnels, two bottom bars, one
 * component each.
 *
 * Data is the same `/api/ticker` feed as the header ticker and the buy bar, so
 * the three can never disagree. Unlike the buy bar this polls on every route,
 * not just `/live` — an always-on score bar that only works on one page is not
 * an app.
 *
 * With nothing live it falls back to the next tour stop rather than hiding: the
 * bar disappearing is indistinguishable from the app being broken.
 */
const HOLD_MS = 5000;
const FADE_MS = 400;

export function AppScoreBar() {
  const { ordered } = useLiveTicker();
  const next = getNextTournament();

  const rotation = useMemo<TickerMatch[]>(() => {
    const live = ordered.filter((m) => m.status === "live");
    if (live.length > 0) return live;
    const feat = pickFeaturedMatch(ordered);
    return feat ? [feat] : [];
  }, [ordered]);

  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    if (rotation.length <= 1) {
      setIndex(0);
      setShown(true);
      return;
    }
    let fade: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setShown(false);
      fade = setTimeout(() => {
        setIndex((i) => (i + 1) % rotation.length);
        setShown(true);
      }, FADE_MS);
    }, HOLD_MS);
    return () => {
      clearInterval(id);
      clearTimeout(fade);
    };
  }, [rotation.length]);

  const match = rotation.length > 0 ? rotation[index % rotation.length] : undefined;

  return (
    <div
      className="fixed inset-x-0 z-40 border-t-2 border-ppa-blue bg-ppa-navy/95 backdrop-blur"
      style={{ bottom: "calc(var(--app-tabbar-h) + env(safe-area-inset-bottom))" }}
    >
      <Link
        href={match ? "/live/" : eventHref(next)}
        className="mx-auto flex h-11 w-full max-w-md items-center gap-2.5 px-4 active:opacity-80"
      >
        {match ? (
          <>
            <span
              className={`flex shrink-0 items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white ${
                match.status === "live" ? "bg-ppa-live" : "bg-ppa-navy-soft"
              }`}
            >
              {match.status === "live" && (
                <span className="size-1 animate-pulse rounded-full bg-white" />
              )}
              {match.status === "live" ? "Live" : match.status === "upnext" ? "Next" : "Final"}
            </span>
            <span
              aria-live="polite"
              className={`min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-[0.08em] text-white transition-opacity duration-300 motion-reduce:transition-none ${
                shown ? "opacity-100" : "opacity-0"
              }`}
            >
              {teamLabel(match.teams[0])} vs {teamLabel(match.teams[1])}
            </span>
            <span
              className={`shrink-0 text-[11px] font-bold tracking-[0.04em] text-ppa-yellow transition-opacity duration-300 motion-reduce:transition-none ${
                shown ? "opacity-100" : "opacity-0"
              }`}
            >
              {formatMatchScore(match) || "—"}
            </span>
          </>
        ) : (
          <>
            <span className="shrink-0 bg-ppa-blue px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white">
              Next
            </span>
            <span className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-[0.08em] text-white">
              {next.name}
            </span>
            <span className="shrink-0 text-[11px] font-bold text-white/55">
              {formatDate(next.startDate)}
            </span>
          </>
        )}
      </Link>
    </div>
  );
}
