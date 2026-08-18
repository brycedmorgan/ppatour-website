/**
 * Turn a name from a live feed into one of our 179 published profile slugs —
 * or into nothing at all.
 *
 * ⚠ AMBIGUITY RETURNS NULL, ALWAYS. There are ~2,075 ranked pros and roughly
 * 22 shared names among them (there are two Ben Johnses), and the feeds give us
 * names, not ids: the score ticker sends "A. Waters", the draw feed sends a
 * full name. A wrong match here does not render a wrong row on a page — it
 * pushes a notification about the wrong human to somebody's lock screen. So any
 * key that resolves to more than one published pro is deleted from the index
 * rather than guessed at.
 */
import { publishedAthletes } from "@/lib/published-athletes";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "Anna Leigh Waters" -> "a. waters", matching the ticker's short form. */
function shortForm(full: string): string | null {
  const parts = normalize(full).split(" ").filter(Boolean);
  if (parts.length < 2) return null;
  return `${parts[0].charAt(0)}. ${parts[parts.length - 1]}`;
}

let index: Map<string, string | null> | null = null;

function build(): Map<string, string | null> {
  if (index) return index;
  const map = new Map<string, string | null>();
  const add = (key: string | null, slug: string) => {
    if (!key) return;
    // null marks a key we have already seen for a DIFFERENT pro — poisoned.
    if (map.has(key) && map.get(key) !== slug) map.set(key, null);
    else map.set(key, slug);
  };
  for (const a of publishedAthletes) {
    add(normalize(a.name), a.slug);
    add(shortForm(a.name), a.slug);
  }
  index = map;
  return map;
}

/** The slug for this name, or null if unknown or ambiguous. */
export function slugForName(name: string): string | null {
  if (!name) return null;
  const map = build();
  const direct = map.get(normalize(name));
  if (direct !== undefined) return direct;
  return null;
}

/** Slugs for a list of feed names, ambiguous ones dropped. */
export function slugsForNames(names: string[]): string[] {
  const out = new Set<string>();
  for (const n of names) {
    const slug = slugForName(n);
    if (slug) out.add(slug);
  }
  return [...out];
}
