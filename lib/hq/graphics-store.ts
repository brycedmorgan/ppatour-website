/**
 * The LIVE graphics collection for /hq — the one place team uploads persist.
 *
 * Kept separate from the weekly hq.json snapshot on purpose: the payout refresh
 * overwrites hq.json, but graphics are edited by hand on the site, so they live
 * in their own `graphics.json` in the private store and /hq reads them over the
 * snapshot. This is what stops a Monday refresh from wiping the team's uploads.
 *
 * A graphic doc mirrors what the HQ app writes:
 *   { _id, event, kind, title, fileName, assetId, contentType, sizeBytes, by, at, stamp? }
 */
import crypto from "node:crypto";
import { getJson, putJson } from "@/lib/ambassadors/store";

const KEY = "graphics.json";

export interface Graphic {
  _id: string;
  event?: string;
  kind?: string;
  title?: string;
  fileName?: string;
  assetId?: string;
  contentType?: string;
  sizeBytes?: number;
  by?: string | null;
  at?: string;
  stamp?: unknown;
  [k: string]: unknown;
}

/** Current live graphics, or null if the store has never been seeded. */
export async function getGraphics(): Promise<Graphic[] | null> {
  return getJson<Graphic[]>(KEY);
}

export async function putGraphics(list: Graphic[]): Promise<void> {
  await putJson(KEY, list);
}

function newId(): string {
  return crypto.randomBytes(12).toString("hex");
}

export async function addGraphic(doc: Record<string, unknown>): Promise<{ id: string; list: Graphic[] }> {
  const list = (await getGraphics()) ?? [];
  const id = newId();
  // Strip any client-supplied _id; the server owns it.
  const clean = { ...doc };
  delete (clean as Record<string, unknown>)._id;
  const g: Graphic = { _id: id, ...clean };
  list.push(g);
  await putGraphics(list);
  return { id, list };
}

export async function updateGraphic(id: string, patch: Record<string, unknown>): Promise<Graphic[]> {
  const list = (await getGraphics()) ?? [];
  const i = list.findIndex((g) => g._id === id);
  if (i >= 0) {
    const merged = { ...list[i], ...patch, _id: id };
    list[i] = merged as Graphic;
    await putGraphics(list);
  }
  return list;
}

export async function deleteGraphic(id: string): Promise<Graphic[]> {
  const list = (await getGraphics()) ?? [];
  const next = list.filter((g) => g._id !== id);
  await putGraphics(next);
  return next;
}
