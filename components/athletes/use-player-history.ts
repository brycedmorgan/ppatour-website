"use client";

import { useEffect, useState } from "react";
import type { PlayerHistory } from "@/lib/player-history";

/**
 * One /api/player-history request per name per page view, however many
 * components ask. The profile reads it twice — the Latest Result card in the
 * right column and the Recent Results band below — and two fetches of the same
 * cold history would each wake the upstream draws.
 *
 * A failed request is dropped from the memo so a later mount can retry.
 */
const inflight = new Map<string, Promise<PlayerHistory | null>>();

function load(name: string): Promise<PlayerHistory | null> {
  let p = inflight.get(name);
  if (!p) {
    p = fetch(`/api/player-history/?name=${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: PlayerHistory | null) =>
        d && Array.isArray(d.events) && Array.isArray(d.matches) ? { ...d, faces: d.faces ?? {} } : null,
      )
      .catch(() => null);
    p.then((d) => {
      if (!d) inflight.delete(name);
    });
    inflight.set(name, p);
  }
  return p;
}

/** null until loaded (and when there is nothing to show). */
export function usePlayerHistory(name: string, excludeEventId?: string): PlayerHistory | null {
  const [data, setData] = useState<PlayerHistory | null>(null);

  useEffect(() => {
    let alive = true;
    load(name).then((d) => {
      if (!alive || !d) return;
      setData({
        events: d.events.filter((e) => e.eventId !== excludeEventId),
        matches: d.matches.filter((m) => m.eventId !== excludeEventId),
        faces: d.faces,
      });
    });
    return () => {
      alive = false;
    };
  }, [name, excludeEventId]);

  return data && (data.events.length > 0 || data.matches.length > 0) ? data : null;
}
