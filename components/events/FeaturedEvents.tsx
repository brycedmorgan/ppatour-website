import Image from "next/image";
import { EventMark } from "@/components/events/EventMark";
import Link from "next/link";
import {
  daysUntil,
  formatDateRange,
  tierPoints,
  eventTierShort,
  tierBadgeClass,
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
        {/* A page H1 takes the site's top heading step, a section H2 the one
            below it. Same component serves both, so the size follows the level:
            as an H2 on the homepage this is text-2xl/3xl like every other
            section heading, and as the /events H1 it is text-3xl/4xl. Measured
            at 1440px before this, /events rendered its H1 at 30px above a 36px
            H2 — the page's own title was a step SMALLER than the heading under
            it, which is what read as out of keeping with the rest of the site. */}
        <Heading
          className={`mt-2 font-display uppercase leading-[1.02] ${
            Heading === "h1" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {title}
        </Heading>
        {subtitle && (
          <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">{subtitle}</p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((t) => {
            const days = daysUntil(t.startDate);
            /**
             * ⚠ THIS BAND CAN HOLD A LINK-OUT EVENT, AND IT WAS 404ing.
             * "Next Six on Tour" is every upcoming stop worth 1,000+ points,
             * U.S. AND international (Connor, 7/23) — so a PPA Tour Asia 1000
             * or 1500 stop legitimately lands here (the Leapmotor Kuala Lumpur
             * Cup, Sep 9–13, does today). Those stops have no internal page, and
             * this card linked to `eventHref` unconditionally, which 404s for
             * them. Same bug ScheduleGrid fixed on 7/27; this component was
             * built later and never got the guard.
             */
            const internal = t.hasInternalPage !== false;
            const href = internal
              ? eventHref(t)
              : t.externalUrl ?? t.registerUrl ?? t.ticketsUrl;
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

                <EventMark
                  brand={t.brand}
                  name={t.name}
                  variant="cardLg"
                  className="absolute left-4 top-4 drop-shadow-lg transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
                  <span className={`${tierBadgeClass(t)} px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] whitespace-nowrap`}>
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
                  {internal ? (
                    <Link
                      href={href}
                      className="mt-1 block font-display text-2xl uppercase leading-[1.02] text-white after:absolute after:inset-0"
                    >
                      {t.name}
                    </Link>
                  ) : (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block font-display text-2xl uppercase leading-[1.02] text-white after:absolute after:inset-0"
                    >
                      {t.name}
                    </a>
                  )}
                  <p className="mt-1.5 text-xs text-white/70">
                    {formatDateRange(t.startDate, t.endDate, true)}
                  </p>
                  <p className="text-xs text-white/60">
                    {t.venue}
                    {t.city ? ` · ${t.city}${t.state ? `, ${t.state}` : ""}` : ""}
                  </p>
                  <span className="mt-4 inline-flex h-9 items-center gap-1.5 bg-ppa-blue px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors group-hover:bg-ppa-blue-deep">
                    {internal ? "Explore the Event" : "Event Details"}
                    <span
                      aria-hidden
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    >
                      {internal ? "→" : "↗"}
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
