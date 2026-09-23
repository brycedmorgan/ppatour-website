import Image from "next/image";
import { EngineMoreHotels } from "@/components/events/EngineMoreHotels";
import { EnginePropertyRow } from "@/components/events/EnginePropertyRow";
import {
  type EngineProperty,
  engineHotelUrl,
  ENGINE_VISIBLE_PROPERTIES,
  enginePropertiesNear,
} from "@/lib/engine";

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
 * The hotels Engine holds within a radius of the event venue, each linking
 * straight to that property on the PPA's co-branded booking host.
 *
 * ⚠ IT RENDERS NOTHING WITHOUT A SNAPSHOT, WHICH IS EVERY EVENT TODAY. The list
 * comes from `lib/data/engine-properties.json`, refreshed by
 * `npm run engine:properties -- --write`, and that script cannot reach Engine's
 * API yet. An empty list is a working state: the partner card below still does
 * its job, exactly as it did before this existed.
 *
 * ⚠ HOTELS ALREADY IN KRISTEN'S BLOCK ARE DROPPED, AND THIS IS THE POINT MOST
 * WORTH KEEPING. A five-mile radius around Darling Tennis Center returns the JW
 * Marriott Las Vegas Resort — which is one of the tour's own negotiated blocks on
 * that same page. Listed twice, a fan sees one hotel at two prices and the
 * contracted rate is the better one, so the published block wins and Engine's
 * copy of it is suppressed. Matching is on the normalized hotel NAME, the same
 * key the hand-filled property map uses.
 *
 * ⚠ `<img>`, NOT `next/image`. `heroImageUri` points at Engine's own CDN, which
 * has no `remotePatterns` entry in next.config — the optimizer would 400 every
 * one of them. Same call as the scraped paddle photo. Sized and lazy so it costs
 * nothing above the fold.
 */
export function EnginePropertyList({
  event,
  properties,
}: {
  event: EngineEvent;
  /** Already filtered by `enginePropertiesNear` — this component only draws them. */
  properties: EngineProperty[];
}) {
  if (properties.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-col gap-px bg-ppa-line">
      {properties.map((property) => (
        <li key={property.id} className="bg-white">
          <EnginePropertyRow property={property} event={event} chipLimit={3} />
        </li>
      ))}
    </ul>
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
  excludeHotels = [],
  venueName,
  className = "",
}: {
  event: EngineEvent;
  /**
   * `column` — its own card beside the official room blocks, in the Where to
   *   Stay row. The main placement.
   * `plan` — a footer strip under a hotel list, kept for any caller that still
   *   nests this inside another card.
   * `onsite` — in the Venue Guide while the stop is being played.
   *
   * ⚠ IT DRIVES THE WRAPPER CLASSES RATHER THAN TAKING A `className` OVERRIDE,
   * ON PURPOSE. The onsite column is a `gap-px` stack over `bg-ppa-line`, so the
   * parent already draws the hairline this card carries as `border-t` in the plan
   * placement — and cancelling it from outside would mean shipping `border-t` and
   * `border-t-0` together and trusting Tailwind's emit order to settle which wins.
   */
  variant?: "plan" | "onsite" | "column";
  /**
   * Hotels already published as official blocks on this page. Engine's copy of
   * any of them is suppressed — see the ⚠ on `EnginePropertyList`.
   */
  excludeHotels?: string[];
  /** The venue, named in the modal's heading so "near the venue" is concrete. */
  venueName?: string;
  className?: string;
}) {
  const onsite = variant === "onsite";
  const column = variant === "column";
  const properties = enginePropertiesNear(event.slug, { exclude: excludeHotels });
  const visible = properties.slice(0, ENGINE_VISIBLE_PROPERTIES);

  /**
   * ⚠ NO PROPERTIES MEANS NO CARD, IN EITHER PLACEMENT. Both of this card's
   * fixed links were removed on 9/23 — the "Book with Engine" front door and the
   * group rate request — so the property list is now the only thing in it that
   * does anything. Without one, all that remains is a partner logo and a sentence,
   * which is an advertisement rather than an answer to "where do I stay". A stop
   * with no snapshot therefore renders exactly what it rendered before any of this
   * existed: the official room blocks alone.
   */
  if (properties.length === 0) return null;

  const partnerMark = (
    <span className="flex items-center gap-2">
      <Image
        src="/ppa/sponsors/engine.png"
        alt="Engine"
        width={900}
        height={310}
        className="h-3.5 w-auto object-contain"
        sizes="60px"
      />
      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-ppa-navy/40">
        Official Travel Partner
      </span>
    </span>
  );

  /**
   * ⚠ THE COLUMN VARIANT MIRRORS THE OFFICIAL-BLOCKS CARD BESIDE IT, DELIBERATELY.
   * Same border, same paper ground, same header metrics — so the two read as two
   * answers to one question rather than a section and an advertisement bolted to
   * it. What differs is the heading and the partner mark, which is the whole
   * distinction a fan needs: a contracted rate on the left, public inventory on
   * the right.
   */
  if (column) {
    return (
      <div className={`border border-ppa-line bg-ppa-paper ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ppa-line px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">
            Hotels Near the Venue
          </p>
          {partnerMark}
        </div>
        <div className="px-4 pb-3 pt-1">
          <EnginePropertyList event={event} properties={visible} />
          {properties.length > visible.length && (
            <EngineMoreHotels properties={properties} event={event} venueName={venueName} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white px-4 py-3 ${onsite ? "" : "border-t border-ppa-line"} ${className}`}
    >
      <div className="flex items-center gap-2">{partnerMark}</div>
      <p className="mt-1.5 text-xs text-ppa-navy/55">
        {onsite
          ? "Still need a room? Book near the venue through the tour's travel partner."
          : "More rooms near the venue, through the tour's travel partner."}
      </p>
      <EnginePropertyList event={event} properties={visible} />
      {properties.length > visible.length && (
        <EngineMoreHotels
          properties={properties}
          event={event}
          venueName={venueName}
        />
      )}
    </div>
  );
}
