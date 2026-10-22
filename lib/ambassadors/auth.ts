/**
 * Server-side auth for /ambassadors pages and /api/ambassadors/me.
 * Reads the signed session cookie, then re-validates the email against the
 * CURRENT portal.json — a valid cookie for someone no longer on the roster
 * resolves to null (access ends at the next refresh).
 */
import { cookies } from "next/headers";
import { SESSION_COOKIE, readSessionValue } from "@/lib/ambassadors/session";
import { buildMe, type MePayload } from "@/lib/ambassadors/portal";

export async function currentAmbassador(): Promise<MePayload | null> {
  const jar = await cookies();
  const email = readSessionValue(jar.get(SESSION_COOKIE)?.value);
  if (!email) return null;
  return buildMe(email);
}
