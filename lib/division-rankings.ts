/**
 * Per-division World Pickleball Rankings (singles / doubles / mixed) for an
 * athlete, from the Pickleball.com partner_rankings boards.
 *
 *   GET {base}/v2/data/partner_rankings?partner=ppa&division_type={dt}&gender={M|F}
 *       &race=false&is_live=false&bracket_level_id=2&rank={today}&page_size=250
 *
 * division_type (verified against live data): 1 = Women's Singles ·
 * 2 = Men's Singles · 3 = Doubles (split by the gender param) · 4 = Women's
 * Mixed · 5 = Men's Mixed. (Singles + Mixed encode gender in the division_type
 * itself; only Doubles uses the gender param. 8 = combined World Pickleball
 * Ranking used elsewhere.)
 *
 * Boards are identical for every athlete, so each (division_type, gender) board
 * is fetched once and cached; per-athlete lookups just read the shared index.
 * Server-only. Never throws — returns {} on any problem. Top 250 per board,
 * which covers the ranked pros we feature.
 */
import { pbGetJson } from "@/lib/pb-fetch";
import { ATHLETES_CACHE_TAG } from "@/lib/cache-tags";

const TIMEOUT_MS = 8000;
const TTL_MS = 6 * 60 * 60 * 1000;
const REVALIDATE_S = 60 * 60 * 24; // Data Cache; the daily cron refreshes it
const PAGE_SIZE = 250;

export type DivisionRank = { rank: number; points: number };
export type AthleteDivisionRanks = {
  singles?: DivisionRank;
  doubles?: DivisionRank;
  mixed?: DivisionRank;
};

function config() {
  const token = process.env.PB_API_TOKEN;
  const base = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
  return { token, base };
}

type ApiPlayer = { ranking?: string; player_slug?: string; points?: number };

const boardCache = new Map<string, { value: Map<string, DivisionRank>; expires: number }>();
const boardInFlight = new Map<string, Promise<Map<string, DivisionRank>>>();

async function fetchBoard(dt: number, gender: "M" | "F"): Promise<Map<string, DivisionRank>> {
  const key = `${dt}:${gender}`;
  const hit = boardCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const pending = boardInFlight.get(key);
  if (pending) return pending;

  const p = (async () => {
    const { token, base } = config();
    const out = new Map<string, DivisionRank>();
    if (!token) return out;
    const today = new Date().toISOString().slice(0, 10);
    const params = new URLSearchParams({
      partner: "ppa",
      division_type: String(dt),
      gender,
      race: "false",
      is_live: "false",
      bracket_level_id: "2",
      rank: today,
      current_page: "1",
      page_size: String(PAGE_SIZE),
    });
    const json = (await pbGetJson(`${base}/v2/data/partner_rankings?${params}`, { "PB-API-TOKEN": token }, {
      timeoutMs: TIMEOUT_MS,
      revalidate: REVALIDATE_S,
      tags: [ATHLETES_CACHE_TAG],
    })) as { results?: { player_rankings?: ApiPlayer[] } } | null;
    for (const p of json?.results?.player_rankings ?? []) {
      const slug = p.player_slug;
      const rank = Number.parseInt(p.ranking ?? "", 10);
      if (slug && Number.isFinite(rank)) out.set(slug, { rank, points: p.points ?? 0 });
    }
    // Only cache a populated board — never poison the cache with an empty result
    // from a transient timeout/error (the next lookup retries instead).
    if (out.size > 0) boardCache.set(key, { value: out, expires: Date.now() + TTL_MS });
    return out;
  })();

  boardInFlight.set(key, p);
  try {
    return await p;
  } finally {
    boardInFlight.delete(key);
  }
}

export async function getDivisionRanks(
  slug: string,
  gender: "male" | "female" | null,
): Promise<AthleteDivisionRanks> {
  if (!gender) return {};
  const g: "M" | "F" = gender === "female" ? "F" : "M";
  const singlesDt = gender === "female" ? 1 : 2;
  const mixedDt = gender === "female" ? 4 : 5;
  const [singlesBoard, doublesBoard, mixedBoard] = await Promise.all([
    fetchBoard(singlesDt, g),
    fetchBoard(3, g),
    fetchBoard(mixedDt, g),
  ]);
  const out: AthleteDivisionRanks = {};
  const s = singlesBoard.get(slug);
  const d = doublesBoard.get(slug);
  const m = mixedBoard.get(slug);
  if (s) out.singles = s;
  if (d) out.doubles = d;
  if (m) out.mixed = m;
  return out;
}
