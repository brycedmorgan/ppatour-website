/**
 * When the scores board shows the Pro Qualifier instead of the Pro Main Draw.
 *
 * Pure, and deliberately not inside ScoresBoard: the rule below is the whole
 * behaviour Wesley asked for on 8/31, it has three edge cases that are easy to
 * get subtly wrong, and none of them are testable from inside a component that
 * needs a browser and a live feed.
 */
import type { ScoresResult } from "@/lib/scores-api";

/** yyyy-mm-dd in the DEVICE's timezone — the same day the ticker badge shows. */
export function localDayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The sentinel a confirmed-but-undated fixture carries — see lib/scores-api. */
const UPCOMING_KEY = "9999-12-31";

/**
 * Show the qualifier board?
 *
 * ⚠ THE SWITCH IS THE CALENDAR DAY, NOT FIRST SERVE (Wesley, 8/31: "switch the
 * scores when the score ticker changes to the next day"). That is why this is
 * decided in the browser and not on the server: `/api/scores` is CDN-cached and
 * shared by viewers in every timezone, and the ticker's day badge is plain
 * `new Date()` in the browser. A server-side answer would roll over at the
 * origin's midnight for everybody at once, and could leave this board and the
 * ticker directly above it disagreeing about what day it is.
 *
 * ⚠ QUALIFYING DAY IS THE FIRST DAY QUALIFYING IS PLAYED, AND FIRST RATHER THAN
 * LAST IS THE POINT. `dateKey` buckets a match by its UTC date, so a qualifier
 * finishing after 8pm in Mesa lands on TOMORROW's key — and keying off the last
 * day would then hold the qualifier board up through the whole of the next day,
 * which is exactly what this is supposed to prevent. The first day cannot drift
 * like that.
 *
 * ⚠ A SCHEDULED DAY COUNTS AS WELL AS A PLAYED ONE, and that is what makes the
 * board right on qualifying MORNING. Read from played matches alone this
 * returned false until the first ball was struck: at 07:56 MST on 9/14 the
 * Arizona Open had 43 qualifier fixtures with published start times, all that
 * day, nothing played anywhere, and the board showed the main draw's 72 undated
 * fixtures instead. Taking the MIN across both is what keeps the rest honest —
 * once qualifying has been played, a leftover fixture rescheduled into tomorrow
 * cannot push the switch back, because the played day is earlier and wins.
 *
 * ⚠ THE UPCOMING SENTINEL IS EXCLUDED EXPLICITLY. A confirmed-but-undated
 * fixture carries "9999-12-31"; left in, a bracket where every fixture is
 * undated would give a first day of 9999 and pin this true forever.
 *
 * ⚠ THE MAIN DRAW STARTING ALSO ENDS IT, whatever the date says. Once pro
 * matches are under way they are the story, and this is the backstop if the
 * date reasoning above ever fails.
 */
export function showQualifierBoard(data: ScoresResult | null, todayKey: string | null): boolean {
  const q = data?.qualifier;
  if (!q || !q.matches.length || !todayKey) return false;
  // The main draw is under way — it wins.
  if ((data?.matches ?? []).some((m) => m.status === "live" || m.status === "final")) return false;
  let firstQualifyingDay: string | undefined;
  for (const m of q.matches) {
    const counts =
      m.status === "live" || m.status === "final" || m.dateKey !== UPCOMING_KEY;
    if (!counts) continue;
    if (firstQualifyingDay === undefined || m.dateKey < firstQualifyingDay) firstQualifyingDay = m.dateKey;
  }
  return firstQualifyingDay !== undefined && firstQualifyingDay !== UPCOMING_KEY && todayKey <= firstQualifyingDay;
}
