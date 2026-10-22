/**
 * WHAT IS ACTUALLY HAPPENING AT A TOUR STOP RIGHT NOW — the words the live
 * surfaces print while an event is being played.
 *
 * Wesley, 9/28 (Asana "Verbiage Update for Live Events"): the site goes live off
 * the event's DATES, so the hero read "LIVE NOW · Matches in progress" for the
 * whole tournament — overnight, before first serve, between sessions. The dates
 * still decide that it is tournament week; this decides what to SAY about it,
 * from the live score feed and the event's order of play.
 *
 * ⚠ "IN PROGRESS" IS ONLY EVER SAID WHEN THE FEED HAS A MATCH WITH STATUS
 * `live`. Every other state is worded so it stays true whatever is on court:
 * a first-serve time, "up next", "play resumes". And when we cannot read the
 * feed at all, the copy falls back to the day's round from the order of play,
 * which is true whether or not a ball is being struck.
 *
 * Pure: no fetch, no clock of its own. The caller passes the ticker rows and
 * `todayIso` (the DEVICE's calendar date — the same call the scores board and
 * the Today screen make, so a phone at the venue is on the venue's day).
 */
import type { TickerMatch } from "@/lib/ticker-api";
import type { PlayDay } from "@/lib/order-of-play";

export type LiveStatusKind =
  /** A match is on court right now. The only state that may say "live". */
  | "live"
  /** Today is a play day and nothing has been played yet. */
  | "before-first-serve"
  /** Play has happened today and more is scheduled. */
  | "between"
  /** Today's play is done and there is another day to come. */
  | "done-today"
  /** The last scheduled day's play is done. */
  | "done"
  /** We could not read the feed; the copy names the day's round instead. */
  | "unknown";

export type LiveStatus = {
  kind: LiveStatusKind;
  /** The short line — "Matches in progress", "First serve 2:00 PM", … */
  label: string;
  /** Badge text: "Live Now" only while a match is live. */
  badge: string;
  /** Is a match live — i.e. may a surface say "Live" / "Watch Live"? */
  matchLive: boolean;
};

/** "2026-09-29" for the device's local calendar day. */
export function deviceTodayIso(now: number = Date.now()): string {
  const d = new Date(now);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** The feed's planned start is venue wall-clock with a fake "Z"; read the date as written. */
function venueDate(m: TickerMatch): string | undefined {
  return m.plannedStart?.slice(0, 10) || undefined;
}

/** UTC offsets (hours) for the zone abbreviations the feed prints on US stops. */
const TZ_OFFSET: Record<string, number> = {
  EDT: -4, EST: -5, CDT: -5, CST: -6, MDT: -6, MST: -7, PDT: -7, PST: -8,
};

/**
 * Has this match's planned start already passed at the venue?
 *
 * ⚠ The feed's planned start is venue wall-clock wearing a fake "Z", so it is
 * compared against the venue's own wall clock, built from the zone abbreviation
 * on the formatted `time` ("8:00 AM PDT"). An unknown zone answers false, which
 * just means the time is shown. Matches run late all day, and "Up next · 8:00
 * AM" read at 8:40 is a time that has already gone by.
 */
function startHasPassed(m: TickerMatch, now: number): boolean {
  const abbr = m.time?.match(/\b([A-Z]{3})$/)?.[1];
  const offset = abbr ? TZ_OFFSET[abbr] : undefined;
  if (offset === undefined || !m.plannedStart) return false;
  const venueWallNow = new Date(now + offset * 3_600_000).toISOString().slice(0, 16);
  return m.plannedStart.slice(0, 16) <= venueWallNow;
}

/** "2:00 PM" is a time; "TBD" and "" are not. */
function isClockTime(s: string | undefined): s is string {
  return Boolean(s && /\d{1,2}:\d{2}\s*[AP]M/i.test(s));
}

export function liveEventStatus({
  matches,
  feedOk,
  days,
  todayIso,
  now = Date.now(),
}: {
  /** Ticker rows, any order. */
  matches: TickerMatch[];
  /** Has the feed answered at least once? False = we don't know what is on. */
  feedOk: boolean;
  /** The stop's order of play — `playDays()`. */
  days: PlayDay[];
  todayIso: string;
  /** Epoch ms, for "has the next match's planned start gone by". */
  now?: number;
}): LiveStatus {
  const live = matches.filter((m) => m.status === "live");
  if (live.length > 0) {
    // Qualifying only when EVERY live match is a qualifier: a main-draw match on
    // court makes the plain wording the true one (same rule as the marquee).
    const qualifying = live.every((m) => m.qualifier);
    return {
      kind: "live",
      label: qualifying ? "Pro Qualifiers in progress" : "Matches in progress",
      badge: "Live Now",
      matchLive: true,
    };
  }

  const idx = days.findIndex((d) => d.iso === todayIso);
  const today = idx >= 0 ? days[idx] : undefined;
  const tomorrow = idx >= 0 ? days[idx + 1] : undefined;
  const badge = "Tournament Week";

  if (!feedOk) {
    // We don't know what is on court, so say the one thing the schedule makes
    // true all day. Never a claim about play.
    return { kind: "unknown", label: today?.label ?? "Tournament week", badge, matchLive: false };
  }

  // A row with no planned date counts as today's: the ticker's window is ±1
  // day, and an undated final is far more likely this session's than last's.
  const isToday = (m: TickerMatch) => (venueDate(m) ?? todayIso) === todayIso;
  const upNext = matches
    .filter((m) => m.status === "upnext" && isToday(m))
    .sort((a, b) => (a.plannedStart ?? "").localeCompare(b.plannedStart ?? ""));
  const playedToday = matches.some((m) => m.status === "final" && isToday(m));

  const firstServe = today && isClockTime(today.firstServe) ? `First serve ${today.firstServe}` : null;

  if (upNext.length > 0) {
    if (!playedToday) {
      // Nothing played yet today. The order of play's time is the published
      // one; the feed's own planned start is the fallback.
      const t = firstServe ?? (upNext[0].time ? `First serve ${upNext[0].time}` : "First serve today");
      return { kind: "before-first-serve", label: t, badge, matchLive: false };
    }
    const next = upNext[0];
    return {
      kind: "between",
      label: next.time && !startHasPassed(next, now) ? `Up next · ${next.time}` : "Up next",
      badge,
      matchLive: false,
    };
  }

  if (playedToday) {
    if (tomorrow) {
      const when = isClockTime(tomorrow.firstServe) ? ` ${tomorrow.dow} · ${tomorrow.firstServe}` : ` ${tomorrow.dow}`;
      return { kind: "done-today", label: `Play resumes${when}`, badge, matchLive: false };
    }
    return { kind: "done", label: "Play complete", badge, matchLive: false };
  }

  // Nothing on the wire for today — typically early morning, before the day's
  // matches are published. The schedule is the honest answer.
  if (today) {
    return {
      kind: "before-first-serve",
      label: firstServe ?? today.label,
      badge,
      matchLive: false,
    };
  }
  return { kind: "unknown", label: "Tournament week", badge, matchLive: false };
}
