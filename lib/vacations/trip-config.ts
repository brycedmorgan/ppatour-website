/**
 * Trip registry — one config per Pickleball Vacations trip, keyed the way
 * Jackalope and Stripe key it: by the exact `destination` string.
 *
 * Why this exists: the booking path (pricing cards, /register, /api/checkout)
 * used to hard-code the one active trip out of content.ts. That made a second
 * bookable trip impossible without duplicating the whole flow, and it's why
 * Punta Cana shipped as a frozen "Sold Out" page instead of something Lainey
 * could re-open. Now every bookable surface resolves a TripConfig by slug, so
 * adding a trip is a config entry, not a new checkout.
 *
 * Prices are authoritative HERE, not from Jackalope. Rooms and on-sale status
 * come live from Jackalope (see capacity.ts) because those change often and a
 * stale room count only risks a one-room oversell. A price is what we charge a
 * card — that stays in typed, reviewed config, and a change is a deploy.
 */
import { PRICING, type Occupancy } from "./pricing";
import { trip as turkoiseTrip, capacity as turkoiseCapacity, soldOut as turkoiseSoldOut } from "./content";

export type TripPricingOption = {
  id: Occupancy;
  label: string;
  /** Total price for this option, in USD dollars (display). */
  total: number;
  /** Amount charged to the card, in cents (the money value). */
  amountCents: number;
  travelers: number;
  perPersonNote?: string;
  blurb: string;
  soldOut?: boolean;
};

export type TripWaitlist = {
  badge: string;
  headline: string;
  message: string;
  cta: string;
  mailto: string;
};

export type TripConfig = {
  slug: string;
  /** The exact string Jackalope's vac_trips row and Stripe metadata key on. */
  destination: string;
  location: string;
  datesLabel: string;
  nights: number;
  contactEmail: string;
  pricing: Record<Occupancy, TripPricingOption>;
  /** Used only when Jackalope's plan endpoint can't be reached. */
  fallbackCapacity: Record<Occupancy, number>;
  waitlist: TripWaitlist;
};

/**
 * Turks & Caicos — the active trip. Sourced from content.ts / pricing.ts so
 * there is exactly one place the live trip's numbers live; this config is a
 * thin re-shape, not a second copy that can drift.
 */
const TURKOISE: TripConfig = {
  slug: "turkoise",
  destination: turkoiseTrip.destination,
  location: turkoiseTrip.location,
  datesLabel: turkoiseTrip.datesLabel,
  nights: turkoiseTrip.nights,
  contactEmail: turkoiseTrip.contactEmail,
  pricing: PRICING,
  fallbackCapacity: turkoiseCapacity,
  waitlist: {
    badge: turkoiseSoldOut.badge,
    headline: turkoiseSoldOut.headline,
    message: turkoiseSoldOut.message,
    cta: turkoiseSoldOut.cta,
    mailto: turkoiseSoldOut.mailto,
  },
};

const PUNTA_CANA_CONTACT = "vacations@pickleball.com";

/**
 * Punta Cana — the inaugural trip. Sold out on the standalone site at 10 single
 * + 8 double; its prices ($2,800 / $4,800, $2,400pp) are lower than Turks and
 * match the Jackalope seed exactly. Re-opens the moment Lainey sets its status
 * back to "On sale" in Jackalope and leaves a room in the block.
 */
const PUNTA_CANA: TripConfig = {
  slug: "punta-cana",
  destination: "Club Med Punta Cana",
  location: "Punta Cana, Dominican Republic",
  datesLabel: "September 8–12, 2026",
  nights: 4,
  contactEmail: PUNTA_CANA_CONTACT,
  pricing: {
    single: {
      id: "single",
      label: "Single Occupancy",
      total: 2800,
      amountCents: 280000,
      travelers: 1,
      blurb: "A Superior room to yourself.",
    },
    double: {
      id: "double",
      label: "Double Occupancy",
      total: 4800,
      amountCents: 480000,
      travelers: 2,
      perPersonNote: "$2,400 per person",
      blurb: "Share a Superior room — choose King or Twin beds.",
    },
  },
  fallbackCapacity: { single: 10, double: 8 },
  waitlist: {
    badge: "Sold Out",
    headline: "This trip is sold out",
    message:
      "Thank you for the incredible response — every room for Club Med Punta Cana is booked. Email us to join the waiting list for the next trip.",
    cta: "Join the Waiting List",
    mailto: `mailto:${PUNTA_CANA_CONTACT}?subject=${encodeURIComponent(
      "Waiting List — Next Pickleball Vacation"
    )}&body=${encodeURIComponent(
      "Please add me to the waiting list for the next Pickleball Vacations trip.\n\nName:\nPhone:\n"
    )}`,
  },
};

export const TRIPS: Record<string, TripConfig> = {
  [TURKOISE.slug]: TURKOISE,
  [PUNTA_CANA.slug]: PUNTA_CANA,
};

/** The trip the booking path assumes when no `?trip=` is given — stays Turks. */
export const DEFAULT_TRIP = TURKOISE;

/** Resolve a trip by slug, falling back to the active trip for anything unknown. */
export function getTripConfig(slug?: string | null): TripConfig {
  if (slug && TRIPS[slug]) return TRIPS[slug];
  return DEFAULT_TRIP;
}

/** Resolve a trip by its Jackalope/Stripe destination string. */
export function tripByDestination(destination: string): TripConfig | undefined {
  return Object.values(TRIPS).find((t) => t.destination === destination);
}

/**
 * Which trip a Vacations URL belongs to — used by the funnel beacon so a Punta
 * Cana page view doesn't land in the Turks numbers. The register page carries
 * its trip in `?trip=` instead, so its beacons pass the destination explicitly.
 */
export function tripDestinationForPath(path: string): string {
  if (path.includes("/vacations/trips/punta-cana")) return PUNTA_CANA.destination;
  return DEFAULT_TRIP.destination;
}
