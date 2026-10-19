import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { cioAddToSegment, cioConfigured, cioIdentify } from "@/lib/customerio";

/**
 * Jackalope → Customer.io relay for Lainey's Pickleball Vacations list
 * (Jackalope lib/vaclist.js). Jackalope holds the list; this site holds the
 * Customer.io Track keys, so Jackalope posts the people here and this route
 * identifies each one and adds them to the vacations segment. Keeps the Track
 * key in one project instead of copying it into a second.
 *
 * Server-to-server only, same shared secret as the booking ingest
 * (VAC_BOOKING_SECRET). The segment is fixed here: this route can't be used to
 * write anyone onto any other list.
 */
const VAC_SEGMENT_ID = 1491;

function secretOk(given: string | null): boolean {
  const expected = process.env.VAC_BOOKING_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Person = { email?: string; firstName?: string | null; source?: string; trip?: string | null };

export async function POST(request: Request) {
  if (!secretOk(request.headers.get("x-vac-secret"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!cioConfigured()) return NextResponse.json({ error: "customer.io not configured" }, { status: 503 });
  let body: { people?: Person[] };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "bad body" }, { status: 400 }); }
  const people = (body.people ?? []).slice(0, 100)
    .filter((p) => typeof p.email === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email));

  const ok: string[] = [];
  const failed: string[] = [];
  for (const p of people) {
    const attrs: Record<string, unknown> = { vacations_list: true, vacations_source: String(p.source ?? "signup").slice(0, 20) };
    if (p.trip) attrs.vacations_trip = String(p.trip).slice(0, 120);
    if (p.firstName) attrs.first_name = String(p.firstName).slice(0, 80);
    if (await cioIdentify(p.email!, attrs)) ok.push(p.email!.toLowerCase());
    else failed.push(p.email!.toLowerCase());
  }
  // A profile the identify just created isn't visible to add_customers for a
  // moment: 10/19's first sync put 32 of 55 on the segment and silently skipped
  // the 23 brand-new people. Give Customer.io a beat before the segment add.
  if (ok.length) await new Promise((r) => setTimeout(r, 4000));
  const added = ok.length ? await cioAddToSegment(VAC_SEGMENT_ID, ok) : true;
  return NextResponse.json({ ok: added ? ok : [], failed: added ? failed : [...failed, ...ok] });
}
