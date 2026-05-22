"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  formatDateRange,
  getMainTourEvents,
  tierPoints,
  tierShort,
  type Tournament,
} from "@/lib/placeholder-data";

type FilterKey = "all" | "majors" | "cups" | "opens";

const FILTERS: {
  key: FilterKey;
  label: string;
  test: (t: Tournament) => boolean;
}[] = [
  { key: "all", label: "All Main Tour", test: () => true },
  { key: "majors", label: "Slams & Worlds", test: (t) => tierPoints(t) >= 2000 },
  { key: "cups", label: "Cups", test: (t) => tierPoints(t) === 1500 },
  { key: "opens", label: "Opens", test: (t) => tierPoints(t) === 1000 },
];

/**
 * Schedule grid. Source is `getMainTourEvents()` — 1,000+ points only, so
 * Challengers never appear here. The filter narrows within the main tour by
 * tier (Connor's "1000+ schedule filter" ask + the premium showcase).
 */
export function ScheduleGrid() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const active = FILTERS.find((f) => f.key === filter)!;
  const shown = getMainTourEvents().filter(active.test);

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
          {shown.length} {shown.length === 1 ? "Stop" : "Stops"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t, i) => (
          <article
            key={t.slug}
            className="group relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden bg-ppa-navy"
          >
            <Image
              src={t.image}
              alt={t.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover grayscale-[30%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
            />
            <div className="absolute inset-0 scrim-card" />
            <span className="absolute left-3 top-2 font-display text-2xl leading-none text-white/30">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="absolute right-3 top-3 bg-ppa-yellow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ppa-navy">
              {tierShort(t)} · {tierPoints(t).toLocaleString()}
            </span>
            <div className="relative p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                {t.presentedBy ? `Presented by ${t.presentedBy}` : "PPA Tour"}
              </p>
              <Link
                href={`/events/${t.slug}`}
                className="mt-0.5 block font-display text-lg uppercase leading-[1.05] text-white after:absolute after:inset-0"
              >
                {t.shortName}
              </Link>
              <p className="mt-1 text-xs text-white/60">
                {formatDateRange(t.startDate, t.endDate)} · {t.city}
                {t.state ? `, ${t.state}` : ""}
              </p>
              <span className="mt-3 inline-flex h-8 items-center bg-ppa-blue px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors group-hover:bg-ppa-blue-deep">
                Event Guide →
              </span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
