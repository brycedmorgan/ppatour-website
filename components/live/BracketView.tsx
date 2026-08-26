"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Bracket, BracketMatch, BracketSide } from "@/lib/bracket-types";

/**
 * Single-elimination bracket renderer — round-per-column with elbow connectors
 * drawn (as an SVG overlay measured from the laid-out cards) linking each match
 * to the next round. Source-agnostic: takes our internal Bracket model.
 *
 * Cards are deliberately dense: last names only, one line per team, and score
 * columns only in rounds that have actually been played. A whole draw has to
 * read at a glance, so every row we can drop is width and height we get back.
 */

const MEDAL_BG: Record<string, string> = {
  gold: "bg-ppa-yellow text-ppa-navy",
  silver: "bg-ppa-line text-ppa-navy",
  bronze: "bg-[#cd7f32] text-white",
};
const MEDAL_LABEL: Record<string, string> = { gold: "1st", silver: "2nd", bronze: "3rd" };

const CARD_W = 210;
const CONNECTOR = "rgba(255,255,255,0.4)";
const ZOOMS = [1, 0.75, 0.55];

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/**
 * Last names only — "Ulery / Minniefield" instead of two stacked full names.
 * A last name shared by two DIFFERENT players anywhere in the draw keeps a
 * first initial ("B. Johns" vs "C. Johns"), so shortening never merges people.
 */
function shortNameMap(bracket: Bracket): Map<string, string> {
  const byLast = new Map<string, Set<string>>();
  for (const round of bracket.rounds) {
    for (const m of round.matches) {
      for (const side of m.sides) {
        if (!side.participant) continue;
        for (const raw of side.participant.name.split(" / ")) {
          const person = raw.trim();
          if (!person) continue;
          const last = person.split(/\s+/).slice(-1)[0];
          if (!byLast.has(last)) byLast.set(last, new Set());
          byLast.get(last)!.add(person);
        }
      }
    }
  }
  const out = new Map<string, string>();
  for (const [last, people] of byLast) {
    for (const person of people) {
      out.set(person, people.size > 1 ? `${person[0]}. ${last}` : last);
    }
  }
  return out;
}

function SideRow({
  side,
  short,
  showScores,
}: {
  side: BracketSide;
  short: Map<string, string>;
  showScores: boolean;
}) {
  const p = side.participant;
  const games = side.games.filter((g) => g !== null) as number[];
  const label = p
    ? p.name
        .split(" / ")
        .map((n) => short.get(n.trim()) ?? n.trim())
        .join(" / ")
    : "TBD";
  return (
    <div className="flex min-h-[1.75rem] items-stretch">
      <span className="flex w-5 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums text-ppa-navy/40">
        {p?.seed ?? ""}
      </span>
      <span
        className={`flex flex-1 items-center gap-1.5 whitespace-nowrap py-1 pr-2 text-[12px] leading-tight ${
          p ? "text-ppa-navy" : "text-ppa-navy/35"
        } ${side.winner ? "font-bold" : ""}`}
      >
        {label}
        {p?.medal && (
          <span className={`shrink-0 rounded px-1 text-[8px] font-bold uppercase tracking-wide ${MEDAL_BG[p.medal]}`}>
            {MEDAL_LABEL[p.medal]}
          </span>
        )}
      </span>
      {showScores && (
        <span className="flex shrink-0 items-stretch border-l border-ppa-line">
          {(games.length ? games : [null, null, null]).map((g, i) => (
            <span
              key={i}
              className={`flex w-6 items-center justify-center text-[12px] tabular-nums ${
                side.winner ? "bg-[#d3ecd0] font-bold text-ppa-navy" : "text-ppa-navy/45"
              }`}
            >
              {g ?? ""}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

function MatchCard({
  m,
  short,
  showScores,
  setRef,
}: {
  m: BracketMatch;
  short: Map<string, string>;
  showScores: boolean;
  setRef: (el: HTMLElement | null) => void;
}) {
  // Court and time only earn a row once there is one — an unplayed draw is all
  // card, no footer.
  const hasFooter = m.status === "live" || Boolean(m.court) || Boolean(m.time);
  return (
    <article
      ref={setRef}
      className="overflow-hidden rounded-md border border-ppa-line bg-white shadow-sm"
    >
      <div className="flex">
        {/* Match-number rail — number on top, match link beneath it. */}
        <div className="flex w-6 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-ppa-line py-1">
          <span className="text-[10px] font-bold leading-none tabular-nums text-ppa-navy/45">
            {m.number ?? ""}
          </span>
          <a
            href={`https://pickleball.com/results/match/${m.id}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Match ${m.number ?? ""} details`}
            className="text-ppa-navy/25 transition-colors hover:text-ppa-blue"
          >
            <LinkIcon />
          </a>
        </div>
        {/* Team rows */}
        <div className="flex flex-1 flex-col">
          <SideRow side={m.sides[0]} short={short} showScores={showScores} />
          <div className="h-px bg-ppa-line" />
          <SideRow side={m.sides[1]} short={short} showScores={showScores} />
        </div>
      </div>
      {hasFooter && (
        <div className="flex items-center gap-1.5 border-t border-ppa-line px-2 py-0.5 text-[10px]">
          {m.status === "live" && (
            <span className="flex items-center gap-1 text-ppa-live">
              <span className="size-1.5 animate-pulse rounded-full bg-ppa-live" />
              <span className="font-bold uppercase tracking-wide">Live</span>
            </span>
          )}
          {m.court && <span className="font-semibold text-teal-600">{m.court}</span>}
          {m.court && m.time && <span className="text-ppa-navy/25">|</span>}
          {m.time && <span className="truncate text-ppa-navy/50">{m.time}</span>}
        </div>
      )}
    </article>
  );
}

export function BracketView({
  bracket,
  fullPage = false,
  light = false,
}: {
  bracket: Bracket;
  /** Fill the viewport on the dedicated brackets page (vs. the compact box). */
  fullPage?: boolean;
  /** Style the round navigator for a light/white background. */
  light?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<HTMLDivElement[]>([]);
  const [paths, setPaths] = useState<string[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [railW, setRailW] = useState(0);
  const [activeRound, setActiveRound] = useState(0);
  const [zoom, setZoom] = useState(1);

  const short = useMemo(() => shortNameMap(bracket), [bracket]);
  // Score columns are per ROUND, so every card in a column stays the same width.
  const roundHasScores = useMemo(
    () =>
      bracket.rounds.map((r) =>
        r.matches.some((m) => m.status !== "scheduled" || m.sides.some((s) => s.games.some((g) => g))),
      ),
    [bracket],
  );

  // Keep the always-visible sticky scrollbar and the bracket in sync.
  const onBarScroll = () => {
    const el = scrollRef.current;
    const bar = barRef.current;
    if (el && bar && Math.abs(el.scrollLeft - bar.scrollLeft) > 1) el.scrollLeft = bar.scrollLeft;
  };

  const scrollToRound = (i: number) => {
    const el = scrollRef.current;
    const col = colRefs.current[i];
    if (!el || !col) return;
    // Anchor on the round's COLUMN (always present) — not a match-id lookup that
    // can miss for some rounds and make the jump behave inconsistently.
    const left = Math.max(0, col.offsetLeft * zoom - 8);
    // The column centers its matches vertically, so scroll to the first card too
    // (else a short round like the final sits off-screen below the fold).
    const firstCard = col.querySelector("article") as HTMLElement | null;
    if (fullPage) {
      // Content-tall box: the box scrolls horizontally, the window vertically.
      el.scrollTo({ left, behavior: "smooth" });
      if (firstCard) {
        const y = firstCard.getBoundingClientRect().top + window.scrollY - 140;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }
    } else {
      // In-section box scrolls both axes; issue x + y in one call (two calls on
      // the same element cancel each other).
      el.scrollTo({
        left,
        top: firstCard ? Math.max(0, firstCard.offsetTop * zoom - 8) : el.scrollTop,
        behavior: "smooth",
      });
    }
    setActiveRound(i);
  };
  // Highlight the round nearest the left edge as the user scrolls.
  const onScrollRail = () => {
    const el = scrollRef.current;
    if (!el) return;
    const x = el.scrollLeft;
    let best = 0;
    let bestD = Infinity;
    colRefs.current.forEach((col, i) => {
      if (!col) return;
      const d = Math.abs(col.offsetLeft * zoom - x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setActiveRound(best);
    const bar = barRef.current;
    if (bar && Math.abs(bar.scrollLeft - x) > 1) bar.scrollLeft = x;
  };

  useLayoutEffect(() => {
    const compute = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const box = (id: string) => {
        const el = cardRefs.current.get(id);
        return el
          ? { l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }
          : null;
      };
      // Draw a connector from each match to the exact match its winner
      // advances to (nextMatchId) — never a positional guess.
      const ps: string[] = [];
      for (const round of bracket.rounds) {
        for (const m of round.matches) {
          if (!m.nextMatchId) continue;
          const sb = box(m.id);
          const tb = box(m.nextMatchId);
          if (!sb || !tb) continue;
          const sx = sb.l + sb.w;
          const sy = sb.t + sb.h / 2;
          const tx = tb.l;
          const ty = tb.t + tb.h / 2;
          const midX = (sx + tx) / 2;
          ps.push(`M${sx},${sy} H${midX} V${ty} H${tx}`);
        }
      }
      setPaths(ps);
      setSize({ w: wrap.scrollWidth, h: wrap.scrollHeight });
      setRailW(wrap.scrollWidth * zoom);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [bracket, zoom]);

  return (
    <div>
      {/* Round navigator — jump to any round (pinned on the full page) */}
      <div
        className={`mb-3 flex flex-wrap items-center gap-1.5 ${
          fullPage ? "sticky top-16 z-30 -mx-4 border-b border-white/10 bg-ppa-navy px-4 py-3" : ""
        }`}
      >
        {bracket.rounds.map((r, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollToRound(i)}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
              activeRound === i
                ? light
                  ? "bg-ppa-blue text-white"
                  : "bg-white text-ppa-navy"
                : light
                  ? "border border-ppa-line text-ppa-navy/60 hover:border-ppa-blue/50 hover:text-ppa-navy"
                  : "border border-white/20 text-white/60 hover:border-white/50 hover:text-white"
            }`}
          >
            {r.name}
          </button>
        ))}
        {/* Zoom out to fit more of the draw on screen at once. */}
        <div className="ml-auto flex items-center gap-1">
          {ZOOMS.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoom(z)}
              aria-pressed={zoom === z}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold tabular-nums transition-colors ${
                zoom === z
                  ? light
                    ? "bg-ppa-blue text-white"
                    : "bg-white text-ppa-navy"
                  : light
                    ? "border border-ppa-line text-ppa-navy/60 hover:text-ppa-navy"
                    : "border border-white/20 text-white/60 hover:text-white"
              }`}
            >
              {Math.round(z * 100)}%
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScrollRail}
        className={`rounded-lg border border-white/10 bg-ppa-navy-deep ${
          fullPage
            ? "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "max-h-[70vh] overflow-auto [scrollbar-width:thin]"
        }`}
      >
        {/* The sizer carries the SCALED footprint so the container still scrolls
            correctly; the scaler shrinks the laid-out bracket inside it. */}
        <div style={{ width: size.w * zoom, height: size.h * zoom }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }} className="w-max">
            {/* Padding on the content (not the container) so both the first and
                last rounds get side spacing — padding-right on scroll containers
                is unreliable. */}
            <div ref={wrapRef} className="relative flex min-w-max gap-10 p-6">
              <svg
                className="pointer-events-none absolute left-0 top-0"
                width={size.w}
                height={size.h}
                style={{ overflow: "visible" }}
                aria-hidden
              >
                {paths.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke={CONNECTOR} strokeWidth={1.5} />
                ))}
              </svg>

              {bracket.rounds.map((round, ri) => (
                <div
                  key={ri}
                  ref={(el) => {
                    if (el) colRefs.current[ri] = el;
                  }}
                  className="flex w-max flex-col"
                  style={{ minWidth: CARD_W }}
                >
                  <div className="mb-3 rounded-t-md border border-ppa-line bg-[#d7dee4] py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-ppa-navy">
                    {round.name}
                  </div>
                  <div className="flex flex-1 flex-col justify-around gap-3">
                    {round.matches.map((m) => (
                      <MatchCard
                        key={m.id}
                        m={m}
                        short={short}
                        showScores={roundHasScores[ri]}
                        setRef={(el) => {
                          if (el) cardRefs.current.set(m.id, el);
                          else cardRefs.current.delete(m.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Always-visible horizontal scrollbar (full page): pinned to the
          viewport bottom and synced to the bracket, so left/right scrolling is
          reachable anywhere in a tall draw. */}
      {fullPage && (
        <div
          ref={barRef}
          onScroll={onBarScroll}
          aria-hidden
          className="sticky bottom-0 z-20 mt-2 overflow-x-scroll rounded bg-ppa-navy-deep/95"
        >
          <div style={{ width: railW, height: 1 }} />
        </div>
      )}
    </div>
  );
}
