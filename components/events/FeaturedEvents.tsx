import Image from "next/image";
import Link from "next/link";
import {
  daysUntil,
  formatDateRange,
  tierPoints,
  eventTierShort,
  type Tournament,
  eventHref,
} from "@/lib/placeholder-data";

/**
 * Big-card band on /events — upcoming PPA Tour (1,000+ point)
 * stops as large, brand-accented cards linking to their event pages. Renders
 * nothing if there are no upcoming tour events. Heading is configurable
 * so the same treatment serves "Next Up on Tour" and the full tour band.
 */
export function FeaturedEvents({
  events,
  kicker = "Featured",
  title = "Next Up on Tour",
  subtitle,
  headingAs: Heading = "h2",
}: {
  events: Tournament[];
  kicker?: string;
  title?: string;
  subtitle?: string;
  headingAs?: "h1" | "h2";
}) {
  if (events.length === 0) return null;

  return (
    <section className="border-b border-ppa-line bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 bg-ppa-blue" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
            {kicker}
          </p>
        </div>
        <Heading className="mt-2 font-display text-2xl uppercase leading-[1.02] sm:text-3xl">
          {title}
        </Heading>
        {subtitle && (
          <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">{subtitle}</p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((t) => {
            const days = daysUntil(t.startDate);
            return (
              <article
                key={t.slug}
                style={{ "--event-accent": t.brand?.accent ?? "#228be6" } as React.CSSProperties}
                className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden bg-ppa-navy transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
              >
                <Image
                  src={t.image}
                  alt={t.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 scrim-hero" />
                {/* Brand accent strip */}
                <span
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: "var(--event-accent)" }}
                />

                {t.brand?.icon && (
                  <span className="absolute left-4 top-4 block h-28 w-[60px] overflow-hidden rounded drop-shadow-lg transition-transform duration-500 group-hover:scale-105">
                    <Image
                      src={t.brand.icon}
                      alt={`${t.shortName} badge`}
                      fill
                      sizes="60px"
                      className="object-contain"
                    />
                  </span>
                )}

                <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
                  <span className="bg-ppa-yellow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ppa-navy">
                    {eventTierShort(t)} · {tierPoints(t).toLocaleString()}
                  </span>
                  {days > 0 && (
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white"
                      style={{ backgroundColor: "var(--event-accent)" }}
                    >
                      {days} {days === 1 ? "Day" : "Days"} Out
                    </span>
                  )}
                </div>

                <div className="relative p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                    {t.presentedBy ? `Presented by ${t.presentedBy}` : "PPA Tour"}
                  </p>
                  <Link
                    href={eventHref(t)}
                    className="mt-1 block font-display text-2xl uppercase leading-[1.02] text-white after:absolute after:inset-0"
                  >
                    {t.shortName}
                  </Link>
                  <p className="mt-1.5 text-xs text-white/70">
                    {formatDateRange(t.startDate, t.endDate, true)}
                  </p>
                  <p className="text-xs text-white/60">
                    {t.venue}
                    {t.city ? ` · ${t.city}${t.state ? `, ${t.state}` : ""}` : ""}
                  </p>
                  <span className="mt-4 inline-flex h-9 items-center gap-1.5 bg-ppa-blue px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors group-hover:bg-ppa-blue-deep">
                    Explore the Event
                    <span
                      aria-hidden
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
