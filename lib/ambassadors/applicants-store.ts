/**
 * Live ambassador-application feed. Every submission of the site's ambassador
 * form appends one record here (see /api/form-submit), and HQ reads it into the
 * Applicants tab — so new applications show up automatically, stamped with the
 * date they applied. Historical applicants still come from the Google-Sheet
 * import; this only adds the ones that arrive from now on.
 *
 * Self-contained on purpose: it talks to the PRIVATE ambassador Blob store
 * directly (AMB_READ_WRITE_TOKEN), so it works identically on production (where
 * the form is submitted) and on the preview (where HQ runs) without depending on
 * the shared storage layer. Never publicly readable.
 */
import type { Applicant } from "@/lib/ambassadors/applicant-record";

const KEY = "ambassadors/applicants-live.json";

function blobToken(): string | undefined {
  return process.env.AMB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
}

export function applicantsFeedEnabled(): boolean {
  return !!blobToken();
}

export async function getLiveApplicants(): Promise<Applicant[]> {
  const token = blobToken();
  if (!token) return [];
  try {
    const { get } = await import("@vercel/blob");
    const r = await get(KEY, { access: "private", token, useCache: false });
    if (!r || !r.stream) return [];
    const buf = Buffer.from(await new Response(r.stream).arrayBuffer());
    const parsed = JSON.parse(buf.toString("utf8"));
    return Array.isArray(parsed) ? (parsed as Applicant[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(list: Applicant[]): Promise<void> {
  const token = blobToken();
  if (!token) return;
  const { put } = await import("@vercel/blob");
  await put(KEY, JSON.stringify(list), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
    addRandomSuffix: false,
    cacheControlMaxAge: 0,
    token,
  });
}

/**
 * Append one applicant. Read-modify-write; applications are low-frequency so a
 * rare lost concurrent write is acceptable (the Google Sheet is still the system
 * of record). De-dupes on email so a double submit doesn't show twice.
 */
export async function appendApplicant(a: Applicant): Promise<void> {
  const list = await getLiveApplicants();
  const email = (a.email || "").toLowerCase().trim();
  const without = email ? list.filter((x) => (x.email || "").toLowerCase().trim() !== email) : list;
  without.push(a);
  await writeAll(without);
}
