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
  type CareerMatch,
  type KindFilter,
  type PlayerCareer as Career,
  type Split,
  type YearRow,
} from "@/lib/career-stats";
import type { PbPlayerStats, PbStatBlock } from "@/lib/pb-player-stats";
import { BoxScore, finishChipClass } from "@/components/athletes/BoxScore";
import { EventLogo, RecentResults, dateRange } from "@/components/athletes/RecentResults";
import { HeadToHead } from "@/components/athletes/HeadToHead";

/**
 * The athlete profile's Stats and Tournament Results sections (Wesley, 11/9:
 * "a much more extensive statistics section… similar to pickleball.com", and
 * "a tournament results section with a dropdown of all the tournaments a
 * player has played in").
 *
 * Stats come from pickleball.com's own stats engine (/api/player-stats →
 * lib/pb-player-stats, Wesley 11/12): 2020 on, the same numbers as their
 * Stats tab. If that call fails, Stats is counted from our career ledger
 * instead (/api/player-career → lib/career-stats), as it was before.
 *
 * Tournament Results always reads the career ledger: it needs every match,
 * which the stats engine does not return. Until the ledger has this pro, the
 * old Recent Results band renders in its place.
 *
 * ⚠ NO MEDAL WORDS OR COLOURS (Hannah, 7/28): Titles / Finals / Semifinals,
 * tour yellow for a title. ⚠ No ratings shown either (Connor, 7/29: no DUPR).
 * "Versus higher-rated team" is a win–loss record, not a rating.
 */
function memoLoad<T>(memo: Map<string, Promise<T | null>>, key: string, url: string, ok: (d: T) => boolean) {
  let p = memo.get(key);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: T | null) => (d && ok(d) ? d : null))
      .catch(() => null);
    memo.set(key, p);
    p.then((d) => {
      if (!d) memo.delete(key);
    });
  }
  return p;
}
const careerMemo = new Map<string, Promise<Career | null>>();
const loadCareer = (name: string) =>
  memoLoad<Career>(careerMemo, name, `/api/player-career/?name=${encodeURIComponent(name)}`, (d) =>
    Array.isArray(d.events) && d.events.length > 0,
  );
const pbMemo = new Map<string, Promise<PbPlayerStats | null>>();
const loadPb = (uuid: string | null | undefined) =>
  uuid
    ? memoLoad<PbPlayerStats>(pbMemo, uuid, `/api/player-stats/?uuid=${encodeURIComponent(uuid)}`, (d) =>
        Boolean(d.career),
      )
    : Promise.resolve(null);

const KIND_LABEL: Record<KindFilter, string> = { all: "All", doubles: "Doubles", mixed: "Mixed", singles: "Singles" };
const KIND_ORDER: KindFilter[] = ["all", "doubles", "mixed", "singles"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthYear = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const n = (v: number) => v.toLocaleString("en-US");

/**
 * `uuid` is the pickleball.com player uuid (lib/athlete-stats); null skips the stats engine.
 * `base` is where profiles live on this mount ("/athletes", or "/europe/athletes").
 */
export function PlayerCareer({
  name,
  uuid,
  base = "/athletes",
}: {
  name: string;
  uuid?: string | null;
  base?: string;
}) {
  const [state, setState] = useState<{
    key: string;
    career: Career | null;
    pb: PbPlayerStats | null;
  } | null>(null);
  const key = `${name}|${uuid ?? ""}`;
  useEffect(() => {
    let alive = true;
    Promise.all([loadCareer(name), loadPb(uuid)]).then(
      ([career, pb]) => alive && setState({ key, career, pb }),
    );
    return () => {
      alive = false;
    };
  }, [name, uuid, key]);

  const source = useMemo(
    () => (state?.pb ? pbSource(state.pb) : state?.career ? ledgerSource(state.career) : null),
    [state],
  );
  if (!state || state.key !== key) return null;
  return (
    <>
      {source && <StatsBand name={name} source={source} />}
      {/* Head-to-Head rides on the same stats call; absent from copies cached before it shipped. */}
      {state.pb?.h2h?.length ? <HeadToHead name={name} rows={state.pb.h2h} base={base} /> : null}
      {state.career ? (
        <TournamentResults name={name} career={state.career} />
      ) : (
        <RecentResults name={name} variant="profile" />
      )}
    </>
  );
}

/* ───────────────────────────── Stats ───────────────────────────── */

/** What the Stats band shows for one division + season, from either source. */
type StatsView = {
  events: number;
  matches: Split;
  titles: number;
  runnerUp: number;
  semis: number;
  longestStreak: number;
  current: { won: boolean; n: number } | null;
  splits: { label: string; help: string; v: Split }[];
  /** The four cells of the Games & Points card: label, value, help. */
  cells: [string, string, string][];
  bestWin: CareerMatch | null;
  bestWinNote: string;
};
type StatsSource = {
  kinds: KindFilter[];
  /** Seasons, newest first. */
  years: string[];
  view: (kind: KindFilter, period: string) => StatsView;
  byYear: (kind: KindFilter) => YearRow[];
  note: string;
};

const pointsCell = (p: Split): [string, string, string] => {
  const pp = p.w + p.l ? `${((100 * p.w) / (p.w + p.l)).toFixed(1)}%` : "—";
  return ["Points won–lost", `${n(p.w)}–${n(p.l)}`, `${pp} of points`];
};
const diffCell = (p: Split): [string, string, string] => [
  "Point differential",
  `${p.w - p.l >= 0 ? "+" : ""}${n(p.w - p.l)}`,
  "Points won minus lost",
];
const seedOf = (m: CareerMatch | null) => m?.oppSeed ?? Infinity;

/** Our own count from the career ledger (May 2023 on) — the fallback. */
function ledgerSource(career: Career): StatsSource {
  const have = new Set(career.events.flatMap((e) => e.divisions.map((d) => d.kind)));
  const view = (kind: KindFilter, period: string): StatsView => {
    const s = careerStats(career, kind, period);
    return {
      events: s.events,
      matches: s.matches,
      titles: s.titles,
      runnerUp: s.runnerUp,
      semis: s.semis,
      longestStreak: s.longestStreak,
      current: s.current,
      splits: [
        { label: "Versus higher seed", help: "Matches against a better-seeded team", v: s.vsHigherSeed },
        { label: "Deciding games", help: "Matches that went to a third (or fifth) game", v: s.deciding },
        { label: "After winning the first game", help: "Match record after taking game one", v: s.afterWonFirst },
        { label: "After losing the first game", help: "Match record after dropping game one", v: s.afterLostFirst },
        { label: "Finals", help: "Record in championship matches", v: s.finals },
      ],
      cells: [
        ["Games won–lost", wl(s.games), `${pct(s.games)} of games`],
        pointsCell(s.points),
        ["Straight-game wins", String(s.straightGames), "Won without dropping a game"],
        diffCell(s.points),
      ],
      bestWin: s.bestWin,
      bestWinNote: `Over the best-seeded team they beat${s.bestWin?.oppSeed ? ` (No. ${s.bestWin.oppSeed} seed)` : ""}`,
    };
  };
  return {
    kinds: KIND_ORDER.filter((k) => k === "all" || have.has(k)),
    years: careerYears(career),
    view,
    byYear: (kind) => titlesByYear(career, kind),
    note: `Counted from PPA Tour main draws${career.since ? ` since ${monthYear(career.since)}` : ""}, including PPA Tour Asia and Australia 1000+ events. Walkovers count in win–loss but not in games or points. Seeds stand in for ratings.`,
  };
}

/** pickleball.com's stats engine (2020 on). "All" sums the three divisions. */
function pbSource(pb: PbPlayerStats): StatsSource {
  const sum = (blocks: PbStatBlock[], f: (b: PbStatBlock) => Split): Split =>
    blocks.reduce((a, b) => ({ w: a.w + f(b).w, l: a.l + f(b).l }), { w: 0, l: 0 });
  const total = (blocks: PbStatBlock[], f: (b: PbStatBlock) => number) => blocks.reduce((a, b) => a + f(b), 0);
  const cutoff = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);

  const view = (kind: KindFilter, period: string): StatsView => {
    const scope = period === "career" ? pb.career : period === "12m" ? pb.last12 : (pb.years[period] ?? {});
    const blocks = (kind === "all" ? Object.values(scope) : [scope[kind]]).filter((b): b is PbStatBlock => !!b);
    const stops = pb.tournaments.filter(
      (t) =>
        (kind === "all" || t.kinds.includes(kind)) &&
        (period === "career" || (period === "12m" ? t.date >= cutoff : t.date.startsWith(period))),
    );
    const events = stops.length;
    // The 12-month call's title counts are career totals (lib/pb-player-stats),
    // so the rolling window counts them from the stops instead.
    const medal = (i: 0 | 1 | 2) =>
      stops.reduce(
        (a, t) =>
          a +
          (kind === "all" ? Object.values(t.medals ?? {}) : [t.medals?.[kind]]).reduce((x, m) => x + (m?.[i] ?? 0), 0),
        0,
      );
    const podium =
      period === "12m"
        ? { titles: medal(0), runnerUp: medal(1), semis: medal(2) }
        : {
            titles: total(blocks, (b) => b.titles),
            runnerUp: total(blocks, (b) => b.runnerUp),
            semis: total(blocks, (b) => b.semis),
          };
    const points = sum(blocks, (b) => b.points);
    const games = sum(blocks, (b) => b.games);
    const vsLefty = sum(blocks, (b) => b.vsLefty);
    const bestWin = blocks.map((b) => b.bestWin).reduce<CareerMatch | null>(
      (best, m) => (m && seedOf(m) < seedOf(best) ? m : best ?? m),
      null,
    );
    return {
      // No matches in this filter means nothing to show, whatever the stop count says.
      events: blocks.length ? events : 0,
      matches: sum(blocks, (b) => b.matches),
      ...podium,
      // Streaks don't add across divisions; "All" shows the longest and no current
      // run. A past season has no "current" run either, and the 12-month call's is
      // cut off at the window (ALW doubles 81 vs 97), so it's always career's.
      longestStreak: Math.max(0, ...blocks.map((b) => b.longestStreak)),
      current:
        kind !== "all" && blocks.length === 1 && (period === "career" || period === "12m")
          ? (pb.career[kind]?.current ?? null)
          : null,
      splits: [
        { label: "Versus higher-rated team", help: "Matches against a higher-rated team", v: sum(blocks, (b) => b.upsets) },
        { label: "Deciding games", help: "Matches that went to a deciding game", v: sum(blocks, (b) => b.deciding) },
        { label: "After winning the first game", help: "Match record after taking game one", v: sum(blocks, (b) => b.afterWonFirst) },
        { label: "After losing the first game", help: "Match record after dropping game one", v: sum(blocks, (b) => b.afterLostFirst) },
        { label: "Finals", help: "Record in championship matches", v: { w: podium.titles, l: podium.runnerUp } },
      ],
      cells: [
        ["Games won–lost", wl(games), `${pct(games)} of games`],
        pointsCell(points),
        ["Versus left-handers", wl(vsLefty), `${pct(vsLefty)} won`],
        diffCell(points),
      ],
      bestWin,
      // pickleball.com picks it (by rating, which we don't show); name the seed only
      // when it was a better-seeded team, or "Over the No. 17 seed" reads oddly.
      bestWinNote:
        bestWin?.oppSeed && bestWin.oppSeed < (bestWin.seed ?? Infinity)
          ? `Over the No. ${bestWin.oppSeed} seed`
          : "Their strongest win, as pickleball.com ranks it",
    };
  };
  const allYears = Object.keys(pb.years).sort().reverse();
  // The season picker only offers seasons with matches; a results-only season
  // (no match data, e.g. Tyson McGuffin 2020) still shows in the by-season table.
  const years = allYears.filter((y) => Object.values(pb.years[y]).some((b) => b && b.matches.w + b.matches.l > 0));
  const first = years[years.length - 1];
  return {
    kinds: KIND_ORDER.filter((k) => k === "all" || pb.career[k]),
    years,
    view,
    byYear: (kind) =>
      allYears
        .map((year) => {
          const v = view(kind, year);
          return { year, events: v.events, titles: v.titles, runnerUp: v.runnerUp, semis: v.semis, matches: v.matches };
        })
        .filter((r) => r.matches.w + r.matches.l + r.titles + r.runnerUp + r.semis > 0),
    note: `From pickleball.com's results for PPA Tour events${first ? ` since ${first}` : ""}, the same numbers as a player's Stats tab there. Season and 12-month figures follow their counting.`,
  };
}

function StatsBand({ name, source }: { name: string; source: StatsSource }) {
  const { kinds, years } = source;
  const [kind, setKind] = useState<KindFilter>("all");
  const [period, setPeriod] = useState("career");

  const s = useMemo(() => source.view(kind, period), [source, kind, period]);
  const byYear = useMemo(() => source.byYear(kind), [source, kind]);
  const splits = s.splits;

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
                    {s.cells.map(([label, value, help], i) => (
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
                    <p className="mt-1 text-[11px] text-ppa-navy/50">{s.bestWinNote}</p>
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
                      {/* "—" for a results-only season: no match data, not zero matches. */}
                      <td className="px-2 py-2 sm:px-4 text-right tabular-nums text-ppa-navy/70">{r.events || "—"}</td>
                      <td className="px-2 py-2 sm:px-4 text-right tabular-nums text-ppa-navy/70">
                        {r.matches.w + r.matches.l ? wl(r.matches) : "—"}
                      </td>
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

        <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-ppa-navy/45">{source.note}</p>
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
