"use client";

import { useEffect, useMemo, useState } from "react";
import type { Bracket, BracketDivision, BracketMatch, BracketSide } from "@/lib/bracket-types";
import { isTabHidden, onTabVisible } from "@/components/live/poll-visibility";

/**
 * The bracket as a phone reads it: one round at a time, matchups stacked,
 * swipe-free round tabs across the top. ESPN's mobile bracket, not a shrunk
 * tree — `BracketView` draws the full tree, which is right on a desktop and
 * unreadable at 390px (Bryce, 10/8: "the brackets aren't great").
 *
 * Same endpoints and cadence as BracketPanel (30s; see the note there on why
 * not 15s). The division is chosen by the parent's chips, so this component
 * has no picker of its own.
 */
const POLL_MS = 30000;

/** Map a chip's division name to the draw's division id. */
export function matchDivision(divs: BracketDivision[], name: string): BracketDivision | undefined {
  // ⚠ NO FALLBACK TO divs[0]. A chip with no draw behind it (no singles at
  // this stop) must say so, not show another division's bracket under its name.
  const key = (v: string) => v.toLowerCase().replace(/[^a-z]/g, "");
  return divs.find((d) => key(d.name) === key(name));
}

/** The round worth opening on: the earliest one still being played, else the last. */
function openingRound(b: Bracket): number {
  const i = b.rounds.findIndex((r) => r.matches.some((m) => m.status !== "final"));
  return i >= 0 ? i : b.rounds.length - 1;
}

function shortRound(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("quarter")) return "QF";
  if (n.includes("semi")) return "SF";
  if (n.includes("bronze") || n.includes("3rd")) return "Bronze";
  if (n.includes("final")) return "Final";
  const m = n.match(/(\d+)/);
  return m ? `R${m[1]}` : name;
}

function Side({ side, status }: { side: BracketSide; status: BracketMatch["status"] }) {
  const p = side.participant;
  const games = side.games.filter((g): g is number => g !== null);
  const lost = status === "final" && !side.winner;
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 ${lost ? "text-ppa-navy/45" : "text-ppa-navy"}`}>
      <span className="w-5 shrink-0 text-right text-[10px] font-bold tabular-nums text-ppa-navy/40">
        {p?.seed ?? ""}
      </span>
      <span className={`min-w-0 flex-1 truncate text-[14px] ${side.winner ? "font-bold" : "font-medium"}`}>
        {p?.name ?? <span className="italic text-ppa-navy/35">TBD</span>}
      </span>
      <span className="flex shrink-0 gap-2.5 tabular-nums">
        {games.map((g, i) => (
          <span key={i} className={`w-5 text-center text-[14px] ${side.winner ? "font-bold" : ""}`}>
            {g}
          </span>
        ))}
      </span>
    </div>
  );
}

function Matchup({ m }: { m: BracketMatch }) {
  return (
    <article className="overflow-hidden rounded-xl border border-ppa-line bg-white">
      <div className="flex items-center justify-between gap-2 bg-ppa-paper px-3 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45">
          {m.number ? `Match ${m.number}` : " "}
          {m.court ? ` · ${m.court}` : ""}
          {m.status === "scheduled" && m.time ? ` · ${m.time}` : ""}
        </span>
        {m.status === "live" ? (
          <span className="flex items-center gap-1 rounded-full bg-ppa-live px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white">
            <span className="size-1.5 animate-pulse rounded-full bg-white" /> Live
          </span>
        ) : m.outcome === "walkover" ? (
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-ppa-navy/50">Walkover</span>
        ) : m.status === "final" ? (
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-ppa-navy/50">Final</span>
        ) : null}
      </div>
      <Side side={m.sides[0]} status={m.status} />
      <div className="h-px bg-ppa-line" />
      <Side side={m.sides[1]} status={m.status} />
    </article>
  );
}

export function MobileBracket({ eventId, division }: { eventId: string; division: string }) {
  const [divs, setDivs] = useState<BracketDivision[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/brackets/?event=${encodeURIComponent(eventId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && setDivs(d?.divisions ?? []))
      .catch(() => active && setDivs([]));
    return () => {
      active = false;
    };
  }, [eventId]);

  const div = useMemo(() => (divs ? matchDivision(divs, division) : undefined), [divs, division]);

  if (!divs) return <Loading />;
  if (!divs.length) return <Empty text="No draw posted for this event yet." />;
  if (!div) return <Empty text={`No ${division} draw at this event.`} />;
  // Keyed: a new division is a fresh draw, round and Winners/Losers side.
  return <DivisionDraw key={div.id} eventId={eventId} divisionId={div.id} />;
}

function DivisionDraw({ eventId, divisionId }: { eventId: string; divisionId: string }) {
  const [draw, setDraw] = useState<{ main: Bracket | null; losers: Bracket | null; pools: Bracket | null } | null>(null);
  const [side, setSide] = useState<"main" | "losers" | "pools" | null>(null);
  const [roundSel, setRound] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch(`/api/brackets/?event=${encodeURIComponent(eventId)}&division=${encodeURIComponent(divisionId)}`, {
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!active || !d) return;
          setDraw({ main: d.bracket ?? null, losers: d.losers ?? null, pools: d.pools ?? null });
        })
        .catch(() => {});
    load();
    const id = window.setInterval(() => !isTabHidden() && load(), POLL_MS);
    const off = onTabVisible(load);
    return () => {
      active = false;
      window.clearInterval(id);
      off();
    };
  }, [eventId, divisionId]);

  // Group+knockout events (Finals "Top 8 Ranked"): open on pool play until the
  // knockout has a match in it.
  const knockoutStarted = Boolean(draw?.main?.rounds.some((r) => r.matches.some((m) => m.status !== "scheduled")));
  const shownSide = side ?? (draw?.pools && !knockoutStarted ? "pools" : "main");
  const bracket = shownSide === "losers" ? draw?.losers : shownSide === "pools" ? draw?.pools : draw?.main;
  const sides: { v: "main" | "losers" | "pools"; label: string }[] = draw?.losers
    ? [{ v: "main", label: "Winners" }, { v: "losers", label: "Losers" }]
    : draw?.pools
      ? [{ v: "pools", label: "Pools" }, { v: "main", label: "Bracket" }]
      : [];
  const round = bracket ? Math.min(roundSel ?? openingRound(bracket), bracket.rounds.length - 1) : 0;

  if (!draw) return <Loading />;
  if (!bracket?.rounds.length) return <Empty text="No draw to show yet. Checks again every 30 seconds." />;

  return (
    <div>
      {sides.length > 0 && (
        <div className="mb-3 inline-flex rounded-full border border-ppa-line p-0.5">
          {sides.map(({ v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setSide(v);
                setRound(null);
              }}
              className={`rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                shownSide === v ? "bg-ppa-navy text-white" : "text-ppa-navy/55"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {bracket.rounds.map((r, i) => {
          const live = r.matches.some((m) => m.status === "live");
          return (
            <button
              key={r.name + i}
              type="button"
              onClick={() => setRound(i)}
              className={`relative shrink-0 rounded-lg px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.08em] ${
                i === round ? "bg-ppa-navy text-white" : "bg-ppa-paper text-ppa-navy/60"
              }`}
            >
              {shortRound(r.name)}
              {live && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-ppa-live" />}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
        {bracket.rounds[round].name} · {bracket.rounds[round].matches.length} matches
      </p>
      <div className="mt-2 space-y-2.5">
        {bracket.rounds[round].matches.map((m) => (
          <Matchup key={m.id} m={m} />
        ))}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[92px] animate-pulse rounded-xl bg-ppa-paper" />
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-ppa-line bg-ppa-paper px-6 py-10 text-center text-[14px] text-ppa-navy/60">
      {text}
    </div>
  );
}
