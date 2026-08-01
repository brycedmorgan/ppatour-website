import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HomeContent, type LiveEvent } from "@/components/home/HomeContent";
import { getTournamentDetails, LIVE_EVENT_UUID } from "@/lib/tournament-api";

// Internal preview of the homepage during a live tournament — keep it out of
// search results so it isn't treated as duplicate homepage content.
export const metadata: Metadata = {
  title: "Live — Homepage Preview",
  robots: { index: false, follow: false },
};

/** Re-check on the same cadence as the rest of the event data. */
export const revalidate = 300;

/**
 * `/live` is a preview of what the homepage looks like DURING an event, so it
 * hard-codes one tournament and renders the LIVE NOW hero unconditionally.
 *
 * ⚠ That means when its event is over it still says "LIVE NOW · MATCHES IN
 * PROGRESS" with a ▶ WATCH LIVE button. The pre-launch audit found it
 * advertising the Veolia Atlanta Championships (Apr 27 – May 3) as live on
 * Aug 1. `noindex` keeps it out of search but not out of the address bar, and
 * ppatour.com/live is a URL fans type.
 *
 * So: only render the preview while its event is actually running. Otherwise
 * send people to /watch, which answers the question they came with.
 */
function isRunning(startDate?: string, endDate?: string): boolean {
  if (!startDate || !endDate) return false;
  const now = Date.now();
  const start = Date.parse(startDate);
  // Through the END of the final day, not its midnight boundary.
  const end = Date.parse(endDate) + 24 * 60 * 60 * 1000;
  return Number.isFinite(start) && Number.isFinite(end) && now >= start && now < end;
}

export default async function LivePage() {
  const details = await getTournamentDetails(LIVE_EVENT_UUID);

  if (!details || !isRunning(details.startDate, details.endDate)) {
    redirect("/watch");
  }

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
