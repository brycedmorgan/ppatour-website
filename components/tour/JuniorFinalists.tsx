"use client";

import { useState } from "react";

/**
 * Junior PPA Finals champions, selectable by year.
 *
 * Daniela Almendarez, 9/3: "If there is a way to make the Finalists like the
 * rankings where you can select by year, that would be great." So this mirrors
 * the control on JuniorRankings — a real <select>, same `selectClass` metrics —
 * rather than inventing a second idiom two sections apart on the same page.
 *
 * ⚠ IT REPLACES STACKED YEAR HEADINGS, WHICH IS THE POINT. The page used to
 * print "2025 Champions" then "2024 Champions" one after the other, so every
 * season ever run is on screen at once and the page grows by ~12 rows a year.
 * A selector keeps it one season tall.
 *
 * ⚠ NEWEST YEAR FIRST, AND THE DEFAULT IS THE NEWEST — never a hardcoded year.
 * A hardcoded default silently shows a stale season the moment a new one lands.
 *
 * ⚠ NO PHOTOS HERE YET, DELIBERATELY. Daniela also asked for the finalists'
 * photos back ("If not, no worries"), and that needs a named photo per player —
 * these are minors, and this repo's rule against deciding who is in a picture
 * (the athlete-hero attribution rules) applies with more force, not less, to
 * children. When per-player files arrive keyed by name, add them; do not crop
 * faces out of a group shot to fill the gap.
 */

export type FinalsYear = {
  /** Display label for the option, e.g. "2025". */
  year: string;
  /** [division, champion] — champion may be a doubles pair, "A & B". */
  rows: string[][];
};

const selectClass =
  "h-10 w-full min-w-0 appearance-none border border-ppa-line bg-white px-3 pr-8 text-sm font-semibold text-ppa-navy outline-none focus-visible:border-ppa-blue";

export function JuniorFinalists({ seasons }: { seasons: FinalsYear[] }) {
  const [year, setYear] = useState(seasons[0]?.year ?? "");
  const active = seasons.find((s) => s.year === year) ?? seasons[0];

  if (!active) return null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <label
            htmlFor="junior-finals-year"
            className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45"
          >
            Season
          </label>
          <div className="relative mt-1.5 w-40">
            <select
              id="junior-finals-year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={selectClass}
            >
              {seasons.map((s) => (
                <option key={s.year} value={s.year}>
                  {`${s.year} Champions`}
                </option>
              ))}
            </select>
            <span
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ppa-navy/45"
            >
              ▾
            </span>
          </div>
        </div>
        <p
          aria-live="polite"
          className="text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45"
        >
          {active.rows.length} champions
        </p>
      </div>

      <ul className="mt-4 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2 lg:grid-cols-3">
        {active.rows.map(([division, champion]) => (
          <li key={`${division}-${champion}`} className="min-w-0 bg-white p-4">
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
              {division}
            </span>
            <span className="mt-1 block text-sm font-semibold text-ppa-navy">
              {champion}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
