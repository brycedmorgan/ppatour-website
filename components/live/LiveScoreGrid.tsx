"use client";

import { useEffect, useRef, useState } from "react";
import type { TickerMatch, TickerResult } from "@/lib/ticker-api";
import { useLiveTicker } from "@/components/live/use-live-ticker";
import { MatchCard, MatchCardSkeleton } from "@/components/live/MatchCard";

/**
 * Tabbed match grid — one tab per match status (Live / Upcoming / Completed),
 * each a 3-per-row grid of cards. Reads the same useLiveTicker source as the
 * header ticker. Defaults to the first tab that has matches.
 */

const TABS: { key: TickerMatch["status"]; label: string }[] = [
  { key: "live", label: "Live" },
  { key: "upnext", label: "Upcoming" },
  { key: "final", label: "Completed" },
];

export function LiveScoreGrid({ initialData }: { initialData?: TickerResult } = {}) {
  const { ordered, loaded } = useLiveTicker({ initialData });
  const [tab, setTab] = useState<TickerMatch["status"]>("live");
  const autoPicked = useRef(false);

  const counts: Record<TickerMatch["status"], number> = { live: 0, upnext: 0, final: 0 };
  for (const m of ordered) counts[m.status]++;

  // On first load, land on the first tab that actually has matches (Live →
  // Upcoming → Completed). After that the visitor drives the tabs.
  useEffect(() => {
    if (!loaded || autoPicked.current) return;
    autoPicked.current = true;
    const c: Record<TickerMatch["status"], number> = { live: 0, upnext: 0, final: 0 };
    for (const m of ordered) c[m.status]++;
    if (c[tab] === 0) {
      const firstWith = TABS.find((t) => c[t.key] > 0)?.key;
      if (firstWith) setTab(firstWith);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, ordered]);

  const list = ordered.filter((m) => m.status === tab);
  const activeLabel = TABS.find((t) => t.key === tab)?.label.toLowerCase() ?? "";

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                active
                  ? "bg-white text-ppa-navy"
                  : "border border-white/20 text-white/70 hover:border-white/50 hover:text-white"
              }`}
            >
              {t.key === "live" && counts.live > 0 && (
                <span className="size-1.5 animate-pulse rounded-full bg-ppa-live" />
              )}
              {t.label}
              <span
                className={`tabular-nums ${active ? "text-ppa-navy/45" : "text-white/40"}`}
              >
                {counts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="mt-5">
        {!loaded ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <MatchCardSkeleton key={`sk-${i}`} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-white/10 bg-ppa-navy-deep px-6 py-10 text-center text-sm text-white/55">
            No {activeLabel} matches right now.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((m) => (
              <MatchCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
