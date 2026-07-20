import Link from "next/link";
import {
  formatDateRange,
  tierPoints,
  type Tournament,
} from "@/lib/placeholder-data";

/**
 * Compact under-1,000-points band on /events — the Challenger Series, rendered
 * deliberately smaller than the main-tour cards above it (Connor's spec: the
 * 1,000+ stops lead big, Challengers sit below in a lighter treatment).
 * Challengers link out to their pickleballtournaments.com page when they have
 * no internal event page.
 */
export function ChallengerStrip({ events }: { events: Tournament[] }) {
  if (events.length === 0) return null;

  return (
    <section className="border-b border-ppa-line bg-ppa-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-ppa-blue" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                Under 1,000 Points
              </p>
            </div>
            <h2 className="mt-2 font-display text-xl uppercase leading-[1.02] text-ppa-navy sm:text-2xl">
              Challenger Series
            </h2>
          </div>
          <p className="max-w-sm text-xs text-ppa-navy/50">
            The proving ground — 125–500 point events that feed the main-tour
            pipeline. Open registration at every stop.
          </p>
        </div>

        <div className="mt-5 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2 lg:grid-cols-3">
          {events.map((t) => {
            const internal = t.hasInternalPage !== false;
            const href = internal
              ? `/events/${t.slug}`
              : t.externalUrl ?? t.registerUrl ?? t.ticketsUrl;
            const inner = (
              <>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-sm uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                    {t.shortName}
                  </span>
                  <span className="shrink-0 bg-ppa-navy/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ppa-navy/55">
                    {tierPoints(t).toLocaleString()} pts
                  </span>
                </span>
                <span className="mt-1 block text-xs text-ppa-navy/55">
                  {formatDateRange(t.startDate, t.endDate, true)} · {t.city}
                  {t.state ? `, ${t.state}` : ""}
                </span>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-blue">
                  {internal ? "Event Guide →" : "Details & Registration ↗"}
                </span>
              </>
            );
            return internal ? (
              <Link
                key={t.slug}
                href={href}
                className="group block bg-white p-4 transition-colors hover:bg-ppa-paper"
              >
                {inner}
              </Link>
            ) : (
              <a
                key={t.slug}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-white p-4 transition-colors hover:bg-ppa-paper"
              >
                {inner}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
