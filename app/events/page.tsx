import type { Metadata } from "next";
import { ChallengerStrip } from "@/components/events/ChallengerStrip";
import { FeaturedEvents } from "@/components/events/FeaturedEvents";
import { ScheduleGrid } from "@/components/events/ScheduleGrid";
import { getEvents } from "@/lib/events-api";
import { tierPoints } from "@/lib/placeholder-data";

export const metadata: Metadata = {
  title: "Events",
  description:
    "The full PPA Tour schedule — main tour, Challengers, and international stops, past and upcoming. Search or filter to find your event.",
};

/**
 * Events page structure (Connor's spec, 7/20): the 1,000+ point stops lead
 * BIG, the under-1,000 Challenger Series sits below in a smaller treatment,
 * and the full search/filter of every event closes the page.
 */
export default async function EventsPage() {
  const { events } = await getEvents();
  const upcoming = events.filter((e) => e.status !== "completed");

  // Over 1,000 points — the US main tour (Opens, Cups, Slams, Worlds).
  const mainTour = upcoming.filter(
    (e) =>
      e.region !== "international" &&
      e.tierKey !== "challenger" &&
      tierPoints(e) >= 1000,
  );

  // Under 1,000 points — the Challenger Series.
  const challengers = upcoming.filter((e) => e.tierKey === "challenger");

  return (
    <>
      <FeaturedEvents
        events={mainTour}
        kicker="Over 1,000 Points"
        title="The Main Tour"
        headingAs="h1"
        subtitle="Opens, Cups, Slams, and Worlds — every stop worth 1,000+ ranking points, in season order."
      />
      <ChallengerStrip events={challengers} />
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
            Search everything the PPA Tour runs — main draw, Challengers, and
            the international series — past and upcoming, filterable by tier
            and country.
          </p>

          <ScheduleGrid events={events} />
        </div>
      </section>
    </>
  );
}
