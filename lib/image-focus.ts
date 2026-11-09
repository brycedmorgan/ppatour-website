/**
 * Focal points for event photos: where the subject sits, as a CSS
 * `object-position` ("x% y%"). Every surface that crops an event image
 * (event hero, homepage hero, schedule/featured/home cards, the header's Next
 * Event card, /watch, the OG share image) reads it through `focusFor`.
 *
 * WHY THIS EXISTS (Wesley, 11/9): an event hero showed only a player's legs.
 * Each surface cropped at its own fixed spot (the event hero at center, the
 * homepage at 60%, then 25%), and a 3:2 action photo in a ~2.5:1 hero frame
 * loses 40% of its height. At center that cuts the top 20%, which is where a
 * player's head is. Fixing one surface's percentage just moved the problem to
 * the next photo. The crop belongs to the PHOTO, not the page.
 *
 * ⚠ `npm run images:audit` (runs in prebuild) FAILS THE BUILD when a photo that
 * can become an event hero has no entry here: a HERO_OVERRIDE_BY_EVENT_SLUG pin,
 * a curated `image:` / GENERIC_IMAGES / VENUE_IMAGES path in placeholder-data,
 * anything in public/ppa/events/, or a Challenger card photo. Synced Jackalope
 * venue photos are exempt: they're aerial/venue shots and centre crops suit them.
 *
 * Adding a photo: open it, find the subject's face (or the court, for a crowd or
 * aerial shot), and write its position as percentages of width and height.
 * For people, aim at the FACE, not the body's centre. A value of 20% height
 * keeps heads in frame in every hero we have.
 */
const FOCUS: Record<string, string> = {
  // GENERIC_IMAGES: the U.S. fallback when a stop has no venue photos.
  // These are the photos that cause the legs problem; all are player shots.
  "/ppa/action-md-final.jpg": "55% 22%",
  "/ppa/action-mxd-ppa-finals.jpg": "50% 15%",
  "/ppa/action-singles.jpg": "50% 18%",
  "/ppa/action-champ-sunday.jpg": "60% 20%",
  "/ppa/action-waters-bright.jpg": "55% 25%",

  // HERO_OVERRIDE_BY_EVENT_SLUG pins (lib/venue-photos.ts).
  "/ppa/events/virginia-beach-open.jpg": "55% 22%",
  "/ppa/events/cape-coral-open.jpg": "68% 22%",
  "/ppa/events/greater-zion-cup.jpg": "60% 30%",
  "/ppa/events/texas-open.jpg": "50% 45%",
  "/ppa/events/atlanta-pickleball-championships.jpg": "50% 55%",
  "/ppa/nationals-championship-court.jpg": "50% 50%",
  "/ppa/venues/aag-mesa/featured-mesa-cup.jpg": "50% 45%",
  "/ppa/venues/lv-summerlin/featured-vegas-cup.jpg": "50% 45%",
  "/ppa/venues/lt-northbrook/featured-aerial.jpg": "50% 50%",
  "/ppa/event-kuala-lumpur.jpg": "50% 40%",

  // Old Challenger pins, still on disk in public/ppa/events/ (unreferenced).
  "/ppa/events/atlanta-ppa-challenger.jpg": "45% 38%",
  "/ppa/events/charlotte-ppa-challenger.jpg": "60% 25%",
  "/ppa/events/seattle-ppa-challenger.jpg": "65% 45%",
  "/ppa/events/nationals-trophy.png": "50% 50%",

  // Curated `image:` on placeholder-data rows, plus VENUE_IMAGES.
  "/ppa/event-lille-p125.jpg": "50% 32%",
  "/ppa/event-barcelona-p250.jpg": "62% 25%",
  "/ppa/event-barcelona.jpg": "50% 50%",
  "/ppa/event-portoroz.jpg": "40% 50%",
  "/ppa/event-melbourne.jpg": "50% 50%",
  "/ppa/event-macao.jpg": "50% 50%",
  "/ppa/event-gold-coast.webp": "50% 50%",
  "/ppa/nationals-drone-champcourt.jpg": "50% 50%",
  "/ppa/nationals-drone-stadium.jpg": "50% 50%",
  "/ppa/nationals-drone-courts.jpg": "50% 50%",
  "/ppa/nationals-drone-grounds.jpg": "50% 50%",
  "/ppa/nationals-drone-sunset.jpg": "50% 50%",
  "/ppa/nationals-crowd-1.jpg": "50% 45%",
  "/ppa/nationals-crowd-branded.jpg": "50% 45%",
  "/ppa/nationals-crowd-fans.jpg": "50% 35%",
  "/ppa/nationals-crowd-stadium.jpg": "50% 50%",
  "/ppa/nationals-action-2.jpg": "50% 22%",
  "/ppa/venues/aag-mesa/aerial-01.jpg": "50% 50%",

  // Challenger card photos (lib/challenger-photos.ts).
  "/ppa/challenger/photos/hero.jpg": "50% 55%",
  "/ppa/challenger/photos/atlanta.jpg": "25% 45%",
  "/ppa/challenger/photos/black-desert.jpg": "65% 40%",
  "/ppa/challenger/photos/charlotte.jpg": "55% 42%",
  "/ppa/challenger/photos/fort-collins.jpg": "80% 22%",
  "/ppa/challenger/photos/houston.jpg": "40% 55%",
  "/ppa/challenger/photos/punta-gorda.jpg": "62% 40%",
  "/ppa/challenger/photos/seattle.jpg": "50% 50%",
  "/ppa/challenger/photos/wilson.jpg": "30% 50%",
  "/ppa/challenger/photos/pool-1.jpg": "45% 30%",
  "/ppa/challenger/photos/pool-2.jpg": "62% 20%",
  "/ppa/challenger/photos/pool-3.jpg": "55% 22%",
  "/ppa/challenger/photos/pool-4.jpg": "78% 20%",
  "/ppa/challenger/photos/pool-5.jpg": "50% 30%",
  "/ppa/challenger/photos/pool-6.jpg": "60% 25%",
  "/ppa/challenger/photos/pool-7.jpg": "50% 40%",
  "/ppa/challenger/photos/pool-8.jpg": "55% 45%",
  "/ppa/challenger/photos/pool-9.jpg": "35% 30%",
  "/ppa/challenger/photos/pool-10.jpg": "45% 20%",
};

/** Centre: right for the synced aerial/venue library, which is all this hits. */
export const DEFAULT_FOCUS = "50% 50%";

/** The `object-position` for an event photo. */
export function focusFor(src: string | null | undefined): string {
  return (src && FOCUS[src]) || DEFAULT_FOCUS;
}

/** Every photo with a focal point; for scripts/audit-image-focus.mjs. */
export const FOCUS_KEYS: readonly string[] = Object.keys(FOCUS);
