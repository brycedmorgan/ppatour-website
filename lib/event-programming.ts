/**
 * Daily fan programming at a stop — clinics, King of the Court, round robins,
 * Meet the Pro — rendered in its OWN section on the event page, not in the
 * Order of Play (Wesley, 9/28: "Dont put it as part of the order of play. it
 * should be in it's own section."). The order of play is the tournament; this
 * is what a ticket holder or a local player can join around it.
 *
 * Worlds is the only stop with any today.
 */

export type ProgrammingSession = {
  title: string;
  /** "10:00 AM–12:00 PM", venue time. */
  time: string;
  /** Player rating the session is for, e.g. "3.0–3.5". */
  level?: string;
};

export type ProgrammingDay = {
  /** ISO date, venue calendar. */
  iso: string;
  sessions: ProgrammingSession[];
};

export type EventProgramming = {
  /**
   * The edition this belongs to, as the event's ISO start date. ⚠ Required for
   * the same reason as `EventSchedule.start`: annual editions share a slug, and
   * without it this November's programming would print on last year's page.
   */
  start: string;
  days: ProgrammingDay[];
  /** Where the schedule lives, for a "full schedule" link. */
  sourceUrl: string;
};

const s = (title: string, time: string, level?: string): ProgrammingSession =>
  level ? { title, time, level } : { title, time };

const PROGRAMMING_BY_SLUG: Record<string, EventProgramming> = {
  /**
   * Opendoor Pickleball World Championships, Nov 2–8, 2026. Source:
   * worlds.unitedpickleball.com/schedule, pulled 9/28/26. That page reads it
   * live from the events team's "Worlds Programming 2026" Google Sheet (see
   * lib/week-schedule.ts in the pickleball-world-championship-new repo).
   *
   * ⚠ THIS COPY IS A SNAPSHOT. The events team edits the sheet and the Worlds
   * site follows within five minutes; nothing refreshes this. Re-pull it before
   * the week. Live-music slots are left out, because they aren't programming
   * anyone can join.
   */
  "pickleball-world-championships": {
    start: "2026-11-02",
    sourceUrl: "https://worlds.unitedpickleball.com/schedule",
    days: [
      {
        iso: "2026-11-02",
        sessions: [
          s("King of the Court", "10:00 AM–12:00 PM", "3.0–3.5"),
          s("King of the Court / Challenge Court", "12:00–2:00 PM", "4.0–4.5"),
          s("Oldies but Goodies 60+", "2:30–4:30 PM"),
          s("Drink, Dink & Disco", "6:00–8:30 PM", "3.5+"),
        ],
      },
      {
        iso: "2026-11-03",
        sessions: [
          s("PPA Camp", "8:30–11:00 AM"),
          s("Special Olympics", "12:30–1:30 PM"),
          s("Battle of the Badges (Police vs Fire)", "2:30–4:30 PM"),
          s("Battle of the Branches (Military Round Robin)", "5:00–7:00 PM"),
        ],
      },
      {
        iso: "2026-11-04",
        sessions: [
          s("PPA Camp", "8:30–11:00 AM"),
          s("Play with the Pro", "12:00–1:00 PM", "3.0–3.5"),
          s("Meet the Pro", "2:30–3:30 PM"),
          s("Play with the Pro", "4:00–5:00 PM", "4.0–4.5+"),
        ],
      },
      {
        iso: "2026-11-05",
        sessions: [
          s("Pickle Cup Pong", "10:00–11:30 AM"),
          s("King of the Court", "2:00–3:30 PM", "3.0–3.5"),
          s("King of the Court", "3:30–5:00 PM", "4.0–4.5"),
          s("Queen's Court / DJ", "6:00–8:00 PM", "4.0–4.5"),
        ],
      },
      {
        iso: "2026-11-06",
        sessions: [
          s("King of the Court", "11:00 AM–12:00 PM", "3.0–3.5"),
          s("King of the Court", "12:00–2:30 PM", "4.0–4.5"),
          s("Wooden Paddle Tourney", "2:30–4:30 PM"),
          s("Rowdy Round Robin (Cowboy Themed)", "6:00–8:00 PM", "3.5"),
        ],
      },
      {
        iso: "2026-11-07",
        sessions: [
          s("Kids Intro to Pickleball Class", "11:00–11:30 AM"),
          s("Meet the Pro", "12:00–12:30 PM"),
          s("Play with the Pro", "1:30–2:30 PM", "3.0"),
          s("King of the Court", "4:00–5:30 PM", "4.0+"),
          s("Parent and Child Round Robin", "6:00–8:00 PM"),
        ],
      },
    ],
  },
};

/** This edition's programming, or undefined. See `EventProgramming.start`. */
export function programmingFor(slug: string, startIso: string): EventProgramming | undefined {
  const p = PROGRAMMING_BY_SLUG[slug];
  return p && p.start === startIso ? p : undefined;
}
