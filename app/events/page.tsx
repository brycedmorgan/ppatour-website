import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDateRange, tournaments } from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

export const metadata: Metadata = { title: "Schedule" };

export default function EventsPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-ppa-yellow">
        2026 Season
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-tight text-white sm:text-6xl">
        Tour Schedule
      </h1>
      <p className="mt-3 max-w-xl text-white/55">
        Search, filters, and the $1,000+ default view land in the full Phase 2
        schedule rebuild.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {tournaments.map((t) => (
          <div
            key={t.slug}
            className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden"
          >
            <Image
              src={t.image}
              alt={t.name}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ppa-ink via-ppa-ink/55 to-transparent" />
            <div className="relative p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-yellow">
                {t.tier}
              </p>
              <Link
                href={`/events/${t.slug}`}
                className="font-display text-2xl font-bold uppercase leading-tight tracking-tight text-white after:absolute after:inset-0"
              >
                {t.shortName}
              </Link>
              <p className="mt-1 text-sm text-white/65">
                {formatDateRange(t.startDate, t.endDate)} · {t.venue}
              </p>
              <a
                href={withUtm(t.ticketsUrl, {
                  campaign: t.slug,
                  content: "schedule-buy-tickets",
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 mt-3 inline-flex h-10 items-center bg-ppa-red px-4 font-display text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-ppa-red-dark"
              >
                Buy Tickets
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
