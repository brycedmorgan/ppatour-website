/**
 * Season-wide Championship Court broadcast schedule. Tennis Channel windows
 * reconciled to "Pickleball Scheduling 2026 V22 — 7.17.26" (PPA TC Broadcast
 * Hours sheet; the authoritative TC schedule). PBTV streams every round;
 * Tennis Channel simulcasts the marquee windows. All times ET.
 *
 * TC windows verified vs V22: Cary 23h (Thu–Sun), Las Vegas 4h (Sun only),
 * Chicago 12h (Fri–Sun 11–3), VA Beach 13h, Dallas/Worlds (Wed Pro-Am only),
 * Malibu 20h (Thu–Sun). PBTV windows are still templated — reconcile against
 * the V22 "Coverage Schedule & Broadcast" sheet when syncing PBTV.
 */

export type TvWindow = {
  channel: "PBTV" | "Tennis Channel";
  window: string;
  round: string;
};

export type TvDay = {
  /** e.g. "Sep 6" */
  date: string;
  dow: string;
  windows: TvWindow[];
};

export type TvEvent = {
  name: string;
  location: string;
  tier?: string;
  league: "PPA" | "MLP";
  /** ISO — used to hide past events + sort. */
  startIso: string;
  endIso: string;
  /** Site event page, when one exists. */
  slug?: string;
  days: TvDay[];
};

export const tvSchedule: TvEvent[] = [
  {
    name: "Veolia PPA National Championships",
    location: "Cary Tennis Park · Cary, NC",
    tier: "Major · 2,000",
    league: "PPA",
    startIso: "2026-09-01",
    endIso: "2026-09-06",
    slug: "veolia-pickleball-national-championships",
    days: [
      { date: "Sep 1", dow: "Tue", windows: [{ channel: "PBTV", window: "10AM – 6PM", round: "Round of 64" }] },
      { date: "Sep 2", dow: "Wed", windows: [{ channel: "PBTV", window: "10AM – 6PM", round: "Round of 32" }] },
      {
        date: "Sep 3",
        dow: "Thu",
        windows: [
          { channel: "PBTV", window: "10AM – 6PM", round: "Round of 16" },
          { channel: "Tennis Channel", window: "11:30AM – 5PM", round: "Round of 16" },
        ],
      },
      {
        date: "Sep 4",
        dow: "Fri",
        windows: [
          { channel: "PBTV", window: "10AM – 6PM", round: "Quarterfinals" },
          { channel: "Tennis Channel", window: "11:30AM – 5PM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Sep 5",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "9AM – 5PM", round: "Semifinals" },
          { channel: "Tennis Channel", window: "11AM – 5PM", round: "Semifinals" },
        ],
      },
      {
        date: "Sep 6",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "10AM – 4PM", round: "Championship Sunday" },
          { channel: "Tennis Channel", window: "11AM – 4PM", round: "Championship Sunday" },
        ],
      },
    ],
  },
  {
    name: "Veolia Arizona Open",
    location: "Arizona Athletic Grounds · Mesa, AZ",
    tier: "Open · 1,000",
    league: "PPA",
    startIso: "2026-09-17",
    endIso: "2026-09-20",
    // Was `carvana-mesa-cup` — that's the FEBRUARY 2027 Mesa Cup, so this row
    // linked to /events/2026/carvana-mesa-cup and 404'd (Conner Ogden's broken
    // link, 7/27). The September 2026 Mesa stop is the Veolia Arizona Open.
    slug: "veolia-arizona-open",
    days: [
      { date: "Sep 17", dow: "Thu", windows: [{ channel: "PBTV", window: "1PM – 9PM", round: "Round of 16" }] },
      { date: "Sep 18", dow: "Fri", windows: [{ channel: "PBTV", window: "1PM – 9PM", round: "Quarterfinals" }] },
      { date: "Sep 19", dow: "Sat", windows: [{ channel: "PBTV", window: "12PM – 8PM", round: "Semifinals" }] },
      // V22: Mesa 2 (Sept Open) is PBTV-only — no Tennis Channel window.
      { date: "Sep 20", dow: "Sun", windows: [{ channel: "PBTV", window: "1PM – 7PM", round: "Championship Sunday" }] },
    ],
  },
  {
    name: "Rate Las Vegas Open",
    location: "Darling Tennis Center · Las Vegas, NV",
    tier: "Open · 1,000",
    league: "PPA",
    startIso: "2026-10-01",
    endIso: "2026-10-04",
    slug: "rate-las-vegas-open",
    days: [
      { date: "Oct 1", dow: "Thu", windows: [{ channel: "PBTV", window: "1PM – 9PM", round: "Round of 16" }] },
      { date: "Oct 2", dow: "Fri", windows: [{ channel: "PBTV", window: "1PM – 9PM", round: "Quarterfinals" }] },
      { date: "Oct 3", dow: "Sat", windows: [{ channel: "PBTV", window: "12PM – 8PM", round: "Semifinals" }] },
      {
        date: "Oct 4",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "1PM – 7PM", round: "Championship Sunday" },
          { channel: "Tennis Channel", window: "1PM – 5PM", round: "Championship Sunday" },
        ],
      },
    ],
  },
  {
    name: "Veolia Chicago Cup",
    location: "Life Time North Shore · Chicago, IL",
    tier: "Cup · 1,500",
    league: "PPA",
    startIso: "2026-10-06",
    endIso: "2026-10-11",
    slug: "veolia-chicago-cup",
    days: [
      { date: "Oct 6", dow: "Tue", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Round of 64" }] },
      { date: "Oct 7", dow: "Wed", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Round of 32" }] },
      { date: "Oct 8", dow: "Thu", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Round of 16" }] },
      {
        date: "Oct 9",
        dow: "Fri",
        windows: [
          { channel: "PBTV", window: "11AM – 7PM", round: "Quarterfinals" },
          { channel: "Tennis Channel", window: "11AM – 3PM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Oct 10",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "10AM – 6PM", round: "Semifinals" },
          { channel: "Tennis Channel", window: "11AM – 3PM", round: "Semifinals" },
        ],
      },
      {
        date: "Oct 11",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "11AM – 5PM", round: "Championship Sunday" },
          { channel: "Tennis Channel", window: "11AM – 3PM", round: "Championship Sunday" },
        ],
      },
    ],
  },
  {
    name: "Virginia Beach Open",
    location: "Virginia Beach, VA",
    tier: "Open · 1,000",
    league: "PPA",
    startIso: "2026-10-15",
    endIso: "2026-10-18",
    slug: "virginia-beach-open",
    days: [
      { date: "Oct 15", dow: "Thu", windows: [{ channel: "PBTV", window: "10AM – 6PM", round: "Round of 16" }] },
      {
        date: "Oct 16",
        dow: "Fri",
        windows: [
          { channel: "PBTV", window: "10AM – 6PM", round: "Quarterfinals" },
          { channel: "Tennis Channel", window: "12PM – 4PM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Oct 17",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "9AM – 5PM", round: "Semifinals" },
          { channel: "Tennis Channel", window: "12PM – 4PM", round: "Semifinals" },
        ],
      },
      {
        date: "Oct 18",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "10AM – 4PM", round: "Championship Sunday" },
          { channel: "Tennis Channel", window: "11AM – 4PM", round: "Championship Sunday" },
        ],
      },
    ],
  },
  {
    name: "MLP Cup",
    location: "Brookhaven Country Club · Farmers Branch, TX",
    league: "MLP",
    startIso: "2026-10-30",
    endIso: "2026-11-01",
    days: [
      { date: "Oct 30", dow: "Fri", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Premier Pool Play" }] },
      {
        date: "Oct 31",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "11AM – 7PM", round: "Premier Pool Play" },
          { channel: "Tennis Channel", window: "1PM – 5PM", round: "Premier Pool Play" },
        ],
      },
      {
        date: "Nov 1",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "11AM – 7PM", round: "Semifinals & Finals" },
          { channel: "Tennis Channel", window: "1PM – 5PM", round: "Semifinals & Finals" },
        ],
      },
    ],
  },
  {
    name: "Pickleball World Championships",
    location: "Brookhaven Country Club · Farmers Branch, TX",
    // Worlds is a Major — the biggest one (Bryce, 7/29) — not its own tier.
    tier: "Major · 3,000",
    league: "PPA",
    startIso: "2026-11-03",
    endIso: "2026-11-08",
    slug: "pickleball-world-championships",
    days: [
      { date: "Nov 3", dow: "Tue", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Round of 64" }] },
      {
        date: "Nov 4",
        dow: "Wed",
        windows: [
          { channel: "PBTV", window: "11AM – 10PM", round: "Round of 32" },
          { channel: "Tennis Channel", window: "8PM – 10PM", round: "Celebrity Pro-Am" },
        ],
      },
      { date: "Nov 5", dow: "Thu", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Round of 16" }] },
      { date: "Nov 6", dow: "Fri", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Quarterfinals" }] },
      { date: "Nov 7", dow: "Sat", windows: [{ channel: "PBTV", window: "10AM – 6PM", round: "Semifinals" }] },
      { date: "Nov 8", dow: "Sun", windows: [{ channel: "PBTV", window: "11AM – 5PM", round: "Championship Sunday" }] },
    ],
  },
  {
    name: "Proton Daytona Beach Open",
    location: "Pictona at Holly Hill · Daytona Beach, FL",
    tier: "Open · 1,000",
    league: "PPA",
    startIso: "2026-11-19",
    endIso: "2026-11-22",
    slug: "proton-daytona-beach-open",
    days: [
      { date: "Nov 19", dow: "Thu", windows: [{ channel: "PBTV", window: "10AM – 6PM", round: "Round of 16" }] },
      { date: "Nov 20", dow: "Fri", windows: [{ channel: "PBTV", window: "10AM – 6PM", round: "Quarterfinals" }] },
      { date: "Nov 21", dow: "Sat", windows: [{ channel: "PBTV", window: "9AM – 5PM", round: "Semifinals" }] },
      { date: "Nov 22", dow: "Sun", windows: [{ channel: "PBTV", window: "10AM – 4PM", round: "Championship Sunday" }] },
    ],
  },
  {
    name: "Veolia Malibu Cup",
    location: "Pepperdine University · Malibu, CA",
    tier: "Cup · 1,500",
    league: "PPA",
    startIso: "2026-12-01",
    endIso: "2026-12-06",
    slug: "veolia-malibu-cup",
    days: [
      { date: "Dec 1", dow: "Tue", windows: [{ channel: "PBTV", window: "1PM – 9PM", round: "Round of 64" }] },
      { date: "Dec 2", dow: "Wed", windows: [{ channel: "PBTV", window: "1PM – 9PM", round: "Round of 32" }] },
      {
        date: "Dec 3",
        dow: "Thu",
        windows: [
          { channel: "PBTV", window: "1PM – 9PM", round: "Round of 16" },
          { channel: "Tennis Channel", window: "3PM – 9PM", round: "Round of 16" },
        ],
      },
      {
        date: "Dec 4",
        dow: "Fri",
        windows: [
          { channel: "PBTV", window: "1PM – 9PM", round: "Quarterfinals" },
          { channel: "Tennis Channel", window: "3PM – 9PM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Dec 5",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "12PM – 8PM", round: "Semifinals" },
          { channel: "Tennis Channel", window: "3PM – 7PM", round: "Semifinals" },
        ],
      },
      {
        date: "Dec 6",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "1PM – 7PM", round: "Championship Sunday" },
          { channel: "Tennis Channel", window: "3PM – 7PM", round: "Championship Sunday" },
        ],
      },
    ],
  },
];
