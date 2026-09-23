import Image from "next/image";
import { BookGroupRateLink } from "@/components/events/BookGroupRateLink";
import { EngineHotelLink, EngineStay } from "@/components/events/EngineStay";
import type { EventStay } from "@/lib/engine-booking";

type StayPlace = {
  name: string;
  tag: string;
  note: string;
  brand?: string;
  rate?: string;
  cutoff?: string;
  href?: string;
};

/**
 * Where to Stay — its own full-width row in Plan Your Trip, split in two:
 * the tour's negotiated room blocks on the left, Engine's nearby hotels on the
 * right.
 *
 * ⚠ THE SPLIT IS THE POINT, AND IT IS NOT COSMETIC. These are two different
 * offers and a fan has to be able to tell them apart at a glance: the left column
 * is a contracted PPA rate with a book-by cutoff, the right is public inventory
 * near the venue. Stacked in one list — which is how this shipped for a day —
 * the Engine rows read as more of the same thing, and a fan could take a public
 * price when a better negotiated one was two rows above.
 *
 * ⚠ BOTH COLUMNS CARRY `min-w-0`, AND WITHOUT IT THIS ROW DRAGS THE WHOLE PAGE
 * SIDEWAYS ON A PHONE. A grid item defaults to `min-width: auto`, so it refuses
 * to shrink below its own min-content — and the Engine card's min-content is
 * 544px, because the hotel names are `truncate` (i.e. `white-space: nowrap`) and
 * a nowrap string reports its full width as its minimum. In a single-column grid
 * every item is sized to the widest, so BOTH cards inflated to 544 inside a 358px
 * container and the document went 170px wider than a 390px viewport. Measured
 * against a control stop with no Engine column, which stayed at 0. The
 * `truncate` on the names cannot engage until an ancestor is allowed to shrink.
 * Same class of bug as the ticker's score columns (9/1).
 *
 * ⚠ LEFT COLUMN FIRST AT EVERY WIDTH. It is first in the DOM, so on a phone the
 * blocks stack above Engine rather than below. A group rate with a cutoff beats a
 * public price, so the order is a commercial rule, not a layout preference —
 * the same reason Engine sat under the hotel list before this row existed.
 *
 * ⚠ SHARED BY BOTH EVENT SURFACES. The event page and NationalsLive render this
 * section from separate files and have drifted repeatedly (8/5 pt. 14 and pt. 19,
 * 7/31 pt. 2, 8/4 pt. 2). Laying it out twice is how one of them ends up showing
 * a fan the wrong rate first.
 */
export function WhereToStay({
  hotels,
  event,
  eventSlug,
  venueName,
}: {
  /** The tour's published room blocks for this stop. May be empty. */
  hotels: StayPlace[];
  event: EventStay;
  eventSlug: string;
  venueName?: string;
}) {
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      {/* The tour's own blocks */}
      {hotels.length > 0 && (
        <div className="min-w-0 border border-ppa-line bg-ppa-paper">
          <p className="border-b border-ppa-line px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">
            Official Room Blocks
          </p>
          <ul className="divide-y divide-ppa-line">
            {hotels.map((p) => (
              <li key={p.name} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    {p.brand && (
                      <Image
                        src={`/ppa/hotels/${p.brand}.png`}
                        alt=""
                        width={32}
                        height={32}
                        className="size-5 shrink-0 rounded-[3px] object-contain"
                      />
                    )}
                    <span className="font-display text-sm uppercase leading-tight text-ppa-navy">
                      {p.name}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-[9px] font-bold uppercase tracking-[0.1em] ${
                      p.tag === "Official"
                        ? "bg-[var(--event-accent)] px-1.5 py-0.5 text-white"
                        : "text-ppa-blue"
                    }`}
                  >
                    {p.tag}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ppa-navy/55">{p.note}</p>
                {(p.rate || p.cutoff) && (
                  <p className="mt-1 text-[11px] font-bold text-ppa-navy/70">
                    {[p.rate, p.cutoff].filter(Boolean).join(" · ")}
                  </p>
                )}
                {p.href && <BookGroupRateLink href={p.href} eventSlug={eventSlug} />}
                <EngineHotelLink hotelName={p.name} event={event} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Engine's nearby inventory. Renders nothing without a property snapshot,
          so a stop we hold no hotels for shows the blocks column alone. */}
      <EngineStay
        event={event}
        excludeHotels={hotels.map((p) => p.name)}
        venueName={venueName}
        variant="column"
        className="min-w-0"
      />
    </div>
  );
}
