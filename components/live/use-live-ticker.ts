"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getNextTournament, isTournamentLive, nowMs } from "@/lib/placeholder-data";
import type {
  TickerMatch,
  TickerResult,
  TickerTeam,
  TickerTournament,
} from "@/lib/ticker-api";

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
/**
 * How soon to try again after a FAILED fetch, as opposed to a successful one
 * that simply found nothing.
 *
 * ⚠ A SINGLE FAILED FIRST FETCH USED TO COST 15 SECONDS OF WRONG CHROME. The
 * poll was a fixed `setInterval`, and a non-ok response just returned — so on
 * the opening morning of Nationals the top bar read "Next Event · Veolia
 * Pickleball National Championships" while two matches were live on court.
 * Measured end to end in a browser: server HTML at 1.0s, and the live score did
 * not appear until 19.2s, because attempt one 500'd and attempt two was a full
 * interval behind it.
 *
 * Only a FAILURE retries fast. A successful empty response means nothing is on,
 * which is a real answer and must not be re-asked every two seconds.
 */
const RETRY_MS = 2000;
/** Failed attempts before we stop showing a spinner and admit we have nothing. */
const RETRIES_BEFORE_EMPTY = 3;

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
  // Which tournament these matches belong to. The site chrome names it — the
  // /live marquee used to carry a hardcoded "Veolia Atlanta Pickleball
  // Championships" instead, which is a claim about which event is on.
  const [tournament, setTournament] = useState<TickerTournament | null>(
    initialData?.tournament ?? null,
  );
  const [loaded, setLoaded] = useState(Boolean(initialData));

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    /**
     * ⚠ THE TRAILING SLASH IS DELIBERATE. `trailingSlash: true` (next.config)
     * makes "/api/ticker" a 308 to "/api/ticker/", so every poll from every open
     * tab paid a redirect before reaching the route — the same trap the rankings
     * fetch hit on 8/5.
     */
    const url = partner
      ? `/api/ticker/?partner=${encodeURIComponent(partner)}`
      : "/api/ticker/";

    const load = async () => {
      let ok = false;
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as TickerResult;
          if (!active) return;
          /**
           * ⚠ HTTP 200 IS NOT THE SAME AS "THE FEED ANSWERED". The route
           * serves a JSON body whatever happens upstream, so a timeout arrived
           * here as a perfectly good response carrying an empty list — and this
           * wrote it straight over five live matches. That is the "No matches on
           * court right now" Wesley saw appear minutes into a session.
           *
           * `ok` is the payload's own word for whether the upstream call
           * worked. A failure is now treated exactly like a network error: keep
           * what we already have on screen and retry in RETRY_MS.
           */
          if (data.ok) {
            setMatches(data.matches);
            setTournament(data.tournament);
            ok = true;
          }
        }
      } catch {
        // keep last-known on transient errors
      }
      if (!active) return;

      if (ok) {
        failures = 0;
        setLoaded(true);
      } else {
        failures += 1;
        // Only admit we have nothing once retrying has genuinely not worked —
        // marking it loaded on the first failure is what let the rail say "no
        // matches on court" when the truth was "we could not ask".
        if (failures >= RETRIES_BEFORE_EMPTY) setLoaded(true);
      }

      /**
       * Self-scheduling rather than setInterval, so the delay can depend on
       * whether the last attempt actually worked.
       *
       * ⚠ THE FAST RETRY IS BUDGETED, NOT INDEFINITE. It exists to recover from
       * the FIRST bad fetch quickly; once the budget is spent the feed is
       * genuinely down (or the ?partner= is one the API won't serve) and a
       * 2-second poll from every open tab is a load problem of our own making.
       * After that it settles back to the normal cadence and keeps trying.
       */
      const spent = failures >= RETRIES_BEFORE_EMPTY;
      timer = setTimeout(load, ok || spent ? POLL_MS : RETRY_MS);
    };

    void load();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, partner]);

  const ordered = useMemo(() => {
    if (!enabled) return [] as TickerMatch[];
    return [...matches].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [enabled, matches]);

  return { ordered, loaded, tournament: enabled ? tournament : null };
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

/**
 * Which service a watch link actually opens.
 *
 * ⚠ THE CARD USED TO PRINT THE PICKLEBALLTV MARK ON EVERY LIVE MATCH, whatever
 * the link went to. Wesley, 8/31: "the watch URL is showing a pickleball.com
 * logo, but the match is live on YouTube." Measured against the live Nationals
 * feed the same minute: of the six matches carrying a watch link, SIX were
 * `youtube.com/live/…` and none were PickleballTV — so the mark was wrong on
 * every card that had one, sending viewers to YouTube under another broadcaster's
 * logo.
 *
 * Derived from the resolved URL rather than from a field, so a match with no
 * link of its own — which `matchWatchUrl` sends to PickleballTV — correctly
 * shows the PickleballTV mark. Anything we don't recognise gets a neutral
 * "Watch" rather than a guessed brand.
 */
export type WatchPlatform = "youtube" | "pbtv" | "other";

export function watchPlatform(url: string): WatchPlatform {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "other";
  }
  if (host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com")) {
    return "youtube";
  }
  if (host === "pickleballtv.com" || host.endsWith(".pickleballtv.com")) return "pbtv";
  return "other";
}

/** The PickleballTV live stream — the fallback when the first match on the
 *  rail has no live link of its own. */
export const PBTV_STREAM_URL = "https://stream.pickleballtv.com/";

/**
 * Where a "Watch Live" button sends viewers (Wesley, 9/1):
 *
 *   1. the FIRST match on the score-ticker rail, if it carries a stream link
 *   2. stream.pickleballtv.com
 *
 * ⚠ THE BUTTON AND THE RAIL HAVE TO NAME THE SAME MATCH, so pass the rail's own
 * `ordered` list — the array LiveScoreTicker maps over, sorted live → up next →
 * final. `matches[0]` is then literally the leftmost card on screen. Handing
 * this a differently sorted list would put a button labelled "Watch Live" next
 * to a card it does not open.
 *
 * ⚠ THE COURT NAME IS NO LONGER PART OF THIS. It used to hunt for a live match
 * on Championship Court (and, before that, Grandstand), so the button skipped
 * past whatever the rail was leading with whenever the marquee court's own link
 * was missing or its court string was spelled differently upstream. The rail
 * already decides which match is featured; this follows it.
 *
 * The PickleballTV stream carries whatever the broadcast is showing, which is
 * the honest answer when the first match has no link of its own.
 */
export function liveWatchUrl(matches: TickerMatch[]): string {
  return matches[0]?.watchUrl || PBTV_STREAM_URL;
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

/**
 * Preview only: the `?offset=` milliseconds /live pins in the URL to shift the
 * clock. 0 everywhere else, which is the wall clock.
 *
 * ⚠ THIS READS `window.location`, NOT `useSearchParams`, AND THAT IS A BUILD
 * REQUIREMENT. `useTourIsLive` is called by TopBar, which lives in the root
 * layout and therefore renders on every route — and a client component calling
 * `useSearchParams` inside a prerendered page must sit in a Suspense boundary or
 * the build FAILS: "useSearchParams() should be wrapped in a suspense boundary
 * at page /watch/tv". TopBar cannot be wrapped, because the value decides which
 * chrome stack it returns.
 *
 * `useSyncExternalStore` with a never-firing subscribe is the sanctioned way to
 * read a client-only value without a hydration mismatch — the same pattern
 * CookieBanner uses. The server snapshot is 0, which is production's real answer
 * anyway; only /live carries an offset, and it picks it up on hydration.
 */
const subscribeNever = () => () => {};

function readOffset(): number {
  const raw = Number(new URLSearchParams(window.location.search).get("offset"));
  return Number.isFinite(raw) ? raw : 0;
}

export function usePreviewClockOffset(): number {
  return useSyncExternalStore(subscribeNever, readOffset, () => 0);
}

/**
 * Is a tour stop being played at this moment — the same calendar check the
 * homepage flips on (`isTournamentLive`), evaluated client-side so the site
 * chrome can follow it.
 *
 * ⚠ THIS EXISTS BECAUSE THE CHROME USED TO KEY OFF THE PATHNAME. TopBar showed
 * the broadcast stack — marquee plus the big score rail — whenever the URL was
 * /live, so previewing `?in=30` put the full live chrome on screen thirty
 * seconds BEFORE the page it sits above went live. The countdown was still
 * running underneath it.
 *
 * ⚠ AND IT READS THE SIMULATED CLOCK, WHICH IS THE ONLY WAY A PREVIEW CAN BE
 * COHERENT. The score feed answers for right now and cannot pretend it is a
 * different day, so during a simulation the chrome is driven by the calendar
 * (which can) and `simulating` lets consumers suppress feed-driven state until
 * the simulated clock crosses first serve. In production the offset is 0 and
 * this is simply "is the tour on".
 *
 * Re-evaluated every second so the chrome flips at the boundary on its own,
 * with no reload.
 */
export function useTourIsLive(): { live: boolean; simulating: boolean; now: number } {
  const offsetMs = usePreviewClockOffset();
  // Seeded during render (not after mount) so the server and the first client
  // paint agree — otherwise the chrome would visibly swap height on every page
  // load during a tournament.
  const [now, setNow] = useState(() => nowMs(offsetMs));

  useEffect(() => {
    // Interval only — no immediate resync. Setting state straight in the effect
    // body is what `react-hooks/set-state-in-effect` is there to stop, and the
    // SSR seed is at most a second stale, which the first tick corrects.
    const id = window.setInterval(() => setNow(nowMs(offsetMs)), 1_000);
    return () => window.clearInterval(id);
  }, [offsetMs]);

  return {
    live: isTournamentLive(getNextTournament(now), now),
    simulating: offsetMs !== 0,
    now,
  };
}
