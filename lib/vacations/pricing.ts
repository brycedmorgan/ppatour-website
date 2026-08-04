export type Occupancy = "single" | "double";

export const PRICING: Record<
  Occupancy,
  {
    id: Occupancy;
    label: string;
    /** Total price for this option, in USD dollars */
    total: number;
    /** Amount sent to Stripe, in cents */
    amountCents: number;
    travelers: number;
    perPersonNote?: string;
    blurb: string;
    /** When true, the option can't be selected or booked. */
    soldOut?: boolean;
  }
> = {
  single: {
    id: "single",
    label: "Single Occupancy",
    total: 3800,
    amountCents: 380000,
    travelers: 1,
    blurb: "A Superior room to yourself.",
  },
  double: {
    id: "double",
    label: "Double Occupancy",
    total: 6400,
    amountCents: 640000,
    travelers: 2,
    perPersonNote: "$3,200 per person",
    blurb: "Share a Superior room — choose King or Twin beds.",
  },
};

export const formatUSD = (dollars: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars);

export function isOccupancy(value: unknown): value is Occupancy {
  return value === "single" || value === "double";
}
