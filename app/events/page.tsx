import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDateRange, tournaments } from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

export const metadata: Metadata = { title: "Schedule" };

export default function EventsPage() {
  return (
    <section className="bg-ppa-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 bg-ppa-red" />
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-ppa-ink/55">
            2026 Season
          </p>
        </div>
        <h1 className="mt-3 font-display text-6xl uppercase leading-[0.9] sm:text-8xl">
          The Main Tour
        </h1>
        <p className="mt-4 max-w-xl text-ppa-ink/55">
          Every PPA Tour main-draw stop — each worth 1,000+ ranking points.
          Search, filters, and the full schedule rebuild land in Phase 2.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {tournaments.map((t, i) => (
            <article
              key={t.slug}
              className="group relative isolate flex aspect-[3/4] flex-col justify-end overflow-hidden bg-ppa-ink"
            >
              <Image
                src={t.image}
                alt={t.name}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="transform-gpu object-cover grayscale-[35%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 scrim-card" />
              <span className="absolute left-4 top-3 font-display text-6xl leading-none text-white/25">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="absolute right-4 top-5 bg-ppa-yellow px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ppa-ink">
                {t.points.toLocaleString()} Pts
              </span>
              <div className="relative p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
                  {t.tier}
                </p>
                <Link
                  href={`/events/${t.slug}`}
                  className="mt-1 block font-display text-3xl uppercase leading-[0.9] text-white after:absolute after:inset-0"
                >
                  {t.shortName}
                </Link>
                <p className="mt-2 text-sm text-white/60">
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
                  className="relative z-10 mt-4 inline-flex h-10 items-center bg-ppa-red px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-red-dark"
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
