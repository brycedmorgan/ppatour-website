"use client";

import { useEffect, useRef } from "react";
import { matches } from "@/lib/home-content";

/**
 * Live-score ticker. A real horizontal scroll container that auto-advances
 * to the right, pauses on hover, and is fully drag/swipe-scrollable. The
 * match list is rendered twice so the auto-scroll loops seamlessly.
 */
export function ScoreRail() {
  const railRef = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);
  const interacting = useRef(false);
  const drag = useRef({ active: false, startX: 0, startScroll: 0 });

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // Touch devices get a static, natively swipeable rail — auto-advance
    // would carry a score away mid-read and can't be hover-paused (§QA).
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let raf = 0;

    const tick = () => {
      const half = el.scrollWidth / 2;
      if (half > 0) {
        if (!hovering.current && !interacting.current && !reduce && !coarse) {
          el.scrollLeft += 0.7;
        }
        // Seamless wrap — the list is duplicated, so jumping by one
        // set width is invisible (works for auto-scroll and dragging).
        if (el.scrollLeft >= half) el.scrollLeft -= half;
        else if (el.scrollLeft < 0) el.scrollLeft += half;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    interacting.current = true;
    if (e.pointerType !== "mouse") return; // touch/pen use native scroll
    const el = railRef.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
    };
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = railRef.current;
    if (!el || !drag.current.active) return;
    el.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX);
  }

  function endInteraction() {
    interacting.current = false;
    drag.current.active = false;
  }

  return (
    <div
      ref={railRef}
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => {
        hovering.current = false;
        endInteraction();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endInteraction}
      onPointerCancel={endInteraction}
      className="flex cursor-grab gap-4 overflow-x-auto select-none active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)",
      }}
    >
      {[...matches, ...matches].map((m, idx) => (
        <article
          key={`${m.id}-${idx}`}
          className="flex w-[286px] shrink-0 flex-col border border-ppa-line bg-ppa-paper p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.13em] text-ppa-navy/45">
              {m.division} · {m.round}
            </p>
            {m.status === "live" ? (
              <span className="flex shrink-0 items-center gap-1.5 bg-ppa-blue px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                Live
              </span>
            ) : m.status === "final" ? (
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] text-ppa-navy/40">
                Final
              </span>
            ) : (
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.12em] text-ppa-blue">
                {m.detail}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {m.sides.map((s, si) => (
              <div
                key={si}
                className="flex items-center justify-between gap-3"
              >
                <span
                  className={`truncate text-sm ${
                    m.status === "final" && !s.winner
                      ? "font-medium text-ppa-navy/45"
                      : "font-bold text-ppa-navy"
                  }`}
                >
                  {s.name}
                </span>
                {m.status === "upcoming" ? (
                  <span className="text-xs text-ppa-navy/30">—</span>
                ) : (
                  <span className="flex shrink-0 gap-1">
                    {s.games.map((g, gi) => (
                      <span
                        key={gi}
                        className={`w-6 text-center text-sm tabular-nums ${
                          m.status === "live" && gi === s.games.length - 1
                            ? "font-bold text-ppa-blue"
                            : "font-semibold text-ppa-navy/70"
                        }`}
                      >
                        {g}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="mt-3 border-t border-ppa-line pt-2 text-[10px] uppercase tracking-[0.1em] text-ppa-navy/35">
            {m.status === "upcoming" ? "Today" : m.detail}
          </p>
        </article>
      ))}
    </div>
  );
}
