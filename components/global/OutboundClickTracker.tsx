"use client";

import { useEffect } from "react";

/**
 * Conversion tracking for off-site commerce. Checkout (Tixr) and amateur
 * registration (pickleballtournaments.com) both happen off-site, so the
 * outbound click is the conversion this site can measure. One delegated
 * listener covers every placement — hero, sticky buy bar, ticket-tier cards,
 * footer — with no per-component wiring; the placement label is read from the
 * link's own utm_content param (already applied by lib/utm.ts).
 *
 * Events (mark the first two as key events in GA4):
 *   ticket_click    → tixr.com
 *   register_click  → pickleballtournaments.com
 *   partner_click   → PBTV, MATCHDAY, Pickleball Central, Pickleball.com
 */
const PARTNER_HOSTS = [
  "pickleballtv.com",
  "matchday.app",
  "pickleballcentral.com",
  "pickleball.com",
];

function eventNameFor(host: string): string | null {
  if (host.endsWith("tixr.com")) return "ticket_click";
  if (host.endsWith("pickleballtournaments.com")) return "register_click";
  if (PARTNER_HOSTS.some((h) => host === h || host.endsWith("." + h)))
    return "partner_click";
  return null;
}

export function OutboundClickTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!anchor || typeof window.gtag !== "function") return;

      let url: URL;
      try {
        url = new URL((anchor as HTMLAnchorElement).href);
      } catch {
        return;
      }

      const name = eventNameFor(url.hostname.replace(/^www\./, ""));
      if (!name) return;

      window.gtag("event", name, {
        placement: url.searchParams.get("utm_content") ?? "untagged",
        campaign: url.searchParams.get("utm_campaign") ?? "untagged",
        destination: url.hostname,
        link_url: url.origin + url.pathname,
        page_path: window.location.pathname,
      });
    }

    document.addEventListener("click", onClick, { capture: true });
    return () =>
      document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
