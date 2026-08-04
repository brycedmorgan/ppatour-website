/**
 * Pickleball Vacations — trip content.
 *
 * Ported from the standalone `pickleball-vacations` project when Vacations
 * moved onto ppatour.com (Aug 2026). Image paths gained a `/vacations/`
 * prefix; everything else is the copy Lainey signed off on.
 *
 * ⚠ This is the ONLY place trip facts live. `/tour/travel` used to carry a
 * hand-transcribed summary of the same trip, which is exactly how a site ends
 * up advertising a resort it no longer books — that page now redirects here.
 */

export const trip = {
  brand: "Pickleball Vacations",
  poweredBy: "Powered by the PPA, MLP & Pickleball Central",
  destination: "Club Med Turkoise",
  location: "Providenciales, Turks & Caicos",
  datesLabel: "December 8–12, 2026",
  nights: 4,
  airportCode: "PLS",
  airportName: "Providenciales International Airport",
  adultsOnly: "Adults only · 18+",
  contactEmail: "vacations@pickleball.com",
  clubMedUrl: "https://www.clubmed.us/r/turkoise/y",
  tagline:
    "The ultimate all-inclusive pickleball experience — designed for players, fans, and travelers who want more than just a vacation.",
  intro:
    "Combining luxury travel with world-class pickleball, Pickleball Vacations delivers unforgettable escapes to premium destinations alongside PPA & MLP professionals, top coaches, and fellow pickleball enthusiasts. From beachfront resorts and all-inclusive amenities to daily clinics, organized play, social events, and exclusive experiences, every trip is built to create the perfect balance of competition, connection, and relaxation.",
  inauguralNote:
    "This December, Pickleball Vacations heads to the adults-only Club Med Turkoise — set along world-famous Grace Bay in Providenciales, Turks & Caicos. Four nights of sun, sand, and pickleball, led by PPA professional Hayden Patriquin. More pros to be announced soon.",
  lineup: "Led by Hayden Patriquin · Adults-only (18+)",
};

/**
 * Rooms contracted with the resort, per occupancy type. Lainey signs for a
 * fixed block when the resort deal is signed and prices the trip's revenue
 * goal off it — so this is a hard ceiling, not a target. The checkout route
 * refuses an option once its rooms are gone, and the pricing cards count down
 * against these numbers.
 *
 * This is the FALLBACK only: the live number is read from Jackalope, where
 * Lainey maintains the block. See lib/vacations/capacity.ts.
 * (Turks & Caicos, contracted 2026-07-31: 10 single + 10 double.)
 */
export const capacity: Record<"single" | "double", number> = {
  single: 10,
  double: 10,
};

/** Show "only N left" on a pricing card once it drops to this many rooms. */
export const scarcityThreshold = 6;

/**
 * Trip-wide sold-out state. While `active` is true the site closes sign-ups:
 * hero and pricing CTAs become waiting-list links, the pricing cards show Sold
 * Out, and /vacations/register replaces the form with a waiting-list notice.
 * To re-open sales, set `active: false` here AND remove the `soldOut` flags in
 * pricing.ts.
 */
export const soldOut = {
  active: false,
  badge: "Sold Out",
  nextTrip: "Next trip dates coming soon",
  headline: "This trip is officially sold out",
  message:
    "Thank you for the incredible response — every room is booked. Join the waiting list and be the first to hear when our next vacation is announced.",
  cta: "Join the Waiting List",
  mailto: `mailto:${trip.contactEmail}?subject=${encodeURIComponent(
    "Waiting List — Next Pickleball Vacation"
  )}&body=${encodeURIComponent(
    "Please add me to the waiting list for the next Pickleball Vacations trip.\n\nName:\nPhone:\n"
  )}`,
};

export const logo = {
  white: "/vacations/brand/PBVacations_White.svg",
  color: "/vacations/brand/PBVacations_Color.svg",
};

export const heroImage = "/vacations/clubmed/turkoise-aerial.jpg";

/** Full-bleed pickleball image band (Club Med co-brand court shot). */
export const bandImage = "/vacations/clubmed/turkoise-courts.jpg";

/** Superior room carousel images (used in The Stay / Accommodations). */
export const roomImages = [
  {
    image: "/vacations/clubmed/rooms/room-1.jpg",
    alt: "Superior room at Club Med Turkoise",
  },
  {
    image: "/vacations/clubmed/rooms/room-2.jpg",
    alt: "Superior room lounge and outdoor space at Club Med Turkoise",
  },
  {
    image: "/vacations/clubmed/rooms/room-3.jpg",
    alt: "Superior room interior at Club Med Turkoise",
  },
];

/**
 * Amenities & optional off-site excursions the resort offers — shown in the
 * "Beyond the Courts" rail in The Stay section.
 */
export const excursions = [
  {
    image: "/vacations/clubmed/excursions/beachfront.jpg",
    title: "Beachfront Escapes",
    caption:
      "Award-winning beach destination on the widest stretch of Grace Bay.",
  },
  {
    image: "/vacations/clubmed/excursions/pool.jpg",
    title: "Poolside Relaxation",
    caption: "Unwind between sessions at the resort pools.",
  },
  {
    image: "/vacations/clubmed/excursions/sailing.jpg",
    title: "Sailing",
    caption: "Cruise the crystal-clear Caribbean waters.",
  },
  {
    image: "/vacations/clubmed/excursions/snorkeling.jpg",
    title: "Snorkeling",
    caption: "Explore vibrant marine life just offshore.",
  },
  {
    image: "/vacations/clubmed/excursions/spa.jpg",
    title: "Spa",
    caption: "Relax & recharge with world-class treatments.",
  },
  {
    image: "/vacations/clubmed/excursions/scuba.jpg",
    title: "Scuba Diving",
    caption:
      "Immerse yourself with abundant marine life in one of the world's best diving destinations.",
  },
  {
    image: "/vacations/clubmed/excursions/private-lessons.jpg",
    title: "Private Lessons with the Pros",
    caption: "Extend your court time & learn from the best in the sport.",
  },
];

/**
 * Pro lineup. Empty while `prosAnnounced` is false — the Pros section shows a
 * "to be announced" panel. Add pro objects here and flip the flag to reveal.
 * `prosMoreComing` keeps the "more pros to be announced" note visible while
 * the lineup is still filling in — set it false once the roster is final.
 */
export const prosAnnounced = true;

export const prosMoreComing = true;

export const pros: {
  name: string;
  role: string;
  image: string;
  leading?: boolean;
  /** Slug on this site, when the pro has a PPA Tour profile to link to. */
  slug?: string;
}[] = [
  {
    name: "Hayden Patriquin",
    role: "PPA Professional",
    image: "/vacations/pros/hayden-patriquin-ppa.jpg",
    leading: true,
    slug: "hayden-patriquin",
  },
];

export const included = [
  "4-night stay at Club Med Turkoise in a Superior room",
  "Daily structured pickleball clinics (8:00 AM–12:00 PM) with professional coaches",
  "8+ hours of dedicated instruction and on-court play with the pros",
  "Unlimited open play on 10 permanent pickleball courts",
  "Skill-based organized play and competitive matchups",
  "All-inclusive dining & beverages",
  "Full access to resort amenities, activities, and daily entertainment",
  "Round-trip ground transportation to and from Providenciales International Airport (PLS)",
  "Wi-Fi and all applicable taxes",
];

export const notIncluded = [
  "Airfare to and from Providenciales International Airport (PLS)",
  "Optional off-site excursions or experiences",
  "Travel insurance (recommended)",
  "Personal pickleball equipment (paddles, shoes, etc.)",
  "Gratuities (at guest discretion)",
];

export const highlights = [
  { stat: "4", label: "Nights all-inclusive" },
  { stat: "8+", label: "Hours with the pros" },
  { stat: "10", label: "Permanent courts" },
  { stat: "18+", label: "Adults-only resort" },
];

export const about = {
  resort:
    "Club Med Turkoise offers an adults-only, all-inclusive escape set along the shores of Grace Bay, one of the most celebrated beaches in the world. Designed for couples, solo travelers, and groups of friends, it's a place to truly disconnect or stay active, depending on your pace. Spend your days diving, sailing, or relaxing on soft white sand, then shift into evenings filled with live music, ocean views, and a social, easygoing atmosphere.",
  play:
    "This vacation is built around pickleball. Each day features structured instructional clinics from 8:00 AM to 12:00 PM, led by our professional coaches, with open courts available throughout the afternoon and evening for unlimited play. Experience 8+ hours of immersive instruction and high-level on-court play alongside our pros — on 10 permanent on-site courts, including 4 dedicated to coaching and instruction during programming hours.",
  levels:
    "Players of all skill levels are welcome, from beginners just getting started to seasoned competitors. Matchups are organized by skill level so everyone enjoys balanced, fun, and competitive games.",
};

export const accommodations = {
  body: "Superior rooms offer a cozy, comfortable retreat with Caribbean-inspired décor and modern amenities. Featuring peaceful garden views, each room includes a king or twin bed, an en-suite bathroom, and convenient in-room amenities. Ideally located near the pool, beach, and resort activities, it's the perfect adults-only escape to relax and unwind.",
  body2:
    "Your all-inclusive stay includes exceptional cuisine, unlimited beverages, and daily entertainment, allowing you to stay focused on playing, training, and enjoying every moment of your pickleball vacation.",
  features: [
    { value: "2", label: "On-site restaurants" },
    { value: "4", label: "Bars" },
    { value: "∞", label: "Included activities" },
  ],
  image: "/vacations/clubmed/rooms/room-2.jpg",
};

export const transportation = {
  body: "Please plan to fly into Providenciales International Airport (PLS) on December 8 and depart on December 12. We recommend arriving in the morning or early afternoon so you can join us for the welcome dinner that evening.",
  body2:
    "Flight details will be collected in advance to coordinate your arrival. Round-trip ground transportation between the PLS airport and the resort will be arranged for you, ensuring a smooth and stress-free start to your vacation. Please follow up with your trip coordinator with final flight details to ensure your round-trip ground arrangements are set.",
};

export type ItineraryDay = {
  day: string;
  title: string;
  events: { time?: string; text: string }[];
};

export const itinerary: ItineraryDay[] = [
  {
    day: "Day 1",
    title: "Arrival",
    events: [
      { time: "4:00–8:00 PM", text: "Resort check-in" },
      { time: "7:30 PM", text: "Welcome group dinner" },
    ],
  },
  {
    day: "Day 2",
    title: "Clinics & Organized Play",
    events: [
      { time: "8:00–11:00 AM", text: "Instructional clinic + skills" },
      { time: "11:00 AM–12:00 PM", text: "Organized play" },
      { text: "Optional excursion (TBD)" },
    ],
  },
  {
    day: "Day 3",
    title: "Skill Sessions & Match Play",
    events: [
      { time: "8:00–10:00 AM", text: "Session 1 — clinic, then match play" },
      { time: "10:00 AM–12:00 PM", text: "Session 2 — clinic, then match play" },
      { text: "Optional excursion (TBD)" },
      { time: "6:00 PM", text: "Cocktail party + pro Q&A" },
    ],
  },
  {
    day: "Day 4",
    title: "Competition & Play with the Pros",
    events: [
      {
        time: "8:00–10:00 AM",
        text: "Session 1 — clinic, then King of the Court",
      },
      {
        time: "10:00 AM–12:00 PM",
        text: "Session 2 — clinic, then competitive games",
      },
      { time: "4:00–6:00 PM", text: "Play with the pros" },
      { time: "7:30 PM", text: "Farewell group dinner" },
    ],
  },
  {
    day: "Day 5",
    title: "Departure",
    events: [
      {
        time: "Before 10:00 AM",
        text: "Check-out (depart resort before 3:00 PM)",
      },
      { text: "Breakfast & lunch included on departure day" },
    ],
  },
];
