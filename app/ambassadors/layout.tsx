import type { Metadata } from "next";
import "./ambassadors.css";

/**
 * Private ambassador area. `noindex, nofollow` here plus the X-Robots-Tag from
 * proxy.ts and the robots.ts disallow; never in the sitemap or nav. The
 * marketing chrome is hidden by a scoped rule in ambassadors.css (which only
 * loads here), not in the root layout — so the rest of the site keeps its
 * static rendering.
 *
 * Fonts are loaded by their real family names (not next/font's hashed names) so
 * stamp.js can `document.fonts.load('700 48px "Barlow Condensed"')` before it
 * draws a code onto a graphic.
 */
export const metadata: Metadata = {
  title: "Ambassador Dashboard · PPA Tour",
  robots: { index: false, follow: false, nocache: true },
};

export default function AmbassadorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="amb">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
      />
      {children}
    </div>
  );
}
