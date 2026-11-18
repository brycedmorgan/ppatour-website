/**
 * "Sign in with Pickleball": ppatour.com as an OpenID Connect client of
 * Pickleball SSO. SERVER-ONLY.
 *
 * Source: Bernad Delic's "PPA Tour OIDC Integration" guide (Slack, 11/18).
 * Authorization Code + PKCE (S256), confidential client (client_secret_basic),
 * RS256 ID tokens checked against the issuer's JWKS.
 *
 * Pickleball holds the accounts. We keep NO user table: the ID token's `sub`
 * is the account key, and profile data comes from the Pickleball user API
 * (lib/sso/user.ts). Anything PPA-only we ever store is keyed by `sub`.
 *
 * Env (each environment has its own client):
 *   SSO_ISSUER         https://oidc.pickleballdev.net (dev) | …test.net | https://oidc.pickleball.com
 *   SSO_CLIENT_ID
 *   SSO_CLIENT_SECRET
 *   SSO_REDIRECT_URI   optional; default <request origin>/auth/callback/.
 *                      Must match a registered URI EXACTLY, trailing slash
 *                      included (next.config.ts has trailingSlash: true).
 *   SSO_SESSION_SECRET ≥ 32 chars; encrypts the login cookie and stored tokens.
 */
import "server-only";

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

import { seal, unseal } from "./seal";

export const LOGIN_COOKIE = "ppa_sso_login";
const LOGIN_TTL_SECONDS = 60 * 10;

export function ssoConfigured(): boolean {
  return Boolean(
    process.env.SSO_ISSUER?.trim() &&
      process.env.SSO_CLIENT_ID?.trim() &&
      process.env.SSO_CLIENT_SECRET?.trim() &&
      (process.env.SSO_SESSION_SECRET?.trim().length ?? 0) >= 32,
  );
}

function env(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is not set.`);
  return v;
}

const issuer = () => env("SSO_ISSUER").replace(/\/+$/, "");
const clientId = () => env("SSO_CLIENT_ID");

export function redirectUri(origin: string): string {
  return process.env.SSO_REDIRECT_URI?.trim() || `${origin}/auth/callback/`;
}

function basicAuth(): string {
  return `Basic ${Buffer.from(`${clientId()}:${env("SSO_CLIENT_SECRET")}`).toString("base64")}`;
}

/* ───────────────────────────── Discovery ───────────────────────────── */

type Discovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  revocation_endpoint: string;
  jwks_uri: string;
};

let discovery: { at: number; iss: string; doc: Promise<Discovery> } | null = null;
let jwks: { uri: string; set: ReturnType<typeof createRemoteJWKSet> } | null = null;
const DISCOVERY_TTL_MS = 3 * 60 * 60 * 1000; // the guide: "cache it for a few hours"

function getDiscovery(): Promise<Discovery> {
  const iss = issuer();
  if (!discovery || discovery.iss !== iss || Date.now() - discovery.at > DISCOVERY_TTL_MS) {
    const doc = fetch(`${iss}/.well-known/openid-configuration`, { cache: "no-store" }).then(async (r) => {
      if (!r.ok) throw new Error(`SSO discovery failed: ${r.status}`);
      const d = (await r.json()) as Discovery;
      if (d.issuer !== iss) throw new Error("SSO discovery issuer mismatch.");
      return d;
    });
    discovery = { at: Date.now(), iss, doc };
    // A failed fetch must not stick for three hours.
    doc.catch(() => {
      if (discovery?.doc === doc) discovery = null;
    });
  }
  return discovery.doc;
}

async function getJwks(): Promise<ReturnType<typeof createRemoteJWKSet>> {
  const { jwks_uri } = await getDiscovery();
  // jose caches the keys and refetches once on an unknown `kid` (key rotation).
  if (!jwks || jwks.uri !== jwks_uri) jwks = { uri: jwks_uri, set: createRemoteJWKSet(new URL(jwks_uri)) };
  return jwks.set;
}

/* ───────────────────────────── Login ───────────────────────────── */

const b64url = (buf: Uint8Array) => Buffer.from(buf).toString("base64url");
const random = () => b64url(crypto.getRandomValues(new Uint8Array(32)));

type LoginState = { state: string; nonce: string; verifier: string; returnTo: string; redirectUri: string };

/**
 * Only a path on this site: "/x", never "//host", "/\host" or a full URL, so
 * the callback can't be turned into an open redirect.
 */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

/** Step 1 (/auth/login/): the SSO authorize URL + the sealed cookie to set. */
export async function startLogin(origin: string, returnTo: string) {
  const { authorization_endpoint } = await getDiscovery();
  const login: LoginState = {
    state: random(),
    nonce: random(),
    verifier: random(),
    returnTo: safeReturnTo(returnTo),
    redirectUri: redirectUri(origin),
  };
  const challenge = b64url(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(login.verifier))),
  );

  const url = new URL(authorization_endpoint);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId(),
    redirect_uri: login.redirectUri,
    scope: "openid email offline_access",
    state: login.state,
    nonce: login.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();

  return {
    url: url.toString(),
    cookie: await seal(login, LOGIN_TTL_SECONDS),
    maxAge: LOGIN_TTL_SECONDS,
  };
}

export type TokenSet = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
};

export class SsoError extends Error {
  constructor(
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

/**
 * Step 2 (/auth/callback/): check state, exchange the code, verify the ID
 * token. Returns who signed in plus the tokens (which stay server-side).
 */
export async function finishLogin(query: URLSearchParams, sealedLogin: string | undefined) {
  const login = sealedLogin ? await unseal<LoginState>(sealedLogin) : null;
  if (!login) throw new SsoError("login_expired");
  if (query.get("state") !== login.state) throw new SsoError("state_mismatch");
  const err = query.get("error");
  if (err) throw new SsoError(err === "access_denied" ? "cancelled" : "sso_error", err);
  const code = query.get("code");
  if (!code) throw new SsoError("sso_error", "no code");

  const { token_endpoint } = await getDiscovery();
  const res = await fetch(token_endpoint, {
    method: "POST",
    cache: "no-store",
    headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: login.redirectUri,
      code_verifier: login.verifier,
    }),
  });
  if (!res.ok) throw new SsoError("token_error", `token ${res.status}`);
  const tokens = (await res.json()) as TokenSet;
  if (!tokens.id_token || !tokens.access_token) throw new SsoError("token_error", "missing tokens");

  const { payload } = await jwtVerify(tokens.id_token, await getJwks(), {
    issuer: issuer(),
    audience: clientId(),
    algorithms: ["RS256"],
    clockTolerance: 60,
  });
  if (payload.nonce !== login.nonce) throw new SsoError("nonce_mismatch");
  if (payload.azp && payload.azp !== clientId()) throw new SsoError("azp_mismatch");
  if (typeof payload.sub !== "string" || !payload.sub) throw new SsoError("no_sub");

  return {
    sub: payload.sub,
    // Only a verified email is kept: the Newsroom matches editors on it.
    email: payload.email_verified === true && typeof payload.email === "string" ? payload.email : "",
    returnTo: login.returnTo,
    tokens,
  };
}

/** Single-use: the response carries a NEW refresh token; always store it. */
export async function refreshTokens(refreshToken: string): Promise<TokenSet | null> {
  const { token_endpoint } = await getDiscovery();
  const res = await fetch(token_endpoint, {
    method: "POST",
    cache: "no-store",
    headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) return null;
  return (await res.json()) as TokenSet;
}

/** Logout. Errors ignored: the session is ending anyway. */
export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  try {
    const { revocation_endpoint } = await getDiscovery();
    await fetch(revocation_endpoint, {
      method: "POST",
      cache: "no-store",
      headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: refreshToken, token_type_hint: "refresh_token" }),
    });
  } catch {
    /* ignore */
  }
}

/**
 * The access token is a JWT signed like the ID token. Verify it before reading
 * `ext.pb_user_token` (the PB-USER-TOKEN header for the user API).
 */
export async function verifyAccessToken(accessToken: string): Promise<JWTPayload & { ext?: { pb_user_token?: string } }> {
  const { payload } = await jwtVerify(accessToken, await getJwks(), {
    issuer: issuer(),
    audience: clientId(),
    algorithms: ["RS256"],
    clockTolerance: 60,
  });
  return payload as JWTPayload & { ext?: { pb_user_token?: string } };
}

/** The user API host for this issuer: oidc.<x> → api.<x>. */
export function userApiBase(): string {
  return issuer().replace("://oidc.", "://api.");
}
