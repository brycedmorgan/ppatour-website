import { NextResponse } from "next/server";
import { cioIdentifyAndTrack } from "@/lib/customerio";

/**
 * Lead capture endpoint (§9.8). Identifies the person in Customer.io and
 * records a `website_lead_capture` event carrying the lead-magnet variant
 * and source page, so welcome flows can differ per magnet (fan guide vs
 * player guide vs streaming reminders).
 */
export async function POST(request: Request) {
  let payload: {
    email?: string;
    variant?: string;
    region?: string;
    page?: string;
  };
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
  // Region is an opt-in tag set per call site, never inferred from the path —
  // a page can move and a regional page can be linked from anywhere.
  const region =
    typeof payload.region === "string" && /^[a-z-]{2,24}$/.test(payload.region)
      ? payload.region
      : undefined;

  console.log("[lead-capture]", { email, variant, region, page });

  const ok = await cioIdentifyAndTrack(
    email,
    {
      website_lead_variant: variant,
      website_lead_page: page,
      ...(region ? { website_lead_region: region } : {}),
    },
    "website_lead_capture",
    { variant, page, source: "ppatour-website", ...(region ? { region } : {}) },
  );
  if (!ok) {
    return NextResponse.json({ error: "Could not subscribe" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
