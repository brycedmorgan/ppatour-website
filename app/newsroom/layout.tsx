import type { Metadata } from "next";
import "./newsroom.css";

/**
 * The Newsroom dashboard: write and edit news posts, and pick the
 * pickleball.com articles on the home page. Editors only (proxy.ts +
 * requireEditor), noindex at every layer, never in the sitemap or nav.
 */
export const metadata: Metadata = {
  title: { default: "Newsroom · PPA Tour", template: "%s · Newsroom" },
  robots: { index: false, follow: false, nocache: true },
};

export default function NewsroomLayout({ children }: { children: React.ReactNode }) {
  return <div className="nr bg-ppa-paper text-ppa-navy">{children}</div>;
}
