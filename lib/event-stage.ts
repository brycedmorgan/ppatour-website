/**
 * Festival-stage programming for a tour stop — the music, interviews,
 * autograph sessions and games running alongside the pro draw.
 *
 * This is NOT the Order of Play (lib/event-schedule.ts). That is competition;
 * this is everything a fan can watch when they are not watching pickleball,
 * and the two answer different questions on purpose.
 *
 * ⚠ OPS ROWS ARE DELIBERATELY NOT HERE. The source grids are working documents
 * for the event team, so they carry load-ins, set-ups, sound checks and clean-
 * ups interleaved with the actual programming. Those tell a fan nothing and
 * make the real schedule harder to read (Wesley, 8/26: "focus on the
 * performances"). What was dropped from the Cary grid: "Artist load in
 * (8a-10am)", "Stage set up for band", "*Set up Canes night*", "Stage Clean
 * Up", the "12:30pm Load in for Longleaf Soul" fragment, and the "(stage clear
 * for house music, sound check, and show prep starting at 4pm)" parenthetical.
 * Keep it that way — if a row describes crew work rather than something a
 * spectator can attend, it does not belong on the site.
 */

/** Drives the chip on each row. Purely presentational grouping. */
export type StageKind =
  | "music"
  | "interview"
  | "autographs"
  | "activity"
  | "wellness"
  | "watch";

export type StageSlot = {
  /** Display time, e.g. "2:00 PM – 4:00 PM" or "6:30 PM". */
  time: string;
  title: string;
  kind: StageKind;
  /** One short line of extra context. Omit rather than pad. */
  detail?: string;
};

export type StageDay = {
  /** "Sep 1" — matches the ProDay format in lib/event-schedule.ts. */
  date: string;
  dow: string;
  /**
   * Real calendar date, "2026-09-01". Exists so the UI can mark the day that
   * is actually happening WITHOUT parsing "Sep 1", which carries no year.
   *
   * ⚠ Compared against a date read off the VISITOR DEVICE, never the server —
   * this page is prerendered and a server in UTC calls Championship Sunday
   * "Monday" from 8pm Pacific (8/19).
   */
  iso: string;
  slots: StageSlot[];
};

export type StageSchedule = {
  /** Section heading name for the stage itself. */
  name: string;
  /** Optional one-line note under the heading. */
  note?: string;
  days: StageDay[];
};

export const KIND_LABEL: Record<StageKind, string> = {
  music: "Live Music",
  interview: "Interview",
  autographs: "Autographs",
  activity: "Fan Zone",
  wellness: "Wellness",
  watch: "Watch Party",
};

/**
 * Cary / Veolia Pickleball National Championships, Aug 31 – Sep 6 2026.
 * Source: the event team's "NC STAGE" grid (Google Sheet, pulled 8/26).
 *
 * ⚠ MONDAY AUG 31 IS ABSENT BECAUSE THE GRID IS EMPTY FOR IT, not because it
 * was trimmed. The stage programming starts Tuesday. An empty day rendered as
 * a heading with nothing under it reads as missing data.
 *
 * ⚠ "Kaitlyn Christian" IS SPELLED FROM OUR ROSTER, NOT THE SHEET. The grid
 * says "Katelyn Christian"; the pro is Kaitlyn Christian and she has a profile
 * on this site. One clear match, edit distance 1, and no "Katelyn Christian"
 * exists anywhere in the roster — so this is a verified correction, not a
 * guess. Every other name on the grid matched the roster exactly.
 *
 * ⚠ CANES NIGHT'S TIME HERE IS THE STAGE GRID'S (5–8 PM) AND THE PRESS RELEASE
 * SAYS THE PRO-AM IS 6–9 PM. Both can be true — the stage sits at Courtside
 * Commons and the Pro-Am is on Humana Championship Court — so the row states
 * the stage's window and points at the published event time rather than
 * silently picking one. If the event team confirms a single time, use it.
 */
const CARY_STAGE: StageSchedule = {
  name: "The NC Stage",
  note: "Live music, interviews, autograph sessions and games running all week beside the courts. Free with event admission.",
  days: [
    {
      date: "Sep 1",
      iso: "2026-09-01",
      dow: "Tue",
      slots: [
        { time: "10:00 AM – 1:30 PM", title: "Pro Watch Party", kind: "watch", detail: "House music on the stage" },
        { time: "2:00 PM – 4:00 PM", title: "Brandon Hawkins", kind: "music" },
        { time: "5:00 PM – 6:00 PM", title: "Pilates Trial Run", kind: "wellness" },
      ],
    },
    {
      date: "Sep 2",
      iso: "2026-09-02",
      dow: "Wed",
      slots: [
        { time: "9:00 AM – 10:00 AM", title: "Pilates", kind: "wellness" },
        { time: "11:00 AM – 11:30 AM", title: "Interview: Leigh Ann Urban", kind: "interview", detail: "Veolia" },
        { time: "12:00 PM – 12:30 PM", title: "Podcast: KOTC with Tyler & Jimmy", kind: "interview" },
        { time: "1:00 PM – 1:30 PM", title: "Pro autographs: Max Freeman", kind: "autographs" },
        { time: "1:30 PM – 2:00 PM", title: "Dirty Sodas", kind: "activity", detail: "Beside the stage until the music starts" },
        { time: "2:00 PM – 4:00 PM", title: "Adam Lee Decker", kind: "music" },
        { time: "4:30 PM – 5:00 PM", title: "Pro autographs: Hannah Blatt", kind: "autographs" },
        { time: "5:00 PM – 6:00 PM", title: "Corn hole competition & yard games", kind: "activity" },
        { time: "6:30 PM", title: "Late-night movie: The Sandlot", kind: "activity", detail: "At sundown, with cotton candy" },
      ],
    },
    {
      date: "Sep 3",
      iso: "2026-09-03",
      dow: "Thu",
      slots: [
        { time: "9:00 AM – 10:00 AM", title: "Pilates", kind: "wellness" },
        { time: "11:00 AM – 11:30 AM", title: "Interview: Roscoe Bellamy", kind: "interview" },
        { time: "12:00 PM – 12:30 PM", title: "Dave Fleming's Daily Chalk Talk", kind: "interview" },
        { time: "1:00 PM – 1:30 PM", title: "Pro autographs: Kaitlyn Christian", kind: "autographs" },
        { time: "1:30 PM – 2:00 PM", title: "Dirty Sodas", kind: "activity", detail: "Beside the stage until the music starts" },
        { time: "2:00 PM – 4:00 PM", title: "Longleaf Soul", kind: "music" },
        { time: "5:00 PM – 8:00 PM", title: "Canes Night", kind: "activity", detail: "The Canes and the Cup Pro-Am runs 6–9 PM on Humana Championship Court" },
      ],
    },
    {
      date: "Sep 4",
      iso: "2026-09-04",
      dow: "Fri",
      slots: [
        { time: "11:00 AM – 11:30 AM", title: "Interview: Brian Clark", kind: "interview", detail: "Ops behind the scenes" },
        { time: "12:00 PM – 12:30 PM", title: "Dave Fleming's Daily Chalk Talk", kind: "interview", detail: "Featuring a meet and greet at Pickleball Central" },
        { time: "1:00 PM – 1:30 PM", title: "Pro autographs: CJ Klinger", kind: "autographs" },
        { time: "1:30 PM – 2:00 PM", title: "Dirty Sodas", kind: "activity", detail: "Beside the stage until the music starts" },
        { time: "2:30 PM – 4:00 PM", title: "Clayton Mullen", kind: "music" },
        { time: "4:30 PM – 5:00 PM", title: "Pro autographs: Armaan Bhatia", kind: "autographs" },
        { time: "5:00 PM – 5:30 PM", title: "Pickle eating contest", kind: "activity" },
        { time: "6:00 PM – 6:30 PM", title: "Pickle volley competition", kind: "activity" },
        { time: "6:30 PM – 8:00 PM", title: "Clayton Mullen", kind: "music" },
      ],
    },
    {
      date: "Sep 5",
      iso: "2026-09-05",
      dow: "Sat",
      slots: [
        { time: "9:00 AM – 10:00 AM", title: "Pilates", kind: "wellness" },
        { time: "11:00 AM – 11:30 AM", title: "Interview: Loren Gold", kind: "interview", detail: "GRSA" },
        { time: "12:00 PM – 12:30 PM", title: "Dave Fleming's Daily Chalk Talk", kind: "interview" },
        { time: "1:00 PM – 1:30 PM", title: "Pro autographs: Mari Humberg", kind: "autographs" },
        { time: "1:30 PM – 2:00 PM", title: "Dirty Sodas", kind: "activity", detail: "Beside the stage until the music starts" },
        { time: "2:00 PM – 5:00 PM", title: "Bandemic", kind: "music" },
        { time: "5:00 PM – 5:30 PM", title: "Pickleball trivia", kind: "activity" },
        { time: "5:30 PM", title: "College Football Night", kind: "watch" },
      ],
    },
    {
      date: "Sep 6",
      iso: "2026-09-06",
      dow: "Sun",
      slots: [
        { time: "10:00 AM – 5:00 PM", title: "Championship Sunday on the big screen", kind: "watch", detail: "Live pro matches all day" },
      ],
    },
  ],
};

const STAGE_BY_SLUG: Record<string, StageSchedule> = {
  "veolia-pickleball-national-championships": CARY_STAGE,
};

/**
 * The stage schedule for a stop, or null. Null is the normal case — most stops
 * have no stage grid, and the section simply does not render.
 */
export function stageScheduleFor(slug: string): StageSchedule | null {
  return STAGE_BY_SLUG[slug] ?? null;
}
