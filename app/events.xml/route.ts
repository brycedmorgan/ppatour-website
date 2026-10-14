/**
 * GET /events.xml — RSS 2.0 feed of upcoming PPA Tour stops, with the RSS event
 * module (ev:startdate / ev:location) that calendar aggregators read. See
 * lib/event-feed.ts.
 */
import { buildRss, feedEvents } from "@/lib/event-feed";

export const revalidate = 3600;

export async function GET() {
  return new Response(buildRss(feedEvents()), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
