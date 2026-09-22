/**
 * Committed DEMO dataset — fictional ambassadors and made-up numbers, used ONLY
 * off the production domain (see lib/ambassadors/config.ts → previewEnabled) so
 * /ambassadors is clickable for review with no Blob store, no upload, and no
 * real ambassador data. Never loaded on production. Graphics point at images
 * that already exist on this site, so stamping stays same-origin.
 */
import type { Portal } from "@/lib/ambassadors/portal";

const TIERS = [
  { upTo: 25, pct: 0.05 },
  { upTo: 50, pct: 0.1 },
  { upTo: 75, pct: 0.15 },
  { upTo: null, pct: 0.2 },
];

const program = {
  registrationTiers: TIERS,
  ticketPct: 0.15,
  tierNote:
    "Your rate is set by how many players register with your code at each tournament, and applies to every registration at that tournament.",
  rewards: { regsPerCompRegistration: 5, ticketsPerCourtsideTicket: 7 },
  payoutMinimum: 30,
  payoutSchedule: "Paid after each tournament's results are final.",
  prizes: "Top 5 on each leaderboard earn rewards (paddle, VIP tickets, free events).",
  contact: "Reply to Amie's weekly ambassador email, or reach out to your pod lead.",
};

const events = [
  { id: "national-champs-2026", name: "National Championships", fullName: "Pickleball National Championships", city: "North Carolina", start: "2026-08-31", end: "2026-09-03", regClose: "2026-08-29", status: "final", logo: "" },
  { id: "las-vegas-2026", name: "Las Vegas", fullName: "PPA Tour Rate Las Vegas Open", city: "Las Vegas, NV", start: "2026-09-28", end: "2026-10-04", regClose: "2026-09-26", status: "on-sale", logo: "" },
  { id: "chicago-2026", name: "Chicago", fullName: "PPA Tour Veolia Chicago Cup", city: "Chicago, IL", start: "2026-10-05", end: "2026-10-11", regClose: "2026-10-03", status: "on-sale", logo: "" },
  { id: "daytona-2026", name: "Daytona Beach", fullName: "PPA Tour Proton Daytona Beach Open", city: "Daytona Beach, FL", start: "2026-11-16", end: "2026-11-22", regClose: "2026-11-14", status: "on-sale", logo: "" },
];

// Same-origin demo art (real files under /public/ppa). Square-ish crops read
// fine as feed/story mocks; the stamp box is placed generically.
const DEMO_STAMP = { align: "center", bg: "#FFFFFF", color: "#0C2B44", font: "Barlow Condensed|700", h: 0.08, radius: 0.18, text: "USE CODE {CODE}", upper: true, w: 0.5, x: 0.25, y: 0.8 };
const graphics = [
  { id: "lv-feed", event: "las-vegas-2026", kind: "Feed 1080×1080", title: "Las Vegas feed post", file: "/ppa/nationals-crowd-stadium.jpg", type: "image/jpeg", stamp: DEMO_STAMP, slug: "LasVegas-feed", w: 1600, h: 1067 },
  { id: "lv-story", event: "las-vegas-2026", kind: "Story 1080×1920", title: "Las Vegas story", file: "/ppa/nationals-championship-court.jpg", type: "image/jpeg", stamp: DEMO_STAMP, slug: "LasVegas-story", w: 1600, h: 1067 },
  { id: "chi-feed", event: "chicago-2026", kind: "Feed 1080×1080", title: "Chicago feed post", file: "/ppa/nationals-action-2.jpg", type: "image/jpeg", stamp: DEMO_STAMP, slug: "Chicago-feed", w: 1600, h: 1067 },
];

const upcoming = (code: string) => [
  { event: "las-vegas-2026", code },
  { event: "chicago-2026", code },
  { event: "daytona-2026", code },
];

const pod = (name: string, lead: string | null = null) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name, lead, leadEmail: null });

/* Season leaderboards — demo ambassadors interleaved with fictional names. */
const seasonRegs = [
  { rank: 1, name: "Alex R.", points: 88, id: "DEMOALEX" },
  { rank: 2, name: "Priya N.", points: 61, id: "DEMOPRIYA" },
  { rank: 3, name: "Sam P.", points: 34, id: "DEMOSAM" },
  { rank: 4, name: "Marcus B.", points: 28, id: "DEMOMARCUS" },
  { rank: 5, name: "Dana K.", points: 21, id: "DEMODANA" },
  { rank: 6, name: "Wei L.", points: 12, id: "DEMOWEI" },
  { rank: 7, name: "Rosa M.", points: 7, id: "DEMOROSA" },
];
const seasonTix = [
  { rank: 1, name: "Alex R.", points: 260, id: "DEMOALEX" },
  { rank: 2, name: "Sam P.", points: 143, id: "DEMOSAM" },
  { rank: 3, name: "Priya N.", points: 96, id: "DEMOPRIYA" },
  { rank: 4, name: "Dana K.", points: 44, id: "DEMODANA" },
  { rank: 5, name: "Marcus B.", points: 33, id: "DEMOMARCUS" },
  { rank: 6, name: "Rosa M.", points: 15, id: "DEMOROSA" },
];

function tourney(event: string, eventName: string, eventStatus: string, code: string, regs: number, ratePct: number, tickets: number, nextTier: unknown, rank: number, ticketRank: number) {
  const registrationRevenue = regs * 190;
  const ticketRevenue = tickets * 62;
  const registrationCommission = +(registrationRevenue * ratePct).toFixed(2);
  const ticketCommission = +(ticketRevenue * 0.15).toFixed(2);
  return {
    event, eventName, eventStatus, code, registrations: regs, registrationRevenue,
    tickets, ticketRevenue, ratePct, registrationCommission, ticketCommission,
    commission: +(registrationCommission + ticketCommission).toFixed(2),
    payoutStatus: eventStatus === "final" ? "Processing" : "Pending",
    nextTier, rank: { rank, points: regs, of: 7 }, ticketRank: { rank: ticketRank, points: tickets, of: 6 },
  };
}

export function demoPortal(): Portal {
  const ambassadors = {
    "alex@demo.ppatour.com": {
      id: "DEMOALEX", firstName: "Alex", lastName: "Rivera", email: "alex@demo.ppatour.com", codes: ["DEMOALEX"], tier: "Anchor",
      pod: pod("West Coast", "Jamie Fox"), pod2: undefined,
      season: { tournaments: 3, registrations: 88, tickets: 260, revenue: 32540, commission: 4126.5 },
      lifetime: { tournaments: 9, registrations: 402, revenue: 168230, commission: 18944.2 },
      rewards: { compRegistrations: 17, courtsideTickets: 37, toNextComp: 2, toNextCourtside: 3, redeemed: [] },
      seasonRank: { registrations: { rank: 1, points: 88, of: 7 }, tickets: { rank: 1, points: 260, of: 6 } },
      tournaments: [
        tourney("national-champs-2026", "National Championships", "final", "DEMOALEX", 40, 0.1, 130, null, 1, 1),
        tourney("las-vegas-2026", "Las Vegas", "on-sale", "DEMOALEX", 30, 0.1, 90, { need: 20, fromPct: 0.1, toPct: 0.15, estGain: 285 }, 1, 1),
        tourney("chicago-2026", "Chicago", "on-sale", "DEMOALEX", 18, 0.05, 40, { need: 7, fromPct: 0.05, toPct: 0.1, estGain: 171 }, 1, 2),
      ],
      upcoming: upcoming("DEMOALEX"),
    },
    "sam@demo.ppatour.com": {
      id: "DEMOSAM", firstName: "Sam", lastName: "Park", email: "sam@demo.ppatour.com", codes: ["DEMOSAM"], tier: "Core",
      pod: pod("Midwest"),
      season: { tournaments: 2, registrations: 34, tickets: 143, revenue: 15286, commission: 1523.4 },
      lifetime: { tournaments: 4, registrations: 96, revenue: 41120, commission: 3982.1 },
      rewards: { compRegistrations: 6, courtsideTickets: 20, toNextComp: 1, toNextCourtside: 6, redeemed: [] },
      seasonRank: { registrations: { rank: 3, points: 34, of: 7 }, tickets: { rank: 2, points: 143, of: 6 } },
      tournaments: [
        tourney("las-vegas-2026", "Las Vegas", "on-sale", "DEMOSAM", 22, 0.05, 95, { need: 3, fromPct: 0.05, toPct: 0.1, estGain: 209 }, 2, 2),
        tourney("chicago-2026", "Chicago", "on-sale", "DEMOSAM", 12, 0.05, 48, { need: 13, fromPct: 0.05, toPct: 0.1, estGain: 114 }, 2, 1),
      ],
      upcoming: upcoming("DEMOSAM"),
    },
    "jordan@demo.ppatour.com": {
      id: "DEMOJORDAN", firstName: "Jordan", lastName: "Lee", email: "jordan@demo.ppatour.com", codes: ["DEMOJORDAN"], tier: "Community",
      pod: pod("Northeast"),
      season: { tournaments: 0, registrations: 0, tickets: 0, revenue: 0, commission: 0 },
      lifetime: { tournaments: 1, registrations: 9, revenue: 3420, commission: 291.4 },
      rewards: { compRegistrations: 0, courtsideTickets: 0, toNextComp: 5, toNextCourtside: 7, redeemed: [] },
      seasonRank: { registrations: null, tickets: null },
      tournaments: [],
      upcoming: upcoming("DEMOJORDAN"),
    },
  };

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    season: "Fall 2026",
    // @ts-expect-error demo marker read by portal.buildMe
    __demo: true,
    shared: {
      events,
      leaderboards: {
        season: { registrations: seasonRegs, tickets: seasonTix },
        events: {
          "las-vegas-2026": {
            registrations: [
              { rank: 1, name: "Alex R.", points: 30, id: "DEMOALEX" },
              { rank: 2, name: "Sam P.", points: 22, id: "DEMOSAM" },
              { rank: 3, name: "Dana K.", points: 9, id: "DEMODANA" },
            ],
            tickets: [
              { rank: 1, name: "Sam P.", points: 95, id: "DEMOSAM" },
              { rank: 2, name: "Alex R.", points: 90, id: "DEMOALEX" },
              { rank: 3, name: "Priya N.", points: 20, id: "DEMOPRIYA" },
            ],
          },
          "chicago-2026": {
            registrations: [
              { rank: 1, name: "Alex R.", points: 18, id: "DEMOALEX" },
              { rank: 2, name: "Sam P.", points: 12, id: "DEMOSAM" },
            ],
            tickets: [
              { rank: 1, name: "Sam P.", points: 48, id: "DEMOSAM" },
              { rank: 2, name: "Alex R.", points: 40, id: "DEMOALEX" },
            ],
          },
        },
      },
      graphics,
      program,
    },
    ambassadors: ambassadors as unknown as Portal["ambassadors"],
  };
}

/** Emails offered by the off-production "preview as" sign-in. */
export function demoEmails(): { email: string; label: string }[] {
  return [
    { email: "alex@demo.ppatour.com", label: "Alex Rivera — top seller" },
    { email: "sam@demo.ppatour.com", label: "Sam Park — mid-range" },
    { email: "jordan@demo.ppatour.com", label: "Jordan Lee — no sales yet" },
  ];
}
