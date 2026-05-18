import { NextResponse } from "next/server";

/**
 * Lead capture endpoint (§9.8). Stub for now — logs the submission.
 * Wire to Customer.io once credentials land (open question §13).
 */
export async function POST(request: Request) {
  let payload: { email?: string; variant?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = payload.email?.trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // TODO: forward to Customer.io
  console.log("[lead-capture]", { email, variant: payload.variant ?? "fan" });

  return NextResponse.json({ ok: true });
}
