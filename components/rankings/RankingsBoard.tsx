"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import type { RankingDivision } from "@/lib/rankings-api";
import {
  isFiltering,
  matchesPlayerName,
  playerRegion,
  REGION_OPTIONS,
  type RegionFilter,
} from "@/lib/ranking-filters";
import { RankingTable } from "./RankingTable";

/**
 * The World Pickleball Rankings board.
 *
 * Bryce 7/28: desktop had too much dead space left-to-right with one board at
 * a time, so from `lg` up BOTH boards render side by side (men's left, women's
 * right) and the gender toggle is hidden. Below `lg` the toggle stays and only
 * the active board renders. One render tree, CSS decides — no duplicate DOM.
 *
 * `filterable` adds the name search + region filter. It is OPT-IN because this
 * component also renders the top-10 modules on the homepage and /athletes,
 * where a search box over ten rows would be noise. Only the full boards on
 * /rankings pass it.
 */
export function RankingsBoard({
  divisions,
  filterable = false,
}: {
  divisions: RankingDivision[];
  filterable?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionFilter>("all");
  const searchId = useId();
  const regionId = useId();

  /**
   * ⚠ `useDeferredValue`, not the raw query, is what the list reads.
   *
   * The unfiltered board is ~2,075 rows / 18,646 DOM nodes, so re-rendering it
   * synchronously on every keystroke drops frames in the input itself. Deferring
   * lets React keep the field responsive and interrupt the stale list render.
   * Keep this if you touch the filtering — the input must never wait on the board.
   */
  const deferredQuery = useDeferredValue(query);
  const filtering = filterable && isFiltering(deferredQuery, region);

  const shown = useMemo(() => {
    if (!filtering) return divisions;
    const q = deferredQuery.trim();
    return divisions.map((d) => ({
      ...d,
      entries: d.entries.filter(
        (e) =>
          matchesPlayerName(e.name, q) &&
          (region === "all" || playerRegion(e.countryCode) === region),
      ),
    }));
  }, [divisions, filtering, deferredQuery, region]);

  const totalMatches = shown.reduce((n, d) => n + d.entries.length, 0);
  /** Is this a full board (so counts mean something) or a top-10 module? */
  const isFullBoard = divisions.some((d) => d.entries.length > 10);
  /** The list is showing stale rows while React catches up on a big filter. */
  const pending = query !== deferredQuery;

  function reset() {
    setQuery("");
    setRegion("all");
  }

  return (
    <div>
      {filterable && (
        <div className="mb-6 border border-white/10 bg-ppa-navy-deep p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <label htmlFor={searchId} className="sr-only">
                Search players by name
              </label>
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40"
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
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any ranked player by name…"
                autoComplete="off"
                className="h-10 w-full border border-white/20 bg-ppa-navy pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-ppa-sky"
              />
            </div>

            <div className="shrink-0">
              <label htmlFor={regionId} className="sr-only">
                Filter by region
              </label>
              <select
                id={regionId}
                value={region}
                onChange={(e) => setRegion(e.target.value as RegionFilter)}
                className="h-10 w-full border border-white/20 bg-ppa-navy px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white outline-none focus:border-ppa-sky sm:w-auto"
              >
                {REGION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-ppa-navy text-white">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result count + reset. `aria-live` so a screen reader hears the
              board change — the rows themselves are far off-screen. */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p
              aria-live="polite"
              className={`text-[11px] font-bold uppercase tracking-[0.12em] transition-opacity ${
                pending ? "text-white/30" : "text-white/45"
              }`}
            >
              {filtering
                ? `${totalMatches.toLocaleString()} ${totalMatches === 1 ? "player" : "players"} match`
                : isFullBoard
                  ? `${divisions
                      .reduce((n, d) => n + d.entries.length, 0)
                      .toLocaleString()} ranked players`
                  : ""}
            </p>
            {filtering && (
              <button
                type="button"
                onClick={reset}
                className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-sky underline-offset-4 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Gender tabs — mobile/tablet only; desktop shows both boards. */}
      <div className="flex gap-1 lg:hidden">
        {shown.map((d, i) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
              i === active
                ? "bg-white text-ppa-navy"
                : "border border-white/20 text-white/60 hover:text-white"
            }`}
          >
            {d.short}
            {/* While filtering, the count is the whole point of the tab: only
                one board is visible on mobile, so without it a search that
                matches a woman looks like "no results" to someone sitting on
                the men's board. */}
            {(filtering || d.entries.length > 10) && (
              <span className="ml-1.5 opacity-60">· {d.entries.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-8">
        {shown.map((d, i) => (
          <div key={d.key} className={i === active ? "block" : "hidden lg:block"}>
            {/* Column heading stands in for the toggle on desktop. */}
            <div className="mb-3 hidden items-baseline justify-between border-b border-white/10 pb-2 lg:flex">
              <h3 className="font-display text-lg uppercase leading-none text-white">
                {d.label}
              </h3>
              {/* Count only on the full boards — the homepage module shows a
                  top-10 slice, where "10 ranked" would read as the whole field.
                  While filtering it reads "3 of 1,324" so the board never
                  pretends the filtered set is the whole field. */}
              {divisions[i].entries.length > 10 && (
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                  {filtering
                    ? `${d.entries.length.toLocaleString()} of ${divisions[i].entries.length.toLocaleString()}`
                    : `${d.entries.length.toLocaleString()} ranked`}
                </span>
              )}
            </div>
            {d.entries.length > 0 ? (
              <RankingTable entries={d.entries} />
            ) : (
              <NoMatches
                label={d.label}
                other={shown.find((o, oi) => oi !== i && o.entries.length > 0)}
                onSwitch={() => setActive(shown.findIndex((o) => o.entries.length > 0))}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Empty state for one board while filtering. If the OTHER board has matches it
 * says so and offers the switch — on mobile only one board is on screen, so
 * "no players match" on its own would be a dead end for a correct search.
 */
function NoMatches({
  label,
  other,
  onSwitch,
}: {
  label: string;
  other: RankingDivision | undefined;
  onSwitch: () => void;
}) {
  return (
    <div className="border border-white/10 px-4 py-10 text-center">
      <p className="text-sm text-white/55">
        No players in {label} match.
      </p>
      {other && (
        <button
          type="button"
          onClick={onSwitch}
          className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-sky underline-offset-4 hover:underline lg:hidden"
        >
          {other.entries.length} {other.entries.length === 1 ? "match" : "matches"} in{" "}
          {other.label} →
        </button>
      )}
    </div>
  );
}
