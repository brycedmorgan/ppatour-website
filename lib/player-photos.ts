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

/** "tyra hurricane black" → "tyra black": first + last token only. */
function firstLast(normalized: string): string {
  const parts = normalized.split(" ").filter(Boolean);
  return parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : normalized;
}

const byName = new Map<string, string>();
const slugByName = new Map<string, string>();
// Secondary index ignoring middle names — the results feeds carry them where the
// roster doesn't (e.g. "Tyra Hurricane Black" vs our "Tyra Black"). Only filled
// where it doesn't collide with a full-name key, so exact matches always win.
const byFirstLast = new Map<string, string>();
const slugByFirstLast = new Map<string, string>();
for (const a of athletes) {
  const n = norm(a.name);
  byName.set(n, a.headshot);
  slugByName.set(n, a.slug);
  const fl = firstLast(n);
  if (fl !== n) {
    byFirstLast.set(fl, a.headshot);
    slugByFirstLast.set(fl, a.slug);
  }
}

/**
 * Headshots for players the scores/rankings feed surfaces (e.g. as champions)
 * who aren't in the curated roster yet. Without this they render an initials
 * chip on the homepage champions band even though pickleball.com has a photo.
 * Keyed by normalized name.
 */
const EXTRA_HEADSHOTS: Record<string, string> = {
  "christopher haworth": "/ppa/pros/christopher-haworth.jpg",
  "chris haworth": "/ppa/pros/christopher-haworth.jpg",
};

export function playerPhoto(name: string): string | null {
  const n = norm(name);
  return (
    byName.get(n) ??
    byFirstLast.get(firstLast(n)) ??
    byName.get(firstLast(n)) ??
    EXTRA_HEADSHOTS[n] ??
    null
  );
}

/**
 * Profile path for a player named by the scores/champions feed, or null when
 * that name isn't on our roster. Dave Rogers 7/27: champion names on the
 * homepage should open the player's page.
 */
export function playerProfileHref(name: string): string | null {
  const n = norm(name);
  const slug =
    slugByName.get(n) ?? slugByFirstLast.get(firstLast(n)) ?? slugByName.get(firstLast(n));
  return slug ? `/athletes/${slug}` : null;
}

/** Up-to-two-letter initials fallback for players without a headshot. */
export function playerInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}
