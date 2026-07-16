import type { Metadata } from "next";
import { ScheduleGrid } from "@/components/events/ScheduleGrid";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "The 2026–27 Carvana PPA Tour schedule — every main-tour stop with dates, venues, ticket prices, and event guides. Slams, Cups, Opens, and Worlds.",
};

export default function EventsPage() {
  return (
    <section className="bg-ppa-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 bg-ppa-blue" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
            2026 Season
          </p>
        </div>
        <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
          The Main Tour
        </h1>
        <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
          Every PPA Tour main-draw stop — each worth 1,000+ ranking points.
          Filter by tier, then dive into any event for schedule, players,
          tickets, and where to watch.
        </p>

        <ScheduleGrid />
      </div>
    </section>
  );
}
