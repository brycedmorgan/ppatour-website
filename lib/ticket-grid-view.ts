/**
 * Types and labels for the ticket grid — CLIENT-SAFE.
 *
 * Split out from lib/ticket-grid.ts on purpose. That module imports the ~200KB
 * Tixr snapshot to BUILD a grid; this one only describes the shape of one and
 * names its columns. Without the split, a client component rendering the grid
 * (NationalsLive) would pull the whole snapshot into the browser bundle for two
 * string labels — the same trap that put 864 ticket records into a client chunk
 * when lib/placeholder-data.ts imported lib/tixr-prices.ts.
 *
 * Rule: components import from here; server code that needs real prices imports
 * lib/ticket-grid.ts.
 */

export type AccessLevel = "grounds" | "courtside" | "vip" | "suite";

/** Column order, cheapest access first — matches how a fan shops. */
export const LEVEL_ORDER: AccessLevel[] = ["grounds", "courtside", "vip", "suite"];

export const LEVEL_LABEL: Record<AccessLevel, string> = {
  grounds: "Grounds Pass",
  courtside: "Courtside",
  vip: "VIP",
  suite: "Box Suite",
};

export type GridCell = {
  from: number;
  allIn: number | null;
  url: string;
  /** The Tixr tier this price came from, so the UI can be specific on hover. */
  tierName: string;
};

export type GridDay = {
  /** YYYY-MM-DD */
  date: string;
  /** "Thu" */
  weekday: string;
  /** "Sep 3" */
  dayLabel: string;
  /** "Round of 16" — the round, pulled off the session listing's own name. */
  round?: string;
  cells: Partial<Record<AccessLevel, GridCell>>;
};

export type MultiDayPass = {
  name: string;
  level: AccessLevel;
  from: number;
  allIn: number | null;
  url: string;
};

export type TicketGrid = {
  days: GridDay[];
  multiDay: MultiDayPass[];
  /** Only the levels that actually have a price somewhere — no empty columns. */
  levels: AccessLevel[];
  /** True when at least one day has its own price (i.e. a grid is worth showing). */
  hasPerDayPricing: boolean;
};
