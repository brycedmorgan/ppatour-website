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
  image: string;
  lineup?: string;
  /** Manual flag; "completed" is derived from endIso at render time. */
  status: Exclude<TripStatus, "completed">;
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
    href: "/vacations/trips/cancun",
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

/** Trips guests can still book — what the header menu lists first. */
export function openTrips(now = new Date()): TripEntry[] {
  return tripsCalendar.filter((t) => tripStatus(t, now) === "open");
}

/** Every trip, soonest first, for menus that also show past trips. */
export function tripsByDate(): TripEntry[] {
  return [...tripsCalendar].sort((a, b) => a.startIso.localeCompare(b.startIso));
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
