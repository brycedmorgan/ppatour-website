/**
 * Everything the app's player screen knows about one pro (server-only):
 * who they are (rank, photo, our profile) and what they have played at this
 * event (their path through every draw they are in).
 *
 * Bryce, 10/9: "click one player, see all their scores, profiles, etc."
 *
 * ⚠ THE KEY IS A NAME, SO AMBIGUITY DROPS THE LINK. Same rule as
 * lib/score-headshots: ~20 names on the boards belong to two people (two Ben
 * Johnses, No. 1 and No. 682). A name held by more than one ranked player
 * resolves to the one we publish a profile for when exactly one is ours, and
 * otherwise to nobody — no rank, no photo, no profile, no follow. Showing the
 * wrong man's ranking on a player screen is worse than showing none.
 */
import { getBracketDraw, getBracketIndex } from "@/lib/brackets-api";
import type { Bracket, BracketMatch, BracketSide } from "@/lib/bracket-types";
import { getPublishedByName, publishedProfileSlug } from "@/lib/published-athletes";
import { getFullRankings } from "@/lib/rankings-api";
import { normalizeScoreName } from "@/lib/score-names";

export type PlayerProfile = {
  name: string;
  headshot: string | null;
  countryCode: string;
  /** World Pickleball Ranking, when the name resolves to one ranked pro. */
  rank: { rank: number; isTied: boolean; board: string; points: number } | null;
  /** Our `/athletes/<slug>` — also the follow key (see components/app/follows). */
  profileSlug: string | null;
};

/**
 * The full boards, held for an hour per instance — the same window
 * lib/score-headshots uses, since rankings move on event results, not by the
 * minute, and this page renders per request.
 */
const BOARDS_TTL_MS = 60 * 60 * 1000;
let boardsCache: { value: Promise<Awaited<ReturnType<typeof getFullRankings>>>; expires: number } | null = null;
function boards() {
  if (!boardsCache || boardsCache.expires < Date.now()) {
    const value = getFullRankings();
    boardsCache = { value, expires: Date.now() + BOARDS_TTL_MS };
    // A failed or fallback pull must not be pinned for the hour.
    value.then(
      (r) => {
        if (r.source !== "live") boardsCache = null;
      },
      () => {
        boardsCache = null;
      },
    );
  }
  return boardsCache.value;
}

export async function resolvePlayer(name: string): Promise<PlayerProfile> {
  const key = normalizeScoreName(name);
  const base: PlayerProfile = { name, headshot: null, countryCode: "", rank: null, profileSlug: null };
  if (!key) return base;

  let hits: { e: Awaited<ReturnType<typeof getFullRankings>>["divisions"][number]["entries"][number]; board: string }[] = [];
  try {
    const all = await boards();
    hits = all.divisions.flatMap((d) =>
      d.entries.filter((e) => normalizeScoreName(e.name) === key).map((e) => ({ e, board: d.label })),
    );
  } catch {
    // No boards → no rank. The screen still shows the matches.
  }
  // One person can appear once per board; distinct slugs are distinct people.
  const bySlug = new Map(hits.map((h) => [h.e.slug, h]));
  let pick = bySlug.size === 1 ? [...bySlug.values()][0] : undefined;
  if (!pick && bySlug.size > 1) {
    const ours = [...bySlug.values()].filter((h) => h.e.hasLocalProfile);
    if (ours.length === 1) pick = ours[0];
  }

  if (pick) {
    const e = pick.e;
    return {
      name: e.name,
      headshot: e.headshot,
      countryCode: e.countryCode,
      rank: { rank: e.rank, isTied: e.isTied, board: pick.board, points: e.points },
      profileSlug: e.hasLocalProfile ? e.profileUrl.replace(/\/$/, "").split("/").pop() || null : null,
    };
  }
  // Ambiguous on the boards → stop here, on purpose (see the file note).
  if (bySlug.size > 1) return base;

  // Not ranked (qualifiers, juniors, new pros) — our own roster by name.
  const published = getPublishedByName(name);
  const slug = published ? publishedProfileSlug(published.slug) : null;
  return { ...base, name: published?.name ?? name, profileSlug: slug };
}

/** One match on the player's path through a draw, from their side of the net. */
export type PlayerStep = {
  id: string;
  round: string;
  status: BracketMatch["status"];
  outcome?: "walkover";
  court?: string;
  time?: string;
  partners: string[];
  opponents: string[];
  /** Per-game scores, theirs first: [[11, 7, 11], [9, 11, 5]]. */
  games: [number[], number[]];
  /** null until decided. */
  won: boolean | null;
};

export type PlayerRun = {
  division: string;
  /** "Gold" / "Silver" / "Bronze", "On court now", "Next: QF", "Out in R16". */
  summary: string;
  medal: "gold" | "silver" | "bronze" | null;
  sections: { label: string | null; steps: PlayerStep[] }[];
};

const names = (s: BracketSide) => (s.participant?.name ?? "").split(" / ").map((n) => n.trim()).filter(Boolean);

function stepsIn(b: Bracket | null, key: string): PlayerStep[] {
  if (!b) return [];
  const out: PlayerStep[] = [];
  for (const r of b.rounds) {
    for (const m of r.matches) {
      const i = m.sides.findIndex((s) => names(s).some((n) => normalizeScoreName(n) === key));
      if (i < 0) continue;
      const me = m.sides[i];
      const them = m.sides[1 - i];
      const decided = m.status === "final" && (me.winner || them.winner);
      out.push({
        id: m.id,
        round: r.name,
        status: m.status,
        outcome: m.outcome,
        court: m.court,
        time: m.time,
        partners: names(me).filter((n) => normalizeScoreName(n) !== key),
        opponents: names(them),
        games: [
          me.games.filter((g): g is number => g != null),
          them.games.filter((g): g is number => g != null),
        ],
        won: decided ? me.winner : null,
      });
    }
  }
  return out;
}

const has = (team: string | undefined, key: string) =>
  Boolean(team && team.split(" / ").some((n) => normalizeScoreName(n) === key));

/** Their path through every draw at this event that they appear in. Never throws. */
export async function playerRuns(eventId: string, name: string): Promise<PlayerRun[]> {
  const key = normalizeScoreName(name);
  if (!key || !eventId) return [];
  try {
    const { divisions } = await getBracketIndex(eventId);
    const draws = await Promise.all(divisions.map((d) => getBracketDraw(eventId, d.id)));
    const runs: PlayerRun[] = [];
    draws.forEach((draw, di) => {
      if (!draw) return;
      const div = divisions[di];
      const sections = [
        { label: draw.pools ? "Pools" : null, steps: stepsIn(draw.pools, key) },
        { label: draw.losers || draw.pools ? (draw.losers ? "Winners" : "Bracket") : null, steps: stepsIn(draw.bracket, key) },
        { label: "Losers", steps: stepsIn(draw.losers, key) },
      ].filter((s) => s.steps.length > 0);
      if (!sections.length) return;

      const all = sections.flatMap((s) => s.steps);
      const medal = has(div.gold, key) ? "gold" : has(div.silver, key) ? "silver" : has(div.bronze, key) ? "bronze" : null;
      const live = all.find((s) => s.status === "live");
      const next = all.find((s) => s.status === "scheduled");
      // "Out" only when the loss is in their LAST stage: a winners-bracket or
      // pool loss is not elimination until the feed places them in the next
      // stage, which can lag the result.
      const lastSection = sections[sections.length - 1];
      const knockoutStarted = draw.bracket.rounds.some((r) => r.matches.some((m) => m.status !== "scheduled"));
      const lastLoss = [...lastSection.steps].reverse().find((s) => s.won !== null);
      const terminal =
        (lastSection.label !== "Winners" && lastSection.label !== "Pools") ||
        lastLoss?.round === "Final" ||
        (lastSection.label === "Pools" && knockoutStarted);
      const lastDone = terminal ? lastLoss : undefined;
      const summary = medal
        ? medal[0].toUpperCase() + medal.slice(1)
        : live
          ? "On court now"
          : next
            ? `Next: ${next.round}`
            : lastDone && lastDone.won === false
              ? lastDone.round === "Final"
                ? "Silver"
                : `Out in ${lastDone.round}`
              : "";
      runs.push({ division: div.name, summary, medal, sections });
    });
    return runs;
  } catch {
    return [];
  }
}
