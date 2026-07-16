"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ppa-cookie-consent";
const CONSENT_EVENT = "ppa-cookie-consent-change";

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}

/**
 * Compliance-minimum cookie banner (§9.4). One-line, footer-anchored,
 * never overlays content. Dismissed state persists for 365 days.
 *
 * The stored value drives Google Consent Mode v2 (see Analytics.tsx):
 * "granted" enables analytics cookies; "denied" keeps GA4 on cookieless
 * modeling pings only. Accept grants; Manage declines (the most
 * privacy-preserving reading until a full preferences panel exists).
 */
export function CookieBanner() {
  const visible = useSyncExternalStore(
    subscribe,
    () => !localStorage.getItem(STORAGE_KEY),
    () => false,
  );

  function dismiss(consent: "granted" | "denied") {
    localStorage.setItem(STORAGE_KEY, consent);
    window.gtag?.("consent", "update", { analytics_storage: consent });
    window.fbq?.("consent", consent === "granted" ? "grant" : "revoke");
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-ppa-navy text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs">
        <span className="text-white/80">
          We use cookies for analytics.
        </span>
        <button
          type="button"
          onClick={() => dismiss("denied")}
          className="font-semibold text-white/60 hover:text-white"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => dismiss("granted")}
          className="ml-auto rounded-sm bg-ppa-yellow px-3 py-1 font-bold text-ppa-navy hover:bg-ppa-yellow/90"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
