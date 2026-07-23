import type { Place } from "@/lib/event-guides";

/**
 * Published hotel blocks managed in Jackalope (Travel → Hotels, flagged "on
 * ppatour.com"). Fetched server-side and matched to an event by city, these
 * override the static guide hotels so Kristen's edits appear here live.
 * Falls back to the static guide when the feed is empty/unreachable.
 */

const FEED = "https://jackalopehq.vercel.app/api/public/hotels";

type FeedHotel = {
  name: string;
  brand: string;
  address: string;
  rate: string;
  cutoff: string;
  link: string;
};
type FeedEvent = { name: string; start: string; loc: string; hotels: FeedHotel[] };

// Jackalope's free-text brand → the logo key under /public/ppa/hotels.
const BRAND_KEY: Record<string, Place["brand"]> = {
  ihg: "ihg",
  hilton: "hilton",
  marriott: "marriott",
  "best western": "bestwestern",
  bestwestern: "bestwestern",
  wyndham: "wyndhamhotels",
};

function brandKey(b: string): Place["brand"] | undefined {
  return BRAND_KEY[b.trim().toLowerCase()];
}

/** All published events (server fetch, revalidated). Empty on any failure. */
async function fetchPublished(): Promise<FeedEvent[]> {
  try {
    const res = await fetch(FEED, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { events?: FeedEvent[] };
    return json.events ?? [];
  } catch {
    return [];
  }
}

/**
 * Published hotels for one event, matched by city (the website's city token
 * appears in Jackalope's `loc`, e.g. "Cary" ⊂ "Cary, NC"). Returns them in the
 * guide `Place` shape, or null when nothing is published for this event.
 */
export async function publishedHotelsFor(city: string): Promise<Place[] | null> {
  if (!city) return null;
  const events = await fetchPublished();
  const c = city.trim().toLowerCase();
  const match = events.find((e) => (e.loc || "").toLowerCase().includes(c));
  if (!match || !match.hotels.length) return null;
  return match.hotels.map((h) => ({
    name: h.name,
    tag: "Official",
    note: [h.brand, h.address].filter(Boolean).join(" · "),
    href: h.link || undefined,
    brand: brandKey(h.brand),
    rate: h.rate || undefined,
    cutoff: h.cutoff || undefined,
  }));
}
