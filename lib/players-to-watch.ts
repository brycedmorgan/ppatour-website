/**
 * "Players to Watch" — picked per event from the published draw, each with a
 * factual hook rather than hand-written hype.
 *
 * Two hard rules from the brief:
 *   1. Only players actually IN the draw. There is no entry list before the draw
 *      publishes (see lib/event-field.ts), so the column is hidden until then
 *      rather than filled with generic names — which is why every event page
 *      used to show the same three players.
 *   2. No straight defending-champion picks; that section sits right alongside
 *      this one. (A back-to-back winner would be the exception, but that needs a
 *      second prior-year mapping which isn't confirmed yet — see
 *      docs/DATA-ASKS.md.)
 *
 * Angles come from `lib/data/watch-angles.json` (built by
 * scripts/gen-watch-angles.mjs). Hooks state a fact and nothing more.
 */
import angles from "@/lib/data/watch-angles.json";
import type { EventField, FieldPlayer } from "@/lib/event-field";
import type { DefendingChampion } from "@/lib/defending-champions";
import { playerPhoto } from "@/lib/player-photos";

type Mover = {
  slug: string;
  name: string;
  from: number;
  to: number;
  places: number;
  lostPoints?: boolean;
};
type Angles = {
  asOf: string;
  comparedTo: string;
  movement: Record<string, { risers: Mover[]; sliding: Mover[] }>;
  silverNoGold: { name: string; silvers: number }[];
  runnersUp?: Record<string, { division: string; name: string }[]>;
  tripleCrowns?: { name: string; count: number; events: string[] }[];
  topRanked?: Record<string, { name: string; rank: number; points: number }>;
};

const DATA = angles as Angles;

export type WatchPick = {
  /**
   * The players sharing this card. Usually one; triple-crown winners are grouped
   * into a single card when more than one achieved it.
   */
  players: string[];
  /** The reason they're featured — always a stated fact. */
  hook: string;
  /** Short label, e.g. "No. 1 seed" or "Into the top 10". */
  badge: string;
  seed: number | null;
  divisions: string[];
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Match on first+last too, since feeds disagree about middle names. */
function keys(name: string): string[] {
  const n = norm(name);
  const parts = n.split(" ");
  const fl = parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : n;
  return fl === n ? [n] : [n, fl];
}

function findInField(field: Map<string, FieldPlayer>, name: string): FieldPlayer | null {
  for (const k of keys(name)) {
    const hit = field.get(k);
    if (hit) return hit;
  }
  return null;
}

/** "2026-04-30" → "April". */
function monthName(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? "earlier this season"
    : d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
}

const ordinal = (n: number) => `No. ${n}`;

/**
 * Breaking into the top 10 is the story worth leading with, so risers are ranked
 * by that before raw places gained. A PRIORITY, not a filter — as of 2026-07-29
 * no riser is inside the top 10 (best is No. 15), so filtering would empty the
 * card. It fires during the season: Connor Garnett went 14 → 10 over the Atlanta
 * and Finals fortnight.
 */
function riserPriority(m: Mover): number {
  if (m.to <= 10 && m.from > 10) return 0; // broke into the top 10
  if (m.to <= 10) return 1; // climbing inside the top 10
  return 2;
}

function sortRisers(risers: Mover[]): Mover[] {
  return [...risers].sort(
    (a, b) => riserPriority(a) - riserPriority(b) || b.places - a.places,
  );
}

/** Card copy for a climber — leads with the top-10 breakthrough when there is one. */
function riserCopy(m: Mover, since: string): { hook: string; badge: string } {
  const move = `up ${m.places} places since ${since}, from ${ordinal(m.from)} to ${ordinal(m.to)}`;
  if (m.to <= 10 && m.from > 10) {
    return { hook: `Broke into the world top 10 — ${move}.`, badge: "Into the top 10" };
  }
  if (m.to <= 10) {
    return { hook: `Climbing inside the world top 10 — ${move}.`, badge: `Up to ${ordinal(m.to)}` };
  }
  return {
    hook: `Up ${m.places} places in the world rankings since ${since}, from ${ordinal(m.from)} to ${ordinal(m.to)}.`,
    badge: `Up ${m.places} places`,
  };
}

/** Stable per-event offset, so stops don't all surface the same names. */
function rotation(eventKey: string): number {
  let h = 0;
  for (let i = 0; i < eventKey.length; i++) h = (h * 31 + eventKey.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * From a doubles team string, the player we can best render — prefer one with a
 * headshot on the roster, else the first named. A team name can't resolve to a
 * single photo, so the card has to commit to one player.
 */
function pickFromTeam(team: string): string {
  const players = team
    .split("&")
    .map((p) => p.trim())
    .filter(Boolean);
  return players.find((p) => playerPhoto(p)) ?? players[0] ?? team;
}

/**
 * Last season's triple-crown winners as a single leading card. Returns true when
 * one was added. Two or more winners share the card rather than taking a slot
 * each. Not subject to the champion exclusion — see the call site.
 */
function addTripleCrown(picks: WatchPick[], used: Set<string>, limit: number): boolean {
  const crowns = DATA.tripleCrowns ?? [];
  if (crowns.length === 0 || picks.length >= limit) return false;

  const names = crowns.map((c) => c.name);
  for (const n of names) used.add(keys(n)[0]);

  const many = names.length > 1;
  // "6x" only reads correctly for a single winner; with several, keep it simple.
  const times = !many && crowns[0].count > 1 ? ` ${crowns[0].count} times` : "";
  const crownFact = `won the triple crown${times} last season — singles, gender doubles and mixed at the same event`;

  // A lone winner who is also their gender's World No. 1 gets both facts on the
  // one card, rather than being deduped out of the No. 1 slot elsewhere.
  const alsoNo1 = many ? null : topRankedLabelFor(names[0]);
  if (alsoNo1) {
    picks.push({
      players: names,
      hook: `${alsoNo1} World Pickleball Ranking No. 1, and ${crownFact}.`,
      badge: `World No. 1 · Triple crown`,
      seed: null,
      divisions: [],
    });
    return true;
  }

  picks.push({
    players: names,
    hook: `Won the triple crown${times} last season — singles, gender doubles and mixed at the same event.`,
    badge: many ? "Triple crown winners" : "Triple crown",
    seed: null,
    divisions: [],
  });
  return true;
}

/** "Men's" / "Women's" when this player currently tops that board, else null. */
function topRankedLabelFor(name: string): string | null {
  const k = keys(name)[0];
  for (const [gender, top] of Object.entries(DATA.topRanked ?? {})) {
    if (keys(top.name)[0] === k) return gender === "men" ? "Men's" : "Women's";
  }
  return null;
}

/**
 * Picks for an event whose draw hasn't published yet. We can't know who is
 * entered, so these are framed as storylines rather than "in the draw" — the
 * caller must not label them as the field. Rotated by `eventKey` so different
 * stops feature different players, and led by last year's runner-up at THIS
 * stop, which is the only event-specific signal available pre-draw.
 *
 * NO risers here: Wesley's call 2026-07-29 is that a climber may only be shown
 * once the draw is official AND they are in it, so that angle lives solely in the
 * published-draw path below.
 */
function previewPicks(
  eventKey: string,
  exclude: DefendingChampion[],
  limit: number,
): WatchPick[] {
  const blocked = new Set<string>();
  for (const c of exclude) {
    for (const part of c.name.split("&")) for (const k of keys(part.trim())) blocked.add(k);
  }

  const picks: WatchPick[] = [];
  const used = new Set<string>();
  const push = (name: string, hook: string, badge: string, divisions: string[] = []): boolean => {
    if (picks.length >= limit) return false;
    const k = keys(name)[0];
    if (used.has(k) || blocked.has(k)) return false;
    used.add(k);
    picks.push({ players: [name], hook, badge, seed: null, divisions });
    return true;
  };

  const off = rotation(eventKey);

  // 0. Triple crown leads, and DELIBERATELY ignores `blocked` — Wesley's call
  //    2026-07-29: the accolade outranks the no-duplicate-champion rule, so it
  //    shows even where the same player is in the Defending Champions column.
  //    Multiple winners share one card ("show them together in the box").
  addTripleCrown(picks, used, limit);

  // 0b. A brand-new stop has no prior-year champions AND no runners-up, so there
  //     is no event history to lean on. Lead with the current World Pickleball
  //     Ranking No. 1s instead (Wesley 2026-07-29). An empty `exclude` is exactly
  //     the "no defending champs" signal.
  if (exclude.length === 0) {
    for (const gender of ["men", "women"] as const) {
      const top = DATA.topRanked?.[gender];
      if (!top) continue;
      const label = gender === "men" ? "Men's" : "Women's";
      push(
        top.name,
        `${label} World Pickleball Ranking No. 1, on ${Math.round(top.points).toLocaleString()} points.`,
        `World No. 1 — ${label}`,
      );
    }
  }

  // 1. Last year's runner-up here — rotate which division leads per event.
  const ru = DATA.runnersUp?.[eventKey] ?? [];
  for (let i = 0; i < ru.length; i++) {
    const row = ru[(off + i) % ru.length];
    const added = push(
      pickFromTeam(row.name),
      `Runner-up in ${row.division} at this stop last year.`,
      "Runner-up here",
      [row.division],
    );
    if (added) break;
  }

  // 3. Silver but no gold last season.
  const silver = DATA.silverNoGold ?? [];
  for (let i = 0; i < silver.length && picks.length < limit; i++) {
    const s = silver[(off + i) % silver.length];
    push(
      s.name,
      `${s.silvers} silver medals last season without a gold — still chasing a first title.`,
      `${s.silvers} silvers, no gold`,
    );
  }

  return picks.slice(0, limit);
}

/**
 * Up to `limit` players to watch for an event.
 *
 * Once the draw is published these come from the actual field, with seeds. Until
 * then they're storyline picks (see {@link previewPicks}) — factual, but NOT a
 * claim about who is entered, so the caller must not headline them as the draw.
 *
 * `exclude` should be the event's defending champions so the two sections never
 * feature the same player.
 */
export function getPlayersToWatch(
  field: EventField,
  exclude: DefendingChampion[] = [],
  eventKey = "",
  limit = 3,
): WatchPick[] {
  if (!field.published || field.players.length === 0) {
    return previewPicks(eventKey, exclude, limit);
  }

  // Index the field by both full and first+last keys for tolerant matching.
  const byKey = new Map<string, FieldPlayer>();
  for (const p of field.players) for (const k of keys(p.name)) if (!byKey.has(k)) byKey.set(k, p);

  // Champions are shown in their own section — never repeat them here.
  const blocked = new Set<string>();
  for (const c of exclude) {
    for (const part of c.name.split("&")) {
      for (const k of keys(part.trim())) blocked.add(k);
    }
  }

  const picks: WatchPick[] = [];
  const used = new Set<string>();
  // One pick per angle, so the three cards tell three different stories rather
  // than three variations of "climbing the rankings".
  const angleUsed = new Set<string>();

  const add = (angle: string, p: FieldPlayer, hook: string, badge: string) => {
    if (picks.length >= limit) return;
    // An empty angle means "no cap" — used by the top-seed fill stage.
    if (angle && angleUsed.has(angle)) return;
    const k = keys(p.name)[0];
    if (used.has(k) || blocked.has(k)) return;
    used.add(k);
    angleUsed.add(angle);
    picks.push({ players: [p.name], hook, badge, seed: p.seed, divisions: p.divisions });
  };

  const since = monthName(DATA.comparedTo);

  // 0. Triple crown leads here too, but only for winners actually in this draw —
  //    the heading reads "In the Draw" once it's published, so everything shown
  //    must genuinely be in it. Ignores `blocked` (accolade outranks the
  //    no-duplicate-champion rule, per Wesley 2026-07-29).
  const crownsInDraw = (DATA.tripleCrowns ?? []).filter((c) => findInField(byKey, c.name));
  if (crownsInDraw.length > 0) {
    const names = crownsInDraw.map((c) => c.name);
    for (const n of names) used.add(keys(n)[0]);
    const many = names.length > 1;
    const times = !many && crownsInDraw[0].count > 1 ? ` ${crownsInDraw[0].count} times` : "";
    picks.push({
      players: names,
      hook: `Won the triple crown${times} last season — singles, gender doubles and mixed at the same event.`,
      badge: many ? "Triple crown winners" : "Triple crown",
      seed: findInField(byKey, names[0])?.seed ?? null,
      divisions: [],
    });
  }

  const movers = sortRisers([
    ...(DATA.movement.men?.risers ?? []),
    ...(DATA.movement.women?.risers ?? []),
  ]);
  const sliders = [
    ...(DATA.movement.men?.sliding ?? []),
    ...(DATA.movement.women?.sliding ?? []),
  ].sort((a, b) => b.places - a.places);

  // 1. On the rise — capped to the top 25 upstream, so always a known name.
  for (const m of movers) {
    const p = findInField(byKey, m.name);
    if (p) {
      const c = riserCopy(m, since);
      add("riser", p, c.hook, c.badge);
    }
  }

  // 2. Silver but no gold last season — chasing a first title.
  for (const s of DATA.silverNoGold) {
    const p = findInField(byKey, s.name);
    if (p) {
      add(
        "silver-no-gold",
        p,
        `${s.silvers} silver medals last season without a gold — still chasing a first title.`,
        `${s.silvers} silvers, no gold`,
      );
    }
  }

  // 3. Slipping. Only say so when they actually shed points; otherwise they were
  //    passed from below, and calling that "falling" would be wrong.
  for (const m of sliders) {
    const p = findInField(byKey, m.name);
    if (p) {
      add(
        "slipping",
        p,
        m.lostPoints
          ? `Has slipped ${m.places} places since ${since}, from ${ordinal(m.from)} to ${ordinal(m.to)}.`
          : `Held their points but was passed ${m.places} places since ${since}, now ${ordinal(m.to)}.`,
        m.lostPoints ? `Down ${m.places} places` : "Under pressure",
      );
    }
  }

  // 4. Fill from the top of the draw.
  const seeded = field.players
    .filter((p) => p.seed != null)
    .sort((a, b) => (a.seed as number) - (b.seed as number));
  for (const p of seeded) {
    const where = p.divisions.length > 1 ? `${p.divisions.length} divisions` : p.divisions[0];
    add("", p, `Top seed in the draw${where ? ` — entered in ${where}` : ""}.`, `${ordinal(p.seed as number)} seed`);
  }

  return picks.slice(0, limit);
}
