import { PRICING, type Occupancy } from "./pricing";
import { getStripe, stripeReady } from "./stripe";
import { DEFAULT_TRIP, type TripConfig } from "./trip-config";

/** Jackalope's on-sale state for a trip. Anything else is treated as unknown. */
export type PlanStatus = "on_sale" | "sold_out";

export type OptionAvailability = {
  /** Rooms contracted with the resort for this occupancy. */
  total: number;
  /** Rooms already paid for. */
  sold: number;
  /** Rooms still bookable. Never negative. */
  left: number;
  soldOut: boolean;
};

export type Availability = {
  options: Record<Occupancy, OptionAvailability>;
  /** True when every option is gone — the whole trip is full. */
  tripSoldOut: boolean;
  /** False when Stripe isn't configured/reachable; the UI then hides counts. */
  known: boolean;
  /** Jackalope's status for this trip; null when the plan couldn't be read. */
  status: PlanStatus | null;
  /**
   * The single question every booking surface asks: may a guest book right now?
   * True unless Lainey flipped the trip to "Sold out" in Jackalope, or the
   * contracted rooms are actually gone. Fails OPEN when Stripe/Jackalope are
   * unreachable — the checkout route re-checks live and is the real gate.
   */
  bookingOpen: boolean;
};

/**
 * Stripe is the source of truth for rooms sold — not a counter we increment,
 * which drifts the first time a payment fails, is refunded, or is taken over
 * the phone. Every booking stamps `destination` + `occupancy` into payment
 * intent metadata at checkout, so a metadata search IS the room count.
 *
 * Caveat worth knowing: Stripe's Search API is eventually consistent (~1 min
 * behind writes). On a resort block selling a few rooms a week that's
 * immaterial, but two people paying for the last room inside the same minute
 * could both succeed. The resort block has some give and Lainey would rather
 * place one extra guest than turn away a paying one, so we accept that over
 * holding inventory with a lock.
 */
const CACHE_MS = 30_000;
// Keyed by destination: two trips can be on sale at once (Turks + a re-opened
// Punta Cana room), and one cache slot would serve one trip's counts for the
// other.
const cache = new Map<string, { at: number; value: Availability }>();

const emptyCounts = (): Record<Occupancy, number> => ({ single: 0, double: 0 });

/**
 * The room block + status Lainey maintains in Jackalope. She contracts rooms
 * with the resort and flips a trip on sale / sold out there; keeping either in
 * this repo would mean a code deploy every time the block changes, and a silent
 * oversell the first time the two disagree. The trip's own fallbackCapacity
 * stands in so a Jackalope outage can't take the pricing cards down.
 */
const PLAN_URL =
  process.env.JACKALOPE_PLAN_URL ??
  "https://pickleball.usejackalope.com/api/public/vac-plan";

async function contractedPlan(
  cfg: TripConfig
): Promise<{ rooms: Record<Occupancy, number>; status: PlanStatus | null }> {
  try {
    const res = await fetch(
      `${PLAN_URL}?destination=${encodeURIComponent(cfg.destination)}`,
      // Deliberately NOT no-store: that would opt every page rendering a
      // pricing card out of ISR and make the whole marketing site render per
      // request. A 30s-cached room block is plenty — /api/checkout is the gate.
      { signal: AbortSignal.timeout(3000), next: { revalidate: 30 } }
    );
    if (!res.ok) return { rooms: cfg.fallbackCapacity, status: null };
    const json = (await res.json()) as {
      capacity?: Record<string, unknown>;
      status?: unknown;
    };
    const rooms = { ...cfg.fallbackCapacity };
    for (const id of Object.keys(cfg.fallbackCapacity) as Occupancy[]) {
      const n = Number(json.capacity?.[id]);
      if (Number.isFinite(n) && n >= 0) rooms[id] = n;
    }
    const status: PlanStatus | null =
      json.status === "sold_out"
        ? "sold_out"
        : json.status === "on_sale"
          ? "on_sale"
          : null;
    return { rooms, status };
  } catch {
    return { rooms: cfg.fallbackCapacity, status: null };
  }
}

function build(
  sold: Record<Occupancy, number>,
  known: boolean,
  contracted: Record<Occupancy, number>,
  status: PlanStatus | null
): Availability {
  // A "Sold out" status in Jackalope closes the trip regardless of the room
  // math — it's Lainey's manual override for "stop taking bookings".
  const closedByStatus = status === "sold_out";
  const options = {} as Record<Occupancy, OptionAvailability>;
  for (const id of Object.keys(PRICING) as Occupancy[]) {
    const total = contracted[id] ?? 0;
    const n = sold[id] ?? 0;
    const left = Math.max(0, total - n);
    options[id] = {
      total,
      sold: n,
      left,
      soldOut: closedByStatus || (known && left === 0),
    };
  }
  const allGone = Object.values(options).every((o) => o.soldOut);
  return {
    options,
    tripSoldOut: closedByStatus || (known && allGone),
    known,
    status,
    // Open unless explicitly closed, or we know for a fact every room is gone.
    // When Stripe is unreachable (`known` false) we can't prove rooms are gone,
    // so we stay open and let the checkout route make the live call.
    bookingOpen: !closedByStatus && !(known && allGone),
  };
}

/** Map Stripe's stored occupancy label ("Single Occupancy") back to its id. */
function occupancyFromLabel(label: string | undefined): Occupancy | null {
  if (!label) return null;
  for (const [id, opt] of Object.entries(PRICING)) {
    if (opt.label === label) return id as Occupancy;
  }
  return null;
}

async function countSoldRooms(
  destination: string
): Promise<Record<Occupancy, number>> {
  const stripe = getStripe();
  const sold = emptyCounts();
  const query = `status:"succeeded" AND metadata["destination"]:"${destination.replace(
    /"/g,
    ""
  )}"`;

  let page: string | undefined;
  // Bounded: a resort block is tens of rooms, so this is one page in practice.
  for (let i = 0; i < 10; i++) {
    const res = await stripe.paymentIntents.search({ query, limit: 100, page });
    for (const pi of res.data) {
      const id = occupancyFromLabel(pi.metadata?.occupancy);
      // A refunded booking frees the room back up.
      const refunded = pi.metadata?.refunded === "true";
      if (id && !refunded) sold[id] += 1;
    }
    if (!res.has_more || !res.next_page) break;
    page = res.next_page;
  }
  return sold;
}

/**
 * Rooms left per occupancy for one trip, plus its on-sale status. Never throws:
 * if Stripe is unreachable we return `known: false` and callers fall back to
 * open booking. Failing closed here would take a trip off sale over a transient
 * Stripe blip, which is a far worse outcome than briefly overselling one room.
 */
export async function getAvailabilityFor(
  cfg: TripConfig
): Promise<Availability> {
  const hit = cache.get(cfg.destination);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

  const { rooms, status } = await contractedPlan(cfg);
  if (!stripeReady()) return build(emptyCounts(), false, rooms, status);

  let value: Availability;
  try {
    value = build(await countSoldRooms(cfg.destination), true, rooms, status);
  } catch (err) {
    console.error("[capacity] Stripe availability lookup failed", err);
    return build(emptyCounts(), false, rooms, status);
  }
  cache.set(cfg.destination, { at: Date.now(), value });
  return value;
}

/** Availability for the active trip — the shape existing callers already use. */
export async function getAvailability(): Promise<Availability> {
  return getAvailabilityFor(DEFAULT_TRIP);
}

/** Drop cache so the next read reflects a booking that just completed. Pass a
 *  trip to clear only its slot; no argument clears all. */
export function invalidateAvailability(cfg?: TripConfig) {
  if (cfg) cache.delete(cfg.destination);
  else cache.clear();
}
