/**
 * Per-event order-of-play overrides — real schedules transcribed from the
 * event's registration page (pickleballtournaments.com) + the broadcast
 * sheet. Events without an entry fall back to the templated schedule.
 * Amateur day-by-day division assignments publish after each event's
 * registration deadline; sync from Wesley's PT.com API when it lands.
 */

export type AmateurSession = {
  label: string;
  detail?: string;
};

export type ProDay = {
  date: string; // "Aug 31"
  dow: string;
  label: string;
  /**
   * When play starts and when the gates open.
   *
   * ⚠ THESE ARE NOT BROADCAST TIMES AND ARE NOT DERIVED FROM THEM — Wesley,
   * 8/27: "have broadcast and order of play separate, they are two different
   * things. Sometimes the broadcast times will not match the order of play
   * times." A window in `lib/broadcast.ts` that starts before or after first
   * serve is normal, not a discrepancy to fix. Nationals Thursday is the live
   * example: PBTV opens 9AM against a 10AM first serve.
   *
   * So do NOT shift these to match a broadcast sheet, and do not add a check
   * that asserts they agree. `gates` in particular tells a family when to
   * physically arrive; it changes when the event team says so, and on nothing
   * else.
   */
  firstServe: string;
  gates: string;
  /** Channel(s) carrying the day. The WINDOWS live in lib/broadcast.ts. */
  live?: string;
  /**
   * Amateur / junior / senior sessions running THIS day — rendered in the
   * Amateur & Junior Play column beside Pro Play (Bryce, 7/31: one calendar
   * block, everything on the day it actually happens).
   */
  amateur?: AmateurSession[];
};

/**
 * Sessions we know are in the event but whose day the tournament has not
 * published yet. These are the only rows that still sit outside the day grid —
 * move each one onto its ProDay the moment the real date is known.
 */
export type AmateurItem = {
  when: string;
  label: string;
  detail?: string;
};

export type EventSchedule = {
  proDays: ProDay[];
  amateur: AmateurItem[];
  amateurNote: string;
};

export const eventSchedules: Record<string, EventSchedule> = {
  // Source: pickleballtournaments.com/tournaments/
  // ppa-tour-veolia-ppa-national-championships (Pro Schedule block) +
  // PPA/MLP broadcast sheet windows. Pulled 7/16/26.
  "veolia-pickleball-national-championships": {
    proDays: [
      {
        date: "Aug 31", dow: "Mon", label: "Pro Qualifying — all pro events", firstServe: "TBD", gates: "8:00 AM",
        amateur: [
          { label: "Amateur skill & age brackets", detail: "Start times vary by division" },
          { label: "PPA Tour Camp (3.0/4.0)", detail: "4:00–7:00 PM · day 1 of 2" },
        ],
      },
      {
        date: "Sep 1", dow: "Tue", label: "Main Draw — Round of 64", firstServe: "10:00 AM", gates: "9:00 AM", live: "PBTV",
        amateur: [
          { label: "Amateur skill & age brackets" },
          { label: "PPA Tour Camp (3.0/4.0)", detail: "4:00–7:00 PM · day 2 of 2" },
        ],
      },
      {
        date: "Sep 2", dow: "Wed", label: "Main Draw — Round of 32", firstServe: "10:00 AM", gates: "9:00 AM", live: "PBTV",
        amateur: [{ label: "Amateur skill & age brackets" }],
      },
      {
        date: "Sep 3", dow: "Thu", label: "Main Draw — Round of 16", firstServe: "10:00 AM", gates: "9:00 AM", live: "PBTV",
        amateur: [{ label: "Amateur skill & age brackets" }],
      },
      {
        date: "Sep 4", dow: "Fri", label: "Quarterfinals", firstServe: "10:00 AM", gates: "9:00 AM", live: "PBTV",
        amateur: [
          { label: "Amateur skill & age brackets" },
          { label: "Junior PPA — Singles", detail: "Showcase Court 1" },
        ],
      },
      {
        date: "Sep 5", dow: "Sat", label: "Semifinals", firstServe: "9:00 AM", gates: "8:00 AM", live: "PBTV",
        amateur: [
          { label: "Amateur skill & age brackets" },
          { label: "Junior PPA — Doubles", detail: "Carvana Grandstand Court" },
        ],
      },
      {
        date: "Sep 6", dow: "Sun", label: "Championship Sunday — Gold & Bronze", firstServe: "10:00 AM", gates: "9:00 AM", live: "Tennis Channel · PBTV",
        amateur: [
          { label: "Amateur skill & age brackets", detail: "Medal matches" },
          { label: "Junior PPA — Mixed Doubles", detail: "Carvana Grandstand Court" },
        ],
      },
    ],
    // ⚠ ONLY the sessions whose day the tournament has not published. The
    // amateur bracket week and the camp moved onto their real days above.
    //
    // ⚠ JUNIOR PPA CAME OFF THIS LIST ON 8/27 — it had sat here since 7/16.
    // The PBTV broadcast note dates it: Singles Friday on SC1, Doubles Saturday
    // and Mixed Sunday on the Carvana Grandstand. It is now on those three days
    // above. Senior Open and MoneyBall are still genuinely undated; move each
    // up the moment its day lands, and delete this block when the last one goes.
    amateur: [
      {
        when: "Day TBA",
        label: "Senior Open",
        detail: "Selections confirmed by email after the Aug 24 registration deadline.",
      },
      {
        when: "Day TBA",
        label: "MoneyBall",
        detail: "Open double-elimination side draw — limited to 16 teams.",
      },
    ],
    amateurNote:
      "Per-division day and time assignments publish after registration closes (Aug 24) — check your bracket on pickleballtournaments.com.",
  },
};

export function getEventSchedule(slug: string): EventSchedule | undefined {
  return eventSchedules[slug];
}
