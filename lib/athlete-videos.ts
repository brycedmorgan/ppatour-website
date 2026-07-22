/**
 * Athlete highlight videos — Pickleball.com player endpoints (two-call flow,
 * server-only, retry-aware via pbGetJson).
 *
 *   GET {base}/v2/data/users/{slug}/list_player_highlight_tournaments?type=ARCHIVED&use_camel_case=true
 *     → tournaments the player has highlights in (dropdown).
 *   GET {base}/v2/data/users/{slug}/player_highlight_links_extended?type=archived
 *       &page_size=24&current_page=1&use_camel_case=true&tournament_uuid={uuid}
 *     → highlight clips (YouTube links + the matchup) for one tournament.
 *
 * Highlight links are timestamped broadcast URLs (youtube.com/live/{id}?t=…),
 * normalized here to a video id + start second for a clean embed.
 * Never throws — returns null/[] on any problem. Cached 1h.
 */
import { pbGetJson } from "@/lib/pb-fetch";
import { ATHLETES_CACHE_TAG } from "@/lib/cache-tags";

const TIMEOUT_MS = 8000;
const TTL_MS = 60 * 60 * 1000;
const REVALIDATE_S = 60 * 60 * 24; // Data Cache; the daily cron refreshes it
const CACHE_OPTS = { timeoutMs: TIMEOUT_MS, revalidate: REVALIDATE_S, tags: [ATHLETES_CACHE_TAG] };

export type VideoTournament = { uuid: string; title: string };
export type AthleteVideo = {
  id: string; // YouTube video id
  start: number; // start second
  matchup: string;
  tournament: string;
  thumbnail: string;
};
export type AthleteVideoData = {
  tournaments: VideoTournament[];
  tournamentUuid: string;
  videos: AthleteVideo[];
};

type Obj = Record<string, unknown>;

function config() {
  const token = process.env.PB_API_TOKEN;
  const base = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
  return { token, base };
}
function str(o: Obj, k: string): string {
  const v = o[k];
  return typeof v === "string" ? v.trim() : "";
}
function cleanTournament(t: string): string {
  return t.replace(/^PPA Tour:\s*/i, "").trim();
}

/** "T. Player / P. Two" — the players on one side of a highlight. */
function team(h: Obj, side: "teamOne" | "teamTwo"): string {
  const one = [str(h, `${side}PlayerOneFirstName`), str(h, `${side}PlayerOneLastName`)].filter(Boolean).join(" ");
  const two = [str(h, `${side}PlayerTwoFirstName`), str(h, `${side}PlayerTwoLastName`)].filter(Boolean).join(" ");
  return [one, two].filter(Boolean).join(" / ");
}

/** "1h2m3s" / "125" → seconds. */
function parseStart(t: string): number {
  if (!t) return 0;
  if (/^\d+$/.test(t)) return Number(t);
  const m = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/.exec(t);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

/** Any YouTube URL shape → { id, start }. */
function parseYouTube(link: string): { id: string; start: number } | null {
  try {
    const u = new URL(link);
    let id = "";
    if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
    else if (u.pathname.startsWith("/live/") || u.pathname.startsWith("/embed/") || u.pathname.startsWith("/shorts/"))
      id = u.pathname.split("/")[2] ?? "";
    else id = u.searchParams.get("v") ?? "";
    id = id.split(/[/?&]/)[0];
    if (!/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;
    return { id, start: parseStart(u.searchParams.get("t") || u.searchParams.get("start") || "") };
  } catch {
    return null;
  }
}

async function fetchTournaments(slug: string): Promise<VideoTournament[]> {
  const { token, base } = config();
  if (!token) return [];
  const json = (await pbGetJson(
    `${base}/v2/data/users/${encodeURIComponent(slug)}/list_player_highlight_tournaments?type=ARCHIVED&use_camel_case=true`,
    { "PB-API-TOKEN": token },
    CACHE_OPTS,
  )) as { results?: { tournaments?: Obj[] } } | null;
  const rows = (json?.results?.tournaments ?? [])
    .map((t) => ({
      uuid: str(t, "tournamentUuid"),
      title: cleanTournament(str(t, "tournamentTitle")),
      completed: str(t, "matchCompleted"), // ISO date of the latest highlight
    }))
    .filter((r) => r.uuid && r.title);
  // Most recent tournament first (the API returns this order, but pin it so the
  // dropdown default is always the athlete's latest event).
  rows.sort((a, b) => b.completed.localeCompare(a.completed));
  return rows.map(({ uuid, title }) => ({ uuid, title }));
}

async function fetchHighlights(slug: string, uuid: string): Promise<AthleteVideo[]> {
  const { token, base } = config();
  if (!token) return [];
  const json = (await pbGetJson(
    `${base}/v2/data/users/${encodeURIComponent(slug)}/player_highlight_links_extended?type=archived&page_size=24&current_page=1&use_camel_case=true&tournament_uuid=${uuid}`,
    { "PB-API-TOKEN": token },
    CACHE_OPTS,
  )) as { results?: { highlights?: Obj[] } } | null;
  const out: AthleteVideo[] = [];
  for (const h of json?.results?.highlights ?? []) {
    const yt = parseYouTube(str(h, "link"));
    if (!yt) continue;
    const matchup = [team(h, "teamOne"), team(h, "teamTwo")].filter(Boolean).join(" vs ");
    out.push({
      id: yt.id,
      start: yt.start,
      matchup: matchup || "Match highlight",
      tournament: cleanTournament(str(h, "tournamentTitle")),
      thumbnail: `https://i.ytimg.com/vi/${yt.id}/hqdefault.jpg`,
    });
  }
  return out;
}

const tourCache = new Map<string, { value: VideoTournament[]; expires: number }>();
const vidCache = new Map<string, { value: AthleteVideo[]; expires: number }>();

async function cachedTournaments(slug: string): Promise<VideoTournament[]> {
  const hit = tourCache.get(slug);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await fetchTournaments(slug);
  if (value.length) tourCache.set(slug, { value, expires: Date.now() + TTL_MS });
  return value;
}

export async function getAthleteVideosFor(slug: string, uuid: string): Promise<AthleteVideo[]> {
  const key = `${slug}:${uuid}`;
  const hit = vidCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await fetchHighlights(slug, uuid);
  if (value.length) vidCache.set(key, { value, expires: Date.now() + TTL_MS });
  return value;
}

export async function getAthleteVideoData(slug: string): Promise<AthleteVideoData | null> {
  const tournaments = await cachedTournaments(slug);
  if (!tournaments.length) return null;
  const tournamentUuid = tournaments[0].uuid;
  const videos = await getAthleteVideosFor(slug, tournamentUuid);
  return { tournaments, tournamentUuid, videos };
}
