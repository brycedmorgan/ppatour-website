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
const inflight = new Map<string, { p: Promise<PlayerHistory | null>; at: number }>();

function load(name: string): Promise<PlayerHistory | null> {
  const hit = inflight.get(name);
  let p = hit && Date.now() - hit.at < TTL_MS ? hit.p : undefined;
  if (!p) {
    p = fetch(`/api/player-history/?name=${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: PlayerHistory | null) =>
        d && Array.isArray(d.events) && Array.isArray(d.matches) ? { ...d, faces: d.faces ?? {} } : null,
      )
      .catch(() => null);
    p.then((d) => {
      if (!d || (d.events.length === 0 && d.matches.length === 0)) inflight.delete(name);
    });
    inflight.set(name, { p, at: Date.now() });
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
    });
    return () => {
      alive = false;
    };
  }, [name, excludeEventId, reqKey]);

  const data = state?.key === reqKey ? state.data : null;
  return data && (data.events.length > 0 || data.matches.length > 0) ? data : null;
}
