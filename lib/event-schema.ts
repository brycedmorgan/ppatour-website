/**
 * The one place the event `SportsEvent` JSON-LD is built.
 *
 * It used to be inlined in BOTH `app/events/[year]/[slug]/page.tsx` AND
 * `components/events/NationalsLive.tsx`, which drift silently (the repo's
 * standing rule) — and they had: the `-live` twin published an InStock Offer
 * unconditionally while the main page had already been fixed to omit `offers`
 * unless tickets are truly on sale. One builder, called by both, ends that.
 *
 * Google event-experience upgrades baked in here vs. the old inline version:
 *   - `location.address` is a real `PostalAddress` (street/locality/region/
 *     postal/country) via `VENUE_LOCATIONS`, not the bare `"Cary, NC"` string.
 *   - `image` is an array (Google wants multiple), `description` is included,
 *     `offers` is guarded on `onSale` and never invents a `validFrom`.
 *
 * 10/18 "scorched earth" pass (docs/SEO.md §7) — what a search engine can now
 * read off one event page that it could not before:
 *   - a stable `@id` per event, organizer by `@id` to the site-wide org node;
 *   - `competitor` (schema.org's sports property; Google: "highly recommended")
 *     alongside `performer` (what Google's Event rich result reads);
 *   - one `subEvent` per pro division — and, once the stop is over, the podium
 *     of each as `competitor` Persons linked to their athlete pages, plus a
 *     "Champions:" sentence in the description, from the committed tournament
 *     history (`results`, looked up by the server page via lib/event-results —
 *     passed in, not imported, because NationalsLive is a client component and
 *     the 120 KB history file must not ship to the browser). Schema.org has no
 *     "result" property; naming the winners as the division's competitors plus
 *     prose is the convention;
 *   - `BroadcastEvent` nodes for every platform carrying the stop (PBTV, Tennis
 *     Channel, FS1/FS2, CBS), from lib/broadcast.ts, hung off the event via
 *     `broadcastOfEvent`;
 *   - a second 1200×630 image (the designed OG card) — Google asks for 16:9,
 *     4:3 and 1:1 crops;
 *   - `offers` also dropped once the stop is over (the Tixr listing can stay
 *     up for weeks after), and `isAccessibleForFree` for free stops.
 */
import type { Tournament } from "@/lib/placeholder-data";
import { eventHref } from "@/lib/placeholder-data";
import { SITE_URL } from "@/lib/site";
import { VENUE_LOCATIONS } from "@/lib/venue-locations";
import { eventBroadcasts } from "@/lib/broadcast";
import type { HistoryEvent } from "@/lib/tournament-history";
import { playerProfileHref } from "@/lib/player-photos";

const NO_LOCALITY = new Set(["", "TBD", "TBA"]);

/** The five pro divisions every tour stop plays, in the site's display order. */
export const PRO_DIVISIONS = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
] as const;

/** Where each broadcaster lives, for `publishedOn`. PBTV is ours. */
const BROADCASTERS: Record<string, { name: string; url: string }> = {
  PBTV: { name: "PickleballTV", url: "https://pickleballtv.com/" },
  "PBTV App": { name: "PickleballTV", url: "https://pickleballtv.com/" },
  "Tennis Channel": { name: "Tennis Channel", url: "https://www.tennischannel.com/" },
  FS1: { name: "FS1", url: "https://www.foxsports.com/live/fs1" },
  FS2: { name: "FS2", url: "https://www.foxsports.com/live/fs2" },
  FOX: { name: "FOX", url: "https://www.fox.com/" },
  CBS: { name: "CBS", url: "https://www.cbs.com/" },
};

/** "Anna Leigh Waters / Ben Johns" → ["Anna Leigh Waters", "Ben Johns"]. */
export function podiumNames(entry: string): string[] {
  return entry
    .split(/\s*\/\s*|\s*&\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Structured PostalAddress — curated street address if we have one, otherwise
 *  the coarser-but-valid city/state/country off the event record. Never
 *  fabricates a street. Returns undefined when we don't even have a city. */
function eventAddress(t: Tournament) {
  const curated = t.venue ? VENUE_LOCATIONS[t.venue] : undefined;
  if (curated) {
    return {
      "@type": "PostalAddress",
      ...(curated.streetAddress ? { streetAddress: curated.streetAddress } : {}),
      addressLocality: curated.addressLocality,
      addressRegion: curated.addressRegion,
      ...(curated.postalCode ? { postalCode: curated.postalCode } : {}),
      addressCountry: curated.addressCountry,
    };
  }

  if (NO_LOCALITY.has(t.city)) return undefined;

  // A two-letter code is a US state; on international stops `state` carries the
  // country name (e.g. "Australia", "Spain") and there's no US region.
  const isUS = /^[A-Z]{2}$/.test(t.state);
  return {
    "@type": "PostalAddress",
    addressLocality: t.city,
    ...(isUS
      ? { addressRegion: t.state, addressCountry: "US" }
      : t.state
        ? { addressCountry: t.state }
        : {}),
  };
}

/** A pro the schema can name as a performer — top seeds from the published draw. */
export type EventPerformer = { name: string; url?: string | null };

function person(p: EventPerformer) {
  const url = p.url ?? playerProfileHref(p.name);
  return {
    "@type": "Person",
    name: p.name,
    ...(url ? { "@id": `${SITE_URL}${url}/#person`, url: `${SITE_URL}${url}` } : {}),
  };
}

export const ORGANIZER_ID = `${SITE_URL}/#organization`;

/** Absolute page URL (no trailing slash — matches the old output and `url`). */
export function eventPageUrl(t: Tournament): string {
  return `${SITE_URL}${eventHref(t)}`;
}

export function buildEventJsonLd(
  t: Tournament,
  opts: {
    onSale: boolean;
    description: string;
    performers?: EventPerformer[];
    /** The stop has finished (the page's own `completed`). Drops offers. */
    completed?: boolean;
    /** The podium, from lib/event-results — only meaningful with `completed`. */
    results?: HistoryEvent | null;
  },
) {
  const address = eventAddress(t);
  const url = eventPageUrl(t);
  const eventId = `${url}/#event`;
  const placeId = `${url}/#place`;
  const seeds = (opts.performers ?? []).filter((p) => p.name.trim());
  const completed = Boolean(opts.completed);
  const decided = completed && opts.results
    ? opts.results.divisions.filter((d) => d.champion.trim())
    : [];

  /**
   * Who the event's `competitor`s are: the podium once it is over (facts the
   * page renders in the Champions band), the top seeds before (facts from the
   * published draw). Never both, and never the preview picks.
   */
  const champions: EventPerformer[] = decided.flatMap((d) =>
    podiumNames(d.champion).map((name) => ({ name })),
  );
  const uniq = new Map<string, EventPerformer>();
  for (const p of completed ? champions : seeds) uniq.set(p.name.toLowerCase(), p);
  const competitors = [...uniq.values()].map(person);

  const location = {
    "@type": "Place",
    "@id": placeId,
    ...(t.venue ? { name: t.venue } : {}),
    ...(address ? { address } : {}),
  };

  const championsLine = decided.length
    ? ` Champions: ${decided.map((d) => `${d.division} — ${d.champion}`).join("; ")}.`
    : "";

  /**
   * One SportsEvent per pro division. Pre-event it says the five draws exist
   * (dates, venue, sport); post-event each carries its podium as competitors —
   * gold first, then silver, then bronze — so an engine can answer "who won
   * mixed doubles at Worlds" from the markup, not the prose.
   */
  const subEvent = PRO_DIVISIONS.map((division) => {
    const r = decided.find((d) => d.division === division);
    const podium = r
      ? [r.champion, r.runnerUp, r.third]
          .filter((entry) => entry.trim())
          .flatMap((entry) => podiumNames(entry).map((name) => ({ name })))
      : [];
    const plural = r && podiumNames(r.champion).length > 1 ? "s" : "";
    return {
      "@type": "SportsEvent",
      "@id": `${url}/#${division.toLowerCase().replace(/[^a-z]+/g, "-")}`,
      name: `${t.name} — ${division}`,
      sport: "Pickleball",
      startDate: t.startDate,
      endDate: t.endDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: { "@id": placeId },
      superEvent: { "@id": eventId },
      organizer: { "@id": ORGANIZER_ID },
      ...(r
        ? {
            description:
              `${division} champion${plural}: ${r.champion}` +
              `${r.runnerUp ? `. Runner-up: ${r.runnerUp}` : ""}` +
              `${r.third ? `. Third: ${r.third}` : ""}.`,
            competitor: podium.map(person),
          }
        : {}),
    };
  });

  /**
   * Every platform carrying this stop, as a BroadcastEvent. Dates are the
   * event's — lib/broadcast.ts holds weekday windows, not calendar dates, and
   * a window that is wrong by a day is worse than the honest span.
   */
  const platforms = [...new Set((eventBroadcasts[t.slug] ?? []).map((b) => b.platform))];
  const broadcasts = platforms
    .filter((p) => BROADCASTERS[p])
    .map((p) => {
      const b = BROADCASTERS[p];
      return {
        "@type": "BroadcastEvent",
        "@id": `${url}/#broadcast-${p.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: `${t.name} on ${b.name}`,
        isLiveBroadcast: true,
        startDate: t.startDate,
        endDate: t.endDate,
        broadcastOfEvent: { "@id": eventId },
        publishedOn: { "@type": "BroadcastService", name: b.name, url: b.url },
      };
    });

  const event = {
    "@type": "SportsEvent",
    "@id": eventId,
    name: t.name,
    sport: "Pickleball",
    startDate: t.startDate,
    endDate: t.endDate,
    /**
     * Always Scheduled: a cancelled stop never reaches a `Tournament` — the
     * events feed drops `is_canceled` / "Cancelled" rows in `isJunk` and a
     * curated stop that is pulled is removed from the schedule, not flagged.
     * If a cancelled state is ever kept on the record, map it to
     * EventCancelled here rather than deleting the page. (Schema.org has no
     * "completed" status; a finished event stays Scheduled with a past date.)
     */
    eventStatus: "https://schema.org/EventScheduled",
    // In-person at the venue. It was Mixed, which claims an online attendance
    // option Google then expects an online `location` for; the stream is a
    // broadcast of the event, not a way to attend it.
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location,
    image: [`${SITE_URL}${t.image}`, `${url}/opengraph-image`],
    description: `${opts.description}${championsLine}`,
    url,
    organizer: {
      "@type": "SportsOrganization",
      "@id": ORGANIZER_ID,
      name: "Carvana PPA Tour",
      url: SITE_URL,
    },
    ...(competitors.length
      ? {
          // Top seeds from the PUBLISHED draw only (or the champions, after) —
          // never the preview picks, which are last year's names guessing at
          // this year's field.
          performer: competitors,
          competitor: competitors,
        }
      : {}),
    subEvent,
    ...(t.ticketNote === "free" ? { isAccessibleForFree: true } : {}),
    // Only claim an offer when tickets are actually for sale AND the stop has
    // not been played — otherwise this published the tier-fallback price as an
    // InStock buyable offer for an event whose own page correctly reads
    // "Tickets Coming Soon", or a buyable ticket to a tournament that is over.
    // No `validFrom` because we don't know when the listing opened; inventing
    // one is worse.
    ...(opts.onSale && !completed
      ? {
          offers: {
            "@type": "Offer",
            // The Tixr listing the page's Buy Tickets button opens (minus its
            // UTM tags — structured data is not a click we attribute).
            url: t.ticketsUrl,
            price: t.ticketPriceFrom,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [event, ...broadcasts],
  };
}
