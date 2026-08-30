import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { TopBar } from "@/components/global/TopBar";
import { SiteFooter } from "@/components/global/SiteFooter";
import { CookieBanner } from "@/components/global/CookieBanner";
import { StickyBuyBar } from "@/components/global/StickyBuyBar";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Analytics } from "@/components/global/Analytics";
import { OutboundClickTracker } from "@/components/global/OutboundClickTracker";
import { MetaPixel } from "@/components/global/MetaPixel";
import { MarketingTags } from "@/components/global/MarketingTags";
import { AccessibilityWidget } from "@/components/global/AccessibilityWidget";
import { AppChrome } from "@/components/app/AppChrome";
import { JackalopeAnalytics } from "@/components/global/JackalopeAnalytics";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_INDEXABLE, SITE_URL } from "@/lib/site";

/* Official brand font (Carvana PPA Tour brand guide): Gotham, used for both
   body and headlines (Gotham Black). Single-typeface system. */
const gotham = localFont({
  variable: "--font-gotham",
  display: "swap",
  src: [
    { path: "./fonts/Gotham-Book.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Gotham-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Gotham-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Gotham-Black.woff2", weight: "900", style: "normal" },
  ],
});

/* Optional per-event display serif. Cormorant Garamond is the Nationals
   brand-guide serif (it sets the event's own wordmark); events opt in via
   `brand.font: "cormorant"` and it drives `--font-event-serif` on their page
   only — the tour-wide system stays single-typeface Gotham.
   `preload: false` — only Nationals-style branded events use it, so it must
   NOT preload on every page (it was pulling a 1.2 MB TTF site-wide). Now a
   Latin-subset woff2 (~30 KB), fetched only when a page actually renders it. */
const cormorant = localFont({
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
  src: [{ path: "./fonts/CormorantGaramond.woff2", style: "normal" }],
});

/**
 * `viewport-fit=cover` + the navy theme colour are what make an installed
 * window look like an app rather than a web page in a frame: the status bar
 * and the home-indicator area paint brand navy instead of white, and the app
 * chrome can then use `env(safe-area-inset-*)` to stay clear of both.
 */
export const viewport: Viewport = {
  themeColor: "#0c2b44",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  robots: SITE_INDEXABLE ? undefined : { index: false, follow: false },
  /**
   * Self-referencing canonical on every page, resolved against `metadataBase`
   * (NEXT_PUBLIC_SITE_URL). The site emitted no canonical tag at all until now.
   *
   * That was survivable while it was noindex. It stopped being survivable the
   * moment the cutover env vars went in: the site is live and indexable on
   * ppatour-website.vercel.app while DNS still points ppatour.com at the old
   * WordPress install, so without this Google is free to index the vercel.app
   * hostname as the real one and we spend the launch competing with our own
   * staging domain. With it, every page served from anywhere says "the
   * canonical version of this is www.ppatour.com/<path>".
   *
   * `"./"` is relative — Next resolves it per-route against metadataBase, so
   * this is one line rather than a canonical on 1,174 pages. A page that needs
   * a different canonical (a syndicated article, say) overrides it in its own
   * `alternates`.
   */
  alternates: { canonical: "./" },
  /**
   * iOS Add to Home Screen. Safari ignores the manifest's `display` and
   * `short_name` — these three keys are what give the installed icon its name
   * and open it without Safari's chrome. `startupImage` is deliberately unset;
   * without a full set of per-device splash screens iOS just shows navy, which
   * is the right first frame anyway.
   */
  appleWebApp: {
    capable: true,
    title: "PPA Tour",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/app-icons/apple-touch-icon.png",
  },
  title: {
    default: "Carvana PPA Tour — The Pro Tour of Pickleball",
    template: "%s · Carvana PPA Tour",
  },
  description:
    "The best content, scores, and streaming experience in professional pickleball. Watch live, follow the pros, and plan your trip to every tour stop.",
  openGraph: {
    type: "website",
    siteName: "Carvana PPA Tour",
    title: "Carvana PPA Tour — The Pro Tour of Pickleball",
    description:
      "Live scores, the points race, the 2026–27 schedule, and trip guides for every tour stop.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@PPAtour",
    creator: "@PPAtour",
    title: "Carvana PPA Tour",
    description:
      "The Pro Tour of Pickleball — live scores, the points race, and every tour stop.",
  },
};

/**
 * Site-wide structured data — the publisher identity every page carries.
 *
 * - `SportsOrganization` was previously emitted ONLY on the homepage
 *   (`HomeContent`) and, worse, hardcoded `ppatour-website.vercel.app` — so the
 *   org entity pointed at the staging domain and no interior page carried it at
 *   all. It lives here now, once, off `SITE_URL`.
 * - `WebSite` + `SearchAction` claims the sitelinks search box: the `/search`
 *   route already exists, so this is nearly free.
 * - `@id` refs tie the two nodes together (and let per-page schema reference the
 *   org later without redefining it).
 */
const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SportsOrganization",
      "@id": `${SITE_URL}/#organization`,
      name: "Carvana PPA Tour",
      alternateName: "Professional Pickleball Association",
      sport: "Pickleball",
      url: SITE_URL,
      logo: `${SITE_URL}/ppa/logos/ppa-horizontal-blue.svg`,
      sameAs: [
        "https://www.instagram.com/ppatour",
        "https://x.com/ppatour",
        "https://www.youtube.com/channel/UCSP6HlrMmRqogym2aHBPHpw",
        "https://www.tiktok.com/@officialppatour",
        "https://www.facebook.com/OfficialPPATour",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Carvana PPA Tour",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${gotham.variable} ${cormorant.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: browser extensions (Grammarly, Dashlane,
          ColorZilla, …) inject attributes on <body> before React hydrates. */}
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col bg-ppa-paper font-sans text-ppa-navy"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }}
        />
        <TopBar />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        {/* Suspense: StickyBuyBar reads useSearchParams (?partner=) via
            useLiveTicker, which needs a boundary to prerender. */}
        <Suspense fallback={null}>
          <StickyBuyBar />
        </Suspense>
        {/* Installed-app chrome — renders nothing in a browser tab. */}
        <AppChrome />
        <CookieBanner />
        <ScrollReveal />
        <Analytics />
        <MetaPixel />
        <MarketingTags />
        <OutboundClickTracker />
        {/**
         * Vercel Web Analytics + Speed Insights.
         *
         * Deliberately NOT behind the consent banner or the production gate,
         * unlike everything above: both are cookieless and collect no personal
         * data, which is the point of running them alongside GA4 rather than
         * instead of it —
         *   - Web Analytics counts the traffic GA4 loses to Decline and to ad
         *     blockers, so launch day has an honest denominator.
         *   - Speed Insights is real-user Core Web Vitals per route. GA4 cannot
         *     report that, and it's what /rankings and the open mobile-LCP
         *     issue actually need measured.
         * Running on previews too is correct here — that's where regressions
         * get caught before they reach the domain.
         */}
        <VercelAnalytics />
        <SpeedInsights />
        {/* Pickleball Inc's own first-party pipe — the portfolio view GA4
            cannot give us, because its property holds five of our sites at
            once. Cookieless, so it sits outside the consent banner for the
            same reason the two above do; see the component for the mechanism
            and for when that stops being true. */}
        <JackalopeAnalytics />
        {/* UserWay accessibility toolbar. Sits here, outside the consent and
            production gates, for the same reason the two above do — see the
            component for why gating an accessibility widget behind cookie
            consent would defeat it. */}
        <AccessibilityWidget />
      </body>
    </html>
  );
}
