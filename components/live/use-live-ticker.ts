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
 *
 * When nothing is live the hook returns an empty list — consumers show their
 * loading/empty state (the ticker keeps its spinner) rather than fabricating
 * placeholder matches.
 */

const POLL_MS = 15000;

export const STATUS_ORDER: Record<TickerMatch["status"], number> = {
  live: 0,
  upnext: 1,
  final: 2,
};

/**
 * Real live matches from the API, sorted live → up-next → final (empty until
 * the first fetch resolves, or whenever nothing is live). `loaded` flips true
 * once the first fetch settles. Pass `enabled: false` to skip fetching entirely
 * (e.g. off the /live route, where the sticky bar shows the Next Event state).
 */
export function useLiveTicker({
  enabled = true,
  initialData,
}: { enabled?: boolean; initialData?: TickerResult } = {}) {
  const searchParams = useSearchParams();
  const partner = searchParams.get("partner");

  // Seed from server-fetched data (when a page prefetches it) so the first
  // paint already has matches instead of waiting for the post-hydration fetch.
  const [matches, setMatches] = useState<TickerMatch[]>(initialData?.matches ?? []);
  const [loaded, setLoaded] = useState(Boolean(initialData));

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
        // keep last-known on transient errors
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
    return [...matches].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
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

/** Where to send viewers when a match has no stream link of its own. */
export const PBTV_WATCH_URL =
  "https://www.pickleballtv.com/?utm_source=ppatour&utm_medium=website&utm_campaign=live&utm_content=match-watch";

/** A match's own live/archived stream link, falling back to PickleballTV. */
export function matchWatchUrl(m: TickerMatch): string {
  return m.watchUrl || PBTV_WATCH_URL;
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
