/**
 * The shape of one trip's marketing content — everything the trip page
 * template (`components/vacations/TripPage.tsx`) renders.
 *
 * Why a type: /vacations was written for exactly one trip and read its copy
 * straight out of content.ts. The moment a second trip went on sale at the
 * same time (Cancún, Sept 2026, while Turks & Caicos was still selling) that
 * page had to become a template, and this is the contract it renders from.
 * Every headline that used to be hard-coded ("Superior rooms on Grace Bay")
 * is now a field, so a trip can't inherit another resort's beach by accident.
 */

export type ItineraryDay = {
  day: string;
  title: string;
  events: { time?: string; text: string }[];
};

export type TripPro = {
  name: string;
  role: string;
  image: string;
  leading?: boolean;
  /** Slug on this site, when the pro has a PPA Tour profile to link to. */
  slug?: string;
};

export type TripContent = {
  trip: {
    brand: string;
    poweredBy: string;
    /** The exact string Jackalope / Stripe key on. Must match the TripConfig. */
    destination: string;
    location: string;
    datesLabel: string;
    /** Day 1 of the itinerary. Each itinerary day's date is derived from this. */
    startIso: string;
    nights: number;
    airportCode: string;
    airportName: string;
    /** "Who" row in the trip card, e.g. "Adults only · 18+". Omit to hide. */
    who?: string;
    contactEmail: string;
    clubMedUrl: string;
    tagline: string;
    intro: string;
    /** The trip-specific paragraph under the intro. */
    inauguralNote: string;
    lineup: string;
  };
  /** Static launch flag — closes sales regardless of Jackalope. */
  soldOut: {
    active: boolean;
    badge: string;
    nextTrip: string;
    headline: string;
    message: string;
    cta: string;
    mailto: string;
  };
  copy: {
    /** Hero headline; `\n` breaks the line. */
    heroHeadline: string;
    heroAlt: string;
    /** The full-bleed court photo band. */
    bandAlt: string;
    bandCopy: string;
    stayHeadline: string;
    closingHeadline: string;
    /** <title> and OG title. */
    metaTitle: string;
    metaDescription: string;
  };
  heroImage: string;
  bandImage: string;
  roomImages: { image: string; alt: string }[];
  excursions: { image: string; title: string; caption: string }[];
  prosAnnounced: boolean;
  prosMoreComing: boolean;
  pros: TripPro[];
  included: string[];
  notIncluded: string[];
  highlights: { stat: string; label: string }[];
  about: { resort: string; play: string; levels: string };
  accommodations: {
    body: string;
    body2: string;
    features: { value: string; label: string }[];
    image: string;
  };
  transportation: { body: string; body2: string };
  itinerary: ItineraryDay[];
};
