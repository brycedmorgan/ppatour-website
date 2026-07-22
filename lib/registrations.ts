/**
 * Registered-player counts — pickleballtournaments.com (PT.com) adapter.
 *
 * STATUS: WAITING ON CREDS + ENDPOINT SPEC FROM JASON (see docs/DATA-ASKS.md).
 * Connor wants live "X players registered" on every event page. The display
 * component (`RegisteredCount`) is wired and renders an honest "count coming"
 * placeholder until this returns numbers; once the env vars land and the
 * endpoint below is confirmed, the counts light up with zero UI changes.
 *
 * Expected wiring (confirm with Jason):
 *   env  PT_API_TOKEN     — partner token
 *   env  PT_API_BASE_URL  — e.g. https://api.pickleballtournaments.com
 *   GET  {base}/v1/tournaments/{uuid}/registrations/summary  (shape TBD)
 *
 * Server-only. Never throws — returns null (→ placeholder) on any problem.
 */

import { REGISTRATIONS_CACHE_TAG } from "@/lib/cache-tags";

const TIMEOUT_MS = 5000;
const REVALIDATE_SECONDS = 60 * 60; // hourly is plenty for a registration count

export type RegistrationCount = {
  count: number;
  /** Where the number came from, for debugging/labeling. */
  source: "pt-api";
};

export async function getRegisteredCount(
  tournamentUuid: string | undefined,
): Promise<RegistrationCount | null> {
  const token = process.env.PT_API_TOKEN;
  const base = (process.env.PT_API_BASE_URL || "").replace(/\/$/, "");
  // Creds pending from Jason — placeholder state until they land.
  if (!token || !base || !tournamentUuid) return null;

  try {
    const res = await fetch(
      `${base}/v1/tournaments/${tournamentUuid}/registrations/summary`,
      {
        headers: { "PT-API-TOKEN": token },
        next: { revalidate: REVALIDATE_SECONDS, tags: [REGISTRATIONS_CACHE_TAG] },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { total_registrations?: number };
    if (typeof json.total_registrations !== "number") return null;
    return { count: json.total_registrations, source: "pt-api" };
  } catch {
    return null;
  }
}
