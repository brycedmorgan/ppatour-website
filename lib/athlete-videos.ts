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
 *
 * ⚠ QUALITY RANKING (Connor, 8/7): the raw feed leads with whatever clip the
 * highlight API returns first, which is often a low-view cell-phone capture
 * (rain-delay side courts, etc.) rather than the produced broadcast match. Two
 * levers fix that, both degrade to the old behaviour if unavailable:
 *   1. Clips within a tournament are re-ordered by YouTube view count (and
 *      official-PPA-channel priority) so the most-watched produced match leads.
 *      Needs YOUTUBE_API_KEY; with no key the feed keeps its original order.
 *   2. The DEFAULT tournament is the player's marquee event (Worlds → majors →
 *      cups → opens), not simply their most recent one.
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
  views?: number; // YouTube view count, when the stats lookup succeeds
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

/**
 * Tier score for picking a player's marquee event as the dropdown default.
 * Worlds is the biggest broadcast, then majors/nationals, cups/finals, opens.
 */
function tournamentRank(title: string): number {
  const t = title.toLowerCase();
  if (/\bworld/.test(t)) return 5;
  if (/\bnational|\bmasters|\bmajor|\bchampionship/.test(t)) return 4;
  if (/\bcup\b|\bfinals\b/.test(t)) return 3;
  if (/\bopen\b/.test(t)) return 2;
  return 1;
}

/**
 * The default tournament is the player's highest-tier event; ties break to the
 * most recent (the list arrives most-recent-first). Falls back to the first row.
 */
function pickDefaultTournament(tournaments: VideoTournament[]): string {
  let best = tournaments[0];
  let bestRank = tournamentRank(best.title);
  for (const t of tournaments) {
    const r = tournamentRank(t.title);
    if (r > bestRank) {
      best = t;
      bestRank = r;
    }
  }
  return best.uuid;
}

type YtStat = { views: number; channelId: string };

/**
 * Official PPA broadcast channels (comma-separated YouTube channel IDs in
 * PPA_YT_CHANNEL_IDS). Clips from these lead regardless of raw view count, so a
 * produced broadcast beats a viral courtside phone clip. Empty = view-count only.
 */
function officialChannelIds(): Set<string> {
  return new Set(
    (process.env.PPA_YT_CHANNEL_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/**
 * YouTube Data API v3 view counts + channel for a set of video ids (50 per
 * call). No key or any failure → empty map, and ranking degrades to feed order.
 */
async function fetchYouTubeStats(ids: string[]): Promise<Map<string, YtStat>> {
  const out = new Map<string, YtStat>();
  const key = process.env.YOUTUBE_API_KEY;
  const unique = [...new Set(ids)];
  if (!key || unique.length === 0) return out;
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${batch.join(
          ",",
        )}&key=${key}`,
        {
          signal: AbortSignal.timeout(TIMEOUT_MS),
          next: { revalidate: REVALIDATE_S, tags: [ATHLETES_CACHE_TAG] },
        },
      );
      if (!res.ok) continue;
      const json = (await res.json()) as {
        items?: Array<{ id: string; statistics?: { viewCount?: string }; snippet?: { channelId?: string } }>;
      };
      for (const it of json.items ?? []) {
        out.set(it.id, {
          views: Number(it.statistics?.viewCount ?? 0) || 0,
          channelId: it.snippet?.channelId ?? "",
        });
      }
    } catch {
      // ignore — a missing batch just means those clips keep feed order
    }
  }
  return out;
}

/**
 * Re-order clips so the highest-quality produced match leads: official-channel
 * clips first, then by view count, stable within ties. Stamps `views` for the
 * UI. No stats (no key / API down) → the original order is returned unchanged.
 */
async function rankByQuality(videos: AthleteVideo[]): Promise<AthleteVideo[]> {
  if (videos.length < 2) return videos;
  const stats = await fetchYouTubeStats(videos.map((v) => v.id));
  if (stats.size === 0) return videos;
  const official = officialChannelIds();
  return videos
    .map((v, i) => {
      const s = stats.get(v.id);
      return {
        v: s ? { ...v, views: s.views } : v,
        i,
        views: s?.views ?? 0,
        isOfficial: s ? official.has(s.channelId) : false,
      };
    })
    .sort((a, b) => {
      if (a.isOfficial !== b.isOfficial) return a.isOfficial ? -1 : 1;
      if (b.views !== a.views) return b.views - a.views;
      return a.i - b.i;
    })
    .map((r) => r.v);
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
  return rankByQuality(out);
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
  const tournamentUuid = pickDefaultTournament(tournaments);
  const videos = await getAthleteVideosFor(slug, tournamentUuid);
  return { tournaments, tournamentUuid, videos };
}
