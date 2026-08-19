import { withUtm } from "@/lib/utm";

/**
 * Engine — the tour's Official Travel Partner (see `partners` in
 * lib/home-content.ts) — on the event pages' travel section.
 *
 * ⚠ THIS IS THE "OMNI SWIFT" INTEGRATION, AND THE CHOICE IS DELIBERATE. Engine's
 * partner API offers two paths: Swift (we build discovery, Engine hosts checkout
 * and owns payments, cancellations, disputes and support) and Halo (we build the
 * whole booking flow and take on payments + PCI). Swift is the only one that fits
 * this site's founding rule that commerce redirects out — Pickleball Vacations is
 * the one deliberate exception to that, and this must not become the second.
 * **Do not add a booking form, a rate shop or a cart here.**
 *
 * ⚠ AND IT IS A DIRECT PARTNER LINK, NEVER AN AFFILIATE ONE. Bryce pulled the
 * Travelpayouts affiliate layer on 8/14 (`44b2590`) because it silently rewrote
 * travel links site-wide to Kiwi/Klook; that commit's own message left the
 * "structure ready for direct-brand links (CJ / Engine)", which is this. Every
 * URL below points at engine.com and nowhere else.
 *
 * Docs: https://engine-public.github.io/engine-partner-api/deep-linking.html
 */

/**
 * The co-branded PPA front door. Engine maintains this page — it reads "Sign up
 * to claim your PPA offer" and carries the member login.
 *
 * ⚠ USED INSTEAD OF `members.engine.com/join/:slug`, ON PURPOSE. The docs' custom
 * landing form needs a partner slug issued with the Omni agreement, and we do not
 * hold one.
 *
 * ⚠ WE DO NOW HOLD AN ENGINE CREDENTIAL, AND IT IS NOT A SLUG (this note used to
 * say there was none anywhere — that stopped being true). `.env.local` carries a
 * SANDBOX mTLS pair — `ENGINE_CLIENT_CERT` / `ENGINE_CLIENT_KEY`, with
 * `ENGINE_API_BASE_URL` and `ENGINE_API_ENV=sandbox` — issued to
 * "O=United Pickleball Association, OU=Tech Evaluation", valid 30 Jul 2026 to
 * 9 Aug 2027 by "Engine Partner API Sandbox". It authenticates the partner API,
 * not the member-facing join form, so it does not unblock a custom landing page.
 * Still nothing in any Vercel environment, which is correct: the cert is only ever
 * used by a script on a dev machine (scripts/engine-properties.mjs).
 * A guessed slug cannot be verified from outside either —
 * `members.engine.com/join/ppa` and `/join/zzz-not-a-real-slug` return
 * byte-identical 12,054-byte SPA shells, so a wrong guess would 200 in a link
 * check and fail in a fan's browser. This page is verified co-branded and live.
 */
const ENGINE_PARTNER_URL = "https://engine.com/partner/ppa";

/** Engine's group / RFP tool. Takes a city + dates with no credentials. */
const ENGINE_GROUPS_URL = "https://groups.engine.com/new-trip";

/** A single property on Engine's member site, per the deep-linking guide. */
const ENGINE_PROPERTY_BASE = "https://members.engine.com/properties";

/**
 * Engine property IDs for hotels we publish, keyed by `normalizeHotel(name)`.
 *
 * ⚠ EMPTY ON PURPOSE, AND AN EMPTY MAP IS A WORKING FEATURE, NOT A STUB. With no
 * entry a hotel simply renders no Engine link and the section-level partner card
 * still does its job. Nothing here is guessed: an ID that belongs to the wrong
 * building would send a fan to a different hotel than the one whose name they
 * clicked, which is worse than no link — the same call as dropping the dead
 * Chicago hotel href (7/29) and the two Australia registration links (8/6).
 *
 * ⚠ FILLING IT NEEDS NO CERTIFICATES, AND TODAY IT NEEDS NO API EITHER. The
 * documented way is `ContentService.ListProperties`. We now hold a sandbox mTLS
 * pair for it, but the endpoint is unreachable — every HTTP/2 stream to
 * partner-api.engine.com resets after a clean TLS handshake, measured 8/19; see
 * the diagnosis printed by scripts/engine-properties.mjs. And a sandbox ID could
 * not be written into this map anyway, because these links point at the
 * PRODUCTION member site.
 *
 * The ID is also right there in the URL when a signed-in Engine user opens a
 * property (`members.engine.com/properties/P0000000000000102095`). So this is
 * populated by hand, one hotel at a time, by anyone with an Engine login. Add the
 * line and that hotel gains a dated deep link on both event pages at once.
 *
 * `npm run engine:properties -- --list` prints every hotel still missing an ID
 * with its street address and its normalized key, plus a paste-ready block. No
 * credentials, no API call.
 *
 * Keyed by hotel name rather than by event because a property is the same
 * building whichever stop is in town, and Kristen's blocks move between events.
 */
const ENGINE_PROPERTY_BY_HOTEL: Record<string, string> = {};

/** Lowercase, strip punctuation and collapse whitespace, so "Home2 Suites — RDU" matches. */
function normalizeHotel(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function enginePropertyIdFor(hotelName: string): string | null {
  return ENGINE_PROPERTY_BY_HOTEL[normalizeHotel(hotelName)] ?? null;
}

type EventStay = {
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
function stayDates(e: EventStay): { checkIn: string; checkOut: string } {
  return { checkIn: e.startDate, checkOut: e.endDate };
}

function campaignFor(e: EventStay): string {
  return e.eventCode ?? e.slug;
}

/** The co-branded partner front door, tagged to the event it was clicked from. */
export function engineStayUrl(e: EventStay): string {
  return withUtm(ENGINE_PARTNER_URL, {
    campaign: campaignFor(e),
    content: "event-stay-engine",
  });
}

/**
 * Engine's group tool with the event's city and dates prefilled.
 *
 * A distinct PRODUCT from the link above, not a variant of it — it raises a rate
 * request for a block of rooms, which is what a club or a team travelling to a
 * stop actually wants, and it is labelled as such in the UI. `sc` is Engine's own
 * custom-attribution parameter, so the handoff is countable on their side as well
 * as ours.
 */
export function engineGroupUrl(e: EventStay): string {
  const { checkIn, checkOut } = stayDates(e);
  const url = new URL(ENGINE_GROUPS_URL);
  url.searchParams.set("checkin", checkIn);
  url.searchParams.set("checkout", checkOut);
  url.searchParams.set("city", e.state ? `${e.city}, ${e.state}` : e.city);
  url.searchParams.set("sc", `ppatour-${campaignFor(e)}`);
  return withUtm(url.toString(), {
    campaign: campaignFor(e),
    content: "event-stay-engine-group",
  });
}

/**
 * A dated deep link to one property — the actual Swift handoff.
 *
 * Returns null for a hotel with no mapped property ID, which is every hotel
 * today; callers must treat null as "render nothing".
 */
export function engineHotelUrl(hotelName: string, e: EventStay): string | null {
  const propertyId = enginePropertyIdFor(hotelName);
  if (!propertyId) return null;
  const { checkIn, checkOut } = stayDates(e);
  const url = new URL(`${ENGINE_PROPERTY_BASE}/${encodeURIComponent(propertyId)}`);
  url.searchParams.set("checkIn", checkIn);
  url.searchParams.set("checkOut", checkOut);
  return withUtm(url.toString(), {
    campaign: campaignFor(e),
    content: "event-stay-engine-property",
    // The property, so Engine can cut their side by hotel across every event
    // page that sent them a click — the same reason paddle links set utm_term.
    term: propertyId,
  });
}
