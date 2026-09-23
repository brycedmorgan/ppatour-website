/**
 * Club Med Cancún — January 26–30, 2027. Led by Connor Garnett.
 *
 * Copy is Lainey's listing doc (Google Doc "Cancun, January 26-30", shared
 * 2026-09-22), lightly edited for the site. Two corrections from that doc,
 * both flagged back to her the day it went live:
 *   - The doc's inclusions list said "Providenciales International Airport
 *     (PLS)" — a paste-over from the Turks listing. Cancún is CUN.
 *   - The doc header said "January 26-30, 2026". That date is in the past;
 *     the trip is 2027 (Tue–Sat, same weekday pattern as every other trip).
 *
 * Images are the Club Med approved set from the shared Drive folder, resized
 * to 1600px and stored under /vacations/clubmed/cancun/.
 */
import type { TripContent } from "../trip-content";

const CONTACT = "vacations@pickleball.com";

const trip: TripContent["trip"] = {
  brand: "Pickleball Vacations",
  poweredBy: "Powered by the PPA, MLP & Pickleball Central",
  destination: "Club Med Cancun",
  location: "Cancún, Mexico",
  datesLabel: "January 26–30, 2027",
  startIso: "2027-01-26",
  nights: 4,
  airportCode: "CUN",
  airportName: "Cancún International Airport",
  who: "All skill levels welcome",
  contactEmail: CONTACT,
  clubMedUrl: "https://www.clubmed.us/r/cancun/y",
  tagline:
    "The ultimate all-inclusive pickleball experience — designed for players, fans, and travelers who want more than just a vacation.",
  intro:
    "Combining luxury travel with world-class pickleball, Pickleball Vacations delivers unforgettable escapes to premium destinations alongside PPA & MLP professionals, top coaches, and fellow pickleball enthusiasts. From beachfront resorts and all-inclusive amenities to daily clinics, organized play, social events, and exclusive experiences, every trip is built to create the perfect balance of competition, connection, and relaxation.",
  inauguralNote:
    "This January, Pickleball Vacations heads to Club Med Cancún — a private peninsula set between the Caribbean Sea and a tranquil lagoon on the Yucatán. Four nights of sun, sand, and pickleball, led by PPA professional Connor Garnett. More pros to be announced soon.",
  lineup: "Led by Connor Garnett · more pros announced soon",
};

const soldOut: TripContent["soldOut"] = {
  active: false,
  badge: "Sold Out",
  nextTrip: "Next trip dates coming soon",
  headline: "This trip is officially sold out",
  message:
    "Thank you for the incredible response — every room for Club Med Cancún is booked. Join the waiting list and be the first to hear when our next vacation is announced.",
  cta: "Join the Waiting List",
  mailto: `mailto:${CONTACT}?subject=${encodeURIComponent(
    "Waiting List — Next Pickleball Vacation"
  )}&body=${encodeURIComponent(
    "Please add me to the waiting list for the next Pickleball Vacations trip.\n\nName:\nPhone:\n"
  )}`,
};

const IMG = "/vacations/clubmed/cancun";

export const cancun: TripContent = {
  trip,
  soldOut,
  copy: {
    heroHeadline: "Play the Caribbean\nwith the pros",
    heroAlt: "Aerial view of Club Med Cancún on its private peninsula",
    bandAlt: "Pickleball courts at Club Med Cancún",
    bandCopy:
      "Ten permanent courts. Mornings with the pros. Afternoons are yours.",
    stayHeadline: "Superior rooms on the lagoon",
    closingHeadline: "Four nights. Ten courts. One peninsula.",
    metaTitle: "Pickleball Vacations — Cancún With the Pros",
    metaDescription: `${trip.destination}, ${trip.location} · ${trip.datesLabel}. An all-inclusive week of clinics with PPA pro Connor Garnett, ten permanent courts, and three beaches on a private peninsula.`,
  },
  heroImage: `${IMG}/cancun-aerial.jpg`,
  bandImage: `${IMG}/cancun-courts.jpg`,
  roomImages: [
    { image: `${IMG}/rooms/room-1.jpg`, alt: "Superior room at Club Med Cancún" },
    {
      image: `${IMG}/rooms/room-2.jpg`,
      alt: "Superior room with lagoon view at Club Med Cancún",
    },
    {
      image: `${IMG}/rooms/room-3.jpg`,
      alt: "Superior room interior at Club Med Cancún",
    },
    {
      image: `${IMG}/rooms/room-4.jpg`,
      alt: "Superior room bathroom at Club Med Cancún",
    },
  ],
  excursions: [
    {
      image: `${IMG}/excursions/beachfront.jpg`,
      title: "Beachfront Escapes",
      caption:
        "A private peninsula surrounded by three pristine beaches and a natural lagoon.",
    },
    {
      image: `${IMG}/excursions/pool.jpg`,
      title: "Poolside Relaxation",
      caption: "Unwind between sessions at the resort pools.",
    },
    {
      image: `${IMG}/excursions/sailing.jpg`,
      title: "Sailing",
      caption: "Cruise the Caribbean waters.",
    },
    {
      image: `${IMG}/excursions/snorkeling.jpg`,
      title: "Snorkeling",
      caption:
        "Explore a protected underwater nature reserve a stone's throw from the beach.",
    },
    {
      image: `${IMG}/excursions/spa.jpg`,
      title: "Spa",
      caption: "Relax & recharge with world-class treatments.",
    },
    {
      image: `${IMG}/excursions/private-lessons.jpg`,
      title: "Private Lessons with the Pros",
      caption: "Extend your court time & learn from the best in the sport.",
    },
  ],
  prosAnnounced: true,
  prosMoreComing: true,
  pros: [
    {
      name: "Connor Garnett",
      role: "PPA Professional",
      image: "/vacations/pros/connor-garnett-ppa.jpg",
      leading: true,
      slug: "connor-garnett",
    },
  ],
  included: [
    "4-night stay at Club Med Cancún in a Superior room",
    "Daily structured pickleball clinics (8:00 AM–12:00 PM) with professional coaches",
    "8+ hours of dedicated instruction and on-court play with the pros",
    "Unlimited open play on 10 permanent pickleball courts",
    "Skill-based organized play and competitive matchups",
    "All-inclusive dining & beverages",
    "Full access to resort amenities, activities, and daily entertainment",
    "Round-trip ground transportation to and from Cancún International Airport (CUN)",
    "Wi-Fi and all applicable taxes",
  ],
  notIncluded: [
    "Airfare to and from Cancún International Airport (CUN)",
    "Optional off-site excursions or experiences",
    "Travel insurance (recommended)",
    "Personal pickleball equipment (paddles, shoes, etc.)",
    "Gratuities (at guest discretion)",
  ],
  highlights: [
    { stat: "4", label: "Nights all-inclusive" },
    { stat: "8+", label: "Hours with the pros" },
    { stat: "10", label: "Permanent courts" },
    { stat: "3", label: "Beaches on the peninsula" },
  ],
  about: {
    resort:
      "Club Med Cancún offers an all-inclusive escape surrounded by the turquoise waters and natural beauty of the Yucatán Peninsula. Set between the Caribbean Sea and a tranquil lagoon, the resort blends authentic Mexican charm with endless opportunities for adventure and relaxation. Spend your days snorkeling along the world's second-largest coral reef, enjoying water sports, lounging on white-sand beaches, or exploring the flavors and culture of Mexico — then unwind with ocean views, vibrant entertainment, and unforgettable sunsets.",
    play:
      "This vacation is built around pickleball. Each day features structured instructional clinics from 8:00 AM to 12:00 PM (time window subject to change), led by our professional coaches, with open courts available throughout the afternoon and evening for unlimited play. Experience 8+ hours of immersive instruction and high-level on-court play alongside our pros — on 10 permanent on-site courts, including 4 dedicated to coaching and instruction during programming hours.",
    levels:
      "Players of all skill levels are welcome, from beginners just getting started to seasoned competitors. Matchups are organized by skill level so everyone enjoys balanced, fun, and competitive games.",
  },
  accommodations: {
    body: "Superior rooms blend modern Mexican elegance with the vibrant spirit of the Yucatán. Natural tones, woven textures, and handcrafted details create a warm and inviting retreat, complete with peaceful lagoon views. Each room features a comfortable king or twin bed, an en-suite bathroom, and modern in-room amenities — the perfect space to relax and recharge throughout your Cancún getaway.",
    body2:
      "Your all-inclusive stay includes exceptional cuisine, unlimited beverages, and daily entertainment, allowing you to stay focused on playing, training, and enjoying every moment of your pickleball vacation.",
    features: [
      { value: "3", label: "On-site restaurants" },
      { value: "5", label: "Bars" },
      { value: "∞", label: "Included activities" },
    ],
    image: `${IMG}/rooms/room-2.jpg`,
  },
  transportation: {
    body: "Please plan to fly into Cancún International Airport (CUN) on January 26 and depart on January 30. We recommend arriving in the morning or early afternoon so you can join us for the welcome dinner that evening.",
    body2:
      "Flight details will be collected in advance to coordinate your arrival. Round-trip ground transportation between the CUN airport and the resort will be arranged for you, ensuring a smooth and stress-free start to your vacation. Please follow up with your trip coordinator with final flight details to ensure your round-trip ground arrangements are set.",
  },
  itinerary: [
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
        { time: "8:00–10:00 AM", text: "Session 1 — skill-based clinic" },
        { time: "10:00 AM–12:00 PM", text: "Session 2 — skill-based clinic" },
        { time: "6:00 PM", text: "Cocktail party + pro Q&A" },
      ],
    },
    {
      day: "Day 4",
      title: "Competition & Play with the Pros",
      events: [
        { time: "8:00–10:00 AM", text: "Session 1 — skill-based clinic" },
        { time: "10:00 AM–12:00 PM", text: "Session 2 — skill-based clinic" },
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
  ],
};
