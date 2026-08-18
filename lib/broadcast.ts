/**
 * Per-event broadcast schedule, transcribed from the PPA/MLP Championship-Court
 * broadcast sheet. Keyed by tournament slug. PBTV streams every round;
 * Tennis Channel / FS1 / FS2 / FOX / CBS carry select TV windows.
 *
 * ⚠ THE 2026/27 SEASON ROWS (Nationals → Malibu) ARE RECONCILED TO THE 8/13/26
 * SHEET as of 8/18. The earlier rows (Masters → PPA Finals, i.e. the completed
 * 2025/26 season) are the older transcription and were deliberately left alone.
 *
 * ⚠ KEEP IN LOCKSTEP WITH `lib/tv-schedule.ts`, which carries the same windows
 * for /watch and /watch/tv. The two are separate transcriptions of one sheet and
 * have drifted before (7/26: two events' TC windows disagreed).
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
    { round: "RD 16", day: "Thursday", window: "11:30AM ET - 5PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "11:30AM ET - 5PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "9AM ET - 5PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "11AM ET - 5PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
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
  "veolia-arizona-open": [
    { round: "RD 16", day: "Thursday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "6PM ET - 8PM ET", platform: "FS2", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "12PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "7PM ET - 9PM ET", platform: "FS2", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "2PM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    // FS1-exclusive, and it starts where the PBTV window ends — not a simulcast.
    { round: "Championship", day: "Sunday", window: "7PM ET - 9PM ET", platform: "FS1", type: "LIVE" },
  ],
  "rate-las-vegas-open": [
    { round: "RD 16", day: "Thursday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "1PM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "1PM ET - 5PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
  ],
  // 8/13 sheet: Thursday gained a TC window, FOX added four (FS1 Thu + Sun,
  // FS2 Fri + Sat), and the RD 64 / RD 32 days were missing here entirely.
  "veolia-chicago-cup": [
    { round: "RD 64", day: "Tuesday", window: "11AM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 32", day: "Wednesday", window: "11AM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "11AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "11AM ET - 3PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "6PM ET - 8PM ET", platform: "FS1", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "11AM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "11AM ET - 3PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "6PM ET - 8PM ET", platform: "FS2", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "11AM ET - 3PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    // TAPE — airs at 9PM on a day whose play ends at 6PM.
    { round: "SF's", day: "Saturday", window: "9PM ET - 11PM ET", platform: "FS2", type: "TAPE" },
    { round: "Championship", day: "Sunday", window: "11AM ET - 5:30PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "11AM ET - 3PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "5:30PM ET - 7:30PM ET", platform: "FS1", type: "LIVE" },
  ],
  "virginia-beach-open": [
    { round: "RD 16", day: "Thursday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "12PM ET - 4PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "9AM ET - 5PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "12PM ET - 4PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "10AM ET - 4PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "11AM ET - 4PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
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
    // Wednesday TC is NEW on the 8/13 sheet — TC now carries five days here.
    { round: "RD 32", day: "Wednesday", window: "3:30PM ET - 6:30PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "3:30PM ET - 6:30PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "3:30PM ET - 6:30PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "3:30PM ET - 6:30PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "1PM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "2:30PM ET - 5:30PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
  ],
  "pickleball-world-championships": [
    { round: "RD 64", day: "Tuesday", window: "11AM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 32", day: "Wednesday", window: "11AM ET - 10PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Celebrity Pro-Am", day: "Wednesday", window: "8PM ET - 10PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "11AM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "11AM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "10AM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "11AM ET - 5PM ET", platform: "PBTV", type: "LIVE" },
  ],
};

export function getBroadcast(slug: string): BroadcastSlot[] {
  return eventBroadcasts[slug] ?? [];
}
