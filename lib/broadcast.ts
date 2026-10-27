/**
 * Per-event broadcast schedule, transcribed from the PPA/MLP Championship-Court
 * broadcast sheet. Keyed by tournament slug. PBTV streams every round;
 * Tennis Channel / FS1 / FS2 / FOX / CBS carry select TV windows.
 *
 * ⚠ THE UPCOMING 2026/27 ROWS ARE RECONCILED TO THE 9/21/26 SHEET as of 9/24 —
 * Chicago, Virginia Beach, Daytona and Malibu all moved, and Malibu lost its
 * Tuesday and Wednesday coverage outright. Arizona, Las Vegas, Worlds and the
 * MLP Cup were checked against the same sheet and are unchanged. The earlier
 * rows (Masters → PPA Finals, i.e. the completed 2025/26 season) are the older
 * transcription and were deliberately left alone.
 *
 * ⚠ CARY IS DELIBERATELY AHEAD OF THE SHEET and must stay that way: its Friday
 * and Saturday were revised for weather mid-tournament on 9/3, the event has
 * finished, and these rows are the record of what actually aired. The 9/21
 * sheet still shows Saturday's pre-weather morning window.
 *
 * ⚠ KEEP IN LOCKSTEP WITH `lib/tv-schedule.ts`, which carries the same windows
 * for /watch and /watch/tv. The two are separate transcriptions of one sheet and
 * have drifted before (7/26: two events' TC windows disagreed).
 *
 * ⚠ BUT DO NOT RECONCILE THESE AGAINST THE ORDER OF PLAY. Broadcast windows and
 * `lib/event-schedule.ts`'s first-serve and gate times are independent — Wesley,
 * 8/27: "they are two different things. Sometimes the broadcast times will not
 * match the order of play times." Coverage can open before play starts or run
 * past its end. Nationals Thursday is the live example: PBTV from 9AM against a
 * 10AM first serve, and both are correct. A mismatch here is not a bug.
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
    { round: "RD 16", day: "Thursday", window: "9AM ET - 5PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "11:30AM ET - 5PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    // ⚠ WEATHER REVISION, 9/3/26 — Friday and Saturday are split windows now:
    // a morning PBTV block, then an evening Tennis Channel + PBTV simulcast. Kept
    // in lockstep with `lib/tv-schedule.ts`, which carries the full note. The
    // production sheet does not have this change yet — the audit flags it.
    { round: "QF's", day: "Friday", window: "9AM ET - 12PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "4:30PM ET - 9:30PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "4:30PM ET - 9:30PM ET", platform: "Tennis Channel", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "9AM ET - 12PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "4:30PM ET - 9:30PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "4:30PM ET - 9:30PM ET", platform: "Tennis Channel", type: "LIVE" },
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
  // ⚠ RESCHEDULED to the 9/10 sheet — Keaton Maynard, "changed to later half of
  // day". Every window moved; this stop is now an evening broadcast (PBTV from
  // 5PM ET, running to 1AM Thu–Sat). ⚠ Friday's FOX window also changed network,
  // FS2 → FS1. Kept in lockstep with lib/tv-schedule.ts, which carries the full
  // reasoning for why PBTV splits into two rows on Fri and Sun.
  "veolia-arizona-open": [
    { round: "RD 16", day: "Thursday", window: "5PM ET - 1AM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "5PM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    // FS1-exclusive: PBTV goes dark for these two hours and resumes at 9PM.
    { round: "QF's", day: "Friday", window: "7PM ET - 9PM ET", platform: "FS1", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "9PM ET - 1AM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "5PM ET - 1AM ET", platform: "PBTV", type: "LIVE" },
    // Non-exclusive, so the PBTV row above runs straight through it.
    { round: "SF's", day: "Saturday", window: "7PM ET - 9PM ET", platform: "FS2", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "5PM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    // FS1-exclusive, and it starts where the PBTV window ends — not a simulcast.
    { round: "Championship", day: "Sunday", window: "7PM ET - 9PM ET", platform: "FS1", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "9PM ET - 10PM ET", platform: "PBTV", type: "LIVE" },
  ],
  // ⚠ RESCHEDULED INTO THE EVENING on the 9/10 sheet, and kept in lockstep with
  // lib/tv-schedule.ts — see the note there. Championship Sunday did not move.
  "rate-las-vegas-open": [
    { round: "RD 16", day: "Thursday", window: "5PM ET - 1AM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "5PM ET - 1AM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "3PM ET - 11PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "1PM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "1PM ET - 5PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
  ],
  // 8/13 sheet: Thursday gained a TC window, FOX added four (FS1 Thu + Sun,
  // FS2 Fri + Sat), and the RD 64 / RD 32 days were missing here entirely.
  // 10/5: Thu + Fri Tennis Channel dropped (live sheet + PBTV's start-times
  // note agree) — TC is Sat + Sun only.
  "veolia-chicago-cup": [
    { round: "RD 64", day: "Tuesday", window: "3PM ET - 11PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 32", day: "Wednesday", window: "3PM ET - 11PM ET", platform: "PBTV", type: "LIVE" },
    // ⚠ Thursday's PBTV coverage is TWO windows either side of the FS1 exclusive
    // (6–8PM, marked "FS1 EXCL." on the sheet). Don't merge them into 3–11PM.
    { round: "RD 16", day: "Thursday", window: "3PM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "6PM ET - 8PM ET", platform: "FS1", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "8PM ET - 11PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "3PM ET - 11PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "6PM ET - 8PM ET", platform: "FS2", secondary: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "1PM ET - 9PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "1PM ET - 4PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    // 10/5 FOX update: LIVE now, 6–8PM ET (was a 9–11PM tape replay).
    { round: "SF's", day: "Saturday", window: "6PM ET - 8PM ET", platform: "FS2", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "11AM ET - 4PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "11AM ET - 3PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    // Still TAPE; the 10/5 FOX update moved it to 6–8PM ET (was 5:30–7:30).
    { round: "Championship", day: "Sunday", window: "6PM ET - 8PM ET", platform: "FS1", type: "TAPE" },
  ],
  "virginia-beach-open": [
    // ⚠ TUESDAY AND WEDNESDAY ARE NEW, and they post-date the 9/21 sheet — the
    // audit will report them as extra rows until the sheet is reissued. Source is
    // Matt Mayfield, #marketing-general 10/10: "Firefight Zone" whiparound of all
    // pro courts incl. Humana Championship Court, 12PM ET Tue 10/13 (RD 64) and
    // Wed 10/14 (RD 32), triple streamed on the PBTV app, PBTV YouTube and the
    // PPA Tour channel. He gave the START only and said "until End of Day", so the
    // 8PM end is this stop's own weekday length, not a time he published.
    //
    // ⚠ "PBTV App", NOT "PBTV": Keaton Maynard, #marketing-general 10/12 —
    // "Matt is streaming to the PBTV (APP only) for Tuesday and Wednesday. TC
    // comes in to do production starting thursday." That overrides Matt's 10/10
    // "triple streamed" note (YouTube too); Bryce asked Matt to confirm, and if
    // YouTube does carry these days, add it here and in lib/tv-schedule.ts.
    // `lib/event-watch.ts` groups "PBTV App" under the PBTV card.
    { round: "RD 64", day: "Tuesday", window: "12PM ET - 8PM ET", platform: "PBTV App", type: "LIVE" },
    { round: "RD 32", day: "Wednesday", window: "12PM ET - 8PM ET", platform: "PBTV App", type: "LIVE" },
    // ⚠ THU/FRI PBTV MOVED TO A 12PM START on Keaton Maynard's 10/9 revision
    // (was 2PM, which is what the 9/21 sheet carries). Tennis Channel did NOT
    // move and still opens at 2PM, so the PBTV window now starts two hours ahead
    // of the simulcast rather than with it. "No changes to Sat & Sun."
    { round: "RD 16", day: "Thursday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    // ⚠ Thursday Tennis Channel is NEW on the 9/21 sheet — four TC days here now.
    { round: "RD 16", day: "Thursday", window: "2PM ET - 5PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "2PM ET - 5PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "12PM ET - 3PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    // ⚠ SUNDAY OPENS AT 8AM ET, TWO HOURS EARLY, BECAUSE OF WEATHER. Keaton
    // Maynard, #marketing-general + #social-media 10/17 11:12PM ET, "Sunday court
    // coverage plan due to weather": 8AM ET and 9AM ET are semifinals on Humana
    // Championship Court AND Grandstand, and the first finals match is 10AM ET on
    // Championship Court only. So Saturday's semifinals did not all finish and the
    // rest of them play Sunday morning ahead of the finals.
    //
    // ⚠ THE 8AM PLATFORM IS INFERRED, NOT PUBLISHED. He gave courts and times,
    // not a network; PBTV has carried CC+GS all week and Tennis Channel only comes
    // in for the finals, so the early sessions ride PBTV and TC is left on its own
    // 10AM open, which is exactly when his first finals match starts. Asked him to
    // confirm in the channel. The END time is unchanged for the same reason the
    // Tue/Wed rows carry one: he published a start, not a finish.
    { round: "Championship", day: "Sunday", window: "8AM ET - 3PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "10AM ET - 2PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
  ],
  "proton-daytona-beach-open": [
    // ⚠ THU/FRI MOVED TO 12–8PM ET (was 2–10) AND SUNDAY TO 12–5PM ET (was
    // 10AM–3PM): Keaton's 10/9 revision, as the 10/10 sheet carries it. Sat unchanged.
    { round: "RD 16", day: "Thursday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "12PM ET - 5PM ET", platform: "PBTV", type: "LIVE" },
  ],
  "veolia-malibu-cup": [
    // ⚠ TUESDAY AND WEDNESDAY COVERAGE IS GONE as of the 9/21 sheet — this stop
    // is now a Thu–Sun broadcast, all four days in the evening. Don't restore
    // the RD 64 / RD 32 rows from an older copy of the schedule.
    // ⚠ THU/FRI MOVED UP (Keaton's 10/9 revision, the 10/10 sheet): PBTV 3–11PM ET
    // (was 5PM–1AM), Tennis Channel 4–11PM ET (was 5–10). Saturday's TC window
    // is now 4–7PM ET on the sheet (was 4–8), a change his note did not mention.
    { round: "RD 16", day: "Thursday", window: "3PM ET - 11PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "4PM ET - 11PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "3PM ET - 11PM ET", platform: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "4PM ET - 11PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "3PM ET - 11PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "4PM ET - 7PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "1PM ET - 6PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "1PM ET - 6PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
  ],
  "pickleball-world-championships": [
    // ⚠ EVERY DAY MOVED TO A 12PM ET START (Keaton Maynard's 10/9 revision, Asana
    // 1219361358300308; the 10/10 sheet). The sheet also moved Sat/Sun, which his
    // note said were unchanged — the sheet is newer and wins. ⚠ THE CELEBRITY
    // PRO-AM MOVED FROM WEDNESDAY TO THURSDAY 8–10PM ET, on PBTV and Tennis Channel.
    // ⚠ Championship Sunday moved 12–6 → 11AM–5PM ET (Keaton, 10/27); 11 ET is
    // the 10:00 AM Farmers Branch first serve Brian gave on 10/14.
    { round: "RD 64", day: "Tuesday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 32", day: "Wednesday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "RD 16", day: "Thursday", window: "12PM ET - 7PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Celebrity Pro-Am", day: "Thursday", window: "8PM ET - 10PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Celebrity Pro-Am", day: "Thursday", window: "8PM ET - 10PM ET", platform: "Tennis Channel", secondary: "PBTV", type: "LIVE" },
    { round: "QF's", day: "Friday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "SF's", day: "Saturday", window: "12PM ET - 8PM ET", platform: "PBTV", type: "LIVE" },
    { round: "Championship", day: "Sunday", window: "11AM ET - 5PM ET", platform: "PBTV", type: "LIVE" },
  ],
};

export function getBroadcast(slug: string): BroadcastSlot[] {
  return eventBroadcasts[slug] ?? [];
}
