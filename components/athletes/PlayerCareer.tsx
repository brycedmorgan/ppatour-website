"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  careerStats,
  careerYears,
  pct,
  titlesByYear,
  wl,
  type CareerEvent,
  type KindFilter,
  type PlayerCareer as Career,
  type Split,
} from "@/lib/career-stats";
import { BoxScore, finishChipClass } from "@/components/athletes/BoxScore";
import { EventLogo, RecentResults, dateRange } from "@/components/athletes/RecentResults";

/**
 * The athlete profile's Stats and Tournament Results sections (Wesley, 11/9:
 * "a much more extensive statistics section… similar to pickleball.com", and
 * "a tournament results section with a dropdown of all the tournaments a
 * player has played in").
 *
 * One request to /api/player-career (lib/player-career, from the stored
 * career ledger); every filter is counted here (lib/career-stats), so
 * switching division or season costs nothing.
 *
 * Until the ledger has this pro (it backfills by cron), the old Recent
 * Results band renders instead, so the page never loses its results.
 *
 * ⚠ NO MEDAL WORDS OR COLOURS (Hannah, 7/28): Titles / Finals / Semifinals,
 * tour yellow for a title. ⚠ No ratings either (Connor, 7/29: no DUPR) —
 * "higher seed" stands in for pickleball.com's "higher rated team".
 */
const memo = new Map<string, Promise<Career | null>>();
function load(name: string): Promise<Career | null> {
  let p = memo.get(name);
  if (!p) {
    p = fetch(`/api/player-career/?name=${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Career | null) => (d && Array.isArray(d.events) ? d : null))
      .catch(() => null);
    memo.set(name, p);
    p.then((d) => {
      if (!d?.events.length) memo.delete(name);
    });
  }
  return p;
}

const KIND_LABEL: Record<KindFilter, string> = { all: "All", doubles: "Doubles", mixed: "Mixed", singles: "Singles" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthYear = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const n = (v: number) => v.toLocaleString("en-US");

export function PlayerCareer({ name }: { name: string }) {
  const [state, setState] = useState<{ name: string; data: Career | null } | null>(null);
  useEffect(() => {
    let alive = true;
    load(name).then((data) => alive && setState({ name, data }));
    return () => {
      alive = false;
    };
  }, [name]);

  if (!state || state.name !== name) return null;
  if (!state.data?.events.length) return <RecentResults name={name} variant="profile" />;
  return (
    <>
      <StatsBand name={name} career={state.data} />
      <TournamentResults name={name} career={state.data} />
    </>
  );
}

/* ───────────────────────────── Stats ───────────────────────────── */

function StatsBand({ name, career }: { name: string; career: Career }) {
  const kinds = useMemo(() => {
    const have = new Set(career.events.flatMap((e) => e.divisions.map((d) => d.kind)));
    return (["all", "doubles", "mixed", "singles"] as KindFilter[]).filter((k) => k === "all" || have.has(k));
  }, [career]);
  const years = useMemo(() => careerYears(career), [career]);
  const [kind, setKind] = useState<KindFilter>("all");
  const [period, setPeriod] = useState("career");

  const s = useMemo(() => careerStats(career, kind, period), [career, kind, period]);
  const byYear = useMemo(() => titlesByYear(career, kind), [career, kind]);
  const pointPct = s.points.w + s.points.l ? `${((100 * s.points.w) / (s.points.w + s.points.l)).toFixed(1)}%` : "—";

  const splits: { label: string; help: string; v: Split }[] = [
    { label: "Versus higher seed", help: "Matches against a better-seeded team", v: s.vsHigherSeed },
    { label: "Deciding games", help: "Matches that went to a third (or fifth) game", v: s.deciding },
    { label: "After winning the first game", help: "Match record after taking game one", v: s.afterWonFirst },
    { label: "After losing the first game", help: "Match record after dropping game one", v: s.afterLostFirst },
    { label: "Finals", help: "Record in championship matches", v: s.finals },
  ];

  return (
    <section id="stats" className="scroll-mt-24 bg-ppa-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">PPA Tour</p>
        <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">Stats</h2>

        {/* Filters: division tabs + season. */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Division" className="flex border border-ppa-line">
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
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/50">
            <span className="sr-only sm:not-sr-only">Season</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-9 border border-ppa-line bg-white px-3 text-[12px] font-semibold normal-case tracking-normal text-ppa-navy"
            >
              <option value="career">Career</option>
              <option value="12m">Last 12 months</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>

        {s.events === 0 ? (
          <p className="mt-6 text-sm text-ppa-navy/60">No {KIND_LABEL[kind].toLowerCase()} results in this period.</p>
        ) : (
          <>
            {/* Headline numbers. */}
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {(
                [
                  ["Win–Loss", wl(s.matches), `${pct(s.matches)} won`, "bg-ppa-blue"],
                  ["Titles", String(s.titles), `${s.runnerUp} finals · ${s.semis} semifinals`, "bg-ppa-yellow"],
                  [
                    "Longest win streak",
                    String(s.longestStreak),
                    s.current ? `Current: ${s.current.n} ${s.current.won ? "W" : "L"}` : "",
                    "bg-ppa-navy",
                  ],
                  ["Events", String(s.events), `${n(s.matches.w + s.matches.l)} matches`, "bg-ppa-line"],
                ] as const
              ).map(([label, value, sub, bar]) => (
                <div key={label} className="overflow-hidden border border-ppa-line bg-white">
                  <div className={`h-1.5 ${bar}`} />
                  <div className="px-4 py-4">
                    <p className="font-display text-3xl leading-none text-ppa-navy sm:text-4xl">{value}</p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">{label}</p>
                    {sub && <p className="mt-1 text-[11px] text-ppa-navy/55">{sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Match splits — pickleball.com's Win / Loss tab. */}
              <div className="border border-ppa-line bg-white">
                <p className="bg-ppa-navy px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                  Match Splits
                </p>
                <ul>
                  {splits.map((r) => (
                    <li key={r.label} className="flex items-center justify-between gap-4 border-t border-ppa-line px-4 py-3 first:border-t-0">
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-ppa-navy">{r.label}</span>
                        <span className="block text-[11px] text-ppa-navy/50">{r.help}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-display text-lg leading-none tabular-nums text-ppa-navy">{wl(r.v)}</span>
                        <span className="text-[10px] font-bold text-ppa-navy/40">{pct(r.v)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Games and points — pickleball.com's Player Stats tab. */}
              <div className="flex flex-col gap-6">
                <div className="border border-ppa-line bg-white">
                  <p className="bg-ppa-navy px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                    Games &amp; Points
                  </p>
                  <dl className="grid grid-cols-2">
                    {(
                      [
                        ["Games won–lost", wl(s.games), `${pct(s.games)} of games`],
                        ["Points won–lost", `${n(s.points.w)}–${n(s.points.l)}`, `${pointPct} of points`],
                        ["Straight-game wins", String(s.straightGames), "Won without dropping a game"],
                        [
                          "Point differential",
                          `${s.points.w - s.points.l >= 0 ? "+" : ""}${n(s.points.w - s.points.l)}`,
                          "Points won minus lost",
                        ],
                      ] as const
                    ).map(([label, value, help], i) => (
                      <div key={label} className={`px-4 py-3 ${i > 1 ? "border-t border-ppa-line" : ""} ${i % 2 ? "border-l border-ppa-line" : ""}`}>
                        <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45">{label}</dt>
                        <dd className="mt-1 font-display text-xl leading-none tabular-nums text-ppa-navy">{value}</dd>
                        <dd className="mt-1 text-[11px] text-ppa-navy/50">{help}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {s.bestWin && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Best Win</p>
                    <p className="mt-1 text-[11px] text-ppa-navy/50">
                      Over the best-seeded team they beat{s.bestWin.oppSeed ? ` (No. ${s.bestWin.oppSeed} seed)` : ""}
                    </p>
                    <div className="mt-2">
                      <BoxScore m={s.bestWin} subject={name} showEvent />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Titles and finals by year — pickleball.com's Titles and Finals tab. */}
        {byYear.length > 0 && (
          <div className="mt-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
              {kind === "all" ? "By Season" : `${KIND_LABEL[kind]} by Season`}
            </p>
            <div className="mt-3 overflow-x-auto border border-ppa-line bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ppa-navy text-white">
                    {["Season", "Events", "Win–Loss", "Titles", "Finals", "Semifinals"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-2 py-2 text-[9px] font-bold uppercase tracking-[0.1em] sm:px-4 sm:text-[10px] sm:tracking-[0.14em] ${i ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byYear.map((r) => (
                    <tr key={r.year} className="border-t border-ppa-line">
                      <td className="px-2 py-2 sm:px-4 font-semibold text-ppa-navy">{r.year}</td>
                      <td className="px-2 py-2 sm:px-4 text-right tabular-nums text-ppa-navy/70">{r.events}</td>
                      <td className="px-2 py-2 sm:px-4 text-right tabular-nums text-ppa-navy/70">{wl(r.matches)}</td>
                      <td className="px-2 py-2 sm:px-4 text-right tabular-nums font-semibold text-ppa-navy">{r.titles}</td>
                      <td className="px-2 py-2 sm:px-4 text-right tabular-nums text-ppa-navy/70">{r.runnerUp}</td>
                      <td className="px-2 py-2 sm:px-4 text-right tabular-nums text-ppa-navy/70">{r.semis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-ppa-navy/45">
          Counted from PPA Tour main draws{career.since ? ` since ${monthYear(career.since)}` : ""}, including PPA Tour
          Asia and Australia 1000+ events. Walkovers count in win–loss but not in games or points. Seeds stand in for
          ratings.
        </p>
      </div>
    </section>
  );
}

/* ───────────────────────── Tournament Results ───────────────────────── */

/** Lower-case, accents off, so "cancún" finds "Cancun". */
const fold = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function TournamentResults({ name, career }: { name: string; career: Career }) {
  const all = career.events;
  const years = useMemo(() => careerYears(career), [career]);
  const [year, setYear] = useState("all");
  const [query, setQuery] = useState("");
  const [id, setId] = useState(all[0]?.eventId ?? "");

  // The season and the search narrow the list the dropdown and the arrows walk.
  // Every word typed must appear in the tournament's name ("vegas open").
  const events = useMemo(() => {
    const words = fold(query).split(/\s+/).filter(Boolean);
    return all.filter(
      (ev) => (year === "all" || ev.endDate.startsWith(year)) && words.every((w) => fold(ev.name).includes(w)),
    );
  }, [all, year, query]);
  // The pick survives a filter change when it still matches; else the newest match.
  const found = events.findIndex((ev) => ev.eventId === id);
  const i = found < 0 ? 0 : found;
  const e = events[i];
  const groups = useMemo(() => {
    const out: { year: string; events: CareerEvent[] }[] = [];
    for (const ev of events) {
      const y = ev.endDate.slice(0, 4);
      const g = out[out.length - 1];
      if (g?.year === y) g.events.push(ev);
      else out.push({ year: y, events: [ev] });
    }
    return out;
  }, [events]);
  if (!all.length) return null;

  const arrow =
    "flex size-10 shrink-0 items-center justify-center border border-white/15 text-white/80 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent";
  const field = "h-10 w-full min-w-0 border border-white/15 bg-ppa-navy px-3 text-[13px] font-semibold text-white";
  const q = query.trim();
  const scope = `${year !== "all" ? ` in ${year}` : ""}${q ? ` matching “${q}”` : ""}`;
  const option = (ev: CareerEvent) => (
    <option key={ev.eventId} value={ev.eventId}>
      {ev.name}
    </option>
  );

  return (
    <section id="recent-results" className="scroll-mt-24 bg-ppa-navy text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">On Tour</p>
        <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] sm:text-3xl">Tournament Results</h2>

        {/* Filters: season + search. */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <label className="sm:w-40">
            <span className="sr-only">Season</span>
            <select value={year} onChange={(ev) => setYear(ev.target.value)} className={field}>
              <option value="all">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search tournaments</span>
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40"
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
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder="Search tournaments"
              className={`${field} pl-9 font-normal placeholder:text-white/40`}
            />
          </label>
        </div>

        {!e ? (
          <p className="mt-6 text-sm text-white/60">
            No tournaments{scope}.{" "}
            <button
              type="button"
              className="font-semibold text-white underline underline-offset-2"
              onClick={() => {
                setYear("all");
                setQuery("");
              }}
            >
              Clear filters
            </button>
          </p>
        ) : (
          <>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                className={arrow}
                aria-label="Newer tournament"
                disabled={i === 0}
                onClick={() => setId(events[i - 1].eventId)}
              >
                ‹
              </button>
              <label className="min-w-0 flex-1">
                <span className="sr-only">Tournament</span>
                <select value={e.eventId} onChange={(ev) => setId(ev.target.value)} className={field}>
                  {year === "all" && groups.length > 1
                    ? groups.map((g) => (
                        <optgroup key={g.year} label={g.year}>
                          {g.events.map(option)}
                        </optgroup>
                      ))
                    : events.map(option)}
                </select>
              </label>
              <button
                type="button"
                className={arrow}
                aria-label="Older tournament"
                disabled={i === events.length - 1}
                onClick={() => setId(events[i + 1].eventId)}
              >
                ›
              </button>
            </div>
            <p className="mt-2 text-[11px] font-semibold text-white/45">
              {i + 1} of {events.length} {events.length === 1 ? "tournament" : "tournaments"}
              {scope}
            </p>

            <TournamentDetail name={name} e={e} />
          </>
        )}
      </div>
    </section>
  );
}

/** One stop: its header, then every division they played there with every match. */
function TournamentDetail({ name, e }: { name: string; e: CareerEvent }) {
  return (
    <>
    {/* The stop. */}
    <div className="mt-5 flex items-center gap-4 border border-white/10 bg-white/[0.04] p-4">
      <EventLogo e={e} size={56} />
      <div className="min-w-0 flex-1">
        {e.href ? (
          <Link href={e.href} className="text-[15px] font-bold leading-snug hover:underline">
            {e.name}
          </Link>
        ) : (
          <p className="text-[15px] font-bold leading-snug">{e.name}</p>
        )}
        <p className="mt-0.5 text-[12px] font-semibold text-white/50">
          {dateRange(e.startDate, e.endDate)}, {e.endDate.slice(0, 4)}
        </p>
      </div>
    </div>

    {/* Every division they played there, with every match. */}
    <div className="mt-6 space-y-8">
      {e.divisions.map((d) => {
        const won = d.matches.filter((m) => m.won === true).length;
        return (
          <div key={d.division}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/10 pb-2">
              <p className="font-display text-lg uppercase leading-none">{d.division}</p>
              {d.finish && (
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${finishChipClass(d.place, "dark")}`}>
                  {d.finish}
                </span>
              )}
              <p className="text-[12px] text-white/55">
                {d.partners.length > 0 && <>w/ {d.partners.join(" / ")} · </>}
                {won}–{d.matches.length - won}
              </p>
            </div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {d.matches.map((m) => (
                <BoxScore key={m.id} m={m} subject={name} tone="dark" />
              ))}
            </div>
          </div>
        );
      })}
      </div>
    </>
  );
}
