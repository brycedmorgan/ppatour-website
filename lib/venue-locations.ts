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

/* One address, several feed spellings — defined once so the aliases cannot drift. */
const NEWPORT_TTC: VenueLocation = {
  streetAddress: "11 Clubhouse Dr",
  addressLocality: "Newport Beach",
  addressRegion: "CA",
  postalCode: "92660",
  addressCountry: "US",
};
const PEPPERDINE: VenueLocation = {
  streetAddress: "24255 Pacific Coast Hwy",
  addressLocality: "Malibu",
  addressRegion: "CA",
  postalCode: "90263",
  addressCountry: "US",
};
const LIFETIME_LAKEVILLE: VenueLocation = {
  streetAddress: "18425 Dodd Blvd",
  addressLocality: "Lakeville",
  addressRegion: "MN",
  postalCode: "55044",
  addressCountry: "US",
};
const LIFETIME_PEACHTREE: VenueLocation = {
  streetAddress: "6350 Courtside Dr NW",
  addressLocality: "Peachtree Corners",
  addressRegion: "GA",
  postalCode: "30092",
  addressCountry: "US",
};
const LIFETIME_RSC: VenueLocation = {
  streetAddress: "111 Avenida Vista Montana",
  addressLocality: "San Clemente",
  addressRegion: "CA",
  postalCode: "92672",
  addressCountry: "US",
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
  // 1300 Techny Rd is the event team's address (9/29); the 1100 Skokie Blvd
  // this carried before was wrong. Keyed under the curated name AND the feed's,
  // since the live venue name is what the page actually renders.
  "Life Time — Northbrook": {
    streetAddress: "1300 Techny Rd",
    addressLocality: "Northbrook",
    addressRegion: "IL",
    postalCode: "60062",
    addressCountry: "US",
  },
  "Life Time North Shore Sport & Racquetball": {
    streetAddress: "1300 Techny Rd",
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
  // Same complex, pre-rename (the curated 2023 Phoenix Cup record).
  "Bell Bank Park": {
    addressLocality: "Mesa",
    addressRegion: "AZ",
    postalCode: "85212",
    addressCountry: "US",
  },

  /**
   * ── 10/18: every 2026–27 Tour stop (docs/SEO.md §7c) ─────────────────────
   * Each row was checked against the venue's own site (or the city's, for a
   * public facility) on 2026-10-18; the source is on the row. Where the feed
   * spells one venue several ways, every spelling is a key — the schema
   * builder looks up the exact string on the event record.
   */
  // invitedclubs.com/clubs/brookhaven-country-club
  "Brookhaven Country Club": {
    streetAddress: "3333 Golfing Green Dr",
    addressLocality: "Farmers Branch",
    addressRegion: "TX",
    postalCode: "75234",
    addressCountry: "US",
  },
  // pictona.org
  "Pictona at Holly Hill": {
    streetAddress: "1060 Ridgewood Ave",
    addressLocality: "Holly Hill",
    addressRegion: "FL",
    postalCode: "32117",
    addressCountry: "US",
  },
  // newportbeachttc.com ("11 Clubhouse Drive"; ZIP from listings — the club site omits it)
  "TTC Newport Beach": NEWPORT_TTC,
  "The Tennis and Pickleball Club at Newport Beach": NEWPORT_TTC,
  "Tennis Club at Newport Beach": NEWPORT_TTC,
  // pepperdine.edu — the university's main address; the tennis center has none of its own
  "Pepperdine University - Ralphs-Straus Tennis Center": PEPPERDINE,
  "Pepperdine University": PEPPERDINE,
  // invitedclubs.com/clubs/mission-hills-country-club (NOT 21 Racquet Club Dr, which directories show)
  "Mission Hills Country Club": {
    streetAddress: "34600 Mission Hills Dr",
    addressLocality: "Rancho Mirage",
    addressRegion: "CA",
    postalCode: "92270",
    addressCountry: "US",
  },
  // my.lifetime.life/clubs/mn/lakeville
  "Life Time — Lakeville": LIFETIME_LAKEVILLE,
  "Lifetime Lakeville": LIFETIME_LAKEVILLE,
  // playthecourtscapecoral.com — the feed's name for the Cape Coral Open venue;
  // the curated 2027 record said "Cape Coral Racquet Club" (unconfirmed as the
  // same site) and was changed to this string 10/18.
  "The Courts, Cape Coral": {
    streetAddress: "420 SW 2nd Ave",
    addressLocality: "Cape Coral",
    addressRegion: "FL",
    postalCode: "33991",
    addressCountry: "US",
  },
  // blackdesertresort.com footer. Ivins, not St. George (the event record's city).
  "Black Desert Resort": {
    streetAddress: "1500 E Black Desert Dr",
    addressLocality: "Ivins",
    addressRegion: "UT",
    postalCode: "84738",
    addressCountry: "US",
  },
  // lifetime.life/locations/ca/arden
  "Life Time Arden": {
    streetAddress: "1220 Arden Hills Ln",
    addressLocality: "Sacramento",
    addressRegion: "CA",
    postalCode: "95864",
    addressCountry: "US",
  },
  // lifetime.life/life-time-locations/ga-peachtree-corners (Life Time lists the city as Peachtree Corners, not Norcross)
  "Life Time — Peachtree Corners": LIFETIME_PEACHTREE,
  "Life Time Peachtree Corners": LIFETIME_PEACHTREE,
  "Lifetime Peachtree Corners": LIFETIME_PEACHTREE,
  "Life Time PeachTree Corners": LIFETIME_PEACHTREE,
  "Life Time Peach Tree Corners": LIFETIME_PEACHTREE,
  // lifetime.life/life-time-locations/ca-rancho-san-clemente
  "Life Time Rancho San Clemente": LIFETIME_RSC,
  "Lifetime Rancho San Clemente": LIFETIME_RSC,
  // ⚠ NOT the Sports Center: Pickleball Virginia Beach is the former Owl Creek
  // Tennis Center (44 outdoor courts), the actual host site. Street from the
  // city's RFP page (parks.virginiabeach.gov); ZIP from listings.
  "Pickleball Virginia Beach": {
    streetAddress: "928 S Birdneck Rd",
    addressLocality: "Virginia Beach",
    addressRegion: "VA",
    postalCode: "23451",
    addressCountry: "US",
  },
  // slc.gov/parks — the city publishes only the park's address (600 Harvey
  // Milk Blvd); the courts' own street (1101 Constitution Dr E) is directory-
  // only, so it is left off.
  "Liberty Park Courts": {
    addressLocality: "Salt Lake City",
    addressRegion: "UT",
    postalCode: "84105",
    addressCountry: "US",
  },
  // chickennpickle.com/locations/overland-park
  "Chicken N Pickle — Overland Park": {
    streetAddress: "5901 W 135th St",
    addressLocality: "Overland Park",
    addressRegion: "KS",
    postalCode: "66223",
    addressCountry: "US",
  },
  // usta.com — our campuses
  "USTA National Campus": {
    streetAddress: "10000 USTA Blvd",
    addressLocality: "Orlando",
    addressRegion: "FL",
    postalCode: "32827",
    addressCountry: "US",
  },
  // dignityhealthsportspark.com
  "Dignity Health Sports Park": {
    streetAddress: "18400 Avalon Blvd",
    addressLocality: "Carson",
    addressRegion: "CA",
    postalCode: "90746",
    addressCountry: "US",
  },
  // atlantaathleticclub.org/About_Us
  "Atlanta Athletic Club": {
    streetAddress: "1930 Bobby Jones Dr",
    addressLocality: "Johns Creek",
    addressRegion: "GA",
    postalCode: "30097",
    addressCountry: "US",
  },
  // miamibeachfl.gov — the tennis center is in North Shore Park "at 501 72 Street"; ZIP from listings
  "Miami Beach Tennis Center": {
    streetAddress: "501 72nd St",
    addressLocality: "Miami Beach",
    addressRegion: "FL",
    postalCode: "33141",
    addressCountry: "US",
  },
  // Third spelling of the Northbrook club (the feed's 2027 Chicago Challenger row).
  "Life Time North Shore": {
    streetAddress: "1300 Techny Rd",
    addressLocality: "Northbrook",
    addressRegion: "IL",
    postalCode: "60062",
    addressCountry: "US",
  },
};
