/**
 * Season-wide Championship Court broadcast schedule, reconciled to
 * "2026 PPA/MLP Broadcast Schedule (Championship Court) — as of 8/13/26"
 * (the authoritative production sheet; supersedes "Pickleball Scheduling 2026
 * V22 — 7.17.26", which this file was previously built from). PBTV streams
 * every round; Tennis Channel and FOX Sports carry select windows. Times ET.
 *
 * ⚠ FOX SPORTS WINDOWS ARE NEW AS OF THE 8/13 SHEET, and they are NOT a
 * simulcast of the PBTV window — most are FS1/FS2-exclusive night windows that
 * start where the PBTV window ends (Arizona Sun: PBTV 2–7, then FS1 7–9). So a
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
 * Reconciled 8/18 vs the 8/13 sheet: Cary 22h TC (Thu–Sun) · Arizona +2 FS2
 * +1 FS1 (no TC) · Las Vegas 4h TC (Sun only) · Chicago 16h TC (Thu–Sun) +2 FS1
 * +2 FS2 · VA Beach 13h TC · MLP Nations Cup PBTV-ONLY (its TC windows were
 * removed from the sheet) · Worlds 2h TC (Wed Pro-Am only) · Malibu 15h TC
 * (Wed–Sun). The hour totals are computed from the windows below.
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
   * ⚠ NO TENNIS CHANNEL WINDOW — this stop is PBTV + FOX Sports. The 8/13 sheet
   * added an FS2 window on Friday and Saturday and an FS1 window on Championship
   * Sunday, and moved two PBTV windows to make room (Sat 12–8 → 12–9, Sun 1–7 →
   * 2–7). The Sunday FS1 window is FS1-exclusive and starts when the PBTV window
   * ends, so Sunday coverage runs 2PM–9PM across the two.
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
      { date: "Sep 17", dow: "Thu", windows: [{ channel: "PBTV", window: "1PM – 9PM", round: "Round of 16" }] },
      {
        date: "Sep 18",
        dow: "Fri",
        windows: [
          { channel: "PBTV", window: "1PM – 9PM", round: "Quarterfinals" },
          { channel: "FS2", window: "6PM – 8PM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Sep 19",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "12PM – 9PM", round: "Semifinals" },
          { channel: "FS2", window: "7PM – 9PM", round: "Semifinals" },
        ],
      },
      {
        date: "Sep 20",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "2PM – 7PM", round: "Championship Sunday" },
          { channel: "FS1", window: "7PM – 9PM", round: "Championship Sunday" },
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
      { date: "Oct 6", dow: "Tue", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Round of 64" }] },
      { date: "Oct 7", dow: "Wed", windows: [{ channel: "PBTV", window: "11AM – 7PM", round: "Round of 32" }] },
      {
        date: "Oct 8",
        dow: "Thu",
        windows: [
          { channel: "PBTV", window: "11AM – 6PM", round: "Round of 16" },
          { channel: "Tennis Channel", window: "11AM – 3PM", round: "Round of 16" },
          { channel: "FS1", window: "6PM – 8PM", round: "Round of 16" },
        ],
      },
      {
        date: "Oct 9",
        dow: "Fri",
        windows: [
          { channel: "PBTV", window: "11AM – 8PM", round: "Quarterfinals" },
          { channel: "Tennis Channel", window: "11AM – 3PM", round: "Quarterfinals" },
          { channel: "FS2", window: "6PM – 8PM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Oct 10",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "10AM – 6PM", round: "Semifinals" },
          { channel: "Tennis Channel", window: "11AM – 3PM", round: "Semifinals" },
          { channel: "FS2", window: "9PM – 11PM", round: "Semifinals", tape: true },
        ],
      },
      {
        date: "Oct 11",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "11AM – 5:30PM", round: "Championship Sunday" },
          { channel: "Tennis Channel", window: "11AM – 3PM", round: "Championship Sunday" },
          { channel: "FS1", window: "5:30PM – 7:30PM", round: "Championship Sunday" },
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
          { channel: "Tennis Channel", window: "11AM – 3PM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Oct 17",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "9AM – 5PM", round: "Semifinals" },
          { channel: "Tennis Channel", window: "11AM – 3PM", round: "Semifinals" },
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
      { date: "Nov 19", dow: "Thu", windows: [{ channel: "PBTV", window: "10AM – 6PM", round: "Round of 16" }] },
      { date: "Nov 20", dow: "Fri", windows: [{ channel: "PBTV", window: "10AM – 6PM", round: "Quarterfinals" }] },
      { date: "Nov 21", dow: "Sat", windows: [{ channel: "PBTV", window: "9AM – 5PM", round: "Semifinals" }] },
      { date: "Nov 22", dow: "Sun", windows: [{ channel: "PBTV", window: "10AM – 4PM", round: "Championship Sunday" }] },
    ],
  },
  /**
   * ✅ DATES CONFIRMED 8/18. This block was shifted +14 days on 8/17 off the
   * feed alone (it read Dec 1–6, built when the stop was the week of Nov 30),
   * and the 8/13 sheet independently lists it as 12/15–12/20 — so the week and
   * every day-of-week are now confirmed by both sources.
   *
   * ⚠ AND THE TENNIS CHANNEL WINDOWS DID CHANGE WITH THE MOVE, which is exactly
   * what the old note warned might happen. They were 3–9PM Thu/Fri and 3–7PM
   * Sat/Sun; the sheet now has a uniform 3:30–6:30PM Wed–Sat, with Sunday at
   * 2:30–5:30PM. WEDNESDAY IS NEW — TC carries five days here, not four.
   */
  {
    /**
     * Renamed and re-dated 8/26 (Bryan Renahan, via the feed): "Veolia Malibu
     * Cup" → "Veolia Malibu Showcase", and the event now opens Dec 14.
     *
     * ⚠ THE TV WINDOWS BELOW ARE DELIBERATELY UNCHANGED, and the calendar is
     * why. The event gained a day at the FRONT, not a shift: Dec 14 is a
     * Monday and Dec 20 is still the Sunday, so Championship Sunday has not
     * moved and every Tue–Sun row still lands on the weekday the 8/13 sheet
     * assigned it. Monday carries no window — the sheet has never listed one,
     * and an opening qualifying day without TV is the Nationals pattern.
     * ⚠ Do NOT shift these rows back a day to "match" the new start; that
     * would put Championship Sunday on a Saturday.
     *
     * `startIso` is the EVENT's start (Dec 14) so it agrees with /events; the
     * `days` array below is TV coverage only. Nothing derives the days from
     * these two fields — they drive sorting and the event link's year.
     */
    name: "Veolia Malibu Showcase",
    location: "Pepperdine University · Malibu, CA",
    tier: "Cup · 1,500",
    league: "PPA",
    startIso: "2026-12-14",
    endIso: "2026-12-20",
    slug: "veolia-malibu-cup",
    days: [
      { date: "Dec 15", dow: "Tue", windows: [{ channel: "PBTV", window: "1PM – 9PM", round: "Round of 64" }] },
      {
        date: "Dec 16",
        dow: "Wed",
        windows: [
          { channel: "PBTV", window: "1PM – 9PM", round: "Round of 32" },
          { channel: "Tennis Channel", window: "3:30PM – 6:30PM", round: "Round of 32" },
        ],
      },
      {
        date: "Dec 17",
        dow: "Thu",
        windows: [
          { channel: "PBTV", window: "1PM – 9PM", round: "Round of 16" },
          { channel: "Tennis Channel", window: "3:30PM – 6:30PM", round: "Round of 16" },
        ],
      },
      {
        date: "Dec 18",
        dow: "Fri",
        windows: [
          { channel: "PBTV", window: "1PM – 9PM", round: "Quarterfinals" },
          { channel: "Tennis Channel", window: "3:30PM – 6:30PM", round: "Quarterfinals" },
        ],
      },
      {
        date: "Dec 19",
        dow: "Sat",
        windows: [
          { channel: "PBTV", window: "12PM – 8PM", round: "Semifinals" },
          { channel: "Tennis Channel", window: "3:30PM – 6:30PM", round: "Semifinals" },
        ],
      },
      {
        date: "Dec 20",
        dow: "Sun",
        windows: [
          { channel: "PBTV", window: "1PM – 7PM", round: "Championship Sunday" },
          { channel: "Tennis Channel", window: "2:30PM – 5:30PM", round: "Championship Sunday" },
        ],
      },
    ],
  },
];
