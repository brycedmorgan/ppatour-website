/**
 * Engine's co-branded booking host — the PPA's own Engine domain.
 *
 * ⚠ THIS IS THE ONE LINE THAT TAKES ENGINE LIVE. Flip `ENGINE_ENV` to
 * "production" and every deep link on the site moves from the sandbox host to
 * the real one. Nothing else changes: the property IDs, the parameters and the
 * placements are identical on both.
 *
 * The pattern is Engine's own — their Omni Go guide specifies the co-branded
 * checkout at `[yourBrand].booking.engine.com`, and Wesley was sent the matching
 * sandbox host by their team on 9/23 with a live example:
 *
 *   https://ppatour.booking-sandbox.engine.com/properties/P0000000000000099962
 *
 * ⚠ THE PRODUCTION HOST IS DERIVED FROM THEIR DOCUMENTED PATTERN, NOT CONFIRMED
 * BY ENGINE. `ppatour.booking.engine.com` is what `[yourBrand].booking.engine.com`
 * resolves to for our brand, and the sandbox host differs from it by exactly the
 * `-sandbox` suffix — but nobody has handed us that URL or served a 200 from it.
 * CONFIRM IT WITH ENGINE BEFORE FLIPPING, and check one property renders there.
 * A wrong booking host is a dead link on every hotel on the site at once.
 *
 * Docs: https://engine-public.github.io/engine-partner-api/omni-go-integration.html
 */
export type EngineEnv = "sandbox" | "production";

export const ENGINE_ENV: EngineEnv = "sandbox";

const ENGINE_BOOKING_HOST: Record<EngineEnv, string> = {
  sandbox: "https://ppatour.booking-sandbox.engine.com",
  production: "https://ppatour.booking.engine.com",
};

/**
 * ⚠ SANDBOX PROPERTY IDS MUST NEVER REACH A PUBLIC PAGE, AND THE GUARD FOR THAT
 * IS IN `enginePropertiesFor` (lib/engine.ts), NOT HERE. The snapshot records
 * which environment produced it and is ignored unless it matches `ENGINE_ENV`,
 * so a sandbox-built list goes quiet the moment we flip to production rather
 * than shipping IDs that may name a different building.
 *
 * ⚠ WHICH MEANS DEPLOYING WITH `ENGINE_ENV` STILL SET TO "sandbox" WOULD
 * PUBLISH SANDBOX LINKS. Keep this branch off main until Engine confirms the
 * production host and issues a production credential.
 */
export function engineBookingBase(): string {
  return ENGINE_BOOKING_HOST[ENGINE_ENV];
}


/* ==========================================================================
 * URL BUILDING — deliberately in THIS file rather than lib/engine.ts.
 *
 * ⚠ lib/engine.ts IMPORTS THE PROPERTY SNAPSHOT, AND THE MODAL IS A CLIENT
 * COMPONENT. Anything a client component imports is bundled and shipped to the
 * browser, so if the "view all hotels" modal reached engineBookingUrl through
 * lib/engine.ts it would drag lib/data/engine-properties.json into the bundle of
 * every page that renders it — the whole tour's hotels, on every event page, to
 * draw one stop's list. This file imports no data, so the modal can take the
 * properties it needs as PROPS from the server and the snapshot stays server
 * side. Same split as lib/score-names.ts beside lib/score-headshots.ts.
 * ======================================================================== */
import { withUtm } from "@/lib/utm";

export type EventStay = {
  /** The event's own slug — only used as the UTM campaign fallback. */
  slug: string;
  /** Canonical `MMYY-PPA-CITY-ST-USA` code, when the event has one. */
  eventCode?: string | null;
  city: string;
  state?: string;
  /** `YYYY-MM-DD`. */
  startDate: string;
  /** `YYYY-MM-DD`. */
  endDate: string;
};

/**
 * A single property on the PPA's OWN co-branded Engine host — not
 * members.engine.com.
 *
 * Engine's deep-linking guide documents this path against members.engine.com,
 * which is the host for someone who already holds an Engine account. Omni Go
 * issues each partner a co-branded host that takes the identical path and the
 * identical parameters, and carries PPA branding through checkout. That is the
 * one we send fans to. The host lives in lib/engine-booking.ts, so sandbox and
 * production are a one-line swap.
 */
export function enginePropertyBase(): string {
  return `${engineBookingBase()}/properties`;
}

/**
 * One property as we render it. A deliberate SUBSET of Engine's
 * `lodgingProperty`, which also carries phone numbers, emails, amenities, a
 * media gallery, loyalty programmes and check-in times.
 *
 * ⚠ THERE IS NO PRICE AND NO AVAILABILITY IN HERE, AND THAT IS NOT AN OMISSION
 * — `ContentService.ListProperties` does not return either. It is a CONTENT
 * endpoint. That is what keeps this list on the right side of the line in the
 * header above: we publish the tour's travel partner's inventory near the venue,
 * we do not quote a rate we cannot honour, and the fan learns the price from
 * Engine on Engine's own page. If a rates endpoint is ever wired in, that is a
 * new conversation and not a bigger version of this one.
 */
export type EngineProperty = {
  /** Engine property ID, `P…`. The path segment of the booking deep link. */
  id: string;
  name: string;
  /** From `physicalAddress`, for the one line under the name. */
  addressLine?: string;
  city?: string;
  region?: string;
  /** Miles from the venue, from the response's own `distance` — never computed here. */
  distanceMiles?: number;
  heroImageUri?: string;
  /** Engine's own rating, e.g. "4.0". A string in their payload, not a number. */
  starRating?: string;
  /**
   * Display names of the amenities Engine lists, e.g. "Free Parking".
   *
   * ⚠ THE DISPLAY NAME IS STORED, NOT THE CODE, AND NOT EVERY AMENITY IS KEPT.
   * Engine returns 6-12 per hotel from a fixed 17-code vocabulary alongside a
   * human label; we keep the labels for a curated handful (see AMENITY_KEEP in
   * scripts/engine-nearby.ts) because a row of twelve chips is noise on a card
   * four rows tall. Nothing here is translated or reworded — the strings are
   * Engine's own, so a chip cannot claim an amenity they did not.
   */
  amenities?: string[];
};

/**
 * ⚠ THE DATES ARE PASSED THROUGH AS STRINGS AND NEVER PARSED. `startDate` /
 * `endDate` are already the ISO calendar dates Engine's `checkIn` / `checkOut`
 * ask for, and `new Date("2026-09-26")` is UTC midnight — which is the previous
 * day in every US timezone, i.e. it would prefill a fan's stay one night early.
 * The repo has been bitten by this before (see `isEventRunning` in
 * placeholder-data, which parses local midnight on purpose).
 *
 * The stay offered is the event's own window, start to end. That is a PREFILL a
 * fan can change on Engine, so it deliberately does not invent an extra night
 * either side — we know the tournament's dates, not their travel plans.
 */
export function stayDates(e: EventStay): { checkIn: string; checkOut: string } {
  return { checkIn: e.startDate, checkOut: e.endDate };
}

export function campaignFor(e: EventStay): string {
  return e.eventCode ?? e.slug;
}

/**
 * The dated booking deep link for one property on the PPA's co-branded host.
 *
 * ⚠ `roomCount` AND `guestCount` ARE DELIBERATELY NOT SET. Engine defaults them
 * to 1 room and 2 guests, and we know the tournament's dates but nothing about
 * how many people are travelling — prefilling a guess would quietly re-price
 * somebody's stay. Both are available on the type for a caller that genuinely
 * knows (a group flow), and Engine accepts 1–8 rooms and 1–16 guests.
 */
export function engineBookingUrl(
  property: Pick<EngineProperty, "id">,
  e: EventStay,
  opts: { roomCount?: number; guestCount?: number } = {},
): string {
  const { checkIn, checkOut } = stayDates(e);
  const url = new URL(`${enginePropertyBase()}/${encodeURIComponent(property.id)}`);
  url.searchParams.set("checkIn", checkIn);
  url.searchParams.set("checkOut", checkOut);
  if (opts.roomCount) url.searchParams.set("roomCount", String(opts.roomCount));
  if (opts.guestCount) url.searchParams.set("guestCount", String(opts.guestCount));
  return withUtm(url.toString(), {
    campaign: campaignFor(e),
    content: "event-stay-engine-property",
    term: property.id,
  });
}
