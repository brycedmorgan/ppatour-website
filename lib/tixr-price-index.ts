/**
 * Resolved ticket price + on-sale flag, keyed by Tixr event id.
 *
 * ⚠ CLIENT-SAFE ON PURPOSE. This exists so `lib/placeholder-data.ts` can resolve
 * two numbers per event without dragging the full price snapshot into the
 * browser. placeholder-data is imported by client components (ScheduleGrid,
 * NationalsLive…), so importing `lib/tixr-prices.ts` there put all 864 ticket
 * records into a 156KB client chunk — for a price and a boolean. This index is
 * under 4KB.
 *
 * Use `lib/tixr-prices.ts` instead when you need tier detail (names, all-in
 * prices, sold-out state) — but only from server components.
 *
 * Written by scripts/sync-tixr-prices.mjs alongside the full snapshot, so the
 * two can't drift.
 */
import index from "@/lib/data/tixr-price-index.json";

type Entry = { from: number | null; onSale: boolean };

const PRICES: Record<string, Entry> =
  (index as { prices?: Record<string, Entry> }).prices ?? {};

/** Trailing Tixr event id from a tickets URL, or null for the generic group URL. */
export function tixrEventIdFrom(ticketsUrl: string | undefined): string | null {
  if (!ticketsUrl) return null;
  const m = ticketsUrl.match(/-(\d{4,})(?:[/?#]|$)/);
  return m ? m[1] : null;
}

/** Cheapest real admission price, or null when the event isn't listed on Tixr. */
export function ticketPriceFrom(ticketsUrl: string | undefined): number | null {
  const id = tixrEventIdFrom(ticketsUrl);
  return id ? (PRICES[id]?.from ?? null) : null;
}

/**
 * Whether the event is listed on Tixr. When false the site shows no price and no
 * ticket link — "Tickets Coming Soon" instead.
 */
export function ticketsOnSale(ticketsUrl: string | undefined): boolean {
  const id = tixrEventIdFrom(ticketsUrl);
  return id ? Boolean(PRICES[id]?.onSale) : false;
}
