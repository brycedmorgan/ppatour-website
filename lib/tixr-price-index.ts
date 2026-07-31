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

/**
 * ── TICKETS HELD BACK BY HAND ─────────────────────────────────────────────
 * Events that ARE listed and on sale on Tixr but that we are deliberately not
 * selling on the site yet. Keyed by Tixr event id, same as everything else here.
 *
 * This is an editorial switch, not a fact about the listing — which is exactly
 * why it lives in code and not in the snapshot JSON:
 * `scripts/sync-tixr-prices.mjs` rewrites `onSale` from the live Tixr feed on
 * every run (daily, via GitHub Actions), so an edit to the generated data would
 * be silently undone the next morning and the tickets would come back on their
 * own. Deleting the `ticketsUrl` mapping instead would work, but the mapping
 * audit (`npm run tixr:audit`) would then report the event as an unlinked live
 * listing, and we would lose the id when it's time to switch back on.
 *
 * TO PUT AN EVENT BACK ON SALE: delete its line. That is the whole operation —
 * price, Buy Tickets link and copy all come back together across every surface.
 */
export const TICKETS_HIDDEN: Record<string, string> = {
  "181370": "Cincinnati Open — 12–18 Apr 2027 (Wesley, 31 Jul: hide until we turn it back on)",
  "196548": "Cape Coral Open — 1–7 Feb 2027 (Wesley, 31 Jul: hide until we turn it back on)",
};

/** Are we withholding tickets for this event regardless of its Tixr listing? */
export function ticketsHidden(ticketsUrl: string | undefined): boolean {
  const id = tixrEventIdFrom(ticketsUrl);
  return id ? id in TICKETS_HIDDEN : false;
}

/** Cheapest real admission price, or null when the event isn't listed on Tixr. */
export function ticketPriceFrom(ticketsUrl: string | undefined): number | null {
  const id = tixrEventIdFrom(ticketsUrl);
  if (!id || id in TICKETS_HIDDEN) return null;
  return PRICES[id]?.from ?? null;
}

/**
 * Whether the event is listed on Tixr. When false the site shows no price and no
 * ticket link — "Tickets Coming Soon" instead.
 */
export function ticketsOnSale(ticketsUrl: string | undefined): boolean {
  const id = tixrEventIdFrom(ticketsUrl);
  if (!id || id in TICKETS_HIDDEN) return false;
  return Boolean(PRICES[id]?.onSale);
}
