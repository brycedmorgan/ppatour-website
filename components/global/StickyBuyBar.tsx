"use client";

import { useEffect, useState } from "react";
import {
  formatDate,
  getNextTournament,
  getTickerState,
} from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

/**
 * Sticky commerce bar (Option A punch-list #7). Slides up from the bottom
 * once the visitor scrolls past the hero: next event + price anchor + Buy
 * Tickets. During a live event the same bar swaps to a Watch CTA.
 */
export function StickyBuyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const state = getTickerState();
  const next = getNextTournament();
  const live = state.mode === "LIVE";
  const href = live
    ? state.watchUrl
    : withUtm(next.ticketsUrl, {
        campaign: next.slug,
        content: "sticky-buy-bar",
      });

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-30 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
    >
      <div className="border-t-2 border-ppa-blue bg-ppa-navy-deep/95 text-white backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
          {live ? (
            <span className="flex shrink-0 items-center gap-1.5 bg-ppa-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              Live Now
            </span>
          ) : (
            <span className="hidden shrink-0 bg-ppa-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] sm:inline">
              Next Event
            </span>
          )}
          <span className="min-w-0 truncate text-xs font-bold uppercase tracking-[0.1em]">
            {live
              ? `${state.players[0]} vs ${state.players[1]}`
              : next.shortName}
          </span>
          {!live && (
            <span className="hidden shrink-0 text-xs text-white/55 md:inline">
              {formatDate(next.startDate)} · {next.city}, {next.state}
            </span>
          )}

          <span className="ml-auto hidden shrink-0 text-xs font-bold uppercase tracking-[0.1em] text-ppa-yellow sm:inline">
            {live ? state.score : `From $${next.ticketPriceFrom}`}
          </span>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={visible ? undefined : -1}
            className="group ml-auto flex h-9 shrink-0 items-center gap-1.5 bg-ppa-blue px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition hover:bg-ppa-blue-deep active:scale-[0.97] sm:ml-0"
          >
            {live ? "▶ Watch Live" : `Buy Tickets — $${next.ticketPriceFrom}`}
            {!live && (
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
                →
              </span>
            )}
          </a>
        </div>
      </div>
    </div>
  );
}
