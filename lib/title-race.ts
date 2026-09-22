/**
 * All-time titles race: every pro title at PPA Tour events since 2020.
 *
 * The data is a static file, `lib/data/title-race.json`, rebuilt from the PPA
 * Tour History sheet by `scripts/build-title-race.py`. It is the same parse as
 * Jackalope's title-race social video, and it lands on the totals Hannah Johns
 * and Jim Ramsey confirmed on 17 Sept 2026 (Anna Leigh Waters 196, Ben Johns
 * 186). A doubles title counts for each partner.
 *
 * Headshots: the generator already set `head` for every player with a studio
 * headshot in `public/ppa/pros`. For the rest (mostly pros who have retired
 * since 2020) we ask Jackalope's player feed, which carries a square,
 * face-cropped `headshot` per pro since 18 Sept 2026. No match, or the feed is
 * down: the row shows initials. Never a guessed face.
 */
import raw from "@/lib/data/title-race.json";
import { ATHLETES_CACHE_TAG } from "@/lib/cache-tags";

export type RaceDiscipline = "WS" | "MS" | "MX" | "WD" | "MD";
export type RaceEvent = { d: string; n: string; w: [string, RaceDiscipline][] };
export type RacePlayer = { g: "W" | "M"; slug?: string; head?: string };
export type TitleRaceData = {
  through: { date: string; event: string };
  events: RaceEvent[];
  players: Record<string, RacePlayer>;
};

const FEED = "https://jackalopehq.vercel.app/api/public/paddles";
/** 24h, like every other athlete data source. See the ISR note in lib/player-overrides.ts. */
const REVALIDATE_S = 60 * 60 * 24;
/** The sheet's spelling → the spelling on Jackalope's player rows, where they differ. */
const FEED_ALIASES: Record<string, string[]> = {
  "Federico Staksrud": ["Federico Stakstrud"],
  "Jocelyn Devilliers": ["Jay Devillers", "Jay Devilliers"],
  "Gabriel Tardio": ["Gabe Tardio"],
  "Parris Todd": ["Paris Todd"],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

async function feedHeadshots(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const res = await fetch(FEED, {
      next: { revalidate: REVALIDATE_S, tags: [ATHLETES_CACHE_TAG] },
    });
    if (!res.ok) return map;
    const json = (await res.json()) as { paddles?: { player?: string; headshot?: string | null }[] };
    const seen = new Set<string>();
    for (const p of json.paddles ?? []) {
      if (!p.player) continue;
      const k = norm(p.player);
      // Two rows with one name: we can't tell whose face it is, so neither gets one.
      if (seen.has(k)) { map.delete(k); continue; }
      seen.add(k);
      if (p.headshot && /^https:\/\//.test(p.headshot)) map.set(k, p.headshot);
    }
  } catch {
    /* feed down: initials it is */
  }
  return map;
}

export async function getTitleRace(): Promise<TitleRaceData> {
  const data = raw as unknown as TitleRaceData;
  const missing = Object.entries(data.players).filter(([, p]) => !p.head);
  if (!missing.length) return data;
  const shots = await feedHeadshots();
  const players = { ...data.players };
  for (const [name, p] of missing) {
    for (const n of [name, ...(FEED_ALIASES[name] ?? [])]) {
      const url = shots.get(norm(n));
      if (url) { players[name] = { ...p, head: url }; break; }
    }
  }
  return { ...data, players };
}
