"use client";

import { useState } from "react";
import type { RankingDivision } from "@/lib/rankings-api";
import { RankingTable } from "./RankingTable";

/**
 * The World Pickleball Rankings board.
 *
 * Bryce 7/28: desktop had too much dead space left-to-right with one board at
 * a time, so from `lg` up BOTH boards render side by side (men's left, women's
 * right) and the gender toggle is hidden. Below `lg` the toggle stays and only
 * the active board renders. One render tree, CSS decides — no duplicate DOM.
 */
export function RankingsBoard({ divisions }: { divisions: RankingDivision[] }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      {/* Gender tabs — mobile/tablet only; desktop shows both boards. */}
      <div className="flex gap-1 lg:hidden">
        {divisions.map((d, i) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
              i === active
                ? "bg-white text-ppa-navy"
                : "border border-white/20 text-white/60 hover:text-white"
            }`}
          >
            {d.short}
            {d.entries.length > 10 && (
              <span className="ml-1.5 opacity-60">· {d.entries.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-8">
        {divisions.map((d, i) => (
          <div
            key={d.key}
            className={i === active ? "block" : "hidden lg:block"}
          >
            {/* Column heading stands in for the toggle on desktop. */}
            <div className="mb-3 hidden items-baseline justify-between border-b border-white/10 pb-2 lg:flex">
              <h3 className="font-display text-lg uppercase leading-none text-white">
                {d.label}
              </h3>
              {/* Count only on the full boards — the homepage module shows a
                  top-10 slice, where "10 ranked" would read as the whole field. */}
              {d.entries.length > 10 && (
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                  {d.entries.length} ranked
                </span>
              )}
            </div>
            <RankingTable entries={d.entries} />
          </div>
        ))}
      </div>
    </div>
  );
}
