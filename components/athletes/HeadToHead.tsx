"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DivisionKind } from "@/lib/career-stats";
import type { H2hRecord, H2hRow } from "@/lib/pb-player-stats";

/**
 * Head-to-Head on the athlete profile (Wesley, 11/12): their career record
 * against every opponent, from the same pickleball.com stats call as the Stats
 * band (lib/pb-player-stats `h2h`), so it adds no upstream request.
 *
 * Division tabs + an opponent search; the ten most-played opponents show
 * first, "Show all" lists the rest. Opponent names link to our profile only
 * when the name maps to exactly one published pro (lib/player-match).
 *
 * ⚠ No ratings (Connor, 7/29) and no medal words (Hannah, 7/28): "Finals".
 */
type Kind = "all" | DivisionKind;
const LABEL: Record<Kind, string> = { all: "All", doubles: "Doubles", mixed: "Mixed", singles: "Singles" };
const ORDER: Kind[] = ["all", "doubles", "mixed", "singles"];
const TOP = 10;

const fold = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const pctOf = (w: number, l: number) => (w + l ? `${Math.round((100 * w) / (w + l))}%` : "—");
const rec = (w: number, l: number) => (w + l ? `${w}–${l}` : "—");

export function HeadToHead({ name, rows, base }: { name: string; rows: H2hRow[]; base: string }) {
  const kinds = useMemo(() => ORDER.filter((k) => k === "all" || rows.some((r) => r.rec[k])), [rows]);
  const [kind, setKind] = useState<Kind>("all");
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);

  const list = useMemo(() => {
    const words = fold(query).split(/\s+/).filter(Boolean);
    // ⚠ Names repeat (two pickleball.com records can share a name, e.g. Lauren
    // Stratman for ALW), so rows are keyed by their position in `rows`, not name.
    return rows
      .map((r, id) => ({ r, id, x: r.rec[kind] }))
      .filter((v): v is { r: H2hRow; id: number; x: H2hRecord } =>
        Boolean(v.x) && words.every((w) => fold(v.r.name).includes(w)),
      )
      .sort((a, b) => b.x[0] + b.x[1] - (a.x[0] + a.x[1]) || a.r.name.localeCompare(b.r.name));
  }, [rows, kind, query]);
  if (!rows.length) return null;

  const q = query.trim();
  // A search shows every match; otherwise the top ten until "Show all".
  const shown = q || all ? list : list.slice(0, TOP);
  const first = name.split(" ")[0];

  return (
    <section id="head-to-head" className="scroll-mt-24 border-t border-ppa-line bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Rivalries</p>
        <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">Head-to-Head</h2>

        {/* Filters: division tabs + opponent search. */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Division" className="flex self-start border border-ppa-line">
            {kinds.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={kind === k}
                onClick={() => setKind(k)}
                className={`h-9 px-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors sm:px-4 ${
                  kind === k ? "bg-ppa-navy text-white" : "text-ppa-navy/60 hover:bg-ppa-paper hover:text-ppa-navy"
                }`}
              >
                {LABEL[k]}
              </button>
            ))}
          </div>
          <label className="relative min-w-0 sm:w-72">
            <span className="sr-only">Search opponents</span>
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ppa-navy/40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m13 13 4 4" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search opponents"
              className="h-9 w-full min-w-0 border border-ppa-line bg-white pl-9 pr-3 text-[13px] text-ppa-navy placeholder:text-ppa-navy/40 focus:border-ppa-navy/50 focus:outline-none"
            />
          </label>
        </div>

        {list.length === 0 ? (
          <p className="mt-6 text-sm text-ppa-navy/60">
            No {kind === "all" ? "" : `${LABEL[kind].toLowerCase()} `}opponents{q ? ` matching “${q}”` : ""}.
          </p>
        ) : (
          <>
            {/* Column heads (sm and up). */}
            <div className="mt-5 hidden grid-cols-[minmax(0,1fr)_7rem_6rem_6rem] gap-3 border-b border-ppa-line pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45 sm:grid">
              <span>Opponent</span>
              <span>Matches</span>
              <span>Games</span>
              <span>Finals</span>
            </div>
            <ul className="mt-3 divide-y divide-ppa-line border-y border-ppa-line sm:mt-0 sm:border-t-0">
              {shown.map(({ r, id, x }) => {
                const [mw, ml, gw, gl, fw, fl] = x;
                const share = mw + ml ? (100 * mw) / (mw + ml) : 0;
                return (
                  <li
                    key={id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_6rem]"
                  >
                    <div className="min-w-0">
                      {r.slug ? (
                        <Link
                          href={`${base}/${r.slug}/`}
                          className="truncate text-[14px] font-semibold text-ppa-navy hover:underline"
                        >
                          {r.name}
                        </Link>
                      ) : (
                        <p className="truncate text-[14px] font-semibold text-ppa-navy">{r.name}</p>
                      )}
                      {/* Win share bar. */}
                      <div className="mt-1.5 h-1 w-full max-w-56 bg-ppa-line" aria-hidden>
                        <div className="h-1 bg-ppa-blue" style={{ width: `${share}%` }} />
                      </div>
                    </div>
                    <div className="text-right sm:text-left">
                      <p className="font-display text-xl leading-none text-ppa-navy">{rec(mw, ml)}</p>
                      <p className="mt-0.5 text-[11px] text-ppa-navy/50">{pctOf(mw, ml)} won</p>
                    </div>
                    <p className="col-span-2 text-[12px] text-ppa-navy/60 sm:col-span-1 sm:text-[13px] sm:text-ppa-navy">
                      <span className="sm:hidden">Games </span>
                      {rec(gw, gl)}
                      <span className="sm:hidden"> · Finals {rec(fw, fl)}</span>
                    </p>
                    <p className="hidden text-[13px] text-ppa-navy sm:block">{rec(fw, fl)}</p>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-ppa-navy/45">
                {q ? `${list.length} of ${rows.length}` : `${shown.length} of ${list.length}`}{" "}
                {(q ? rows.length : list.length) === 1 ? "opponent" : "opponents"}
              </p>
              {!q && list.length > TOP && (
                <button
                  type="button"
                  onClick={() => setAll((v) => !v)}
                  className="text-[12px] font-bold uppercase tracking-[0.12em] text-ppa-blue hover:underline"
                >
                  {all ? "Show top 10" : `Show all ${list.length}`}
                </button>
              )}
            </div>
          </>
        )}

        <p className="mt-6 max-w-3xl text-[11px] leading-relaxed text-ppa-navy/45">
          {first}&apos;s record against each opponent in PPA Tour pro events since 2020, from pickleball.com. In doubles
          and mixed, a match counts against both players on the other team. Finals are championship matches. Games
          show &ldquo;—&rdquo; where early results were recorded without scores.
        </p>
      </div>
    </section>
  );
}
