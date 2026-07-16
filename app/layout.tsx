import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TopBar } from "@/components/global/TopBar";
import { SiteFooter } from "@/components/global/SiteFooter";
import { CookieBanner } from "@/components/global/CookieBanner";
import { StickyBuyBar } from "@/components/global/StickyBuyBar";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

/* Official brand font (Carvana PPA Tour brand guide): Gotham, used for both
   body and headlines (Gotham Black). Single-typeface system. */
const gotham = localFont({
  variable: "--font-gotham",
  display: "swap",
  src: [
    { path: "./fonts/Gotham-Book.otf", weight: "400", style: "normal" },
    { path: "./fonts/Gotham-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Gotham-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Gotham-Black.ttf", weight: "900", style: "normal" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ppatour-website.vercel.app"),
  title: {
    default: "Carvana PPA Tour — The Pro Tour of Pickleball",
    template: "%s · Carvana PPA Tour",
  },
  description:
    "The best content, scores, and streaming experience in professional pickleball. Watch live, follow the pros, and plan your trip to every main-tour stop.",
  openGraph: {
    type: "website",
    siteName: "Carvana PPA Tour",
    title: "Carvana PPA Tour — The Pro Tour of Pickleball",
    description:
      "Live scores, the points race, the 2026–27 schedule, and trip guides for every main-tour stop.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carvana PPA Tour",
    description:
      "The Pro Tour of Pickleball — live scores, the points race, and every main-tour stop.",
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
      className={`${gotham.variable} h-full antialiased`}
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
        <StickyBuyBar />
        <CookieBanner />
        <ScrollReveal />
      </body>
    </html>
  );
}
