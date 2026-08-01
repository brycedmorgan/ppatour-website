"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { CONSENT_KEY, CONSENT_EVENT } from "@/lib/analytics";

/* Both live in lib/analytics.ts — MarketingTags subscribes to the same
   event so Accept turns tags on immediately, without a page load. */
const STORAGE_KEY = CONSENT_KEY;

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
  const ref = useRef<HTMLDivElement>(null);

  // Publish the banner's height so other bottom-fixed chrome (the sticky
  // buy bar) can sit above it instead of underneath — on mobile both pin
  // to bottom-0 and the banner would otherwise cover the buy-tickets CTA.
  useEffect(() => {
    const root = document.documentElement;
    if (!visible) {
      root.style.setProperty("--cookie-banner-h", "0px");
      return;
    }
    const el = ref.current;
    const update = () =>
      root.style.setProperty("--cookie-banner-h", `${el?.offsetHeight ?? 0}px`);
    update();
    const ro = new ResizeObserver(update);
    if (el) ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.setProperty("--cookie-banner-h", "0px");
    };
  }, [visible]);

  function dismiss(consent: "granted" | "denied") {
    localStorage.setItem(STORAGE_KEY, consent);
    window.gtag?.("consent", "update", { analytics_storage: consent });
    window.fbq?.("consent", consent === "granted" ? "grant" : "revoke");
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }

  if (!visible) return null;

  return (
    <div ref={ref} className="fixed inset-x-0 bottom-0 z-40 bg-ppa-navy text-white">
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
