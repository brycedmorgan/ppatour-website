import { NextResponse } from "next/server";
import { allTripsByDate } from "@/lib/vacations/remote-trips";

/**
 * The trip list for the site header (a client component, so it can't call
 * Jackalope itself). Code trips + the trips Lainey publishes in Jackalope.
 * Cached 60s like the trip pages; the header keeps its built-in list until
 * this answers, and on any failure.
 */
export const revalidate = 60;

export async function GET() {
  const trips = await allTripsByDate();
  return NextResponse.json({ trips });
}
