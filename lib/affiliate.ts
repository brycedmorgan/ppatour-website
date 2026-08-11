/**
 * Travel affiliate link builders. The Trip Builder earns commission by handing
 * off to travel partners with our affiliate marker attached — the site itself
 * never books a flight or a room (this stays a content/discovery + redirect-out
 * surface; Stripe on /vacations is the one commerce exception).
 *
 * ⚠ ONE MARKER, MANY PARTNERS. Travelpayouts is a single affiliate account that
 * pays on flights (Aviasales / WayAway), hotels (Hotellook) and cars. Set the
 * marker once in Vercel and every link below is tagged automatically.
 *
 * ⚠ THE LINKS WORK WITH OR WITHOUT A MARKER. With no marker set they still open
 * a real, correctly-prefilled search — they just don't earn — so the feature is
 * fully demoable today and starts paying the moment the real marker lands in
 * env. Do not gate the Trip Builder on the marker being present.
 *
 * ⚠ AFFILIATE LINKS DO NOT STACK ON A HOTEL'S OWN GROUP-RATE LINK. The official
 * hotels carry a negotiated block link (Kristen's 2026/27 thread) that books
 * direct into our room block — there is no affiliate network in the middle to
 * earn on, and wrapping one around it would break the hotel's own tracking and
 * likely void the rate. So official hotels keep their direct link (see
 * BookGroupRateLink); affiliate hotel search is only ever offered for the
 * *other* stays near the venue — the incremental bookings we don't already hold.
 */

/**
 * Public so it ships in the client bundle. Placeholder until the real
 * Travelpayouts account exists — see the setup note Bryce was given. Swapping
 * this to the real marker is the whole activation; no code changes.
 */
const MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER?.trim();

/** YYYY-MM-DD → DDMM, parsed as text so no timezone can roll the day. */
function ddmm(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return `${m[3]}${m[2]}`;
}

const IATA = /^[A-Za-z]{3}$/;

export type FlightQuery = {
  /** Home airport IATA (e.g. "LAX"). May be blank/unknown. */
  originIata?: string;
  /** Destination airport IATA — the event's closest airport. */
  destIata: string;
  /** Event start / end as YYYY-MM-DD; drives the outbound/return dates. */
  departDate: string;
  returnDate: string;
  passengers?: number;
};

/**
 * A flight-search deep link.
 *
 * With a valid 3-letter origin we build Aviasales' exact round-trip search
 * string (`ORIGIN+DDMM+DEST+DDMM+PAX`), so the results page opens already
 * filled in. Without one (the traveler typed a city, or left it blank) we fall
 * back to a destination-prefilled search where they pick their origin. Either
 * way the marker is attached when present.
 */
export function flightSearchUrl(q: FlightQuery): string {
  const pax = Math.min(Math.max(q.passengers ?? 1, 1), 9);
  const out = ddmm(q.departDate);
  const back = ddmm(q.returnDate);
  const origin = q.originIata && IATA.test(q.originIata) ? q.originIata.toUpperCase() : null;
  const dest = q.destIata.toUpperCase();

  const marker = MARKER ? `?marker=${encodeURIComponent(MARKER)}` : "";

  if (origin && out && back) {
    return `https://www.aviasales.com/search/${origin}${out}${dest}${back}${pax}${marker}`;
  }
  // No usable origin — open a destination search they finish. Aviasales reads
  // the destination from the query params on its landing search.
  const params = new URLSearchParams();
  if (MARKER) params.set("marker", MARKER);
  params.set("destination", dest);
  return `https://www.aviasales.com/?${params.toString()}`;
}

export type HotelQuery = {
  /** City name — "Cary, NC" style is fine; Hotellook resolves it. */
  location: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
};

/**
 * A Hotellook search for the *other* stays near the venue (never the official
 * block — see the file header). Prefilled with the city and the event dates.
 */
export function hotelSearchUrl(q: HotelQuery): string {
  const params = new URLSearchParams();
  if (MARKER) params.set("marker", MARKER);
  params.set("destination", q.location);
  const ci = q.checkIn.slice(0, 10);
  const co = q.checkOut.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ci)) params.set("checkIn", ci);
  if (/^\d{4}-\d{2}-\d{2}$/.test(co)) params.set("checkOut", co);
  params.set("adults", String(Math.min(Math.max(q.guests ?? 2, 1), 8)));
  return `https://search.hotellook.com/?${params.toString()}`;
}

export type CarQuery = {
  /** Pickup location — airport IATA or city. */
  location: string;
  pickUp: string;
  dropOff: string;
};

/**
 * A rental-car search (Discover Cars via Travelpayouts — same marker), prefilled
 * with the pickup location and the event dates. ⚠ Discover Cars' exact deep-link
 * param names are finalized when the affiliate account is live; until then this
 * opens a real, marker-tagged search the traveler completes.
 */
export function carSearchUrl(q: CarQuery): string {
  const params = new URLSearchParams();
  if (MARKER) params.set("marker", MARKER);
  params.set("pickupLocation", q.location);
  const ci = q.pickUp.slice(0, 10);
  const co = q.dropOff.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ci)) params.set("pickupDate", ci);
  if (/^\d{4}-\d{2}-\d{2}$/.test(co)) params.set("dropoffDate", co);
  return `https://www.discovercars.com/?${params.toString()}`;
}

/** True once a real marker is configured — for an admin/debug surface only. */
export function affiliateConfigured(): boolean {
  return Boolean(MARKER);
}
