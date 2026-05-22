/**
 * Per-event broadcast schedule, transcribed from the PPA/MLP Championship-Court
 * broadcast sheet (2026-27). Keyed by tournament slug. PBTV streams every
 * round; Tennis Channel / FS1 / FS2 / FOX / CBS carry select TV windows.
 */
export type BroadcastSlot = {
  round: string;
  day: string;
  window: string;
  platform: string;
  secondary?: string;
  type: string;
};

export const eventBroadcasts: Record<string, BroadcastSlot[]> = {
  "carvana-ppa-masters": [
    { round: "RD 64", day: "Tuesday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 32", day: "Wednesday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "7PM ET - 9PM ET", platform: "FS2", secondary: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "7PM ET - 9PM ET", platform: "FS2", secondary: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "1PM ET - 6:30PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "6:30PM ET - 8:30PM ET", platform: "FS1", secondary: "PBTV", type: "LIVE" },
    { round: "Men's Doubles Final", day: "Sunday", window: "12PM ET - 2PM ET", platform: "CBS", type: "LIVE" },
  ],
  "minneapolis-indoor-open": [
    { round: "RD 16", day: "Thursday", window: "11AM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "2PM ET - 5PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "11AM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "2PM ET - 5PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "11AM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "11AM ET - 5PM ET", platform: "PBTV", type: "LIVE" },
  ],
  "cape-coral-open": [
    { round: "RD 16", day: "Thursday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "10AM ET - 4PM ET", platform: "PBTV", type: "LIVE" },
  ],
  "carvana-mesa-cup": [
    { round: "RD 64", day: "Tuesday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 32", day: "Wednesday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "12PM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "6PM ET - 8PM ET", platform: "FS1", secondary: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "12PM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "6PM ET - 8PM ET", platform: "FS1", secondary: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "12PM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "12PM ET - 4PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
  ],
  "newport-beach-open": [
    { round: "RD 16", day: "Thursday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "1PM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
  ],
  "texas-open": [
    { round: "RD 16", day: "Thursday", window: "11AM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "11AM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "11AM ET - 5PM ET", platform: "PBTV", type: "LIVE" },
  ],
  "greater-zion-cup": [
    { round: "RD 64", day: "Tuesday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 32", day: "Wednesday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "9:30PM ET - 11:30PM ET", platform: "FS2", secondary: "PBTV", type: "TAPE" },
    { round: "QF's", day: "Friday", window: "1PM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "7PM ET - 9PM ET", platform: "FS1", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "2PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "8PM ET - 10PM ET", platform: "FS1", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "12PM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
  ],
  "sacramento-open": [
    { round: "RD 16", day: "Thursday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "1PM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
  ],
  "atlanta-pickleball-championships": [
    { round: "RD 64", day: "Tuesday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 32", day: "Wednesday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "9AM ET - 12PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Mixed Doubles SF", day: "Saturday", window: "12:30PM ET - 2:30PM ET", platform: "CBS", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "2:30PM ET - 5PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "10AM ET - 4PM ET", platform: "PBTV", type: "LIVE" },
    { round: "POOL PLAY", day: "Wednesday", window: "2PM ET - 10PM ET", platform: "PBTV", type: "LIVE" },
  ],
  "veolia-pickleball-national-championships": [
    { round: "RD 64", day: "Tuesday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 32", day: "Wednesday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "9AM ET - 5PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "10AM ET - 4PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "11AM ET - 4PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
  ],
  "veolia-cincinnati-cup": [
    { round: "RD 64", day: "Tuesday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 32", day: "Wednesday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "9AM ET - 5PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "10AM ET - 4PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "10AM ET - 2PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
  ],
  "rate-las-vegas-open": [
    { round: "RD 16", day: "Thursday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "2PM ET - 5PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "2PM ET - 5PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "1PM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "1PM ET - 5PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
  ],
  "veolia-chicago-open": [
    { round: "RD 16", day: "Thursday", window: "11AM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "11AM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "11AM ET - 2PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "11AM ET - 2PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "11AM ET - 5PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "11AM ET - 2PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
  ],
  "virginia-beach-open": [
    { round: "RD 16", day: "Thursday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "12PM ET - 4PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "9AM ET - 5PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "12PM ET - 4PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "10AM ET - 4PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "11AM ET - 4PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "Premier Pool Play", day: "Friday", window: "11AM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Premier Pool Play", day: "Saturday", window: "1PM ET - 5PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
  ],
  "proton-daytona-beach-open": [
    { round: "RD 16", day: "Thursday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "9AM ET - 5PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "10AM ET - 4PM ET", platform: "PBTV", type: "LIVE" },
  ],
  "veolia-malibu-cup": [
    { round: "RD 64", day: "Tuesday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 32", day: "Wednesday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 32", day: "Wednesday", window: "3PM ET - 9PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "3PM ET - 9PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "3PM ET - 9PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "1PM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
  ],
};

export function getBroadcast(slug: string): BroadcastSlot[] {
  return eventBroadcasts[slug] ?? [];
}
