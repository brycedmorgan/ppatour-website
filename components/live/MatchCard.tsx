"use client";

import { useState } from "react";
import type { TickerMatch, TickerPlayer } from "@/lib/ticker-api";
import { matchWatchUrl, watchPlatform } from "@/components/live/use-live-ticker";

/**
 * The YouTube play badge, in YouTube red — the same official glyph the footer
 * and the live marquee already use. Inline rather than a file in
 * public/ppa/networks/ because it is one path and needs no colour variants:
 * every other mark in that folder is knocked out to a single colour, and this
 * one has to stay red to read as YouTube.
 */
function YouTubeMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-auto" fill="#FF0000" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

/**
 * One live/upcoming/final match card. Shared by the scrolling ticker rail
 * (LiveScoreTicker) and the tabbed grid (LiveScoreGrid). `className` sizes the
 * card for its container (fixed width in the rail; grid cell handles the grid).
 */

function initials(name: string): string {
  return name
    .replace(/[^A-Za-z. ]/g, "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ player }: { player: TickerPlayer }) {
  return (
    <span className="relative size-6 shrink-0 overflow-hidden rounded-full bg-ppa-line ring-2 ring-white">
      {player.headshot ? (
        // Plain img — headshots come from varied hosts; skip next/image config.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={player.headshot} alt="" className="h-full w-full object-cover object-top" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[8px] font-bold text-ppa-navy/50">
          {initials(player.name)}
        </span>
      )}
    </span>
  );
}

function StatusBadge({ status }: { status: TickerMatch["status"] }) {
  if (status === "live") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-ppa-live px-2 py-0.5">
        <span className="size-1.5 animate-pulse rounded-full bg-ppa-yellow" />
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-ppa-yellow">Live</span>
      </span>
    );
  }
  if (status === "final") {
    return (
      <span className="rounded-full bg-ppa-navy/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ppa-navy/55">
        Final
      </span>
    );
  }
  return (
    <span className="rounded-full bg-ppa-blue/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ppa-blue">
      Up Next
    </span>
  );
}

/** Per-game column state shared by both team rows. */
function columns(m: TickerMatch) {
  return [0, 1, 2].map((gi) => {
    const a = m.teams[0].games[gi];
    const b = m.teams[1].games[gi];
    const live = m.status === "live" && m.liveGame === gi;
    let winner: "a" | "b" | null = null;
    if (!live && a != null && b != null) winner = a > b ? "a" : b > a ? "b" : null;
    return { a, b, live, winner };
  });
}

export function MatchCard({ m, className = "" }: { m: TickerMatch; className?: string }) {
  const [pbtvSrc, setPbtvSrc] = useState("/ppa/networks/pickleballtv-white.svg");
  // Resolved once: matchWatchUrl falls back to PickleballTV, so the platform is
  // read off the link that will actually open, not off m.watchUrl.
  const watchHref = matchWatchUrl(m);
  const platform = watchPlatform(watchHref);
  const platformLabel =
    platform === "youtube" ? "YouTube" : platform === "pbtv" ? "PickleballTV" : "the live stream";
  const cols = columns(m);
  const aWins = cols.filter((c) => c.winner === "a").length;
  const bWins = cols.filter((c) => c.winner === "b").length;
  /**
   * ⚠ THE FEED'S OWN VERDICT WINS OVER THE GAME TALLY. A tally cannot decide a
   * match nobody played, so a walkover — one side withdrew, the other advanced —
   * highlighted neither row, and the card read as a final with no result. The
   * tally still handles every normal match, and anything the feed leaves
   * undecided.
   */
  const declared = m.winnerTeam === 1 ? 0 : m.winnerTeam === 2 ? 1 : null;
  const matchWinner =
    m.status === "final" ? (declared ?? (aWins > bWins ? 0 : bWins > aWins ? 1 : null)) : null;
  const walkover = m.outcome === "walkover";
  const isDoubles = m.teams.some((t) => t.players.length > 1);

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-lg border border-ppa-line bg-white ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
        <span className="truncate font-display text-xs uppercase leading-none text-ppa-navy">
          {m.division || m.round}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <StatusBadge status={m.status} />
          {m.status !== "final" && m.court && (
            <span className="flex size-7 items-center justify-center rounded-full bg-ppa-navy-deep text-[10px] font-bold text-white">
              {m.court}
            </span>
          )}
        </div>
      </div>

      {/* Team rows */}
      <div className="flex flex-1 flex-col border-t border-ppa-line">
        {m.teams.map((team, ti) => {
          const rowIsWinner = matchWinner === ti;
          return (
            <div
              key={ti}
              /* ⚠ `minmax(0,1fr)`, NOT `1fr`, AND `min-w-0` ON THE CELL — THIS IS
                 WHY THE SCORES WERE CUT OFF. A grid item defaults to
                 `min-width: auto`, so the name column refused to shrink below
                 its own text, pushed the three score columns past the card's
                 right edge, and `overflow-hidden` on the article clipped them.
                 The `truncate` on the name did nothing, because it can only
                 take effect once an ancestor is allowed to shrink. Two long
                 doubles names ("A. Bright / H. Patriquin") were enough.
                 Reported by Bryce 9/1 with a screenshot of the third game
                 column sliced in half. */
              className={`grid flex-1 grid-cols-[minmax(0,1fr)_1.9rem_1.9rem_1.9rem] items-stretch border-b border-ppa-line last:border-b-0 ${
                rowIsWinner ? "bg-ppa-win" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-1.5 px-2.5 py-1.5">
                <div className="flex -space-x-1.5">
                  {team.players.map((p, pi) => (
                    <Avatar key={pi} player={p} />
                  ))}
                </div>
                <span
                  className={`min-w-0 truncate font-semibold text-ppa-navy ${
                    isDoubles ? "text-[11px]" : "text-[13px]"
                  }`}
                >
                  {team.players.map((p) => p.name).join(" / ")}
                </span>
              </div>
              {/* ⚠ A walkover has no scores, so without this the winning row is
                  a green band with three empty cells — a result that looks like
                  it failed to load. One "W" against a dash puts the outcome in
                  the same column a score would occupy, matching the scores board
                  and the bracket. */}
              {walkover &&
                [0, 1, 2].map((gi) => (
                  <div
                    key={gi}
                    className={`flex items-center justify-end pr-2 text-[15px] tabular-nums ${
                      rowIsWinner ? "font-bold text-ppa-navy" : "text-ppa-navy/45"
                    }`}
                  >
                    {gi === 0 ? (rowIsWinner ? "W" : "–") : ""}
                  </div>
                ))}
              {!walkover && cols.map((c, gi) => {
                const val = ti === 0 ? c.a : c.b;
                const gameWinner = ti === 0 ? c.winner === "a" : c.winner === "b";
                const cellGreen = m.status !== "final" && gameWinner;
                return (
                  <div
                    key={gi}
                    /* Right-aligned, not centred (Bryce, 9/1). Scores are 1–2
                       digits and a centred column makes "7" and "11" start in
                       different places down the card; right-aligned with
                       `tabular-nums` they form a clean column. The inset is
                       padding INSIDE the cell rather than on the row, so a
                       winning game's tint still reaches the card edge. */
                    className={`flex items-center justify-end pr-2 text-[15px] tabular-nums ${
                      c.live
                        ? "font-bold text-ppa-live"
                        : cellGreen
                          ? "bg-ppa-win font-bold text-ppa-navy"
                          : rowIsWinner
                            ? "font-bold text-ppa-navy"
                            : "text-ppa-navy/45"
                    }`}
                  >
                    {val == null ? <span className="text-ppa-navy/25">—</span> : val}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-ppa-line px-2.5 py-1.5">
        {m.status === "upnext" ? (
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-ppa-navy/50">
            Head-to-Head Info
          </span>
        ) : (
          <a
            href={`https://pickleball.com/results/match/${m.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-bold uppercase tracking-[0.14em] text-ppa-navy/50 transition-colors hover:text-ppa-blue"
          >
            Match Results
          </a>
        )}
        {m.status === "upnext" ? (
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ppa-blue">
            {m.time}
          </span>
        ) : m.status === "live" ? (
          // Live — the mark of whichever service the link actually opens.
          <a
            href={watchHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Watch live on ${platformLabel}`}
            className="flex items-center transition hover:opacity-70"
          >
            {platform === "youtube" ? (
              <YouTubeMark />
            ) : platform === "pbtv" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pbtvSrc}
                alt="PickleballTV"
                onError={() => setPbtvSrc("/ppa/networks/pbtv.png")}
                className={`h-4 w-auto object-contain ${
                  pbtvSrc.endsWith(".svg") ? "brightness-0" : ""
                }`}
              />
            ) : (
              // Somewhere we don't have a mark for — say "Watch", claim nothing.
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ppa-blue">
                <span aria-hidden>▶</span> Watch
              </span>
            )}
          </a>
        ) : m.watchUrl ? (
          // Final — a "Watch" link to the replay when the feed provides one.
          <a
            href={m.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] text-ppa-blue transition-colors hover:text-ppa-blue-deep"
          >
            <span aria-hidden>▶</span> Watch
          </a>
        ) : null}
      </div>
    </article>
  );
}

/** Loading placeholder — spinner in a card shell. */
export function MatchCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-[104px] items-center justify-center rounded-lg border border-ppa-line bg-white ${className}`}
    >
      <span
        aria-hidden
        className="size-6 animate-spin rounded-full border-2 border-ppa-line border-t-ppa-blue"
      />
    </div>
  );
}
