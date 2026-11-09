/**
 * One pro's whole PPA career from the stored career ledger (server-only):
 * every stop they played, each division's finish and partner, and every
 * match, from their side of the net. Feeds the profile's Stats and
 * Tournament Results sections (components/athletes/PlayerCareer), which
 * count and filter it client-side (lib/career-stats).
 *
 * Joins over memory: the ledger is read once per instance (lib/career-ledger
 * getLedger), so this costs no upstream call at all. An empty ledger (not
 * built yet) returns no events and the profile falls back to Recent Results.
 *
 * ⚠ KEYED BY NAME (normalizeScoreName), like lib/player-history. A namesake
 * who also played a main draw would be merged in; the profile resolves names
 * the same way everywhere else, so it is no worse than what it replaces.
 */
import { getLedger, type Ledger, type LedgerMatch } from "@/lib/career-ledger";
import type { CareerDivision, CareerEvent, CareerMatch, PlayerCareer } from "@/lib/career-stats";
import { finishLabel } from "@/lib/player-event";
import { normalizeScoreName } from "@/lib/score-names";

function careerFrom(ledger: Ledger, name: string): PlayerCareer {
  const key = normalizeScoreName(name);
  const mine = new Set<number>();
  ledger.players.forEach((n, i) => {
    if (normalizeScoreName(n) === key) mine.add(i);
  });
  const since = ledger.stops.length ? ledger.stops.reduce((a, s) => (s.startDate < a ? s.startDate : a), "9999") : null;
  if (!mine.size) return { events: [], since, builtAt: ledger.builtAt || null };

  const names = (ids: number[]) => ids.map((i) => ledger.players[i]);
  const has = (ids: number[] | undefined) => Boolean(ids?.some((i) => mine.has(i)));

  const events: CareerEvent[] = [];
  for (const stop of ledger.stops) {
    const divisions: CareerDivision[] = [];
    for (const d of stop.divisions) {
      const matches: CareerMatch[] = [];
      let partners: string[] = [];
      for (const m of d.matches as LedgerMatch[]) {
        const side = m.a.some((i) => mine.has(i)) ? "a" : m.b.some((i) => mine.has(i)) ? "b" : null;
        if (!side) continue;
        const us = side === "a" ? m.a : m.b;
        const them = side === "a" ? m.b : m.a;
        const ours = names(us.filter((i) => !mine.has(i)));
        if (ours.length) partners = ours;
        matches.push({
          id: m.id,
          round: m.stage === "pools" ? `Pools · ${m.round}` : m.round,
          stage: m.stage,
          status: "final",
          ...(m.wo ? { outcome: "walkover" as const } : {}),
          partners: ours,
          opponents: names(them),
          games: side === "a" ? [m.ga, m.gb] : [m.gb, m.ga],
          won: (m.w === 1) === (side === "a"),
          ...((side === "a" ? m.sa : m.sb) ? { seed: side === "a" ? m.sa : m.sb } : {}),
          ...((side === "a" ? m.sb : m.sa) ? { oppSeed: side === "a" ? m.sb : m.sa } : {}),
          eventId: stop.eventId,
          eventName: stop.name,
          endDate: stop.endDate,
          division: d.name,
        });
      }
      if (!matches.length) continue;

      // How far they got: the podium fields first, then the round of the loss
      // that ended their run (a lost Final is second place even when the feed
      // left silver empty).
      let place: 1 | 2 | 3 | null = has(d.gold) ? 1 : has(d.silver) ? 2 : has(d.bronze) ? 3 : null;
      let finish = place === 1 ? "Champion" : place === 2 ? "Finalist" : place === 3 ? "Semifinalist" : "";
      if (!place) {
        const lastLoss = [...matches].reverse().find((m) => m.won === false);
        if (lastLoss) {
          finish = finishLabel(lastLoss.round.replace(/^Pools · /, ""), lastLoss.stage === "pools");
          // A pool-play loss only ends the run if they never reached the bracket.
          if (lastLoss.stage === "pools" && matches.some((m) => m.stage !== "pools")) finish = "";
          if (finish === "Finalist") place = 2;
          else if (finish === "Semifinalist") place = 3;
        }
      }
      divisions.push({ division: d.name, kind: d.kind, partners, finish, place, matches });
    }
    if (!divisions.length) continue;
    events.push({
      eventId: stop.eventId,
      name: stop.name,
      href: stop.href,
      startDate: stop.startDate,
      endDate: stop.endDate,
      logoUrl: stop.logoUrl,
      international: stop.international,
      divisions,
    });
  }
  return { events, since, builtAt: ledger.builtAt || null };
}

/** Never throws — no ledger or no matches is an empty career. */
export async function playerCareer(name: string): Promise<PlayerCareer> {
  if (!name.trim()) return { events: [], since: null, builtAt: null };
  try {
    const ledger = await getLedger();
    return ledger ? careerFrom(ledger, name) : { events: [], since: null, builtAt: null };
  } catch {
    return { events: [], since: null, builtAt: null };
  }
}
