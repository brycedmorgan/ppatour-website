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
        date: "Sep 4", dow: "Fri", label: "Quarterfinals", firstServe: "10:00 AM", gates: "9:00 AM", live: "Tennis Channel · PBTV",
        amateur: [
          { label: "Amateur skill & age brackets" },
          { label: "Junior PPA — Singles", detail: "Showcase Court 1" },
        ],
      },
      {
        date: "Sep 5", dow: "Sat", label: "Semifinals", firstServe: "9:00 AM", gates: "8:00 AM", live: "Tennis Channel · PBTV",
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

/**
 * Per-event GATE TIME overrides for stops that have no full order-of-play
 * entry above and therefore fall back to the templated schedule in
 * `app/events/[year]/[slug]/page.tsx` (and its twin in NationalsLive).
 *
 * The template's gate times are a house default (8:00 AM on the two lead-in
 * days, 9:00 AM through the week, 10:00 AM on Championship Sunday). They are a
 * reasonable stand-in for a daytime stop and simply wrong for one that plays in
 * the evening, and a gate time is the single fact on this page that decides
 * when a family physically arrives.
 *
 * ⚠ THIS SETS THE GATE AND NOTHING ELSE. First serve stays on the template
 * (Wesley, 9/18) — order of play and gates are separate facts here, and we hold
 * no transcribed first-serve times for these stops. So a day can read a gate
 * later than its first serve: that is the templated first serve being a
 * placeholder, not the gate being wrong. Replace the whole stop with a real
 * `eventSchedules` entry the moment the event team publishes its order of play,
 * and delete its line here.
 *
 * ⚠ Never write a plausible time. One entry per stop, from the event team.
 */
const GATES_BY_SLUG: Record<string, string> = {
  /**
   * Veolia Arizona Open — Sep 14–20, Arizona Athletic Grounds, Mesa.
   * Gates open at noon every day (Wesley, 9/18, mid-tournament). Consistent
   * with the wholesale evening reschedule on the 9/10 broadcast sheet: PBTV
   * opens 5PM ET on all four broadcast days, which is 2PM local — Arizona does
   * not observe DST, so ET is local + 3 in September.
   */
  "veolia-arizona-open": "12:00 PM",
};

/**
 * The gate time for a templated day at this stop: the event team's own if we
 * have it, otherwise whatever the template worked out. Both copies of
 * `buildSchedule` read this, so the event page, the `-live` route, the Know
 * Before You Go line and the concierge cannot disagree about it.
 */
export function gatesFor(slug: string, templated: string): string {
  return GATES_BY_SLUG[slug] ?? templated;
}

/**
 * Has the event team set this stop's gate time itself? True means the gate is
 * a supplied fact with no derivable relationship to first serve — so no surface
 * may describe it as "an hour before first serve".
 */
export function hasGatesOverride(slug: string): boolean {
  return slug in GATES_BY_SLUG;
}
