import type { Metadata } from "next";
import { HomeContent, type LiveEvent } from "@/components/home/HomeContent";
import { getTournamentDetails, LIVE_EVENT_UUID } from "@/lib/tournament-api";

// Internal preview of the homepage during a live tournament — keep it out of
// search results so it isn't treated as duplicate homepage content.
export const metadata: Metadata = {
  title: "Live — Homepage Preview",
  robots: { index: false, follow: false },
};

export default async function LivePage() {
  const details = await getTournamentDetails(LIVE_EVENT_UUID);
  const liveEvent: LiveEvent | undefined = details
    ? {
        name: details.name,
        city: details.city,
        state: details.state,
        venue: details.venue,
        startDate: details.startDate,
        endDate: details.endDate,
        ticketsUrl: details.ticketsUrl,
        // /live previews the Veolia Atlanta Championships — its crest fills the
        // hero badge slot (same treatment as the homepage next-event crest).
        logo: "/ppa/logos/2026-atl.webp",
      }
    : undefined;

  return <HomeContent live liveEvent={liveEvent} />;
}
