"use client";

import { useEffect, useRef, useState } from "react";
import type { TickerMatch, TickerPlayer } from "@/lib/ticker-api";
import { useLiveTicker } from "@/components/live/use-live-ticker";

/**
 * Live broadcast score ticker for the /live header. Reads real match data from
 * the shared useLiveTicker hook (server proxy → Pickleball.com
 * homepage_score_ticker), polled every 15s. Override the partner with
 * ?partner=… (e.g. "PPA Australia", or the dev tournament's partner). Falls
 * back to placeholder cards when nothing is live. The sticky live banner
 * (StickyBuyBar) reads the same hook, so both surfaces stay in sync.
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

/** Month + day badge. Lazy-computed; suppressHydrationWarning covers the rare
 *  midnight SSR/client boundary. */
function DateBadge() {
  const [date] = useState(() => {
    const d = new Date();
    return {
      month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      day: String(d.getDate()),
    };
  });
  return (
    <div
      suppressHydrationWarning
      className="flex w-16 shrink-0 flex-col items-center justify-center border-r border-white/10 px-2 py-2 leading-none text-white"
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
        {date.month}
      </span>
      <span className="font-display text-2xl leading-none">{date.day}</span>
    </div>
  );
}

function ArrowButton({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === "left" ? "Scroll left" : "Scroll right"}
      onClick={onClick}
      className={`absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-ppa-line bg-white text-ppa-navy shadow-md transition hover:bg-ppa-paper ${
        dir === "left" ? "left-1" : "right-1"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={dir === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
      </svg>
    </button>
  );
}

export function LiveScoreTicker({
  showDate = true,
  transparent = false,
  visibleCards = 4,
}: {
  /** Month/day badge on the left (the /live broadcast header). */
  showDate?: boolean;
  /** Drop the navy backdrop so cards sit on the host section. */
  transparent?: boolean;
  /** How many full cards fit before the rail scrolls. */
  visibleCards?: 3 | 4;
} = {}) {
  const { ordered, loaded } = useLiveTicker();

  // Card width tuned so N cards show with a sliver of the next.
  const cardW = visibleCards === 3 ? "w-[31%]" : "w-[23%]";

  const [pbtvSrc, setPbtvSrc] = useState("/ppa/networks/pickleballtv-white.svg");

  // Arrow-button scrolling (native swipe still works on touch).
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  function onScroll() {
    const el = railRef.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  }
  function scrollByDir(dir: 1 | -1) {
    const el = railRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  // Recompute which arrows to show when the data or viewport changes.
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const update = () =>
      setEdges({
        start: el.scrollLeft <= 2,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
      });
    const id = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", update);
    };
  }, [ordered, loaded]);

  return (
    <div className={`flex items-stretch ${transparent ? "" : "bg-ppa-navy"}`}>
      {showDate && <DateBadge />}

      {/* Match cards — width tuned so `visibleCards` show with a sliver of
          the next. Arrow buttons scroll; native swipe still works on touch. */}
      <div className="relative min-w-0 flex-1">
        {loaded && !edges.start && <ArrowButton dir="left" onClick={() => scrollByDir(-1)} />}
        {loaded && !edges.end && <ArrowButton dir="right" onClick={() => scrollByDir(1)} />}
        <div
          ref={railRef}
          onScroll={onScroll}
          className="flex h-full items-stretch gap-2 overflow-x-auto py-2 pl-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
        {loaded ? ordered.map((m) => {
          const cols = columns(m);
          const aWins = cols.filter((c) => c.winner === "a").length;
          const bWins = cols.filter((c) => c.winner === "b").length;
          const matchWinner =
            m.status === "final" ? (aWins > bWins ? 0 : bWins > aWins ? 1 : null) : null;
          const isDoubles = m.teams.some((t) => t.players.length > 1);

          return (
            <article
              key={m.id}
              className={`flex ${cardW} shrink-0 flex-col overflow-hidden rounded-lg border border-ppa-line bg-white`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 px-3 py-1.5">
                <span className="truncate font-display text-sm uppercase leading-none text-ppa-navy">
                  {m.round}
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
                      className={`grid flex-1 grid-cols-[1fr_2rem_2rem_2rem] items-stretch border-b border-ppa-line last:border-b-0 ${
                        rowIsWinner ? "bg-[#d8ebd3]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 px-3 py-1.5">
                        <div className="flex -space-x-1.5">
                          {team.players.map((p, pi) => (
                            <Avatar key={pi} player={p} />
                          ))}
                        </div>
                        <span
                          className={`truncate font-semibold text-ppa-navy ${
                            isDoubles ? "text-[11px]" : "text-[13px]"
                          }`}
                        >
                          {team.players.map((p) => p.name).join(" / ")}
                        </span>
                      </div>
                      {cols.map((c, gi) => {
                        const val = ti === 0 ? c.a : c.b;
                        const gameWinner = ti === 0 ? c.winner === "a" : c.winner === "b";
                        const cellGreen = m.status !== "final" && gameWinner;
                        return (
                          <div
                            key={gi}
                            className={`flex items-center justify-center text-[15px] tabular-nums ${
                              c.live
                                ? "font-bold text-ppa-live"
                                : cellGreen
                                  ? "bg-[#d8ebd3] font-bold text-ppa-navy"
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
              <div className="flex items-center justify-between gap-2 border-t border-ppa-line px-3 py-1.5">
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
                ) : (
                  <a
                    href={m.watchUrl || undefined}
                    target={m.watchUrl ? "_blank" : undefined}
                    rel={m.watchUrl ? "noopener noreferrer" : undefined}
                    aria-label={m.watchUrl ? "Watch on PickleballTV" : undefined}
                    className={m.watchUrl ? "transition hover:opacity-70" : "pointer-events-none"}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pbtvSrc}
                      alt="PickleballTV"
                      onError={() => setPbtvSrc("/ppa/networks/pbtv.png")}
                      className={`h-4 w-auto object-contain ${
                        pbtvSrc.endsWith(".svg") ? "brightness-0" : ""
                      }`}
                    />
                  </a>
                )}
              </div>
            </article>
          );
        }) : (
          // Loading skeleton — shown until the first fetch resolves so real
          // matches don't pop in over placeholders. Spinner inside each card.
          Array.from({ length: visibleCards }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className={`flex h-[104px] ${cardW} shrink-0 items-center justify-center rounded-lg border border-ppa-line bg-white`}
            >
              <span
                aria-hidden
                className="size-6 animate-spin rounded-full border-2 border-ppa-line border-t-ppa-blue"
              />
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}
