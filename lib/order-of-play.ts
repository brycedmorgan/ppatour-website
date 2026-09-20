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
import { getEventSchedule } from "@/lib/event-schedule";

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
