/**
 * Athlete stats adapter — Pickleball.com player endpoints (server-only).
 *
 *   GET {base}/v1/data/users/{slug}?use_camel_case=true
 *     → profile: uuid, bio facts, DUPR + World Pickleball ratings, games played.
 *   GET {base}/v2/data/users/{uuid}/player_medals?partners=ppa,upa&scope_title=Pro
 *     → career gold/silver/bronze per discipline (PascalCase fields).
 *
 * (The theme's /v2/ppa/player_rankings_flat 52-week/race feed is 403 for our
 * token, so those points aren't included.)
 *
 * header  PB-API-TOKEN: <token>. Never throws — returns null on any problem.
 * Cached 1h (matches the WordPress theme's transients) + in-flight coalescing.
 */
import { pbCachedJson } from "@/lib/pb-cache";
import { ATHLETES_CACHE_TAG } from "@/lib/cache-tags";

const TTL_MS = 60 * 60 * 1000;
const REVALIDATE_S = 60 * 60 * 24; // durable cache; the daily cron refreshes it

export type MedalSet = {
  /** Won it. */
  gold: number;
  /** Lost the final. */
  silver: number;
  /** Third place — WON the bronze match, not "reached the semis". */
  bronze: number;
  /** Fourth place — lost the semi AND the bronze match (`{Div}BronzeLost`). */
  bronzeLost: number;
  /**
   * Reached the semifinals but not the final: `bronze + bronzeLost`.
   *
   * Read from the feed's own `Semifinalist` / `{Div}Semifinalist` where it
   * exists, falling back to `bronze + bronzeLost`.
   *
   * ⚠ THIS IS THE COLUMN THE SITE PRINTS, AND IT USED TO PRINT `bronze` ALONE.
   * Bronze counts only the player who WON the third-place match, so every
   * fourth-place finish vanished — the page showed Ben Johns 6 semifinals where
   * pickleball.com's own player page shows 12, and Tyson McGuffin 14 where it
   * shows 30. Titles and Finals were never affected (gold and silver are
   * complete on their own), which is why the error survived: two of the three
   * numbers agreed with the tour's database. Found 9/1 by diffing our table
   * against pickleball.com/players/<slug>/stats?show=ppa for both pros; the
   * per-division numbers now match it exactly.
   *
   * ⚠ NOT YET CONFIRMED AGAINST `player_medals` ITSELF — `.env.local` has no
   * `PB_API_TOKEN` and `vercel env pull` returns the encrypted vars blank, so
   * this was verified against the same fields as served to pickleball.com's own
   * player page. If `player_medals` omits both `Semifinalist` and `BronzeLost`,
   * every value here falls back to `bronze` and the column silently reverts to
   * the old wrong number. **Check one live profile after deploying.**
   */
  semifinals: number;
};
export type AthleteStats = {
  uuid: string;
  nickname: string | null;
  age: number | null;
  height: string | null; // 5' 6"
  handed: string | null; // "Right" / "Left"
  turnedPro: string | null; // "2019"
  hometown: string | null; // "Boynton Beach, FL"
  country: string | null;
  countryCode: string | null; // lowercase 2-letter for the flag CDN
  dupr: { singles: number | null; doubles: number | null };
  wpr: { singles: number | null; doubles: number | null; mixed: number | null };
  medals: { singles: MedalSet; doubles: MedalSet; mixed: MedalSet; total: MedalSet } | null;
  gamesPlayed: { singles: number | null; doubles: number | null; mixed: number | null };
  /** True if any medal or rating value is present (worth rendering a section). */
  hasStats: boolean;
};

type Obj = Record<string, unknown>;

function config() {
  const token = process.env.PB_API_TOKEN;
  const base = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
  return { token, base };
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}
function posNum(v: unknown): number | null {
  const n = num(v);
  return n != null && n > 0 ? n : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function ageFromDob(dob: unknown): number | null {
  const s = str(dob);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}
function yearOf(iso: unknown): string | null {
  const s = str(iso);
  return s && /^\d{4}/.test(s) ? s.slice(0, 4) : null;
}
function handedLabel(h: unknown): string | null {
  const s = str(h)?.toUpperCase();
  if (!s) return null;
  if (s.startsWith("R")) return "Right";
  if (s.startsWith("L")) return "Left";
  return null;
}
function height(ft: unknown, inches: unknown): string | null {
  const f = num(ft);
  const i = num(inches);
  if (!f) return null;
  return `${f}' ${i ?? 0}"`;
}
/** Division prefixes the medals endpoint uses. "Mix", not "Mixed". */
const MEDAL_PREFIXES = ["Singles", "Doubles", "Mix", "SkinnySingles"] as const;

/**
 * Semifinal appearances that ended in the semis, for one division.
 *
 * Reads the feed's OWN `{Div}Semifinalist` first and only derives the number
 * when that field is absent. Both were checked against pickleball.com's player
 * pages, which render the same upstream object: at PPA scope `Semifinalist`
 * and `Bronze + BronzeLost` agree exactly for both Ben Johns (12) and Tyson
 * McGuffin (30), and both match the printed table. **At career scope they
 * DIVERGE** — Tyson is 53 vs 71, Ben 17 vs 24 — so they are not the same
 * quantity, and the named field is the one to trust.
 */
function semifinalsFor(m: Obj, prefix: string, bronze: number, bronzeLost: number): number {
  const named = num(m[`${prefix}Semifinalist`]);
  return named ?? bronze + bronzeLost;
}

function medalSet(m: Obj, prefix: string): MedalSet {
  const bronze = num(m[`${prefix}Bronze`]) ?? 0;
  const bronzeLost = num(m[`${prefix}BronzeLost`]) ?? 0;
  return {
    gold: num(m[`${prefix}Gold`]) ?? 0,
    silver: num(m[`${prefix}Silver`]) ?? 0,
    bronze,
    bronzeLost,
    semifinals: semifinalsFor(m, prefix, bronze, bronzeLost),
  };
}

/**
 * One player endpoint GET, served from the durable cache in `lib/pb-cache.ts`.
 *
 * ⚠ IT IS OUR POSTGRES TABLE AND NOT NEXT'S DATA CACHE, AND THE REASON IS THE
 * DEPLOY (9/23). This route prerenders ~219 US athlete pages plus the 26 Europe
 * ones, and every one of them calls BOTH endpoints below. A Next cache entry
 * does not survive a new deployment — the header of lib/pb-cache.ts has the key
 * mechanism and the measurement — so on the old `pbGetJson` path the 24-hour
 * window above really meant "until the next push", and a day with two dozen
 * deploys paid ~900 calls each time for data that had not changed.
 *
 * Keyed on the URL in a table we own, this build reads what the last build
 * wrote, so a redeploy costs nothing upstream.
 *
 * ⚠ THE TAG IS THE OTHER HALF, AND IT IS NOT OPTIONAL. `revalidateTag` cannot
 * reach this table, so /api/revalidate-athletes purges it explicitly — that is
 * what keeps a Jackalope player save landing in seconds rather than waiting out
 * the TTL. Both layers or neither.
 */
async function get(base: string, token: string, path: string): Promise<Obj | null> {
  return (await pbCachedJson(`${base}${path}`, REVALIDATE_S, ATHLETES_CACHE_TAG, token)) as
    | Obj
    | null;
}

async function build(slug: string): Promise<AthleteStats | null> {
  const { token, base } = config();
  if (!token) return null;

  const userJson = await get(base, token, `/v1/data/users/${encodeURIComponent(slug)}?use_camel_case=true`);
  const r = (userJson?.result as Obj | undefined) ?? undefined;
  if (!r || !str(r.uuid)) return null;
  const uuid = str(r.uuid) as string;

  const medalJson = await get(base, token, `/v2/data/users/${uuid}/player_medals?partners=ppa,upa&scope_title=Pro`);
  /**
   * Fourth-place finishes, summed across divisions.
   *
   * ⚠ Summed rather than read off a career field, because the endpoint has no
   * top-level `BronzeLostMedals` the way it has `BronzeMedals` — only
   * `SinglesBronzeLost`, `DoublesBronzeLost`, `MixBronzeLost` and
   * `SkinnySinglesBronzeLost`. Skinny singles is included even though the page
   * prints no row for it, so the career total stays consistent with
   * `BronzeMedals`, which does count it.
   */
  const bronzeLostTotal = medalJson
    ? MEDAL_PREFIXES.reduce((sum, p) => sum + (num(medalJson[`${p}BronzeLost`]) ?? 0), 0)
    : 0;
  const medals =
    medalJson && (num(medalJson.GoldMedals) || num(medalJson.SilverMedals) || num(medalJson.BronzeMedals))
      ? {
          singles: medalSet(medalJson, "Singles"),
          doubles: medalSet(medalJson, "Doubles"),
          mixed: medalSet(medalJson, "Mix"),
          total: {
            gold: num(medalJson.GoldMedals) ?? 0,
            silver: num(medalJson.SilverMedals) ?? 0,
            bronze: num(medalJson.BronzeMedals) ?? 0,
            bronzeLost: bronzeLostTotal,
            semifinals:
              num(medalJson.Semifinalist) ??
              (num(medalJson.BronzeMedals) ?? 0) + bronzeLostTotal,
          },
        }
      : null;

  applyVerifiedGolds(slug, medals);

  const country = r.country as Obj | undefined;
  const state = r.state as Obj | undefined;
  const city = str(r.city);
  const hometown = city ? [city, str(state?.abbreviation)].filter(Boolean).join(", ") : null;

  const dupr = { singles: posNum(r.duprSingles), doubles: posNum(r.duprDoubles) };
  const wpr = {
    singles: posNum(r.worldPickleballRatingSingles),
    doubles: posNum(r.worldPickleballRatingDoubles),
    mixed: posNum(r.worldPickleballRatingMixed),
  };

  return {
    uuid,
    nickname: str(r.nickname),
    age: ageFromDob(r.dob),
    height: height(r.heightFeet, r.heightInches),
    handed: handedLabel(r.handed),
    turnedPro: yearOf(r.turnedPro),
    hometown,
    country: str(country?.title),
    countryCode: str(country?.abbreviation2Digit)?.toLowerCase() ?? null,
    dupr,
    wpr,
    medals,
    gamesPlayed: {
      singles: posNum(r.numberOfPlayedSingleGames),
      doubles: posNum(r.numberOfPlayedDoublesGames),
      mixed: posNum(r.numberOfPlayedMixedGames),
    },
    hasStats: Boolean(
      medals || dupr.singles || dupr.doubles || wpr.singles || wpr.doubles || wpr.mixed,
    ),
  };
}

/**
 * Verified career-title floors, for athletes whose live medals feed is known
 * to be short.
 *
 * Anna Leigh Waters: the PB database counts 172 golds. The reconciled count is
 * 196 (64 singles / 66 doubles / 66 mixed): Hannah Johns' season recap,
 * confirmed independently by Jim Ramsey on 9/17/26. The feed is short because
 * 23 golds sit on 9 tournaments with no tier uuid, it credits her with 2 Hanoi
 * golds she did not win, and it is missing the Aug 2022 Selkirk Labs Showdown
 * women's doubles. Kenan owns the upstream fix (C0BTTEN8F40).
 *
 * A FLOOR, not an override: the page shows max(live, verified) per division
 * and in total. When upstream is corrected, or she wins more, the live number
 * takes over on its own and this entry does nothing. Delete the entry once the
 * feed reads at least 196.
 */
const VERIFIED_GOLDS: Record<string, { singles: number; doubles: number; mixed: number; asOf: string }> = {
  "anna-leigh-waters": { singles: 64, doubles: 66, mixed: 66, asOf: "2026-09-17" },
};

function applyVerifiedGolds(slug: string, medals: AthleteStats["medals"]): void {
  const v = VERIFIED_GOLDS[slug];
  if (!v || !medals) return;
  medals.singles.gold = Math.max(medals.singles.gold, v.singles);
  medals.doubles.gold = Math.max(medals.doubles.gold, v.doubles);
  medals.mixed.gold = Math.max(medals.mixed.gold, v.mixed);
  medals.total.gold = Math.max(
    medals.total.gold,
    medals.singles.gold + medals.doubles.gold + medals.mixed.gold,
  );
}

const cache = new Map<string, { value: AthleteStats | null; expires: number }>();
const inFlight = new Map<string, Promise<AthleteStats | null>>();

export async function getAthleteStats(slug: string): Promise<AthleteStats | null> {
  const hit = cache.get(slug);
  if (hit && hit.expires > Date.now()) return hit.value;
  const pending = inFlight.get(slug);
  if (pending) return pending;
  const p = build(slug)
    .then((value) => {
      // Only cache a real result — a null from a transient failure shouldn't
      // poison the athlete's stats for the full TTL.
      if (value) cache.set(slug, { value, expires: Date.now() + TTL_MS });
      return value;
    })
    .catch(() => null);
  inFlight.set(slug, p);
  try {
    return await p;
  } finally {
    inFlight.delete(slug);
  }
}
