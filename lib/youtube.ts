/**
 * YouTube playlist adapter — YouTube Data API v3 (server-only).
 *
 *   GET {API}/playlistItems?part=snippet,contentDetails&playlistId=..&maxResults=50&pageToken=..&key=..
 *     → the videos in a playlist (paged 50 at a time).
 *   GET {API}/videos?part=contentDetails,statistics&id=<50 ids>&key=..
 *     → per-video duration + view count.
 *
 * env  YOUTUBE_API_KEY  (free key from the Google Cloud console; has a daily
 *      quota — playlistItems.list / videos.list cost 1 unit per call).
 *
 * Reads the key server-side. Never throws — returns [] on any problem (missing
 * key, network, quota). Results are fetched through the Next data cache with a
 * 6-hour revalidate so pages stay static/ISR and quota use stays tiny.
 */

import { REPLAYS_CACHE_TAG } from "@/lib/cache-tags";

const API = "https://www.googleapis.com/youtube/v3";
const TIMEOUT_MS = 6000;
const REVALIDATE_S = 6 * 60 * 60; // 6h — replay playlists change rarely
const MAX_VIDEOS = 120;

export type ReplayVideo = {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  /** "12:34" / "1:02:03", or null if unknown. */
  duration: string | null;
  views: number | null;
};

type YtThumb = { url?: string };
type YtItem = {
  snippet?: {
    title?: string;
    publishedAt?: string;
    resourceId?: { videoId?: string };
    thumbnails?: Record<string, YtThumb>;
  };
  contentDetails?: { videoId?: string; duration?: string };
};
type YtVideo = {
  id?: string;
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string };
};

async function get(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_S, tags: [REPLAYS_CACHE_TAG] },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** "PT1H2M3S" → "1:02:03"; "PT4M5S" → "4:05". Null when unparseable. */
function parseDuration(iso: string): string | null {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return null;
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`;
}

function bestThumb(thumbs: Record<string, YtThumb> | undefined, videoId: string): string {
  const t = thumbs ?? {};
  const pick = t.maxres ?? t.standard ?? t.high ?? t.medium ?? t.default;
  return pick?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export async function getPlaylistVideos(playlistId: string): Promise<ReplayVideo[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || !playlistId) return [];

  const videos: ReplayVideo[] = [];
  let pageToken = "";
  do {
    const url =
      `${API}/playlistItems?part=snippet,contentDetails&maxResults=50` +
      `&playlistId=${encodeURIComponent(playlistId)}` +
      (pageToken ? `&pageToken=${pageToken}` : "") +
      `&key=${key}`;
    const j = await get(url);
    const items = (j?.items as YtItem[] | undefined) ?? [];
    for (const it of items) {
      const s = it.snippet ?? {};
      const id = it.contentDetails?.videoId ?? s.resourceId?.videoId;
      if (!id) continue;
      // Skip removed/private entries YouTube still lists.
      if (s.title === "Private video" || s.title === "Deleted video") continue;
      videos.push({
        id,
        title: s.title ?? "",
        thumbnail: bestThumb(s.thumbnails, id),
        publishedAt: s.publishedAt ?? "",
        duration: null,
        views: null,
      });
    }
    pageToken = (j?.nextPageToken as string | undefined) ?? "";
  } while (pageToken && videos.length < MAX_VIDEOS);

  if (!videos.length) return [];

  // Enrich with duration + view count (batches of 50 ids).
  for (let i = 0; i < videos.length; i += 50) {
    const batch = videos.slice(i, i + 50);
    const j = await get(`${API}/videos?part=contentDetails,statistics&id=${batch.map((b) => b.id).join(",")}&key=${key}`);
    const byId = new Map<string, YtVideo>();
    for (const v of (j?.items as YtVideo[] | undefined) ?? []) if (v.id) byId.set(v.id, v);
    for (const b of batch) {
      const v = byId.get(b.id);
      if (!v) continue;
      b.duration = v.contentDetails?.duration ? parseDuration(v.contentDetails.duration) : null;
      const vc = Number(v.statistics?.viewCount);
      b.views = Number.isFinite(vc) ? vc : null;
    }
  }

  return videos;
}
