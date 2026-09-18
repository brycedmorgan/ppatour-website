"use client";

/**
 * The title race: a bar chart race of every pro title at PPA Tour events since
 * 2020, one tournament at a time. Data and headshots come from lib/title-race.ts.
 *
 * ⚠ AT REST IT SHOWS THE FINAL STANDINGS. The server render, a reader with
 * reduced motion, and anyone who scrolls past before it plays all get the
 * current all-time top 10 as plain text. It only rewinds to 2020 when it is
 * actually on screen (IntersectionObserver), or when someone presses Play.
 *
 * ⚠ DOM, NOT CANVAS, on purpose: names, counts and the tournament line are real
 * text a screen reader and a search engine can read, and the full top 25 sits
 * in the "View as table" disclosure for anyone who wants it without motion.
 *
 * Colour: women `ppa-blue`, men a bronze stepped darker than `ppa-bronze` so it
 * clears 3:1 on white. Validated as a pair (light mode, white surface): CVD
 * ΔE 26.0 protan, normal 28.4, all six checks pass. Identity never rests on
 * colour alone: every row is named, and the legend spells both out.
 */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TitleRaceData } from "@/lib/title-race";

type Mode = "all" | "W" | "M";
type Row = { name: string; v: number; y: number };

const TOPN = 10;
const SLOT = 0.4; // seconds per tournament
const INTRO = 0.5;
const MEN = "#b8772c";
const WOMEN = "#228be6";
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const initials = (n: string) =>
  n.split(" ").filter(Boolean).map((s) => s[0]).slice(0, 2).join("");
const when = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return { month: MON[m - 1], year: y };
};

type Ranked = { name: string; v: number; f: number };

/** Values at progress p (events elapsed, fractional), ranked. Pure: no refs. */
function rankAt(
  cum: Record<string, Float32Array>,
  names: string[],
  N: number,
  p: number,
): Ranked[] {
  const k = Math.floor(p);
  const next = Math.min(N, Math.ceil(p));
  const val = (n: string) => {
    if (k >= N) return cum[n][N];
    const a = cum[n][k];
    return a + (cum[n][k + 1] - a) * ease(p - k);
  };
  return names
    .map((name) => ({ name, v: val(name), f: cum[name][next] }))
    .filter((r) => r.v > 0.001)
    .sort((a, b) => b.v - a.v || b.f - a.f || a.name.localeCompare(b.name));
}

export function TitleRace({ data }: { data: TitleRaceData }) {
  const { events, players } = data;
  const N = events.length;
  const TOTAL = INTRO + N * SLOT;

  // Cumulative titles per player after each event, plus the final split.
  const { cum, split } = useMemo(() => {
    const names = Object.keys(players);
    const cum: Record<string, Float32Array> = {};
    const split: Record<string, { S: number; D: number; X: number }> = {};
    for (const n of names) {
      cum[n] = new Float32Array(N + 1);
      split[n] = { S: 0, D: 0, X: 0 };
    }
    events.forEach((e, k) => {
      for (const n of names) cum[n][k + 1] = cum[n][k];
      for (const [p, d] of e.w) {
        if (!cum[p]) continue;
        cum[p][k + 1] += 1;
        split[p][d === "MX" ? "X" : d[1] === "S" ? "S" : "D"] += 1;
      }
    });
    return { cum, split };
  }, [events, players, N]);

  const [mode, setMode] = useState<Mode>("all");
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(TOTAL);
  const yRef = useRef<Record<string, number>>({});
  const modeRef = useRef<Mode>("all");
  const played = useRef(false);
  const rootRef = useRef<HTMLElement>(null);

  const pool = useCallback(
    (m: Mode) => Object.keys(players).filter((n) => m === "all" || players[n].g === m),
    [players],
  );

  const pOf = useCallback((t: number) => Math.max(0, Math.min(N, (t - INTRO) / SLOT)), [N]);

  // One frame: values at time t, ranked, with each row's y eased toward its slot.
  const frame = useCallback(
    (t: number, dt: number, snap: boolean) => {
      const p = pOf(t);
      const ranked = rankAt(cum, pool(modeRef.current), N, p);
      const Y = yRef.current;
      const seen = new Set<string>();
      const rows: Row[] = ranked.map((r, i) => {
        seen.add(r.name);
        if (Y[r.name] === undefined || snap) Y[r.name] = snap ? i : Math.max(i, TOPN + 0.6);
        else Y[r.name] += (i - Y[r.name]) * (1 - Math.exp(-dt * 9));
        return { name: r.name, v: r.v, y: Y[r.name] };
      });
      for (const n of Object.keys(Y)) if (!seen.has(n)) delete Y[n];
      return {
        p,
        rows: rows.filter((r) => r.y < TOPN + 0.5),
        max: Math.max(ranked[0]?.v ?? 0, 4),
      };
    },
    [N, cum, pool, pOf],
  );

  // At rest: the final standings, computed without touching the refs.
  const [view, setView] = useState(() => {
    const ranked = rankAt(cum, Object.keys(players), N, N);
    return {
      p: N,
      rows: ranked.slice(0, TOPN).map((r, i) => ({ name: r.name, v: r.v, y: i })),
      max: Math.max(ranked[0]?.v ?? 0, 4),
    };
  });

  // The animation loop.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tRef.current = Math.min(TOTAL, tRef.current + dt);
      setView(frame(tRef.current, dt, false));
      if (tRef.current >= TOTAL) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, frame, TOTAL]);

  const play = useCallback(() => {
    if (tRef.current >= TOTAL) {
      tRef.current = 0;
      yRef.current = {};
      setView(frame(0, 0, true));
    }
    played.current = true;
    setPlaying(true);
  }, [TOTAL, frame]);

  const replay = () => {
    tRef.current = TOTAL;
    play();
  };

  // Plays once, the first time most of it is on screen. Never with reduced motion.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !played.current) {
          tRef.current = TOTAL;
          play();
          io.disconnect();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [play, TOTAL]);

  const setModeTo = (m: Mode) => {
    modeRef.current = m;
    setMode(m);
    yRef.current = {};
    setView(frame(tRef.current, 0, true));
  };

  const scrub = (v: number) => {
    setPlaying(false);
    tRef.current = (TOTAL * v) / 1000;
    setView(frame(tRef.current, 0, true));
  };

  const done = view.p >= N;
  const ev = events[Math.min(N - 1, Math.floor(view.p))];
  const at = when(ev.d);
  const step = [1, 2, 5, 10, 20, 25, 50, 100].find((s) => s >= view.max / 4) ?? 100;
  const ticks: number[] = [];
  for (let v = step; v <= view.max * 1.001; v += step) ticks.push(v);

  const table = useMemo(
    () =>
      pool(mode)
        .map((n) => ({ n, v: cum[n][N], ...split[n] }))
        .sort((a, b) => b.v - a.v || a.n.localeCompare(b.n))
        .slice(0, 25),
    [pool, mode, cum, split, N],
  );

  return (
    <section ref={rootRef} aria-labelledby="title-race-h" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              All-Time Titles
            </p>
          </div>
          <h2
            id="title-race-h"
            className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl"
          >
            The Title Race
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ppa-navy/60">
            Every pro title on the PPA Tour since 2020, one tournament at a time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => (playing ? setPlaying(false) : play())}
            className="inline-flex h-10 items-center bg-ppa-blue px-5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ppa-blue"
          >
            {playing ? "Pause" : done ? "Play the race" : "Play"}
          </button>
          <button
            type="button"
            onClick={replay}
            className="inline-flex h-10 items-center border border-ppa-line bg-white px-4 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:border-ppa-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ppa-blue"
          >
            Replay
          </button>
          <div role="group" aria-label="Players" className="inline-flex border border-ppa-line bg-white p-0.5">
            {(
              [
                ["all", "All"],
                ["W", "Women"],
                ["M", "Men"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setModeTo(m)}
                className={`h-9 px-3 text-xs font-bold uppercase tracking-[0.1em] focus-visible:outline-2 focus-visible:outline-ppa-blue ${
                  mode === m ? "bg-ppa-navy text-white" : "text-ppa-navy/60 hover:text-ppa-navy"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 border border-ppa-line bg-white p-4 sm:p-6">
        {/* The tournament being tallied, and the legend. */}
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-blue">
              {done ? "Final standings" : "Now playing"}
            </p>
            <p className="mt-0.5 truncate text-sm font-bold text-ppa-navy">
              {done ? `Through the ${data.through.event}` : `${ev.n} · ${at.month} ${at.year}`}
            </p>
          </div>
          {mode === "all" && (
            <ul className="flex gap-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/70">
              <li className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: WOMEN }} />
                Women
              </li>
              <li className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: MEN }} />
                Men
              </li>
            </ul>
          )}
        </div>

        {/* The race. --row is the row pitch; everything positions off it. */}
        <div className="relative mt-8 h-[calc(var(--row)*10)] [--row:2.25rem] sm:[--row:2.9rem]">
          {/* Month/year readout, behind the bars. */}
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 bottom-0 text-right font-display uppercase leading-none text-ppa-navy/[0.07]"
          >
            <div className="text-2xl sm:text-4xl">{done ? "" : at.month}</div>
            <div className="text-6xl tabular-nums sm:text-8xl">{at.year}</div>
          </div>

          {/* Grid: vertical lines at nice steps, labelled above. The bar track
              starts after the name column and leaves room for avatar + count. */}
          <div aria-hidden className="absolute inset-y-0 right-0 left-[8rem] sm:left-[12rem]">
            <div className="absolute inset-y-0 left-0 w-[calc(100%-4.75rem)] sm:w-[calc(100%-6rem)]">
              <div className="absolute inset-y-0 left-0 w-px bg-ppa-navy/20" />
              {ticks.map((v) => (
                <div key={v} className="absolute inset-y-0 w-px bg-ppa-navy/[0.07]" style={{ left: `${(100 * v) / view.max}%` }}>
                  <span className="absolute -top-5 -translate-x-1/2 text-[10px] font-bold tabular-nums text-ppa-navy/40">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <ol className="absolute inset-0 overflow-hidden">
            {view.rows.map((r) => {
              const pl = players[r.name];
              const color = pl.g === "W" ? WOMEN : MEN;
              const f = r.v / view.max;
              const a = Math.max(0, Math.min(1, TOPN - r.y));
              const name = pl.slug ? (
                <Link href={`/athletes/${pl.slug}`} className="hover:text-ppa-blue">
                  {r.name}
                </Link>
              ) : (
                r.name
              );
              return (
                <li
                  key={r.name}
                  className="absolute inset-x-0 top-0 flex h-[var(--row)] items-center"
                  style={{ transform: `translateY(calc(var(--row) * ${r.y}))`, opacity: a }}
                >
                  <span className="w-5 shrink-0 text-[11px] font-bold tabular-nums text-ppa-navy/40">
                    {Math.min(TOPN, Math.round(r.y) + 1)}
                  </span>
                  <span className="w-[6.75rem] shrink-0 truncate pr-2 text-right text-[10.5px] font-bold text-ppa-navy sm:w-[10.75rem] sm:pr-3 sm:text-sm">
                    {name}
                  </span>
                  <span className="relative h-full min-w-0 flex-1">
                    <span className="absolute inset-y-0 left-0 w-[calc(100%-4.75rem)] sm:w-[calc(100%-6rem)]">
                      <span
                        className="absolute top-1/2 left-0 h-[62%] -translate-y-1/2 rounded-r-[4px]"
                        style={{ width: `max(4px, ${100 * f}%)`, background: color }}
                      />
                      <span
                        className="absolute top-1/2 flex -translate-y-1/2 items-center gap-1.5 sm:gap-2"
                        style={{ left: `${100 * f}%` }}
                      >
                        <span
                          className="relative -ml-1 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ppa-paper text-[10px] font-bold text-ppa-navy ring-2 sm:size-9 sm:text-xs"
                          style={{ ["--tw-ring-color" as string]: color }}
                        >
                          {pl.head ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={pl.head} alt="" loading="lazy" className="size-full object-cover object-top" />
                          ) : (
                            initials(r.name)
                          )}
                        </span>
                        <span className="font-display text-base leading-none tabular-nums text-ppa-navy sm:text-xl">
                          {Math.round(r.v)}
                        </span>
                      </span>
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Timeline scrubber. */}
        <div className="mt-5 flex items-center gap-3">
          <label htmlFor="title-race-scrub" className="sr-only">
            Timeline
          </label>
          <input
            id="title-race-scrub"
            type="range"
            min={0}
            max={1000}
            step={1}
            value={Math.round((1000 * Math.min(TOTAL, INTRO + view.p * SLOT)) / TOTAL)}
            onChange={(e) => scrub(Number(e.target.value))}
            className="min-w-0 flex-1 accent-ppa-blue"
          />
          <span className="w-16 shrink-0 text-right text-xs font-bold tabular-nums text-ppa-navy/60">
            {at.month} {at.year}
          </span>
        </div>

        <p className="mt-4 border-t border-ppa-line pt-3 text-xs leading-relaxed text-ppa-navy/50">
          Pro titles at PPA Tour events since 2020: singles, doubles and mixed. A doubles title
          counts for each partner.
        </p>
      </div>

      <details className="group mt-4">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy/70 hover:text-ppa-navy">
          View as table
        </summary>
        <div className="mt-3 overflow-x-auto border border-ppa-line bg-white">
          <table className="w-full text-left text-sm tabular-nums">
            <caption className="sr-only">
              Most PPA Tour titles{mode === "W" ? ", women" : mode === "M" ? ", men" : ""}, top 25
            </caption>
            <thead className="text-[10px] uppercase tracking-[0.12em] text-ppa-navy/50">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2 text-right">Titles</th>
                <th className="px-3 py-2 text-right">Singles</th>
                <th className="px-3 py-2 text-right">Doubles</th>
                <th className="px-3 py-2 text-right">Mixed</th>
              </tr>
            </thead>
            <tbody>
              {table.map((r, i) => (
                <tr key={r.n} className="border-t border-ppa-line text-ppa-navy">
                  <td className="px-3 py-2 text-ppa-navy/50">{i + 1}</td>
                  <td className="px-3 py-2 font-bold whitespace-nowrap">
                    {players[r.n].slug ? (
                      <Link href={`/athletes/${players[r.n].slug}`} className="hover:text-ppa-blue">
                        {r.n}
                      </Link>
                    ) : (
                      r.n
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-bold">{r.v}</td>
                  <td className="px-3 py-2 text-right">{r.S}</td>
                  <td className="px-3 py-2 text-right">{r.D}</td>
                  <td className="px-3 py-2 text-right">{r.X}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
