"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/global/Header";
import { ScoreTicker } from "@/components/global/ScoreTicker";
import { LiveBar } from "@/components/live/LiveBar";
import { LiveScoreTicker } from "@/components/live/LiveScoreTicker";

/**
 * Sticky top chrome. The /live route gets the broadcast header stack
 * (score ticker → live bar → menu); every other route keeps the standard
 * ticker + menu.
 */
export function TopBar() {
  const isLive = usePathname() === "/live";

  // On /live the marquee + score ticker scroll away; only the nav sticks.
  if (isLive) {
    return (
      <>
        <LiveBar />
        {/* Suspense: LiveScoreTicker reads useSearchParams (?partner=), which
            needs a boundary to build/prerender. */}
        <Suspense fallback={<div className="h-[104px] bg-ppa-navy" />}>
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
  return (
    <div className="site-chrome sticky top-0 z-50">
      <ScoreTicker />
      <Header />
    </div>
  );
}
