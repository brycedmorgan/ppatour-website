"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type RosterAthlete = {
  slug: string;
  name: string;
  /** Local or remote headshot URL; "" renders the branded placeholder. */
  headshot: string;
  country: string;
  /** Lowercase ISO-2 code for the circle-flag CDN, or "" if unknown. */
  countryCode: string;
  rank: number;
  /** Live WPR points (0 if unranked). */
  points: number;
  gender: "male" | "female";
  /** Pro divisions (e.g. "Men's Singles") for the discipline filter. */
  divisions?: string[];
};

type GenderKey = "all" | "male" | "female";
type DisciplineKey = "all" | "Singles" | "Doubles" | "Mixed";
type RangeKey = "all" | "10" | "25" | "50";
type SortKey = "points" | "alpha";

function inDiscipline(a: RosterAthlete, d: DisciplineKey): boolean {
  if (d === "all") return true;
  const divs = a.divisions ?? [];
  if (d === "Mixed") return divs.some((x) => x.includes("Mixed"));
  return divs.some((x) => x.includes(d) && !x.includes("Mixed"));
}

function matchesQuery(a: RosterAthlete, q: string): boolean {
  if (!q) return true;
  const hay = `${a.name} ${a.country}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((term) => hay.includes(term));
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45">
        {label}
      </span>
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
    </label>
  );
}

/**
 * Roster grid with search + filters (gender / discipline / ranking range)
 * and sort. Filters per Connor's 7/20 punch list.
 */
export function AthleteRoster({ athletes }: { athletes: RosterAthlete[] }) {
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<GenderKey>("all");
  const [discipline, setDiscipline] = useState<DisciplineKey>("all");
  const [range, setRange] = useState<RangeKey>("all");
  const [sort, setSort] = useState<SortKey>("points");

  const shown = useMemo(() => {
    const q = query.trim();
    const maxRank = range === "all" ? Infinity : Number(range);
    const list = athletes.filter(
      (a) =>
        (gender === "all" || a.gender === gender) &&
        inDiscipline(a, discipline) &&
        (range === "all" || (a.rank > 0 && a.rank <= maxRank)) &&
        matchesQuery(a, q),
    );
    if (sort === "alpha") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    // WPR points: highest first; unranked (0 pts) fall to the bottom by name.
    return [...list].sort(
      (a, b) => b.points - a.points || a.name.localeCompare(b.name),
    );
  }, [athletes, query, gender, discipline, range, sort]);

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
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
            placeholder="Search athletes, countries…"
            className="h-10 w-full border border-ppa-line bg-white pl-9 pr-3 text-sm text-ppa-navy outline-none placeholder:text-ppa-navy/35 focus:border-ppa-blue"
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Select
            label="Gender"
            value={gender}
            onChange={setGender}
            options={[
              { value: "all", label: "All" },
              { value: "male", label: "Men" },
              { value: "female", label: "Women" },
            ]}
          />
          <Select
            label="Discipline"
            value={discipline}
            onChange={setDiscipline}
            options={[
              { value: "all", label: "All" },
              { value: "Singles", label: "Singles" },
              { value: "Doubles", label: "Doubles" },
              { value: "Mixed", label: "Mixed" },
            ]}
          />
          <Select
            label="Ranking"
            value={range}
            onChange={setRange}
            options={[
              { value: "all", label: "Everyone" },
              { value: "10", label: "Top 10" },
              { value: "25", label: "Top 25" },
              { value: "50", label: "Top 50" },
            ]}
          />
          <Select
            label="Sort By"
            value={sort}
            onChange={setSort}
            options={[
              { value: "points", label: "WPR Points" },
              { value: "alpha", label: "Alphabetical" },
            ]}
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 border border-ppa-line bg-white px-4 py-12 text-center text-sm text-ppa-navy/55">
          No athletes match your search.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((a) => (
            <Link
              key={a.slug}
              href={`/athletes/${a.slug}`}
              className="group flex flex-col overflow-hidden border border-ppa-line bg-white"
            >
              <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-ppa-paper to-white">
                {a.headshot ? (
                  /* Consistent chest-up crop: square frame, anchored just
                     below the top so every headshot reads the same. */
                  <Image
                    src={a.headshot}
                    alt={a.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover object-[50%_18%] transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  /* Branded placeholder — "no picture until we have a good
                     picture" (Connor, 7/20). */
                  <span className="relative flex h-full w-full flex-col items-center justify-center gap-2 bg-ppa-navy">
                    <Image
                      src="/ppa/logos/ppa-horizontal-white.svg"
                      alt=""
                      width={1408}
                      height={149}
                      className="h-4 w-auto opacity-40"
                    />
                    <span className="font-display text-5xl text-white/25">
                      {initials(a.name)}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">
                      Photo Coming
                    </span>
                  </span>
                )}
                {a.rank > 0 && (
                  <span className="absolute left-2 top-2 bg-ppa-yellow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ppa-navy">
                    No. {a.rank}
                  </span>
                )}
                {a.countryCode && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://cdn.pickleball.com/circle-flags/${a.countryCode}.svg`}
                    alt={a.country}
                    className="absolute right-2 top-2 size-6 rounded-full ring-1 ring-white"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col border-t border-ppa-line p-3">
                <p className="font-display text-base uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                  {a.name}
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-blue">
                  {a.points > 0 ? `${a.points.toLocaleString()} WPR pts` : "Unranked"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
