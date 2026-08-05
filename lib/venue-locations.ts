/**
 * Verified street addresses for tour venues, keyed by the venue NAME exactly as
 * it appears on the tournament record (`Tournament.venue`).
 *
 * WHY THIS EXISTS: Google's event experience (the local-events carousel + the
 * event rich result) wants `location.address` as a structured `PostalAddress`
 * with a real street address + postal code — not the bare `"Cary, NC"` string
 * the event JSON-LD used to emit. A structured, geocodable address is the single
 * biggest lever for showing up in "pickleball near me" / local event listings.
 *
 * WHAT GOES IN HERE: only addresses confirmed against the venue's own listing /
 * public records. A wrong address is worse than none (it geocodes the event to
 * the wrong place), so an unverified venue is deliberately LEFT OUT — the schema
 * builder falls back to city / state / country from the event record, which is
 * still a valid PostalAddress, just coarser. Add a row as each venue is
 * confirmed; `streetAddress` + `postalCode` is all Google needs to geocode.
 */
export type VenueLocation = {
  streetAddress?: string;
  addressLocality: string;
  /** USPS two-letter state code. */
  addressRegion: string;
  postalCode?: string;
  /** ISO 3166-1 alpha-2. */
  addressCountry: string;
};

export const VENUE_LOCATIONS: Record<string, VenueLocation> = {
  "Cary Tennis Park": {
    streetAddress: "2727 Louis Stephens Dr",
    addressLocality: "Cary",
    addressRegion: "NC",
    postalCode: "27519",
    addressCountry: "US",
  },
  "Darling Tennis Center": {
    streetAddress: "7901 W Washington Ave",
    addressLocality: "Las Vegas",
    addressRegion: "NV",
    postalCode: "89128",
    addressCountry: "US",
  },
  "Virginia Beach Sports Center": {
    streetAddress: "1045 19th St",
    addressLocality: "Virginia Beach",
    addressRegion: "VA",
    postalCode: "23451",
    addressCountry: "US",
  },
  "Life Time — Northbrook": {
    streetAddress: "1100 Skokie Blvd",
    addressLocality: "Northbrook",
    addressRegion: "IL",
    postalCode: "60062",
    addressCountry: "US",
  },
  // The complex uses two published street addresses (1 Legacy Dr / 6321 S
  // Ellsworth Rd), so the street is left off rather than guessed — locality +
  // region + postal still geocode Mesa correctly.
  "Arizona Athletic Grounds": {
    addressLocality: "Mesa",
    addressRegion: "AZ",
    postalCode: "85212",
    addressCountry: "US",
  },
};
