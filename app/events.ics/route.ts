/**
 * GET /events.ics — subscribe-able calendar of every upcoming PPA Tour stop.
 * Community calendars and fans add this URL once and stay current. See
 * lib/event-feed.ts for why it exists and what's in it.
 */
import { buildIcs, feedEvents } from "@/lib/event-feed";

export const revalidate = 3600;

export async function GET() {
  return new Response(buildIcs(feedEvents()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="ppa-tour-events.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
