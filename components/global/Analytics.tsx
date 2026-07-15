import Script from "next/script";

/**
 * GA4 via gtag.js, loaded only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set
 * (production stream at launch; leave unset locally so dev traffic never
 * reports). Consent Mode v2: analytics_storage defaults to denied unless the
 * visitor previously accepted via the cookie banner — CookieBanner.tsx flips
 * consent with gtag("consent", "update", …). Until granted, GA4 sends only
 * cookieless modeling pings.
 *
 * Since checkout and registration live off-site (Tixr /
 * pickleballtournaments.com), outbound CTA clicks ARE our conversions —
 * OutboundClickTracker.tsx reports them.
 */
export const GA_CONSENT_KEY = "ppa-cookie-consent";

export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id) return null;

  return (
    <>
      <Script id="ga-consent-init" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          var stored = null;
          try { stored = localStorage.getItem("${GA_CONSENT_KEY}"); } catch (e) {}
          gtag("consent", "default", {
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied",
            analytics_storage: stored === "granted" ? "granted" : "denied",
          });
          gtag("js", new Date());
          gtag("config", "${id}");
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
    </>
  );
}
