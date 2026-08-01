"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { ANALYTICS_ENABLED, CONSENT_KEY, CONSENT_EVENT } from "@/lib/analytics";

/**
 * The marketing tags the CURRENT ppatour.com runs that this rebuild didn't
 * carry over. Found by auditing the live site + its GTM container
 * (GTM-KG5F7W6) before launch; each would have gone dark at cutover with
 * nothing to show why.
 *
 *   TikTok pixel      D41T2AJC77U69K483TK0  — loaded directly on the live site
 *   Microsoft Clarity vx8dxhws9k            — session replay + heatmaps
 *   Hotjar            3598441               — fires inside the GTM container
 *
 * This site loads gtag directly rather than a GTM container (deliberate — one
 * fewer moving part, and Consent Mode is configured in code), so anything the
 * container used to fire has to be declared here instead.
 *
 * ── Rules ────────────────────────────────────────────────────────────────
 * Every tag is env-gated, production-gated AND consent-gated:
 *   - no env var  -> the tag does not exist. Nothing ships turned on; whoever
 *     owns the account sets the ID in Vercel when they want it live.
 *   - not the production domain -> nothing loads (lib/analytics.ts).
 *   - no consent  -> nothing loads. Unlike GA4, none of these have a cookieless
 *     mode, so the only correct default is "off".
 *
 * ⚠ Clarity and Hotjar are session-replay tools: they record what real people
 * do on the page. They stay behind all three gates precisely because turning
 * them on is a privacy decision, not a deploy decision. Do not hardcode these
 * IDs to skip that step.
 *
 * Consent is read reactively rather than once at mount, so clicking Accept in
 * the banner loads the tags immediately. A one-shot read would have left them
 * dark until the next full page load — and in an App Router SPA, in-app
 * navigation is not a full page load, so "next page" could be never.
 */
function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}

export function MarketingTags() {
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

  const tiktok = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  const clarity = process.env.NEXT_PUBLIC_CLARITY_ID;
  const hotjar = process.env.NEXT_PUBLIC_HOTJAR_ID;

  if (!ANALYTICS_ENABLED || !granted) return null;
  if (!tiktok && !clarity && !hotjar) return null;

  return (
    <>
      {tiktok && (
        <Script id="tiktok-pixel" strategy="lazyOnload">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.instance=function(t){var e=ttq._i[t]||[];for(var n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
              ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";
                ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};
                var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=r+"?sdkid="+e+"&lib="+t;
                var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${tiktok}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {clarity && (
        <Script id="ms-clarity" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarity}");
          `}
        </Script>
      )}

      {hotjar && (
        <Script id="hotjar" strategy="lazyOnload">
          {`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${Number(hotjar) || 0},hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      )}
    </>
  );
}

declare global {
  interface Window {
    ttq?: { load: (id: string) => void; page: () => void; track: (...a: unknown[]) => void };
    clarity?: (...args: unknown[]) => void;
    hj?: (...args: unknown[]) => void;
  }
}
