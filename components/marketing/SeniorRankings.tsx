"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { matchesPlayerName } from "@/lib/ranking-filters";
import type { SeniorBoard } from "@/lib/senior-rankings";

/** Same CDN the pro boards and the athlete roster use. */
function flagUrl(cc: string): string {
  return `https://cdn.pickleball.com/circle-flags/${cc}.svg`;
}

/**
 * Humana Senior Open standings — one board at a time, searchable by name.
 * Columns match what the tour publishes: rank, name, country, age, points.
 *
 * ⚠ NO HEADSHOTS, DELIBERATELY. These are six boards totalling ~540 rows, and
 * an avatar per row is exactly what made /rankings a 3.96 MB document with a
 * 14-second DOMContentLoaded on 8/1. The country flag is the only image, it is
 * a ~1 KB circle-flag SVG, and it is lazy — that single missing `loading` attr
 * was itself most of those 14 seconds.
 *
 * ⚠ Age renders as an em dash when the API sends -1. That is "unknown", not
 * young, and lib/senior-rankings.ts keeps those players on purpose — see the
 * note there before changing either half.
 */
export function SeniorRankings({ boards }: { boards: SeniorBoard[] }) {
  const [active, setActive] = useState(boards[0]?.key ?? "");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const board = boards.find((b) => b.key === active) ?? boards[0];

  const shown = useMemo(() => {
    if (!board) return [];
    const q = deferredQuery.trim();
    if (!q) return board.entries;
    return board.entries.filter((e) => matchesPlayerName(e.name, q));
  }, [board, deferredQuery]);

  // A name that isn't on THIS board is very often on another one — a doubles
  // specialist while the singles tab is open. Same dead-end fix as /leaderboards.
  const elsewhere = useMemo(() => {
    const q = deferredQuery.trim();
    if (!q || shown.length > 0) return [];
    return boards
      .filter((b) => b.key !== active)
      .map((b) => ({
        key: b.key,
        label: b.label,
        count: b.entries.filter((e) => matchesPlayerName(e.name, q)).length,
      }))
      .filter((b) => b.count > 0);
  }, [boards, active, deferredQuery, shown.length]);

  if (!board) return null;

  return (
    <div className="mt-6">
      <div role="tablist" aria-label="Senior division" className="flex flex-wrap gap-1.5">
        {boards.map((b) => {
          const on = b.key === board.key;
          return (
            <button
              key={b.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(b.key)}
              className={`h-9 px-3 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                on
                  ? "bg-ppa-blue text-white"
                  : "border border-ppa-line bg-white text-ppa-navy/60 hover:border-ppa-blue hover:text-ppa-blue"
              }`}
            >
              <span className="sm:hidden">{b.short}</span>
              <span className="hidden sm:inline">{b.label}</span>
            </button>
          );
        })}
      </div>

      <label className="mt-4 flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45">
          Search players
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search this board by name…"
          className="h-10 w-full max-w-sm border border-ppa-line bg-white px-3 text-base text-ppa-navy outline-none placeholder:text-ppa-navy/35 focus:border-ppa-blue sm:text-sm"
        />
      </label>

      <p
        aria-live="polite"
        className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45"
      >
        {shown.length === board.entries.length
          ? `${board.entries.length} ranked · ${board.label}`
          : `${shown.length} of ${board.entries.length} · ${board.label}`}
      </p>

      {shown.length === 0 ? (
        <div className="mt-3 border border-ppa-line bg-white px-4 py-12 text-center">
          <p className="text-sm text-ppa-navy/55">No players match that search.</p>
          {elsewhere.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {elsewhere.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setActive(b.key)}
                  className="border border-ppa-line px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ppa-blue hover:border-ppa-blue"
                >
                  {b.count} in {b.label} →
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Own scroll container so the page body never scrolls sideways. */
        <div className="mt-3 overflow-x-auto border border-ppa-line">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="bg-ppa-paper text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                <th className="border-b border-ppa-line px-4 py-2.5">Rank</th>
                <th className="border-b border-ppa-line px-4 py-2.5">Player</th>
                <th className="border-b border-ppa-line px-4 py-2.5">Country</th>
                <th className="border-b border-ppa-line px-4 py-2.5">Age</th>
                <th className="border-b border-ppa-line px-4 py-2.5 text-right">Points</th>
              </tr>
            </thead>
            {/**
             * ⚠ TWO KEYS, AND BOTH EARN THEIR PLACE.
             *
             * `key` on the tbody remounts the whole body when you switch board,
             * so no row can survive from the previous one no matter what.
             * `key` on the row is the player's uuid, because rank+name is NOT
             * unique — Women's Doubles has two different players called Tia
             * Wood tied at rank 53. That collision is what made both mixed
             * boards render a phantom "53T Tia Wood" at the top with a row
             * count one higher than their own counter. See SeniorEntry.
             */}
            <tbody key={board.key}>
              {shown.map((e) => (
                <tr key={e.playerUuid} className="text-sm">
                  <td className="whitespace-nowrap border-b border-ppa-line bg-ppa-paper px-4 py-2.5 font-display text-sm text-ppa-navy/70">
                    {e.rank}
                    {e.isTied && <span className="text-ppa-navy/35">T</span>}
                  </td>
                  <td className="border-b border-ppa-line px-4 py-2.5 font-semibold text-ppa-navy">
                    {e.name}
                  </td>
                  <td className="whitespace-nowrap border-b border-ppa-line px-4 py-2.5 text-ppa-navy/65">
                    <span className="flex items-center gap-2">
                      {e.countryCode && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={flagUrl(e.countryCode)}
                          alt=""
                          width={16}
                          height={16}
                          loading="lazy"
                          decoding="async"
                          className="size-4 shrink-0 rounded-full"
                        />
                      )}
                      <span className="text-xs">{e.country || "—"}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap border-b border-ppa-line px-4 py-2.5 text-ppa-navy/65">
                    {e.age ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-b border-ppa-line px-4 py-2.5 text-right font-semibold text-ppa-navy">
                    {e.points.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
