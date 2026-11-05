"use client";

import { useState } from "react";
import { BracketPanel } from "@/components/live/BracketPanel";
import { FinalStandings } from "@/components/live/FinalStandings";
import { ScoresBoard } from "@/components/live/ScoresBoard";
import { DrawToggle, type DrawField } from "@/components/live/DrawToggle";

/**
 * Completed-event results with a Final Standings / Scores / Bracket toggle
 * (same yellow toggle as the live page). Final Standings is the default view.
 */
type View = "standings" | "scores" | "bracket";

export function ResultsPanel({
  eventId,
  showBracket = false,
  expandHref,
  roundByDay,
  showdown = false,
}: {
  eventId: string;
  showBracket?: boolean;
  expandHref?: string;
  /** Passed straight to ScoresBoard — see the prop there. */
  roundByDay?: Record<string, string>;
  /** The tournament hosted the PPA Challenger Showdown: offer Pro / Showdown. */
  showdown?: boolean;
}) {
  const [view, setView] = useState<View>("standings");
  const [field, setField] = useState<DrawField>("pro");
  const draw: DrawField = showdown ? field : "pro";

  const tabs: { id: View; label: string }[] = [
    { id: "standings", label: "Final Standings" },
    { id: "scores", label: "Scores" },
    ...(showBracket ? [{ id: "bracket" as const, label: "Bracket" }] : []),
  ];

  return (
    <div>
      {/* Final Standings are the pro podium only, so the toggle shows with the
          Scores and Bracket views, which carry both fields. */}
      {showdown && view !== "standings" && (
        <div className="mb-4">
          <DrawToggle value={draw} onChange={setField} />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = tab.id === view;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                active
                  ? "bg-ppa-yellow text-ppa-navy"
                  : "border border-white/20 text-white/70 hover:border-white/50 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {view === "standings" && <FinalStandings eventId={eventId} />}
        {view === "scores" && <ScoresBoard eventId={eventId} roundByDay={roundByDay} draw={draw} />}
        {view === "bracket" && showBracket && (
          <BracketPanel key={draw} eventId={eventId} expandHref={expandHref} draw={draw} />
        )}
      </div>
    </div>
  );
}
