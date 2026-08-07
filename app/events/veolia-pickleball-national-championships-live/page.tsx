import type { Metadata } from "next";
import { NationalsLive } from "@/components/events/NationalsLive";
import { tournaments } from "@/lib/placeholder-data";
import { getEvents } from "@/lib/events-api";
import { buildTicketGrid } from "@/lib/ticket-grid";

/**
 * Live variant of the National Championships event page. Counts down to first
 * serve and transitions to the live experience automatically when the clock
 * hits 0 (all client-side — see NationalsLive). First serve is configurable via
 * ?at=<ISO> or ?in=<seconds>; defaults to a short lead so the transition is
 * always demoable. Kept out of search (noindex) so it doesn't compete with the
 * real event page.
 */
const BASE_SLUG = "veolia-pickleball-national-championships";

/**
 * Derived, not typed. This page and NationalsLive both read the same curated
 * record, so hardcoding the name here let the tab say one thing while the page
 * said another — it was still reading "National Championships — Live" after the
 * 8/3 full-name pass. Note this route is curated-only (NationalsLive reads
 * `tournaments`), so it keeps the curated spelling even though live event pages
 * now take their name from the feed.
 */
export function generateMetadata(): Metadata {
  const name =
    tournaments.find((t) => t.slug === BASE_SLUG)?.name ??
    "Pickleball National Championships";
  return {
    title: `${name} — Live`,
    description: `Live coverage of the ${name} — counting down to first serve, then live scores, order of play, and how to watch.`,
    robots: { index: false, follow: false },
  };
}

export default async function Page() {
  // NationalsLive is a client component, so the grid is built here on the server
  // and passed down — lib/ticket-grid.ts reads the full price snapshot and must
  // never be imported into the browser bundle.
  const event = tournaments.find((t) => t.slug === BASE_SLUG);
  const ticketGrid = event
    ? buildTicketGrid(event.ticketsUrl, event.startDate, event.endDate)
    : null;

  /**
   * The event's mark, as the feed serves it today. Resolved here for the same
   * reason the ticket grid is: the component is a client component and cannot
   * await the API. Falls back to the curated crest when the feed is unreachable
   * or doesn't carry this event — never to nothing.
   */
  const live = (await getEvents()).events.find((t) => t.slug === BASE_SLUG);
  const liveMark = live?.brand?.icon
    ? { icon: live.brand.icon, iconWide: live.brand.iconWide }
    : null;

  return <NationalsLive ticketGrid={ticketGrid} liveMark={liveMark} />;
}
