/**
 * Tournament details adapter — Pickleball.com stored-procedure endpoint.
 *
 *   POST {base}/v1/pb_data/json?sp_name=API_v2_Tourney_GetDetails
 *   header  PB-API-TOKEN: <token>
 *   body    { "EventID": "<uuid>" }
 *   → { payload: [ { ...tournament } ] }
 *
 * This SP endpoint is authorized for our token even though the /v2/data/*
 * tournament routes are not. Server-only; never throws — returns null on any
 * problem so callers can fall back to placeholder data.
 */

import { TOURNAMENT_DETAILS_CACHE_TAG } from "@/lib/cache-tags";

const SP_PATH = "/v1/pb_data/json?sp_name=API_v2_Tourney_GetDetails";

/** Test event: 2026 Veolia Atlanta Pickleball Championships. */
export const LIVE_EVENT_UUID = "92d37566-5850-40a3-8aad-7217276dc586";

export type TournamentDetails = {
  eventId: string;
  /** Cleaned title, e.g. "Veolia Atlanta Pickleball Championships". */
  name: string;
  /** Full logo URL built from the API `Logo` path, or "" if none. */
  logo: string;
  city: string;
  state: string;
  venue: string;
  address: string;
  /** ISO yyyy-mm-dd. */
  startDate: string;
  endDate: string;
  ticketsUrl: string;
  /** Ranking points parsed from the sanction level, e.g. "PPA 2000" → 2000. */
  points: number;
  courts: number;
  parking: string;
};

/** Strip the "PPA Tour:" prefix and a leading year from the event title. */
function cleanTitle(title: string): string {
  return title
    .replace(/^PPA Tour:\s*/i, "")
    .replace(/^\d{4}\s+/, "")
    .trim();
}

function dateOnly(iso: unknown): string {
  return typeof iso === "string" ? iso.slice(0, 10) : "";
}

function parsePoints(sanction: unknown): number {
  const m = typeof sanction === "string" ? sanction.match(/(\d[\d,]*)/) : null;
  return m ? Number.parseInt(m[1].replace(/,/g, ""), 10) : 0;
}

type ApiTournament = {
  Title?: string;
  Logo?: string;
  LocationOfEvent_City?: string;
  LocationOfEvent_StateAbbreviation?: string;
  LocationOfEvent_Venue?: string;
  LocationOfEvent_StreetAddress?: string;
  LocationOfEvent_NumberOfCourts?: number;
  LocationOfEvent_ParkingInformation?: string;
  EventActivityFirstDate?: string;
  EventActivityLastDate?: string;
  TicketsURL?: string;
  SantionLevelTitle_Club?: string;
};

export async function getTournamentDetails(eventId: string): Promise<TournamentDetails | null> {
  const token = process.env.PB_API_TOKEN;
  const baseUrl = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
  if (!token) return null;

  try {
    const res = await fetch(`${baseUrl}${SP_PATH}`, {
      method: "POST",
      headers: { "PB-API-TOKEN": token, "Content-Type": "application/json" },
      body: JSON.stringify({ EventID: eventId }),
      // SP endpoint is a POST; cache for a day via the framework's data cache.
      next: { revalidate: 60 * 60 * 24, tags: [TOURNAMENT_DETAILS_CACHE_TAG] },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { payload?: ApiTournament[] };
    const t = json.payload?.[0];
    if (!t?.Title) return null;

    // The `Logo` path is relative; prefix with the image CDN base. The bucket
    // is currently private to us (403) — override PB_IMAGE_BASE_URL once a
    // public/authorized base is confirmed with the API team.
    const imageBase = (process.env.PB_IMAGE_BASE_URL || "https://cdn.pickleball.com").replace(
      /\/$/,
      "",
    );

    return {
      eventId,
      name: cleanTitle(t.Title),
      logo: t.Logo ? `${imageBase}/${t.Logo}` : "",
      city: (t.LocationOfEvent_City ?? "").split("/")[0].trim(),
      state: t.LocationOfEvent_StateAbbreviation ?? "",
      venue: t.LocationOfEvent_Venue ?? "",
      address: t.LocationOfEvent_StreetAddress ?? "",
      startDate: dateOnly(t.EventActivityFirstDate),
      endDate: dateOnly(t.EventActivityLastDate),
      ticketsUrl: t.TicketsURL || "https://www.tixr.com/groups/ppa",
      points: parsePoints(t.SantionLevelTitle_Club),
      courts: t.LocationOfEvent_NumberOfCourts ?? 0,
      parking: t.LocationOfEvent_ParkingInformation ?? "",
    };
  } catch {
    return null;
  }
}
