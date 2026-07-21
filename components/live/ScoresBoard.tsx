"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScoreMatch, ScoresResult, ScoreTeam } from "@/lib/scores-api";

/**
 * All-scores board: every played match for the tournament's pro divisions,
 * separated by division (tabs) and date (sections). Fetches /api/scores and
 * polls every 30s. Shows a live dot on in-progress divisions/matches.
 */
const POLL_MS = 30000;

function SideRow({ team, status }: { team: ScoreTeam; status: ScoreMatch["status"] }) {
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
          {m.court && (
            <span className="rounded-full bg-ppa-navy/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ppa-navy/55">
              {m.court}
            </span>
          )}
        </div>
      </div>
      <div className="border-t border-ppa-line">
        <SideRow team={m.teams[0]} status={m.status} />
        <div className="h-px bg-ppa-line" />
        <SideRow team={m.teams[1]} status={m.status} />
      </div>
    </article>
  );
}

export function ScoresBoard({ eventId }: { eventId: string }) {
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
  useEffect(() => {
    if (!division && divisions[0]) setDivision(divisions[0].id);
  }, [divisions, division]);

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

  if (!loaded) {
    return (
      <div className="flex h-[160px] items-center justify-center rounded-lg border border-white/10 bg-ppa-navy-deep">
        <span aria-hidden className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (!days.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-ppa-navy-deep px-6 py-10 text-center text-sm text-white/55">
        No scores available yet.
      </div>
    );
  }

  return (
    <div>
      {/* Day picker */}
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="scores-day" className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
          Results by day
        </label>
        <select
          id="scores-day"
          value={day ?? ""}
          onChange={(e) => setDay(e.target.value)}
          className="rounded-md border border-white/20 bg-ppa-navy-deep px-3 py-2 text-sm font-semibold text-white focus:border-white/50 focus:outline-none"
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
                  ? "bg-white text-ppa-navy"
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
          <p className="text-sm text-white/55">No matches on this day for this division.</p>
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
