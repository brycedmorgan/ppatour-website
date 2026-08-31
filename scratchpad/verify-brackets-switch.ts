/**
 * The BRACKET panel's qualifier→pro switch, simulated against a fake feed so
 * the transitions can be proven now instead of waited for.
 * Run: npx tsx scratchpad/verify-brackets-switch.ts
 */
import { getBracketIndex } from "../lib/brackets-api";

process.env.PB_API_TOKEN = "test-token";
process.env.PB_API_BASE_URL = "https://mock.local";

type Row = { round: number; roundText: string; type: string; done: boolean; started?: boolean };
const EVENTS = [
  { eventId: "main-md", eventType: "MAIN_EVENT_TYPE", eventTitle: "Mens Doubles Pro Main Draw", bracketFormatId: 1 },
  { eventId: "qual-md", eventType: "UNDEFINED_PPA_EVENT_TYPE", eventTitle: "Mens Doubles Pro Qualifier", bracketFormatId: 1 },
];

/** A qualifier draw: R32 → R16 → QF → SF → Final, plus the never-played Bronze. */
const qualRows = (throughRound: number): Row[] => [
  { round: 1, roundText: "Round 32", type: "W", done: throughRound >= 1, started: true },
  { round: 2, roundText: "Round 16", type: "W", done: throughRound >= 2, started: throughRound >= 1 },
  { round: 3, roundText: "Quarter Finals", type: "HIDE", done: throughRound >= 3, started: throughRound >= 2 },
  { round: 4, roundText: "Semi-Finals", type: "HIDE", done: throughRound >= 4, started: throughRound >= 3 },
  { round: 5, roundText: "Finals", type: "HIDE", done: throughRound >= 5, started: throughRound >= 4 },
  // ⚠ Never played — the PPA does not play a third-place match.
  { round: 6, roundText: "Bronze", type: "HIDE", done: false },
];
const mainRows = (started: boolean): Row[] => [
  { round: 1, roundText: "Round 64", type: "W", done: false, started },
  { round: 7, roundText: "Finals", type: "GS", done: false },
];

const SCENARIOS: Record<string, { qual: Row[]; main: Row[] }> = {
  "t-notstarted": { qual: qualRows(0).map((r) => ({ ...r, started: false })), main: mainRows(false) },
  "t-midqual":    { qual: qualRows(2), main: mainRows(false) },
  "t-finalleft":  { qual: qualRows(4), main: mainRows(false) },
  "t-qualdone":   { qual: qualRows(5), main: mainRows(false) },
  "t-mainstart":  { qual: qualRows(2), main: mainRows(true) },
  "t-noqual":     { qual: [], main: mainRows(true) },
};
const EXPECT: Record<string, string> = {
  "t-notstarted": "main", "t-midqual": "qualifier", "t-finalleft": "qualifier",
  "t-qualdone": "main", "t-mainstart": "main", "t-noqual": "main",
};
const LABEL: Record<string, string> = {
  "t-notstarted": "PRE-EVENT  qualifier exists, nothing played",
  "t-midqual":    "QUALIFYING under way (R16 done, QF/SF/Final to come)",
  "t-finalleft":  "QUALIFYING nearly done — only the Final left",
  "t-qualdone":   "QUALIFIER FINAL COMPLETE (Bronze never played)",
  "t-mainstart":  "MAIN DRAW STARTS while qualifier rows remain open",
  "t-noqual":     "NO QUALIFIER events in the feed",
};

const row = (r: Row, i: number) => ({
  matchUuid: `m${i}-${r.round}`, matchNumber: i * 10 + r.round, roundNumber: r.round, roundText: r.roundText,
  inBracketType: r.type, bracketFormatId: 1,
  matchStart: r.started || r.done ? "2026-08-31T14:00:00Z" : null,
  matchCompleted: r.done ? "2026-08-31T15:00:00Z" : null,
  scoreFormatGameBestOutOf: 3,
  teamOnePlayerOneFirstName: "A", teamOnePlayerOneLastName: "One",
  teamTwoPlayerOneFirstName: "B", teamTwoPlayerOneLastName: "Two",
  teamOneGameOneScore: r.done ? 11 : 0, teamTwoGameOneScore: r.done ? 4 : 0,
  teamOneGameTwoScore: r.done ? 11 : 0, teamTwoGameTwoScore: r.done ? 6 : 0,
  teamOneGameThreeScore: 0, teamTwoGameThreeScore: 0,
  winner: r.done ? 1 : undefined,
});

const fetched: string[] = [];
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  fetched.push(url);
  const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { "content-type": "application/json" } });
  const mm = /tournaments\/([^/]+)\/tournament_events(?:\/([^?]+))?/.exec(url);
  if (!mm) return json({ results: [] });
  const sc = SCENARIOS[mm[1]];
  if (!sc) return json({ results: [] });
  if (!mm[2]) return json({ results: sc.qual.length ? EVENTS : EVENTS.filter((e) => e.eventType === "MAIN_EVENT_TYPE") });
  const rows = mm[2] === "qual-md" ? sc.qual : sc.main;
  return json({ results: rows.map(row) });
}) as typeof fetch;

async function main() {
  let pass = 0, fail = 0;
  for (const id of Object.keys(SCENARIOS)) {
    fetched.length = 0;
    const { stage, divisions } = await getBracketIndex(id);
    const ok = stage === EXPECT[id];
    const calls = new Set(fetched.filter((u) => /tournament_events\/[a-z-]+$/.test(u))).size;
    console.log(`${ok ? "PASS" : "FAIL"}  ${LABEL[id].padEnd(54)} stage=${stage.padEnd(9)} expected=${EXPECT[id].padEnd(9)} divisions=${divisions.length} drawFetches=${calls}`);
    ok ? pass++ : fail++;
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}
void main();
