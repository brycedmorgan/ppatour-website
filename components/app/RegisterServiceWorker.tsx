"use client";

import { useEffect } from "react";
import { syncSubscription } from "@/components/app/push";

/**
 * Registers `/sw.js`, and only inside the installed app.
 *
 * ⚠ A service worker is origin-wide once registered, so registering it from
 * every page would put a worker in front of ppatour.com for every visitor on
 * earth. The worker itself is deliberately harmless (it never caches HTML), but
 * the blast radius of a mistake there is the whole marketing site. App-mode
 * only keeps it to people who chose to install.
 *
 * Push needs the worker, so this must run before anything on the Following
 * screen can offer alerts.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        // Re-send the follow list on every launch: a subscription can be
        // rotated by the browser, and the server copy would then be stale.
        if (!cancelled) void syncSubscription();
      })
      .catch(() => {
        /* registration failing costs offline + push, never the app itself */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
