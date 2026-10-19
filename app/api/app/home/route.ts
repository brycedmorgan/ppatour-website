import { NextResponse } from "next/server";
import { resolveScoresEvent } from "@/lib/app-scores";
import { getEvents } from "@/lib/events-api";
import { eventHref } from "@/lib/placeholder-data";

/**
 * The PPA Tour app's home payload: which stop is current (same resolver the
 * /scores screen uses) plus the slim tour schedule for the Events tab.
 *
 *   GET /api/app/home → { event, events[] }
 *
 * One call on launch instead of three; cached at the edge for five minutes,
 * which is how often "which event is live" can change in practice.
 */
export const revalidate = 300;

const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=3600";

export async function GET() {
  const [event, { events }] = await Promise.all([resolveScoresEvent(), getEvents()]);
  const slim = events.map((t) => ({
    slug: t.slug,
    name: t.name,
    city: t.city,
    state: t.state,
    venue: t.venue,
    startDate: t.startDate,
    endDate: t.endDate,
    status: t.status,
    ticketsUrl: t.ticketsUrl,
    href: eventHref(t),
    image: t.image,
    tournamentUuid: t.tournamentUuid ?? null,
    tierKey: t.tierKey,
    presentedBy: t.presentedBy ?? null,
    country: t.country ?? null,
  }));
  return NextResponse.json({ event, events: slim }, { headers: { "Cache-Control": CACHE_CONTROL } });
}
