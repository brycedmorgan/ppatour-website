/**
 * The signed-in user's profile from the Pickleball user API. SERVER-ONLY.
 *
 * GET {api}/v2/data/users/{pbUuid}?use_camel_case=true with all three headers
 * (the guide: "A request with only one of them is not a supported call"):
 *   Authorization: Bearer <access token>
 *   PB-USER-TOKEN: <the access token's ext.pb_user_token>
 *   PB-API-TOKEN:  our server key for that environment
 *
 * ⚠ THE RAW RESPONSE HOLDS PRIVATE DATA (address, DOB, phone, emergency
 * contact, Stripe ids). Only `publicProfile` fields leave the server.
 */
import "server-only";

import { userApiBase, verifyAccessToken } from "./oidc";
import { getAccessToken } from "./session";

/** Dev host → PB_API_DEV_TOKEN, otherwise the production PB_API_TOKEN. */
function apiToken(base: string): string | undefined {
  return (base.includes("pickleballdev.net") ? process.env.PB_API_DEV_TOKEN : process.env.PB_API_TOKEN)?.trim();
}

type RawUser = {
  pbUuid?: string;
  slug?: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  ppaRanking?: Record<string, unknown> | null;
};

/** One PPA board the user is ranked on (rolling 365 days). */
export type PpaBoardRank = { board: string; rank: number; points: number; played: number };

export type PublicProfile = {
  pbUuid: string;
  slug: string;
  firstName: string;
  lastName: string;
  nickname: string;
  ppaRanking: PpaBoardRank[];
};

const BOARDS: [key: string, label: string][] = [
  ["mensSingles", "Men's Singles"],
  ["womensSingles", "Women's Singles"],
  ["mensDoubles", "Men's Doubles"],
  ["womensDoubles", "Women's Doubles"],
  ["mixedDoubles", "Mixed Doubles"],
];

/**
 * `ppaRanking` from the user API. Assumed to match /v1/users/{uuid}/ppa_ranking
 * (`mensSingles365Rank`, `…Points`, `…TournamentsPlayed`, values as strings);
 * NOT yet seen in a real response. Keys are matched case-insensitively and
 * anything unreadable is dropped, so an unexpected shape shows no section
 * rather than wrong numbers.
 */
function ppaBoards(raw: RawUser["ppaRanking"]): PpaBoardRank[] {
  if (!raw || typeof raw !== "object") return [];
  const lower = new Map(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]));
  const n = (k: string) => {
    const v = Number(lower.get(k.toLowerCase()));
    return Number.isFinite(v) ? v : 0;
  };
  return BOARDS.flatMap(([key, board]) => {
    const rank = n(`${key}365Rank`);
    return rank > 0 ? [{ board, rank, points: n(`${key}365Points`), played: n(`${key}365TournamentsPlayed`) }] : [];
  });
}

export async function getSignedInProfile(): Promise<PublicProfile | null> {
  const access = await getAccessToken();
  if (!access) return null;

  const claims = await verifyAccessToken(access);
  const userToken = claims.ext?.pb_user_token;
  // No `ext` = our client isn't enabled for API access yet (a setting on the SSO side).
  if (!userToken) throw new Error("Access token has no ext.pb_user_token.");
  if (typeof claims.sub !== "string") throw new Error("Access token has no sub.");

  const base = userApiBase();
  const key = apiToken(base);
  if (!key) throw new Error("No PB-API-TOKEN for this environment.");

  const res = await fetch(`${base}/v2/data/users/${claims.sub.toUpperCase()}?use_camel_case=true`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${access}`, "PB-USER-TOKEN": userToken, "PB-API-TOKEN": key },
  });
  if (!res.ok) throw new Error(`User API ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const json = (await res.json()) as RawUser | { results?: RawUser };
  const u: RawUser = "results" in json && json.results ? json.results : (json as RawUser);
  return {
    pbUuid: u.pbUuid ?? claims.sub.toUpperCase(),
    slug: u.slug ?? "",
    firstName: u.firstName ?? "",
    lastName: u.lastName ?? "",
    nickname: u.nickname ?? "",
    ppaRanking: ppaBoards(u.ppaRanking),
  };
}

/**
 * PREVIEW ONLY (/account/?demo=<player-slug>, never on production): a real pro's
 * PUBLIC data in the same shape, so the account page can be seen with more
 * than a bare test account (Wesley, 11/18). Uses our platform token, not a
 * sign-in. The raw /v1/data/users response holds private fields; only the
 * names and ids are picked out here.
 */
export async function demoProfile(slug: string): Promise<PublicProfile | null> {
  const key = process.env.PB_API_TOKEN?.trim();
  const base = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
  if (!key || !/^[a-z0-9-]{2,80}$/.test(slug)) return null;
  const get = async (path: string) => {
    const r = await fetch(`${base}${path}`, { cache: "no-store", headers: { "PB-API-TOKEN": key } }).catch(() => null);
    if (!r?.ok || r.status === 204) return null;
    const j = (await r.json().catch(() => null)) as Record<string, unknown> | null;
    return (j?.result ?? j?.results ?? j) as Record<string, unknown> | null;
  };
  const u = await get(`/v1/data/users/${slug}?use_camel_case=true`);
  const uuid = typeof u?.uuid === "string" ? u.uuid : "";
  if (!u || !uuid) return null;
  const ranking = await get(`/v1/users/${uuid}/ppa_ranking`);
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    pbUuid: uuid.toUpperCase(),
    slug: s(u.slug) || slug,
    firstName: s(u.firstName),
    lastName: s(u.lastName),
    nickname: s(u.nickname),
    ppaRanking: ppaBoards(ranking),
  };
}
