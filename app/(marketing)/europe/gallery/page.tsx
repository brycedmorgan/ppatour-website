import type { Metadata } from "next";
import { EuropeGallery } from "@/components/europe/EuropeGallery";
import { getEvents } from "@/lib/events-api";
import { EUROPE_SITE_URL, europeRobots } from "@/lib/europe-launch";
import { getEuropeGallery, sortAlbumsByEvent } from "@/lib/europe-gallery";

/**
 * The full PPA Tour Europe gallery (Payton, #ppa-tour-europe 10/2): every photo,
 * grouped by event, newest event first, each event headed by its Google Drive
 * folder name. Served at ppatoureurope.com/gallery (host rewrite in
 * next.config.ts). The /europe home shows 2 photos per event and links here.
 *
 * Runs itself: the Europe team adds a sub-folder per event to the Drive folder
 * and it appears here within the hour. See lib/europe-gallery.ts.
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "Gallery · PPA Tour Europe" },
  description: "Photos from every PPA Tour Europe stop.",
  alternates: { canonical: `${EUROPE_SITE_URL}/gallery` },
  openGraph: {
    type: "website",
    siteName: "PPA Tour Europe",
    title: "Gallery · PPA Tour Europe",
    description: "Photos from every PPA Tour Europe stop.",
    url: `${EUROPE_SITE_URL}/gallery`,
  },
  twitter: { card: "summary", title: "Gallery · PPA Tour Europe" },
  robots: europeRobots,
};

export default async function EuropeGalleryPage() {
  const [{ events }, albums] = await Promise.all([getEvents(), getEuropeGallery()]);
  const sorted = sortAlbumsByEvent(
    albums,
    events.filter((e) => e.country === "Europe"),
  );

  return (
    <main className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 bg-ppa-blue" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
            PPA Tour Europe
          </p>
        </div>
        <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] text-ppa-navy sm:text-4xl">
          Gallery
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/60">
          Photos from every stop, most recent event first. Tap any photo to see it full size.
        </p>
        <div className="mt-10">
          {sorted.length > 0 ? (
            <EuropeGallery albums={sorted} />
          ) : (
            <p className="text-sm text-ppa-navy/60">Photos from the first events are on their way.</p>
          )}
        </div>
      </div>
    </main>
  );
}
