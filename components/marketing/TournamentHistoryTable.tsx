"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { matchesPlayerName } from "@/lib/ranking-filters";
import type { HistoryEvent } from "@/lib/tournament-history";

/**
 * The tournament-history browser: one division at a time, filterable by season
 * and searchable by event or player. Mirrors how the tour publishes the record
 * (a table per division) rather than inventing a new shape for it.
 *
 * ⚠ NO MEDAL TERMINOLOGY. Hannah's 7/28 ruling drops gold/silver/bronze across
 * the site, so the columns read Champion / Runner-Up / Third even though the
 * source calls them Gold/Silver/Bronze. Recent stops legitimately have no third
 * place — the tour dropped the third-place match (Connor Pardoe, 8/3: "we are
 * just getting rid of the 3rd, both teams get paid for 4th") — which is why an
 * empty Third cell is normal and renders as a dash, not as missing data.
 */

const DIVISIONS = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
] as const;

type Division = (typeof DIVISIONS)[number];

/** Short labels so five tabs fit a 390px screen without a scroll rail. */
const SHORT: Record<Division, string> = {
  "Men's Singles": "M Singles",
  "Women's Singles": "W Singles",
  "Men's Doubles": "M Doubles",
  "Women's Doubles": "W Doubles",
  "Mixed Doubles": "Mixed",
};

/** "2026-05-10" -> "May 10, 2026". Parsed as text: no Date, so no timezone can
 *  roll the day back (same reason lib/event-code.ts parses dates as strings). */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const month = MONTHS[Number(m) - 1];
  return month ? `${month} ${Number(d)}, ${y}` : iso;
}

type Row = {
  key: string;
  endDate: string;
  name: string;
  champion: string;
  runnerUp: string;
  third: string;
  resultsUrl?: string;
  note?: string;
};

export function TournamentHistoryTable({ events }: { events: HistoryEvent[] }) {
  const [division, setDivision] = useState<Division>("Men's Doubles");
  const [season, setSeason] = useState("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const seasons = useMemo(
    () => [...new Set(events.map((e) => e.endDate.slice(0, 4)))].sort((a, b) => b.localeCompare(a)),
    [events],
  );

  // Every row for the chosen division, newest finals first.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const e of events) {
      const d = e.divisions.find((x) => x.division === division);
      if (!d) continue;
      out.push({
        key: `${e.endDate}-${e.name}`,
        endDate: e.endDate,
        name: e.name,
        champion: d.champion,
        runnerUp: d.runnerUp,
        third: d.third,
        resultsUrl: e.resultsUrl,
        note: e.note,
      });
    }
    return out;
  }, [events, division]);

  // Search folds accents and punctuation via the same helper the rankings boards
  // use, so "martinez vich" finds Jaume Martínez Vich in a champions list.
  const shown = useMemo(
    () =>
      rows.filter((r) => {
        if (season !== "all" && !r.endDate.startsWith(season)) return false;
        return matchesPlayerName(`${r.name} ${r.champion} ${r.runnerUp} ${r.third}`, deferredQuery);
      }),
    [rows, season, deferredQuery],
  );

  // A search that hits nothing in THIS division very often hits another one —
  // a fan looking up a singles specialist while the doubles tab is open. Say so
  // instead of showing an empty table (same reasoning as the /leaderboards
  // wrong-board dead end).
  const elsewhere = useMemo(() => {
    if (!deferredQuery.trim() || shown.length > 0) return [];
    return DIVISIONS.filter((d) => d !== division)
      .map((d) => ({
        division: d,
        count: events.filter((e) => {
          const row = e.divisions.find((x) => x.division === d);
          if (!row) return false;
          if (season !== "all" && !e.endDate.startsWith(season)) return false;
          return matchesPlayerName(
            `${e.name} ${row.champion} ${row.runnerUp} ${row.third}`,
            deferredQuery,
          );
        }).length,
      }))
      .filter((x) => x.count > 0);
  }, [events, division, season, deferredQuery, shown.length]);

  return (
    <div className="mt-6">
      {/* Division tabs */}
      <div
        role="tablist"
        aria-label="Division"
        className="flex flex-wrap gap-1.5 border-b border-ppa-line pb-3"
      >
        {DIVISIONS.map((d) => {
          const active = d === division;
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setDivision(d)}
              className={`h-9 px-3 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                active
                  ? "bg-ppa-blue text-white"
                  : "border border-ppa-line bg-white text-ppa-navy/60 hover:border-ppa-blue hover:text-ppa-blue"
              }`}
            >
              <span className="sm:hidden">{SHORT[d]}</span>
              <span className="hidden sm:inline">{d}</span>
            </button>
          );
        })}
      </div>

      {/* Season + search */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45">
            Search event or player
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ben Johns, Mesa Cup, Nationals…"
            className="h-10 w-full border border-ppa-line bg-white px-3 text-base text-ppa-navy outline-none placeholder:text-ppa-navy/35 focus:border-ppa-blue sm:text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45">
            Season
          </span>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="h-10 border border-ppa-line bg-white px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-ppa-navy outline-none focus:border-ppa-blue"
          >
            <option value="all">All Seasons</option>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p
        aria-live="polite"
        className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45"
      >
        {shown.length} {shown.length === 1 ? "tournament" : "tournaments"} · {division}
        {season !== "all" && ` · ${season}`}
      </p>

      {shown.length === 0 ? (
        <div className="mt-4 border border-ppa-line bg-white px-4 py-12 text-center">
          <p className="text-sm text-ppa-navy/55">No tournaments match that search.</p>
          {elsewhere.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {elsewhere.map((x) => (
                <button
                  key={x.division}
                  type="button"
                  onClick={() => setDivision(x.division)}
                  className="border border-ppa-line px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ppa-blue hover:border-ppa-blue"
                >
                  {x.count} in {x.division} →
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Own scroll container so the page body never scrolls sideways. */
        <div className="mt-4 overflow-x-auto border border-ppa-line">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="bg-ppa-paper text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                <th className="border-b border-ppa-line px-4 py-2.5">Finals</th>
                <th className="border-b border-ppa-line px-4 py-2.5">Tournament</th>
                <th className="border-b border-ppa-line px-4 py-2.5">Champion</th>
                <th className="border-b border-ppa-line px-4 py-2.5">Runner-Up</th>
                <th className="border-b border-ppa-line px-4 py-2.5">Third</th>
                <th className="border-b border-ppa-line px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.key} className="text-sm align-top">
                  <td className="whitespace-nowrap border-b border-ppa-line bg-ppa-paper px-4 py-3 text-xs font-bold uppercase tracking-[0.06em] text-ppa-navy/55">
                    {formatDate(r.endDate)}
                  </td>
                  <td className="border-b border-ppa-line px-4 py-3 font-semibold text-ppa-navy">
                    {r.name}
                    {r.note && (
                      <span className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ppa-navy/40">
                        ({r.note})
                      </span>
                    )}
                  </td>
                  <td className="border-b border-ppa-line px-4 py-3 font-semibold text-ppa-navy">
                    {r.champion}
                  </td>
                  <td className="border-b border-ppa-line px-4 py-3 text-ppa-navy/70">
                    {r.runnerUp || "—"}
                  </td>
                  <td className="border-b border-ppa-line px-4 py-3 text-ppa-navy/70">
                    {r.third || "—"}
                  </td>
                  <td className="whitespace-nowrap border-b border-ppa-line px-4 py-3">
                    {r.resultsUrl && (
                      <a
                        href={r.resultsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold uppercase tracking-[0.1em] text-ppa-blue hover:text-ppa-blue-deep"
                      >
                        Results ↗
                      </a>
                    )}
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
