/**
 * Venue photography, sourced from Jackalope's Brand Photo Library.
 *
 * Bryce 7/28: "We know where those events are, and we have nice venue pictures
 * of those center courts. Why can we not set up a way to pull those images in
 * automatically?" — this is that wiring.
 *
 * Jackalope (`ziff/brand-photos.js`) holds ~346 photos keyed to a VENUE id
 * (`aag-mesa`, `brookhaven`, `cary`, …) and typed (`aerial`, `venue`, `crowd`,
 * `action`, …). The bytes live in a PRIVATE Vercel Blob store, so the public
 * site can't hotlink them. Instead `scripts/sync-venue-photos.mjs` pulls the
 * selected shots once, optimizes them into `public/ppa/venues/<venue-id>/`, and
 * writes `lib/data/venue-photos.json` — the manifest this module reads.
 *
 * Result: an event's card image and gallery come from its OWN venue. Until a
 * venue is synced it falls back to the generic action set, never to another
 * city's skyline (which is how Las Vegas ended up illustrated with Brisbane).
 *
 * Re-run the sync whenever new photography lands in Jackalope.
 */
import manifest from "@/lib/data/venue-photos.json";

export type VenuePhoto = {
  /** Public path under /public, e.g. "/ppa/venues/aag-mesa/aerial-01.jpg". */
  src: string;
  /** Jackalope photo type — aerial | venue | crowd | action | … */
  type: string;
  caption: string;
  credit: string;
};

type Manifest = Record<string, VenuePhoto[]>;

const photosByVenue = manifest as Manifest;

/**
 * Event slug → Jackalope venue id. The two systems name venues differently, so
 * this is the join. Add a row when an event moves venue or a new stop lands;
 * an unmapped event simply keeps its curated/fallback image.
 */
export const VENUE_BY_EVENT_SLUG: Record<string, string> = {
  "veolia-pickleball-national-championships": "cary",
  "veolia-arizona-open": "aag-mesa",
  "carvana-mesa-cup": "aag-mesa",
  "rate-las-vegas-open": "lv-summerlin",
  "virginia-beach-open": "pickleball-vb-va",
  "pickleball-world-championships": "brookhaven",
  "proton-daytona-beach-open": "pictona",
  "carvana-pickleball-masters": "mission-hills-ca",
  "minneapolis-indoor-open": "lt-lakeville-mn",
  "cape-coral-open": "cape-coral-fl",
  "newport-beach-open": "newport-beach-ca",
  "texas-open": "mckinney-tx",
  "greater-zion-cup-at-black-desert-resort": "black-desert-ut",
  "sacramento-open": "lt-arden",
  "cincinnati-open": "lindner",
  "atlanta-pickleball-championships": "lt-peachtree",
  "ppa-finals": "lt-sanclemente",
  // No Jackalope venue library yet: Veolia Chicago Cup (Life Time Northbrook),
  // Veolia Malibu Cup (Pepperdine). Shoot list → docs/VENUE-ASSETS.md.
};

/** Every synced photo for an event's venue, in library order. */
export function venuePhotosFor(slug: string): VenuePhoto[] {
  const venue = VENUE_BY_EVENT_SLUG[slug];
  if (!venue) return [];
  return photosByVenue[venue] ?? [];
}

/**
 * Per-event hero overrides. When we want a specific card/hero image for one
 * event (regardless of the synced venue set, and without changing another
 * event that shares the same venue), pin it here. Gallery is unaffected.
 */
const HERO_OVERRIDE_BY_EVENT_SLUG: Record<string, string> = {
  // Bryce's call: the packed championship-court crowd shot leads Nationals —
  // more powerful than the top-down aerial. Overrides the synced Cary aerial
  // for the hero, homepage card and OG share image; gallery is unaffected.
  "veolia-pickleball-national-championships": "/ppa/nationals-championship-court.jpg",
  "veolia-arizona-open": "/ppa/venues/aag-mesa/featured-mesa-cup.jpg",
  "rate-las-vegas-open": "/ppa/venues/lv-summerlin/featured-vegas-cup.jpg",
  "veolia-chicago-cup": "/ppa/venues/lt-northbrook/featured-aerial.jpg",
  // Wesley, 8/5 — five stops pinned to chosen action photography. ⚠ ALL FIVE ARE
  // PLAYER ACTION SHOTS, not venue/aerial art, which is a deliberate exception to
  // Connor's 7/20 rule (events lead with the venue). Three of them were on a
  // GENERIC_IMAGES action photo already, so the pin only replaces an
  // index-cycled shot with a chosen one; the two notes below are the exceptions.
  // Galleries are untouched throughout — this is the card/hero/OG image only.
  //
  // ⚠ virginia-beach-open is the one that DISPLACES REAL VENUE PHOTOGRAPHY: it
  // used to point at /ppa/venues/pickleball-vb-va/featured-vb.jpg, which is now
  // unreferenced (still on disk). Restoring it is one line.
  "virginia-beach-open": "/ppa/events/virginia-beach-open.jpg",
  // ⚠ AND IT NEEDS A SECOND KEY, WHICH IS A SYMPTOM, NOT A STYLE CHOICE. The
  // feed titles this stop "Mojo Energy Pouches Virginia Beach Open", and
  // `mapTournament` kebabs the feed title when no curated record matches — but
  // the curated row pins `slug: "virginia-beach-open"`, so the lookup misses and
  // the live event renders under `mojo-energy-pouches-virginia-beach-open`.
  // A single `virginia-beach-open` key would therefore have changed NOTHING on
  // the live /events page. The real fix is a CURATED_ALIASES entry in
  // lib/events-api.ts, which also reattaches the brand, guide, parking, tickets
  // and gallery this event is currently missing — but that MOVES A LIVE URL, so
  // it is flagged rather than done here. Drop this key when the alias lands.
  "mojo-energy-pouches-virginia-beach-open": "/ppa/events/virginia-beach-open.jpg",
  "atlanta-ppa-challenger": "/ppa/events/atlanta-ppa-challenger.jpg",
  "charlotte-ppa-challenger": "/ppa/events/charlotte-ppa-challenger.jpg",
  "cape-coral-open": "/ppa/events/cape-coral-open.jpg",
  // ⚠ Two editions share this slug (the completed Mar 2026 stop and the Mar 2027
  // one), so both carry this photo. Correct — same event, and the override is
  // keyed by slug, not by year.
  "greater-zion-cup-at-black-desert-resort": "/ppa/events/greater-zion-cup.jpg",
  // Wesley, 8/5. ⚠ This is an ACTION shot, not Seattle venue photography — a
  // Jack Sock singles point (Sacramento Open quarterfinals). Correct treatment
  // for a Challenger: they have no Jackalope venue library, so the alternative
  // is GENERIC_IMAGES, which is the same class of photo picked by calendar
  // index instead of on purpose. Do NOT read this as a venue/aerial and do NOT
  // reuse it as one; if Seattle's own venue art ever lands, replace it here.
  "seattle-ppa-challenger": "/ppa/events/seattle-ppa-challenger.jpg",
};

/**
 * The hero/card image for an event: an explicit override first, then its own
 * venue, aerial first (Connor's standing rule — events lead with venue/aerial
 * photography, not player shots), then a wide venue shot. Null when the venue
 * hasn't been synced.
 */
export function venueHeroFor(slug: string): string | null {
  const override = HERO_OVERRIDE_BY_EVENT_SLUG[slug];
  if (override) return override;
  const photos = venuePhotosFor(slug);
  if (!photos.length) return null;
  const pick =
    photos.find((p) => p.type === "aerial") ??
    photos.find((p) => p.type === "venue") ??
    photos.find((p) => p.type === "featured") ??
    photos[0];
  return pick?.src ?? null;
}

/**
 * Gallery set for an event page. Venue and aerial lead, crowd is capped at six
 * (Bryce's standing note on the photo library: facility shots are what matter;
 * don't let crowd shots take over), everything else follows.
 */
export function venueGalleryFor(slug: string, limit = 14): string[] {
  const photos = venuePhotosFor(slug);
  if (!photos.length) return [];
  const order = ["aerial", "venue", "featured", "vip", "box-suite", "cabana"];
  const rank = (p: VenuePhoto) => {
    const i = order.indexOf(p.type);
    return i === -1 ? order.length + 1 : i;
  };
  let crowd = 0;
  const kept = photos.filter((p) => {
    if (p.type !== "crowd") return true;
    crowd += 1;
    return crowd <= 6;
  });
  return [...kept]
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, limit)
    .map((p) => p.src);
}
