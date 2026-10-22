/**
 * Link to the app's player screen (`/scores/player`) — CLIENT-SAFE.
 *
 * Keyed by the display NAME, not a slug, because that is all the scores feed
 * and the draw carry. The screen resolves the name to a ranked pro / profile
 * itself, and drops the profile link when the name is ambiguous
 * (lib/player-event `resolvePlayer`).
 */
export function playerHref(name: string, eventId?: string): string {
  const q = new URLSearchParams({ name: name.trim() });
  if (eventId) q.set("event", eventId);
  return `/scores/player/?${q.toString()}`;
}
