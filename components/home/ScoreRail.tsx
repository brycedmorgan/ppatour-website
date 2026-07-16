"use client";

import { useRef, useState } from "react";
import { matches } from "@/lib/home-content";

/**
 * Score rail. A horizontal scroll container — drag with the mouse or swipe on
 * touch. Does not auto-advance. Each edge fades only when there's more to
 * scroll that way, so the first and last cards are crisp at the ends.
 */
export function ScoreRail() {
  const railRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0 });
  const [edges, setEdges] = useState({ start: true, end: false });

  function onScroll() {
    const el = railRef.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  }

  // Fade an edge only when there's more content past it in that direction.
  const mask = `linear-gradient(to right, ${
    edges.start ? "#000 0%" : "transparent 0%, #000 5%"
  }, ${edges.end ? "#000 100%" : "#000 92%, transparent 100%"})`;

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
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

  function endDrag() {
    drag.current.active = false;
  }

  return (
    <div
      ref={railRef}
      onScroll={onScroll}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="flex cursor-grab gap-4 overflow-x-auto select-none active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      {matches.map((m) => (
        <article
          key={m.id}
          className="flex w-[286px] shrink-0 flex-col border border-ppa-line bg-ppa-paper p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.13em] text-ppa-navy/45">
              {m.division} · {m.round}
            </p>
            {m.status === "live" ? (
              <span className="flex shrink-0 items-center gap-1.5 bg-ppa-live px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                Live
              </span>
            ) : m.status === "final" ? (
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] text-[#2f9e44]">
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
