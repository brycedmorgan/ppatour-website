import { withUtm } from "@/lib/utm";
import {
  ENGINE_ENV,
  type EngineProperty,
  type EventStay,
  campaignFor,
  enginePropertyBase,
  stayDates,
} from "@/lib/engine-booking";

// Re-exported so callers keep one import site for "the Engine module".
export { engineBookingUrl, type EngineProperty } from "@/lib/engine-booking";
import snapshot from "@/lib/data/engine-properties.json";

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
 * ⚠ THE CO-BRANDED FRONT DOOR (engine.com/partner/ppa) WAS REMOVED ON 9/23 AND
 * SHOULD NOT COME BACK AS A FAN-FACING BUTTON. Wesley: "it doesn't work." The
 * URL is not dead — it 200s and is genuinely co-branded, and a bogus partner
 * slug 404s, so the page is real. The problem is what it IS: its own title reads
 * "Pro Pickleball Association + Engine | Business Travel Done Better". It is a
 * B2B travel-programme signup, not a place a fan books a room for a tournament,
 * and it sat in Where to Stay under a heading promising hotels.
 *
 * It was defensible only while it was the ONLY Engine link we could render.
 * `enginePropertiesFor` now returns real properties with dated deep links, so
 * the front door is both wrong for the audience and redundant. If a partner
 * landing page is ever wanted again it belongs somewhere that addresses
 * businesses, not on an event page's hotel list.
 */

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
export function normalizeHotel(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function enginePropertyIdFor(hotelName: string): string | null {
  return ENGINE_PROPERTY_BY_HOTEL[normalizeHotel(hotelName)] ?? null;
}

/**
 * ⚠ THE GROUP / RFP LINK (groups.engine.com/new-trip) WAS REMOVED ON 9/23, AFTER
 * THE FRONT-DOOR BUTTON WENT THE SAME DAY. Wesley's call, and the two removals
 * are the same judgement: an event page's Where to Stay is read by one fan
 * looking for one room. A block-of-rooms rate request is a different product for
 * a different buyer, and it was the second thing in a card that should answer a
 * single question.
 *
 * ⚠ IF IT COMES BACK IT NEEDS ITS OWN HOME AND ITS OWN DATE HANDLING. It
 * prefilled `checkin` with the event's start date, which is why it was pre-event
 * only — on a stop already being played it would have asked Engine to quote a
 * stay beginning in the past. It also carried Engine's own `sc=` attribution
 * parameter, so anything replacing it should keep that or the handoff stops
 * being countable on their side.
 */

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
  const url = new URL(`${enginePropertyBase()}/${encodeURIComponent(propertyId)}`);
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

/* ==========================================================================
 * THE PROPERTY LIST — hotels within a radius of the event venue.
 * ======================================================================== */

type EngineSnapshotEvent = {
  /** The venue the radius was centred on, for the reader of the JSON. */
  venue?: string;
  /** How the centre point was expressed — an address, coordinates or freeform text. */
  searchedBy?: string;
  properties: EngineProperty[];
};

type EngineSnapshot = {
  generatedAt: string | null;
  engineEnv: string | null;
  radiusMiles: number;
  events: Record<string, EngineSnapshotEvent>;
};

/**
 * Properties near an event's venue, from the committed snapshot.
 *
 * ⚠ A SNAPSHOT, NOT A LIVE CALL, AND THAT IS THE DESIGN. Resolving at render
 * time would mean shipping the mTLS private key to Vercel, paying a handshake on
 * page renders, and — the part that actually matters — handing Engine's uptime a
 * veto over whether the Where to Stay section has any content during event week,
 * which is exactly when the page is busiest. The set of hotels within five miles
 * of a tennis centre changes about never. `npm run engine:properties -- --write`
 * refreshes it; production stays static and fail-safe.
 *
 * ⚠ THE ENVIRONMENT MUST MATCH OR THE LIST IS DROPPED. A snapshot built against
 * the sandbox holds sandbox property IDs, which may name a different building in
 * production — so flipping `ENGINE_ENV` without re-running the script makes this
 * return nothing rather than publish links that resolve to the wrong hotel. Same
 * rule as the hand-filled map above: no link beats a wrong link.
 *
 * Returns [] for an event with no snapshot, which is every event today. Callers
 * must treat [] as "render the partner card alone", which is the behaviour that
 * shipped before any of this existed.
 */
export function enginePropertiesFor(slug: string): EngineProperty[] {
  const snap = snapshot as EngineSnapshot;
  if (snap.engineEnv !== ENGINE_ENV) return [];
  return snap.events[slug]?.properties ?? [];
}

/**
 * The properties a page should actually show: near the venue, minus any hotel
 * already published as an official block, capped.
 *
 * ⚠ ONE FUNCTION SO THE CARD AND THE LIST CANNOT DISAGREE. The card has to know
 * whether there is anything to show before it decides to render at all — and if
 * it counted properties one way while the list filtered them another, a stop
 * whose only nearby hotels are already official blocks would draw an empty card.
 *
 * ⚠ EXCLUSION IS BY HOTEL NAME, WHICH CATCHES AN EXACT MATCH AND NOTHING ELSE.
 * Verified against real data: a 5-mile search on Darling Tennis Center returns
 * the JW Marriott Las Vegas Resort & Spa and Best Western Plus Las Vegas West,
 * both of which are blocks on that same page, and both are dropped. It will NOT
 * catch a hotel the two sources spell differently — Kristen's "La Quinta Las
 * Vegas Red Rock / Summerlin" against Engine's "La Quinta Inn & Suites by
 * Wyndham Las Vegas Summerlin Tech" cannot be resolved from names, and they may
 * or may not be the same building. The fix is an Engine property ID stored
 * against each official block so this matches on ID; that is an ask, not code.
 */
export function enginePropertiesNear(
  slug: string,
  { exclude = [] }: { exclude?: string[] } = {},
): EngineProperty[] {
  const blocked = new Set(exclude.map(normalizeHotel));
  return enginePropertiesFor(slug).filter((p) => !blocked.has(normalizeHotel(p.name)));
}

/**
 * How many properties the card shows before the rest move into the modal.
 *
 * ⚠ THE CARD SHOWS FOUR AND THE MODAL SHOWS EVERY ONE, INCLUDING THOSE FOUR.
 * A "view all" that opened on the hotels you had NOT already seen would make the
 * modal a different list from the one it claims to complete, and its count would
 * disagree with the button that opened it.
 */
export const ENGINE_VISIBLE_PROPERTIES = 4;

/** When the committed snapshot was built, for the "as of" line. */
export function enginePropertiesGeneratedAt(): string | null {
  const snap = snapshot as EngineSnapshot;
  return snap.engineEnv === ENGINE_ENV ? snap.generatedAt : null;
}

