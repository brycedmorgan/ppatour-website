/**
 * ARCHIVED TRIP — Club Med Punta Cana (Sept 8–12, 2026). Sold out; kept live
 * at /trips/punta-cana so registered guests can reference the hotel, pros,
 * itinerary, and travel details. Content frozen from the pre-Turkoise site.
 */

const trip = {
  brand: "Pickleball Vacations",
  poweredBy: "Powered by the PPA & MLP",
  destination: "Club Med Punta Cana",
  location: "Punta Cana, Dominican Republic",
  datesLabel: "September 8–12, 2026",
  nights: 4,
  airportCode: "PUJ",
  airportName: "Punta Cana International Airport",
  contactEmail: "vacations@pickleball.com",
  clubMedUrl: "https://www.clubmed.us/r/punta-cana/y",
  tagline:
    "The ultimate all-inclusive pickleball experience — designed for players, fans, and travelers who want more than just a vacation.",
  intro:
    "Combining luxury travel with world-class pickleball, Pickleball Vacations delivers unforgettable escapes to premium destinations alongside PPA & MLP professionals, top coaches, and fellow enthusiasts. From beachfront resorts and all-inclusive amenities to daily clinics, organized play, social events, and exclusive experiences, every trip is built to create the perfect balance of competition, connection, and relaxation.",
  inauguralNote:
    "Our inaugural destination launches at the beautiful all-inclusive Club Med Punta Cana, led by Hayden Patriquin — alongside Chris Crouch, Giovanna Morelli, and Dillon Segur.",
  lineup: "Led by Hayden Patriquin — with Chris, Gio & Dillon",
};

/**
 * Trip-wide sold-out state. While `active` is true the site closes sign-ups:
 * hero/header/footer CTAs become waiting-list links, the pricing cards show
 * Sold Out, and /register replaces the form with a waiting-list notice.
 * To re-open sales, set `active: false` here AND remove the `soldOut` flags
 * in pricing.ts.
 */
const soldOut = {
  active: true,
  badge: "Sold Out",
  nextTrip: "Next trip dates coming soon",
  headline: "Our inaugural trip is officially sold out",
  message:
    "Thank you for the incredible response — every room for Club Med Punta Cana is booked. Join the waiting list and be the first to hear when our next vacation is announced.",
  cta: "Join the Waiting List",
  mailto: `mailto:${trip.contactEmail}?subject=${encodeURIComponent(
    "Waiting List — Next Pickleball Vacation"
  )}&body=${encodeURIComponent(
    "Please add me to the waiting list for the next Pickleball Vacations trip.\n\nName:\nPhone:\n"
  )}`,
};


const heroImage = "/vacations/clubmed/PCAC_J114_001.jpg";

/** Full-bleed pickleball image band (Club Med co-brand court shot). */
const bandImage = "/vacations/clubmed/MPEC_EC_A126_MICE_067.jpg";

/** Superior room carousel images (used in The Stay / Accommodations). */
const roomImages = [
  {
    image: "/vacations/clubmed/rooms/room-1.jpg",
    alt: "Newly renovated Superior room at Club Med Punta Cana",
  },
  {
    image: "/vacations/clubmed/rooms/room-2.jpg",
    alt: "Superior room lounge and outdoor space at Club Med Punta Cana",
  },
  {
    image: "/vacations/clubmed/rooms/room-3.jpg",
    alt: "Superior room interior at Club Med Punta Cana",
  },
];

/**
 * Amenities & optional off-site excursions the resort offers — shown in the
 * "Beyond the Courts" carousel in The Stay section.
 */
const excursions = [
  {
    image: "/vacations/clubmed/excursions/beachfront.jpg",
    title: "Beachfront Escapes",
    caption: "Miles of white-sand shoreline and sunset views.",
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
  // ⚠ Archery and Kayaking were listed here and their images were deleted from
  // the repo on 7/17 when Turkoise replaced Punta Cana — so both tiles have
  // been rendering as 404s on the live guest archive since then (verified
  // 8/4: /clubmed/excursions/archery.jpg and kayaking.jpg both 404).
  // Dropped rather than ported. Restore the entries if the photos resurface.
];

const pros = [
  {
    name: "Hayden Patriquin",
    role: "PPA Professional",
    leading: true,
    image: "/vacations/pros/hayden-patriquin.jpg",
  },
  {
    name: "Chris Crouch",
    role: "PPA Professional",
    leading: true,
    image: "/vacations/pros/chris-crouch.jpg",
  },
  {
    name: "Giovanna Morelli",
    role: "PPA Professional",
    leading: true,
    image: "/vacations/pros/giovanna-morelli.jpg",
  },
  {
    name: "Dillon Segur",
    role: "PPA Professional",
    leading: false,
    image: "/vacations/pros/dillon-segur.jpg",
  },
];

const included = [
  "4-night stay at Club Med Punta Cana in a newly renovated Superior room",
  "Daily structured pickleball clinics (8:00 AM–12:00 PM) with professional coaches",
  "8+ hours of dedicated instruction and on-court play with the pros",
  "Unlimited open play on 8 permanent pickleball courts",
  "Skill-based organized play and competitive matchups",
  "All-inclusive dining & beverages",
  "Full access to resort amenities, activities, and daily entertainment",
  "Round-trip ground transportation to and from Punta Cana International Airport (PUJ)",
  "Wi-Fi and all applicable taxes",
];

const notIncluded = [
  "Airfare to and from Punta Cana (PUJ)",
  "Optional off-site excursions or experiences",
  "Travel insurance (recommended)",
  "Personal pickleball equipment (paddles, shoes, etc.)",
  "Gratuities (at guest discretion)",
];

const highlights = [
  { stat: "4", label: "Nights all-inclusive" },
  { stat: "8+", label: "Hours with the pros" },
  { stat: "8", label: "Permanent courts" },
  { stat: "All", label: "Skill levels welcome" },
];

const about = {
  resort:
    "Club Med Punta Cana is the ultimate all-inclusive resort in the Dominican Republic, offering a blend of relaxation, adventure, and luxury. Nestled on pristine white-sand beaches with the breathtaking turquoise waters of the Caribbean Sea, this tropical haven provides an unforgettable escape.",
  play:
    "This vacation is built around pickleball. Each day features structured instructional clinics from 8:00 AM to 12:00 PM, led by our professional coaches, with open courts available throughout the afternoon and evening for unlimited play. Experience 8+ hours of immersive instruction and high-level on-court play alongside our pros — on 8 permanent courts, including 5 dedicated to PPA coaching during programming hours.",
  levels:
    "Players of all skill levels are welcome, from beginners just getting started to seasoned competitors. Matchups are organized by skill level so everyone enjoys balanced, fun, and competitive games.",
};

const accommodations = {
  body: "You'll stay in the newly renovated Superior rooms, designed as a peaceful retreat inspired by the Dominican coastline. Each spacious room features a comfortable sleeping area, an inviting lounge, a spa-inspired shower, and a private outdoor space — the perfect place to unwind and recharge between sessions.",
  body2:
    "Your all-inclusive stay includes exceptional cuisine, unlimited beverages, and daily entertainment, so you can stay focused on playing, training, and enjoying every moment.",
  features: [
    { value: "3", label: "On-site restaurants" },
    { value: "8", label: "Bars" },
    { value: "∞", label: "Included activities" },
  ],
  image: "/vacations/clubmed/LUXE_J114_088.jpg",
};

const transportation = {
  body: "Please plan to fly into Punta Cana International Airport (PUJ) on September 8 and depart on September 12. We recommend arriving in the morning or early afternoon so you can join us for the welcome dinner that evening.",
  body2:
    "Flight details will be collected in advance to coordinate your arrival. Round-trip ground transportation between the PUJ airport and the resort will be arranged for you, ensuring a smooth and stress-free start to your vacation. Please follow up with your trip coordinator with final flight details to confirm your ground arrangements.",
};

type ItineraryDay = {
  day: string;
  title: string;
  events: { time?: string; text: string }[];
};

const itinerary: ItineraryDay[] = [
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
    title: "Clinics & Open Play",
    events: [
      { time: "8:00–11:00 AM", text: "Instructional clinic + skills" },
      { time: "11:00 AM–12:00 PM", text: "Open play" },
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
      { time: "8:00–10:00 AM", text: "Session 1 — clinic, then King of the Court" },
      { time: "10:00 AM–12:00 PM", text: "Session 2 — clinic, then competitive games" },
      { time: "4:00–6:00 PM", text: "Play with the pros" },
      { time: "7:30 PM", text: "Farewell group dinner" },
    ],
  },
  {
    day: "Day 5",
    title: "Departure",
    events: [
      { time: "Before 10:00 AM", text: "Check-out (depart resort before 3:00 PM)" },
      { text: "Breakfast & lunch included on departure day" },
    ],
  },
];


export const puntaCana = {
  trip,
  soldOut,
  heroImage,
  bandImage,
  roomImages,
  excursions,
  pros,
  included,
  notIncluded,
  highlights,
  about,
  accommodations,
  transportation,
  itinerary,
};
