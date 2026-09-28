/**
 * WHICH ROUND EACH DAY OF A STOP IS SCHEDULED TO PLAY — the Order of Play
 * table's own labels, in one place.
 *
 * ⚠ THIS EXISTS SO THE SCORES BOARD AND THE PRINTED ORDER OF PLAY CANNOT
 * DISAGREE. The board opens on the round the schedule says is being played
 * today (Wesley, 9/20: "show the specific round based off the order of play
 * info for that tournament"), and the schedule is rendered by `buildSchedule`
 * — of which there are two copies, in `app/events/[year]/[slug]/page.tsx` and
 * `components/events/NationalsLive.tsx`, which the repo has watched drift more
 * than once. Both now take their LABELS from here, so a third transcription of
 * the ladder cannot appear underneath the board and send it to the wrong round.
 *
 * Gates, first serve and channels stay in `buildSchedule` — only the round
 * naming is shared.
 */
import { firstServeFor, getEventSchedule } from "@/lib/event-schedule";

/** The pro ladder, counted back from the final. Index = days from the end. */
export const PRO_ROUNDS = [
  "Championship Sunday — Finals", // fromEnd 0
  "Pro semifinals", //               fromEnd 1
  "Pro quarterfinals", //            fromEnd 2
  "Pro round of 16", //              fromEnd 3
  "Pro round of 32", //              fromEnd 4
  "Pro round of 64", //              fromEnd 5
];

/**
 * The templated label for one day, by its index from the start and from the
 * end. Extracted verbatim from `buildSchedule`; every path assigns, so there is
 * no default to fall through to.
 */
export function proDayLabel(i: number, fromEnd: number): string {
  if (i === 0) return "Amateur & junior brackets";
  if (i === 1) return "Senior Open + pro qualifying";
  if (fromEnd === 0) return PRO_ROUNDS[0];
  if (fromEnd <= 5) return PRO_ROUNDS[fromEnd];
  // Longer lead-in than a 64-draw ladder — earliest pro rounds still play.
  return PRO_ROUNDS[5];
}

/**
 * Every day of a stop as `{ iso, label }`, oldest first.
 *
 * ⚠ THE DATE MATH IS buildSchedule's, CHARACTER FOR CHARACTER, because the
 * `iso` it produces is the key the scores board looks today's round up by. A
 * cursor that stepped differently here would miss by a day and the board would
 * quietly open on yesterday's round.
 */
export function proDayLabels(startIso: string, endIso: string): { iso: string; label: string }[] {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const out: { iso: string; label: string }[] = [];
  const cursor = new Date(start);
  const last = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  let i = 0;
  while (cursor <= end) {
    out.push({ iso: cursor.toISOString().slice(0, 10), label: proDayLabel(i, last - i) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    i++;
  }
  return out;
}

/**
 * ISO date → the round the order of play has that stop playing that day.
 *
 * Prefers the event team's own transcribed schedule (`eventSchedules`) over the
 * template, which is the whole point: a stop that published a real order of
 * play should drive the board with it.
 *
 * ⚠ THE REAL SCHEDULE IS PAIRED BY POSITION AND ONLY WHEN THE COUNTS AGREE.
 * `ProDay` carries "Sep 6", not an ISO date, so the only join available is
 * index against the event's own date range. If a hand-written entry ever holds
 * a different number of days than the event's start/end span, pairing them
 * would shift every label by one — so that case falls back to the template
 * rather than publishing a confident wrong answer.
 */
export function orderOfPlayByDay(
  slug: string,
  startIso: string,
  endIso: string,
): Record<string, string> {
  const days = proDayLabels(startIso, endIso);
  const real = getEventSchedule(slug);
  const useReal = real && real.proDays.length === days.length;
  const out: Record<string, string> = {};
  days.forEach((d, i) => {
    out[d.iso] = useReal ? real.proDays[i].label : d.label;
  });
  return out;
}

/** One day of a stop as the live-status copy needs it. */
export type PlayDay = {
  /** "2026-09-29" — the venue's calendar date. */
  iso: string;
  /** "Tue" */
  dow: string;
  /** The order-of-play label, e.g. "Pro quarterfinals". */
  label: string;
  /** "2:00 PM", or "TBD" where the event team has not published one. */
  firstServe: string;
};

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Every day of a stop with its round and first serve, for the live-status copy
 * (components/live/LiveEventStatus).
 *
 * ⚠ THE TIMES ARE buildSchedule's, NOT A THIRD COPY OF THEM. Same template
 * (9:00 AM on the two lead-in days, 11:00 AM on the final, 10:00 AM between),
 * same per-stop override (`firstServeFor`), and the event team's transcribed
 * schedule where one exists and its day count matches — the same pairing rule
 * `orderOfPlayByDay` uses. If the template in buildSchedule changes, change it
 * here too; the hero saying "First serve 10:00 AM" over a table reading 2:00 PM
 * is exactly the disagreement this module exists to stop.
 *
 * Plain data, no clock: the caller decides which day is today, on the device.
 */
export function playDays(slug: string, startIso: string, endIso: string): PlayDay[] {
  const days = proDayLabels(startIso, endIso);
  const real = getEventSchedule(slug);
  const useReal = real && real.proDays.length === days.length;
  const last = days.length - 1;
  return days.map((d, i) => {
    const fromEnd = last - i;
    let templated = "10:00 AM";
    if (i === 0 || i === 1) templated = "9:00 AM";
    else if (fromEnd === 0) templated = "11:00 AM";
    const dow = DOW[new Date(`${d.iso}T00:00:00Z`).getUTCDay()];
    return useReal
      ? { iso: d.iso, dow, label: real.proDays[i].label, firstServe: real.proDays[i].firstServe }
      : { iso: d.iso, dow, label: d.label, firstServe: firstServeFor(slug, d.iso, templated) };
  });
}
