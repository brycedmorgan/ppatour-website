"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { formatDate, getNextTournament } from "@/lib/placeholder-data";
import {
  formatMatchScore,
  pickFeaturedMatch,
  teamLabel,
  useLiveTicker,
} from "@/components/live/use-live-ticker";
import { withUtm } from "@/lib/utm";

/**
 * Sticky commerce bar (Option A punch-list #7). Slides up from the bottom
 * once the visitor scrolls past the hero: next event + price anchor + Buy
 * Tickets. During a live event (the /live route) the same bar swaps to a
 * Watch CTA and shows the featured live match — pulled from the same
 * useLiveTicker source as the header score ticker, so the two never disagree.
 */
export function StickyBuyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pathname = usePathname();
  const isLive = pathname === "/live";
  const { ordered } = useLiveTicker({ enabled: isLive });
  const featured = isLive ? pickFeaturedMatch(ordered) : undefined;
  const next = getNextTournament();
  const live = Boolean(featured);
  const href = featured
    ? featured.watchUrl || "/watch"
    : withUtm(next.ticketsUrl, {
        campaign: next.slug,
        content: "sticky-buy-bar",
      });

  return (
    <div
      aria-hidden={!visible}
      style={{ bottom: "var(--cookie-banner-h, 0px)" }}
      className={`fixed inset-x-0 z-30 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
    >
      <div
        className={`border-t-2 bg-ppa-navy-deep/95 text-white backdrop-blur-sm ${
          live ? "border-ppa-live" : "border-ppa-blue"
        }`}
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
          {live ? (
            <span className="flex shrink-0 items-center gap-1.5 bg-ppa-live px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              Live Now
            </span>
          ) : (
            <span className="hidden shrink-0 bg-ppa-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] sm:inline">
              Next Event
            </span>
          )}
          <span className="min-w-0 truncate text-xs font-bold uppercase tracking-[0.1em]">
            {featured
              ? `${teamLabel(featured.teams[0])} vs ${teamLabel(featured.teams[1])}`
              : next.shortName}
          </span>
          {!live && (
            <span className="hidden shrink-0 text-xs text-white/55 md:inline">
              {formatDate(next.startDate)} · {next.city}, {next.state}
            </span>
          )}

          <span className="ml-auto hidden shrink-0 text-xs font-bold uppercase tracking-[0.1em] text-ppa-yellow sm:inline">
            {featured ? formatMatchScore(featured) : `From $${next.ticketPriceFrom}`}
          </span>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={visible ? undefined : -1}
            className={`group ml-auto flex h-9 shrink-0 items-center gap-1.5 px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition active:scale-[0.97] sm:ml-0 ${
              live
                ? "bg-ppa-live hover:bg-ppa-live-deep"
                : "bg-ppa-blue hover:bg-ppa-blue-deep"
            }`}
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
