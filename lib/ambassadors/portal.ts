/**
 * Reads the stored portal.json and turns it into the per-ambassador payload
 * that /api/ambassadors/me returns. This is the ONLY place the raw
 * `ambassadors` object is opened, and nothing here ever returns another
 * ambassador's slice: the caller gets their own entry plus `shared`, with
 * leaderboards cleaned (rows marked `isYou`, `id` stripped) and the internal
 * `tier` removed.
 */
import { getJson } from "@/lib/ambassadors/store";
import { demoPortal } from "@/lib/ambassadors/demo";
import { previewEnabled } from "@/lib/ambassadors/config";

export type LbRow = { rank: number; name: string; points: number; id?: string; isYou?: boolean };
type Board = { registrations: LbRow[]; tickets: LbRow[] };
export type Leaderboards = { season: Board; events: Record<string, Board> };

export type Ambassador = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  codes: string[];
  tier?: string;
  hideCommission?: boolean;
  [k: string]: unknown;
};

export type Portal = {
  version: number;
  generatedAt: string;
  season: string;
  shared: {
    events: unknown[];
    leaderboards: Leaderboards;
    graphics: unknown[];
    program: unknown;
  };
  ambassadors: Record<string, Ambassador>;
};

export type MePayload = {
  generatedAt: string;
  season: string;
  preview?: boolean;
  shared: Portal["shared"];
  me: Omit<Ambassador, "tier">;
};

const TTL_MS = process.env.NODE_ENV === "production" ? 60_000 : 3_000;
let cache: { at: number; portal: Portal | null } | null = null;

/** The current stored portal, cached briefly. `null` when nothing is uploaded. */
export async function getPortal(): Promise<Portal | null> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.portal;
  let portal = await getJson<Portal>("portal.json");
  // Off-production only: fall back to the committed demo dataset so /ambassadors
  // is previewable with no Blob store and no real upload.
  if (!portal && previewEnabled()) portal = demoPortal();
  if (portal && portal.version !== 1) portal = null;
  cache = { at: now, portal };
  return portal;
}

/** Force the next read to hit storage (used right after an upload). */
export function bustPortalCache(): void {
  cache = null;
}

export function normEmail(email: string | null | undefined): string {
  return String(email ?? "").trim().toLowerCase();
}

/**
 * Off-production only: the ambassadors in the CURRENT portal, offered by the
 * "preview as" sign-in so a reviewer can click through as any of them. Reads
 * whatever is loaded — the real sample file locally, the demo dataset on
 * staging. Never call this on production (previewEnabled gates the caller).
 */
export async function previewSignInOptions(): Promise<{ email: string; label: string }[]> {
  const portal = await getPortal();
  if (!portal) return [];
  return Object.values(portal.ambassadors)
    .map((a) => ({ email: a.email, label: `${a.firstName} ${a.lastName}` }))
    .filter((o) => o.email)
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** The raw ambassador entry for an email, or null. Internal use only. */
export async function ambassadorForEmail(email: string): Promise<Ambassador | null> {
  const portal = await getPortal();
  if (!portal) return null;
  return portal.ambassadors[normEmail(email)] ?? null;
}

/** True if the email can currently sign in (present in the live roster). */
export async function emailIsAmbassador(email: string): Promise<boolean> {
  return (await ambassadorForEmail(email)) != null;
}

function cleanBoard(board: Board | undefined, myCodes: Set<string>): Board {
  const clean = (rows: LbRow[] = []): LbRow[] =>
    rows.map((r) => {
      const isYou = r.id != null && myCodes.has(r.id);
      const out: LbRow = { rank: r.rank, name: r.name, points: r.points };
      if (isYou) out.isYou = true;
      return out; // `id` intentionally dropped — it exposes other people's codes
    });
  return { registrations: clean(board?.registrations), tickets: clean(board?.tickets) };
}

/** Build the safe `me` payload for a signed-in ambassador, or null. */
export async function buildMe(email: string): Promise<MePayload | null> {
  const portal = await getPortal();
  if (!portal) return null;
  const entry = portal.ambassadors[normEmail(email)];
  if (!entry) return null;

  const myCodes = new Set<string>([entry.id, ...(entry.codes ?? [])].filter(Boolean));
  const lb = portal.shared.leaderboards;
  const cleanedLeaderboards: Leaderboards = {
    season: cleanBoard(lb?.season, myCodes),
    events: Object.fromEntries(
      Object.entries(lb?.events ?? {}).map(([id, b]) => [id, cleanBoard(b, myCodes)]),
    ),
  };

  const { tier: _tier, ...mePublic } = entry; // never expose the internal tier
  void _tier;

  return {
    generatedAt: portal.generatedAt,
    season: portal.season,
    preview: (portal as Portal & { __demo?: boolean }).__demo === true || undefined,
    shared: { ...portal.shared, leaderboards: cleanedLeaderboards },
    me: mePublic,
  };
}
