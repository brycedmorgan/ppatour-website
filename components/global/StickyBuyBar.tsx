"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { TickerMatch } from "@/lib/ticker-api";
import { eventHref, formatDate, getNextTournament } from "@/lib/placeholder-data";
import {
  formatMatchScore,
  liveWatchUrl,
  pickFeaturedMatch,
  teamLabel,
  useLiveTicker,
} from "@/components/live/use-live-ticker";
import { withUtm } from "@/lib/utm";
import { useAppMode } from "@/components/app/use-app-mode";

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
  /**
   * ⚠ The buy bar stands down inside the installed app. Bryce, 8/18: in the fan
   * app the score bar owns the bottom edge. Two funnels — the website sells
   * tickets, the app follows the tour — and they do not share one bar. On the
   * web this is always false and nothing here changes.
   */
  const isApp = useAppMode();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pathname = usePathname();
  // See TopBar: trailingSlash: true means this route is "/live/".
  const isLive = pathname === "/live" || pathname === "/live/";
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

  /**
   * The full-page brackets view has its own bottom-pinned horizontal scrollbar;
   * don't let this bar sit on top of it.
   *
   * ⚠ THE TRAILING SLASH IS THE WHOLE FIX. This read `pathname === "/brackets"`,
   * but next.config sets `trailingSlash: true`, so `usePathname()` returns
   * "/brackets/" and the guard had never once fired — the bar has been sitting on
   * the bracket scrollbar this whole time. Found while wiring
   * `--buy-bar-visible-h`, by checking the suppressed path rather than assuming
   * it worked. Compare both forms so it survives the config being flipped back.
   */
  const suppressed = isApp || pathname === "/brackets" || pathname === "/brackets/";

  /**
   * Publish how much bottom edge this bar is actually covering right now, so
   * other bottom-fixed chrome can ride it up and down instead of permanently
   * reserving space for it.
   *
   * ⚠ VISIBLE height, not `--buy-bar-h`. That token is the bar's fixed height
   * and is always 3.5rem; this is 0px whenever the bar is slid off-screen, hidden
   * on /brackets, or unmounted. The event concierge launcher sits on this
   * (Wesley, 8/4: it "needs to stay at the bottom of the page and then slide up
   * when that bottom CTA with tickets pops up") — anchoring it to the fixed
   * token instead left it floating a bar's height above nothing for the whole
   * first screen, before the bar has scrolled in.
   */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--buy-bar-visible-h",
      visible && !suppressed ? "var(--buy-bar-h)" : "0px",
    );
    return () => root.style.setProperty("--buy-bar-visible-h", "0px");
  }, [visible, suppressed]);

  const featured = rotation.length > 0 ? rotation[index % rotation.length] : undefined;
  const live = Boolean(featured);
  // Unlisted on Tixr -> the bar points at the event page, not a ticket link.
  const href = featured
    ? liveWatchUrl(ordered)
    : next.ticketsOnSale
      ? withUtm(next.ticketsUrl, {
          campaign: next.eventCode ?? next.slug,
          content: "sticky-buy-bar",
        })
      : eventHref(next);

  if (suppressed) return null;

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
        {/* pl-16 below sm for the same reason as CookieBanner: the UserWay
            accessibility button floats bottom-left, and once the cookie banner
            is dismissed this is the bar it sits on. */}
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 pl-16 pr-4 sm:px-4">
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
              : next.name}
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
            {featured
              ? formatMatchScore(featured)
              : next.ticketsOnSale
                ? `From $${next.ticketPriceFrom}`
                : "Tickets soon"}
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
            {live
              ? "▶ Watch Live"
              : next.ticketsOnSale
                ? `Buy Tickets — $${next.ticketPriceFrom}`
                : "Event Details"}
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
