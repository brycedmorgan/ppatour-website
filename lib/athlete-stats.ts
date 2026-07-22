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
import { pbGetJson } from "@/lib/pb-fetch";
import { ATHLETES_CACHE_TAG } from "@/lib/cache-tags";

const TIMEOUT_MS = 8000;
const TTL_MS = 60 * 60 * 1000;
const REVALIDATE_S = 60 * 60 * 24; // Data Cache; the daily cron refreshes it

export type MedalSet = { gold: number; silver: number; bronze: number };
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
function medalSet(m: Obj, prefix: string): MedalSet {
  return {
    gold: num(m[`${prefix}Gold`]) ?? 0,
    silver: num(m[`${prefix}Silver`]) ?? 0,
    bronze: num(m[`${prefix}Bronze`]) ?? 0,
  };
}

async function get(base: string, token: string, path: string): Promise<Obj | null> {
  return (await pbGetJson(`${base}${path}`, { "PB-API-TOKEN": token }, {
    timeoutMs: TIMEOUT_MS,
    revalidate: REVALIDATE_S,
    tags: [ATHLETES_CACHE_TAG],
  })) as Obj | null;
}

async function build(slug: string): Promise<AthleteStats | null> {
  const { token, base } = config();
  if (!token) return null;

  const userJson = await get(base, token, `/v1/data/users/${encodeURIComponent(slug)}?use_camel_case=true`);
  const r = (userJson?.result as Obj | undefined) ?? undefined;
  if (!r || !str(r.uuid)) return null;
  const uuid = str(r.uuid) as string;

  const medalJson = await get(base, token, `/v2/data/users/${uuid}/player_medals?partners=ppa,upa&scope_title=Pro`);
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
          },
        }
      : null;

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
