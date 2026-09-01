/**
 * Spectator tickets for the sister-tour stops — Asia, Australia, Europe.
 *
 * Wesley, 9/1 (Asana "Incorrect info for international events"): almost every
 * international stop on /events was making a false statement about tickets.
 *
 * ⚠ WHY THIS FILE HAS TO EXIST: THE FEED CARRIES NO TICKET LINK AT ALL.
 * Confirmed against the live `ppa_tournaments` endpoint — 221 rows, 28 fields,
 * and the only two URLs on a row are `logo_url` and `details_url` (the
 * pickleballtournaments REGISTRATION listing). So `ticketsUrl` was previously
 * "the curated row's URL, else the registration page", and on-sale state came
 * from `lib/tixr-price-index.ts`, which parses a Tixr EVENT ID out of that URL
 * and looks it up in a nightly snapshot of ONE storefront —
 * `GROUP = "ppa"`, `GROUP_ID = 1164`, the US tour. The sister tours sell from
 * their own Tixr groups, which that snapshot does not cover, so every
 * international stop fell through to "Tickets soon" no matter what was true.
 * There was no wire for an Asia or Australia ticket link to arrive on.
 *
 * ⚠ THE ON-SALE CLAIM IS PER EVENT AND MUST STAY THAT WAY. The storefront URL
 * is safe to default per org — it is the tour's own box office, listing only
 * their events. "Tickets are on sale" is not: it is a claim, and the group root
 * cannot tell us which events it currently lists. Measured on their own sites
 * 9/1: the Asia tour publishes a ticket button on the Kuala Lumpur Cup page and
 * NONE on the Hong Kong Slam page (the word "ticket" appears zero times), and
 * PPA Tour Australia publishes one on the Australia Pickleball Cup page and
 * none on Adelaide's. Defaulting on-sale per org would send a Hong Kong or
 * Adelaide fan to a storefront that does not list their event — the same
 * wrong-page failure this repo keeps refusing, one level down.
 */

import type { Tournament } from "@/lib/placeholder-data";

/**
 * Each sister tour's own Tixr storefront — the default ticket destination for
 * every one of its stops, replacing both the platform registration page and the
 * `TIXR` fallback constant (which is the US group root, i.e. the wrong tour's
 * box office on a Spanish or Malaysian event).
 *
 * ⚠ GROUP ROOTS, NOT EVENT DEEP LINKS, AND THAT IS WESLEY'S CALL (9/1). A deep
 * link exists for the Kuala Lumpur Cup — the Asia tour's own page publishes
 * `…/upaasia/events/wednesday-201815` — but a per-event URL is a per-event
 * maintenance burden, and these roots are what both sister tours link to
 * themselves. Europe is deliberately absent: PPA Tour Spain sells nothing (see
 * Barcelona below), so it has no storefront to default to.
 */
const GROUP_TICKETS: Partial<Record<NonNullable<Tournament["country"]>, string>> = {
  Asia: "https://www.tixr.com/groups/upaasia",
  Australia: "https://www.tixr.com/groups/ppaaustralia",
};

type Override =
  /** Tickets are on sale. `url` only when it differs from the group root. */
  | { state: "on-sale"; url?: string; priceFrom?: number }
  /** No tickets exist and none are coming — entry is free. */
  | { state: "free" };

/**
 * What we have actually been told about a specific stop's tickets, keyed on the
 * feed's `tournament_uuid` — 100% present and distinct across the feed, and it
 * survives both a title rename and a permalink change.
 *
 * ⚠ EVERY ROW HERE IS SOMEONE'S WORD, AND THE COMMENT IS THE SOURCE. Do not add
 * a row from inference; a ticket claim on an event page is a commercial
 * statement. Remove a row when the event completes.
 */
const BY_UUID: Record<string, Override> = {
  // PPA Asia 1000 Leapmotor Kuala Lumpur Cup — Sept 9–13, The Hood, KL.
  // Wesley 9/1, "the most time sensitive one"; corroborated on the Asia tour's
  // own event page, which carries a "GET TICKETS NOW" button to the group.
  "f06b19fe-9966-4e2b-ad6b-083544b3be1a": { state: "on-sale" },

  // PPA1500 Australia Pickleball Cup — Oct 13–18, QLD Tennis Centre, Brisbane.
  // Wesley 9/1 ("available now"); ppatour.com.au's own Cup page says spectator
  // tickets are on sale at the group root. ⚠ Their page's href is broken on
  // their side (`https://https://www.tixr.com/...`) — we use the clean URL.
  "7d0583f0-2e25-4042-b369-07f8e21e8508": { state: "on-sale" },

  // PPA Tour Spain P250 Barcelona Open — Sept 23–27, Tennis Despí.
  // Wesley 9/1: "No tickets will be available/free entry", whole event.
  // ⚠ SCOPED TO THE 2026 OPENER. The calendar also carries a Barcelona P500 on
  // May 5–9, 2027 (`ppa-spain-p500-barcelona`, a different slug and a different
  // UUID); nobody has said anything about its admission, so it is untouched.
  "1655a7c9-904a-44c9-aa29-b279fca900e8": { state: "free" },
};

/**
 * The same three facts against the CURATED calendar slug, for the path where
 * the events API is unreachable and we serve the curated list.
 *
 * ⚠ THIS IS NOT BELT-AND-BRACES. Curated rows carry no `tournamentUuid` — only
 * feed-built ones do — so a UUID-only table matches nothing on the fallback
 * path and every one of these stops would silently revert to "Tickets soon".
 */
const BY_CURATED_SLUG: Record<string, Override> = {
  "ppa-asia-1000-kuala-lumpur-cup": { state: "on-sale" },
  "ppa-1500-australia-pickleball-open": { state: "on-sale" },
  "ppa-spain-p250-barcelona": { state: "free" },
};

/** The ticket fields for one sister-tour stop. */
export type SisterTourTickets = {
  /** Where a ticket link points. Always a real destination, never the US group. */
  url: string;
  onSale: boolean;
  /** Only ever a price someone gave us — never a tier-table guess. */
  priceFrom?: number;
  note?: Tournament["ticketNote"];
};

/**
 * Resolve tickets for an international stop. Returns undefined for US events
 * and for regions we hold nothing on, so the existing Tixr-snapshot path is
 * untouched for the domestic tour.
 */
export function sisterTourTickets(e: {
  country: Tournament["country"] | undefined;
  tournamentUuid?: string;
  /** Curated calendar slug — the fallback key. */
  slug: string;
  /** The feed's registration listing, used where there is nothing to sell. */
  detailsUrl?: string;
}): SisterTourTickets | undefined {
  if (!e.country) return undefined;

  const group = GROUP_TICKETS[e.country];
  const override =
    (e.tournamentUuid ? BY_UUID[e.tournamentUuid] : undefined) ?? BY_CURATED_SLUG[e.slug];

  // Nothing known and no storefront for this region: leave the record alone.
  if (!override && !group) return undefined;

  if (override?.state === "free") {
    return {
      // There is nothing to buy, so the honest destination is the tour's own
      // listing — NOT a storefront that would imply a ticket exists.
      url: e.detailsUrl || "",
      onSale: false,
      // Free means free. Without this the record keeps the blanket $35 that
      // `placeholder-data` invents for every international stop.
      priceFrom: 0,
      note: "free",
    };
  }

  if (override?.state === "on-sale") {
    return {
      url: override.url ?? group ?? e.detailsUrl ?? "",
      onSale: true,
      priceFrom: override.priceFrom,
      // A group root carries no price, so say "Tickets" rather than print a
      // tier-table figure nobody quoted.
      note: override.priceFrom == null ? "no-price" : undefined,
    };
  }

  // Known org, nothing said about this stop: point tickets at the right
  // storefront but claim nothing. The card keeps reading "Tickets soon".
  return { url: group!, onSale: false };
}
