"use client";

import { BoxScore, finishChipClass } from "@/components/athletes/BoxScore";
import { EventLogo, dateRange } from "@/components/athletes/RecentResults";
import { usePlayerHistory } from "@/components/athletes/use-player-history";
import { useAppMode } from "@/components/app/use-app-mode";

/**
 * The profile's right-column "Latest Result" card (Bryce, 10/11): their most
 * recent tour stop — logo, and how far they got there — over an ESPN-style
 * box score of their last match, with a jump to the full Recent Results band.
 *
 * Same request as that band (usePlayerHistory). Renders nothing until it has
 * a match, so Quick Info never shifts for a pro with no recent results.
 *
 * "How far they got" is their BEST finish at that stop across divisions —
 * a champion in doubles who went out early in mixed reads Champion.
 */
export function LatestResult({ name }: { name: string }) {
  const isApp = useAppMode();
  const data = usePlayerHistory(name);
  const m = data?.matches[0];
  if (!data || !m) return null;

  const e = data.events.find((x) => x.eventId === m.eventId) ?? data.events[0];
  const best = e
    ? [...e.divisions].filter((d) => d.finish).sort((a, b) => (a.place ?? 9) - (b.place ?? 9))[0]
    : undefined;

  return (
    <div className="mt-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Latest Result</p>
      <div className="mt-3 border border-ppa-line bg-white">
        {e && (
          <div className="flex items-center gap-3 bg-ppa-navy px-4 py-3.5 text-white">
            <EventLogo e={e} size={48} />
            <div className="min-w-0 flex-1">
              {best && (
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${finishChipClass(best.place, "dark")}`}
                >
                  {best.finish}
                </span>
              )}
              <p className="mt-1 truncate text-[13px] font-bold leading-tight">{e.name}</p>
              <p className="truncate text-[11px] font-semibold text-white/55">
                {best ? `${best.division} · ` : ""}
                {dateRange(e.startDate, e.endDate)}
              </p>
            </div>
          </div>
        )}
        <BoxScore m={m} subject={name} faces={data.faces} link={isApp} bare />
        <a
          href="#recent-results"
          className="flex h-10 items-center justify-center border-t border-ppa-line text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy transition-colors hover:bg-ppa-paper hover:text-ppa-blue"
        >
          See all results →
        </a>
      </div>
    </div>
  );
}
