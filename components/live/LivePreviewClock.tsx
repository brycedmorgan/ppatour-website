"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The /live harness's on-screen clock, and the thing that performs the
 * re-render at the boundary.
 *
 * ⚠ THE FLIP ITSELF IS NOT DONE HERE. Whether the homepage renders Next Event or
 * LIVE NOW is decided on the server, by the same calendar check production runs
 * (`isTournamentLive`). All this does is ask for a re-render the moment the
 * shifted clock crosses the boundary, so a reviewer sees the change in one
 * sitting instead of waiting on a cache. In production that re-render is the
 * 60s ISR window doing it unprompted (app/page.tsx).
 *
 * So this is a rehearsal, not a costume: the same server code, the same
 * selectors, a different "now".
 */
export function LivePreviewClock({
  offsetMs,
  boundaryMs,
  live,
  eventName,
}: {
  /** Milliseconds added to the wall clock for this preview. */
  offsetMs: number;
  /** The next moment the page's state changes: first serve, or the last point. */
  boundaryMs: number;
  /** What the server decided this render — the thing we are waiting to change. */
  live: boolean;
  eventName: string;
}) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now() + offsetMs), 250);
    return () => window.clearInterval(id);
  }, [offsetMs]);

  useEffect(() => {
    const id = window.setInterval(() => {
      // Re-render on the server, which re-runs the same live check against the
      // same shifted clock. On an interval rather than fired once: a refresh
      // landing in the same second as the boundary can still come back unchanged.
      if (Date.now() + offsetMs >= boundaryMs) router.refresh();
    }, 1_000);
    return () => window.clearInterval(id);
  }, [offsetMs, boundaryMs, router]);

  // Before the first tick there is no clock to read — react-hooks/purity rightly
  // refuses Date.now() during render, and a dash is the honest pre-hydration
  // state anyway.
  const remaining = now === null ? null : Math.max(0, Math.ceil((boundaryMs - now) / 1_000));
  const simulated = now === null ? null : new Date(now);

  return (
    /* Bottom-RIGHT, and riding the sticky buy bar rather than sitting under it.
       Bottom-left is taken: UserWay's accessibility button floats there and has
       already been found covering the cookie banner (8/3). `--buy-bar-visible-h`
       is the bar's CURRENT height (0px while it is slid off-screen), published by
       StickyBuyBar for exactly this. */
    <div
      style={{ bottom: "calc(var(--buy-bar-visible-h, 0px) + 1rem)" }}
      className="fixed right-4 z-[60] max-w-[min(21rem,calc(100vw-2rem))] border-2 border-ppa-yellow bg-ppa-navy/95 px-3 py-2 text-white shadow-lg backdrop-blur"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppa-yellow">
        Preview · simulated clock
      </p>
      <p className="mt-1 text-xs tabular-nums">
        {remaining === null ? (
          "—"
        ) : live ? (
          <>
            Live. Back to Next Event in <span className="font-bold">{remaining}s</span>
          </>
        ) : (
          <>
            Goes live in <span className="font-bold">{remaining}s</span>
          </>
        )}
      </p>
      <p className="mt-1 text-[10px] leading-snug text-white/60">
        {eventName} · pretending it is{" "}
        {simulated
          ? simulated.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : "—"}
        . The real homepage decides this itself; nothing is forced.
      </p>
    </div>
  );
}
