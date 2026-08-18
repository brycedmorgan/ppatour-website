"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Who this fan follows. Device-local, no account (Bryce, 8/18: no login in v1).
 *
 * The whole feature works without an identity — a follow list plus a push
 * subscription is enough to send "Anna Leigh's draw just dropped" to this
 * phone. What it costs is cross-device sync, which nobody has asked for yet and
 * which a signup wall would trade for a large share of installs.
 *
 * The name is stored beside the slug on purpose: the Following screen and the
 * notification copy both need it, and neither should have to fetch a roster to
 * render a list the fan already chose.
 *
 * ⚠ The list is ALSO mirrored to the push subscription row on the server
 * (`/api/push/subscribe`), because the sender has to know who to notify. The
 * device stays the source of truth; the server copy is a routing table keyed by
 * push endpoint, not a user record.
 */
export type Followed = { slug: string; name: string };

const KEY = "ppa-follows";
/** Same-tab change signal — the `storage` event only fires in OTHER tabs. */
const EVENT = "ppa-follows-changed";

export function readFollows(): Followed[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (f): f is Followed => Boolean(f) && typeof f.slug === "string" && typeof f.name === "string",
    );
  } catch {
    return [];
  }
}

function write(next: Followed[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — the list lives for this session only */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

/**
 * The follow list, live. Returns an empty list on the server and on the first
 * client render — localStorage is not readable during hydration without
 * mismatching the server HTML.
 */
export function useFollows() {
  const [follows, setFollows] = useState<Followed[]>([]);

  useEffect(() => {
    const sync = () => setFollows(readFollows());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((entry: Followed) => {
    const current = readFollows();
    const next = current.some((f) => f.slug === entry.slug)
      ? current.filter((f) => f.slug !== entry.slug)
      : [...current, entry];
    write(next);
    return next;
  }, []);

  const isFollowing = useCallback(
    (slug: string) => follows.some((f) => f.slug === slug),
    [follows],
  );

  return { follows, toggle, isFollowing };
}
