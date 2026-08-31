"use client";

import { useEffect, useState } from "react";
import type { DivisionStandings, Medal, ScoresResult } from "@/lib/scores-api";

/**
 * Final standings — the podium (gold/silver/bronze) for every pro division,
 * pulled from /api/scores. The default view of the completed-event results.
 */
const MEDAL: Record<Medal, { icon: string; label: string; ring: string }> = {
  gold: { icon: "🥇", label: "Champion", ring: "border-l-ppa-yellow" },
  silver: { icon: "🥈", label: "Finalist", ring: "border-l-white/50" },
  bronze: { icon: "🥉", label: "Third", ring: "border-l-ppa-bronze" },
};

export function FinalStandings({ eventId }: { eventId: string }) {
  const [standings, setStandings] = useState<DivisionStandings[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/scores?event=${encodeURIComponent(eventId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ScoresResult | null) => {
        if (!active || !d) return;
        setStandings(d.standings ?? []);
        setLoaded(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [eventId]);

  if (!loaded) {
    return (
      <div className="flex h-[160px] items-center justify-center rounded-lg border border-white/10 bg-ppa-navy-deep">
        <span aria-hidden className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!standings.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-ppa-navy-deep px-6 py-10 text-center text-sm text-white/55">
        Final standings aren&apos;t posted yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {standings.map((s) => (
        <article
          key={s.divisionId}
          className="overflow-hidden rounded-md border border-white/10 bg-white"
        >
          <div className="bg-ppa-navy px-4 py-2.5">
            <p className="font-display text-sm uppercase leading-none text-white">
              {s.division}
            </p>
          </div>
          <ul>
            {s.places.map((p) => {
              const meta = p.medal ? MEDAL[p.medal] : null;
              return (
                <li
                  key={p.place}
                  className={`flex items-center gap-3 border-b border-ppa-line px-4 py-3 last:border-b-0 border-l-2 ${
                    meta?.ring ?? "border-l-transparent"
                  }`}
                >
                  <span className="text-xl leading-none" aria-hidden>
                    {meta?.icon ?? p.place}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                      {meta?.label ?? `#${p.place}`}
                    </p>
                    {p.players.map((name) => (
                      <p
                        key={name}
                        className="text-[13px] font-semibold leading-tight text-ppa-navy"
                      >
                        {name}
                      </p>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </div>
  );
}
