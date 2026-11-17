import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { newsroomBase, newsroomUrlKey } from "@/lib/newsroom/session";
import { BaseProvider } from "./_components/BaseContext";
import "./newsroom.css";

/**
 * The Newsroom dashboard: write and edit news posts, and pick the
 * pickleball.com articles on the home page. Editors only (proxy.ts +
 * requireEditor + a required second step), served ONLY at the secret address
 * in NEWSROOM_URL_KEY, noindex at every layer, never in the sitemap, nav or
 * robots.txt (listing it there would publish it).
 */
export const metadata: Metadata = {
  title: { default: "Newsroom · PPA Tour", template: "%s · Newsroom" },
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function NewsroomLayout({ children }: { children: React.ReactNode }) {
  // No key configured: the dashboard does not exist.
  if (!newsroomUrlKey()) notFound();
  return (
    <div className="nr bg-ppa-paper text-ppa-navy">
      <BaseProvider base={newsroomBase()}>{children}</BaseProvider>
    </div>
  );
}
