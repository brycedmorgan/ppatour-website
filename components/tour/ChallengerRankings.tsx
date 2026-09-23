"use client";

import { useDeferredValue, useMemo, useState } from "react";
import DATA from "@/lib/data/challenger-rankings.json";
import { matchesPlayerName } from "@/lib/ranking-filters";

/**
 * PPA Challenger Series rankings — five divisions, one board each.
 *
 * ⚠ THE DATA IS A SNAPSHOT, NOT A FEED. `lib/data/challenger-rankings.json` is
 * the event team's own points workbook — the Google Sheet "(UPDATED) CHALLENGER
 * TOUR POINTS 2026 SEASON" (Jacob Guidry), sent by Amie Feliza through the
 * website request form on 2026-09-22. Nothing refreshes it. The date it carries
 * is printed on the page so nobody reads a stale board as current, and updating
 * it means replacing the JSON. A live source is still the open question in
 * docs/CHALLENGER.md §7 — `partner_rankings` has no confirmed Challenger scope.
 *
 * ⚠ IT SUPERSEDES THE SCRAPE, AND THE TWO DISAGREE BY MORE THAN A WEEK'S PLAY.
 * The first snapshot (2026-09-18) was five hand-typed TablePress tables read off
 * ppachallenger.com, "Last Updated: July 27th, 2026". This one is the workbook
 * those tables were typed from, eight weeks later, so names move in both
 * directions: the rankings run on a 52-week window, and players who sign with
 * the Tour come off the board entirely. Do not reconcile a missing player
 * against the old file — it is not a more complete list, it is an older one.
 *
 * ⚠ RANKS ARE COMPETITION-RANKED AND CAN REPEAT. Men's Doubles ties at No. 1
 * (both on 475), so the board reads 1, 1, 3. The row key is rank + name for
 * exactly that reason; keying on rank alone would drop one of them.
 *
 * Same controls as JuniorRankings (division picker, name search, top-25
 * preview, "found in other divisions" for the wrong-board dead end), rows are
 * [rank, name, points].
 */

type Row = [rank: number, name: string, points: number];
type Division = { label: string; rows: Row[] };

const PREVIEW_ROWS = 25;
const DIVISIONS = (DATA as unknown as { divisions: Division[] }).divisions;
const UPDATED = (DATA as { updated: string }).updated;

const selectClass =
  "mt-1.5 w-full appearance-none border border-ppa-line bg-white py-2 pl-3 pr-9 text-sm text-ppa-navy outline-none focus:border-ppa-blue";

export function ChallengerRankings() {
  const [label, setLabel] = useState<string>(DIVISIONS[0]?.label ?? "");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const deferred = useDeferredValue(query);

  const active = DIVISIONS.find((d) => d.label === label) ?? DIVISIONS[0];

  const rows = useMemo(
    () => (active?.rows ?? []).filter((r) => matchesPlayerName(r[1], deferred)),
    [active, deferred],
  );

  const elsewhere = useMemo(() => {
    if (deferred.trim() === "" || rows.length > 0) return [];
    return DIVISIONS.filter((d) => d !== active)
      .map((d) => ({
        division: d,
        hits: d.rows.filter((r) => matchesPlayerName(r[1], deferred)).length,
      }))
      .filter((x) => x.hits > 0);
  }, [active, deferred, rows.length]);

  const total = active?.rows.length ?? 0;
  const searching = deferred.trim() !== "";
  const visible = showAll || searching ? rows : rows.slice(0, PREVIEW_ROWS);
  const hidden = rows.length - visible.length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block w-full sm:max-w-xs">
          <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/50">
            Division
          </span>
          <span className="relative block">
            <select
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setShowAll(false);
              }}
              className={selectClass}
            >
              {DIVISIONS.map((d) => (
                <option key={d.label} value={d.label}>
                  {d.label}
                </option>
              ))}
            </select>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-ppa-navy/45"
            >
              ▾
            </span>
          </span>
        </label>
        <label className="block w-full sm:max-w-xs">
          <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/50">
            Search {active?.label}
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Player name"
            className="mt-1.5 w-full border border-ppa-line bg-white px-3 py-2 text-sm text-ppa-navy outline-none placeholder:text-ppa-navy/35 focus:border-ppa-blue"
          />
        </label>
        <p aria-live="polite" className="text-xs text-ppa-navy/55">
          {searching
            ? `${rows.length.toLocaleString()} of ${total.toLocaleString()} players`
            : showAll
              ? `All ${total.toLocaleString()} players`
              : `Top ${Math.min(PREVIEW_ROWS, total)} of ${total.toLocaleString()} players`}
        </p>
      </div>

      <div className="mt-4 overflow-x-auto border border-ppa-line">
        <table className="w-full min-w-80 border-collapse text-left">
          <caption className="sr-only">
            {active?.label} PPA Challenger Series rankings, last updated {UPDATED}
          </caption>
          <thead>
            <tr className="bg-ppa-paper text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
              <th scope="col" className="px-4 py-2.5 font-bold">Rank</th>
              <th scope="col" className="px-4 py-2.5 font-bold">Player</th>
              <th scope="col" className="px-4 py-2.5 text-right font-bold">Points</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={`${r[0]}-${r[1]}`} className="border-t border-ppa-line bg-white">
                <td className="px-4 py-2 font-display text-sm text-ppa-navy/45 tabular-nums">
                  {r[0]}
                </td>
                <th scope="row" className="px-4 py-2 text-sm font-semibold text-ppa-navy">
                  {r[1]}
                </th>
                <td className="px-4 py-2 text-right text-sm text-ppa-navy/70 tabular-nums">
                  {r[2].toLocaleString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr className="border-t border-ppa-line bg-white">
                <td colSpan={3} className="px-4 py-8 text-center">
                  <span className="block text-sm text-ppa-navy/55">
                    No players in {active?.label} match &ldquo;{query}&rdquo;.
                  </span>
                  {elsewhere.length > 0 && (
                    <>
                      <span className="mt-3 block text-xs font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                        Found in other divisions
                      </span>
                      <span className="mt-2 flex flex-wrap justify-center gap-2">
                        {elsewhere.map(({ division, hits }) => (
                          <button
                            key={division.label}
                            type="button"
                            onClick={() => setLabel(division.label)}
                            className="border border-ppa-line bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
                          >
                            {division.label} · {hits} →
                          </button>
                        ))}
                      </span>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-4 inline-flex h-10 items-center border border-ppa-line bg-white px-5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
        >
          Show all {total.toLocaleString()} players
        </button>
      )}
      <p className="mt-3 text-xs text-ppa-navy/45">
        Last updated {UPDATED}. Rankings update after each Challenger event.
      </p>
    </div>
  );
}
