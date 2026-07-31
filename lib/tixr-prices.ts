/**
 * Real ticket prices, read from the Tixr snapshot in lib/data.
 *
 * Replaces hardcoded guesses. Before this, `ticketPriceFrom` was 11 hand-typed
 * numbers plus a per-tier fallback table (TIER_PRICE), and the event page
 * invented its three ticket tiers arithmetically as base x2 and x2.6. Every one
 * of those figures sat next to a Buy Tickets button, and most were wrong: the
 * site advertised Nationals from $59 and Worlds from $79 when the real grounds
 * pass is $25 at both.
 *
 * Data comes from scripts/sync-tixr-prices.mjs (daily via GitHub Actions), which
 * reads Tixr's own group API. See that file for the request headers — Tixr
 * 403s a stale User-Agent.
 *
 * ── JOINING TO OUR EVENTS ─────────────────────────────────────────────────
 * Exact, by Tixr event id. Our `ticketsUrl` already ends in it
 * ("…/events/ppa-mesa-195027" -> 195027) and the snapshot is keyed the same
 * way, so there is no name matching involved. Tixr lists one stop as several
 * events (Nationals has a main listing plus one per day); we only join the main
 * one, which is the listing our own link points at.
 *
 * ── WHICH NUMBER IS "FROM $X" ─────────────────────────────────────────────
 * The cheapest OPEN **Grounds Pass** — general admission. Deliberately not the
 * cheapest tier overall, because the cheapest tier is usually not admission:
 *   · "King of the Court (3.0-3.5)" $15 — an amateur PLAY entry, not a seat
 *   · "Thursday: Family Night" $0     — a free promo
 *   · "JOOLA 2-Day Camp" $370, "Play with a Pro" $80, "Skills Lab" $135 — clinics
 * Quoting $15 or $0 as the ticket price would be as wrong as the old $59, just
 * in the other direction. Grounds Pass is $25 across every 2026 PPA stop.
 */
import snapshot from "@/lib/data/tixr-ticket-prices.json";
import { ticketsHidden, tixrEventIdFrom } from "@/lib/tixr-price-index";

export { ticketsHidden, tixrEventIdFrom };

type RawTicket = {
  name: string;
  category?: string;
  sale_state?: string;
  base_price?: number | null;
  all_in_price?: number | null;
};

type RawEvent = {
  event_id: string | number;
  name: string;
  series?: string;
  tickets?: RawTicket[];
};

export type TicketTier = {
  name: string;
  /** Face value in USD — the number Tixr shows on the listing. */
  price: number;
  /** What the buyer actually pays including Tixr fees. */
  allIn: number | null;
  soldOut: boolean;
};

const EVENTS: RawEvent[] = (snapshot as { events?: RawEvent[] }).events ?? [];
const BY_ID = new Map(EVENTS.map((e) => [String(e.event_id), e]));

/**
 * Tiers that exist on the listing but are not admission. Keep this list honest
 * rather than clever: each entry is something a fan cannot buy to *watch*.
 */
const NOT_ADMISSION =
  /king of the court|king'?s court|camp\b|clinic|skills lab|play with (a|the) pro|on court with|glow in the dark|family night|register here|discount|vacations/i;

/** Every ticket tier for an event, admission first, cheapest first. */
export function ticketTiersFor(ticketsUrl: string | undefined): TicketTier[] {
  // Held back by hand (see TICKETS_HIDDEN). Gating here rather than in each
  // caller means the tier grid, `ticketPriceFrom`, `admissionTiersFor` and
  // `ticketsOnSale` below all go dark together — they all derive from this.
  if (ticketsHidden(ticketsUrl)) return [];

  const id = tixrEventIdFrom(ticketsUrl);
  const event = id ? BY_ID.get(id) : undefined;
  if (!event?.tickets) return [];

  return event.tickets
    .filter((t) => t.base_price != null && t.base_price > 0)
    .map((t) => ({
      name: t.name,
      price: t.base_price as number,
      allIn: t.all_in_price && t.all_in_price > 0 ? t.all_in_price : null,
      soldOut: t.sale_state !== "OPEN",
    }))
    .sort((a, b) => a.price - b.price);
}

/**
 * Cheapest real admission price, or null when we have no Tixr data for this
 * event — callers must handle null rather than print a guess.
 */
export function ticketPriceFrom(ticketsUrl: string | undefined): number | null {
  const tiers = ticketTiersFor(ticketsUrl).filter((t) => !t.soldOut);
  if (!tiers.length) return null;

  const grounds = tiers.find((t) => /grounds pass/i.test(t.name));
  if (grounds) return grounds.price;

  // No grounds pass on this listing — cheapest tier that is actually admission.
  const admission = tiers.find((t) => !NOT_ADMISSION.test(t.name));
  return admission?.price ?? null;
}

/** Admission tiers only — what the event page's ticket section should show. */
export function admissionTiersFor(ticketsUrl: string | undefined): TicketTier[] {
  return ticketTiersFor(ticketsUrl).filter((t) => !NOT_ADMISSION.test(t.name));
}

/** Snapshot freshness, so a page can say how current the prices are. */
export function tixrPricesGeneratedAt(): string | null {
  return (snapshot as { generated_at?: string }).generated_at ?? null;
}

/**
 * Is this event actually on sale on Tixr?
 *
 * False when we hold no Tixr listing for it — which is the case for stops that
 * simply haven't been listed yet (the 2027 season, 6-10 months out). Wesley,
 * 31 Jul: "If we don't have them up, we need to remove any info regarding ticket
 * prices and not have a link to tixr. We should have a 'Tickets coming soon'."
 *
 * So this gates three things together, and they must move together: the price,
 * the Buy Tickets link, and the copy. Publishing a price with no listing was
 * inventing a number; linking to the generic tixr.com/groups/ppa page instead of
 * a listing sends a fan to a directory to hunt for their own event.
 *
 * Note this is about the LISTING existing, not about a specific tier being in
 * stock — a listed event whose tiers are all sold out is still "on sale" as far
 * as the site is concerned, and its own page will say so.
 */
export function ticketsOnSale(ticketsUrl: string | undefined): boolean {
  const id = tixrEventIdFrom(ticketsUrl);
  if (!id) return false; // generic group URL, or no URL at all
  return BY_ID.has(id) && ticketPriceFrom(ticketsUrl) != null;
}
