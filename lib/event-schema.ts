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
 */
import type { Tournament } from "@/lib/placeholder-data";
import { eventHref } from "@/lib/placeholder-data";
import { SITE_URL } from "@/lib/site";
import { VENUE_LOCATIONS } from "@/lib/venue-locations";

const NO_LOCALITY = new Set(["", "TBD", "TBA"]);

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

export function buildEventJsonLd(
  t: Tournament,
  opts: { onSale: boolean; description: string; performers?: EventPerformer[] },
) {
  const address = eventAddress(t);
  const performers = (opts.performers ?? []).filter((p) => p.name.trim());
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: t.name,
    sport: "Pickleball",
    startDate: t.startDate,
    endDate: t.endDate,
    /**
     * Always Scheduled: a cancelled stop never reaches a `Tournament` — the
     * events feed drops `is_canceled` / "Cancelled" rows in `isJunk` and a
     * curated stop that is pulled is removed from the schedule, not flagged.
     * If a cancelled state is ever kept on the record, map it to
     * EventCancelled here rather than deleting the page.
     */
    eventStatus: "https://schema.org/EventScheduled",
    // In-person at the venue. It was Mixed, which claims an online attendance
    // option Google then expects an online `location` for; the stream is a
    // broadcast of the event, not a way to attend it.
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      ...(t.venue ? { name: t.venue } : {}),
      ...(address ? { address } : {}),
    },
    image: [`${SITE_URL}${t.image}`],
    description: opts.description,
    url: `${SITE_URL}${eventHref(t)}`,
    organizer: {
      "@type": "Organization",
      name: "Carvana PPA Tour",
      url: SITE_URL,
    },
    // Top seeds from the PUBLISHED draw only — never the preview picks, which
    // are last year's names guessing at this year's field.
    ...(performers.length
      ? {
          performer: performers.map((p) => ({
            "@type": "Person",
            name: p.name,
            ...(p.url ? { url: `${SITE_URL}${p.url}` } : {}),
          })),
        }
      : {}),
    // Only claim an offer when tickets are actually for sale — otherwise this
    // published the tier-fallback price as an InStock buyable offer for an
    // event whose own page correctly reads "Tickets Coming Soon". No `validFrom`
    // because we don't know when the listing opened; inventing one is worse.
    ...(opts.onSale
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
}
