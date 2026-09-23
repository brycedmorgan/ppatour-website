/**
 * Storage for the ambassador dashboard. Two backends, picked at runtime:
 *
 *  - PRODUCTION: Vercel Blob, PRIVATE access. The daily `portal.json`, the
 *    graphic images, one-time sign-in tokens and rate counters all live under
 *    the `ambassadors/` prefix and are never publicly readable — the server
 *    reads them with the store's token and hands out only filtered slices.
 *  - LOCAL DEV: a git-ignored `.ambassadors-dev/` directory, so the real
 *    sample file (which must never be committed) drives the build on a laptop
 *    with no Blob store linked.
 *
 * `BLOB_READ_WRITE_TOKEN` (set automatically when a Vercel Blob store is linked)
 * is what flips between them. Everything else in the app talks to this module,
 * never to `@vercel/blob` or `fs` directly.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const DEV_DIR = path.join(process.cwd(), ".ambassadors-dev");
const PREFIX = "ambassadors";

/**
 * The read-write token for the ambassador Blob store. Prefer the dedicated
 * PRIVATE store (AMB_READ_WRITE_TOKEN); fall back to the project's default
 * store token. The token identifies the store, so no storeId is needed.
 */
function blobToken(): string | undefined {
  return process.env.AMB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
}

export function hasBlob(): boolean {
  return !!blobToken();
}

/* ----------------------------- blob helpers ----------------------------- */
// Isolated so the rest of the app is Blob-agnostic. Uses PRIVATE access: the
// object requires the store token to read (get()), so portal.json, hq.json and
// the ambassador images are never reachable at a public URL.

async function blobPut(key: string, body: string | Buffer, contentType: string): Promise<void> {
  const { put } = await import("@vercel/blob");
  await put(`${PREFIX}/${key}`, body, {
    access: "private",
    contentType,
    allowOverwrite: true,
    addRandomSuffix: false,
    cacheControlMaxAge: 0,
    token: blobToken(),
  });
}

async function blobGet(key: string): Promise<Buffer | null> {
  const { get } = await import("@vercel/blob");
  try {
    // Private read: get() streams the bytes back for a caller holding the token.
    // useCache:false so a just-uploaded portal.json/hq.json is read from origin,
    // not a stale CDN copy.
    const r = await get(`${PREFIX}/${key}`, { access: "private", token: blobToken(), useCache: false });
    if (!r || !r.stream) return null;
    return Buffer.from(await new Response(r.stream).arrayBuffer());
  } catch {
    return null;
  }
}

async function blobDel(key: string): Promise<void> {
  const { del } = await import("@vercel/blob");
  try {
    await del(`${PREFIX}/${key}`, { token: blobToken() });
  } catch {
    /* already gone */
  }
}

/* ------------------------------ fs helpers ------------------------------ */

async function fsPath(key: string): Promise<string> {
  const p = path.join(DEV_DIR, key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  return p;
}

/* ------------------------------- public API ----------------------------- */

export async function getBytes(key: string): Promise<Buffer | null> {
  if (hasBlob()) return blobGet(key);
  try {
    return await fs.readFile(path.join(DEV_DIR, key));
  } catch {
    return null;
  }
}

export async function putBytes(key: string, body: string | Buffer, contentType: string): Promise<void> {
  if (hasBlob()) return blobPut(key, body, contentType);
  await fs.writeFile(await fsPath(key), body);
}

export async function delKey(key: string): Promise<void> {
  if (hasBlob()) return blobDel(key);
  try {
    await fs.unlink(path.join(DEV_DIR, key));
  } catch {
    /* already gone */
  }
}

export async function getJson<T = unknown>(key: string): Promise<T | null> {
  const b = await getBytes(key);
  if (!b) return null;
  try {
    return JSON.parse(b.toString("utf8")) as T;
  } catch {
    return null;
  }
}

export async function putJson(key: string, value: unknown): Promise<void> {
  await putBytes(key, JSON.stringify(value), "application/json");
}
