"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { ANALYTICS_ENABLED, CONSENT_KEY, CONSENT_EVENT } from "@/lib/analytics";

/**
 * Customer.io JavaScript snippet (Pickleball Inc. workspace — the same one
 * lib/customerio.ts writes lead-capture and volunteer submissions to).
 *
 * Why: lets email programs react to what people do on ppatour.com — e.g.
 * "viewed the Daytona page, didn't buy" → follow-up email. Retargeting people
 * who showed intent was the strongest result in the 10/7 email study
 * (17–26% click rate vs <1% for list blasts; ziff docs/EMAIL-STUDY-2026-10.md).
 *
 * Page views are recorded for people Customer.io can identify (email link
 * click-throughs, or anyone identified via the snippet); anonymous views merge
 * onto the profile when the visitor is later identified.
 *
 * Same three gates as MarketingTags: production domain only, a site ID must be
 * set, and the visitor must have clicked Accept. The site ID is public by
 * design (it ships in every Customer.io snippet); the Track API key stays
 * server-side in lib/customerio.ts.
 *
 * The snippet sends the initial page on load; client-side route changes are
 * sent with _cio.page() because App Router navigation is not a page load.
 */
function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}

export function CustomerioTracker({ siteId }: { siteId?: string }) {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const granted = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(CONSENT_KEY) === "granted";
      } catch {
        return false;
      }
    },
    () => false,
  );
  const on = ANALYTICS_ENABLED && granted && Boolean(siteId);

  useEffect(() => {
    if (!on) return;
    // First path is covered by the snippet's own page view on load.
    if (lastPath.current === null) {
      lastPath.current = pathname;
      return;
    }
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    window._cio?.page?.(window.location.href);
  }, [on, pathname]);

  if (!on) return null;

  return (
    <Script id="customerio-tracker" strategy="lazyOnload">
      {`
        var _cio = window._cio = window._cio || [];
        (function() {
          var a,b,c;a=function(f){return function(){_cio.push([f].concat(Array.prototype.slice.call(arguments,0)))}};
          b=["load","identify","sidentify","track","page","on","off"];for(c=0;c<b.length;c++){_cio[b[c]]=a(b[c])};
          var t = document.createElement('script'), s = document.getElementsByTagName('script')[0];
          t.async = true; t.id = 'cio-tracker';
          t.setAttribute('data-site-id', ${JSON.stringify(siteId)});
          t.setAttribute('data-use-array-params', 'true');
          t.setAttribute('data-use-in-app', 'false');
          t.src = 'https://assets.customer.io/assets/track.js';
          s.parentNode.insertBefore(t, s);
        })();
      `}
    </Script>
  );
}

declare global {
  interface Window {
    _cio?: unknown[] & {
      page?: (url: string, data?: Record<string, unknown>) => void;
      identify?: (attrs: Record<string, unknown>) => void;
      track?: (name: string, data?: Record<string, unknown>) => void;
    };
  }
}
