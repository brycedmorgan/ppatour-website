/**
 * Per-division World Pickleball Rankings (singles / doubles / mixed) for an
 * athlete, from the Pickleball.com partner_rankings boards.
 *
 *   GET {base}/v2/data/partner_rankings?partner=ppa&division_type={dt}&gender={M|F}
 *       &race=false&is_live=false&bracket_level_id=2&rank={today}&page_size=250
 *
 * division_type — CORRECTED 2026-07-29, matching pickleball.com's own frontend
 * (`getPlayersRankingsHistory`) and proven by the weighting identity below:
 *   1 = Women's Singles · 2 = Men's Singles · 3 = MIXED DOUBLES (split by the
 *   gender param) · 4 = WOMEN'S DOUBLES · 5 = MEN'S DOUBLES.
 * Singles and gender-doubles encode gender in the division_type itself and
 * IGNORE the gender param; only Mixed (3) uses it. 8 = the combined World
 * Pickleball Ranking used elsewhere.
 *
 * ⚠️ This file previously had 3 and 4/5 swapped (3 read as "doubles", 4/5 as
 * "mixed"), which silently mislabeled every athlete page's discipline ranks.
 * Proof of the corrected mapping: for ALL 2,033 ranked pros,
 *   WPR = 0.5·(4|5 doubles) + 0.35·(3 mixed) + 0.15·(1|2 singles)
 * reproduces the official combined points EXACTLY (Ben Johns
 * 0.5·21800 + 0.35·23300 + 0.15·1600 = 19295 ✓). Under the old mapping it
 * matched only 224 of 1,296 men. Empirically: dt4 returns women and dt5 men
 * whatever gender you pass; dt3 splits 610 M / 556 F.
 *
 * Boards are identical for every athlete, so each (division_type, gender) board
 * is fetched once and cached; per-athlete lookups just read the shared index.
 * Server-only. Never throws — returns {} on any problem. Top 250 per board,
 * which covers the ranked pros we feature.
 */
import { pbGetJson } from "@/lib/pb-fetch";
import { RANKINGS_CACHE_TAG } from "@/lib/cache-tags";
import wprSnapshot from "@/lib/data/wpr-snapshot.json";

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

/**
 * One division board out of the on-disk snapshot, or null to fall back to the
 * live call. Mirrors `snapshotBoard` in lib/rankings-api.ts — same file, same
 * expiry rule, so the two cannot disagree about whether the snapshot is usable.
 */
const SNAPSHOT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type SnapshotDivisionRow = { player_slug: string; ranking?: string; points?: number };

function snapshotDivision(dt: number, gender: "M" | "F"): SnapshotDivisionRow[] | null {
  const snap = wprSnapshot as {
    generatedAt?: string;
    divisions?: Record<string, SnapshotDivisionRow[]>;
  };
  const rows = snap.divisions?.[`${dt}:${gender}`];
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const age = Date.now() - Date.parse(snap.generatedAt ?? "");
  if (!Number.isFinite(age) || age > SNAPSHOT_MAX_AGE_MS) return null;
  return rows;
}

async function fetchBoard(dt: number, gender: "M" | "F"): Promise<Map<string, DivisionRank>> {
  const key = `${dt}:${gender}`;
  const hit = boardCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const pending = boardInFlight.get(key);
  if (pending) return pending;

  const p = (async () => {
    const { token, base } = config();
    const out = new Map<string, DivisionRank>();

    // ⚠ SNAPSHOT FIRST. Every athlete page render calls getDivisionRanks, which
    // pulls three of these boards — and that was the ENTIRE remainder of the
    // partner_rankings traffic once the WPR boards moved to disk on 9/5
    // (/athletes/[slug] went ~5,000 calls/hour to ~660, and this was the 660).
    // Reading them from the same snapshot takes a page render to zero ranking
    // requests. Falls through to the live call below when the snapshot is
    // absent or expired, exactly as lib/rankings-api.ts does.
    const snapRows = snapshotDivision(dt, gender);
    if (snapRows) {
      for (const row of snapRows) {
        const slug = row.player_slug;
        const rank = Number.parseInt(row.ranking ?? "", 10);
        if (slug && Number.isFinite(rank)) out.set(slug, { rank, points: row.points ?? 0 });
      }
      if (out.size > 0) boardCache.set(key, { value: out, expires: Date.now() + TTL_MS });
      return out;
    }

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
      tags: [RANKINGS_CACHE_TAG],
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
  // Gender doubles is 4 (women) / 5 (men); mixed is 3, the only one that uses
  // the gender param. Do NOT swap these — see the header note.
  const doublesDt = gender === "female" ? 4 : 5;
  const [singlesBoard, doublesBoard, mixedBoard] = await Promise.all([
    fetchBoard(singlesDt, g),
    fetchBoard(doublesDt, g),
    fetchBoard(3, g),
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
