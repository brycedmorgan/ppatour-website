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
 * ⚠ AND IT HAS A SECOND HOME, BECAUSE THE FIRST ONE VANISHES AT FIRST SERVE.
 * Connor's 9/1 ruling retires the whole Plan Your Trip section once a stop
 * starts (`started` on both event surfaces), and that took this card with it —
 * measured on the live Nationals page: zero engine.com links for the seven days
 * that page is busiest. A travel GUIDE is genuinely a pre-trip surface, but a
 * ROOM is not: Kristen's group blocks have book-by cutoffs weeks before the
 * event (Cary's were 7/30 and 7/31), so during event week the official blocks
 * are expired and Engine is the only booking answer the page still holds.
 * `variant="onsite"` is that placement — it renders in the Venue Guide beside
 * gates and parking, which is what a fan who is already here reads.
 *
 * ⚠ ONSITE IS LIVE-ONLY, NEVER COMPLETED. Callers gate it on the stop actually
 * being played; nobody books a room for a tournament that finished, and a
 * travel partner's card on an archive page is an ad rather than an answer.
 *
 * No `"use client"`: it is a plain anchor pair, so it renders on the server for
 * the event page and compiles into the client bundle for NationalsLive. Clicks
 * are counted by the global `OutboundClickTracker` — `engine.com` is in
 * `PARTNER_HOSTS`, so both links report as `partner_click` with no handler here.
 */
export function EngineStay({
  event,
  variant = "plan",
  className = "",
}: {
  event: EngineEvent;
  /**
   * `plan` — under the hotel list in Where to Stay, before the stop starts.
   * `onsite` — in the Venue Guide while the stop is being played.
   *
   * ⚠ IT DRIVES THE WRAPPER CLASSES RATHER THAN TAKING A `className` OVERRIDE,
   * ON PURPOSE. The onsite column is a `gap-px` stack over `bg-ppa-line`, so the
   * parent already draws the hairline this card carries as `border-t` in the plan
   * placement — and cancelling it from outside would mean shipping `border-t` and
   * `border-t-0` together and trusting Tailwind's emit order to settle which wins.
   */
  variant?: "plan" | "onsite";
  className?: string;
}) {
  const onsite = variant === "onsite";
  return (
    <div
      className={`bg-white px-4 py-3 ${onsite ? "" : "border-t border-ppa-line"} ${className}`}
    >
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
        {onsite
          ? `Still need a room in ${event.city}? Book through the tour's travel partner.`
          : `More rooms near ${event.city}, plus flights and cars, through the tour's travel partner.`}
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
          rooms, which is what a club travelling to a stop needs.

          ⚠ PRE-EVENT ONLY, AND THE REASON IS THE PREFILL. `engineGroupUrl` fills
          `checkin` with the event's own start date, so on a stop that is already
          being played this link would ask Engine to quote a stay beginning in the
          past. The right check-in for a fan standing at the venue is tonight, and
          this page is prerendered — a server date is the wrong timezone (the same
          trap the /today route solves on the device). A block quote is a pre-trip
          product anyway: on site you need one room now, not a group rate. So the
          onsite placement offers the front door alone rather than a stale date. */}
      {!onsite && (
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
      )}
    </div>
  );
}
