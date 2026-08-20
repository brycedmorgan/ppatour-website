import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HomeContent } from "@/components/home/HomeContent";
import { LivePreviewClock } from "@/components/live/LivePreviewClock";
import { getEvents } from "@/lib/events-api";
import { activeTickerPartner, fetchLiveTicker } from "@/lib/ticker-api";
import {
  firstServeMs,
  getAllEvents,
  getNextTournament,
  isTournamentLive,
  lastPointMs,
  nowMs,
  type Tournament,
} from "@/lib/placeholder-data";

// Internal preview of the homepage during a live tournament — keep it out of
// search results so it isn't treated as duplicate homepage content.
export const metadata: Metadata = {
  title: "Live — Homepage Preview",
  robots: { index: false, follow: false },
};

/**
 * ⚠ THIS RENDERS THE REAL HOMEPAGE WITH THE CLOCK MOVED. It does not force a
 * live state, and that is the entire point of the route.
 *
 * `/` decides for itself whether the tour is on, from the calendar
 * (`isTournamentLive` in lib/placeholder-data). The only way to review that
 * decision before the tournament — while there is still time to change
 * anything — is to ask the same code what it would render at a different
 * moment. So this route computes a millisecond OFFSET and hands it to
 * `<HomeContent clockOffsetMs>`; every date-derived decision on the page then
 * runs exactly as it will on the day: which stop is next, whether it is live,
 * what the countdown reads, when it flips back, which stop it advances to.
 *
 * ⚠ AN EARLIER VERSION OF THIS FILE PASSED `live={true}` AND A HAND-BUILT EVENT
 * RECORD. It proved the live LAYOUT renders and nothing at all about whether the
 * homepage would flip on the day — the two are different claims, and only the
 * second one matters on a launch morning.
 *
 *   /live               the tour's real state right now. Redirects to /watch
 *                       unless something is genuinely running, so the URL a fan
 *                       might type never advertises a finished event as live.
 *   /live?in=30         pretend it is 30s before first serve. Watch the hero
 *                       count down, hit zero, and go LIVE — unassisted.
 *   /live?ends=30       pretend it is 30s before the last point. Watch it go
 *                       back to Next Event and advance to the following stop.
 *   /live?at=2026-09-02 pretend it is that date (or datetime).
 *   /live?event=<slug>  aim ?in= / ?ends= at a specific stop instead of the
 *                       next one.
 *
 * The Live Now band is pointed at whichever tournament is genuinely running
 * (see `runningTournament`), so the scores and bracket in a preview are real
 * even though the hero is rehearsing a stop that has not started — and the band
 * names that tournament rather than the one on the hero.
 *
 * ⚠ THE CHROME ON THIS ROUTE DOES NOT FOLLOW SUIT. The ticker, the marquee and
 * the score rail all read the main PPA tour, same as production, so a sister-tour
 * window does not appear in them by accident. To rehearse those with real
 * matches, name the tour: `/live?in=30&partner=PPA%20Asia`.
 *
 * ⚠ SIMULATION IS OPT-IN VIA A QUERY PARAM, AND THAT IS THE WHOLE GATE. With no
 * param the clock is not shifted at all and this behaves as it always did. When
 * it IS shifted the page says so on screen (LivePreviewClock) — this repo does
 * not render states that misdescribe what is happening.
 */
export const dynamic = "force-dynamic";

/** Seconds param → number, rejecting the empty string that `Number("")` calls 0. */
function seconds(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * `?at=` accepts an epoch in ms, a date, or a datetime.
 *
 * ⚠ A BARE `YYYY-MM-DD` IS FORCED TO LOCAL MIDNIGHT, AND IT HAS TO BE.
 * `Date.parse("2026-09-07")` is UTC midnight by spec, while every tournament
 * window on this site is local midnight (see startOfEvent). In US timezones that
 * is a several-hour disagreement, and it showed: `?at=2026-09-07` — the day
 * AFTER Nationals ends — rendered the page as still live, because UTC midnight
 * on the 7th is the evening of the 6th in Cary. A preview that lies about the
 * boundary is worse than no preview, since the boundary is the whole thing
 * being tested.
 */
function parseAt(raw: string | undefined): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber)) return asNumber;
  // "2026-09-07" — a bare date, no time. Written out rather than regexed so an
  // escaping slip cannot silently turn the check into a no-op, which is exactly
  // what happened on the first pass here.
  const bareDate =
    trimmed.length === 10 && trimmed.charAt(4) === "-" && trimmed.charAt(7) === "-";
  const ms = Date.parse(bareDate ? trimmed + "T00:00:00" : trimmed);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * The offset that puts the simulated clock `secs` before `boundary`.
 *
 * ⚠ RESOLVED ONCE AND THEN PINNED IN THE URL AS AN ABSOLUTE `?offset=`. The page
 * re-renders itself when the boundary passes; a relative "30 seconds before
 * first serve" would be recomputed on every one of those re-renders and the
 * countdown would restart forever.
 */
function offsetFor(boundary: number, secs: number): number {
  return boundary - secs * 1_000 - Date.now();
}

/** Loose title match — the events feed trims titles (`cleanTitle`) and the
 *  score ticker does not, so compare on letters and digits alone. */
function sameTournament(a: string, b: string): boolean {
  const key = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
  const x = key(a);
  const y = key(b);
  return x.length > 0 && y.length > 0 && (x === y || x.includes(y) || y.includes(x));
}

/**
 * The tournament actually being played right now.
 *
 * ⚠ THIS IS WHY THE PREVIEW CAN BE TESTED AGAINST REAL SCORES. A shifted clock
 * puts a FUTURE stop on the hero — Nationals, say — and a future stop has no
 * scores, no bracket and no players, so the Live Now band renders an empty
 * shell however correct the plumbing is. Meanwhile a real tournament usually IS
 * running somewhere on the tour. Pointing the band at that one turns the
 * preview into a live test.
 *
 * ⚠ THE TICKER CANNOT ANSWER THIS ALONE. `homepage_score_ticker` carries the
 * tournament's TITLE but no tournament UUID (its rows' `eventUuid` is the
 * division), and the band needs a UUID — so the title is joined against the
 * events feed, which has both. A miss returns undefined and the band falls back
 * to the stop on the hero, i.e. today's behaviour.
 */
async function runningTournament(): Promise<Tournament | undefined> {
  /**
   * ⚠ ASKS FOR WHICHEVER TOUR IS ACTUALLY PLAYING, WHICH THE SITE CHROME
   * DELIBERATELY DOES NOT. `fetchLiveTicker()` defaults to the main PPA tour now,
   * because sister-tour matches have no business on ppatour.com's ticker or hero
   * (Wesley, 8/20). This route is the exception and the reason the exception is
   * safe: it is the rehearsal harness, it is noindex, and finding real live
   * matches wherever they are is its entire purpose — today that is a PPA Asia
   * stop in Shenzhen.
   */
  const partner = (await activeTickerPartner()) ?? undefined;
  const title = (await fetchLiveTicker(partner)).tournament?.title;
  if (!title) return undefined;
  const { events } = await getEvents();
  const match = events.find((e) => sameTournament(e.name, title));
  // No UUID means no bracket to show, so it is no use as an override.
  return match?.tournamentUuid ? match : undefined;
}

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{
    event?: string;
    in?: string;
    ends?: string;
    at?: string;
    offset?: string;
  }>;
}) {
  const params = await searchParams;

  // Which stop the ?in= / ?ends= boundary is aimed at. Default: whatever the
  // homepage itself would be showing.
  const target: Tournament | undefined = params.event
    ? getAllEvents().find((t) => t.slug === params.event)
    : getNextTournament();
  if (!target) redirect("/watch");

  const keep = params.event ? `&event=${params.event}` : "";
  const before = seconds(params.in);
  const untilEnd = seconds(params.ends);
  const at = parseAt(params.at);

  if (before !== null) {
    redirect(`/live?offset=${offsetFor(firstServeMs(target), before)}${keep}`);
  }
  if (untilEnd !== null) {
    redirect(`/live?offset=${offsetFor(lastPointMs(target), untilEnd)}${keep}`);
  }
  if (at !== null) {
    redirect(`/live?offset=${at - nowMs()}${keep}`);
  }

  const offset = seconds(params.offset) ?? 0;
  const simulating = params.offset !== undefined;
  const now = nowMs(offset);

  // Not simulating and nothing actually on: send people where their question is
  // answered rather than showing them a finished event under a LIVE banner.
  if (!simulating && !isTournamentLive(target, now)) redirect("/watch");

  /**
   * What the preview badge counts down to: whichever boundary is next under the
   * shifted clock. Live now → the last point (watch it switch back). Not yet →
   * first serve (watch it go live). The stop is re-resolved against the shifted
   * clock so this follows the page as it advances.
   */
  const onScreen = getNextTournament(now);
  const live = isTournamentLive(onScreen, now);
  const boundary = live ? lastPointMs(onScreen) : firstServeMs(onScreen);

  return (
    <>
      <HomeContent clockOffsetMs={offset} liveEventOverride={await runningTournament()} />
      {simulating && (
        <LivePreviewClock
          offsetMs={offset}
          boundaryMs={boundary}
          live={live}
          eventName={onScreen.name}
        />
      )}
    </>
  );
}
