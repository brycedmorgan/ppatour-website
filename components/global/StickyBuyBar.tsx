"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { TickerMatch } from "@/lib/ticker-api";
import { formatDate, getNextTournament } from "@/lib/placeholder-data";
import {
  formatMatchScore,
  liveWatchUrl,
  pickFeaturedMatch,
  teamLabel,
  useLiveTicker,
} from "@/components/live/use-live-ticker";
import { withUtm } from "@/lib/utm";

// Cross-fade timing: hold each match this long, then fade over FADE_MS.
const HOLD_MS = 5000;
const FADE_MS = 500;

/**
 * Sticky commerce bar (Option A punch-list #7). Slides up from the bottom
 * once the visitor scrolls past the hero: next event + price anchor + Buy
 * Tickets. During a live event (the /live route) the same bar swaps to a
 * Watch CTA and cycles through all live matches — fading between them every
 * 5s — pulled from the same useLiveTicker source as the header score ticker,
 * so the two never disagree.
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
  const next = getNextTournament();

  // Every live match to rotate through; fall back to the single featured match
  // (e.g. only up-next / final in the window) so the banner still shows one.
  const rotation = useMemo<TickerMatch[]>(() => {
    if (!isLive) return [];
    const liveOnly = ordered.filter((m) => m.status === "live");
    if (liveOnly.length > 0) return liveOnly;
    const feat = pickFeaturedMatch(ordered);
    return feat ? [feat] : [];
  }, [isLive, ordered]);

  // Cross-fade cycler: fade out, swap match, fade back in — every HOLD_MS.
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    if (rotation.length <= 1) {
      setIndex(0);
      setShown(true);
      return;
    }
    let fadeTimer: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setShown(false);
      fadeTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % rotation.length);
        setShown(true);
      }, FADE_MS);
    }, HOLD_MS);
    return () => {
      clearInterval(id);
      clearTimeout(fadeTimer);
    };
  }, [rotation.length]);

  const featured = rotation.length > 0 ? rotation[index % rotation.length] : undefined;
  const live = Boolean(featured);
  const href = featured
    ? liveWatchUrl(ordered)
    : withUtm(next.ticketsUrl, {
        campaign: next.slug,
        content: "sticky-buy-bar",
      });

  // The full-page brackets view has its own bottom-pinned horizontal scrollbar;
  // don't let this bar sit on top of it.
  if (pathname === "/brackets") return null;

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
          <span
            aria-live="polite"
            className={`min-w-0 truncate text-xs font-bold uppercase tracking-[0.1em] transition-opacity duration-500 motion-reduce:transition-none ${
              shown ? "opacity-100" : "opacity-0"
            }`}
          >
            {featured
              ? `${teamLabel(featured.teams[0])} vs ${teamLabel(featured.teams[1])}`
              : next.shortName}
          </span>
          {!live && (
            <span className="hidden shrink-0 text-xs text-white/55 md:inline">
              {formatDate(next.startDate)} · {next.city}, {next.state}
            </span>
          )}

          <span
            className={`ml-auto hidden shrink-0 text-xs font-bold uppercase tracking-[0.1em] text-ppa-yellow transition-opacity duration-500 motion-reduce:transition-none sm:inline ${
              shown ? "opacity-100" : "opacity-0"
            }`}
          >
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
