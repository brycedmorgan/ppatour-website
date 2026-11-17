"use server";

/**
 * The second sign-in step: set it up (first sign-in only) and use it.
 * Every action requires the 10-minute "pending" cookie from a correct
 * password; none of them work for a signed-out visitor.
 *
 * ⚠ SETUP IS ONLY ALLOWED WHILE AN EDITOR HAS NO SECOND STEP AT ALL. Otherwise
 * a stolen password would be enough to add an attacker's own passkey. Losing a
 * device means a reset by Wesley (scripts/newsroom-reset-mfa.mjs).
 */
import { redirect } from "next/navigation";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { requirePending, startSession } from "@/lib/newsroom/auth";
import { checkTotp, hasFactor, ISSUER, isLocked, relyingParty, withFailure } from "@/lib/newsroom/mfa";
import { newsroomBase } from "@/lib/newsroom/session";
import { getMfa, putMfa, type MfaRecord } from "@/lib/newsroom/store";

type Result = { error: string } | undefined;

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

const b64url = (u: Uint8Array) => Buffer.from(u).toString("base64url");

/** Both steps done: the real session, then into the dashboard. */
async function finish(email: string, m: MfaRecord): Promise<never> {
  await putMfa(email, { ...m, failures: 0, lockedUntil: undefined, challenge: undefined });
  await startSession(email);
  redirect(`${newsroomBase()}/`);
}

function takeChallenge(m: MfaRecord): string | null {
  return m.challenge && m.challenge.exp > Date.now() ? m.challenge.value : null;
}

const LOCKED = "Too many wrong attempts. Try again in 15 minutes.";

/* ─────────────────────────────── setup ─────────────────────────────── */

export async function passkeySetupOptions() {
  const { sub } = await requirePending();
  const m = await getMfa(sub);
  if (hasFactor(m)) return { error: "A second step is already set up. Sign in with it." } as const;
  const { rpID } = await relyingParty();
  const options = await generateRegistrationOptions({
    rpName: ISSUER,
    rpID,
    userName: sub,
    attestationType: "none",
    authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
  });
  await putMfa(sub, { ...m, challenge: { value: options.challenge, exp: Date.now() + CHALLENGE_TTL_MS } });
  return { options } as const;
}

export async function passkeySetupFinish(response: RegistrationResponseJSON): Promise<Result> {
  const { sub } = await requirePending();
  const m = await getMfa(sub);
  if (hasFactor(m)) return { error: "A second step is already set up. Sign in with it." };
  const challenge = takeChallenge(m);
  if (!challenge) return { error: "That took too long. Try again." };
  const { rpID, origin } = await relyingParty();
  try {
    const v = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
    if (!v.verified) return { error: "The passkey couldn't be verified. Try again." };
    const c = v.registrationInfo.credential;
    const next: MfaRecord = {
      ...m,
      pendingTotp: undefined,
      passkeys: [
        {
          id: c.id,
          publicKey: b64url(c.publicKey),
          counter: c.counter,
          transports: c.transports,
          rpID,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    return finish(sub, next);
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { error: `The passkey couldn't be verified: ${(err as Error).message}` };
  }
}

export async function totpSetupFinish(code: string): Promise<Result> {
  const { sub } = await requirePending();
  const m = await getMfa(sub);
  if (hasFactor(m)) return { error: "A second step is already set up. Sign in with it." };
  if (isLocked(m)) return { error: LOCKED };
  if (!m.pendingTotp) return { error: "Reload the page to get a new code to scan." };
  const step = checkTotp(m.pendingTotp, code);
  if (step === null) {
    await putMfa(sub, withFailure(m));
    return { error: "That code didn't match. Check the app and try the current code." };
  }
  return finish(sub, {
    ...m,
    totp: { secret: m.pendingTotp, lastStep: step, createdAt: new Date().toISOString() },
    pendingTotp: undefined,
  });
}

/* ─────────────────────────────── sign-in ─────────────────────────────── */

export async function passkeyLoginOptions() {
  const { sub } = await requirePending();
  const m = await getMfa(sub);
  if (isLocked(m)) return { error: LOCKED } as const;
  const { rpID } = await relyingParty();
  const here = m.passkeys.filter((p) => p.rpID === rpID);
  if (!here.length) return { error: "No passkey for this site. Use your authenticator code." } as const;
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: here.map((p) => ({ id: p.id, transports: p.transports })),
    userVerification: "preferred",
  });
  await putMfa(sub, { ...m, challenge: { value: options.challenge, exp: Date.now() + CHALLENGE_TTL_MS } });
  return { options } as const;
}

export async function passkeyLoginFinish(response: AuthenticationResponseJSON): Promise<Result> {
  const { sub } = await requirePending();
  const m = await getMfa(sub);
  if (isLocked(m)) return { error: LOCKED };
  const challenge = takeChallenge(m);
  if (!challenge) return { error: "That took too long. Try again." };
  const { rpID, origin } = await relyingParty();
  const stored = m.passkeys.find((p) => p.id === response.id && p.rpID === rpID);
  if (!stored) {
    await putMfa(sub, withFailure(m));
    return { error: "That passkey isn't registered for this account." };
  }
  try {
    const v = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: stored.id,
        publicKey: new Uint8Array(Buffer.from(stored.publicKey, "base64url")),
        counter: stored.counter,
        transports: stored.transports,
      },
    });
    if (!v.verified) {
      await putMfa(sub, withFailure(m));
      return { error: "The passkey couldn't be verified. Try again." };
    }
    const passkeys = m.passkeys.map((p) =>
      p.id === stored.id ? { ...p, counter: v.authenticationInfo.newCounter } : p,
    );
    return finish(sub, { ...m, passkeys });
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    await putMfa(sub, withFailure(m));
    return { error: `The passkey couldn't be verified: ${(err as Error).message}` };
  }
}

export async function totpLogin(code: string): Promise<Result> {
  const { sub } = await requirePending();
  const m = await getMfa(sub);
  if (isLocked(m)) return { error: LOCKED };
  if (!m.totp) return { error: "No authenticator app is set up for this account." };
  const step = checkTotp(m.totp.secret, code, m.totp.lastStep);
  if (step === null) {
    await putMfa(sub, withFailure(m));
    return { error: "That code didn't match. Use the current code in your app." };
  }
  return finish(sub, { ...m, totp: { ...m.totp, lastStep: step } });
}
