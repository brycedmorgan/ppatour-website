import type { Metadata } from "next";
import { ScheduleGrid } from "@/components/events/ScheduleGrid";

export const metadata: Metadata = {
  title: "Events",
  description:
    "The full PPA Tour schedule — main tour, Challengers, and international stops, past and upcoming. Search or filter to find your event.",
};

export default function EventsPage() {
  return (
    <section className="bg-ppa-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 bg-ppa-blue" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
            Schedule
          </p>
        </div>
        <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
          Events
        </h1>
        <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
          Every stop on the tour — main draw, Challengers, and international.
          Search or filter, then dive into any event for schedule, players,
          tickets, and where to watch.
        </p>

        <ScheduleGrid />
      </div>
    </section>
  );
}
