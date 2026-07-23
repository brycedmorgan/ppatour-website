/**
 * Season-wide Championship Court broadcast schedule — transcribed from the
 * "2026 PPA/MLP Broadcast Schedule" sheet (as of 6/30/26), remaining events
 * only. Rest of season airs on exactly two platforms: PBTV streams every
 * round; Tennis Channel simulcasts the marquee windows. All times ET.
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
    name: "Veolia Pickleball National Championships",
    location: "Cary Tennis Park · Cary, NC",
    tier: "Major · 2,000",
    league: "PPA",
    startIso: "2026-09-01",
    endIso: "2026-09-06",
    slug: "veolia-pickleball-national-championships",
    days: [
      { date: "Sep 1", dow: "Tue", windows: [{ channel: "PBTV", window: "10AM – 6PM", round: "Round of 64" }] },
      { date: "Sep 2", dow: "Wed", windows: [{ channel: "PBTV", window: "10AM – 6PM", round: "Round of 32" }] },
      { date: "Sep 3", dow: "Thu", windows: [{ channel: "PBTV", window: "10AM – 6PM", round: "Round of 16" }] },
      { date: "Sep 4", dow: "Fri", windows: [{ channel: "PBTV", window: "10AM – 6PM", round: "Quarterfinals" }] },
      { date: "Sep 5", dow: "Sat", windows: [{ channel: "PBTV", window: "9AM – 5PM", round: "Semifinals" }] },
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
    name: "PPA Arizona Open",
    location: "Arizona Athletic Grounds · Mesa, AZ",
    tier: "Open · 1,000",
    league: "PPA",
    startIso: "2026-09-17",
    endIso: "2026-09-20",
    slug: "carvana-mesa-cup",
    days: [
      { date: "Sep 17", dow: "Thu", windows: [{ channel: "PBTV", window: "1PM – 9PM", round: "Round of 16" }] },
      { date: "Sep 18", dow: "Fri", windows: [{ channel: "PBTV", window: "1PM – 9PM", round: "Quarterfinals" }] },
      { date: "Sep 19", dow: "Sat", windows: [{ channel: "PBTV", window: "12PM – 8PM", round: "Semifinals" }] },
      {
        date: "Sep 20",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "1PM – 7PM", round: "Championship Sunday" },
          { channel: "Tennis Channel", window: "1PM – 5PM", round: "Championship Sunday" },
        ],
      },
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
      {
        date: "Oct 2",
        dow: "Fri",
        windows: [
          { channel: "PBTV", window: "1PM – 9PM", round: "Quarterfinals" },
          { channel: "Tennis Channel", window: "2PM – 5PM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Oct 3",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "12PM – 8PM", round: "Semifinals" },
          { channel: "Tennis Channel", window: "2PM – 5PM", round: "Semifinals" },
        ],
      },
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
    slug: "veolia-chicago-open",
    days: [
      { date: "Oct 6", dow: "Tue", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Round of 64" }] },
      { date: "Oct 7", dow: "Wed", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Round of 32" }] },
      { date: "Oct 8", dow: "Thu", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Round of 16" }] },
      {
        date: "Oct 9",
        dow: "Fri",
        windows: [
          { channel: "PBTV", window: "11AM – 7PM", round: "Quarterfinals" },
          { channel: "Tennis Channel", window: "11AM – 2PM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Oct 10",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "10AM – 6PM", round: "Semifinals" },
          { channel: "Tennis Channel", window: "11AM – 2PM", round: "Semifinals" },
        ],
      },
      {
        date: "Oct 11",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "11AM – 5PM", round: "Championship Sunday" },
          { channel: "Tennis Channel", window: "11AM – 2PM", round: "Championship Sunday" },
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
    name: "PPA World Pickleball Championships",
    location: "Brookhaven Country Club · Farmers Branch, TX",
    tier: "Worlds · 3,000",
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
    name: "Proton Florida Open",
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
      {
        date: "Dec 2",
        dow: "Wed",
        windows: [
          { channel: "PBTV", window: "1PM – 9PM", round: "Round of 32" },
          { channel: "Tennis Channel", window: "3PM – 9PM", round: "Round of 32" },
        ],
      },
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
          { channel: "Tennis Channel", window: "1PM – 7PM", round: "Quarterfinals" },
        ],
      },
      { date: "Dec 5", dow: "Sat", windows: [{ channel: "PBTV", window: "12PM – 8PM", round: "Semifinals" }] },
      {
        date: "Dec 6",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "1PM – 7PM", round: "Championship Sunday" },
          { channel: "Tennis Channel", window: "1PM – 5PM", round: "Championship Sunday" },
        ],
      },
    ],
  },
];
