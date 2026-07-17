"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { TickerMatch, TickerResult, TickerTeam } from "@/lib/ticker-api";

/**
 * Shared live-ticker data source. Fetches real match data from /api/ticker
 * (server proxy → Pickleball.com homepage_score_ticker) on mount and polls
 * every 15s, honoring ?partner=… Both the /live header score ticker
 * (LiveScoreTicker) and the sticky live banner (StickyBuyBar) consume this so
 * they always show the exact same matches.
 */

const POLL_MS = 15000;

export const STATUS_ORDER: Record<TickerMatch["status"], number> = {
  live: 0,
  upnext: 1,
  final: 2,
};

// Shown until the first fetch resolves / when no live matches are available.
export const PLACEHOLDER: TickerMatch[] = [
  {
    id: "ph-1",
    round: "Round of 64",
    status: "live",
    court: "CC",
    liveGame: 2,
    teams: [
      {
        players: [
          { name: "A. Waters", headshot: "/ppa/pros/anna-leigh-waters.jpg" },
          { name: "B. Johns", headshot: "/ppa/pros/ben-johns.jpg" },
        ],
        games: [11, 5, 6],
      },
      {
        players: [
          { name: "P. Todd", headshot: "/ppa/pros/paris-todd.jpg" },
          { name: "F. Staksrud", headshot: "/ppa/pros/federico-staksrud.jpg" },
        ],
        games: [5, 11, 3],
      },
    ],
  },
  {
    id: "ph-2",
    round: "Round of 32",
    status: "upnext",
    court: "SC 1",
    time: "2:30 PM ET",
    teams: [
      { players: [{ name: "A. Bright", headshot: "/ppa/pros/anna-bright.jpg" }], games: [null, null, null] },
      { players: [{ name: "L. Jansen", headshot: "/ppa/pros/lea-jansen.jpg" }], games: [null, null, null] },
    ],
  },
  {
    id: "ph-3",
    round: "Round of 32",
    status: "final",
    court: "GS",
    teams: [
      { players: [{ name: "C. Alshon", headshot: "/ppa/pros/christian-alshon.jpg" }], games: [11, 11, null] },
      { players: [{ name: "G. Tardio", headshot: "/ppa/pros/gabe-tardio.jpg" }], games: [7, 9, null] },
    ],
  },
];

/**
 * Live matches from the API, sorted live → up-next → final. Falls back to the
 * PLACEHOLDER set once loaded but nothing is live. Pass `enabled: false` to skip
 * fetching entirely (e.g. off the /live route, where the sticky bar shows the
 * Next Event state instead).
 */
export function useLiveTicker({ enabled = true }: { enabled?: boolean } = {}) {
  const searchParams = useSearchParams();
  const partner = searchParams.get("partner");

  const [matches, setMatches] = useState<TickerMatch[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const url = partner ? `/api/ticker?partner=${encodeURIComponent(partner)}` : "/api/ticker";
    const load = async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as TickerResult;
        if (!active) return;
        setMatches(data.matches);
      } catch {
        // keep last-known / placeholder on transient errors
      } finally {
        if (active) setLoaded(true);
      }
    };
    void load();
    const id = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [enabled, partner]);

  const ordered = useMemo(() => {
    if (!enabled) return [] as TickerMatch[];
    const list = matches.length > 0 ? matches : PLACEHOLDER;
    return [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [enabled, matches]);

  return { ordered, loaded };
}

/** The single match to feature in a compact surface: the first live one, else
 *  the first up-next, else the first available. */
export function pickFeaturedMatch(matches: TickerMatch[]): TickerMatch | undefined {
  return matches.find((m) => m.status === "live") ?? matches[0];
}

/** "A. Waters / B. Johns" — the players on one side of the net. */
export function teamLabel(team: TickerTeam): string {
  return team.players.map((p) => p.name).join(" / ");
}

/** "11–9, 9–11, 8–6" — the games that have a score, in order. */
export function formatMatchScore(m: TickerMatch): string {
  const cells: string[] = [];
  for (let gi = 0; gi < 3; gi++) {
    const a = m.teams[0].games[gi];
    const b = m.teams[1].games[gi];
    if (a == null && b == null) continue;
    cells.push(`${a ?? 0}–${b ?? 0}`);
  }
  return cells.join(", ");
}
