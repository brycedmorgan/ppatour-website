"use client";

import { Suspense, type ReactNode } from "react";
import { liveWatchUrl, PBTV_STREAM_URL, useLiveTicker } from "@/components/live/use-live-ticker";

/**
 * "Watch Live" link that targets the stream of the FIRST match on the score
 * ticker rail — the leftmost card a viewer is looking at — falling back to the
 * PickleballTV stream when that match carries no link of its own. Both come off
 * the shared live-ticker feed, so the button and the rail can never disagree.
 * Self-contained Suspense (useLiveTicker reads useSearchParams) with a
 * functional fallback link so it works before hydration and during static
 * prerender.
 */
function Inner({ className, children }: { className?: string; children: ReactNode }) {
  const { ordered } = useLiveTicker();
  return (
    <a href={liveWatchUrl(ordered)} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export function WatchLiveButton({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <a href={PBTV_STREAM_URL} target="_blank" rel="noopener noreferrer" className={className}>
          {children}
        </a>
      }
    >
      <Inner className={className}>{children}</Inner>
    </Suspense>
  );
}
