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
 * ⚠ THIS SETS THE GATE AND NOTHING ELSE. First serve is a separate fact and
 * lives in FIRST_SERVE_BY_SLUG below — order of play and gates are two different
 * things (Wesley, 8/27), and neither is derived from the other. A day with a
 * supplied gate and no supplied first serve therefore still shows the TEMPLATED
 * first serve, and can read a gate later than it; that is the placeholder, not a
 * wrong gate. Replace the whole stop with a real `eventSchedules` entry the
 * moment the event team publishes a full order of play, and delete its lines
 * from both maps.
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

/**
 * Per-event, per-DAY FIRST SERVE overrides, for the same templated stops
 * GATES_BY_SLUG serves. Keyed by slug, then by the day's ISO date.
 *
 * The template's first serve is a house default (9:00 AM on the two lead-in
 * days, 10:00 AM through the week, 11:00 AM on Championship Sunday). It is a
 * placeholder, and this map is the only way a real time reaches the page short
 * of a full `eventSchedules` entry — which needs a time for EVERY day, and so
 * would mean inventing the ones nobody has sent.
 *
 * ⚠ ONE DAY PER LINE, EACH FROM THE EVENT TEAM. A stop playing in the evening
 * today did not necessarily do so on Tuesday, so a time supplied for one day
 * says nothing about any other. A day with no line keeps the template.
 *
 * ⚠ THE KEY IS THE DAY'S ISO DATE, DERIVED FROM THE EVENT'S OWN START DATE. If
 * a stop's dates ever move, a line here stops matching and that day silently
 * falls back to the template — re-check this map whenever a date changes.
 */
const FIRST_SERVE_BY_SLUG: Record<string, Record<string, string>> = {
  /**
   * Veolia Arizona Open — Sep 14–20, Arizona Athletic Grounds, Mesa.
   * Parker Roberts and Tyler Petersen, 9/19, mid-tournament: first serve is
   * 2:00 PM Saturday and Sunday. Consistent with the noon gates and with the
   * 9/10 broadcast sheet's evening windows (PBTV opens 5PM ET = 2PM local —
   * Arizona keeps no DST, so ET is local + 3 in September).
   *
   * ⚠ Sep 14–18 are deliberately absent. Nobody sent times for them, they have
   * been played, and a plausible 2:00 PM written across the whole week would be
   * an invention wearing a correction's clothes.
   */
  "veolia-arizona-open": {
    "2026-09-19": "2:00 PM",
    "2026-09-20": "2:00 PM",
  },

  /**
   * Rate Las Vegas Open — Sep 28 – Oct 4, Red Rock Casino Resort, Las Vegas.
   * The event team's official per-day start times, sent 9/20. A flat "first
   * serve at 2pm" came first; these superseded it the same afternoon, and three
   * of the seven days are NOT 2pm — so this is the transcription, day by day.
   *
   * ⚠ EVERY DAY THE BROADCAST SHEET COVERS AGREES WITH THIS, WHICH IS WHY THE
   * ODD-LOOKING DAYS ARE THE RIGHT ONES. Nevada is Pacific, so ET is local + 3
   * in October, and the live 9/10 sheet reads: Thu 5PM ET and Fri 5PM ET (= 2PM
   * local), Sat 4PM ET (= 1PM), Sun PBTV 1PM ET and Tennis Channel 1PM–5PM ET
   * (= 10AM–4PM). Saturday's 1pm and Sunday's 10am land exactly on those, and
   * Championship Sunday now finishes inside its Tennis Channel window instead of
   * starting as it closed — which is what the flat 2pm reading would have done.
   * Two independent sources, same answer, so these are about as well supported
   * as a first-serve time on this site gets.
   *
   * ⚠ MONDAY IS 8AM AND THAT IS NOT A TYPO — it is the amateur and junior
   * bracket day, which starts in the morning and has nothing to do with the
   * evening pro sessions that follow it.
   *
   * ⚠ GATES ARE DELIBERATELY LEFT ON THE TEMPLATE (Wesley, 9/20). Nobody has
   * sent one, so the table reads a templated 8/9/10 AM gate against these — five
   * hours early mid-week, and EQUAL to first serve on Mon and Sun, where the
   * template happens to land on the same number. That is the placeholder gate,
   * not a supplied one, and `gatesFollowFirstServe` stops the page claiming the
   * gate is an hour before first serve. Add a GATES_BY_SLUG line the moment a
   * real gate time arrives; this is the stop most in need of one.
   */
  "rate-las-vegas-open": {
    "2026-09-28": "8:00 AM", // Mon — amateur & junior brackets
    "2026-09-29": "2:00 PM", // Tue
    "2026-09-30": "2:00 PM", // Wed
    "2026-10-01": "2:00 PM", // Thu
    "2026-10-02": "2:00 PM", // Fri
    "2026-10-03": "1:00 PM", // Sat
    "2026-10-04": "10:00 AM", // Sun — Championship Sunday
  },
};

/**
 * First serve for a templated day at this stop: the event team's own when they
 * have sent one for that date, otherwise whatever the template worked out.
 * Both copies of `buildSchedule` read this, so the order-of-play table, the
 * `-live` route and the concierge cannot disagree about it.
 */
export function firstServeFor(slug: string, iso: string, templated: string): string {
  return FIRST_SERVE_BY_SLUG[slug]?.[iso] ?? templated;
}

/** Did the event team set this specific day's first serve? */
export function hasFirstServeOverride(slug: string, iso: string): boolean {
  return FIRST_SERVE_BY_SLUG[slug]?.[iso] !== undefined;
}

/**
 * May a surface say "gates open about an hour before first serve" at this stop?
 *
 * Only where BOTH times are still the template's, because that is the only case
 * in which the relationship is real — the template derives the gate an hour
 * before its own first serve. A supplied gate has no derivable relationship to
 * first serve, and a supplied FIRST SERVE breaks it just as thoroughly from the
 * other side: Las Vegas keeps the templated 9:00 AM gate, so a 2:00 PM first
 * serve would leave the page claiming an hour where the table beside it shows
 * five.
 */
export function gatesFollowFirstServe(slug: string): boolean {
  return !(slug in GATES_BY_SLUG) && !(slug in FIRST_SERVE_BY_SLUG);
}

/**
 * A sentence naming the days whose first serve the event team has actually
 * given us, for the concierge — which answers "what time is first serve?" and
 * would otherwise reply with the gate time alone while the table on the same
 * page carries the real one.
 *
 * Built from the rendered rows rather than from the map, so the chat bubble
 * cannot name a day or a time the order of play does not. Null when the stop
 * has no supplied times — i.e. every other event on the template.
 */
export function firstServeNote(
  slug: string,
  days: { iso: string; date: string; firstServe: string }[],
): string | null {
  const set = days.filter((d) => hasFirstServeOverride(slug, d.iso));
  if (set.length === 0) return null;
  const dates = set.map((d) => d.date);
  const list =
    dates.length === 1
      ? dates[0]
      : `${dates.slice(0, -1).join(", ")} and ${dates[dates.length - 1]}`;
  // One time across every supplied day reads as one fact; otherwise name each.
  const times = new Set(set.map((d) => d.firstServe));
  if (times.size === 1) return `First serve is ${set[0].firstServe} on ${list}.`;
  return `First serve is ${set.map((d) => `${d.firstServe} on ${d.date}`).join(", ")}.`;
}
