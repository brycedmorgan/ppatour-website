/**
 * POST /api/hq/applicants — add one applicant to the live feed (HQ Applicants).
 *
 *   Authorization: Bearer <AMBASSADOR_DATA_SECRET>
 *   Body: a raw applicant object, OR { record } (a form-submit record to map).
 *
 * The main feed is the site form (/api/form-submit writes directly). This is a
 * secondary/manual ingest — e.g. re-importing from the sheet, or a backfill.
 * Stored privately; HQ merges it in, stamped with the applied date.
 */
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { appendApplicant, removeApplicant } from "@/lib/ambassadors/applicants-store";
import { buildApplicant, type Applicant } from "@/lib/ambassadors/applicant-record";
import { dataSecret } from "@/lib/ambassadors/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearerOk(header: string | null): boolean {
  const secret = dataSecret();
  if (!secret) return false;
  const got = (header ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!bearerOk(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: { record?: Record<string, unknown> } & Partial<Applicant>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const applicant: Applicant = body.record ? buildApplicant(body.record) : (body as Applicant);
  if (!applicant || !applicant.email) {
    return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
  }
  if (!applicant.applied) applicant.applied = new Date().toISOString().slice(0, 10);
  if (!applicant.id) applicant.id = applicant.email.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 40) || "applicant";
  applicant.count = applicant.count ?? 1;
  await appendApplicant(applicant);
  return NextResponse.json({ ok: true, id: applicant.id });
}

/** DELETE /api/hq/applicants?email=<x> removes one; no email clears the feed. */
export async function DELETE(request: NextRequest) {
  if (!bearerOk(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const email = request.nextUrl.searchParams.get("email") ?? undefined;
  const remaining = await removeApplicant(email);
  return NextResponse.json({ ok: true, remaining });
}
