"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Meta Pixel, loaded only when NEXT_PUBLIC_META_PIXEL_ID is set (the active
 * "PPA - Meta Pixel" in the PPAtour ad account). Consent-gated with the same
 * localStorage key the cookie banner writes: consent starts revoked unless
 * previously granted, and CookieBanner flips it via fbq("consent", …).
 *
 * PageView fires on load and on every client-side route change.
 * OutboundClickTracker fires the TicketClick / RegisterClick custom events.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function MetaPixel() {
  const pathname = usePathname();
  const loaded = useRef(false);

  useEffect(() => {
    // Skip the first render — the init script below fires the initial PageView.
    if (!PIXEL_ID) return;
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  if (!PIXEL_ID) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','https://connect.facebook.net/en_US/fbevents.js');
        var stored = null;
        try { stored = localStorage.getItem('ppa-cookie-consent'); } catch (e) {}
        fbq('consent', stored === 'granted' ? 'grant' : 'revoke');
        fbq('init', '${PIXEL_ID}');
        fbq('track', 'PageView');
      `}
    </Script>
  );
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}
