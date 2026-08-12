/**
 * Per-event travel + trip guides ("Ragnar for the people coming"), keyed by
 * tournament slug. Broadcast windows and order-of-play times are templated on
 * the event page; this file holds the city-specific trip content. Picks are
 * representative, well-known spots near each venue — the local team finalizes
 * official hotel + partner details closer to each event.
 */

export type Place = {
  name: string;
  tag: string;
  note: string;
  /** Official group-rate booking link (Kristen Russell, 2026/27 hotel thread). */
  href?: string;
  /** Parent brand key → /public/ppa/hotels/{brand}.png */
  brand?: "marriott" | "hilton" | "ihg" | "bestwestern" | "wyndhamhotels";
  rate?: string;
  cutoff?: string;
};

export type EventGuide = {
  /**
   * Map query — venue + city + state. Drives the Google Maps embed.
   *
   * ⚠ OPTIONAL, AND OMITTING IT IS THE SAFER DEFAULT. Both event pages fall
   * back to `${t.venue}, ${t.city}, ${t.state}`, and `t.venue` comes from the
   * `ppa_tournaments` feed for any stop listed in VENUE_FROM_FEED — so leaving
   * this unset keeps the pin on whatever venue the tour is actually registered
   * at. Setting it pins the map to a hand-typed building that a feed rename
   * can't reach, which is exactly how Virginia Beach ended up mapping to the
   * wrong facility (8/12).
   */
  mapQuery?: string;
  airport: string;
  airportNote: string;
  gettingThere: string;
  hotels: Place[];
  dining: Place[];
  doing: Place[];
  /**
   * ⚠ NO `parking` FIELD, DELIBERATELY. Parking is not trip-guide colour — it is
   * an operational detail the event team finalizes per venue, and every surface
   * must read it through `parkingFor()` below so an unfinalized stop can only
   * ever publish the approved holding line. Removed from the type (not just left
   * unset) so a hand-edit can't quietly put invented copy back on a page.
   */
};

/**
 * One labelled block of an event's parking details, as the event team submits
 * them (General / Premium / ADA / Rideshare). `body` is one entry per
 * paragraph; entries may carry newlines (an address block) and every renderer
 * honours them via `whitespace-pre-line`.
 */
export type ParkingSection = {
  /** Omitted for the single-paragraph holding line, which has nothing to label. */
  heading?: string;
  body: string[];
  /**
   * Substring of `body` to render as a link to the event's Tixr page, where the
   * pass is sold. Purely a rendering hint: `ParkingDetails` only linkifies it if
   * the caller passes a URL, and the caller only passes one when tickets are on
   * sale — so a stop with tickets held back keeps the words as plain text rather
   * than routing around the hold. `parkingText()` never links anything.
   */
  ticketLinkText?: string;
};

/**
 * The approved copy for any stop whose parking isn't finalized yet.
 * Verbatim from the event team's 8/5 request — don't reword it.
 */
export const PARKING_TBA =
  "Parking information will be posted closer to the event date. Please check back for updates.";

/**
 * Finalized, event-team-supplied parking details, keyed by tournament slug.
 * A stop appears here ONLY once its details are confirmed; everything else
 * renders `PARKING_TBA`.
 *
 * ⚠ 8/5: Cary is the only finalized stop. The 17 other stops previously carried
 * hand-written parking copy — free/paid claims, "$10/day", "$20/day or free with
 * a Reserved+ ticket", shuttle and transit details — none of it sourced from the
 * event team. All 18 strings were deleted rather than gated, so the only way to
 * publish parking again is to paste the real details in here.
 *
 * ⚠ EVERY STRING BELOW IS THE EVENT TEAM'S OWN WORDING, PASTED VERBATIM. Don't
 * tighten it for the layout, and don't add a fact the submission doesn't state
 * (a shuttle frequency, a premium price, a pass link) — that is exactly the
 * fabricated-operations bug the 8/5 pass deleted 18 strings to close.
 */
const PARKING_BY_SLUG: Record<string, ParkingSection[]> = {
  // Cary, 8/5 — the event team's submitted copy. ⚠ This REPLACED an earlier
  // hand-written line that said parking was free ON-SITE; the real arrangement
  // is free OFF-SITE with a shuttle, and on-site is paid.
  "veolia-pickleball-national-championships": [
    {
      heading: "General Parking",
      body: [
        "Free off-site parking is available Monday–Sunday, with complimentary shuttle service to and from the venue.",
        "Off-Site Parking Location:\nPhillips Farms\n6800 Good Hope Church Rd.\nCary, NC 27519",
        "Shuttles will begin approximately one hour before the first matches each day and continue until one hour after the final match concludes.",
        "Estimated Shuttle Hours: 6:30 AM – 10:00 PM",
      ],
    },
    {
      heading: "Premium Parking",
      body: [
        "Limited on-site premium parking is available for purchase. A premium parking pass allows you to park on-site at the tournament venue.",
        "Premium parking must be purchased in advance through Tixr. Parking passes will not be sold at the lot.",
      ],
      // ⚠ Links to the event's ticket page, which is where the pass lives — there
      // is no separate parking URL, and no parking SKU in the Tixr snapshot, so
      // the destination is the event, not a pass-specific listing.
      ticketLinkText: "Tixr",
    },
    {
      heading: "ADA Parking",
      body: [
        "A limited number of ADA parking spaces are available on-site. Once ADA parking is full, guests may park in the complimentary off-site lot. At least one ADA-accessible shuttle will operate each day between the off-site lot and the venue.",
        "Guests may also be dropped off at the venue's main entrance.",
      ],
    },
    {
      heading: "Rideshare",
      body: [
        "Uber, Lyft, and other rideshare services may pick up and drop off passengers at the tournament venue.",
      ],
    },
  ],
};

/** Parking details for an event page — finalized sections, or the holding line. */
export function parkingFor(slug: string): ParkingSection[] {
  return PARKING_BY_SLUG[slug] ?? [{ body: [PARKING_TBA] }];
}

/**
 * The same details flattened to plain text, for surfaces that can't render
 * blocks — the concierge's chat answer and the search index. Derived from the
 * one source above so it can never disagree with the page.
 */
export function parkingText(slug: string): string {
  return parkingFor(slug)
    .map((s) => [s.heading, ...s.body].filter(Boolean).join("\n"))
    .join("\n\n");
}

export const eventGuides: Record<string, EventGuide> = {
  "veolia-pickleball-national-championships": {
    mapQuery: "Cary Tennis Park, Cary, NC",
    airport: "RDU",
    airportNote: "Raleigh-Durham · ~15 min to venue",
    gettingThere:
      "RDU is only 15 minutes away — the easiest fly-in on tour. Stay in Cary near the courts, or downtown Raleigh for nightlife.",
    hotels: [
      {
        name: "Holiday Inn Raleigh-Durham Airport",
        tag: "Official",
        note: "930 Airport Blvd, Morrisville — group rate via the PPA block",
        href: "https://www.ihg.com/redirect?path=rates&brandCode=HI&localeCode=en&regionCode=1&hotelCode=RDUMS&GPC=UPA&cn=no&showApp=true",
        brand: "ihg",
        cutoff: "Book by Jul 31",
      },
      {
        name: "Home2 Suites Raleigh-Durham Airport",
        tag: "Official",
        note: "Suites near RDU — PPA group block",
        href: "https://www.hilton.com/en/book/reservation/deeplink/?ctyhocn=RDUTPHT&groupCode=CHT90G&arrivaldate=2026-08-30&departuredate=2026-09-07&cid=OM,WW,HILTONLINK,EN,DirectLink&fromId=HILTONLINKDIRECT",
        brand: "hilton",
        cutoff: "Book by Jul 30",
      },
      { name: "The Umstead Hotel and Spa", tag: "5-Star", note: "Cary · forest-level luxury" },
      { name: "The Mayton", tag: "Boutique", note: "Downtown Cary · walkable" },
    ],
    dining: [
      { name: "Angus Barn", tag: "Steak", note: "Raleigh's special-occasion legend" },
      { name: "Bida Manda", tag: "Laotian", note: "Downtown Raleigh standout" },
      { name: "Postmaster", tag: "Cocktails", note: "Cary's date-night bar" },
    ],
    doing: [
      { name: "Downtown Raleigh Museums", tag: "Culture", note: "Free art + history museums" },
      { name: "William B. Umstead Park", tag: "Outdoors", note: "Trails between Cary + Raleigh" },
    ],
  },
  // ⚠ Venue deliberately unnamed — Bryan Renahan, 8/4: "Cincy should not have
  // Lindner Family Tennis Center listed anywhere. No venue for now." The
  // getting-there copy was written around that venue (Mason, Gate A, "the
  // tennis center"), so it's been reduced to what's true without one.
  // Restore specifics only when the real venue is confirmed.
  "veolia-cincinnati-cup": {
    mapQuery: "Cincinnati, OH",
    airport: "CVG",
    airportNote: "Cincinnati/N. Kentucky International",
    gettingThere:
      "Fly into CVG. A rental car is the easy call — the host hotels are spread across the metro. Venue details are still to be announced.",
    hotels: [
      { name: "21c Museum Hotel", tag: "Boutique", note: "Downtown art-hotel" },
    ],
    dining: [
      { name: "Montgomery Inn", tag: "Ribs", note: "Cincinnati's famous BBQ" },
      { name: "Sotto", tag: "Italian", note: "Downtown date-night spot" },
      { name: "Skyline Chili", tag: "Icon", note: "Cincinnati-style chili" },
    ],
    doing: [
      { name: "Kings Island", tag: "Thrills", note: "Coasters ~30 min north in Mason" },
      { name: "Cincinnati Riverfront", tag: "Outdoors", note: "Smale Park + Roebling Bridge" },
    ],
  },
  "rate-las-vegas-open": {
    mapQuery: "Darling Tennis Center, Las Vegas, NV",
    airport: "LAS",
    airportNote: "Harry Reid Intl · ~20 min to venue",
    gettingThere:
      "LAS is 20 minutes from the courts and walkable to the Strip's hotels. No car needed — rideshare covers the whole trip.",
    hotels: [
      {
        name: "JW Marriott Las Vegas Resort & Spa",
        tag: "Official",
        note: "221 N Rampart Blvd — resort HQ for the PPA block",
        href: "https://book.passkey.com/e/51292362",
        brand: "marriott",
        cutoff: "Book by Aug 28",
      },
      {
        name: "Best Western Plus Las Vegas West",
        tag: "Official",
        note: "8669 W Sahara Ave — PPA group rate",
        href: "https://www.bestwestern.com/en_US/book/hotel-rooms.29084.html?groupId=L43HF0G9",
        brand: "bestwestern",
        cutoff: "Book by Aug 28",
      },
      {
        name: "La Quinta Las Vegas Red Rock/Summerlin",
        tag: "Official",
        note: "9570 W Sahara Ave — PPA group rate",
        href: "https://www.wyndhamhotels.com/laquinta/las-vegas-nevada/la-quinta-las-vegas-redrock-summerlin/overview",
        brand: "wyndhamhotels",
        cutoff: "Book by Jul 31",
      },
    ],
    dining: [
      { name: "Bazaar Meat by José Andrés", tag: "Upscale", note: "The Strip's best steak" },
      { name: "Carbone", tag: "Italian", note: "Reserve well ahead" },
      { name: "In-N-Out Burger", tag: "Icon", note: "The post-match move" },
    ],
    doing: [
      { name: "The Strip & Bellagio Fountains", tag: "Nightlife", note: "Free show every 30 min" },
      { name: "Red Rock Canyon", tag: "Outdoors", note: "20 min · hikes + scenic drive" },
    ],
  },
  "veolia-chicago-cup": {
    mapQuery: "Life Time Northbrook, IL",
    airport: "ORD",
    airportNote: "O'Hare · ~20 min to venue",
    gettingThere:
      "O'Hare is 20 minutes from Northbrook on the North Shore. Stay in the suburbs near the courts, or downtown and reverse-commute out.",
    hotels: [
      {
        name: "DoubleTree Chicago-North Shore",
        tag: "Official",
        note: "9599 Skokie Blvd, Skokie — PPA event block",
        href: "https://www.hilton.com/en/attend-my-event/chiccdt-90g-84f952e7-f2e9-4af2-93d4-31e2859ef2b7/",
        brand: "hilton",
      },
      {
        name: "Holiday Inn Express Prospect Heights",
        tag: "Official",
        note: "600 N Milwaukee Ave, Prospect Heights — PPA group rate",
        // ⚠ NO href ON PURPOSE. The link from Kristen's thread 404s at IHG
        // (verified 7/29 with a browser UA — a real 404, not IHG's usual 403
        // bot-block): its `qSlH=CHIAM` hotel code isn't Prospect Heights, and
        // every other IHG link in this file uses the /redirect?hotelCode= form.
        // The row degrades to name + address + rate with no Book button, which
        // beats sending a fan to a dead page. Guessing a hotel code risks
        // booking them into the wrong hotel — needs the real link from Kristen.
        brand: "ihg",
      },
    ],
    dining: [
      { name: "Lou Malnati's", tag: "Deep Dish", note: "The Chicago pizza pilgrimage" },
      { name: "Alinea", tag: "Fine Dining", note: "3-Michelin · book early" },
      { name: "Portillo's", tag: "Icon", note: "Italian beef + dogs" },
    ],
    doing: [
      { name: "Chicago Botanic Garden", tag: "Outdoors", note: "Glencoe · 10 min north" },
      { name: "Millennium Park & The Bean", tag: "City", note: "Downtown · 40 min" },
    ],
  },
  // ⚠ No `mapQuery` — the pin derives from the feed's venue (see the type note).
  // It was "Virginia Beach Sports Center, VA", the wrong building.
  //
  // ⚠ And the getting-there copy was written around that wrong venue: it said
  // "The Sports Center is two blocks from the boardwalk — walk to the courts
  // from most hotels." Pickleball Virginia Beach is ~2 miles inland on S
  // Birdneck Rd, so that sentence sent guests walking to the wrong place. Cut
  // back to what's true without venue-specific logistics, the same call as
  // Cincinnati above. The event team owns the replacement line.
  "virginia-beach-open": {
    airport: "ORF",
    airportNote: "Norfolk Intl · ~25 min to venue",
    gettingThere:
      "Fly into ORF, about 25 minutes from the oceanfront. Most guests stay at the beach and drive over to the courts.",
    hotels: [
      {
        name: "Hampton Inn Virginia Beach Oceanfront South",
        tag: "Official",
        note: "1011 Atlantic Ave — oceanfront, PPA group block",
        href: "https://www.hilton.com/en/book/reservation/rooms/?ctyhocn=ORFOFHX&arrivalDate=2026-10-11&departureDate=2026-10-19&groupCode=CHH90J&room1NumAdults=1&cid=OM%2CWW%2CHILTONLINK%2CEN%2CDirectLink",
        brand: "hilton",
        rate: "$119/night",
        cutoff: "Book by Sep 10",
      },
    ],
    dining: [
      { name: "Waterman's Surfside Grille", tag: "Seafood", note: "Oceanfront · the famous orange crush" },
      { name: "Terrapin", tag: "Upscale", note: "Local farm-to-table favorite" },
      { name: "Doc Taylor's", tag: "Breakfast", note: "Pre-match beach breakfast" },
    ],
    doing: [
      { name: "The Boardwalk", tag: "Beach", note: "3 miles of oceanfront" },
      { name: "First Landing State Park", tag: "Outdoors", note: "Trails + cypress swamp" },
    ],
  },
  "proton-daytona-beach-open": {
    mapQuery: "Pictona at Holly Hill, FL",
    airport: "DAB",
    airportNote: "Daytona Beach Intl · ~10 min · or MCO ~70 min",
    gettingThere:
      "DAB is 10 minutes away; Orlando (MCO) is an easy hour for more flight options. Pictona is one of the country's premier pickleball complexes.",
    hotels: [
      { name: "Hard Rock Hotel Daytona Beach", tag: "Oceanfront", note: "On the sand · 10 min" },
      { name: "The Shores Resort & Spa", tag: "Resort", note: "Daytona Beach Shores" },
    ],
    dining: [
      { name: "Aunt Catfish's on the River", tag: "Southern", note: "Daytona brunch institution" },
      { name: "The Cellar", tag: "Italian", note: "Fine dining in a historic home" },
      { name: "Racing's North Turn", tag: "Beachside", note: "Eat on the old beach course" },
    ],
    doing: [
      { name: "Daytona International Speedway", tag: "Iconic", note: "Track tours year-round" },
      { name: "Daytona Beach Boardwalk", tag: "Beach", note: "Pier, rides, and the sand" },
    ],
  },
  "veolia-malibu-cup": {
    mapQuery: "Pepperdine University, Malibu, CA",
    airport: "LAX",
    airportNote: "LAX · ~50 min up the PCH",
    gettingThere:
      "Fly into LAX and drive the Pacific Coast Highway 50 minutes north — the commute is half the vacation. A car is essential in Malibu.",
    hotels: [
      { name: "Malibu Beach Inn", tag: "Beachfront", note: "On Carbon Beach · tour rate" },
      { name: "Calamigos Guest Ranch", tag: "Resort", note: "In the hills · spa + pool" },
    ],
    dining: [
      { name: "Nobu Malibu", tag: "Upscale", note: "Oceanfront sushi institution" },
      { name: "Malibu Farm", tag: "Casual", note: "Farm-to-table on the pier" },
      { name: "Reel Inn", tag: "Icon", note: "Roadside seafood shack" },
    ],
    doing: [
      { name: "Zuma Beach", tag: "Beach", note: "Malibu's signature surf" },
      { name: "Getty Villa", tag: "Culture", note: "Antiquities above the coast" },
    ],
  },
  "carvana-ppa-masters": {
    mapQuery: "Hyatt Regency Indian Wells, CA",
    airport: "PSP",
    airportNote: "Palm Springs Intl · ~25 min to venue",
    gettingThere:
      "PSP lands you 25 minutes from the desert resorts. A car helps for Joshua Tree day trips, but resort shuttles cover the venue.",
    hotels: [
      { name: "Parker Palm Springs", tag: "Design Icon", note: "Mid-century desert glamour" },
      { name: "Ritz-Carlton, Rancho Mirage", tag: "Resort Luxury", note: "Cliffside · tour rate" },
    ],
    dining: [
      { name: "Workshop Kitchen + Bar", tag: "Upscale", note: "Award-winning, downtown PS" },
      { name: "Mr. Lyons Steakhouse", tag: "Steak", note: "Old-Hollywood supper club" },
      { name: "Las Casuelas Terraza", tag: "Icon", note: "Palm Canyon Mexican staple" },
    ],
    doing: [
      { name: "Aerial Tramway", tag: "Views", note: "2.5 miles up Mt. San Jacinto" },
      { name: "Joshua Tree National Park", tag: "Outdoors", note: "1 hr · otherworldly desert" },
    ],
  },
  "minneapolis-indoor-open": {
    mapQuery: "Life Time Lakeville, MN",
    airport: "MSP",
    airportNote: "Minneapolis-St. Paul · ~25 min to venue",
    gettingThere:
      "MSP is 25 minutes north of Lakeville. A January indoor stop — rent a car and keep the coat handy between the hotel and the courts.",
    hotels: [
      { name: "Hyatt Regency Minneapolis", tag: "City Base", note: "Skyway-connected downtown" },
      { name: "Hotel Ivy, Luxury Collection", tag: "Boutique", note: "Downtown landmark" },
    ],
    dining: [
      { name: "Matt's Bar", tag: "Icon", note: "Home of the Jucy Lucy" },
      { name: "Spoon and Stable", tag: "Fine Dining", note: "North Loop · book ahead" },
      { name: "Young Joni", tag: "Wood-Fired", note: "Pizza + Korean, NE Minneapolis" },
    ],
    doing: [
      { name: "Mall of America", tag: "Indoors", note: "Bloomington · 20 min" },
      { name: "Walker Art Center", tag: "Culture", note: "Sculpture garden + galleries" },
    ],
  },
  "cape-coral-open": {
    mapQuery: "Cape Coral, FL",
    airport: "RSW",
    airportNote: "Southwest Florida Intl · ~30 min to venue",
    gettingThere:
      "Fly into RSW (Fort Myers), 30 minutes from Cape Coral's canals. A car opens up the Gulf beaches and Sanibel.",
    hotels: [
      { name: "Westin Cape Coral at Marina Village", tag: "Waterfront", note: "Marina views · tour rate" },
      { name: "The Westin Fort Myers", tag: "Resort", note: "20 min · riverfront" },
    ],
    dining: [
      { name: "Lobster Lady Seafood", tag: "Seafood", note: "Cape Coral's local favorite" },
      { name: "Fathoms", tag: "Waterfront", note: "Dock-and-dine on the canal" },
      { name: "Nevermind Awesome Bar", tag: "Casual", note: "Rooftop + arcade" },
    ],
    doing: [
      { name: "Cape Coral Canals", tag: "On Water", note: "400 miles · boat + jet-ski tours" },
      { name: "Sanibel Island", tag: "Beach", note: "Shelling + lighthouse · 45 min" },
    ],
  },
  "carvana-mesa-cup": {
    mapQuery: "Bell Bank Park, Mesa, AZ",
    airport: "PHX",
    airportNote: "Sky Harbor · ~20 min to venue",
    gettingThere:
      "PHX Sky Harbor is 20 minutes from Bell Bank Park. Rent a car for easy hops to Scottsdale and the desert.",
    hotels: [
      {
        name: "Four Points by Sheraton Mesa Gateway",
        tag: "Official",
        note: "6850 E Williams Field Rd, Mesa — PPA group block",
        href: "https://app.marriott.com/resview2?id=83702845276&key=GRP&app=resvlink",
        brand: "marriott",
        rate: "$135/night",
        cutoff: "Book by Aug 14",
      },
      {
        name: "Hampton Inn & Suites Phoenix/Gilbert",
        tag: "Official",
        note: "3265 S Market St, Gilbert — PPA group block",
        href: "https://www.hilton.com/en/book/reservation/deeplink/?ctyhocn=PHXGTHX&groupCode=CHHUNI&arrivaldate=2026-09-13&departuredate=2026-09-21&cid=OM,WW,HILTONLINK,EN,DirectLink&fromId=HILTONLINKDIRECT",
        brand: "hilton",
        rate: "$129/night",
        cutoff: "Book by Aug 14",
      },
    ],
    dining: [
      { name: "Pizzeria Bianco", tag: "Icon", note: "America's best pizza, per many" },
      { name: "Joe's Real BBQ", tag: "BBQ", note: "Old-town Gilbert classic" },
      { name: "Worth Takeaway", tag: "Casual", note: "Sandwiches worth the drive" },
    ],
    doing: [
      { name: "Old Town Scottsdale", tag: "Nightlife", note: "Dining + galleries · 25 min" },
      { name: "Usery Mountain Park", tag: "Outdoors", note: "Desert hikes at sunrise" },
    ],
  },
  "newport-beach-open": {
    mapQuery: "Tennis Club at Newport Beach, CA",
    airport: "SNA",
    airportNote: "John Wayne / OC · ~10 min to venue",
    gettingThere:
      "SNA (Orange County) is 10 minutes away — the cushiest fly-in on the calendar. LAX is 60 if you need more flights.",
    hotels: [
      { name: "Balboa Bay Resort", tag: "Waterfront", note: "On the harbor · tour rate" },
      { name: "Lido House, Autograph Collection", tag: "Boutique", note: "Walk to the peninsula" },
    ],
    dining: [
      { name: "The Cannery", tag: "Seafood", note: "Harborfront dining + brunch" },
      { name: "Bear Flag Fish Co.", tag: "Casual", note: "Best fish tacos in town" },
      { name: "Five Crowns", tag: "Upscale", note: "Corona del Mar classic" },
    ],
    doing: [
      { name: "Balboa Island & Fun Zone", tag: "Harbor", note: "Ferry, frozen bananas, strolls" },
      { name: "Crystal Cove State Park", tag: "Beach", note: "Tide pools + coastal trails" },
    ],
  },
  "texas-open": {
    mapQuery: "The Courts of McKinney, McKinney, TX",
    airport: "DFW",
    airportNote: "DFW Intl · ~35 min to McKinney",
    gettingThere:
      "DFW and Love Field both serve the metroplex; the Courts of McKinney sit about 35 minutes north. Rent a car — north Dallas is built for it, and downtown is an easy hop.",
    hotels: [
      { name: "The Joule", tag: "City Luxury", note: "Downtown · rooftop pool" },
      { name: "Hotel Crescent Court", tag: "Official Tour Hotel", note: "Uptown · tour rate" },
    ],
    dining: [
      { name: "Pecan Lodge", tag: "BBQ", note: "Brisket worth the line" },
      { name: "Uchi", tag: "Sushi", note: "Uptown tasting menu" },
      { name: "Whataburger", tag: "Icon", note: "The Texas late-night classic" },
    ],
    doing: [
      { name: "Dallas Arboretum", tag: "Outdoors", note: "66 acres on White Rock Lake" },
      { name: "Reunion Tower", tag: "Views", note: "GeO-Deck over the skyline" },
    ],
  },
  "greater-zion-cup": {
    mapQuery: "Black Desert Resort, Ivins, UT",
    airport: "SGU",
    airportNote: "St. George Regional · ~20 min · or LAS ~2 hr",
    gettingThere:
      "SGU is 20 minutes out; many fly into Las Vegas and make the scenic 2-hour desert drive. Black Desert is a brand-new resort venue.",
    hotels: [
      { name: "Black Desert Resort", tag: "On-Site", note: "Stay at the venue · tour rate" },
      { name: "Inn on the Cliff", tag: "Views", note: "Boutique above St. George" },
    ],
    dining: [
      { name: "Cliffside Restaurant", tag: "Views", note: "Sweeping red-rock dining" },
      { name: "Wood.Ash.Rye", tag: "Upscale", note: "Wood-fired, downtown St. George" },
      { name: "George's Corner", tag: "Casual", note: "Local pub on Main Street" },
    ],
    doing: [
      { name: "Zion National Park", tag: "Bucket List", note: "45 min · the Narrows + Angels Landing" },
      { name: "Snow Canyon State Park", tag: "Outdoors", note: "Lava tubes + slickrock, 15 min" },
    ],
  },
  "sacramento-open": {
    mapQuery: "Life Time Arden, Sacramento, CA",
    airport: "SMF",
    airportNote: "Sacramento Intl · ~20 min to venue",
    gettingThere:
      "SMF is 20 minutes from the courts. Spring in the capital — wine country and Tahoe are both easy day trips with a car.",
    hotels: [
      { name: "The Citizen Hotel, Autograph Collection", tag: "Boutique", note: "Downtown landmark" },
      { name: "Kimpton Sawyer", tag: "City", note: "On the Downtown Commons" },
    ],
    dining: [
      { name: "The Kitchen", tag: "Fine Dining", note: "Michelin-starred tasting" },
      { name: "Mulvaney's B&L", tag: "Farm-to-Fork", note: "Sacramento's signature ethos" },
      { name: "Frank Fat's", tag: "Icon", note: "Capitol-crowd Chinese since 1939" },
    ],
    doing: [
      { name: "Old Sacramento Waterfront", tag: "History", note: "Gold-rush boardwalk + riverboats" },
      { name: "Crocker Art Museum", tag: "Culture", note: "Oldest art museum in the West" },
    ],
  },
  "atlanta-pickleball-championships": {
    mapQuery: "Life Time Peachtree Corners, GA",
    airport: "ATL",
    airportNote: "Hartsfield-Jackson · ~35 min to venue",
    gettingThere:
      "Fly into ATL, the world's busiest airport, with nonstops from nearly everywhere. The venue sits 35 minutes north in Peachtree Corners.",
    hotels: [
      { name: "Le Méridien Atlanta Perimeter", tag: "Official Tour Hotel", note: "15 min · tour rate + shuttle" },
      { name: "Hyatt Regency Atlanta", tag: "City Base", note: "Downtown · 30 min, near the BeltLine" },
    ],
    dining: [
      { name: "Ponce City Market", tag: "Food Hall", note: "Dozens of stalls under one roof" },
      { name: "Bone's Steakhouse", tag: "Upscale", note: "Atlanta's classic power dinner" },
      { name: "The Varsity", tag: "Icon", note: "Chili dogs since 1928" },
    ],
    doing: [
      { name: "The Atlanta BeltLine", tag: "Outdoors", note: "Walk/bike the city's loop" },
      { name: "Mercedes-Benz Stadium", tag: "Sports", note: "Tours + events downtown" },
    ],
  },
  "ppa-finals": {
    mapQuery: "Life Time Rancho San Clemente, San Clemente, CA",
    airport: "SNA",
    airportNote: "John Wayne / OC · ~30 min to venue",
    gettingThere:
      "Fly into SNA (Orange County), 30 minutes up the coast — or LAX/SAN within 90. The finale sits between the surf and the hills.",
    hotels: [
      { name: "Ritz-Carlton, Laguna Niguel", tag: "5-Star", note: "Clifftop · 15 min north" },
      { name: "San Clemente Cove Resort", tag: "Coastal", note: "Walk to the pier" },
    ],
    dining: [
      { name: "The Fisherman's", tag: "Seafood", note: "On the San Clemente Pier" },
      { name: "South of Nick's", tag: "Mexican", note: "Coastal patio + margaritas" },
      { name: "Nick's San Clemente", tag: "Upscale", note: "Del Mar Street mainstay" },
    ],
    doing: [
      { name: "San Clemente Beach Trail", tag: "Beach", note: "2.3 miles along the sand" },
      { name: "Trestles", tag: "Surf", note: "World-famous break next door" },
    ],
  },
  "pickleball-world-championships": {
    mapQuery: "Brookhaven Country Club, Farmers Branch, TX",
    airport: "DFW",
    airportNote: "DFW Intl · ~15 min to venue",
    gettingThere:
      "DFW lands you 15 minutes from the venue — the easiest fly-in on the calendar. Love Field is 20 min south. Rent a car; the metroplex is built for it.",
    hotels: [
      {
        name: "Sheraton Dallas by the Galleria",
        tag: "Official",
        note: "2026 World Pickleball fans block",
        href: "https://app.marriott.com/reslink?id=73858550544&key=GRP&app=resvlink",
        brand: "marriott",
        rate: "$139/night",
        cutoff: "Book by Oct 16",
      },
      {
        name: "Renaissance Dallas North",
        tag: "Official",
        note: "1590 LBJ Fwy — breakfast for 2, free parking + wi-fi",
        href: "https://app.marriott.com/resview2?id=80516175834&key=GRP&app=resvlink",
        brand: "marriott",
        rate: "$125/night",
        cutoff: "Book by Oct 26",
      },
      {
        name: "DoubleTree Dallas Near the Galleria",
        tag: "Official",
        note: "4099 Valley View Ln — breakfast for 2, free parking + wi-fi",
        href: "https://www.hilton.com/en/book/reservation/deeplink/?ctyhocn=DALVVDT&groupCode=DTPKL&arrivaldate=2026-11-02&departuredate=2026-11-08&cid=OM,WW,HILTONLINK,EN,DirectLink&fromId=HILTONLINKDIRECT",
        brand: "hilton",
        rate: "$135/night",
        cutoff: "Book by Sep 30",
      },
      {
        name: "Hampton Inn & Suites Farmers Branch",
        tag: "Official",
        note: "1570 Mira Lago Blvd — hot breakfast, free parking + wi-fi",
        // Was an `links.h6.hilton.com` email-tracking URL out of Kristen's
        // thread. Resolved it 7/29 (200 → this canonical attend-my-event page)
        // and swapped it in — tracking redirects expire, the canonical doesn't.
        // Also closes the "needs Kristen's confirmation" flag from 7/16: good.
        href: "https://www.hilton.com/en/attend-my-event/daljkhx-pic-85a4022e-fa11-4731-bad1-08d2d00cc291/",
        brand: "hilton",
        rate: "$139 until Aug 31, then $159",
        cutoff: "Book by Aug 31",
      },
      {
        name: "Holiday Inn Express Dallas NW Farmers Branch",
        tag: "Official",
        note: "1570 LBJ Fwy — code Pickleball2026, breakfast bar + pool",
        href: "https://www.ihg.com/redirect?path=rates&brandCode=EX&localeCode=en&regionCode=1&hotelCode=DFWBF&GPC=PKL&cn=no&showApp=true",
        brand: "ihg",
        rate: "$144/night",
        cutoff: "Book by Oct 2",
      },
      {
        name: "Candlewood Suites Farmers Branch",
        tag: "Official",
        note: "1561 Mira Largo Blvd — code Pickleball2026, free laundry + parking",
        href: "https://www.ihg.com/redirect?path=rates&brandCode=CW&localeCode=en&regionCode=1&hotelCode=DFWFB&GPC=PKL&cn=no&showApp=true",
        brand: "ihg",
        rate: "$129/night",
        cutoff: "Book by Oct 2",
      },
    ],
    dining: [
      { name: "Pecan Lodge", tag: "BBQ", note: "Brisket worth the line" },
      { name: "Uchi", tag: "Sushi", note: "Uptown tasting menu" },
      { name: "Monarch", tag: "Upscale", note: "49th-floor skyline dining" },
    ],
    doing: [
      { name: "Galleria Dallas", tag: "Indoor", note: "Mall + indoor ice rink · 5 min" },
      { name: "Reunion Tower", tag: "Views", note: "GeO-Deck over the downtown skyline" },
    ],
  },
};

export function getEventGuide(slug: string): EventGuide | undefined {
  return eventGuides[slug];
}
