"use client";

import { useState } from "react";
import type { RankingDivision } from "@/lib/rankings-api";
import { RankingTable } from "./RankingTable";

/** /rankings preview: Men/Women tabs over the shared standings table. */
export function RankingsBoard({ divisions }: { divisions: RankingDivision[] }) {
  const [active, setActive] = useState(0);
  const division = divisions[active] ?? divisions[0];

  return (
    <div>
      {/* Gender tabs */}
      <div className="flex gap-1">
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
          </button>
        ))}
      </div>

      <div className="mt-6">
        <RankingTable entries={division?.entries ?? []} />
      </div>
    </div>
  );
}
