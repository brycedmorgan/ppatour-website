"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { ANALYTICS_ENABLED, CONSENT_KEY, CONSENT_EVENT } from "@/lib/analytics";

/**
 * Travelpayouts Emerald (aka "Drive") — the affiliate monetization script that
 * rewrites qualifying outbound travel links (flights / hotels / cars / tours)
 * into affiliate links and injects Travelpayouts' own travel widgets where
 * visitors click most. `emrldtp.com` is Travelpayouts' own serving domain
 * (emrldtp = Emerald + TP); the account is encoded in the file name
 * (NTYwMzU0 = base64 "560354") and the `?t=` param.
 *
 * ── Why this is NOT in the root layout / MarketingTags ────────────────────
 * Scoped to /vacations DELIBERATELY. Bryce's call (8/9): Emerald runs on the
 * travel pages only, so its injected widgets never appear on the sports pages
 * — which would be the "ad inventory on ppatour.com" the 7/29 ruling put off
 * the table. Mounted in app/vacations/layout.tsx, the same place VacationsTrack
 * lives, so it can never leak site-wide.
 *
 * ── Gated exactly like the other third-party tags ─────────────────────────
 *   - not the production domain -> nothing loads (ANALYTICS_ENABLED, from
 *     lib/analytics.ts). Keeps it off every preview/staging deploy.
 *   - no cookie consent -> nothing loads. Emerald sets affiliate-attribution
 *     cookies, so it stays behind the banner like Clarity/TikTok/Hotjar.
 * Consent is read reactively (useSyncExternalStore) so clicking Accept loads
 * it immediately, without a full page reload — same pattern as MarketingTags.
 *
 * `data-cmp-ab="2"` is Travelpayouts' own consent auto-block hook; kept as
 * they ship it, on top of our own gate.
 */
function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}

export function TravelMonetization() {
  const granted = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(CONSENT_KEY) === "granted";
      } catch {
        return false;
      }
    },
    () => false, // server + first paint: never assume consent
  );

  if (!ANALYTICS_ENABLED || !granted) return null;

  return (
    <Script
      id="travelpayouts-emerald"
      src="https://emrldtp.com/NTYwMzU0.js?t=560354"
      strategy="lazyOnload"
      data-cmp-ab="2"
    />
  );
}
