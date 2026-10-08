/**
 * Black Desert Resort — March 26–31, 2027, St. George, Utah. Led by Dave
 * Fleming, built around the Greater Zion Cup: VIP box suite for semifinal
 * Saturday + championship Sunday, then two days on court with the pros.
 *
 * Copy is Lainey's listing doc ("BLACK DESERT WEBSITE LISTING", Drive folder
 * "BLACK DESERT: MARCH", 2026-10-08), lightly edited for the site. First trip
 * that isn't Club Med: NOT all-inclusive (2 dinners + 2 lunches), domestic, and
 * one room type (King, 1–2 guests) — see BLACK_DESERT in trip-config.ts.
 *
 * Images are Lainey's Drive set resized to 1600px under /vacations/black-desert/;
 * the court band is the Greater Zion Cup event photo already on the site.
 */
import type { TripContent } from "../trip-content";

const CONTACT = "vacations@pickleball.com";

const trip: TripContent["trip"] = {
  brand: "Pickleball Vacations",
  poweredBy: "Powered by the PPA, MLP & Pickleball Central",
  destination: "Black Desert Resort",
  location: "St. George, Utah",
  datesLabel: "March 26–31, 2027",
  startIso: "2027-03-26",
  nights: 5,
  nightsNote: "VIP pro weekend + 2 days of clinics",
  airportCode: "SGU",
  airportName: "St. George Regional Airport",
  who: "All skill levels welcome",
  contactEmail: CONTACT,
  clubMedUrl: "https://www.blackdesertresort.com/",
  tagline:
    "Watch the pros win a title from a VIP box suite — then step on court and train with them.",
  intro:
    "Combining luxury travel with world-class pickleball, Pickleball Vacations delivers unforgettable escapes to premium destinations alongside PPA & MLP professionals, top coaches, and fellow pickleball enthusiasts. Every trip is built to create the perfect balance of competition, connection, and relaxation.",
  inauguralNote:
    "This March, Pickleball Vacations heads to Black Desert Resort in St. George, Utah — red rock, black lava, and views for days. Spend semifinal Saturday and championship Sunday of the Greater Zion Cup in a VIP box suite a few feet from the action, then train with the Voice of Pickleball, Dave Fleming, on Monday and Tuesday. More pros to be announced soon.",
  lineup: "Led by Dave Fleming · more pros announced soon",
};

const soldOut: TripContent["soldOut"] = {
  active: false,
  badge: "Sold Out",
  nextTrip: "Next trip dates coming soon",
  headline: "This trip is officially sold out",
  message:
    "Thank you for the incredible response — every room at Black Desert Resort is booked. Join the waiting list and be the first to hear when our next vacation is announced.",
  cta: "Join the Waiting List",
  mailto: `mailto:${CONTACT}?subject=${encodeURIComponent(
    "Waiting List — Next Pickleball Vacation"
  )}&body=${encodeURIComponent(
    "Please add me to the waiting list for the next Pickleball Vacations trip.\n\nName:\nPhone:\n"
  )}`,
};

const IMG = "/vacations/black-desert";

export const blackDesert: TripContent = {
  trip,
  soldOut,
  copy: {
    heroHeadline: "Watch the pros.\nThen play with them.",
    heroAlt:
      "Black Desert Resort golf course set in black lava fields beneath red-rock cliffs",
    bandAlt: "Pro match at the Greater Zion Cup at Black Desert Resort",
    bandCopy:
      "A VIP box suite for the semis and the final. Then two days on court with the pros.",
    stayHeadline: "King rooms in red-rock country",
    closingHeadline: "Five nights. Two days of VIP. Two days on court.",
    metaTitle: "Pickleball Vacations — Greater Zion Cup at Black Desert",
    metaDescription: `${trip.destination}, ${trip.location} · ${trip.datesLabel}. VIP box suites for Greater Zion Cup semifinal Saturday and championship Sunday, then two days of clinics with Dave Fleming.`,
  },
  heroImage: `${IMG}/excursions/golf.jpg`,
  bandImage: "/ppa/events/greater-zion-cup.jpg",
  roomImages: [
    { image: `${IMG}/rooms/room-1.jpg`, alt: "King room at Black Desert Resort" },
    { image: `${IMG}/rooms/room-2.jpg`, alt: "King room interior at Black Desert Resort" },
    { image: `${IMG}/rooms/room-3.jpg`, alt: "Guest room at Black Desert Resort" },
    {
      image: `${IMG}/excursions/red-rock.jpg`,
      alt: "Black Desert Resort balconies facing the red-rock cliffs",
    },
  ],
  excursions: [
    {
      image: `${IMG}/excursions/golf.jpg`,
      title: "Golf",
      caption:
        "Black Desert's championship course, routed through lava fields and red rock.",
    },
    {
      image: `${IMG}/excursions/pool.jpg`,
      title: "Pool & Resort Relaxation",
      caption: "Recharge between pickleball sessions.",
    },
    {
      image: `${IMG}/excursions/red-rock.jpg`,
      title: "Southern Utah Adventures",
      caption: "Minutes from some of Southern Utah's most iconic landscapes.",
    },
    {
      image: "/ppa/events/greater-zion-cup.jpg",
      title: "Private Lessons with the Pros",
      caption: "One-on-one or small-group time on court, available during the trip.",
    },
  ],
  prosAnnounced: true,
  prosMoreComing: true,
  pros: [
    {
      name: "Dave Fleming",
      role: "The Voice of Pickleball",
      image: "/vacations/pros/dave-fleming.jpg",
      leading: true,
    },
  ],
  included: [
    "5-night stay at Black Desert Resort in St. George, Utah",
    "Round-trip ground transportation to and from St. George Regional Airport (SGU)",
    "Friday Welcome Dinner",
    "VIP Box Suite Experience for Semifinal Saturday & Championship Sunday, with premium food & beverage",
    "Cocktail Hour + Pro Q&A with featured professional players",
    "Monday & Tuesday on-court training: 8 hours of instruction (8 AM–12 PM) + 6 hours of organized open play (2–5 PM)",
    "Skill-based instruction, organized play, and competitive matchups",
    "Tuesday Farewell Dinner",
    "Access to Black Desert Resort amenities during your stay",
    "Wi-Fi",
  ],
  notIncluded: [
    "Airfare to and from St. George Regional Airport (SGU)",
    "Meals and beverages outside the included group events (2 dinners & 2 lunches are included)",
    "Optional resort activities, spa treatments, golf, excursions, or other add-ons",
    "Travel insurance (recommended)",
    "Personal pickleball equipment (paddles, shoes, etc.)",
    "Gratuities, where applicable",
  ],
  highlights: [
    { stat: "5", label: "Nights at Black Desert" },
    { stat: "2", label: "Days in a VIP box suite" },
    { stat: "14", label: "Hours on court" },
    { stat: "7", label: "On-site restaurants" },
  ],
  about: {
    resort:
      "Black Desert Resort sits among the striking red-rock and black-lava landscapes of Southern Utah — a color palette straight from a painter's masterpiece. The trip runs Friday, March 26 through Wednesday, March 31 and gives you both sides of pro pickleball: first as a VIP fan at the Greater Zion Cup, then on court training alongside the pros. Watch the stars of the Carvana PPA Tour battle for a title from the best seats in the house on semifinal Saturday and championship Sunday.",
    play:
      "Monday and Tuesday belong to you. Learn from the Voice of Pickleball, Dave Fleming — an unmatched mix of teaching, coaching, playing, and laughing — with skill-based clinics, small-group rotations with the pros, drills on strategy, technique, and match play, and pro-led games and challenges. That's 8 hours of dedicated instruction (8 AM–12 PM) and 6 hours of organized open play (2–5 PM), capped by Dave's Chalk Talk Master Class on Tuesday.",
    levels:
      "Players of all skill levels are welcome. On-court programming is organized by skill level whenever possible, so instruction is balanced, play is competitive, and everyone has a great time.",
  },
  accommodations: {
    body: "Your home for the week is Black Desert Resort, a luxury resort surrounded by the red-rock and black-lava landscapes of Southern Utah. Every booking is a King room for up to two guests, for five nights from Friday, March 26 through Wednesday, March 31.",
    body2:
      "Please note: Black Desert Resort is not an all-inclusive property. Meals, beverages, resort activities, and incidentals are not included unless they're part of the Pickleball Vacations package — the welcome and farewell dinners, two lunches, and the VIP box suite food & beverage are.",
    features: [
      { value: "7", label: "On-site restaurants" },
      { value: "15", label: "King rooms in our block" },
      { value: "2", label: "Days VIP at the Greater Zion Cup" },
    ],
    image: `${IMG}/rooms/room-2.jpg`,
  },
  transportation: {
    body: "Please plan to fly into St. George Regional Airport (SGU) on Friday, March 26 and depart on Wednesday, March 31. Arrive with enough time to check in (from 4 PM), get settled, and join the group for the Welcome Dinner on Friday evening.",
    body2:
      "Flight details will be collected in advance. Round-trip ground transportation between SGU and Black Desert Resort is included — send your trip coordinator your final flight information so it can be arranged. Guests using airports other than SGU arrange their own transportation unless otherwise communicated.",
  },
  itinerary: [
    {
      day: "Day 1",
      title: "Arrival",
      events: [
        { text: "Arrive at SGU → transportation to Black Desert Resort" },
        { time: "4:00 PM", text: "Resort check-in" },
        { text: "Welcome dinner" },
      ],
    },
    {
      day: "Day 2",
      title: "Semifinal Saturday",
      events: [
        { text: "PPA Tour VIP Box Suite Experience" },
        { text: "Cocktail hour + pro Q&A" },
      ],
    },
    {
      day: "Day 3",
      title: "Championship Sunday",
      events: [
        { text: "PPA Tour VIP Box Suite Experience" },
        { text: "Open play" },
      ],
    },
    {
      day: "Day 4",
      title: "On Court with the Pros",
      events: [
        { time: "8:00 AM–12:00 PM", text: "On-court training & programming" },
        { time: "2:00–5:00 PM", text: "Organized open play" },
      ],
    },
    {
      day: "Day 5",
      title: "Training & Farewell",
      events: [
        { time: "8:00 AM–12:00 PM", text: "On-court training & programming" },
        { time: "2:00–5:00 PM", text: "Organized open play" },
        { text: "Dave's Chalk Talk Master Class" },
        { text: "Farewell dinner" },
      ],
    },
    {
      day: "Day 6",
      title: "Departure",
      events: [{ text: "Check-out → transportation to SGU → departures" }],
    },
  ],
};
