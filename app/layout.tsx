import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ScoreTicker } from "@/components/global/ScoreTicker";
import { Header } from "@/components/global/Header";
import { SiteFooter } from "@/components/global/SiteFooter";
import { CookieBanner } from "@/components/global/CookieBanner";

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
  title: {
    default: "PPA Tour — The Pro Tour of Pickleball",
    template: "%s · PPA Tour",
  },
  description:
    "The best content, brackets, and streaming experience in professional pickleball. Watch live, follow the pros, and find your next event.",
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
      <body className="flex min-h-full flex-col bg-ppa-paper font-sans text-ppa-navy">
        <div className="sticky top-0 z-50">
          <ScoreTicker />
          <Header />
        </div>
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CookieBanner />
      </body>
    </html>
  );
}
