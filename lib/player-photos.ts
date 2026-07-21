/**
 * Resolve a player's headshot from the pro roster by name. Champions/standings
 * come from the scores API as plain names; the roster (lib/athletes.ts) holds
 * the official studio headshots. Returns null when we don't have a photo.
 */
import { athletes } from "@/lib/athletes";

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const byName = new Map<string, string>();
for (const a of athletes) byName.set(norm(a.name), a.headshot);

export function playerPhoto(name: string): string | null {
  return byName.get(norm(name)) ?? null;
}

/** Up-to-two-letter initials fallback for players without a headshot. */
export function playerInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}
