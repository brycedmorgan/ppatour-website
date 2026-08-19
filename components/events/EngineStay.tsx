import Image from "next/image";
import { engineGroupUrl, engineHotelUrl, engineStayUrl } from "@/lib/engine";

type EngineEvent = {
  slug: string;
  eventCode?: string | null;
  city: string;
  state?: string;
  startDate: string;
  endDate: string;
};

/**
 * "Book on Engine" beside one hotel — the dated Swift deep link to that exact
 * property, with the event's own check-in and check-out prefilled.
 *
 * ⚠ RENDERS FOR NO HOTEL TODAY, AND THAT IS THE CORRECT STATE, NOT A BUG.
 * `engineHotelUrl` returns null unless the hotel has a mapped Engine property ID
 * and `ENGINE_PROPERTY_BY_HOTEL` is deliberately empty — see the ⚠ on it for why
 * nothing there is guessed and how to add one. Verified by seeding a real ID and
 * confirming this renders, then removing it.
 *
 * ⚠ IT SITS BESIDE "Book the Group Rate", NEVER IN PLACE OF IT. A hotel in
 * Kristen's block has a negotiated rate that Engine's public price will not beat;
 * this is the alternative for a fan who missed the cutoff, so the group-rate
 * button has to stay first.
 */
export function EngineHotelLink({
  hotelName,
  event,
}: {
  hotelName: string;
  event: EngineEvent;
}) {
  const href = engineHotelUrl(hotelName, event);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-blue transition hover:text-ppa-navy"
    >
      Book on Engine
      <span aria-hidden>↗</span>
    </a>
  );
}

/**
 * The Engine card at the foot of "Where to Stay" — the tour's Official Travel
 * Partner, offered ALONGSIDE the official room blocks above it and never instead
 * of them. Kristen's blocks are negotiated group rates with a book-by cutoff;
 * pushing a general booking site ahead of a contracted rate would cost the fan
 * money and the tour its block.
 *
 * ⚠ SHARED BY BOTH EVENT SURFACES ON PURPOSE. The event page and NationalsLive
 * render the same travel section from separate files and have drifted repeatedly
 * (8/5 pt. 14 and pt. 19, 7/31 pt. 2, 8/4 pt. 2). A partner placement that
 * appears on one and not the other is the sponsor-visibility version of that bug.
 *
 * No `"use client"`: it is a plain anchor pair, so it renders on the server for
 * the event page and compiles into the client bundle for NationalsLive. Clicks
 * are counted by the global `OutboundClickTracker` — `engine.com` is in
 * `PARTNER_HOSTS`, so both links report as `partner_click` with no handler here.
 */
export function EngineStay({
  event,
  className = "",
}: {
  event: EngineEvent;
  className?: string;
}) {
  return (
    <div className={`border-t border-ppa-line bg-white px-4 py-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Image
          src="/ppa/sponsors/engine.png"
          alt="Engine"
          width={900}
          height={310}
          className="h-3.5 w-auto object-contain"
          sizes="60px"
        />
        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ppa-navy/50">
          Official Travel Partner
        </p>
      </div>
      <p className="mt-1.5 text-xs text-ppa-navy/55">
        More rooms near {event.city}, plus flights and cars, through the tour&apos;s
        travel partner.
      </p>
      <a
        href={engineStayUrl(event)}
        target="_blank"
        rel="noopener noreferrer"
        className="group/engine mt-2 inline-flex items-center gap-1.5 border border-ppa-navy px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-navy transition hover:bg-ppa-navy hover:text-white active:scale-[0.98]"
      >
        Book with Engine
        <span
          aria-hidden
          className="transition-transform duration-300 group-hover/engine:translate-x-0.5"
        >
          ↗
        </span>
      </a>
      {/* A different product, labelled as one — a rate request for a block of
          rooms, which is what a club travelling to a stop needs. */}
      <p className="mt-2 text-[11px] text-ppa-navy/45">
        Travelling as a group?{" "}
        <a
          href={engineGroupUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-ppa-blue underline decoration-ppa-blue/30 underline-offset-2 hover:text-ppa-navy"
        >
          Request rates for these dates ↗
        </a>
      </p>
    </div>
  );
}
