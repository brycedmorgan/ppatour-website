"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { getAthlete } from "@/lib/athletes";

/**
 * Placeholder broadcast score ticker for the /live header — a tournament crest
 * plus a scrollable strip of match cards styled after the broadcast mockup
 * (player headshots, three game columns, green = game won, red = live game,
 * em dash = unplayed). Static demo data until the live scoring API is wired.
 *
 * NOTE: the real tournament logo lives on the private cdn.pickleball.com
 * bucket (403 to us), so the left crest is a text placeholder for now.
 */

type Player = { slug: string; name: string };
type Team = { players: Player[]; games: (number | null)[] };
type LiveMatch = {
  id: string;
  round: string;
  status: "live" | "final" | "upnext";
  court: string;
  /** Index of the in-progress game (only when live). */
  liveGame?: number;
  /** Scheduled start time (only when up next). */
  time?: string;
  teams: [Team, Team];
};

const MATCHES: LiveMatch[] = [
  {
    id: "m1",
    round: "Round of 64",
    status: "live",
    court: "CC",
    liveGame: 2,
    teams: [
      {
        players: [
          { slug: "anna-leigh-waters", name: "A. Waters" },
          { slug: "ben-johns", name: "B. Johns" },
        ],
        games: [11, 5, 6],
      },
      {
        players: [
          { slug: "paris-todd", name: "P. Todd" },
          { slug: "federico-staksrud", name: "F. Staksrud" },
        ],
        games: [5, 11, 3],
      },
    ],
  },
  {
    id: "m2",
    round: "Round of 32",
    status: "final",
    court: "GS",
    teams: [
      { players: [{ slug: "christian-alshon", name: "C. Alshon" }], games: [11, 11, null] },
      { players: [{ slug: "gabe-tardio", name: "G. Tardio" }], games: [7, 9, null] },
    ],
  },
  {
    id: "m3",
    round: "Round of 32",
    status: "live",
    court: "SC 1",
    liveGame: 2,
    teams: [
      {
        players: [
          { slug: "riley-newman", name: "R. Newman" },
          { slug: "collin-johns", name: "C. Johns" },
        ],
        games: [9, 11, 4],
      },
      {
        players: [
          { slug: "dylan-frazier", name: "D. Frazier" },
          { slug: "jw-johnson", name: "JW Johnson" },
        ],
        games: [11, 6, 7],
      },
    ],
  },
  {
    id: "m4",
    round: "Round of 16",
    status: "upnext",
    court: "SC 2",
    time: "2:30 PM ET",
    teams: [
      { players: [{ slug: "anna-bright", name: "A. Bright" }], games: [null, null, null] },
      { players: [{ slug: "lea-jansen", name: "L. Jansen" }], games: [null, null, null] },
    ],
  },
  {
    id: "m5",
    round: "Quarterfinal",
    status: "final",
    court: "SC 3",
    teams: [
      {
        players: [
          { slug: "kate-fahey", name: "K. Fahey" },
          { slug: "catherine-parenteau", name: "C. Parenteau" },
        ],
        games: [11, 11, null],
      },
      {
        players: [
          { slug: "jessie-irvine", name: "J. Irvine" },
          { slug: "paris-todd", name: "P. Todd" },
        ],
        games: [6, 8, null],
      },
    ],
  },
];

// Show live matches first, then up-next, then finals.
const STATUS_ORDER: Record<LiveMatch["status"], number> = { live: 0, upnext: 1, final: 2 };
const ORDERED_MATCHES = [...MATCHES].sort(
  (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
);

function initials(name: string): string {
  return name.replace(/[^A-Za-z. ]/g, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function Avatar({ player }: { player: Player }) {
  const headshot = getAthlete(player.slug)?.headshot ?? null;
  return (
    <span className="relative size-6 shrink-0 overflow-hidden rounded-full bg-ppa-line ring-2 ring-white">
      {headshot ? (
        <Image src={headshot} alt="" fill sizes="24px" className="object-cover object-top" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[8px] font-bold text-ppa-navy/50">
          {initials(player.name)}
        </span>
      )}
    </span>
  );
}

/** Per-game column state shared by both team rows. */
function columns(m: LiveMatch) {
  return [0, 1, 2].map((gi) => {
    const a = m.teams[0].games[gi];
    const b = m.teams[1].games[gi];
    const live = m.status === "live" && m.liveGame === gi;
    let winner: "a" | "b" | null = null;
    if (!live && a != null && b != null) winner = a > b ? "a" : b > a ? "b" : null;
    return { a, b, live, winner };
  });
}

function StatusBadge({ status }: { status: LiveMatch["status"] }) {
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

export function LiveScoreTicker({ logo }: { logo?: string | null }) {
  const railRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0 });
  // Logo source order: local ATL asset now → API logo when the CDN opens → crest.
  const logoSources = ["/ppa/logos/2026-atl.webp", logo].filter(Boolean) as string[];
  const [logoIdx, setLogoIdx] = useState(0);
  const currentLogo = logoSources[logoIdx] ?? null;
  // Prefer the new white PickleballTV logo (inverted to read on the light
  // footer); fall back to the legacy colored PNG until that file is added.
  const [pbtvSrc, setPbtvSrc] = useState("/ppa/networks/pickleballtv-white.svg");
  // Current date in a fixed tz so SSR and client render the same string.
  const today = new Date()
    .toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" })
    .toUpperCase();

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return; // touch/pen use native scroll
    const el = railRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = railRef.current;
    if (!el || !drag.current.active) return;
    el.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX);
  }
  function endDrag() {
    drag.current.active = false;
  }

  return (
    <div className="flex items-stretch bg-ppa-navy">
      {/* Tournament crest — API logo when it loads, else a text crest.
          (The logo bucket is currently private to us — falls back gracefully.) */}
      <div className="flex shrink-0 flex-col items-center justify-center gap-1 border-r border-white/10 px-4 py-2">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          {currentLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentLogo}
              alt="Tournament"
              onError={() => setLogoIdx((i) => i + 1)}
              className="h-full w-auto max-w-[120px] object-contain"
            />
          ) : (
            <span className="flex flex-col items-center gap-1 text-center">
              <span className="flex size-8 items-center justify-center rounded-full bg-ppa-blue font-display text-base leading-none text-white">
                W
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                World Championships
              </span>
            </span>
          )}
        </div>
        <span className="font-display text-lg uppercase leading-none text-white">
          {today}
        </span>
      </div>

      {/* Match cards — drag/swipe; ~30% wide so 3 show with a sliver of the 4th */}
      <div
        ref={railRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="flex flex-1 cursor-grab select-none items-stretch gap-2 overflow-x-auto py-2 pl-2 active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ORDERED_MATCHES.map((m) => {
          const cols = columns(m);
          // Match winner (finals only) — the team that won more games.
          const aWins = cols.filter((c) => c.winner === "a").length;
          const bWins = cols.filter((c) => c.winner === "b").length;
          const matchWinner =
            m.status === "final" ? (aWins > bWins ? 0 : bWins > aWins ? 1 : null) : null;
          // Doubles names are longer (two players) — render them a touch smaller.
          const isDoubles = m.teams.some((t) => t.players.length > 1);
          return (
            <article
              key={m.id}
              className="flex w-[23%] shrink-0 flex-col overflow-hidden rounded-lg bg-white"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 px-3 py-1.5">
                <span className="truncate font-display text-sm uppercase leading-none text-ppa-navy">
                  {m.round}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StatusBadge status={m.status} />
                  {m.status !== "final" && (
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
                          {team.players.map((p) => (
                            <Avatar key={p.slug} player={p} />
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
                        // Per-game green only for non-finals; finals use the row highlight.
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
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-ppa-navy/50">
                  {m.status === "upnext" ? "Head-to-Head Info" : "Match Results"}
                </span>
                {m.status === "upnext" ? (
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ppa-blue">
                    {m.time}
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pbtvSrc}
                    alt="PickleballTV"
                    onError={() => setPbtvSrc("/ppa/networks/pbtv.png")}
                    className={`h-4 w-auto object-contain ${
                      pbtvSrc.endsWith(".svg") ? "brightness-0" : ""
                    }`}
                  />
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
