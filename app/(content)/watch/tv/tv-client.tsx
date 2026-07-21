"use client";

import Link from "next/link";
import { useState } from "react";
import { tvSchedule } from "@/lib/tv-schedule";

type Filter = "all" | "Tennis Channel" | "PBTV";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All Broadcasts" },
  { key: "Tennis Channel", label: "Tennis Channel" },
  { key: "PBTV", label: "PickleballTV" },
];

export function TvScheduleList() {
  const [filter, setFilter] = useState<Filter>("all");

  const events = tvSchedule
    .map((e) => ({
      ...e,
      days: e.days
        .map((d) => ({
          ...d,
          windows:
            filter === "all"
              ? d.windows
              : d.windows.filter((w) => w.channel === filter),
        }))
        .filter((d) => d.windows.length > 0),
    }))
    .filter((e) => e.days.length > 0);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`h-9 px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
              filter === f.key
                ? "bg-ppa-navy text-white"
                : "border border-ppa-line bg-white text-ppa-navy/60 hover:border-ppa-blue hover:text-ppa-navy"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/40">
          All times ET
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-8">
        {events.map((e) => (
          <section key={e.name} data-reveal className="border border-ppa-line bg-white">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-ppa-line bg-ppa-navy px-4 py-3 text-white">
              <span
                className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                  e.league === "MLP" ? "bg-ppa-yellow text-ppa-navy" : "bg-ppa-blue"
                }`}
              >
                {e.league}
              </span>
              {e.slug ? (
                <Link
                  href={`/events/${e.startIso.slice(0, 4)}/${e.slug}`}
                  className="font-display text-lg uppercase leading-tight hover:text-ppa-sky"
                >
                  {e.name} →
                </Link>
              ) : (
                <span className="font-display text-lg uppercase leading-tight">
                  {e.name}
                </span>
              )}
              <span className="text-xs text-white/55">{e.location}</span>
              {e.tier && (
                <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-yellow">
                  {e.tier} pts
                </span>
              )}
            </div>

            <div className="hidden grid-cols-[6rem_1fr_10rem_9rem] gap-3 border-b border-ppa-line bg-ppa-paper px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45 sm:grid">
              <span>Date</span>
              <span>Round</span>
              <span>Channel</span>
              <span className="text-right">Window (ET)</span>
            </div>

            {e.days.map((d) =>
              d.windows.map((w, wi) => (
                <div
                  key={`${d.date}-${w.channel}-${wi}`}
                  className={`grid grid-cols-[6rem_1fr] items-center gap-x-3 gap-y-0.5 border-b border-ppa-line px-4 py-2.5 last:border-b-0 sm:grid-cols-[6rem_1fr_10rem_9rem] ${
                    w.channel === "Tennis Channel" ? "bg-ppa-blue/5" : "bg-white"
                  }`}
                >
                  <span className="font-display text-sm uppercase text-ppa-blue">
                    {wi === 0 ? (
                      <>
                        {d.dow} <span className="text-ppa-navy">{d.date}</span>
                      </>
                    ) : (
                      ""
                    )}
                  </span>
                  <span className="text-sm font-semibold text-ppa-navy">
                    {w.round}
                  </span>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-[0.1em] ${
                      w.channel === "Tennis Channel"
                        ? "text-ppa-blue"
                        : "text-ppa-navy/55"
                    }`}
                  >
                    {w.channel === "Tennis Channel" ? "📺 Tennis Channel" : "PickleballTV"}
                  </span>
                  <span className="text-left text-sm font-bold tabular-nums text-ppa-navy sm:text-right">
                    {w.window}
                  </span>
                </div>
              )),
            )}
          </section>
        ))}
      </div>
    </>
  );
}
