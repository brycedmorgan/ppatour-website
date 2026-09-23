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
  /**
   * The venue's own coordinates, when we hold a verified pair.
   *
   * ⚠ ONLY EVER A MEASURED VALUE, NEVER A GUESS — the same rule as the street
   * address above, and it matters more here because a plausible-looking pair of
   * decimals carries no visible clue that it is wrong. These are used as the
   * centre point of Engine's hotel search (scripts/engine-nearby.ts); a pair that
   * is a mile out lists the wrong hotels as "near the venue" and nothing on the
   * page would look broken.
   *
   * HOW THE PINNED ONES WERE OBTAINED: Engine's ListProperties returns each
   * property's coordinates AND its distance from the search centre, so sending
   * the verified street address above and then solving for the point that
   * satisfies every returned distance recovers the exact centre their geocoder
   * used. Fitted over 11-20 properties per venue, residual RMS 0.001-0.004 mi.
   * Pinning it makes later pulls reproducible instead of depending on their
   * geocoder behaving identically next time.
   */
  latitude?: number;
  longitude?: number;
};

export const VENUE_LOCATIONS: Record<string, VenueLocation> = {
  "Cary Tennis Park": {
    streetAddress: "2727 Louis Stephens Dr",
    addressLocality: "Cary",
    addressRegion: "NC",
    postalCode: "27519",
    addressCountry: "US",
    // Engine geocode of the address above, recovered from 20 property distances (RMS 0.001 mi).
    latitude: 35.80355,
    longitude: -78.86243,
  },
  "Darling Tennis Center": {
    streetAddress: "7901 W Washington Ave",
    addressLocality: "Las Vegas",
    addressRegion: "NV",
    postalCode: "89128",
    addressCountry: "US",
    // Engine geocode of the address above, recovered from 11 property distances (RMS 0.004 mi).
    latitude: 36.17958,
    longitude: -115.26971,
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
    // Engine geocode of the address above, recovered from 13 property distances (RMS 0.002 mi).
    latitude: 42.12952,
    longitude: -87.78803,
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
