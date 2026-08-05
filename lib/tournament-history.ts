/**
 * PPA Tour tournament history — every completed tour stop with its champion,
 * runner-up and third place in all five pro divisions.
 *
 * ── HOW IT STAYS CURRENT ─────────────────────────────────────────────────────
 * Two layers, because neither alone does the job:
 *
 *   1. `lib/data/tournament-history.json` — the record, built by
 *      `scripts/gen-tournament-history.mjs`. 2020 through early 2023 comes from
 *      the tour's own published archive (the `ppa_tournaments` feed does not go
 *      back that far); everything after that is distilled from the feed. Read
 *      synchronously, costs nothing, and is what renders on a cold cache.
 *
 *   2. A live TAIL — any tour stop that has completed since that file was last
 *      generated. Wesley's ask was that the page update itself when a tournament
 *      finishes, and a committed file can't do that on its own. So we ask the
 *      calendar what has completed, keep only stops newer than the newest row we
 *      already hold, and fetch their podium.
 *
 * The tail is deliberately small and self-limiting: normally it is EMPTY (the
 * file is current), it is capped at TAIL_LIMIT stops, and it never throws — a
 * failure just means the page renders the committed record, which is never
 * wrong, only short. Re-running the generator folds the tail in permanently and
 * takes the runtime cost back to zero.
 *
 * Server-only (the tail reads PB_API_TOKEN).
 */
import { EVENTS_CACHE_TAG } from "@/lib/events-api";
import raw from "@/lib/data/tournament-history.json";

export type DivisionResult = {
  division: string;
  champion: string;
  /** "" when the source has no runner-up (rained-out finals, etc.). */
  runnerUp: string;
  /** "" when no third place was awarded — the tour dropped the third-place
   *  match, so recent stops legitimately have none. */
  third: string;
};

export type HistoryEvent = {
  /** Finals date — what the tour's own archive sorts and dates events by. */
  endDate: string;
  startDate?: string;
  name: string;
  divisions: DivisionResult[];
  uuid?: string;
  resultsUrl?: string;
  /** e.g. "Rained Out" — why a podium is short. */
  note?: string;
};

const COMMITTED = raw as HistoryEvent[];

/** Display order, matching the event page's DIVISIONS list. */
export const DIVISION_ORDER = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
] as const;

/* ------------------------------------------------------------------ the tail */

/**
 * ⚠ KEPT IN STEP WITH `scripts/gen-tournament-history.mjs` BY HAND. That script
 * holds the authoritative copy of this rule — it is the one that was verified
 * against all 116 events the tour publishes (0 false positives, 0 false
 * negatives across 2024-2026). If you change one, change both.
 */
const TOUR_ORGS = new Set(["Pro Pickleball Association", "United Pickleball Association"]);
const NOT_A_TOUR_STOP =
  /\bchallenger\b|\bclassic\b|collegiate|college pickleball|makeup|\bqualifier\b|\bjunior\b|\bsenior\b|\bcamp\b|clinic|amateur|minor league|the dink\b|\bmoneyball\b|\bpro-?am\b|\bteam\b/i;
const JUNK_TITLE = /additional events|\btemplate\b|\btest event\b|\bTBD\b/i;
const MIN_DAYS = 4;

/** Hard ceiling on live podium fetches per render. One response can be ~3 MB
 *  (it carries every amateur and junior division too), so this is a cost stop,
 *  not a correctness one. If it ever bites, the generator is overdue. */
const TAIL_LIMIT = 6;

/** 24h, refreshed by the same daily cron that refreshes the calendar. */
const REVALIDATE_SECONDS = 60 * 60 * 24;

type ApiRow = {
  tournament_uuid: string;
  title: string;
  organization_name: string;
  start_date: string;
  end_date: string;
  tournament_status: string;
  is_canceled: boolean;
  is_stub: boolean;
  is_advertise_only: boolean;
  details_url: string;
};

type PodiumRow = {
  BracketLevelTitle?: string;
  NoMedalWasAwarded?: boolean;
  PlayerGroupTitle?: string;
  FormatTitle?: string;
  Title?: string;
  SubTitle?: string;
  GoldTeamName?: string;
  SilverTeamName?: string;
  BronzeTeamName?: string;
};

function config() {
  return {
    token: process.env.PB_API_TOKEN,
    baseUrl: (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, ""),
  };
}

function inclusiveDays(startIso: string, endIso: string): number {
  if (!startIso || !endIso) return 0;
  const ms = Date.parse(endIso) - Date.parse(startIso);
  return Number.isNaN(ms) ? 0 : Math.floor(ms / 86_400_000) + 1;
}

function isTourStop(t: ApiRow): boolean {
  if (t.is_canceled || t.is_stub || t.is_advertise_only) return false;
  if (t.tournament_status !== "Completed") return false;
  if (!TOUR_ORGS.has(t.organization_name)) return false;
  if (JUNK_TITLE.test(t.title) || NOT_A_TOUR_STOP.test(t.title)) return false;
  return inclusiveDays(t.start_date, t.end_date) >= MIN_DAYS;
}

/** Same cleanup as lib/events-api.ts, so a stop reads identically everywhere. */
function cleanTitle(title: string): string {
  return title
    .replace(/^PPA Tour:\s*/i, "")
    .replace(/^\d{4}\s+/, "")
    .replace(/\s*@\s*[^@]+$/, "")
    .replace(/^(Australia|Asia|Italy|Spain|Canada|USA)\s+(?=\S)/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function divisionLabel(row: PodiumRow): string | null {
  const group = (row.PlayerGroupTitle ?? "").trim().toLowerCase();
  const format = (row.FormatTitle ?? "").trim().toLowerCase();
  if (group === "mixed") return "Mixed Doubles";
  const who = group === "mens" ? "Men's" : group === "womens" ? "Women's" : null;
  const what = format === "singles" ? "Singles" : format === "doubles" ? "Doubles" : null;
  return who && what ? `${who} ${what}` : null;
}

const team = (s: string | undefined) => (s ?? "").trim().replace(/\s*&\s*/g, " / ");

/**
 * ⚠ A DIVISION CAN HAVE MORE THAN ONE MEDAL-BEARING PRO DRAW, AND THE FIRST IS
 * NOT ALWAYS THE CHAMPIONSHIP. The PPA Finals runs an open "Pro Main Draw" off a
 * Monday qualifier AND a "Pro Top 8 Ranked" invitational round-robin; the
 * invitational is the Finals. Taking the first row got all five 2026 divisions
 * wrong. Kept in step with scripts/gen-tournament-history.mjs, which carries the
 * full note and the measurement behind it.
 */
const CHAMPIONSHIP_DRAW = /\btop\s*\d+\b|\bchampionship\b|\binvitational\b/i;
const BY_INVITATION = /by\s+invitation/i;

function pickChampionshipDraw(rows: PodiumRow[]): PodiumRow {
  if (rows.length === 1) return rows[0];
  return (
    rows.find(
      (r) => CHAMPIONSHIP_DRAW.test(r.Title ?? "") || BY_INVITATION.test(r.SubTitle ?? ""),
    ) ?? rows[0]
  );
}

/**
 * The podium for one tournament.
 *
 * A direct `fetch` rather than `lib/pb-fetch`'s `pbGetJson`, because this is the
 * stored-procedure gateway and needs a POST body, which that helper does not
 * carry. Same Data Cache treatment and tag, so the daily events cron refreshes
 * it; responses over Next's 2 MB cache ceiling simply don't get stored, which is
 * why the tail is capped.
 */
async function fetchPodium(uuid: string): Promise<DivisionResult[]> {
  const { token, baseUrl } = config();
  if (!token) return [];
  try {
    const res = await fetch(`${baseUrl}/v1/pb_data/json?sp_name=API_v2_Tourney_GetEvents`, {
      method: "POST",
      headers: { "PB-API-TOKEN": token, "Content-Type": "application/json" },
      body: JSON.stringify({ EventID: uuid }),
      next: { revalidate: REVALIDATE_SECONDS, tags: [EVENTS_CACHE_TAG] },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { payload?: PodiumRow[] };
    // Collect candidates per division, then choose — see pickChampionshipDraw.
    // Pro only: the payload also carries Amateur, Junior and Senior Pro, and
    // every division has a medal-less qualifier row that would render blank.
    const byDivision = new Map<string, PodiumRow[]>();
    for (const row of json.payload ?? []) {
      if (row.BracketLevelTitle !== "Pro") continue;
      if (row.NoMedalWasAwarded) continue;
      if (!team(row.GoldTeamName)) continue;
      const division = divisionLabel(row);
      if (!division) continue;
      const list = byDivision.get(division);
      if (list) list.push(row);
      else byDivision.set(division, [row]);
    }
    return DIVISION_ORDER.filter((d) => byDivision.has(d)).map((d) => {
      const row = pickChampionshipDraw(byDivision.get(d)!);
      return {
        division: d,
        champion: team(row.GoldTeamName),
        runnerUp: team(row.SilverTeamName),
        third: team(row.BronzeTeamName),
      };
    });
  } catch {
    return [];
  }
}

/** Stops that finished after the committed record was generated. */
async function tail(newestCommitted: string): Promise<HistoryEvent[]> {
  const { token, baseUrl } = config();
  if (!token) return [];
  try {
    const res = await fetch(`${baseUrl}/v2/data/ppa_tournaments?current_page=1&page_size=300`, {
      headers: { "PB-API-TOKEN": token },
      next: { revalidate: REVALIDATE_SECONDS, tags: [EVENTS_CACHE_TAG] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { results?: { tournaments?: ApiRow[] } };
    const known = new Set(COMMITTED.map((e) => e.uuid).filter(Boolean));

    const fresh = (json.results?.tournaments ?? [])
      .filter(isTourStop)
      .filter((t) => t.end_date.slice(0, 10) > newestCommitted)
      .filter((t) => !known.has(t.tournament_uuid))
      .sort((a, b) => b.end_date.localeCompare(a.end_date))
      .slice(0, TAIL_LIMIT);
    if (fresh.length === 0) return [];

    const built = await Promise.all(
      fresh.map(async (t): Promise<HistoryEvent | null> => {
        const divisions = await fetchPodium(t.tournament_uuid);
        if (divisions.length === 0) return null;
        return {
          endDate: t.end_date.slice(0, 10),
          startDate: t.start_date.slice(0, 10),
          // The published archive can't name a stop that just finished, so the
          // feed title is all we have. Re-run the generator to pick up the
          // tour's own billing (see the note in that script).
          name: cleanTitle(t.title),
          divisions,
          uuid: t.tournament_uuid,
          ...(t.details_url ? { resultsUrl: t.details_url.replace(/\/$/, "") } : {}),
        };
      }),
    );
    return built.filter((e): e is HistoryEvent => e !== null);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------- reading */

/** The committed record alone — synchronous, always available. */
export function committedHistory(): HistoryEvent[] {
  return COMMITTED;
}

/**
 * The full record, newest finals first: the committed archive plus any stop that
 * has completed since it was generated.
 */
export async function getTournamentHistory(): Promise<HistoryEvent[]> {
  const newest = COMMITTED[0]?.endDate ?? "1970-01-01";
  const fresh = await tail(newest);
  if (fresh.length === 0) return COMMITTED;
  return [...fresh, ...COMMITTED].sort((a, b) => b.endDate.localeCompare(a.endDate));
}

/** Champion per division for one event, in DIVISION_ORDER. */
export function championsOf(event: HistoryEvent): DivisionResult[] {
  const by = new Map(event.divisions.map((d) => [d.division, d]));
  return DIVISION_ORDER.filter((d) => by.has(d)).map((d) => by.get(d)!);
}

/** Seasons present in the record, newest first. */
export function seasonsOf(events: HistoryEvent[]): string[] {
  return [...new Set(events.map((e) => e.endDate.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
}

/** How many stops each pro has won, across every division. Ties broken by name. */
export function titleLeaders(
  events: HistoryEvent[],
  limit = 10,
): { name: string; titles: number }[] {
  const count = new Map<string, number>();
  for (const e of events) {
    for (const d of e.divisions) {
      // A doubles champion is "A / B" — both players won the title.
      for (const p of d.champion.split(" / ")) {
        const name = p.trim();
        if (!name) continue;
        count.set(name, (count.get(name) ?? 0) + 1);
      }
    }
  }
  return [...count.entries()]
    .map(([name, titles]) => ({ name, titles }))
    .sort((a, b) => b.titles - a.titles || a.name.localeCompare(b.name))
    .slice(0, limit);
}
