"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/global/Header";
import { HideOnScroll } from "@/components/global/HideOnScroll";
import { ScoreTicker } from "@/components/global/ScoreTicker";
import { LiveBar } from "@/components/live/LiveBar";
import { LiveScoreTicker } from "@/components/live/LiveScoreTicker";
import { useTourIsLive } from "@/components/live/use-live-ticker";

/**
 * Sticky top chrome. The /live route gets the broadcast header stack
 * (score ticker → live bar → menu); every other route keeps the standard
 * ticker + menu.
 */
/**
 * ⚠ THE TRAILING SLASH IS THE WHOLE FIX — same bug as StickyBuyBar's
 * /brackets check. `trailingSlash: true` (next.config.ts) means the live
 * preview's real pathname is "/live/", so `=== "/live"` never matched and the
 * broadcast chrome NEVER rendered on the one route built to show it: the hero
 * said LIVE NOW while the bar above it said "Next Event" and the bar below it
 * said "Buy Tickets".
 */
const isLivePath = (pathname: string) => pathname === "/live" || pathname === "/live/";
/** trailingSlash: true means the index is "/" — kept alongside "" defensively. */
const isHomePath = (pathname: string) => pathname === "/" || pathname === "";

export function TopBar() {
  /**
   * ⚠ THE ROUTE DECIDES WHETHER THE BROADCAST CHROME *CAN* SHOW; THE CLOCK
   * DECIDES WHETHER IT DOES. This was the pathname alone, so /live wore the
   * marquee and the full score rail from the moment it loaded — including
   * thirty seconds before first serve while previewing `?in=30`, with the hero
   * still counting down underneath. Now it appears when the page it sits above
   * goes live, and both read the same calendar check.
   */
  const pathname = usePathname();
  const { live } = useTourIsLive();

  /**
   * ⚠ THE MATCH-CARD RAIL BELONGS ON THE HOMEPAGE TOO, NOT JUST /live.
   *
   * Wesley, 8/31: "on /live we get a score ticker to appear… it shows the match
   * cards. However, on the home page, that score ticker isn't appearing. /live
   * was just a reference for when we are live on home."
   *
   * /live was only ever the rehearsal surface. Everything else about the live
   * homepage was wired to the calendar — the hero, the scores band, Next on Tour
   * retiring — and this was the last piece still keyed to the URL, so the
   * homepage got a one-line summary while the rehearsal got the real thing.
   *
   * The marquee comes with it (Wesley, 8/31: "it should also have that marquee
   * text that we have when it goes live"). Both halves of the broadcast header
   * now render wherever the tour is live, so the homepage and /live are the same
   * chrome reading the same feed — which is the point of /live being a rehearsal
   * rather than a second design.
   *
   * ⚠ Every word of the marquee is derived (see LiveBar's own note). It used to
   * be two constants naming the April Atlanta test event; if it ever goes back to
   * a hardcoded phrase, this is now the tour's front page carrying it.
   */
  const showBroadcastChrome = live && (isLivePath(pathname) || isHomePath(pathname));

  // The marquee + score ticker scroll away; only the nav sticks.
  if (showBroadcastChrome) {
    return (
      <>
        {/* Suspense: both read useSearchParams (?partner=) through
            useLiveTicker, which needs a boundary to build/prerender. */}
        <Suspense fallback={<div className="h-[41px] bg-ppa-navy" />}>
          <LiveBar />
        </Suspense>
        <Suspense fallback={<div className="h-[104px] bg-ppa-navy" />}>
          {/* ⚠ No logo/href passed on purpose. These were pinned to the Veolia
              Atlanta Championships — the April test event — so the broadcast
              header wore a finished tournament's crest over whatever was
              genuinely live. The rail takes the live tournament's own crest
              from the feed now. */}
          <LiveScoreTicker />
        </Suspense>
        <div className="site-chrome sticky top-0 z-50">
          <Header />
        </div>
      </>
    );
  }

  // `site-chrome`: event pages slide this stack away on scroll so the event
  // tab bar (with its Buy Tickets CTA) owns the top edge (see globals.css).
  // The Next-Event sub-bar retires on first scroll (Bryce 7/28) — only the
  // main floating header travels down the page.
  return (
    <div className="site-chrome sticky top-0 z-50">
      {/* ⚠ The ticker stays put while the tour is on. Off-season it still
          retires on first scroll, which is what Bryce asked for — but a live
          score is the most useful thing in the chrome, not something to read
          once and dismiss. `live` is the same calendar check the hero flips on. */}
      <HideOnScroll keep={live}>
        {/* Suspense: ScoreTicker reads live matches through useLiveTicker, which
            reads useSearchParams. The fallback is the bar's exact height so the
            chrome never shifts. */}
        <Suspense fallback={<div className="h-9 w-full bg-ppa-navy" />}>
          <ScoreTicker />
        </Suspense>
      </HideOnScroll>
      <Header />
    </div>
  );
}
