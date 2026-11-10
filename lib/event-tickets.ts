/**
 * Each tour stop's ticket link, as the tour itself publishes it: the
 * `TicketsURL` field of pickleballtournaments.com's tournament record.
 *
 * ⚠ THIS IS THE PRIMARY TICKETS LINK FOR A US TOUR STOP (Wesley, 11/9: "This is
 * the main URL we want to use throughout the website for that tournament").
 * `COMMERCE_BY_SLUG` in lib/placeholder-data.ts is now only the fallback, for a
 * stop whose field is blank, the generic tixr.com/groups/ppa page, or a listing
 * we know is gone. A relisted stop (Malibu 176502 → 212667, 11/9) is fixed by
 * editing the tournament on pickleballtournaments.com, not by a code change.
 *
 * WHERE IT COMES FROM. Only `API_v2_Tourney_GetDetails` (POST, one tournament
 * per call) carries the field; the `ppa_tournaments` feed that builds /events
 * has none. One call per stop is too many for a page render, so the 2-hour
 * events cron (/api/revalidate-events) reads every upcoming US stop and stores
 * the answers as one `api_cache` row; `getEvents()` reads that row.
 *
 * Local dev has no DATABASE_URL, so there it calls GetDetails directly, cached
 * by Next for a day.
 */
import { pbCacheConfigured, readStored, writeStored } from "@/lib/pb-cache";
import { tixrListingGone } from "@/lib/tixr-price-index";

const SP_PATH = "/v1/pb_data/json?sp_name=API_v2_Tourney_GetDetails";
const STORE = "event-tickets:v1";
const TAG = "event-tickets";
/** A week: the cron rewrites it every 2 hours; this only bounds a dead cron. */
const TTL_SECONDS = 7 * 24 * 60 * 60;
/** Per-instance memo of the stored row, so a render costs no DB read. */
const MEMO_MS = 5 * 60 * 1000;

/** tournament_uuid → TicketsURL exactly as entered ("" when blank). */
export type TicketUrlMap = Record<string, string>;

function config() {
  const token = process.env.PB_API_TOKEN;
  const baseUrl = (process.env.PB_API_BASE_URL || "https://api.pickleball.com").replace(/\/$/, "");
  return { token, baseUrl };
}

/** One tournament's TicketsURL; null when the call fails (not when it's blank). */
async function fetchTicketsUrl(
  uuid: string,
  init: { cache?: RequestCache; next?: { revalidate: number } },
): Promise<string | null> {
  const { token, baseUrl } = config();
  if (!token) return null;
  try {
    const res = await fetch(`${baseUrl}${SP_PATH}`, {
      method: "POST",
      headers: { "PB-API-TOKEN": token, "Content-Type": "application/json" },
      body: JSON.stringify({ EventID: uuid }),
      ...init,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { payload?: { TicketsURL?: string | null }[] };
    const row = json.payload?.[0];
    return row ? (row.TicketsURL ?? "").trim() : null;
  } catch {
    return null;
  }
}

/**
 * The link to use, or undefined to fall back to the curated mapping.
 *
 * Only a Tixr EVENT page counts. The blank field and the group page
 * (tixr.com/groups/ppa, what 12 of 13 upcoming stops carried on 11/9) say
 * nothing the fallback doesn't, and a link to a listing the PPA group no longer
 * has (`tixrListingGone`) is a dead page. Anything else (another vendor) is
 * left out for now: the price, the on-sale switch and the tier list are all
 * keyed by Tixr id, and they must move with the link.
 */
export function usableTicketsUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return undefined;
  }
  if (!/(^|\.)tixr\.com$/i.test(u.hostname)) return undefined;
  if (!/\/events\/[^/]*-\d{4,}\/?$/.test(u.pathname)) return undefined;
  const href = `https://www.tixr.com${u.pathname.replace(/\/$/, "")}`;
  return tixrListingGone(href) ? undefined : href;
}

/**
 * The same for a SISTER-TOUR stop (Europe, Canada, Australia, Asia, Spain),
 * where the field wins over lib/sister-tour-tickets (Wesley, 11/9).
 *
 * Looser than {@link usableTicketsUrl}, on purpose: those tours sell through
 * their own storefronts (Asia's own Tixr group, ppatour.com.au, other vendors),
 * so a real http(s) link to anywhere counts. Still refused: the US PPA group
 * page (the wrong tour's box office, the bug lib/sister-tour-tickets exists to
 * prevent), a PPA-group listing that's gone, and a malformed URL such as the
 * `https://https://www.tixr.com/...` ppatour.com.au once published (its
 * "hostname" has no dot). All 9 upcoming sister-tour stops were blank on 11/9.
 */
export function usableSisterTourTicketsUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return undefined;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
  if (!u.hostname.includes(".") || /^https?$/i.test(u.hostname)) return undefined;
  const isTixr = /(^|\.)tixr\.com$/i.test(u.hostname);
  const path = u.pathname.replace(/\/$/, "");
  if (isTixr && /^\/groups\/ppa$/i.test(path)) return undefined;
  if (isTixr && /^\/groups\/ppa\//i.test(path) && tixrListingGone(u.href)) return undefined;
  return u.href;
}

let memo: { at: number; value: TicketUrlMap } | null = null;

/**
 * The stored map (production), or a direct read of `uuids` (local dev).
 * Never throws; an empty map means "use the curated links".
 */
export async function eventTicketUrls(uuids: string[]): Promise<TicketUrlMap> {
  if (!pbCacheConfigured()) {
    const out: TicketUrlMap = {};
    for (const id of uuids) {
      const url = await fetchTicketsUrl(id, { next: { revalidate: 24 * 60 * 60 } });
      if (url !== null) out[id] = url;
    }
    return out;
  }
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.value;
  const row = await readStored(STORE);
  const value = (row?.value as { urls?: TicketUrlMap } | undefined)?.urls;
  if (value) memo = { at: Date.now(), value };
  return value ?? memo?.value ?? {};
}

/**
 * Re-read every stop in `uuids` and store the result. Called by the events
 * cron. One call at a time with a short gap: the GetDetails proc shares the
 * platform's rate limit with scores and brackets (the 10/2 429s).
 *
 * A failed call keeps that stop's previous value; if every call fails nothing
 * is written, so a throttled run can't blank the links.
 */
export async function refreshEventTicketUrls(
  uuids: string[],
): Promise<{ ok: boolean; read: number; failed: number; specific: number }> {
  const prev = ((await readStored(STORE))?.value as { urls?: TicketUrlMap } | undefined)?.urls ?? {};
  const urls: TicketUrlMap = {};
  let failed = 0;
  for (const id of uuids) {
    const url = await fetchTicketsUrl(id, { cache: "no-store" });
    if (url === null) {
      failed += 1;
      if (id in prev) urls[id] = prev[id];
    } else {
      urls[id] = url;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  const read = uuids.length - failed;
  const specific = Object.values(urls).filter((u) => usableTicketsUrl(u)).length;
  if (read === 0 && uuids.length > 0) return { ok: false, read, failed, specific };
  const ok = await writeStored(STORE, TAG, { at: new Date().toISOString(), urls }, TTL_SECONDS);
  if (ok) memo = { at: Date.now(), value: urls };
  return { ok, read, failed, specific };
}
