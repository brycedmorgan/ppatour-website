/**
 * Customer.io Track API (server-side only). Identifies people and records
 * events in the Pickleball Inc workspace so lead-capture and volunteer
 * submissions land in the same place the email programs run.
 *
 * Env (unset locally → calls are skipped and logged):
 *   CUSTOMERIO_SITE_ID · CUSTOMERIO_TRACK_API_KEY
 */
const SITE_ID = process.env.CUSTOMERIO_SITE_ID;
const TRACK_KEY = process.env.CUSTOMERIO_TRACK_API_KEY;
const BASE = "https://track.customer.io/api/v1";

export function cioConfigured(): boolean {
  return Boolean(SITE_ID && TRACK_KEY);
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${SITE_ID}:${TRACK_KEY}`).toString("base64")}`;
}

/** Create/update a person (identified by email) and record an event. */
export async function cioIdentifyAndTrack(
  email: string,
  attributes: Record<string, unknown>,
  eventName: string,
  eventData: Record<string, unknown>,
): Promise<boolean> {
  if (!cioConfigured()) {
    console.warn("[customerio] not configured — skipping", { email, eventName });
    return true;
  }
  const id = encodeURIComponent(email.toLowerCase());
  const identify = await fetch(`${BASE}/customers/${id}`, {
    method: "PUT",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.toLowerCase(), ...attributes }),
  });
  if (!identify.ok) {
    console.error("[customerio] identify failed", identify.status, await identify.text().catch(() => ""));
    return false;
  }
  const track = await fetch(`${BASE}/customers/${id}/events`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ name: eventName, data: eventData }),
  });
  if (!track.ok) {
    console.error("[customerio] track failed", track.status, await track.text().catch(() => ""));
    return false;
  }
  return true;
}
