/**
 * Season-wide Championship Court broadcast schedule, reconciled to
 * "2026 PPA/MLP Broadcast Schedule (Championship Court) — as of 8/13/26"
 * (the authoritative production sheet; supersedes "Pickleball Scheduling 2026
 * V22 — 7.17.26", which this file was previously built from). PBTV streams
 * every round; Tennis Channel and FOX Sports carry select windows. Times ET.
 *
 * ⚠ FOX SPORTS WINDOWS ARE NEW AS OF THE 8/13 SHEET, and they are NOT a
 * simulcast of the PBTV window — most are FS1/FS2-exclusive night windows that
 * start where the PBTV window ends (Arizona Sun: PBTV 5–7, then FS1 7–9). So a
 * FOX row is additional coverage, never a duplicate of the row above it.
 *
 * ⚠ VIRGINIA BEACH RE-RECONCILED 8/21 vs the 8/19 sheet: its Friday and Saturday
 * Tennis Channel windows moved an hour earlier, 12–4PM → 11AM–3PM. Caught by
 * `node scripts/audit-tv-schedule.mjs`, not by anyone re-reading the sheet —
 * which is the argument for running it before a broadcast weekend. Total TC
 * hours are unchanged at 13h, so the figure below still holds.
 *
 * ⚠ CARY'S FRIDAY AND SATURDAY WERE REVISED 9/3 FOR WEATHER, mid-tournament and
 * ahead of the sheet — see the note on those two days below. Cary TC is now
 * 20.5h, not the 22h this paragraph recorded when it was reconciled.
 *
 * ⚠ ARIZONA WAS RESCHEDULED WHOLESALE ON THE 9/10 SHEET — every window moved
 * into the evening (PBTV opens 5PM ET on all four days, running to 1AM Thu–Sat)
 * and Friday's FOX window changed network, FS2 → FS1. Its line below therefore
 * reads +1 FS2 +2 FS1, not the +2 FS2 +1 FS1 the 8/13 sheet gave.
 *
 * ⚠ RECONCILED 9/24 VS THE 9/21 SHEET (Keaton Maynard), which moved four of the
 * remaining stops and is the current source of truth. What changed:
 *   · Chicago — every day into the evening (PBTV opens 3PM Tue–Fri), Thursday
 *     PBTV split either side of the FS1 exclusive, Saturday TC 11AM–3PM →
 *     1–4PM, and Sunday's FS1 window is now TAPE.
 *   · Virginia Beach — 2PM starts Thu/Fri, and a NEW Thursday TC window, so TC
 *     carries four days there rather than three.
 *   · Daytona — 2PM starts, Sunday shortened to 10AM–3PM.
 *   · Malibu — rebuilt: Tue/Wed coverage dropped entirely, the four remaining
 *     days moved to evening, and the row's tier corrected to Open · 500.
 * Las Vegas, Arizona, Worlds and the MLP Cup were checked and are UNCHANGED.
 *
 * ⚠ CARY IS DELIBERATELY NOT RECONCILED TO THIS SHEET. The 9/21 sheet still
 * shows Saturday's morning PBTV window as 9AM–5PM, which is the PRE-weather
 * time; the site carries 9AM–12PM because that is what actually aired after the
 * 9/3 reschedule, and the event finished on 9/6. The audit reports that one row
 * as a mismatch on purpose — the site is the record of what happened, and the
 * sheet was only half-updated for that Saturday (its Friday rows do match).
 *
 * Hour totals, computed from the windows below: Cary 20.5h TC (Thu–Sun) ·
 * Arizona +1 FS2 +2 FS1 (no TC) · Las Vegas 4h TC (Sun only) · Chicago 12.5h TC
 * (Thu–Sun) +2 FS1 +2 FS2 · VA Beach 13h TC · MLP Nations Cup PBTV-ONLY ·
 * Worlds 2h TC (Wed Pro-Am only) · Malibu 19h TC (Thu–Sun).
 */

export type TvWindow = {
  channel: "PBTV" | "Tennis Channel" | "FS1" | "FS2";
  window: string;
  round: string;
  /** Tape-delayed replay, not a live window. The sheet marks these TAPE, and a
   *  replay presented as live coverage sends people to a finished match. */
  tape?: boolean;
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
      {
        date: "Sep 3",
        dow: "Thu",
        windows: [
          { channel: "PBTV", window: "9AM – 5PM", round: "Round of 16" },
          { channel: "Tennis Channel", window: "11:30AM – 5PM", round: "Round of 16" },
        ],
      },
      // ⚠ WEATHER REVISION, 9/3/26 (event team, mid-tournament). Friday and
      // Saturday are SPLIT WINDOWS now — a morning PBTV block, a long break, then
      // a five-hour evening block simulcast on Tennis Channel and PBTV. Both days
      // were one all-day PBTV window with a midday TC window on the 8/13 sheet.
      // ⚠ THE PRODUCTION SHEET DOES NOT CARRY THIS CHANGE — checked 9/3, the live
      // export (header "as of 8/29/26") still lists the pre-weather windows. So
      // `node scripts/audit-tv-schedule.mjs` WILL report these six as
      // site-vs-sheet mismatches. That is expected; do NOT "reconcile" them back
      // to the sheet. Clear the note once a reissued sheet matches.
      {
        date: "Sep 4",
        dow: "Fri",
        windows: [
          { channel: "PBTV", window: "9AM – 12PM", round: "Quarterfinals" },
          { channel: "PBTV", window: "4:30PM – 9:30PM", round: "Quarterfinals" },
          { channel: "Tennis Channel", window: "4:30PM – 9:30PM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Sep 5",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "9AM – 12PM", round: "Semifinals" },
          { channel: "PBTV", window: "4:30PM – 9:30PM", round: "Semifinals" },
          { channel: "Tennis Channel", window: "4:30PM – 9:30PM", round: "Semifinals" },
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
  /**
   * ⚠ NO TENNIS CHANNEL WINDOW — this stop is PBTV + FOX Sports.
   *
   * ⚠ RESCHEDULED TO THE 9/10 SHEET (Keaton Maynard: "changed to later half of
   * day"). EVERY window moved — the whole event is now an evening broadcast,
   * PBTV opening at 5PM ET rather than 12–1PM, and running to 1AM on the three
   * days that aren't Championship Sunday. Do not reconcile these back to the
   * 8/13 windows; they are superseded.
   *
   * ⚠ AND FRIDAY'S FOX WINDOW CHANGED NETWORK, FS2 → FS1, which is the easiest
   * thing here to miss on a skim. FS1 takes Friday QFs and Championship Sunday
   * and is EXCLUSIVE on both; FS2 keeps Saturday SFs and is not.
   *
   * ⚠ EXCLUSIVITY IS WHY PBTV HAS TWO ROWS ON FRI AND SUN AND ONE ON THU/SAT.
   * An FS1-exclusive window means PBTV goes dark for those two hours, so its
   * coverage is split around it (Fri 5–7 then 9–1AM; Sun 5–7 then 9–10). The
   * Saturday FS2 window is non-exclusive, so PBTV runs straight through it
   * 5PM–1AM — which is also why that FS2 row carries no `secondary: "PBTV"`:
   * a standalone PBTV row already covers the identical hours and both would
   * print PBTV twice against one slot.
   */
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
      { date: "Sep 17", dow: "Thu", windows: [{ channel: "PBTV", window: "5PM – 1AM", round: "Round of 16" }] },
      {
        date: "Sep 18",
        dow: "Fri",
        windows: [
          { channel: "PBTV", window: "5PM – 7PM", round: "Quarterfinals" },
          { channel: "FS1", window: "7PM – 9PM", round: "Quarterfinals" },
          { channel: "PBTV", window: "9PM – 1AM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Sep 19",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "5PM – 1AM", round: "Semifinals" },
          { channel: "FS2", window: "7PM – 9PM", round: "Semifinals" },
        ],
      },
      {
        date: "Sep 20",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "5PM – 7PM", round: "Championship Sunday" },
          { channel: "FS1", window: "7PM – 9PM", round: "Championship Sunday" },
          { channel: "PBTV", window: "9PM – 10PM", round: "Championship Sunday" },
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
      // ⚠ RESCHEDULED INTO THE EVENING on the 9/10 sheet — Thu and Fri 1PM–9PM
      // → 5PM–1AM, Sat 12PM–8PM → 4PM–12AM. Confirmed independently by the event
      // team's own PBTV start times (9/20: Thu 5PM ET, Fri 5PM ET, Sat 4PM ET,
      // Sun 1PM ET) and by their order of play, which puts first serve at 2PM
      // local Thu/Fri and 1PM Sat — Nevada is Pacific, so ET is local + 3.
      // Championship Sunday did NOT move.
      { date: "Oct 1", dow: "Thu", windows: [{ channel: "PBTV", window: "5PM – 1AM", round: "Round of 16" }] },
      { date: "Oct 2", dow: "Fri", windows: [{ channel: "PBTV", window: "5PM – 1AM", round: "Quarterfinals" }] },
      { date: "Oct 3", dow: "Sat", windows: [{ channel: "PBTV", window: "4PM – 12AM", round: "Semifinals" }] },
      {
        date: "Oct 4",
        dow: "Sun",
        windows: [
          // Sunday's START did not move (1PM ET, confirmed by the event team
          // 9/20) but the 9/10 sheet shortened the PBTV window by an hour,
          // 1PM–7PM → 1PM–6PM. The Tennis Channel simulcast is unchanged.
          { channel: "PBTV", window: "1PM – 6PM", round: "Championship Sunday" },
          { channel: "Tennis Channel", window: "1PM – 5PM", round: "Championship Sunday" },
        ],
      },
    ],
  },
  /**
   * ⚠ THE MOST-CHANGED EVENT ON THE 8/13 SHEET. Thursday gained a Tennis
   * Channel window (the site had Fri–Sun only, so TC is now Thu–Sun / 16h), and
   * FOX Sports added four: FS1 on Thursday and Sunday, FS2 on Friday and
   * Saturday. Three PBTV windows moved to make room (Thu 11–7 → 11–6, Fri
   * 11–7 → 11–8, Sun 11–5 → 11–5:30). The Saturday FS2 window is a TAPE replay,
   * not live — it airs at 9PM on a day whose play ends at 6PM.
   */
  {
    name: "Veolia Chicago Cup",
    location: "Life Time North Shore · Chicago, IL",
    tier: "Cup · 1,500",
    league: "PPA",
    startIso: "2026-10-06",
    endIso: "2026-10-11",
    slug: "veolia-chicago-cup",
    days: [
      { date: "Oct 6", dow: "Tue", windows: [{ channel: "PBTV", window: "3PM – 11PM", round: "Round of 64" }] },
      { date: "Oct 7", dow: "Wed", windows: [{ channel: "PBTV", window: "3PM – 11PM", round: "Round of 32" }] },
      {
        date: "Oct 8",
        dow: "Thu",
        /**
         * ⚠ TWO PBTV WINDOWS, SPLIT EITHER SIDE OF THE FS1 EXCLUSIVE, and the
         * gap between them is the point. The 9/21 sheet gives PBTV 3–6, FS1 6–8
         * marked "FS1 EXCL.", then PBTV back 8–11. Closing that gap into one
         * 3–11PM row would advertise PBTV coverage of the two hours FOX holds
         * exclusively.
         */
        windows: [
          { channel: "PBTV", window: "3PM – 6PM", round: "Round of 16" },
          { channel: "Tennis Channel", window: "3PM – 5:30PM", round: "Round of 16" },
          { channel: "FS1", window: "6PM – 8PM", round: "Round of 16" },
          { channel: "PBTV", window: "8PM – 11PM", round: "Round of 16" },
        ],
      },
      {
        date: "Oct 9",
        dow: "Fri",
        windows: [
          { channel: "PBTV", window: "3PM – 11PM", round: "Quarterfinals" },
          { channel: "Tennis Channel", window: "3PM – 6PM", round: "Quarterfinals" },
          { channel: "FS2", window: "6PM – 8PM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Oct 10",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "1PM – 9PM", round: "Semifinals" },
          { channel: "Tennis Channel", window: "1PM – 4PM", round: "Semifinals" },
          { channel: "FS2", window: "9PM – 11PM", round: "Semifinals", tape: true },
        ],
      },
      {
        date: "Oct 11",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "11AM – 4PM", round: "Championship Sunday" },
          { channel: "Tennis Channel", window: "11AM – 3PM", round: "Championship Sunday" },
          // ⚠ NOW MARKED TAPE on the 9/21 sheet: it airs 90 minutes after play
          // ends. It was carried here as a live window until this pass.
          { channel: "FS1", window: "5:30PM – 7:30PM", round: "Championship Sunday", tape: true },
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
      {
        date: "Oct 15",
        dow: "Thu",
        // ⚠ THE THURSDAY TENNIS CHANNEL WINDOW IS NEW on the 9/21 sheet. TC now
        // carries all four days at this stop, where it carried three.
        windows: [
          { channel: "PBTV", window: "2PM – 10PM", round: "Round of 16" },
          { channel: "Tennis Channel", window: "2PM – 5PM", round: "Round of 16" },
        ],
      },
      {
        date: "Oct 16",
        dow: "Fri",
        windows: [
          { channel: "PBTV", window: "2PM – 10PM", round: "Quarterfinals" },
          { channel: "Tennis Channel", window: "2PM – 5PM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Oct 17",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "12PM – 8PM", round: "Semifinals" },
          { channel: "Tennis Channel", window: "12PM – 3PM", round: "Semifinals" },
        ],
      },
      {
        date: "Oct 18",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "10AM – 3PM", round: "Championship Sunday" },
          { channel: "Tennis Channel", window: "10AM – 2PM", round: "Championship Sunday" },
        ],
      },
    ],
  },
  /**
   * ⚠ PBTV-ONLY AS OF THE 8/13 SHEET — the Saturday and Sunday Tennis Channel
   * windows this row used to carry are GONE from the sheet. Don't restore them
   * from an older copy of the schedule.
   *
   * ⚠ The sheet names this "MLP Nations Cup"; kept as "MLP Cup" here to match
   * the rest of the site. Whether MLP belongs on ppatour.com at all is an open
   * question (Wesley, 8/18) — this is the ONLY MLP row in the file, so dropping
   * the league from the TV guide is deleting this one block and nothing else.
   */
  {
    name: "MLP Cup",
    location: "Brookhaven Country Club · Farmers Branch, TX",
    league: "MLP",
    startIso: "2026-10-30",
    endIso: "2026-11-01",
    days: [
      { date: "Oct 30", dow: "Fri", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Premier Pool Play" }] },
      { date: "Oct 31", dow: "Sat", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Premier Pool Play" }] },
      { date: "Nov 1", dow: "Sun", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Semifinals & Finals" }] },
    ],
  },
  {
    name: "Opendoor Pickleball World Championships",
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
      { date: "Nov 19", dow: "Thu", windows: [{ channel: "PBTV", window: "2PM – 10PM", round: "Round of 16" }] },
      { date: "Nov 20", dow: "Fri", windows: [{ channel: "PBTV", window: "2PM – 10PM", round: "Quarterfinals" }] },
      { date: "Nov 21", dow: "Sat", windows: [{ channel: "PBTV", window: "12PM – 8PM", round: "Semifinals" }] },
      { date: "Nov 22", dow: "Sun", windows: [{ channel: "PBTV", window: "10AM – 3PM", round: "Championship Sunday" }] },
    ],
  },
  /**
   * ⚠ REBUILT WHOLESALE FROM THE 9/21 SHEET, AND IT IS A SHORTER BROADCAST THAN
   * IT WAS. Coverage now runs Thu–Sun only: the Tuesday Round-of-64 and
   * Wednesday Round-of-32 windows this block used to carry are GONE from the
   * sheet, and the four surviving days all moved into the evening. Don't
   * restore Tue/Wed from an older copy of the schedule.
   *
   * ⚠ THE AUDIT COULD NOT SEE ANY OF THAT UNTIL 9/24, and the reason is worth
   * keeping. `scripts/audit-tv-schedule.mjs` joins on the sheet's own event
   * header, and the 9/21 sheet finally adopted the "Malibu Showcase" rename the
   * tour made on 8/26 — so the old EVENT_MAP key ("PPA Malibu Cup") matched
   * nothing and the script reported the stop as simply absent from the sheet
   * rather than as six wrong days. A stop that goes quiet in that audit is a
   * rename until proven otherwise; check the sheet's headers before believing
   * coverage was dropped.
   */
  {
    /**
     * Renamed and re-dated 8/26 (Bryan Renahan, via the feed): "Veolia Malibu
     * Cup" → "Veolia Malibu Showcase", and the event now opens Dec 14.
     *
     * ⚠ `startIso` IS THE EVENT'S START (Dec 14) so it agrees with /events; the
     * `days` array below is TV COVERAGE ONLY, and as of the 9/21 sheet the two
     * no longer line up — the stop opens on the 14th and television joins it on
     * the 17th. Nothing derives the days from these two fields, so that is not
     * a contradiction to reconcile; they drive sorting and the event link's
     * year, nothing else.
     *
     * ⚠ TIER IS `Open · 500`, NOT THE CUP THIS ROW USED TO CLAIM. The 9/8 board
     * decision made the Showcase a PPA 500 Open (it is `tier: "open", points:
     * 500` in lib/placeholder-data.ts), and the 9/21 sheet's own header now
     * reads "| 500" — so this string had been contradicting both the ruling and
     * the source sheet. It stays a PPA Tour stop; 500 is not a demotion off the
     * Tour.
     */
    name: "Veolia Malibu Showcase",
    location: "Pepperdine University · Malibu, CA",
    tier: "Open · 500",
    league: "PPA",
    startIso: "2026-12-14",
    endIso: "2026-12-20",
    slug: "veolia-malibu-cup",
    days: [
      {
        date: "Dec 17",
        dow: "Thu",
        windows: [
          { channel: "PBTV", window: "5PM – 1AM", round: "Round of 16" },
          { channel: "Tennis Channel", window: "5PM – 10PM", round: "Round of 16" },
        ],
      },
      {
        date: "Dec 18",
        dow: "Fri",
        windows: [
          { channel: "PBTV", window: "5PM – 1AM", round: "Quarterfinals" },
          { channel: "Tennis Channel", window: "5PM – 10PM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Dec 19",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "3PM – 11PM", round: "Semifinals" },
          { channel: "Tennis Channel", window: "4PM – 8PM", round: "Semifinals" },
        ],
      },
      {
        date: "Dec 20",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "1PM – 6PM", round: "Championship Sunday" },
          { channel: "Tennis Channel", window: "1PM – 6PM", round: "Championship Sunday" },
        ],
      },
    ],
  },
];
