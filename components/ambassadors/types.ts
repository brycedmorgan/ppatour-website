/** Shapes the ambassador UI reads from /api/ambassadors/me. */

export type EventStatus = "on-sale" | "reg-closed" | "live" | "final";

export type Ev = {
  id: string;
  name: string;
  fullName: string;
  city: string;
  start: string;
  end: string;
  regClose: string;
  status: EventStatus;
  logo?: string;
};

export type LbRow = { rank: number; name: string; points: number; isYou?: boolean };
export type Board = { registrations: LbRow[]; tickets: LbRow[] };

export type Stamp = {
  x: number; y: number; w: number; h: number;
  text: string; font: string; color: string; bg: string;
  radius: number; align: string; upper: boolean;
};
export type Graphic = {
  id: string; event: string; kind: string; title: string;
  file: string; type: string; stamp: Stamp; slug: string; w: number; h: number;
};

export type Rank = { rank: number; points: number; of: number } | null;

export type Tournament = {
  event: string; eventName: string; eventStatus: EventStatus; code: string;
  registrations: number; registrationRevenue: number; tickets: number; ticketRevenue: number;
  ratePct: number; registrationCommission: number; ticketCommission: number; commission: number;
  payoutStatus: string;
  nextTier: { need: number; fromPct: number; toPct: number; estGain: number } | null;
  rank?: Rank; ticketRank?: Rank;
};

export type Program = {
  registrationTiers: { upTo: number | null; pct: number }[];
  ticketPct: number;
  tierNote: string;
  rewards: { regsPerCompRegistration: number; ticketsPerCourtsideTicket: number };
  payoutMinimum: number;
  payoutSchedule: string;
  prizes: string;
  contact: string;
};

export type Me = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  codes: string[];
  hideCommission?: boolean;
  pod: { id: string; name: string; lead: string | null; leadEmail: string | null };
  season: { tournaments: number; registrations: number; tickets: number; revenue: number; commission: number };
  lifetime: { tournaments: number; registrations: number; revenue: number; commission: number };
  rewards: { compRegistrations: number; courtsideTickets: number; toNextComp: number; toNextCourtside: number; redeemed: unknown[] };
  seasonRank: { registrations: { rank: number } | null; tickets: { rank: number } | null };
  tournaments: Tournament[];
  upcoming: { event: string; code: string }[];
};

export type Shared = {
  events: Ev[];
  leaderboards: { season: Board; events: Record<string, Board> };
  graphics: Graphic[];
  program: Program;
};

export type MeData = {
  generatedAt: string;
  season: string;
  preview?: boolean;
  shared: Shared;
  me: Me;
};

/* Minimal shape of the global stamp.js exposes. */
export type StampLib = {
  loadImage: (src: string) => Promise<HTMLImageElement>;
  renderStamped: (img: HTMLImageElement, st: Stamp, vars: Record<string, string>, type?: string) => Promise<Blob>;
};
declare global {
  interface Window {
    Stamp?: StampLib;
  }
}
