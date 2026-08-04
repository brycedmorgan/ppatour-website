import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/vacations/capacity";
import { scarcityThreshold } from "@/lib/vacations/content";

// Rooms left, read live from Stripe. Public (the register form calls it) and
// deliberately count-only — no booking or traveler detail crosses this line.
export const runtime = "nodejs";

export async function GET() {
  const availability = await getAvailability();
  return NextResponse.json(
    { ...availability, scarcityThreshold },
    { headers: { "Cache-Control": "no-store" } }
  );
}
