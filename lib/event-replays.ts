/**
 * Tournament replay playlists — YouTube playlist ID per event, keyed by event
 * slug (same override pattern as broadcast.ts / event-schedule.ts). Marketing
 * supplies the playlist URL/ID from the PPA Tour YouTube channel; drop the ID
 * (the `list=` value, e.g. "PLxxxxxxxx") in here and the Replays section +
 * "Replays" tab light up automatically on that event page.
 *
 * Accepts a bare ID or a full YouTube URL — `getReplayPlaylistId` extracts the
 * `list=` param either way.
 */
const REPLAY_PLAYLIST_BY_SLUG: Record<string, string> = {
  // "veolia-atlanta-pickleball-championships-2026": "PLxxxxxxxxxxxx",
};

/** Pull the playlist ID out of a bare ID or any YouTube URL. */
function extractId(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const m = /[?&]list=([^&]+)/.exec(v);
  if (m) return m[1];
  // Looks like a bare playlist ID already.
  if (/^[A-Za-z0-9_-]+$/.test(v)) return v;
  return null;
}

export function getReplayPlaylistId(slug: string): string | null {
  const raw = REPLAY_PLAYLIST_BY_SLUG[slug];
  return raw ? extractId(raw) : null;
}
