import { NextResponse } from "next/server";
import { cioIdentifyAndTrack } from "@/lib/customerio";

/**
 * Lead capture endpoint (§9.8). Identifies the person in Customer.io and
 * records a `website_lead_capture` event carrying the lead-magnet variant
 * and source page, so welcome flows can differ per magnet (fan guide vs
 * player guide vs streaming reminders).
 */
export async function POST(request: Request) {
  let payload: { email?: string; variant?: string; page?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = payload.email?.trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const variant = payload.variant ?? "fan";
  const page = payload.page ?? "";

  console.log("[lead-capture]", { email, variant, page });

  const ok = await cioIdentifyAndTrack(
    email,
    { website_lead_variant: variant, website_lead_page: page },
    "website_lead_capture",
    { variant, page, source: "ppatour-website" },
  );
  if (!ok) {
    return NextResponse.json({ error: "Could not subscribe" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
