import { tripsCalendar, type TripEntry } from "./trips";

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
 * - Nothing here can be booked. Going on sale is a code change (TripConfig +
 *   Stripe), made by Bryce.
 */

export type RemotePhoto = { url: string; alt: string };

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
  },
};

const CODE_PAGES = new Set(
  tripsCalendar.filter((t) => t.status !== "coming-soon").map((t) => t.slug)
);

const okPhoto = (u: unknown): u is string =>
  typeof u === "string" &&
  (/^\/vacations\/[a-z0-9/_.-]+\.(jpe?g|png|webp)$/i.test(u) ||
    u.startsWith("https://pickleball.usejackalope.com/api/public/vac-photo?p=vacations%2F"));

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
  };
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
    status: "coming-soon",
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
