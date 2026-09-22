/**
 * Best-effort rate limiting for the sign-in form: 5 requests per email per hour,
 * 20 per IP per hour (spec §3). Counters live in the private store as small
 * fixed-window records. This is deliberately simple, not airtight — under the
 * store's eventual consistency two near-simultaneous requests can both pass. At
 * ~107 ambassadors that is fine; swap in Vercel KV if it ever needs to be exact.
 */
import { getJson, putJson } from "@/lib/ambassadors/store";

const WINDOW_MS = 60 * 60 * 1000;

type Counter = { count: number; reset: number };

async function bump(key: string, limit: number): Promise<boolean> {
  const now = Date.now();
  const rec = (await getJson<Counter>(key)) ?? { count: 0, reset: now + WINDOW_MS };
  if (now > rec.reset) {
    rec.count = 0;
    rec.reset = now + WINDOW_MS;
  }
  rec.count += 1;
  await putJson(key, rec);
  return rec.count <= limit;
}

/** Returns true when the request is allowed. Records the attempt either way. */
export async function allowSignIn(email: string, ip: string): Promise<boolean> {
  const e = email.trim().toLowerCase().replace(/[^a-z0-9._%+-@]/g, "_");
  const okEmail = await bump(`ratelimit/email-${e}.json`, 5);
  const okIp = await bump(`ratelimit/ip-${ip.replace(/[^0-9a-fA-F.:]/g, "_")}.json`, 20);
  return okEmail && okIp;
}
