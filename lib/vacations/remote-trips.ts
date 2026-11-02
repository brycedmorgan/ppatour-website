import { tripsCalendar, type TripEntry } from "./trips";
import { TRIPS, DEFAULT_TRIP, type TripConfig } from "./trip-config";
import type { Occupancy } from "./pricing";
import type { BedType } from "./registration";
import { athletes } from "@/lib/athletes";
import { getPublishedByName, publishedProfileSlug } from "@/lib/published-athletes";

/**
 * Coming Soon trips Lainey runs in Jackalope (Bryce 11/2: "she can add new
 * events, edit them etc. instead of slacking me. Keep guardrails").
 *
 * Jackalope's /api/public/vac-trips serves every PUBLISHED coming-soon trip:
 * content only, never a price or room count. This file merges them into the
 * trip calendar and renders them at /vacations/trips/<slug>.
 *
 * Rules:
 * - A trip with a real page in app/vacations/trips/<slug> (Cancún, Black
 *   Desert, Punta Cana) is never replaced. File routes win over [slug] anyway.
 * - Jackalope owns coming-soon trips. When the fetch works, a coming-soon entry
 *   in trips.ts that Jackalope does not list is hidden: Lainey took it down.
 * - When the fetch fails, the static entry + FALLBACK below stand in, so a
 *   Jackalope outage never 404s a page the resort is handing out.
 * - Price and approve (Bryce 11/2): a trip Bryce APPROVED in Jackalope comes
 *   with a `sale` block, the frozen approved copy. Only then can it be booked,
 *   and checkout charges exactly that price (remoteTripConfig below). A draft
 *   price Lainey is still editing never leaves Jackalope.
 */

export type RemotePhoto = { url: string; alt: string };

/** A pro on a coming-soon trip. Jackalope only sends these once Lainey marks them signed. */
export type ComingSoonPro = {
  name: string;
  /** Jackalope headshot, else the ppatour.com studio headshot, else null (initials). */
  image: string | null;
  lead: boolean;
  /** ppatour.com profile, when the pro has one. */
  slug: string | null;
};

/** The approved offer. Prices are TOTAL per room, in dollars and cents. */
export type RemoteSale = {
  eventCode: string;
  destination: string;
  nights: number;
  pooled: boolean;
  beds: "King or Twin" | "King" | "Twin";
  domestic: boolean;
  roomBlurb: string;
  single: { total: number; amountCents: number } | null;
  double: { total: number; amountCents: number } | null;
  rooms: { single: number; double: number };
  contactEmail: string;
};

export type ComingSoonTrip = {
  slug: string;
  name: string;
  /** The name Jackalope keys the funnel on (vac_events.trip). */
  destination: string;
  resort: string;
  location: string;
  datesLabel: string;
  startIso: string;
  endIso: string;
  stay: string;
  intro: string;
  lineup: string;
  hero: string | null;
  photos: RemotePhoto[];
  tba: string[];
  pros: ComingSoonPro[];
  status: "coming-soon" | "on-sale" | "sold-out";
  /** Set only when Bryce approved the sale in Jackalope. */
  sale: RemoteSale | null;
};

const URL_ =
  process.env.JACKALOPE_TRIPS_URL ??
  "https://pickleball.usejackalope.com/api/public/vac-trips";

/** Used only when Jackalope can't be reached. Mirrors the St. Lucia seed in ziff api/vacations/trips.js. */
const FALLBACK: Record<string, ComingSoonTrip> = {
  "st-lucia": {
    slug: "st-lucia",
    name: "St. Lucia",
    destination: "Stolen Time St. Lucia",
    resort: "Stolen Time St. Lucia",
    location: "St. Lucia",
    datesLabel: "April 20–24, 2027",
    startIso: "2027-04-20",
    endIso: "2027-04-24",
    stay: "All-inclusive",
    intro:
      "Pickleball Vacations is headed to St. Lucia. Details are still being finalized. Join the list below and you'll hear first when rooms open.",
    lineup: "All-inclusive · pros and pricing announced soon",
    hero: "/vacations/st-lucia/pool.jpg",
    photos: [
      { url: "/vacations/st-lucia/beach.jpg", alt: "White-sand beach and palms at Stolen Time St. Lucia" },
      { url: "/vacations/st-lucia/beachfront.jpg", alt: "Beachfront rooms under the palms at Stolen Time St. Lucia" },
      { url: "/vacations/st-lucia/pool.jpg", alt: "The pool in the water garden at Stolen Time St. Lucia" },
    ],
    tba: ["Pricing", "Room types", "Pro lineup", "Itinerary", "Booking date"],
    pros: [],
    status: "coming-soon",
    sale: null,
  },
};

const CODE_PAGES = new Set(
  tripsCalendar.filter((t) => t.status !== "coming-soon").map((t) => t.slug)
);

const okProPhoto = (u: unknown): u is string =>
  typeof u === "string" &&
  /^https:\/\/(jackalopehq\.vercel\.app|pickleball\.usejackalope\.com)\/api\/public\/player-photo\?p=players%2F[\w%.-]+$/.test(u);

const fold = (n: string) =>
  n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const CURATED_BY_NAME = new Map(athletes.map((a) => [fold(a.name), a]));

/** Match a Jackalope pro to our athlete pages for the photo fallback and the profile link. */
function toPro(raw: Record<string, unknown>): ComingSoonPro | null {
  const name = typeof raw?.name === "string" ? raw.name.slice(0, 60).trim() : "";
  if (!name) return null;
  const curated = CURATED_BY_NAME.get(fold(name));
  const published = getPublishedByName(name);
  const slug = curated?.slug ?? (published ? publishedProfileSlug(published.slug) : null);
  return {
    name,
    image: okProPhoto(raw.headshot) ? raw.headshot : curated?.headshot ?? null,
    lead: raw.lead === true,
    slug,
  };
}

const okPhoto = (u: unknown): u is string =>
  typeof u === "string" &&
  (/^\/vacations\/[a-z0-9/_.-]+\.(jpe?g|png|webp)$/i.test(u) ||
    u.startsWith("https://pickleball.usejackalope.com/api/public/vac-photo?p=vacations%2F"));

// Same bounds Jackalope enforces (lib/vacpage.js cleanOffer). Checked again
// here because this is the number a card is charged.
const PRICE_MIN = 500;
const PRICE_MAX = 50000;
function priceOf(v: unknown): { total: number; amountCents: number } | null {
  const o = v as Record<string, unknown> | null;
  const total = Number(o?.total);
  const cents = Number(o?.amountCents);
  if (!Number.isInteger(cents) || !Number.isFinite(total)) return null;
  if (total < PRICE_MIN || total > PRICE_MAX || Math.round(total * 100) !== cents) return null;
  return { total, amountCents: cents };
}

function cleanSale(raw: unknown): RemoteSale | null {
  const o = raw as Record<string, unknown> | null;
  if (!o || typeof o !== "object") return null;
  const eventCode = typeof o.eventCode === "string" ? o.eventCode : "";
  if (!/^\d{4}-VAC-[A-Z0-9]+(-[A-Z0-9]+){0,3}$/.test(eventCode)) return null;
  const destination = typeof o.destination === "string" ? o.destination.slice(0, 120).trim() : "";
  const nights = Number(o.nights);
  if (!destination || !Number.isInteger(nights) || nights < 1 || nights > 21) return null;
  const single = priceOf(o.single);
  const double = priceOf(o.double);
  // A price that's present but fails the checks means something is wrong
  // upstream. Sell nothing rather than sell half the trip.
  if ((o.single != null && !single) || (o.double != null && !double)) return null;
  if (!single && !double) return null;
  const pooled = o.pooled === true;
  if (pooled && !(single && double)) return null;
  const beds = o.beds === "King" || o.beds === "Twin" ? o.beds : "King or Twin";
  const r = (o.rooms ?? {}) as Record<string, unknown>;
  const n = (v: unknown) => (Number.isInteger(Number(v)) && Number(v) >= 0 ? Number(v) : 0);
  return {
    eventCode,
    destination,
    nights,
    pooled,
    beds,
    domestic: o.domestic === true,
    roomBlurb: typeof o.roomBlurb === "string" ? o.roomBlurb.slice(0, 80) : "",
    single,
    double,
    rooms: { single: n(r.single), double: n(r.double) },
    contactEmail: "vacations@pickleball.com",
  };
}

function clean(raw: Record<string, unknown>): ComingSoonTrip | null {
  const s = (v: unknown, n = 600) => (typeof v === "string" ? v.slice(0, n) : "");
  const slug = s(raw.slug, 40);
  if (!/^[a-z0-9-]+$/.test(slug) || CODE_PAGES.has(slug)) return null;
  const startIso = s(raw.startIso, 10);
  const endIso = s(raw.endIso, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startIso) || !/^\d{4}-\d{2}-\d{2}$/.test(endIso)) return null;
  const photos = (Array.isArray(raw.photos) ? raw.photos : [])
    .map((p) => p as Record<string, unknown>)
    .filter((p) => okPhoto(p?.url))
    .map((p) => ({ url: p.url as string, alt: s(p.alt, 140) }))
    .slice(0, 8);
  return {
    slug,
    name: s(raw.name, 40),
    destination: s(raw.destination, 120) || s(raw.resort, 80) || s(raw.name, 40),
    resort: s(raw.resort, 80),
    location: s(raw.location, 80),
    datesLabel: s(raw.datesLabel, 60),
    startIso,
    endIso,
    stay: s(raw.stay, 40) || "All-inclusive",
    intro: s(raw.intro),
    lineup: s(raw.lineup, 120),
    hero: okPhoto(raw.hero) ? raw.hero : null,
    photos,
    tba: (Array.isArray(raw.tba) ? raw.tba : []).map((x) => s(x, 40)).filter(Boolean).slice(0, 8),
    pros: (Array.isArray(raw.pros) ? raw.pros : [])
      .map((p) => toPro(p as Record<string, unknown>))
      .filter((p): p is ComingSoonPro => !!p)
      .slice(0, 8),
    ...saleOf(raw),
  };
}

function saleOf(raw: Record<string, unknown>): Pick<ComingSoonTrip, "status" | "sale"> {
  if (raw.status !== "on-sale" && raw.status !== "sold-out") return { status: "coming-soon", sale: null };
  const sale = cleanSale(raw.sale);
  // A sale block that fails the checks shows as Coming Soon, never as bookable.
  if (!sale) return { status: "coming-soon", sale: null };
  return { status: raw.status, sale };
}

/** Published trips from Jackalope, or null when Jackalope can't be reached. */
export async function fetchComingSoon(): Promise<ComingSoonTrip[] | null> {
  try {
    const r = await fetch(URL_, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { trips?: Record<string, unknown>[] };
    if (!Array.isArray(j.trips)) return null;
    return j.trips.map(clean).filter((t): t is ComingSoonTrip => !!t);
  } catch {
    return null;
  }
}

export function toEntry(t: ComingSoonTrip): TripEntry {
  return {
    slug: t.slug,
    name: t.name,
    resort: t.resort,
    location: t.location,
    datesLabel: t.datesLabel,
    startIso: t.startIso,
    endIso: t.endIso,
    image: t.hero ?? undefined,
    lineup: t.lineup || undefined,
    status: t.status === "on-sale" ? "open" : t.status,
    href: `/vacations/trips/${t.slug}`,
  };
}

/** Every trip, soonest first: code trips + Jackalope's coming-soon trips. */
export async function allTripsByDate(): Promise<TripEntry[]> {
  const remote = await fetchComingSoon();
  let list: TripEntry[];
  if (remote === null) {
    list = [...tripsCalendar];
  } else {
    const remoteSlugs = new Set(remote.map((t) => t.slug));
    list = [
      ...tripsCalendar.filter((t) => t.status !== "coming-soon" && !remoteSlugs.has(t.slug)),
      ...remote.map(toEntry),
    ];
  }
  return list.sort((a, b) => a.startIso.localeCompare(b.startIso));
}

/** One coming-soon trip for /vacations/trips/[slug], or null → 404. */
export async function getComingSoonTrip(slug: string): Promise<ComingSoonTrip | null> {
  if (CODE_PAGES.has(slug)) return null;
  const remote = await fetchComingSoon();
  if (remote === null) return FALLBACK[slug] ?? null;
  return remote.find((t) => t.slug === slug) ?? null;
}

/* ----------------------------------------------------------- booking */

const contact = "vacations@pickleball.com";

/** A Jackalope trip with an approved sale, as the booking path's TripConfig. */
export function remoteTripConfig(t: ComingSoonTrip): TripConfig | null {
  const sale = t.sale;
  if (!sale) return null;
  const room = sale.roomBlurb || "A room";
  const opt = (id: Occupancy, p: RemoteSale["single"]) => {
    const travelers = id === "single" ? 1 : 2;
    const total = p?.total ?? 0;
    return {
      id,
      label: id === "single" ? "Single Occupancy" : "Double Occupancy",
      total,
      amountCents: p?.amountCents ?? 0,
      travelers,
      ...(id === "double" && p ? { perPersonNote: `$${Math.round(total / 2).toLocaleString("en-US")} per person` } : {}),
      blurb:
        id === "single"
          ? `${room} to yourself.`
          : sale.pooled
            ? `${room} for two, same price.`
            : `Share ${room.charAt(0).toLowerCase()}${room.slice(1)}.`,
      // No price for this occupancy, or the trip is marked sold out = it can't be booked.
      ...(p && t.status !== "sold-out" ? {} : { soldOut: true }),
    };
  };
  const bedOptions: BedType[] | undefined =
    sale.beds === "King" ? ["King"] : sale.beds === "Twin" ? ["Twin"] : undefined;
  return {
    slug: t.slug,
    eventCode: sale.eventCode,
    href: `/vacations/trips/${t.slug}/`,
    destination: sale.destination,
    location: t.location,
    datesLabel: t.datesLabel,
    nights: sale.nights,
    contactEmail: contact,
    pricing: { single: opt("single", sale.single), double: opt("double", sale.double) },
    fallbackCapacity: sale.rooms,
    roomPool: sale.pooled || undefined,
    bedOptions,
    domestic: sale.domestic || undefined,
    waitlist: {
      badge: "Sold Out",
      headline: "This trip is sold out",
      message: `Every room for ${t.resort || t.name} is booked. Email us to join the waiting list.`,
      cta: "Join the Waiting List",
      mailto: `mailto:${contact}?subject=${encodeURIComponent(`Waiting List — ${t.name}`)}`,
    },
  };
}

/**
 * The trip a booking is for. Code trips (TRIPS) first, then a Jackalope trip
 * Bryce approved. Null = not bookable. No `slug` = the default trip, so old
 * /vacations/register links keep working.
 */
export async function resolveTripConfig(slug?: string | null): Promise<TripConfig | null> {
  if (!slug) return DEFAULT_TRIP;
  if (TRIPS[slug]) return TRIPS[slug];
  if (CODE_PAGES.has(slug)) return null;
  const remote = await fetchComingSoon();
  const t = remote?.find((x) => x.slug === slug);
  return t ? remoteTripConfig(t) : null;
}

/** Path → funnel destination and path → waitlist tag, for the layout's client pieces. */
export async function comingSoonMaps() {
  const remote = (await fetchComingSoon()) ?? Object.values(FALLBACK);
  const destinations: Record<string, string> = {};
  const waitlists: Record<string, string> = {};
  for (const t of remote) {
    destinations[`/vacations/trips/${t.slug}`] = t.destination;
    waitlists[`/vacations/trips/${t.slug}`] = t.slug;
  }
  return { destinations, waitlists };
}
