"use client";

import { useState } from "react";
import { divisionRankings } from "@/lib/home-content";

function Move({ n }: { n: number }) {
  if (n > 0) return <span className="text-ppa-yellow">▲ {n}</span>;
  if (n < 0) return <span className="text-white/35">▼ {Math.abs(n)}</span>;
  return <span className="text-white/25">—</span>;
}

/**
 * Six-tab points race — ppatour.com splits standings by division
 * (Men's/Women's × Singles/Doubles/Mixed). Tabs scroll horizontally on
 * narrow viewports.
 */
export function PointsRace() {
  const [active, setActive] = useState(0);
  const division = divisionRankings[active];

  return (
    <>
      {/* Tabs */}
      <div className="mt-6 -mx-4 flex gap-1 overflow-x-auto border-b border-white/10 px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {divisionRankings.map((d, i) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={`relative shrink-0 px-3 py-3 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
              i === active
                ? "text-white"
                : "text-white/40 hover:text-white/75"
            }`}
          >
            {d.short}
            {i === active && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 bg-ppa-blue" />
            )}
          </button>
        ))}
      </div>

      {/* Standings */}
      <div className="mt-4 border border-white/10">
        <div className="grid grid-cols-[2rem_1fr_5rem_3.5rem] items-center gap-3 border-b border-white/10 bg-ppa-navy-deep px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Points</span>
          <span className="text-right">Move</span>
        </div>
        {division.entries.map((e) => (
          <div
            key={e.rank}
            className="grid grid-cols-[2rem_1fr_5rem_3.5rem] items-center gap-3 border-b border-white/5 px-4 py-3 text-white last:border-b-0"
          >
            <span className="font-display text-lg text-white/40">{e.rank}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold uppercase tracking-wide">
                {e.name}
              </span>
              <span className="block text-[11px] text-white/45">
                {division.label}
              </span>
            </span>
            <span className="text-right text-sm font-bold tabular-nums text-ppa-sky">
              {e.points.toLocaleString()}
            </span>
            <span className="text-right text-xs font-bold">
              <Move n={e.move} />
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
