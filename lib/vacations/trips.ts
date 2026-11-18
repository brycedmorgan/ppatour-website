/**
 * Trip registry — powers the trip calendar on /vacations. Status is date-aware:
 * a sold-out trip flips to "completed" automatically after its end date, so
 * past trips stay browsable for guests without manual edits.
 *
 * ⚠ Punta Cana must stay reachable. Its guests hold Stripe confirmation links
 * from the standalone site, and its archive page is where they still look up
 * the resort, pros and travel details.
 */

export type TripStatus = "open" | "sold-out" | "completed" | "coming-soon";

export type TripEntry = {
  slug: string;
  name: string;
  resort: string;
  location: string;
  datesLabel: string;
  /** ISO start/end — drives automatic past/upcoming grouping. */
  startIso: string;
  endIso: string;
  /**
   * Card photo. Optional for a coming-soon trip with no resort photos yet —
   * the calendar draws the Vacations mark on navy instead, rather than another
   * resort's beach under this resort's name.
   */
  image?: string;
  lineup?: string;
  /** Manual flag; "completed" is derived from endIso at render time. */
  status: Exclude<TripStatus, "completed">;
  /**
   * Off the website: real trip, shown nowhere and bookable nowhere. Lainey
   * (11/18/2026) on Cancún Jan 26-30: "remove it from the website, we are
   * going to reschedule this trip for a later date", zero sign ups.
   *
   * The row STAYS in this array rather than being deleted, for two reasons:
   * CODE_PAGES in remote-trips.ts is derived from it, so an off-site slug keeps
   * 404ing instead of falling through to a Jackalope copy of the same trip; and
   * bringing it back is this flag plus the new dates. Its TripConfig is also
   * out of TRIPS and its route folder is gone, so nothing can price or book it.
   */
  offSite?: boolean;
  /** Where the card links: archive page, or the live booking page. */
  href: string;
};

export const tripsCalendar: TripEntry[] = [
  {
    slug: "punta-cana",
    name: "Punta Cana",
    resort: "Club Med Punta Cana",
    location: "Punta Cana, Dominican Republic",
    datesLabel: "September 8–12, 2026",
    startIso: "2026-09-08",
    endIso: "2026-09-12",
    image: "/vacations/clubmed/PCAC_J114_001.jpg",
    lineup: "Led by Hayden Patriquin — with Chris, Gio & Dillon",
    status: "sold-out",
    href: "/vacations/trips/punta-cana",
  },
  {
    slug: "turkoise",
    name: "Turks & Caicos",
    resort: "Club Med Turkoise",
    location: "Providenciales, Turks & Caicos",
    datesLabel: "December 8–12, 2026",
    startIso: "2026-12-08",
    endIso: "2026-12-12",
    image: "/vacations/clubmed/turkoise-aerial.jpg",
    lineup: "Hayden Patriquin, Aanik Lohani, Chris Crouch & Giovanna Morelli",
    status: "open",
    href: "/vacations",
  },
  {
    // OFF THE WEBSITE 11/18/2026 (Lainey): being rescheduled for a later date,
    // zero sign ups at the time it came down. To put it back: drop `offSite`,
    // set the new datesLabel/startIso/endIso here and in lib/vacations/trips/
    // cancun.ts, put CANCUN back in TRIPS (lib/vacations/trip-config.ts), restore
    // app/vacations/trips/cancun/page.tsx, re-add the sitemap entry, and remove
    // the /vacations/trips/cancun redirect from next.config.ts.
    slug: "cancun",
    name: "Cancún",
    resort: "Club Med Cancun",
    location: "Cancún, Mexico",
    datesLabel: "January 26–30, 2027",
    startIso: "2027-01-26",
    endIso: "2027-01-30",
    image: "/vacations/clubmed/cancun/cancun-aerial.jpg",
    lineup: "Led by Connor Garnett · more pros announced soon",
    status: "open",
    offSite: true,
    href: "/vacations/trips/cancun",
  },
  {
    slug: "black-desert",
    name: "Black Desert",
    resort: "Black Desert Resort",
    location: "St. George, Utah",
    datesLabel: "March 26–31, 2027",
    startIso: "2027-03-26",
    endIso: "2027-03-31",
    image: "/vacations/black-desert/excursions/golf.jpg",
    lineup: "Greater Zion Cup VIP weekend · led by Dave Fleming",
    status: "open",
    href: "/vacations/trips/black-desert",
  },
  {
    // Placeholder (Lainey, 10/30): contract unsigned, so no price, room block,
    // pros, TripConfig or /register route. "coming-soon" keeps it out of
    // openTrips(), so nothing offers to book it.
    slug: "st-lucia",
    name: "St. Lucia",
    resort: "Stolen Time St. Lucia",
    location: "St. Lucia",
    datesLabel: "April 20–24, 2027",
    startIso: "2027-04-20",
    endIso: "2027-04-24",
    lineup: "All-inclusive · pros and pricing announced soon",
    status: "coming-soon",
    href: "/vacations/trips/st-lucia",
  },
];

export function tripStatus(t: TripEntry, now = new Date()): TripStatus {
  if (new Date(`${t.endIso}T23:59:59`) < now) return "completed";
  return t.status;
}

/**
 * Badge text for a trip. A trip that sold out and then ran says both — Bryce
 * (9/22): Punta Cana "should say completed and sold out", not just one or the
 * other. A completed trip that never sold out just says Completed.
 */
export function tripStatusLabel(t: TripEntry, now = new Date()): string {
  const status = tripStatus(t, now);
  if (status === "completed" && t.status === "sold-out") return "Completed · Sold Out";
  return STATUS_META[status].label;
}

/** The calendar as the site shows it — off-site trips dropped. */
export function onSiteTrips(): TripEntry[] {
  return tripsCalendar.filter((t) => !t.offSite);
}

/** Trips guests can still book — what the header menu lists first. */
export function openTrips(now = new Date()): TripEntry[] {
  return onSiteTrips().filter((t) => tripStatus(t, now) === "open");
}

/** Every trip, soonest first, for menus that also show past trips. */
export function tripsByDate(): TripEntry[] {
  return onSiteTrips().sort((a, b) => a.startIso.localeCompare(b.startIso));
}

export const STATUS_META: Record<
  TripStatus,
  { label: string; classes: string }
> = {
  open: { label: "Booking Open", classes: "bg-vac-teal text-ppa-navy" },
  "sold-out": { label: "Sold Out", classes: "bg-ppa-navy text-white" },
  completed: { label: "Completed", classes: "bg-ppa-navy/40 text-white" },
  "coming-soon": { label: "Coming Soon", classes: "bg-ppa-yellow text-ppa-navy" },
};
