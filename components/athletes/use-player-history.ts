"use client";

import { useEffect, useState } from "react";
import type { PlayerHistory } from "@/lib/player-history";

/**
 * One /api/player-history request per name per page view, however many
 * components ask. The profile reads it twice — the Latest Result card in the
 * right column and the Recent Results band below — and two fetches of the same
 * cold history would each wake the upstream draws.
 *
 * A failed or EMPTY answer is dropped from the memo so a later mount can
 * retry — the route says empty can mean an upstream 429 on a cold pull — and
 * a good one is held for {@link TTL_MS}: the installed app keeps one JS
 * context alive for hours.
 */
const TTL_MS = 10 * 60 * 1000;
/**
 * A pro in this week's stop (`live`) is re-asked this often, so an open
 * profile picks up each finished match (Wesley, 11/18). The route's CDN copy
 * is a minute old at most, so polling faster would only re-read it.
 */
const LIVE_MS = 60 * 1000;
const inflight = new Map<string, { p: Promise<PlayerHistory | null>; at: number; ttl: number }>();

function load(name: string): Promise<PlayerHistory | null> {
  const hit = inflight.get(name);
  let p = hit && Date.now() - hit.at < hit.ttl ? hit.p : undefined;
  if (!p) {
    p = fetch(`/api/player-history/?name=${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: PlayerHistory | null) =>
        d && Array.isArray(d.events) && Array.isArray(d.matches) ? { ...d, faces: d.faces ?? {} } : null,
      )
      .catch(() => null);
    const entry = { p, at: Date.now(), ttl: TTL_MS };
    p.then((d) => {
      if (!d || (d.events.length === 0 && d.matches.length === 0)) inflight.delete(name);
      else if (d.live) entry.ttl = LIVE_MS - 1000;
    });
    inflight.set(name, entry);
  }
  return p;
}

/** null until loaded (and when there is nothing to show). */
export function usePlayerHistory(name: string, excludeEventId?: string): PlayerHistory | null {
  // Stored WITH the request it answers: the app reuses this component when
  // only ?name= changes, and the last player's results must never show under
  // the next player's name while (or if) their fetch is in flight.
  const reqKey = `${name}\u0000${excludeEventId ?? ""}`;
  const [state, setState] = useState<{ key: string; data: PlayerHistory } | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () =>
      load(name).then((d) => {
        if (!alive || !d) return;
        setState({
          key: reqKey,
          data: {
            events: d.events.filter((e) => e.eventId !== excludeEventId),
            matches: d.matches.filter((m) => m.eventId !== excludeEventId),
            faces: d.faces,
          },
        });
        // Mid-stop: ask again in a minute (the memo turns two components'
        // polls into one request).
        if (d.live) timer = setTimeout(run, LIVE_MS);
      });
    run();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [name, excludeEventId, reqKey]);

  const data = state?.key === reqKey ? state.data : null;
  return data && (data.events.length > 0 || data.matches.length > 0) ? data : null;
}
