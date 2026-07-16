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
        <div className="sticky top-0 z-50">
          <Header />
        </div>
      </>
    );
  }

  return (
    <div className="sticky top-0 z-50">
      <ScoreTicker />
      <Header />
    </div>
  );
}
