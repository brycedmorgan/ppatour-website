/**
 * Has a tournament's pro draw been published, and who is in it?
 *
 *   GET {base}/v1/ppa/tournaments/{uuid}/tournament_events?bracket_level=Pro
 *   GET {base}/v1/ppa/tournaments/{uuid}/tournament_events/{eventId}
 *
 * The ten pro division shells (5 main draws + 5 qualifiers) exist as soon as an
 * event is on the calendar, but they hold **zero matches and no player names
 * until the draw drops — typically event week** (verified 2026-07-29 against
 * Nationals, Arizona, Las Vegas and Virginia Beach, all 10 shells / 0 matches).
 * There is no entry-list endpoint we're authorized for, so a published draw is
 * the earliest point we can honestly say who is playing.
 *
 * That's why "Players to Watch" is gated on this: before the draw we would be
 * guessing, so the column is hidden rather than filled with generic names.
 *
 * Server-only. Never throws — returns an empty field on any problem, which reads
 * as "no draw yet" and hides the column.
 */
import { pbGetJson } from "@/lib/pb-fetch";

/** Draws drop mid-week without warning, so keep this fresher than a day. */
const REVALIDATE_S = 60 * 30;
const TIMEOUT_MS = 8000;

export type FieldPlayer = {
  /** API player_slug is absent from the match feed, so name is the join key. */
  name: string;
  /** Best (lowest) seed the player carries across their divisions, if any. */
  seed: number | null;
  /** Division titles they appear in, e.g. ["Men's Doubles", "Mixed Doubles"]. */
  divisions: string[];
};

export type EventField = {
  /** True once any pro main draw carries matches with named players. */
  published: boolean;
  players: FieldPlayer[];
};

const EMPTY: EventField = { published: false, players: [] };

type ApiEvent = { eventId?: string; eventType?: string; divisionType?: string };
type ApiMatch = Record<string, unknown>;

function config() {
  const token = process.env.PB_API_TOKEN;
  const base = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
  return { token, base };
}

function str(m: ApiMatch, key: string): string {
  const v = m[key];
  return typeof v === "string" ? v.trim() : "";
}

function num(m: ApiMatch, key: string): number | null {
  const v = m[key];
  const n = typeof v === "number" ? v : typeof v === "string" && v !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** WOMENS_DOUBLES_DIVISION_TYPE → "Women's Doubles". */
function divisionLabel(divisionType: string | undefined): string {
  switch (divisionType) {
    case "MENS_SINGLES_DIVISION_TYPE":
      return "Men's Singles";
    case "WOMENS_SINGLES_DIVISION_TYPE":
      return "Women's Singles";
    case "MENS_DOUBLES_DIVISION_TYPE":
      return "Men's Doubles";
    case "WOMENS_DOUBLES_DIVISION_TYPE":
      return "Women's Doubles";
    case "MIXED_DOUBLES_DIVISION_TYPE":
      return "Mixed Doubles";
    default:
      return "";
  }
}

const NAME_SLOTS: [string, string, string][] = [
  ["teamOnePlayerOneFirstName", "teamOnePlayerOneLastName", "teamOneSeed"],
  ["teamOnePlayerTwoFirstName", "teamOnePlayerTwoLastName", "teamOneSeed"],
  ["teamTwoPlayerOneFirstName", "teamTwoPlayerOneLastName", "teamTwoSeed"],
  ["teamTwoPlayerTwoFirstName", "teamTwoPlayerTwoLastName", "teamTwoSeed"],
];

/**
 * The pro field for a tournament — every named player in the published main
 * draws, with their best seed. `published: false` (and an empty list) whenever
 * the draw isn't out, the token is unset, or anything fails.
 *
 * Qualifiers are skipped: a qualifier entrant isn't in the main draw yet, so
 * featuring them as one to watch would be wrong.
 */
export async function getEventField(uuid: string | undefined): Promise<EventField> {
  if (!uuid) return EMPTY;
  const { token, base } = config();
  if (!token) return EMPTY;

  const opts = { timeoutMs: TIMEOUT_MS, revalidate: REVALIDATE_S };
  const listed = (await pbGetJson(
    `${base}/v1/ppa/tournaments/${uuid}/tournament_events?bracket_level=Pro`,
    { "PB-API-TOKEN": token },
    opts,
  )) as { results?: ApiEvent[] } | null;

  const mains = (listed?.results ?? []).filter((e) => e.eventType === "MAIN_EVENT_TYPE" && e.eventId);
  if (!mains.length) return EMPTY;

  const byName = new Map<string, FieldPlayer>();
  for (const ev of mains) {
    const detail = (await pbGetJson(
      `${base}/v1/ppa/tournaments/${uuid}/tournament_events/${ev.eventId}`,
      { "PB-API-TOKEN": token },
      opts,
    )) as { results?: ApiMatch[] } | null;

    const division = divisionLabel(ev.divisionType);
    for (const m of detail?.results ?? []) {
      for (const [firstKey, lastKey, seedKey] of NAME_SLOTS) {
        const name = [str(m, firstKey), str(m, lastKey)].filter(Boolean).join(" ");
        if (!name) continue;
        const seed = num(m, seedKey);
        const existing = byName.get(name);
        if (existing) {
          if (seed != null && (existing.seed == null || seed < existing.seed)) existing.seed = seed;
          if (division && !existing.divisions.includes(division)) existing.divisions.push(division);
        } else {
          byName.set(name, { name, seed, divisions: division ? [division] : [] });
        }
      }
    }
  }

  const players = [...byName.values()];
  return { published: players.length > 0, players };
}
