import type { Metadata } from "next";
import Link from "next/link";
import { formatDateRange, tournaments } from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

export const metadata: Metadata = { title: "Schedule" };

export default function EventsPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-ppa-navy sm:text-4xl">
        2026 Tour Schedule
      </h1>
      <p className="mt-2 text-zinc-500">
        Search, filters, and the $1,000+ default view land in the full Phase 2
        schedule rebuild.
      </p>
      <div className="mt-6 space-y-3">
        {tournaments.map((t) => (
          <div
            key={t.slug}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ppa-red">
                {t.tier}
              </p>
              <Link
                href={`/events/${t.slug}`}
                className="text-lg font-bold text-ppa-navy hover:underline"
              >
                {t.name}
              </Link>
              <p className="text-sm text-zinc-500">
                {formatDateRange(t.startDate, t.endDate)} · {t.venue} ·{" "}
                {t.city}, {t.state}
              </p>
            </div>
            <a
              href={withUtm(t.ticketsUrl, {
                campaign: t.slug,
                content: "schedule-buy-tickets",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 shrink-0 items-center justify-center rounded-lg bg-ppa-red px-6 font-bold text-white transition-colors hover:bg-ppa-red-dark"
            >
              Buy Tickets
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
