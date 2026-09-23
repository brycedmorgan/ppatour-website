"use client";

import { useEffect, useRef, useState } from "react";
import { EnginePropertyRow } from "@/components/events/EnginePropertyRow";
import type { EngineProperty, EventStay } from "@/lib/engine-booking";

/**
 * "View all N hotels" — the rest of Engine's properties near the venue, in a
 * modal, so the Where to Stay column can show four and still offer the full set.
 *
 * ⚠ IT TAKES THE PROPERTIES AS PROPS AND IMPORTS NO DATA, ON PURPOSE. This is a
 * client component, so everything it imports ships to the browser. Reaching the
 * property snapshot through lib/engine.ts would put the whole tour's hotel list
 * in the bundle of every page that renders this button, to draw one stop's rows.
 * The server picks the rows; this only draws them. See the note at the foot of
 * lib/engine-booking.ts.
 *
 * ⚠ THE OFFICIAL ROOM BLOCKS ARE ALREADY FILTERED OUT UPSTREAM, so a hotel with
 * a negotiated PPA rate can never appear in here at its public price — the same
 * guarantee the four visible rows carry. Do not pass an unfiltered list.
 *
 * Follows the VolunteerModalButton pattern (Escape to close, backdrop click,
 * body scroll lock, focus moved to the close button) so the two modals on an
 * event page behave identically.
 */
export function EngineMoreHotels({
  properties,
  event,
  venueName,
}: {
  /** Every property we hold for this stop, already filtered and distance-sorted. */
  properties: EngineProperty[];
  event: EventStay;
  venueName?: string;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (properties.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group/more mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-blue transition hover:text-ppa-navy"
      >
        View all {properties.length} hotels
        <span
          aria-hidden
          className="inline-block transition-transform duration-300 group-hover/more:translate-x-0.5"
        >
          →
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={venueName ? `Hotels near ${venueName}` : "Hotels near the venue"}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-ppa-navy-deep/80 p-0 backdrop-blur-sm motion-safe:animate-fade sm:items-center sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-lg flex-col bg-white"
          >
            <div className="flex items-start justify-between gap-4 border-b border-ppa-line px-5 py-4">
              <div>
                <h2 className="font-display text-lg uppercase leading-tight text-ppa-navy">
                  Hotels near the venue
                </h2>
                <p className="mt-0.5 text-[11px] text-ppa-navy/50">
                  {properties.length} properties
                  {venueName ? ` within a few miles of ${venueName}` : ""} · booked
                  through Engine, the tour&rsquo;s Official Travel Partner
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="shrink-0 text-2xl leading-none text-ppa-navy/40 transition hover:text-ppa-navy"
              >
                ×
              </button>
            </div>

            <ul className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto bg-ppa-line">
              {properties.map((property) => (
                <li key={property.id} className="bg-white">
                  <EnginePropertyRow
                    property={property}
                    event={event}
                    chipLimit={5}
                    className="px-5"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
