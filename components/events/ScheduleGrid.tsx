"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatDateRange,
  tierPoints,
  tierShort,
  type Tournament,
} from "@/lib/placeholder-data";

type TimeKey = "upcoming" | "past";
type TypeKey = "all" | "ppa" | "challengers" | "international";
type TierKey = "all" | "slam" | "cup" | "open";
type CountryKey = "all" | "Asia" | "Australia" | "Canada" | "Italy" | "Spain";
type SeasonKey = "all" | "2025-2026" | "2025" | "2024" | "2023" | "2022";

const TYPE_OPTIONS: { value: TypeKey; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "ppa", label: "PPA Tour" },
  { value: "challengers", label: "Challengers" },
  { value: "international", label: "International" },
];
const TIER_OPTIONS: { value: TierKey; label: string }[] = [
  { value: "all", label: "All Tiers" },
  { value: "slam", label: "Slam" },
  { value: "cup", label: "Cup" },
  { value: "open", label: "Open" },
];
const COUNTRY_OPTIONS: { value: CountryKey; label: string }[] = [
  { value: "all", label: "All Countries" },
  { value: "Asia", label: "Asia" },
  { value: "Australia", label: "Australia" },
  { value: "Canada", label: "Canada" },
  { value: "Italy", label: "Italy" },
  { value: "Spain", label: "Spain" },
];
const SEASON_OPTIONS: { value: SeasonKey; label: string }[] = [
  { value: "all", label: "All Seasons" },
  { value: "2025-2026", label: "2025–2026" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
];

function matchesQuery(t: Tournament, q: string): boolean {
  if (!q) return true;
  const hay = `${t.name} ${t.shortName} ${t.city} ${t.state} ${t.venue}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((term) => hay.includes(term));
}

function FilterSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-9 border border-ppa-line bg-white px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-ppa-navy outline-none focus:border-ppa-blue"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Events grid — every tour stop (past + upcoming) from the API, with a search
 * box, an Upcoming/Past toggle, and dependent dropdown filters: Type (always),
 * Tier (PPA only), Country (International only), Season (Past only).
 *
 * Cards link to our internal `/events/[slug]` page when the event has one
 * (US "Pro Pickleball Association" stops + curated events); international
 * sister-tour stops link out to their pickleballtournaments.com page.
 */
export function ScheduleGrid({ events }: { events: Tournament[] }) {
  const [query, setQuery] = useState("");
  const [time, setTime] = useState<TimeKey>("upcoming");
  const [type, setType] = useState<TypeKey>("all");
  const [tier, setTier] = useState<TierKey>("all");
  const [country, setCountry] = useState<CountryKey>("all");
  const [season, setSeason] = useState<SeasonKey>("all");

  function onTypeChange(v: TypeKey) {
    setType(v);
    if (v !== "ppa") setTier("all");
    if (v !== "international") setCountry("all");
  }
  function onTimeChange(v: TimeKey) {
    setTime(v);
    if (v !== "past") setSeason("all");
  }

  const shown = useMemo(() => {
    const q = query.trim();
    const list = events.filter((t) => {
      const inTime = time === "past" ? t.status === "completed" : t.status !== "completed";
      if (!inTime) return false;

      // Type
      if (type === "ppa" && (t.region === "international" || t.tierKey === "challenger")) return false;
      if (type === "challengers" && t.tierKey !== "challenger") return false;
      if (type === "international" && t.region !== "international") return false;

      // Tier (PPA only)
      if (type === "ppa" && tier !== "all") {
        const pts = tierPoints(t);
        if (tier === "slam" && pts < 2000) return false;
        if (tier === "cup" && pts !== 1500) return false;
        if (tier === "open" && pts !== 1000) return false;
      }

      // Country (International only)
      if (type === "international" && country !== "all" && t.country !== country) return false;

      // Season (Past only)
      if (time === "past" && season !== "all" && t.season !== season) return false;

      return matchesQuery(t, q);
    });
    return time === "past" ? list.reverse() : list;
  }, [events, query, time, type, tier, country, season]);

  return (
    <>
      {/* Search + time toggle */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ppa-navy/40"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, cities, venues…"
            className="h-10 w-full border border-ppa-line bg-white pl-9 pr-3 text-sm text-ppa-navy outline-none placeholder:text-ppa-navy/35 focus:border-ppa-blue"
          />
        </div>
        <div className="inline-flex shrink-0 border border-ppa-line bg-white p-1">
          {(
            [
              ["upcoming", "Upcoming"],
              ["past", "Past"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onTimeChange(key)}
              aria-pressed={time === key}
              className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                time === key ? "bg-ppa-navy text-white" : "text-ppa-navy/55 hover:text-ppa-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdown filters (dependent) */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterSelect value={type} onChange={onTypeChange} options={TYPE_OPTIONS} />
        {type === "ppa" && <FilterSelect value={tier} onChange={setTier} options={TIER_OPTIONS} />}
        {type === "international" && (
          <FilterSelect value={country} onChange={setCountry} options={COUNTRY_OPTIONS} />
        )}
        {time === "past" && (
          <FilterSelect value={season} onChange={setSeason} options={SEASON_OPTIONS} />
        )}
        <span className="ml-auto text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/40">
          {shown.length} {shown.length === 1 ? "Event" : "Events"}
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 border border-ppa-line bg-white px-4 py-12 text-center text-sm text-ppa-navy/55">
          No events match your filters. Try a different term or filter.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t, i) => {
            const completed = t.status === "completed";
            const internal = t.hasInternalPage !== false;
            const href = internal ? `/events/${t.slug}` : t.externalUrl ?? `/events/${t.slug}`;
            return (
              <article
                key={t.slug}
                className="group relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden bg-ppa-navy transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
              >
                <Image
                  src={t.image}
                  alt={t.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover grayscale-[30%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 scrim-card" />
                {t.brand?.icon ? (
                  <span className="absolute left-3 top-3 block h-20 w-[42px] overflow-hidden rounded drop-shadow-md transition-transform duration-500 group-hover:scale-105">
                    <Image
                      src={t.brand.icon}
                      alt={`${t.shortName} badge`}
                      fill
                      sizes="42px"
                      className="object-contain"
                    />
                  </span>
                ) : (
                  <span className="absolute left-3 top-2 font-display text-2xl leading-none text-white/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
                <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
                  <span className="bg-ppa-yellow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ppa-navy">
                    {tierShort(t)} · {tierPoints(t).toLocaleString()}
                  </span>
                  {t.region === "international" && (
                    <span className="bg-ppa-blue px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white">
                      {t.country ?? "International"}
                    </span>
                  )}
                </div>
                <div className="relative p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                    {t.presentedBy ? `Presented by ${t.presentedBy}` : "PPA Tour"}
                  </p>
                  {internal ? (
                    <Link
                      href={href}
                      className="mt-0.5 block font-display text-lg uppercase leading-[1.05] text-white after:absolute after:inset-0"
                    >
                      {t.shortName}
                    </Link>
                  ) : (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block font-display text-lg uppercase leading-[1.05] text-white after:absolute after:inset-0"
                    >
                      {t.shortName}
                    </a>
                  )}
                  <p className="mt-1 text-xs text-white/60">
                    {formatDateRange(t.startDate, t.endDate, true)} · {t.city}
                    {t.state ? `, ${t.state}` : ""}
                  </p>
                  <span className="mt-3 flex items-center justify-between gap-3">
                    <span
                      style={t.brand ? { backgroundColor: t.brand.accent } : undefined}
                      className={`inline-flex h-8 items-center gap-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-all ${
                        t.brand ? "group-hover:brightness-90" : "bg-ppa-blue group-hover:bg-ppa-blue-deep"
                      }`}
                    >
                      {internal ? (completed ? "View Event" : "Event Guide") : "Details"}
                      <span
                        aria-hidden
                        className="transition-transform duration-300 group-hover:translate-x-0.5"
                      >
                        {internal ? "→" : "↗"}
                      </span>
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ppa-yellow">
                      {completed ? "Completed" : `From $${t.ticketPriceFrom}`}
                    </span>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
