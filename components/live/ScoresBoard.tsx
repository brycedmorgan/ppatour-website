"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScoreMatch, ScoresResult, ScoreTeam } from "@/lib/scores-api";

/**
 * All-scores board: every played match for the tournament's pro divisions,
 * separated by division (tabs) and date (sections). Fetches /api/scores and
 * polls every 30s. Shows a live dot on in-progress divisions/matches.
 */
const POLL_MS = 30000;

function SideRow({
  team,
  status,
  outcome,
}: {
  team: ScoreTeam;
  status: ScoreMatch["status"];
  outcome?: ScoreMatch["outcome"];
}) {
  const games = team.games.filter((g) => g !== null) as number[];
  const names = team.players.length ? team.players : ["TBD"];
  return (
    <div className="flex items-stretch">
      <span className="flex w-6 shrink-0 items-center justify-center text-[11px] font-bold tabular-nums text-ppa-navy/40">
        {team.seed ?? ""}
      </span>
      <div className="flex min-h-[2.4rem] flex-1 flex-col justify-center py-1.5">
        {names.map((n, i) => (
          <span
            key={i}
            className={`whitespace-nowrap text-[13px] leading-tight ${
              team.winner ? "font-bold text-ppa-navy" : "text-ppa-navy/70"
            }`}
          >
            {n}
          </span>
        ))}
      </div>
      <div className="flex shrink-0 items-stretch border-l border-ppa-line">
        {games.map((g, i) => (
          <span
            key={i}
            className={`flex w-8 items-center justify-center text-[13px] tabular-nums ${
              team.winner ? "bg-[#d3ecd0] font-bold text-ppa-navy" : "text-ppa-navy/45"
            }`}
          >
            {g}
          </span>
        ))}
        {/* ⚠ A WALKOVER WINNER GETS THE SAME TREATMENT AS EVERY OTHER WINNER.
            The green highlight lives on the SCORE cells, and a withdrawal has
            none — so the side that advanced was styled like the side that lost,
            distinguishable only by a bolder name. This puts one cell in the same
            column, with the same classes, carrying "W" for the team that went
            through and a dash for the team that withdrew. Same geometry as a
            played match, so a row of results reads consistently. */}
        {outcome === "walkover" && (
          <span
            className={`flex w-8 items-center justify-center text-[13px] tabular-nums ${
              team.winner ? "bg-[#d3ecd0] font-bold text-ppa-navy" : "text-ppa-navy/45"
            }`}
          >
            {team.winner ? "W" : "–"}
          </span>
        )}
        {status === "live" && games.length === 0 && (
          <span className="flex w-8 items-center justify-center text-ppa-navy/25">–</span>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ m }: { m: ScoreMatch }) {
  return (
    <article className="overflow-hidden rounded-md border border-ppa-line bg-white">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5">
        <span className="truncate font-display text-sm uppercase leading-none text-ppa-navy">
          {m.roundLabel}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {m.status === "live" && (
            <span className="flex items-center gap-1 rounded-full bg-ppa-live px-2 py-0.5">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-white">Live</span>
            </span>
          )}
          {/* ⚠ A confirmed-but-unplayed match has to SAY it hasn't been played.
              Its score cells are empty (SideRow renders only games that exist —
              never a fabricated 0–0), and without this chip an empty card reads
              as a result we failed to load rather than a fixture still to come. */}
          {/* ⚠ A walkover has no score, so without saying so the card looks like
              a result that failed to load — which is exactly how the withdrawn
              Wiseman/Pham vs Miao/Cai match read. The winner's name is bolded by
              SideRow; this says why there is nothing beside it. */}
          {m.outcome === "walkover" && (
            <span className="rounded-full bg-ppa-navy/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-ppa-navy/60">
              Walkover
            </span>
          )}
          {m.status === "scheduled" && (
            <span className="rounded-full bg-ppa-blue/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-ppa-blue">
              Upcoming
            </span>
          )}
          {m.court && (
            <span className="rounded-full bg-ppa-navy/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ppa-navy/55">
              {m.court}
            </span>
          )}
        </div>
      </div>
      <div className="border-t border-ppa-line">
        <SideRow team={m.teams[0]} status={m.status} outcome={m.outcome} />
        <div className="h-px bg-ppa-line" />
        <SideRow team={m.teams[1]} status={m.status} outcome={m.outcome} />
      </div>
    </article>
  );
}

export function ScoresBoard({ eventId, light = false }: { eventId: string; light?: boolean }) {
  const [data, setData] = useState<ScoresResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [day, setDay] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch(`/api/scores?event=${encodeURIComponent(eventId)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: ScoresResult | null) => {
          if (!active || !d) return;
          setData(d);
          setLoaded(true);
        })
        .catch(() => {});
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [eventId]);

  // Distinct tournament days (ascending), derived from the matches.
  const days = useMemo(() => {
    const m = new Map<string, string>();
    for (const x of data?.matches ?? []) m.set(x.dateKey, x.dateLabel);
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, label]) => ({ key, label }));
  }, [data]);

  // Default day on first load: today if it's a tournament day; otherwise the
  // most recent day on/before today (so a finished event opens on its last day,
  // and a future date falls back to the first day).
  useEffect(() => {
    if (day || !days.length) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const onOrBefore = days.filter((d) => d.key <= todayKey);
    setDay(onOrBefore.length ? onOrBefore[onOrBefore.length - 1].key : days[0].key);
  }, [days, day]);

  const liveAny = useMemo(
    () => (data?.matches ?? []).some((m) => m.status === "live"),
    [data],
  );

  const divisions = data?.divisions ?? [];
  const [division, setDivision] = useState<string | null>(null);
  /**
   * Open on a division that actually has matches on the chosen day.
   *
   * ⚠ IT USED TO OPEN ON divisions[0] BLIND, and that started landing on "No
   * matches on this day for this division." the moment the board could hold
   * more than one kind of day: a tournament's first day may have Men's Doubles
   * on court while the Women's Doubles times are still unpublished, and
   * Women's Doubles is first in the list. Falls back to the first division, so
   * a day with nothing in it still selects something.
   */
  useEffect(() => {
    // ⚠ Wait for `day`. The day picker is chosen by the effect above, and this
    // one is otherwise free to run first — with `day` still null nothing matches
    // it, so this fell straight through to divisions[0] and then never re-ran,
    // which is how the board kept opening on "No matches on this day".
    if (division || !divisions[0] || !day) return;
    const populated = divisions.find((d) =>
      (data?.matches ?? []).some((m) => m.divisionId === d.id && m.dateKey === day),
    );
    setDivision((populated ?? divisions[0]).id);
  }, [divisions, division, data, day]);

  // Divisions with a live match on the selected day (button dots).
  const liveDivsToday = useMemo(() => {
    const set = new Set<string>();
    for (const m of data?.matches ?? []) if (m.dateKey === day && m.status === "live") set.add(m.divisionId);
    return set;
  }, [data, day]);

  // Matches for the selected day + division, finals first.
  const matches = useMemo(
    () =>
      (data?.matches ?? [])
        .filter((m) => m.dateKey === day && m.divisionId === division)
        .sort((a, b) => b.roundNumber - a.roundNumber || a.matchNumber - b.matchNumber),
    [data, day, division],
  );

  const panel = light ? "border-ppa-line bg-ppa-paper" : "border-white/10 bg-ppa-navy-deep";
  const muted = light ? "text-ppa-navy/55" : "text-white/55";

  if (!loaded) {
    return (
      <div className={`flex h-[160px] items-center justify-center rounded-lg border ${panel}`}>
        <span
          aria-hidden
          className={`size-6 animate-spin rounded-full border-2 ${light ? "border-ppa-line border-t-ppa-blue" : "border-white/20 border-t-white"}`}
        />
      </div>
    );
  }

  if (!days.length) {
    return (
      <div className={`rounded-lg border px-6 py-10 text-center text-sm ${panel} ${muted}`}>
        No scores available yet.
      </div>
    );
  }

  return (
    <div>
      {/* Day picker */}
      <div className="flex flex-wrap items-center gap-3">
        {/* ⚠ "Matches", not "Results". The picker can now hold an "Upcoming"
            bucket of confirmed fixtures that have not been played, and before a
            tournament starts that is the ONLY entry — "Results by day" over a
            list of matches nobody has played yet describes the wrong thing. */}
        <label htmlFor="scores-day" className={`text-[11px] font-bold uppercase tracking-[0.16em] ${muted}`}>
          Matches by day
        </label>
        <select
          id="scores-day"
          value={day ?? ""}
          onChange={(e) => setDay(e.target.value)}
          className={`rounded-md border px-3 py-2 text-sm font-semibold focus:outline-none ${
            light
              ? "border-ppa-line bg-white text-ppa-navy focus:border-ppa-navy/50"
              : "border-white/20 bg-ppa-navy-deep text-white focus:border-white/50"
          }`}
        >
          {days.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
        {liveAny && (
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-live">
            <span className="size-1.5 animate-pulse rounded-full bg-ppa-live" />
            Live · auto-updating
          </span>
        )}
      </div>

      {/* Division buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {divisions.map((d) => {
          const active = d.id === division;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setDivision(d.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                active
                  ? light
                    ? "bg-ppa-blue text-white"
                    : "bg-white text-ppa-navy"
                  : light
                    ? "border border-ppa-line text-ppa-navy/60 hover:border-ppa-blue/50 hover:text-ppa-navy"
                    : "border border-white/20 text-white/70 hover:border-white/50 hover:text-white"
              }`}
            >
              {liveDivsToday.has(d.id) && <span className="size-1.5 animate-pulse rounded-full bg-ppa-live" />}
              {d.name}
            </button>
          );
        })}
      </div>

      {/* Matches for the selected day + division */}
      <div className="mt-6">
        {matches.length === 0 ? (
          <p className={`text-sm ${muted}`}>No matches on this day for this division.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <ScoreCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
