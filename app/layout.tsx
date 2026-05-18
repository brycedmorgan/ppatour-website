import type { Metadata } from "next";
import { Geist, Oswald } from "next/font/google";
import "./globals.css";
import { ScoreTicker } from "@/components/global/ScoreTicker";
import { Header } from "@/components/global/Header";
import { SiteFooter } from "@/components/global/SiteFooter";
import { CookieBanner } from "@/components/global/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
      className={`${geistSans.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ppa-ink text-white">
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
