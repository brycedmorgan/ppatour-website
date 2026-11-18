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
};

export type PublicProfile = {
  pbUuid: string;
  slug: string;
  firstName: string;
  lastName: string;
  nickname: string;
};

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
  };
}
