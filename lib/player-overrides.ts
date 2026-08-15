/**
 * Per-player paddle data managed in Jackalope (Pro Player Central → Paddles & Watch,
 * Dillon Segur + Liv Borski). This is the LIVE source of truth for what's in the bag —
 * a pro's paddle changes there and this page reflects it within the ISR window, no
 * rebuild. Fields:
 *   - paddle / searchTerm — the brand + model, live. Wins over the static broadcast
 *     masterlist (`lib/athlete-paddles.ts`), which stays as the fallback for a pro the
 *     feed doesn't cover or when the feed is unreachable.
 *   - image — the paddle photo (og:image scraped from the linked Pickleball Central page).
 *   - pbcUrl — the exact PBC product page for their paddle (the "Buy This Paddle" link),
 *     instead of a PBC search.
 *   - featuredMatchUrl — a pinned YouTube match the athlete's "Watch" section leads with,
 *     for players whose highlight feed is empty or full of low-quality clips (Connor, 8/7).
 *   - heroImage — the full-bleed action shot behind the profile hero (see lib/athlete-heroes.ts).
 *     ⚠ Null for every pro today: Jackalope's photo library is keyed by VENUE, not by player,
 *     so nothing over there can name a hero yet. The field is wired so that tagging heroes to
 *     players in Jackalope lights up all 179 profiles with no code change here.
 *
 * Jackalope keys players by NAME (there is no slug over there), so this matches on a
 * normalized name. Fetched server-side under 5-min ISR; empty/unreachable → no
 * override, and every caller falls back to its existing behaviour.
 *
 * ⚠ AMBIGUOUS NAMES ARE DROPPED. If two feed rows normalize to the same name we can't
 * tell which pro the paddle belongs to, so neither gets an override and both fall back
 * to the carefully slug-resolved static masterlist. A wrong paddle is a commercial
 * claim about a brand relationship — better to show the safe static value or nothing.
 */
import { ATHLETES_CACHE_TAG } from "@/lib/cache-tags";

const FEED = "https://jackalopehq.vercel.app/api/public/paddles";
const REVALIDATE_S = 300;

export type PlayerOverride = {
  paddle: string | null;
  searchTerm: string | null;
  /**
   * The manufacturer, on its own, as the feed states it.
   *
   * ⚠ NOT the same thing as `GearLink.brand`, which is only set when the paddle
   * brand is an official PPA partner — that field answers "does this pro earn
   * the partner badge". This one answers "who makes this paddle", which is what
   * the Product structured data needs. Null for a pro the feed doesn't cover;
   * never guessed by splitting the display string, because a model name can
   * lead with a word that isn't the brand.
   */
  brand: string | null;
  image: string | null;
  featuredMatchUrl: string | null;
  pbcUrl: string | null;
  /**
   * ⚠ NOT the same field as `image`, which is the PADDLE photo. This is a photo of the
   * ATHLETE — the profile hero. Two image fields on one record is a footgun, so they are
   * never defaulted to each other: a paddle cut-out stretched across a player's hero band
   * is a worse page than the plain navy one.
   */
  heroImage: string | null;
};

type FeedPaddle = {
  player?: string;
  manufacturer?: string | null;
  model?: string | null;
  pbcUrl?: string | null;
  image?: string | null;
  featuredMatchUrl?: string | null;
  heroImage?: string | null;
};

/**
 * Only official-partner brands are re-spelled, and for a functional reason:
 * `lib/athlete-gear.ts` decides whether to print "Official Partner of the PPA Tour"
 * by matching the paddle string against the live `partners` roster on the partner's
 * own name. The feed writes "SixZero"; the partner is "Six Zero", so left alone those
 * pros silently lose the badge. Everything else keeps the event team's spelling.
 * (Mirrors BRAND_DISPLAY in scripts/import-paddles.mjs.)
 */
const BRAND_DISPLAY: Record<string, string> = {
  joola: "JOOLA",
  sixzero: "Six Zero",
  "six zero": "Six Zero",
  proton: "Proton",
  "11six24": "11SIX24",
};

/** Build the display paddle + PBC search term from the feed's brand/model, applying the
 *  same brand-display + model-already-has-brand rules the static importer uses. */
function buildPaddle(
  mfr?: string | null,
  model?: string | null,
): { paddle: string; searchTerm: string; brand: string } | null {
  const m = (model || "").trim();
  const rawBrand = (mfr || "").trim();
  if (!m || !rawBrand) return null;
  const brand = BRAND_DISPLAY[rawBrand.toLowerCase()] ?? rawBrand;
  const nb = normName(brand);
  const modelHasBrand = normName(m).startsWith(nb + " ") || normName(m) === nb;
  const paddle = (modelHasBrand ? m : `${brand} ${m}`).replace(/\s+/g, " ").trim();
  const firstModel = m.split(",")[0];
  const searchTerm = (modelHasBrand ? firstModel : `${brand} ${firstModel}`).replace(/\s+/g, " ").trim();
  return { paddle, searchTerm, brand };
}

/** Lowercase, strip accents + punctuation, collapse whitespace — for name matching. */
function normName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

let cache: { value: Map<string, PlayerOverride>; expires: number } | null = null;
const TTL_MS = REVALIDATE_S * 1000;

async function fetchOverrides(): Promise<Map<string, PlayerOverride>> {
  const map = new Map<string, PlayerOverride>();
  try {
    const res = await fetch(FEED, {
      next: { revalidate: REVALIDATE_S, tags: [ATHLETES_CACHE_TAG] },
    });
    if (!res.ok) return map;
    const json = (await res.json()) as { paddles?: FeedPaddle[] };
    const seen = new Set<string>();     // names encountered — a second sighting = ambiguous
    for (const p of json.paddles ?? []) {
      const name = (p.player || "").trim();
      if (!name) continue;
      const key = normName(name);
      // Ambiguous name: two feed rows normalize the same. Drop it so both pros fall
      // back to the slug-resolved static masterlist rather than risk the wrong paddle.
      if (seen.has(key)) { map.delete(key); continue; }
      seen.add(key);
      const built = buildPaddle(p.manufacturer, p.model);
      const featuredMatchUrl = (p.featuredMatchUrl || "").trim() || null;
      const pbcUrl = (p.pbcUrl || "").trim() || null;
      const image = (p.image || "").trim() || null;
      const heroImage = (p.heroImage || "").trim() || null;
      // Nothing worth overriding with → skip (leaves the static fallback in place).
      if (!built && !featuredMatchUrl && !pbcUrl && !image && !heroImage) continue;
      map.set(key, {
        paddle: built?.paddle ?? null,
        searchTerm: built?.searchTerm ?? null,
        brand: built?.brand ?? null,
        image,
        featuredMatchUrl,
        pbcUrl,
        heroImage,
      });
    }
  } catch {
    // ignore — no override, callers fall back
  }
  return map;
}

async function cachedOverrides(): Promise<Map<string, PlayerOverride>> {
  if (cache && cache.expires > Date.now()) return cache.value;
  const value = await fetchOverrides();
  // Only cache a populated map, so a transient empty fetch doesn't pin "no overrides".
  if (value.size) cache = { value, expires: Date.now() + TTL_MS };
  return value;
}

/** The pinned overrides for a player by display name, or null when none. */
export async function playerOverrideFor(name: string): Promise<PlayerOverride | null> {
  if (!name) return null;
  const map = await cachedOverrides();
  return map.get(normName(name)) ?? null;
}
