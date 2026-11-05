"use client";

import { useState } from "react";
import { BracketPanel } from "@/components/live/BracketPanel";
import { ScoresBoard } from "@/components/live/ScoresBoard";
import { DrawToggle, type DrawField } from "@/components/live/DrawToggle";

/**
 * Scores ↔ Bracket toggle (the live tournament page's scores section). Reused
 * on /live inside the white "Live & Latest" band — pass `light` so the scores
 * controls read on a light background. The bracket panel is self-contained.
 */
export function ScoresBracketToggle({
  eventId,
  expandHref,
  light = false,
  roundByDay,
  showdown = false,
}: {
  eventId: string;
  expandHref?: string;
  light?: boolean;
  /** Passed straight to ScoresBoard — see the prop there. */
  roundByDay?: Record<string, string>;
  /** The tournament hosts the PPA Challenger Showdown: offer Pro / Showdown. */
  showdown?: boolean;
}) {
  const [view, setView] = useState<"scores" | "bracket">("scores");
  const [field, setField] = useState<DrawField>("pro");
  const draw: DrawField = showdown ? field : "pro";

  return (
    <div>
      {showdown && (
        <div className="mb-4">
          <DrawToggle value={draw} onChange={setField} light={light} />
        </div>
      )}
      <div
        className={`inline-flex rounded-full border p-0.5 ${
          light ? "border-ppa-line" : "border-white/15"
        }`}
      >
        {(["scores", "bracket"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-full px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
              view === v
                ? light
                  ? "bg-ppa-blue text-white"
                  : "bg-ppa-yellow text-ppa-navy"
                : light
                  ? "text-ppa-navy/55 hover:text-ppa-navy"
                  : "text-white/60 hover:text-white"
            }`}
          >
            {v === "scores" ? "Scores" : "Bracket"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {view === "scores" ? (
          <ScoresBoard eventId={eventId} light={light} roundByDay={roundByDay} draw={draw} />
        ) : (
          <BracketPanel key={draw} eventId={eventId} expandHref={expandHref} light={light} draw={draw} />
        )}
      </div>
    </div>
  );
}
