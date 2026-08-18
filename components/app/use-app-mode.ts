"use client";

import { useEffect, useState } from "react";

/**
 * Is this an installed app window, or a browser tab?
 *
 * One flag drives every app-vs-web difference on the site, so it lives in one
 * place. Three signals, in the order they can be trusted:
 *
 *   1. `display-mode: standalone` — the standard, and live: it flips if the
 *      visitor installs mid-session, so this subscribes rather than reads once.
 *   2. `navigator.standalone` — iOS Safari's own flag. Non-standard and iOS
 *      only, but it is the one that answers on older iPhones.
 *   3. `?source=pwa`, persisted — the manifest's `start_url` carries it. Some
 *      iOS versions report neither of the above inside a home-screen window,
 *      and one wrong answer means a fan sees the marketing footer and cookie
 *      banner in their app. Once seen, it is remembered for the session (NOT
 *      forever: a shared link with the param would otherwise brand that
 *      person's browser as an app install for good).
 *
 * ⚠ Returns `false` until mounted, on purpose. The server has no idea which
 * window it is rendering for, so app chrome may only ever appear after
 * hydration. Anything that returns different markup on the first client render
 * than the server produced is a hydration error.
 */
const SESSION_KEY = "ppa-app-mode";

function detect(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone) return true;
  try {
    if (new URL(window.location.href).searchParams.get("source") === "pwa") return true;
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function useAppMode(): boolean {
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    const apply = () => {
      const next = detect();
      setIsApp(next);
      // Published on <html> so plain CSS can hide web-only chrome without every
      // one of those components having to become a client component.
      document.documentElement.dataset.appMode = next ? "standalone" : "browser";
      if (next) {
        try {
          window.sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* private mode — the media query still answers */
        }
      }
    };
    apply();

    const mq = window.matchMedia?.("(display-mode: standalone)");
    mq?.addEventListener("change", apply);
    return () => mq?.removeEventListener("change", apply);
  }, []);

  return isApp;
}
