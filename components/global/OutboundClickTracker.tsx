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
  // MATCHDAY now links to the two app stores, not matchday.app (which is a
  // parked domain — see lib/matchday.ts). Without these, every app-install
  // click would have stopped being counted the moment the links were fixed.
  "apps.apple.com",
  "play.google.com",
  "pickleballcentral.com",
  "pickleball.com",
  // NOTE: vacations.ppatour.com is deliberately NOT here any more. Pickleball
  // Vacations moved onto this site at /vacations (Aug 2026), so the funnel is
  // internal now — page views and checkout starts beacon to Jackalope from
  // lib/vacations/track.ts, which is strictly more than an outbound click ever
  // told us. `ppavacations.com` is gone with it: it was never ours, it is a
  // parked domain, and the /tour/travel CTA pointing at it is the bug this
  // move fixed.
  // PPA Pickleball Tour 2025 storefronts (/game). The click out is the only
  // thing measurable — the purchase happens on the platform.
  "store.steampowered.com",
  "store.playstation.com",
  "xbox.com",
  "nintendo.com",
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
      if (!anchor) return;

      let url: URL;
      try {
        url = new URL((anchor as HTMLAnchorElement).href);
      } catch {
        return;
      }

      const name = eventNameFor(url.hostname.replace(/^www\./, ""));
      if (!name) return;

      const params = {
        placement: url.searchParams.get("utm_content") ?? "untagged",
        campaign: url.searchParams.get("utm_campaign") ?? "untagged",
        destination: url.hostname,
        link_url: url.origin + url.pathname,
        page_path: window.location.pathname,
      };
      window.gtag?.("event", name, params);
      if (name === "ticket_click") window.fbq?.("trackCustom", "TicketClick", params);
      if (name === "register_click") window.fbq?.("trackCustom", "RegisterClick", params);
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
