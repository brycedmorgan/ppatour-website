"use client";

import { useEffect, useMemo, useState } from "react";
import { StageBadge } from "@/components/live/StageBadge";
import { localDayKey, roundForDayLabel, showQualifierBoard } from "@/lib/scores-stage";
import { normalizeScoreName } from "@/lib/score-names";
import { isTabHidden, onTabVisible } from "@/components/live/poll-visibility";
import type { ScoreMatch, ScoresResult, ScoreTeam } from "@/lib/scores-api";

/**
 * All-scores board: every match for the tournament's pro divisions, picked by
 * ROUND (dropdown) and division (pills). Fetches /api/scores and polls every
 * 30s. Shows a live dot on in-progress divisions and matches.
 *
 * ⚠ IT USED TO PICK BY DAY, AND THE DRAW DOES NOT RESPECT THE CALENDAR.
 * Measured on the live Arizona Open: Women's Doubles Round 32 was played on
 * BOTH Tue Sep 15 and Thu Sep 17, and Men's Singles Round 16 on Thu and Fri —
 * so a day picker split one round across two entries, and a fan looking for the
 * round of 32 had to know which half fell on which day. The reverse too: Friday
 * held three different rounds at once. A round is what somebody means by
 * “where is the tournament up to”, and it is how the bracket tab beside this
 * one is already organised.
 */
const POLL_MS = 30000;

function initials(name: string): string {
  return name
    .replace(/[^A-Za-z. ]/g, "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * A player's face, or their initials.
 *
 * ⚠ Deliberately the SAME treatment as the live ticker's card (MatchCard) —
 * `size-6`, circular, white ring, `object-top` so a headshot crops to the face
 * rather than the middle of a torso. The two components render the same matches
 * one band apart on an event page, and a different avatar in each reads as two
 * different systems.
 */
function Avatar({ name, src }: { name: string; src?: string }) {
  return (
    <span className="relative size-6 shrink-0 overflow-hidden rounded-full bg-ppa-line ring-2 ring-white">
      {src ? (
        // Plain img — headshots come from varied hosts; skip next/image config.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover object-top" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[8px] font-bold text-ppa-navy/50">
          {initials(name)}
        </span>
      )}
    </span>
  );
}

function SideRow({
  team,
  status,
  outcome,
  headshots,
}: {
  team: ScoreTeam;
  status: ScoreMatch["status"];
  outcome?: ScoreMatch["outcome"];
  /** Normalized name → headshot URL, from the response. See lib/score-headshots. */
  headshots: Record<string, string>;
}) {
  const games = team.games.filter((g) => g !== null) as number[];
  const names = team.players.length ? team.players : ["TBD"];
  return (
    <div className="flex items-stretch">
      <span className="flex w-6 shrink-0 items-center justify-center text-[11px] font-bold tabular-nums text-ppa-navy/40">
        {team.seed ?? ""}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2 py-1.5">
        {/* Overlapped, like a doubles team on the ticker card. Hidden below
            `sm`: the phone layout gives a name row ~150px and two faces plus a
            doubles pairing does not fit without truncating the names, which are
            the part a reader actually needs. */}
        <div className="hidden -space-x-1.5 sm:flex">
          {names.map((n, i) => (
            <Avatar key={i} name={n} src={headshots[normalizeScoreName(n)]} />
          ))}
        </div>
        <div className="flex min-h-[2.4rem] min-w-0 flex-1 flex-col justify-center">
          {names.map((n, i) => (
            <span
              key={i}
              className={`truncate text-[13px] leading-tight ${
                team.winner ? "font-bold text-ppa-navy" : "text-ppa-navy/70"
              }`}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-stretch border-l border-ppa-line">
        {games.map((g, i) => (
          <span
            key={i}
            className={`flex w-8 items-center justify-center text-[13px] tabular-nums ${
              team.winner ? "bg-ppa-win font-bold text-ppa-navy" : "text-ppa-navy/45"
            }`}
          >
            {g}
          </span>
        ))}
        {/* ⚠ A WALKOVER WINNER GETS THE SAME TREATMENT AS EVERY OTHER WINNER.
            The green highlight lives on the SCORE cells, and a withdrawal has
            none — so the side that advanced was styled like the side that lost,
            distinguishable only by a bolder name. This puts one cell in the same
            column, with the same classes, carrying "W" for the team that went
            through and a dash for the team that withdrew. Same geometry as a
            played match, so a row of results reads consistently. */}
        {outcome === "walkover" && (
          <span
            className={`flex w-8 items-center justify-center text-[13px] tabular-nums ${
              team.winner ? "bg-[#d3ecd0] font-bold text-ppa-navy" : "text-ppa-navy/45"
            }`}
          >
            {team.winner ? "W" : "–"}
          </span>
        )}
        {status === "live" && games.length === 0 && (
          <span className="flex w-8 items-center justify-center text-ppa-navy/25">–</span>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ m, headshots }: { m: ScoreMatch; headshots: Record<string, string> }) {
  return (
    <article className="overflow-hidden rounded-md border border-ppa-line bg-white">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5">
        {/* ⚠ THE DAY, NOT THE ROUND. The picker above names the round, so this
            line spent the most prominent text on a card restating the current
            selection — while the day, which a round can straddle, had nowhere to
            appear at all. A fixture with no published date reads “Date TBA”, the
            feed's own words for it. */}
        <span className="truncate font-display text-sm uppercase leading-none text-ppa-navy">
          {m.dateLabel}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {m.status === "live" && (
            <span className="flex items-center gap-1 rounded-full bg-ppa-live px-2 py-0.5">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-white">Live</span>
            </span>
          )}
          {/* ⚠ A confirmed-but-unplayed match has to SAY it hasn't been played.
              Its score cells are empty (SideRow renders only games that exist —
              never a fabricated 0–0), and without this chip an empty card reads
              as a result we failed to load rather than a fixture still to come. */}
          {/* ⚠ A walkover has no score, so without saying so the card looks like
              a result that failed to load — which is exactly how the withdrawn
              Wiseman/Pham vs Miao/Cai match read. The winner's name is bolded by
              SideRow; this says why there is nothing beside it. */}
          {m.outcome === "walkover" && (
            <span className="rounded-full bg-ppa-navy/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-ppa-navy/60">
              Walkover
            </span>
          )}
          {m.status === "scheduled" && (
            <span className="rounded-full bg-ppa-blue/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-ppa-blue">
              Upcoming
            </span>
          )}
          {m.court && (
            <span className="rounded-full bg-ppa-navy/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ppa-navy/55">
              {m.court}
            </span>
          )}
        </div>
      </div>
      <div className="border-t border-ppa-line">
        <SideRow team={m.teams[0]} status={m.status} outcome={m.outcome} headshots={headshots} />
        <div className="h-px bg-ppa-line" />
        <SideRow team={m.teams[1]} status={m.status} outcome={m.outcome} headshots={headshots} />
      </div>
    </article>
  );
}

export function ScoresBoard({
  eventId,
  light = false,
  roundByDay,
}: {
  eventId: string;
  light?: boolean;
  /**
   * ISO date -> the round this stop's ORDER OF PLAY has it playing that day,
   * from `orderOfPlayByDay` in lib/order-of-play. What the board opens on.
   *
   * ⚠ THE MAP IS BUILT ON THE SERVER AND READ WITH THE DEVICE'S CLOCK, and the
   * split is deliberate. Which round a given day plays is a fact about the
   * tournament, the same one the Order of Play table prints; which day it is
   * right now is a fact about the person looking, and this page is prerendered
   * and CDN-cached for viewers in every timezone. Same division of labour as
   * the qualifier switch above.
   *
   * Optional: the /brackets page and the Atlanta demo board have no schedule to
   * hand, and fall back to what the data shows.
   */
  roundByDay?: Record<string, string>;
}) {
  const [data, setData] = useState<ScoresResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [roundSel, setRound] = useState<string | null>(null);
  /**
   * The device's date, re-read every minute so a tab left open across midnight
   * moves to the pro draw on its own rather than sitting on yesterday's
   * qualifiers until somebody reloads. Null until mount — reading the clock
   * during render would make this component impure and risk hydrating to a
   * different day than the server rendered.
   */
  const [todayKey, setTodayKey] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setTodayKey(localDayKey(new Date()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;
    const load = () =>
      // ⚠ THE TRAILING SLASH IS DELIBERATE. `trailingSlash: true` (next.config)
      // answers the unslashed form with a 308, so without it every poll costs two
      // requests — measured on a real server. Same trap documented at length in
      // components/live/use-live-ticker.
      fetch(`/api/scores/?event=${encodeURIComponent(eventId)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: ScoresResult | null) => {
          if (!active || !d) return;
          setData(d);
          setLoaded(true);
        })
        .catch(() => {});
    // A board nobody is looking at does not need refreshing — see
    // components/live/poll-visibility. The first load still runs regardless, so
    // a tab opened in the background has real scores the moment it is revealed.
    const tick = () => {
      if (!isTabHidden()) load();
    };
    load();
    const id = window.setInterval(tick, POLL_MS);
    const off = onTabVisible(load);
    return () => {
      active = false;
      window.clearInterval(id);
      off();
    };
  }, [eventId]);

  /**
   * The bracket on screen. Everything below reads `shown`, never `data`
   * directly, so the day picker, the division pills and the match cards can
   * never end up describing different brackets.
   */
  const isQualifier = showQualifierBoard(data, todayKey);
  const shown = isQualifier && data?.qualifier ? data.qualifier : data;

  /**
   * The rounds in this bracket, earliest first.
   *
   * ⚠ GROUPED BY THE FEED'S ROUND LABEL AND ORDERED BY A DERIVED DEPTH — not
   * keyed on `roundNumber`, which is only meaningful WITHIN a division. It counts
   * up from 1 at that division's own first round, so at a stop where one division
   * draws 64 and another draws 32, `roundNumber` 1 is Round 64 in the first and
   * Round 32 in the second. Keying on it would file two different rounds under one
   * entry and print the wrong name over half of them. The label cannot do that.
   *
   * Depth is rounds-from-the-last — `max(roundNumber in that division) - roundNumber`
   * — which agrees across draw sizes: the final is depth 1 whether its division
   * started at 64 or at 32. Nothing here reads a round NAME, so there is no
   * hardcoded ladder of “Quarter Finals before Semi-Finals” to drift out of step
   * with whatever the feed decides to call a round.
   */
  const rounds = useMemo(() => {
    const ms = shown?.matches ?? [];
    const lastOf = new Map<string, number>();
    for (const m of ms) lastOf.set(m.divisionId, Math.max(lastOf.get(m.divisionId) ?? 0, m.roundNumber));
    const depth = new Map<string, number>();
    for (const m of ms) {
      const d = (lastOf.get(m.divisionId) ?? m.roundNumber) - m.roundNumber;
      // Deepest wins a disagreement, so a round that is early in ANY division is
      // placed early rather than buried among the later ones.
      depth.set(m.roundLabel, Math.max(depth.get(m.roundLabel) ?? d, d));
    }
    return [...depth.entries()]
      .map(([label, d]) => ({ label, depth: d }))
      .sort((a, b) => b.depth - a.depth);
  }, [shown]);

  /**
   * ⚠ A SELECTION FROM ONE BRACKET IS MEANINGLESS IN THE OTHER, so the day and
   * the division are validated against what is actually on screen rather than
   * trusted. When the board switches at midnight, the qualifier ids held in
   * state name nothing in the main draw: left alone, no pill would read as
   * active and the board would say "No matches on this day for this division."
   * on an event with a full schedule. Falling back to null hands the choice
   * back to the two picker effects, which choose a real day and a populated
   * division.
   *
   * Derived here rather than reset in an effect on purpose — an effect would
   * cost a second render pass and a `set-state-in-effect` lint error, and this
   * is derived data, not state.
   */
  const round = rounds.some((r) => r.label === roundSel) ? roundSel : null;

  /**
   * Open on the round THE ORDER OF PLAY says the tournament is playing today
   * (Wesley, 9/20) — Championship Sunday reads "Championship Sunday — Finals",
   * so the board opens on Finals.
   *
   * ⚠ THE SCHEDULE LEADS, THE DATA DOES NOT, and on the day that matters most
   * they disagree. At 8am on Championship Sunday nothing in the final has been
   * played and the deepest PLAYED round is the semifinals — so a data-derived
   * default opens the board on yesterday's business on the one morning everybody
   * arrives looking for the final. The schedule already knows. It is also the
   * table printed further up the same page, so the two now answer alike.
   *
   * The fallbacks, in order, for a board with no schedule (the /brackets page,
   * the Atlanta demo) or a lead-in day that names no round at all ("Amateur &
   * junior brackets"): the deepest round with a live match, then the deepest
   * round anyone has played, then the first round.
   *
   * ⚠ "PLAYED" IS WHAT KEEPS THE FALLBACK OFF THE BRONZE MATCH, and it is the
   * fallback that carries every finished event. The feed publishes a Bronze
   * round for every division and numbers it one deeper than the final — but
   * there is no third-place match at a 1,000-point stop (Connor, 7/23), so it is
   * never played and stays "Date TBA" forever. Measured on the completed
   * Nationals board: Finals 5 played, Bronze 5 still scheduled. Taking the
   * deepest round outright would land a finished event on five fixtures that
   * never happened.
   *
   * ⚠ A DAY LABEL THAT NAMES TWO ROUNDS RESOLVES TO NEITHER RELIABLY, so word
   * a new one after the round the feed plays, not after the medals. Nationals'
   * transcribed Sunday reads "Championship Sunday — Gold & Bronze" where the
   * feed splits those into Finals and Bronze: it used to land on Bronze, and now
   * lands on nothing and takes the fallback, because the phantom bronze round is
   * filtered out of a 1,000-point board upstream (see `normalize` in
   * lib/scores-api). Right answer, reached by luck.
   *
   * ⚠ A GUARD ON `champions` WAS TRIED HERE AND REMOVED. `standingsOf` falls
   * back to the deepest COMPLETED match when no gold-medal match has been
   * played, so mid-event it reports five champions off the semifinals — five of
   * them on the live Arizona board on Championship Sunday morning. Nothing
   * renders those (the banner is gated on the event being completed), but it is
   * not a signal anything here can lean on.
   */
  useEffect(() => {
    if (round || !rounds.length) return;
    const ms = shown?.matches ?? [];
    const deepest = (want: (m: ScoreMatch) => boolean) => {
      const set = new Set(ms.filter(want).map((m) => m.roundLabel));
      const hit = rounds.filter((r) => set.has(r.label));
      return hit.length ? hit[hit.length - 1] : null;
    };

    // What the order of play says is on court today. Undefined on any date
    // outside the event, so a completed stop always takes the fallbacks.
    const today = todayKey ? roundByDay?.[todayKey] : undefined;
    const fromSchedule = today ? roundForDayLabel(today, rounds) : null;

    const open =
      fromSchedule ??
      deepest((m) => m.status === "live")?.label ??
      deepest((m) => m.status !== "scheduled")?.label ??
      rounds[0].label;
    setRound(open);
  }, [rounds, round, shown, roundByDay, todayKey]);

  const liveAny = useMemo(
    () => (shown?.matches ?? []).some((m) => m.status === "live"),
    [shown],
  );

  const divisions = shown?.divisions ?? [];
  const [divisionSel, setDivision] = useState<string | null>(null);
  /** Validated against the bracket on screen — see the note on `day`. */
  const division = divisions.some((d) => d.id === divisionSel) ? divisionSel : null;

  /**
   * Open on a division that actually has matches on the chosen day.
   *
   * ⚠ IT USED TO OPEN ON divisions[0] BLIND, and that started landing on an
   * empty grid the moment the picker could hold more than one kind of bucket: a
   * division may have nothing yet in the round on screen while the Women's
   * Doubles that leads the list does. Falls back to the first division, so a
   * round with nothing in it still selects something.
   */
  useEffect(() => {
    // ⚠ Wait for `round`. The round picker is chosen by the effect above, and
    // this one is otherwise free to run first — with `round` still null nothing
    // matches it, so this fell straight through to divisions[0] and then never
    // re-ran, which is how the board kept opening on an empty grid.
    if (division || !divisions[0] || !round) return;
    const populated = divisions.find((d) =>
      (shown?.matches ?? []).some((m) => m.divisionId === d.id && m.roundLabel === round),
    );
    setDivision((populated ?? divisions[0]).id);
  }, [divisions, division, shown, round]);


  // Divisions with a live match in the selected round (button dots).
  const liveDivsInRound = useMemo(() => {
    const set = new Set<string>();
    for (const m of shown?.matches ?? []) if (m.roundLabel === round && m.status === "live") set.add(m.divisionId);
    return set;
  }, [shown, round]);

  // Matches for the selected round + division, in bracket order. Every match on
  // screen is now the same round, so there is nothing left for a round sort to do.
  const matches = useMemo(
    () =>
      (shown?.matches ?? [])
        .filter((m) => m.roundLabel === round && m.divisionId === division)
        .sort((a, b) => a.matchNumber - b.matchNumber),
    [shown, round, division],
  );

  const panel = light ? "border-ppa-line bg-ppa-paper" : "border-white/10 bg-ppa-navy-deep";
  const muted = light ? "text-ppa-navy/55" : "text-white/55";

  if (!loaded) {
    return (
      <div className={`flex h-[160px] items-center justify-center rounded-lg border ${panel}`}>
        <span
          aria-hidden
          className={`size-6 animate-spin rounded-full border-2 ${light ? "border-ppa-line border-t-ppa-blue" : "border-white/20 border-t-white"}`}
        />
      </div>
    );
  }

  if (!rounds.length) {
    return (
      <div className={`rounded-lg border px-6 py-10 text-center text-sm ${panel} ${muted}`}>
        No scores available yet.
      </div>
    );
  }

  return (
    <div>
      {/* Which bracket these scores are — see StageBadge. */}
      {isQualifier && (
        <div className="mb-3">
          <StageBadge light={light} />
        </div>
      )}


      {/* Round picker */}
      <div className="flex flex-wrap items-center gap-3">
        {/* ⚠ "Matches", not "Results". A round can be wholly unplayed — the final
            is a real entry here all week — and before a tournament starts every
            entry is. "Results by round" over a list of matches nobody has played
            yet describes the wrong thing. */}
        <label htmlFor="scores-round" className={`text-[11px] font-bold uppercase tracking-[0.16em] ${muted}`}>
          Matches by round
        </label>
        <select
          id="scores-round"
          value={round ?? ""}
          onChange={(e) => setRound(e.target.value)}
          className={`rounded-md border px-3 py-2 text-sm font-semibold focus:outline-none ${
            light
              ? "border-ppa-line bg-white text-ppa-navy focus:border-ppa-navy/50"
              : "border-white/20 bg-ppa-navy-deep text-white focus:border-white/50"
          }`}
        >
          {rounds.map((r) => (
            <option key={r.label} value={r.label}>
              {r.label}
            </option>
          ))}
        </select>
        {liveAny && (
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-live">
            <span className="size-1.5 animate-pulse rounded-full bg-ppa-live" />
            Live · auto-updating
          </span>
        )}
      </div>

      {/* Division buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {divisions.map((d) => {
          const active = d.id === division;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setDivision(d.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                active
                  ? light
                    ? "bg-ppa-blue text-white"
                    : "bg-white text-ppa-navy"
                  : light
                    ? "border border-ppa-line text-ppa-navy/60 hover:border-ppa-blue/50 hover:text-ppa-navy"
                    : "border border-white/20 text-white/70 hover:border-white/50 hover:text-white"
              }`}
            >
              {liveDivsInRound.has(d.id) && <span className="size-1.5 animate-pulse rounded-full bg-ppa-live" />}
              {d.name}
            </button>
          );
        })}
      </div>

      {/* Matches for the selected round + division */}
      <div className="mt-6">
        {matches.length === 0 ? (
          <p className={`text-sm ${muted}`}>No matches in this round for this division.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <ScoreCard key={m.id} m={m} headshots={data?.headshots ?? {}} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
