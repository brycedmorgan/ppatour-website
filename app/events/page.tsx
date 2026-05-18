import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDateRange, tournaments } from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

export const metadata: Metadata = { title: "Schedule" };

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
          Search, filters, and the full schedule rebuild land in Phase 2.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t, i) => (
            <article
              key={t.slug}
              className="group relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden bg-ppa-navy"
            >
              <Image
                src={t.image}
                alt={t.name}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="will-change-transform object-cover grayscale-[30%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 scrim-card" />
              <span className="absolute left-3 top-2 font-display text-2xl leading-none text-white/30">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="absolute right-3 top-3 bg-ppa-yellow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ppa-navy">
                {t.points.toLocaleString()} Pts
              </span>
              <div className="relative p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                  {t.tier}
                </p>
                <Link
                  href={`/events/${t.slug}`}
                  className="mt-0.5 block font-display text-lg uppercase leading-[1.05] text-white after:absolute after:inset-0"
                >
                  {t.shortName}
                </Link>
                <p className="mt-1 text-xs text-white/60">
                  {formatDateRange(t.startDate, t.endDate)} · {t.city},{" "}
                  {t.state}
                </p>
                <a
                  href={withUtm(t.ticketsUrl, {
                    campaign: t.slug,
                    content: "schedule-buy-tickets",
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 mt-3 inline-flex h-8 items-center bg-ppa-blue px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-ppa-blue-deep"
                >
                  Buy Tickets
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
