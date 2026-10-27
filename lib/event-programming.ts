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
   * Opendoor Pickleball World Championships, Nov 2–8, 2026. Source: the events
   * team's "Worlds Programming 2026" Google Sheet, re-read by Bryce 10/27 (the
   * 9/28 pull was wrong on five of six days). worlds.unitedpickleball.com/schedule
   * reads the same sheet live (lib/week-schedule.ts in the
   * pickleball-world-championship-new repo).
   *
   * ⚠ TIMES COME FROM EACH CELL'S OWN LABEL, NOT THE ROWS IT IS MERGED ACROSS.
   * The merges run wider than the stated time, so a re-pull that reads the row
   * span gets the times wrong.
   *
   * ⚠ THIS COPY IS A SNAPSHOT; nothing refreshes it. Off the sheet since 9/28,
   * so gone: Drink Dink & Disco, Battle of the Badges, Battle of the Branches,
   * Wooden Paddle Tourney, Rowdy Round Robin. The Celebrity Pro-Am is Thursday
   * (Keaton, 10/27 8:36; the sheet's Wednesday hold is stale): 7–9 PM venue
   * time is the 8–10 PM ET broadcast. Sunday has nothing on the sheet, so it has
   * no day here. Live-music slots are left out (nothing anyone can join).
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
          s("Game Maker Oldies but Goodies 50+", "2:30–4:30 PM"),
          s("Catherine Parenteau Clinic", "5:00–7:00 PM"),
        ],
      },
      {
        iso: "2026-11-03",
        sessions: [
          s("PPA Camp", "9:00 AM–12:00 PM"),
          s("Veterans Play with the Pro", "2:30–3:30 PM"),
          s("Challenge the Pro", "5:30–7:00 PM"),
        ],
      },
      {
        iso: "2026-11-04",
        sessions: [
          s("PPA Camp", "9:00 AM–12:00 PM"),
          s("Play with the Pro", "12:00–1:00 PM", "3.0–3.5"),
          s("Meet the Pro", "2:30–3:30 PM"),
          s("Play with the Pro", "4:00–5:00 PM", "4.0–4.5+"),
          // Start only: the sheet gives no end time.
          s("Junior PPA Youth Clinic", "5:00 PM"),
        ],
      },
      {
        iso: "2026-11-05",
        sessions: [
          s("Pickle Cup Pong", "10:00–11:30 AM"),
          s("King of the Court PICKL", "12:00–1:30 PM", "3.0–3.5"),
          s("King of the Court PICKL", "2:00–3:30 PM", "4.0–4.5"),
          s("JOOLA Queen's Court / DJ", "4:00–6:00 PM", "4.0–4.5"),
          s("Connor Garnett Skills Lab", "6:00–8:00 PM"),
          s("Celebrity Pro-Am", "7:00–9:00 PM"),
        ],
      },
      {
        iso: "2026-11-06",
        sessions: [
          s("King of the Court", "11:00 AM–12:30 PM", "3.0–3.5"),
          s("King of the Court", "12:30–2:30 PM", "4.0–4.5"),
          s("Special Olympics", "2:30–4:30 PM"),
          s("Holbrook After Party", "6:00–8:00 PM"),
        ],
      },
      {
        iso: "2026-11-07",
        sessions: [
          s("Kids Intro to Pickleball Class", "11:00–11:30 AM"),
          s("Meet the Pro", "12:00–12:30 PM"),
          s("Play with the Pro", "1:30–2:30 PM", "3.0"),
          s("King of the Court", "4:00–5:30 PM", "4.0+"),
          s("Parent and Child Mini Tourney", "6:00–8:00 PM"),
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
