import type { Metadata } from "next";
import { FeaturedEvents } from "@/components/events/FeaturedEvents";
import { ScheduleGrid } from "@/components/events/ScheduleGrid";
import { getEvents } from "@/lib/events-api";
import { tierPoints } from "@/lib/placeholder-data";

export const metadata: Metadata = {
  title: "Events",
  description:
    "The full PPA Tour schedule — The Tour and every other event, U.S. and international, past and upcoming. Search or filter to find your event.",
};

/**
 * Events page structure (Connor, 7/23 + 7/31): the page leads with the next six
 * stops worth 1,000+ ranking points, then goes straight to Find an Event — the
 * searchable, filterable list of EVERY event we run, 125s through Worlds. The
 * old "Other Events" strip (a separate under-1,000 band) is gone; those stops
 * live in Find an Event and are reachable by the tier filter (Connor, 7/31).
 */
export default async function EventsPage() {
  const { events } = await getEvents();
  const upcoming = events.filter((e) => e.status !== "completed");

  // The Tour — every stop worth 1,000+ points, U.S. AND international
  // (Asia/Australia 1,000+ now live here as full events — Connor, 7/23).
  const theTour = upcoming.filter(
    (e) => e.tierKey !== "challenger" && tierPoints(e) >= 1000,
  );

  // Bryce 7/28: clicking "Full 2026 Schedule" should land on the big-card view
  // of the NEXT SIX tour stops, not the entire season in one wall of cards.
  // Everything else stays one scroll down in the searchable grid.
  const nextSix = theTour.slice(0, 6);

  return (
    <>
      <FeaturedEvents
        events={nextSix}
        kicker="1,000+ Points"
        title="Next Six on Tour"
        headingAs="h1"
        subtitle="Majors, Cups, and Opens — every Carvana PPA Tour stop is a crucial stop in the race to the PPA Finals and worth 1,000+ World Pickleball Ranking points."
      />
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              Every Event
            </p>
          </div>
          <h2 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            Find an Event
          </h2>
          <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
            The complete calendar — every stop on The Tour plus the 500s, 250s
            and 125s and the international series, past and upcoming. Search it,
            or filter by type, points and region.
          </p>

          <ScheduleGrid events={events} />
        </div>
      </section>
    </>
  );
}
