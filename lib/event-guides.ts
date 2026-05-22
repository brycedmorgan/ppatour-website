/**
 * Per-event travel + trip guides ("Ragnar for the people coming"). Broadcast
 * windows and order-of-play times are templated from the date range in the
 * event page; this file holds the city-specific trip content. Picks are
 * representative, well-known spots near each venue — the local team finalizes
 * official hotel + partner details closer to each event.
 */

export type Place = { name: string; tag: string; note: string };

export type EventGuide = {
  /** Map query — venue + city + state. Drives the Google Maps embed. */
  mapQuery: string;
  airport: string;
  airportNote: string;
  gettingThere: string;
  parking: string;
  hotels: Place[];
  dining: Place[];
  doing: Place[];
};

export const eventGuides: Record<string, EventGuide> = {
  "veolia-atlanta-championships": {
    mapQuery: "Life Time Peachtree Corners, GA",
    airport: "ATL",
    airportNote: "Hartsfield-Jackson · ~35 min to venue",
    gettingThere:
      "Fly into ATL, the world's busiest airport, with nonstops from nearly everywhere. The venue sits 35 minutes north in Peachtree Corners; rideshare and rental are both easy.",
    parking:
      "On-site lots open daily at 8:00 AM — $20/day, or free with a Reserved+ ticket. Overflow shuttle runs every 15 min from the North lot.",
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
  "rate-las-vegas-open": {
    mapQuery: "Darling Tennis Center, Las Vegas, NV",
    airport: "LAS",
    airportNote: "Harry Reid Intl · ~20 min to venue",
    gettingThere:
      "LAS is 20 minutes from the courts and walkable to the Strip's hotels. No car needed — rideshare covers the whole trip.",
    parking:
      "Free on-site parking all week. Strip hotels run rideshare pickup zones; budget 25 min on Championship Sunday.",
    hotels: [
      { name: "ARIA Resort & Casino", tag: "Official Tour Hotel", note: "Center-Strip · tour rate" },
      { name: "Virgin Hotels Las Vegas", tag: "Off-Strip", note: "Quieter · closest to courts" },
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
  "veolia-cincinnati-cup": {
    mapQuery: "Lindner Family Tennis Center, Mason, OH",
    airport: "CVG",
    airportNote: "Cincinnati/N. Kentucky · ~40 min to venue",
    gettingThere:
      "Fly into CVG and drive 40 minutes north to Mason. A rental is the easy call — the venue and hotels are spread across the suburbs.",
    parking:
      "Free on-site parking at the tennis center. Accessible drop-off at Gate A; lots open 8:00 AM.",
    hotels: [
      { name: "Great Wolf Lodge Mason", tag: "Family", note: "5 min · indoor water park" },
      { name: "21c Museum Hotel", tag: "Boutique", note: "Downtown · 35 min, art-hotel" },
    ],
    dining: [
      { name: "Montgomery Inn", tag: "Ribs", note: "Cincinnati's famous BBQ" },
      { name: "Sotto", tag: "Italian", note: "Downtown date-night spot" },
      { name: "Skyline Chili", tag: "Icon", note: "Cincinnati-style chili" },
    ],
    doing: [
      { name: "Kings Island", tag: "Thrills", note: "Coasters next door in Mason" },
      { name: "Cincinnati Riverfront", tag: "Outdoors", note: "Smale Park + Roebling Bridge" },
    ],
  },
  "veolia-chicago-open": {
    mapQuery: "Life Time Schaumburg, IL",
    airport: "ORD",
    airportNote: "O'Hare · ~25 min to venue",
    gettingThere:
      "O'Hare is 25 minutes from Schaumburg. Stay in the suburbs near the courts, or downtown and make the easy reverse-commute out.",
    parking:
      "Free on-site lots. Metra's Schaumburg stop is a 10-min rideshare; downtown fans can train out.",
    hotels: [
      { name: "Renaissance Schaumburg", tag: "Official Tour Hotel", note: "Walk to venue · tour rate" },
      { name: "The Langham, Chicago", tag: "City Luxury", note: "Downtown · make a city weekend" },
    ],
    dining: [
      { name: "Lou Malnati's", tag: "Deep Dish", note: "The Chicago pizza pilgrimage" },
      { name: "Alinea", tag: "Fine Dining", note: "3-Michelin · book early" },
      { name: "Portillo's", tag: "Icon", note: "Italian beef + dogs" },
    ],
    doing: [
      { name: "Millennium Park & The Bean", tag: "City", note: "Downtown · 35 min" },
      { name: "Woodfield Mall", tag: "Shopping", note: "Largest in Illinois, next door" },
    ],
  },
  "dallas-open": {
    mapQuery: "Brookhaven Country Club, Dallas, TX",
    airport: "DFW",
    airportNote: "DFW Intl · ~25 min to venue",
    gettingThere:
      "DFW and Love Field both serve Dallas; the venue is 25 minutes from either. Rent a car — the metroplex is built for it.",
    parking:
      "Complimentary club parking with valet on finals weekend. Lots open 8:00 AM.",
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
  "virginia-beach-open": {
    mapQuery: "Virginia Beach Sports Center, VA",
    airport: "ORF",
    airportNote: "Norfolk Intl · ~25 min to venue",
    gettingThere:
      "Fly into ORF, 25 minutes from the oceanfront. The Sports Center is two blocks from the boardwalk — walk to the courts from most hotels.",
    parking:
      "Convention Center garage adjacent · $10/day. Most oceanfront hotels are a 10-min walk.",
    hotels: [
      { name: "Marriott Oceanfront", tag: "Official Tour Hotel", note: "Walk to courts + beach" },
      { name: "The Cavalier", tag: "Historic Luxury", note: "Restored 1927 landmark" },
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
  "veolia-malibu-cup": {
    mapQuery: "Malibu Racquet Club, Malibu, CA",
    airport: "LAX",
    airportNote: "LAX · ~50 min up the PCH",
    gettingThere:
      "Fly into LAX and drive the Pacific Coast Highway 50 minutes north — the commute is half the vacation. A car is essential in Malibu.",
    parking:
      "Limited on-site parking; reserve a spot or use the Cross Creek shuttle. Rideshare drop-off at the club gate.",
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
  "mesa-cup": {
    mapQuery: "Bell Bank Park, Mesa, AZ",
    airport: "PHX",
    airportNote: "Sky Harbor · ~20 min to venue",
    gettingThere:
      "PHX Sky Harbor is 20 minutes from Bell Bank Park. Rent a car for easy hops to Scottsdale and the desert.",
    parking:
      "Free on-site parking across Bell Bank Park's 320 acres. Misting stations + shade on the concourse.",
    hotels: [
      { name: "Sheraton Mesa at Wrigleyville West", tag: "Official Tour Hotel", note: "Walk to venue · tour rate" },
      { name: "The Phoenician", tag: "Resort Luxury", note: "Scottsdale · golf + spa" },
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
  "veolia-national-championships": {
    mapQuery: "Cary Tennis Park, Cary, NC",
    airport: "RDU",
    airportNote: "Raleigh-Durham · ~15 min to venue",
    gettingThere:
      "RDU is only 15 minutes away — the easiest fly-in on tour. Stay in Cary near the courts or downtown Raleigh for nightlife.",
    parking:
      "Free on-site parking at Cary Tennis Park; ADA + drop-off at the main gate. Lots open 8:00 AM.",
    hotels: [
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
  "carvana-ppa-masters": {
    mapQuery: "Hyatt Regency Indian Wells, Palm Springs, CA",
    airport: "PSP",
    airportNote: "Palm Springs Intl · ~25 min to venue",
    gettingThere:
      "PSP lands you 25 minutes from the desert resorts. A car helps for Joshua Tree day trips, but resort shuttles cover the venue.",
    parking:
      "Resort valet + self-park on-site. Shaded cabanas and misters throughout the grounds.",
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
  "pickleball-world-championships": {
    mapQuery: "Dallas, TX",
    airport: "DFW",
    airportNote: "DFW Intl · ~25 min to venue",
    gettingThere:
      "The Worlds land in Dallas — DFW and Love Field both serve it, 25 minutes out. Rent a car for the metroplex.",
    parking:
      "On-site event parking · $20/day, premium valet on finals weekend. Lots open 8:00 AM.",
    hotels: [
      { name: "The Joule", tag: "City Luxury", note: "Downtown · rooftop pool" },
      { name: "Hotel Crescent Court", tag: "Official Tour Hotel", note: "Uptown · tour rate" },
    ],
    dining: [
      { name: "Pecan Lodge", tag: "BBQ", note: "Brisket worth the line" },
      { name: "Uchi", tag: "Sushi", note: "Uptown tasting menu" },
      { name: "Monarch", tag: "Upscale", note: "49th-floor skyline dining" },
    ],
    doing: [
      { name: "Dallas Arboretum", tag: "Outdoors", note: "66 acres on White Rock Lake" },
      { name: "Reunion Tower", tag: "Views", note: "GeO-Deck over the skyline" },
    ],
  },
  "ppa-finals": {
    mapQuery: "Life Time Rancho San Clemente, San Clemente, CA",
    airport: "SNA",
    airportNote: "John Wayne / OC · ~30 min to venue",
    gettingThere:
      "Fly into SNA (Orange County), 30 minutes up the coast — or LAX/SAN within 90. The finale sits between the surf and the hills.",
    parking:
      "On-site lots + beach-trail overflow with shuttle. Reserve finals-weekend parking ahead.",
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
};

export function getEventGuide(slug: string): EventGuide | undefined {
  return eventGuides[slug];
}
