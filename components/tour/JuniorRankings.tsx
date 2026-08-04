"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { matchesPlayerName } from "@/lib/ranking-filters";
import raw from "@/lib/data/junior-rankings.json";

/**
 * Junior PPA rankings board.
 *
 * ⚠ STATIC SNAPSHOT, and it says so on the page. Scraped from
 * ppatour.com/junior-ppa-tour/ on 8/4 (the board's own "Last Updated" is
 * 19 May 2026, which is what renders — never today's date). There is no junior
 * rankings feed yet; when one lands, replace the JSON import and delete the
 * dated caption. The date is shown precisely so staleness is visible rather
 * than implied-fresh.
 *
 * ⚠ ONLY THE SELECTED DIVISION IS RENDERED. All 24 divisions are 2,207 rows;
 * the 8/1 audit is why that matters — /rankings put its whole board in one
 * document and cost 18,646 DOM nodes. The data is only 61 KB so it all ships,
 * but the DOM never holds more than one division, capped (see PREVIEW_ROWS).
 */

type Row = [rank: number, name: string, points: number, age: number];
type Division = { label: string; rows: Row[] };

const DATA = raw as { updated: string; source: string; divisions: Division[] };

/**
 * Controls are gender × type × age (Wesley, 8/4) rather than one long list of
 * 24 division buttons.
 *
 * ⚠ This assumes a COMPLETE 2 × 3 × 4 grid, and that is verified, not hoped:
 * all 24 combinations exist in the snapshot with no gaps, so no selection can
 * land on a missing division. `divisionFor` still falls back rather than
 * throwing, in case a future feed is sparser than this snapshot.
 */
const GENDERS = ["Boys", "Girls"] as const;
const AGES = ["12U", "14U", "16U", "18U"] as const;

/** Display label -> the label used in the data. */
const TYPES = [
  { label: "Singles", data: "Singles" },
  { label: "Doubles", data: "Doubles" },
  { label: "Mixed", data: "Mixed Doubles" },
] as const;

type Gender = (typeof GENDERS)[number];
type Age = (typeof AGES)[number];
type TypeKey = (typeof TYPES)[number]["data"];

const byLabel = new Map(DATA.divisions.map((d) => [d.label, d]));

function divisionFor(gender: Gender, type: TypeKey, age: Age): Division | undefined {
  return byLabel.get(`${gender} ${type} ${age}`);
}

/**
 * ⚠ The board is CAPPED by default, and that is why the rest of the page is
 * reachable. Boys Doubles 16U alone is 196 rows; rendered in full the board ran
 * ~7,000px and buried How to Compete, How to Register, the Finals champions,
 * Sportsmanship, Serves and the handbook underneath it. Same fault Wesley
 * called out on /rankings on 8/3, and his own answer applies: nobody finds a
 * junior by scrolling 196 rows, they search.
 */
const PREVIEW_ROWS = 25;

const selectClass =
  "w-full appearance-none border border-ppa-line bg-white px-3 py-2 pr-9 text-sm font-semibold text-ppa-navy outline-none focus:border-ppa-blue";

/**
 * `appearance-none` + our own chevron, so the two dropdowns look the same in
 * every browser instead of inheriting three different native arrows. The
 * chevron is `aria-hidden` and `pointer-events-none` — it's decoration sitting
 * on top of a real <select>, so keyboard and screen-reader behaviour is
 * untouched.
 */
function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0">
      <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/50">
        {label}
      </span>
      <span className="relative mt-1.5 block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={selectClass}
        >
          {children}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-ppa-navy/45"
        >
          ▾
        </span>
      </span>
    </label>
  );
}

export function JuniorRankings() {
  const [gender, setGender] = useState<Gender>("Boys");
  const [type, setType] = useState<TypeKey>("Singles");
  const [age, setAge] = useState<Age>("18U");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const deferred = useDeferredValue(query);

  const active = divisionFor(gender, type, age) ?? DATA.divisions[0];

  /** Drive all three controls from a division label (used by the empty state). */
  function selectDivision(label: string) {
    const m = label.match(/^(Boys|Girls) (Mixed Doubles|Doubles|Singles) (\d+U)$/);
    if (!m) return;
    setGender(m[1] as Gender);
    setType(m[2] as TypeKey);
    setAge(m[3] as Age);
  }

  const rows = useMemo(
    () => (active?.rows ?? []).filter((r) => matchesPlayerName(r[1], deferred)),
    [active, deferred],
  );

  /**
   * ⚠ Wrong-division dead end — the likeliest zero-result on this board, and
   * the same fault handled on /rankings on 8/3. There are 24 divisions and the
   * search persists when you change one, so a player who searches their own
   * name from the default (Boys Singles 18U) sees "no results" even though
   * they're ranked in Girls Doubles 14U. Without this, a CORRECT search reads
   * as a failure. Only computed when the current division came up empty.
   */
  const elsewhere = useMemo(() => {
    if (deferred.trim() === "" || rows.length > 0) return [];
    return DATA.divisions
      .filter((d) => d !== active)
      .map((d) => ({
        division: d,
        hits: d.rows.filter((r) => matchesPlayerName(r[1], deferred)).length,
      }))
      .filter((x) => x.hits > 0)
      .slice(0, 4);
  }, [active, deferred, rows.length]);

  const total = active?.rows.length ?? 0;
  // A search always shows everything it matched — capping filtered results
  // would mean a player searches their own name and still can't find it.
  const searching = deferred.trim() !== "";
  const visible = showAll || searching ? rows : rows.slice(0, PREVIEW_ROWS);
  const hidden = rows.length - visible.length;

  return (
    <div>
      {/* Gender + type */}
      <div className="grid gap-3 sm:max-w-md sm:grid-cols-2">
        <Select
          label="Gender"
          value={gender}
          onChange={(v) => setGender(v as Gender)}
        >
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>

        <Select label="Type" value={type} onChange={(v) => setType(v as TypeKey)}>
          {TYPES.map((t) => (
            <option key={t.data} value={t.data}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Age */}
      <div className="mt-4">
        <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/50">
          Age group
        </span>
        <div
          role="group"
          aria-label="Age group"
          className="mt-1.5 flex min-w-0 flex-wrap gap-2"
        >
          {AGES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAge(a)}
              aria-pressed={age === a}
              className={`border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                age === a
                  ? "border-ppa-blue bg-ppa-blue text-white"
                  : "border-ppa-line bg-white text-ppa-navy hover:border-ppa-blue hover:text-ppa-blue"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Search + count */}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-ppa-line pt-5">
        <label className="min-w-0 flex-1 sm:max-w-xs">
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

      {/* Board */}
      <div className="mt-4 overflow-x-auto border border-ppa-line">
        <table className="w-full min-w-96 border-collapse text-left">
          <caption className="sr-only">
            {active?.label} Junior PPA rankings, last updated {DATA.updated}
          </caption>
          <thead>
            <tr className="bg-ppa-paper text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
              <th scope="col" className="px-4 py-2.5 font-bold">Rank</th>
              <th scope="col" className="px-4 py-2.5 font-bold">Player</th>
              <th scope="col" className="px-4 py-2.5 text-right font-bold">Points</th>
              <th scope="col" className="px-4 py-2.5 text-right font-bold">Age</th>
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
                <td className="px-4 py-2 text-right text-sm text-ppa-navy/50 tabular-nums">
                  {r[3]}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr className="border-t border-ppa-line bg-white">
                <td colSpan={4} className="px-4 py-8 text-center">
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
                            onClick={() => selectDivision(division.label)}
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
          className="mt-3 inline-flex h-10 items-center border border-ppa-line bg-white px-5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
        >
          Show all {total.toLocaleString()} in {active?.label} →
        </button>
      )}
      {showAll && !searching && total > PREVIEW_ROWS && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="mt-3 inline-flex h-10 items-center border border-ppa-line bg-white px-5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
        >
          Show top {PREVIEW_ROWS} only
        </button>
      )}
    </div>
  );
}
