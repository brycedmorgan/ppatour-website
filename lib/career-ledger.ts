/**
 * The career ledger (server-only): every finished PPA tour stop's main-draw
 * matches, for every player, in one stored value — what the profile's Stats
 * and Tournament Results sections read (lib/player-career).
 *
 * Wesley, 11/9: profile stats "similar to pickleball.com/players/<slug>/stats",
 * plus a results section with a dropdown of every tournament a pro has played.
 *
 * ⚠ THERE IS NO PER-PLAYER STATS ENDPOINT FOR OUR TOKEN. Probed 11/9 with
 * PB_API_TOKEN: `users/{id}/player_stats`, `/stats`, `/match_stats`,
 * `/win_loss`, `/tournaments`, `/results`, `/matches`, `/titles_and_finals` and
 * `data/player_stats` all 403 "Access denied for this platform"; only
 * `player_medals` answers. pickleball.com renders its Stats tab server-side
 * from its own database. So the numbers are counted here, from the draws.
 *
 * ⚠ BUILT SLOWLY ON PURPOSE, BY A CRON, NEVER ON A PAGE REQUEST. One stop is
 * one index call plus one call per division (lib/brackets-api), and there are
 * ~110 finished stops since the feed starts (May 2023). A straight scan on
 * 11/9 took 142s and then came back empty for most stops — the partner API
 * throttles (429, "platform access denied: platformID=9"), and the upstream
 * team has alerted on us before (see lib/pb-cache). `advanceLedger` adds a few
 * stops per run, one at a time with a pause between them, and stops at the
 * first stop that does not load. Backfill takes a few hours of cron runs;
 * after that a run only adds the stop that just finished.
 *
 * ⚠ A STOP IS STORED ONLY WHEN EVERY DIVISION LOADED. A throttled division
 * builds as an empty draw, and storing that would silently drop matches from
 * every pro's career forever. A stop with no divisions at all is retried, and
 * after {@link EMPTY_AFTER_TRIES} runs it is recorded as having none (PickleSlam,
 * "PLAY - Pro-Am…": feed rows with a pro tier and no pro draw).
 *
 * ⚠ KEYED BY NAME, like everything the draws carry (see lib/player-history):
 * the draws name players, they do not identify them.
 */
import { getEvents } from "@/lib/events-api";
import { eventHref, hasTournamentEnded, isTourStop, type Tournament } from "@/lib/placeholder-data";
import { getBracketDraw, getBracketIndex, getFreshBracketDraws, isEmptyDraw, type BracketDraw } from "@/lib/brackets-api";
import type { Bracket, BracketDivision } from "@/lib/bracket-types";
import { pbCacheConfigured, readStored, storedVersion, writeStored } from "@/lib/pb-cache";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Local dev has no DATABASE_URL, so nothing reaches api_cache. There the
 * ledger lives in a file under .next/cache (gitignored), so the profile can be
 * built and checked on a dev server. Production always uses the database.
 */
const DEV_FILE = path.join(process.cwd(), ".next", "cache", "career-ledger.json");
const fileStore = () => !pbCacheConfigured() && process.env.NODE_ENV !== "production";

async function readLedgerRow(strict: boolean, timeoutMs: number): Promise<{ value: unknown; updatedAt: string } | null> {
  if (!fileStore()) return readStored(CAREER_LEDGER_KEY, { timeoutMs, strict });
  try {
    const [body, st] = await Promise.all([fs.readFile(DEV_FILE, "utf8"), fs.stat(DEV_FILE)]);
    return { value: JSON.parse(body), updatedAt: st.mtime.toISOString() };
  } catch {
    return null;
  }
}

async function ledgerVersion(): Promise<string | null> {
  if (!fileStore()) return storedVersion(CAREER_LEDGER_KEY);
  return fs.stat(DEV_FILE).then((st) => st.mtime.toISOString(), () => null);
}

async function writeLedgerRow(ledger: Ledger): Promise<boolean> {
  if (!fileStore()) return writeStored(CAREER_LEDGER_KEY, CAREER_LEDGER_TAG, ledger, STORE_TTL_S);
  try {
    await fs.mkdir(path.dirname(DEV_FILE), { recursive: true });
    // Temp file + rename, so a reader never sees a half-written file.
    await fs.writeFile(`${DEV_FILE}.tmp`, JSON.stringify(ledger));
    await fs.rename(`${DEV_FILE}.tmp`, DEV_FILE);
    return true;
  } catch {
    return false;
  }
}

export const CAREER_LEDGER_KEY = "career-ledger:v1";
export const CAREER_LEDGER_TAG = "career-ledger";
/** Five years — the row is rewritten by every run that adds a stop. */
const STORE_TTL_S = 5 * 365 * 24 * 60 * 60;
const EMPTY_AFTER_TRIES = 4;
const FAIL_AFTER_TRIES = 4;

export type DivisionKind = "doubles" | "mixed" | "singles";

/** One finished match. Teams are indexes into `Ledger.players`. */
export type LedgerMatch = {
  id: string;
  round: string;
  stage: "pools" | "bracket" | "losers";
  a: number[];
  b: number[];
  /** Seeds, when the draw carries them. */
  sa?: number;
  sb?: number;
  /** Per-game points; unplayed games dropped. */
  ga: number[];
  gb: number[];
  /** 1 = side a won, 2 = side b won. */
  w: 1 | 2;
  /** Decided without being played. */
  wo?: 1;
};

export type LedgerDivision = {
  name: string;
  kind: DivisionKind;
  /** Placed teams as player indexes, from the feed's podium fields. */
  gold?: number[];
  silver?: number[];
  bronze?: number[];
  matches: LedgerMatch[];
};

export type LedgerStop = {
  eventId: string;
  name: string;
  href: string | null;
  startDate: string;
  endDate: string;
  logoUrl: string | null;
  international: boolean;
  divisions: LedgerDivision[];
  /** When this copy was read from the API. */
  pulledAt?: string;
  /** Locked: pulled after the stop settled (see SETTLE_DAYS), never read again. */
  final?: true;
};

export type Ledger = {
  version: 1;
  builtAt: string;
  players: string[];
  stops: LedgerStop[];
  /** Stops that loaded with no divisions, and how many runs saw that. */
  emptyTries: Record<string, number>;
  /**
   * Stops where a division would not load, and how many runs saw that while
   * other stops loaded fine. After {@link FAIL_AFTER_TRIES} the stop is stored
   * with the divisions that do load (Boise 2023: every draw comes back empty).
   */
  failTries?: Record<string, number>;
};

/**
 * The pro main draw a division is, as "Women's Doubles", or null when it is
 * not one. Only the five pro main draws count.
 *
 * The feed names them many ways: "Women's Doubles", "Pro Mixed Doubles",
 * "PRO WOMEN'S DOUBLES - MAIN DRAW", "Pro Men's Doubles Skill: (Any) Age:
 * (Any)" (PPA Asia), "Pro Women's Doubles: 5.0 And Above" (PPA Australia).
 * Kept out: Masters 50+ and senior draws, qualifiers, amateur draws rated
 * under 5.0 ("Open Women's Doubles (4.0 And Above)"), and Las Vegas 2023's
 * separate "Men's Doubles Pro PPA Points Draw".
 */
export function mainProDivision(raw: string): string | null {
  const s = raw.replace(/[\u2019`]/g, "'").trim();
  if (/qualif|masters|senior|junior|amateur|points draw|\b\d{2}\s*\+/i.test(s)) return null;
  // A rating under 5.0 marks an amateur draw ("Open … (4.0 And Above)") —
  // unless the draw is labelled Pro: PPA Australia's pro main draws read
  // "Pro Women's Doubles Main Draw (4.5+)".
  if (/\b[1-4]\.\d/.test(s) && !/\bpro\b/i.test(s)) return null;
  // "Pro" can also sit in the middle: "Women's Pro Doubles Main Draw" (2023 Nationals).
  const m = /^(?:pro\s+)?(men's|women's|mixed)\s+(?:pro\s+)?(doubles|singles)\b/i.exec(s);
  if (!m) return null;
  const cap = (w: string) => w[0].toUpperCase() + w.slice(1).toLowerCase();
  return `${cap(m[1])} ${cap(m[2])}`;
}

export function divisionKind(name: string): DivisionKind {
  if (/mixed/i.test(name)) return "mixed";
  if (/singles/i.test(name)) return "singles";
  return "doubles";
}

/** Stops the ledger should hold: finished tour stops with a draw to read. */
export async function ledgerStops(now?: number): Promise<Tournament[]> {
  const { events } = await getEvents();
  return events
    .filter(
      (t) =>
        isTourStop(t) &&
        t.tournamentUuid &&
        hasTournamentEnded(t, now) &&
        // College-tour events carry a pro tier in the feed; no pro plays them.
        // ("Adidas Collegiate World Championships" is one.)
        !/colleg(e|iate)/i.test(t.name),
    )
    .sort((a, b) => b.endDate.localeCompare(a.endDate));
}

class Names {
  private index = new Map<string, number>();
  list: string[];
  constructor(list: string[]) {
    this.list = list;
    list.forEach((n, i) => this.index.set(n, i));
  }
  id(name: string): number {
    let i = this.index.get(name);
    if (i === undefined) {
      i = this.list.length;
      this.list.push(name);
      this.index.set(name, i);
    }
    return i;
  }
  team(name: string | undefined): number[] {
    return (name ?? "")
      .split(" / ")
      .map((n) => n.trim())
      .filter(Boolean)
      .map((n) => this.id(n));
  }
}

function matchesOf(b: Bracket | null | undefined, stage: LedgerMatch["stage"], names: Names): LedgerMatch[] {
  if (!b) return [];
  const out: LedgerMatch[] = [];
  for (const r of b.rounds) {
    for (const m of r.matches) {
      const [x, y] = m.sides;
      if (m.status !== "final" || !x.participant || !y.participant) continue;
      if (!x.winner && !y.winner) continue;
      const ga: number[] = [];
      const gb: number[] = [];
      x.games.forEach((g, i) => {
        const o = y.games[i];
        if ((g ?? 0) > 0 || (o ?? 0) > 0) {
          ga.push(g ?? 0);
          gb.push(o ?? 0);
        }
      });
      out.push({
        id: m.id,
        round: r.name,
        stage,
        a: names.team(x.participant.name),
        b: names.team(y.participant.name),
        ...(x.participant.seed ? { sa: x.participant.seed } : {}),
        ...(y.participant.seed ? { sb: y.participant.seed } : {}),
        ga,
        gb,
        w: x.winner ? 1 : 2,
        ...(m.outcome === "walkover" || ga.length === 0 ? { wo: 1 as const } : {}),
      });
    }
  }
  return out;
}

/**
 * When a stop's results are settled: a week after its last day. A stop pulled
 * before then is stored with `final` unset and pulled ONCE more after this
 * (fresh from the API), so a result the feed placed late or a corrected score
 * gets in; then it is locked. Wesley, 11/9: past stops need one pull, the job
 * should only be looking for new ones — this is the one exception, once.
 */
const SETTLE_DAYS = 7;
const settledAt = (endDate: string) => Date.parse(`${endDate}T00:00:00Z`) + (SETTLE_DAYS + 1) * 864e5;

/** One stop, or null when any division failed to load (retry next run). */
async function buildStop(
  t: Tournament,
  names: Names,
  fresh = false,
  /** Keep the divisions that loaded instead of failing the stop. */
  partial = false,
): Promise<LedgerStop | "empty" | null> {
  const eventId = t.tournamentUuid as string;
  let all: BracketDivision[];
  let drawOf: (id: string) => Promise<BracketDraw | null>;
  if (fresh) {
    const built = await getFreshBracketDraws(eventId);
    all = built.divisions;
    drawOf = async (id) => built.draws.get(id) ?? null;
  } else {
    all = (await getBracketIndex(eventId)).divisions;
    drawOf = (id) => getBracketDraw(eventId, id);
  }
  if (!all.length) return "empty";
  const pro = all.filter((d) => mainProDivision(d.name) !== null);
  const loaded = await Promise.all(pro.map((d) => drawOf(d.id)));
  const ok = (d: BracketDraw | null): d is BracketDraw => d !== null && !isEmptyDraw(d);
  if (!partial && !loaded.every(ok)) return null;
  const divisions = pro.filter((_, i) => ok(loaded[i]));
  const draws = loaded.filter(ok);
  if (partial && !divisions.length) return "empty";
  const now = Date.now();
  return {
    pulledAt: new Date(now).toISOString(),
    ...(now >= settledAt(t.endDate) ? { final: true as const } : {}),
    eventId,
    name: t.name,
    href: t.region === "international" ? null : eventHref(t),
    startDate: t.startDate,
    endDate: t.endDate,
    logoUrl: t.logoUrl ?? null,
    international: t.region === "international",
    divisions: divisions.map((d, i) => {
      const draw = draws[i]!;
      const name = mainProDivision(d.name) as string;
      return {
        name,
        kind: divisionKind(name),
        ...(d.gold ? { gold: names.team(d.gold) } : {}),
        ...(d.silver ? { silver: names.team(d.silver) } : {}),
        ...(d.bronze ? { bronze: names.team(d.bronze) } : {}),
        matches: [
          ...matchesOf(draw.pools, "pools", names),
          ...matchesOf(draw.bracket, "bracket", names),
          ...matchesOf(draw.losers, "losers", names),
        ],
      };
    }),
  };
}

const EMPTY_LEDGER = (): Ledger => ({ version: 1, builtAt: "", players: [], stops: [], emptyTries: {} });

/**
 * Add up to `maxStops` missing stops, newest first, one at a time, then
 * re-pull (fresh) any stored stop that has settled since its first pull and
 * lock it. Stops at the first stop that fails to load (the API is throttling — the next run picks up
 * where this one left off) or when `budgetMs` runs out. Writes only if
 * something changed.
 */
export async function advanceLedger(opts: {
  maxStops?: number;
  budgetMs?: number;
  pauseMs?: number;
  log?: (msg: string) => void;
}): Promise<{
  added: string[];
  rechecked: string[];
  failed: string | null;
  remaining: number;
  total: number;
  written: boolean;
}> {
  const { maxStops = 8, budgetMs = 200_000, pauseMs = 1500, log = () => {} } = opts;
  const started = Date.now();
  // Strict: a slow read must fail the run, not read as "no ledger" and start over.
  const stored = await readLedgerRow(true, 20_000);
  const ledger = (stored?.value as Ledger | undefined)?.version === 1 ? (stored!.value as Ledger) : EMPTY_LEDGER();
  const names = new Names(ledger.players);
  const have = new Set(ledger.stops.map((s) => s.eventId));
  const done = (uuid: string) => have.has(uuid) || (ledger.emptyTries[uuid] ?? 0) >= EMPTY_AFTER_TRIES;
  const added: string[] = [];
  const rechecked: string[] = [];
  let failed: string | null = null;
  let changed = false;
  const emptyThisRun: string[] = [];
  let emptyInARow = 0;
  const failTries = (ledger.failTries ??= {});
  const failsThisRun: string[] = [];
  let failInARow = 0;

  const feed = await ledgerStops();
  const todo = feed.filter((t) => !done(t.tournamentUuid as string));
  // Stored but not locked, and now settled: due their one fresh re-pull.
  const byId = new Map(feed.map((t) => [t.tournamentUuid as string, t]));
  const recheck: Tournament[] = [];
  for (const s of ledger.stops) {
    if (s.final || Date.now() < settledAt(s.endDate)) continue;
    const t = byId.get(s.eventId);
    if (t) recheck.push(t);
    else {
      // Gone from the feed: nothing left to re-read. Lock what we have.
      s.final = true;
      changed = true;
    }
  }

  // Re-checks and new stops share `maxStops`. Empty stops are
  // read past (they don't take a slot) so one feed row with no pro draw can't
  // hold up the queue for hours.
  // Stops already seen empty go LAST, so the stops that do load come first and
  // prove the API is answering (which is what lets an empty try count, below).
  // Otherwise three empty feed rows at the front would end every run forever.
  // Stops that failed before (a division would not load) wait at the back too.
  const seenEmpty = (t: Tournament) =>
    (t.tournamentUuid as string) in ledger.emptyTries || (t.tournamentUuid as string) in failTries;
  // Re-checks first: one or two a week, and a correction should land promptly.
  const queue = [
    ...recheck.map((t) => ({ t, again: true })),
    ...todo.filter((t) => !seenEmpty(t)).map((t) => ({ t, again: false })),
    ...todo.filter(seenEmpty).map((t) => ({ t, again: false })),
  ];
  const onlyEmpties = queue.every((q) => !q.again && seenEmpty(q.t));
  for (let k = 0, read = 0; k < queue.length && read < maxStops; k++) {
    if (Date.now() - started > budgetMs) break;
    const { t, again } = queue[k];
    const uuid = t.tournamentUuid as string;
    // Failed enough runs while others loaded: store what does load.
    const partial = !again && (failTries[uuid] ?? 0) >= FAIL_AFTER_TRIES;
    const built = await buildStop(t, names, again, partial).catch(() => null);
    if (again) {
      read++;
      if (!built || built === "empty") {
        // Keep the copy we have; try again next run.
        failed = t.name;
        log(`${t.name}: re-check did not load — stopping this run`);
        break;
      }
      const i = ledger.stops.findIndex((s) => s.eventId === uuid);
      const before = ledger.stops[i].divisions.reduce((n, d) => n + d.matches.length, 0);
      ledger.stops[i] = { ...built, final: true };
      rechecked.push(t.name);
      changed = true;
      log(`${t.name}: re-checked and locked (${before} → ${built.divisions.reduce((n, d) => n + d.matches.length, 0)} matches)`);
      await new Promise((r) => setTimeout(r, pauseMs));
      continue;
    }
    if (built === "empty") {
      // ⚠ An empty index is ALSO what a throttled index call looks like, so a
      // try only counts if another stop loads in this same run (below), and
      // three empties in a row end the run.
      emptyThisRun.push(uuid);
      if (partial) {
        // It failed for good and nothing in it loads: record it as empty.
        ledger.emptyTries[uuid] = EMPTY_AFTER_TRIES;
        delete failTries[uuid];
        changed = true;
      } else if (!(uuid in ledger.emptyTries)) {
        ledger.emptyTries[uuid] = 0;
        changed = true;
      }
      log(`${t.name}: no divisions`);
      if (++emptyInARow >= 3) {
        failed = t.name;
        break;
      }
      await new Promise((r) => setTimeout(r, pauseMs));
      continue;
    }
    emptyInARow = 0;
    read++;
    if (!built) {
      // Skip it and keep going: one stop with a draw that never loads must not
      // hold up every stop behind it (Boise 2023, 11/9). Two in a row looks
      // like throttling, so that ends the run.
      failed = t.name;
      failsThisRun.push(uuid);
      if (!(uuid in failTries)) {
        failTries[uuid] = 0;
        changed = true;
      }
      log(`${t.name}: a division did not load`);
      if (++failInARow >= 2) break;
    } else {
      failInARow = 0;
      ledger.stops.push(built);
      have.add(uuid);
      delete ledger.emptyTries[uuid];
      delete failTries[uuid];
      added.push(t.name);
      changed = true;
      log(`${t.name}: ${built.divisions.reduce((n, d) => n + d.matches.length, 0)} matches`);
    }
    await new Promise((r) => setTimeout(r, pauseMs));
  }
  // An empty try counts when something else loaded this run (the API was
  // answering), or when nothing but known-empty stops is left to read.
  if (added.length || rechecked.length || onlyEmpties) {
    for (const uuid of emptyThisRun) {
      if (uuid in ledger.emptyTries && ledger.emptyTries[uuid] < EMPTY_AFTER_TRIES) ledger.emptyTries[uuid]++;
      changed = true;
    }
    for (const uuid of failsThisRun) {
      failTries[uuid] = (failTries[uuid] ?? 0) + 1;
      changed = true;
    }
  }

  let written = false;
  if (changed) {
    ledger.stops.sort((a, b) => b.endDate.localeCompare(a.endDate));
    ledger.players = names.list;
    ledger.builtAt = new Date().toISOString();
    written = await writeLedgerRow(ledger);
    if (written) memo = { value: ledger, version: ledger.builtAt, checked: Date.now() };
  }
  const remaining = (await ledgerStops()).filter((t) => !done(t.tournamentUuid as string)).length;
  return { added, rechecked, failed, remaining, total: ledger.stops.length, written };
}

/**
 * The stored ledger, memoized per instance. The value is a few MB, so it is
 * re-read only when the row's `updated_at` moves, and that is probed at most
 * every {@link PROBE_MS} (the lib/wpr-snapshot pattern).
 */
const PROBE_MS = 5 * 60 * 1000;
let memo: { value: Ledger; version: string; checked: number } | null = null;
let inflight: Promise<Ledger | null> | null = null;

export async function getLedger(): Promise<Ledger | null> {
  if (memo && Date.now() - memo.checked < PROBE_MS) return memo.value;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const version = await ledgerVersion();
      if (memo && version && version === memo.version) {
        memo.checked = Date.now();
        return memo.value;
      }
      const row = await readLedgerRow(false, 15_000);
      const value = row?.value as Ledger | undefined;
      if (!row || value?.version !== 1) return memo?.value ?? null;
      memo = { value, version: row.updatedAt, checked: Date.now() };
      return value;
    } catch {
      return memo?.value ?? null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
