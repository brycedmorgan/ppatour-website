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

/** Identify a person by email with attributes only (no event). */
export async function cioIdentify(
  email: string,
  attributes: Record<string, unknown>,
): Promise<boolean> {
  if (!cioConfigured()) return false;
  const res = await fetch(`${BASE}/customers/${encodeURIComponent(email.toLowerCase())}`, {
    method: "PUT",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.toLowerCase(), ...attributes }),
  });
  return res.ok;
}

/** Add people (by email) to a MANUAL segment. id_type=email: many people in
 *  this workspace are keyed by PT uuid, so the email has to be named as such. */
export async function cioAddToSegment(segmentId: number, emails: string[]): Promise<boolean> {
  if (!cioConfigured() || !emails.length) return false;
  const res = await fetch(`${BASE}/segments/${segmentId}/add_customers?id_type=email`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ ids: emails.map((e) => e.toLowerCase()) }),
  });
  return res.ok;
}
