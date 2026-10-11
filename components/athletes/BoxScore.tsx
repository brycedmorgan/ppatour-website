import Link from "next/link";
import type { HistoryMatch } from "@/lib/player-history";
import { playerHref } from "@/lib/app-player";
import { normalizeScoreName } from "@/lib/score-names";

/**
 * One finished match as a box score — both teams on their own row, a column
 * per game, the winning side and each game's winning number in bold. Used by
 * the profile's Latest Result card and the Recent Results band
 * (components/athletes/RecentResults), light or dark.
 *
 * `games` is from the subject's side ([theirs, opponents']); the feed sends
 * 0–0 for a game nobody played (a 2–0 match's third game), which is dropped.
 */
export type Tone = "light" | "dark";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export function playedGames(m: HistoryMatch): [number, number][] {
  return m.games[0]
    .map((g, i) => [g, m.games[1][i] ?? 0] as [number, number])
    .filter(([a, b]) => a > 0 || b > 0);
}

/**
 * Finish chip — the profile's top-finish treatment is tour yellow (the
 * rankings' top-five block), never a metal colour: no gold/silver/bronze
 * anywhere (Hannah, 7/28).
 */
export function finishChipClass(place: 1 | 2 | 3 | null, tone: Tone): string {
  if (place === 1) return "bg-ppa-yellow text-ppa-navy";
  if (place === 2) return tone === "dark" ? "text-ppa-yellow ring-1 ring-inset ring-ppa-yellow/70" : "bg-ppa-navy text-white";
  return tone === "dark" ? "bg-white/10 text-white/75" : "bg-ppa-navy/[0.06] text-ppa-navy/70";
}

export function ResultChip({ won, tone }: { won: boolean | null; tone: Tone }) {
  const cls =
    won === true
      ? "bg-ppa-win text-ppa-navy"
      : won === false
        ? tone === "dark"
          ? "bg-white/10 text-white/60"
          : "bg-ppa-navy/10 text-ppa-navy/55"
        : tone === "dark"
          ? "bg-white/5 text-white/40"
          : "bg-ppa-paper text-ppa-navy/40";
  return (
    <span className={`flex size-6 shrink-0 items-center justify-center text-[10px] font-bold ${cls}`}>
      {won === true ? "W" : won === false ? "L" : "–"}
    </span>
  );
}

function Faces({ names, faces, tone }: { names: string[]; faces: Record<string, string>; tone: Tone }) {
  return (
    <span className="flex shrink-0 -space-x-2">
      {names.map((n) => {
        const src = faces[normalizeScoreName(n)];
        return (
          <span
            key={n}
            className={`relative size-7 overflow-hidden rounded-full ring-2 ${
              tone === "dark" ? "bg-white/10 ring-ppa-navy" : "bg-ppa-paper ring-white"
            }`}
          >
            {src ? (
              // Plain img — board headshots come from more than one host (as in MatchCard).
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" loading="lazy" className="size-7 object-cover object-top" />
            ) : (
              <span
                className={`flex size-7 items-center justify-center text-[9px] font-bold ${
                  tone === "dark" ? "text-white/60" : "text-ppa-navy/50"
                }`}
              >
                {initials(n)}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

function Names({ list, link, strong, tone }: { list: string[]; link: boolean; strong: boolean; tone: Tone }) {
  const base = tone === "dark" ? (strong ? "text-white" : "text-white/60") : strong ? "text-ppa-navy" : "text-ppa-navy/60";
  // One player per line: "Tyra Hurricane Black / Catherine Parenteau" on one
  // line truncates to nothing useful at phone width.
  return (
    <span className={`flex min-w-0 flex-col text-[13px] leading-tight ${strong ? "font-bold" : "font-medium"} ${base}`}>
      {list.map((n, i) => (
        <span key={n + i} className="truncate">
          {link ? (
            <Link href={playerHref(n)} className="underline-offset-2 active:underline">
              {n}
            </Link>
          ) : (
            n
          )}
        </span>
      ))}
    </span>
  );
}

export function BoxScore({
  m,
  subject,
  tone = "light",
  link = false,
  faces,
  showEvent = false,
  bare = false,
}: {
  m: HistoryMatch;
  /** The pro whose page this is — their side is the first row. */
  subject: string;
  tone?: Tone;
  /** App mode: every name opens its player screen. */
  link?: boolean;
  /** Headshots by normalized name; omitted → no face column. */
  faces?: Record<string, string>;
  showEvent?: boolean;
  /** No card border (when the box score sits inside another card). */
  bare?: boolean;
}) {
  const games = playedGames(m);
  const walkover = m.outcome === "walkover";
  const rows = [
    { names: [subject, ...m.partners], won: m.won === true, side: 0 as const },
    { names: m.opponents.length ? m.opponents : ["TBD"], won: m.won === false, side: 1 as const },
  ];
  const dark = tone === "dark";
  const muted = dark ? "text-white/45" : "text-ppa-navy/45";

  return (
    // min-w-0: inside a grid the box score's nowrap names would otherwise set
    // the column's minimum width and push the page sideways at phone widths.
    <div className={`min-w-0 ${bare ? "" : dark ? "border border-white/10 bg-white/[0.04]" : "border border-ppa-line bg-white"}`}>
      <div className={`flex items-center justify-between gap-3 px-3 pt-2.5 ${muted}`}>
        <p className="min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.14em]">
          {m.round} · {m.division}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          {!walkover && games.length > 0 && (
            <span className="flex gap-0 text-[9px] font-bold uppercase tracking-[0.1em]">
              {games.map((_, i) => (
                <span key={i} className="w-7 text-center">
                  G{i + 1}
                </span>
              ))}
            </span>
          )}
          <ResultChip won={m.won} tone={tone} />
        </div>
      </div>
      <div className="px-3 pb-2.5 pt-1">
        {rows.map((r) => (
          <div key={r.side} className="flex items-center gap-2.5 py-1.5">
            {faces && <Faces names={r.names} faces={faces} tone={tone} />}
            <Names list={r.names} link={link && r.names[0] !== "TBD"} strong={r.won} tone={tone} />
            <span className="ml-auto flex shrink-0 tabular-nums">
              {walkover ? (
                <span className={`text-[12px] font-semibold ${muted}`}>{r.won ? "W/O" : ""}</span>
              ) : (
                games.map((g, i) => {
                  const mine = g[r.side];
                  const took = mine > g[1 - r.side];
                  return (
                    <span
                      key={i}
                      className={`w-7 text-center text-[14px] ${
                        took ? (dark ? "font-bold text-white" : "font-bold text-ppa-navy") : dark ? "text-white/45" : "text-ppa-navy/40"
                      }`}
                    >
                      {mine}
                    </span>
                  );
                })
              )}
              {/* Under the header's W/L chip, so the game columns line up with G1–G3. */}
              <span className="ml-3 w-6" aria-hidden />
            </span>
          </div>
        ))}
        {showEvent && <p className={`mt-1 truncate text-[11px] ${muted}`}>{m.eventName}</p>}
      </div>
    </div>
  );
}
