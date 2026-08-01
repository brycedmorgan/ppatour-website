import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  robots: SITE_INDEXABLE ? undefined : { index: false, follow: false },
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
    title: "Carvana PPA Tour",
    description:
      "The Pro Tour of Pickleball — live scores, the points race, and every tour stop.",
  },
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
        <TopBar />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        {/* Suspense: StickyBuyBar reads useSearchParams (?partner=) via
            useLiveTicker, which needs a boundary to prerender. */}
        <Suspense fallback={null}>
          <StickyBuyBar />
        </Suspense>
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
      </body>
    </html>
  );
}
