"use client";

import Link from "next/link";
import { Suspense, useSyncExternalStore, type ReactNode } from "react";
import { liveWatchUrl, PBTV_STREAM_URL, useLiveTicker } from "@/components/live/use-live-ticker";

/**
 * "Watch Live" link that targets the stream of the FIRST match on the score
 * ticker rail — the leftmost card a viewer is looking at — falling back to the
 * PickleballTV stream when that match carries no link of its own. Both come off
 * the shared live-ticker feed, so the button and the rail can never disagree.
 * Self-contained Suspense (useLiveTicker reads useSearchParams) with a
 * functional fallback link so it works before hydration and during static
 * prerender.
 *
 * ⚠ WITH `idle`, IT ONLY SAYS "WATCH LIVE" WHILE A MATCH IS LIVE (Wesley, 9/28,
 * "Verbiage Update for Live Events"). Tournament week has long stretches with
 * nothing on court — overnight, before first serve, between sessions — and a
 * red Watch Live button then opens a stream showing nothing of the event. The
 * idle link renders in those stretches, and also before hydration: the server
 * cannot know whether a match is on, and it must not claim one is.
 *
 * Without `idle` the button behaves exactly as it always has.
 */
type Idle = { href: string; className?: string; children: ReactNode };

const subscribeNever = () => () => {};

function IdleLink({ idle }: { idle: Idle }) {
  return (
    <Link href={idle.href} className={idle.className}>
      {idle.children}
    </Link>
  );
}

function Inner({
  className,
  children,
  idle,
}: {
  className?: string;
  children: ReactNode;
  idle?: Idle;
}) {
  const { ordered } = useLiveTicker();
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  if (idle && (!mounted || !ordered.some((m) => m.status === "live"))) {
    return <IdleLink idle={idle} />;
  }
  return (
    <a href={liveWatchUrl(ordered)} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export function WatchLiveButton({
  className,
  children,
  idle,
}: {
  className?: string;
  children: ReactNode;
  /** What to render while no match is live. Omit to always show Watch Live. */
  idle?: Idle;
}) {
  return (
    <Suspense
      fallback={
        idle ? (
          <IdleLink idle={idle} />
        ) : (
          <a href={PBTV_STREAM_URL} target="_blank" rel="noopener noreferrer" className={className}>
            {children}
          </a>
        )
      }
    >
      <Inner className={className} idle={idle}>
        {children}
      </Inner>
    </Suspense>
  );
}
