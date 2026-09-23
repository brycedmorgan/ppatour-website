import type { Metadata } from "next";
import { TripPage } from "@/components/vacations/TripPage";
import { getAvailabilityFor } from "@/lib/vacations/capacity";
import { getTripConfig } from "@/lib/vacations/trip-config";
import { cancun } from "@/lib/vacations/trips/cancun";

/**
 * Club Med Cancún — January 26–30, 2027, led by Connor Garnett. On sale from
 * 2026-09-22 alongside Turks & Caicos; the first time two trips have sold at
 * once, which is why the page is the shared TripPage template rather than a
 * second copy of /vacations.
 *
 * Booking goes through the same /vacations/register + /api/vacations/checkout
 * path with `?trip=cancun`, so the room block, on-sale switch and bookings all
 * land in Jackalope under "Club Med Cancun" like every other trip.
 */
export const revalidate = 60;

const cfg = getTripConfig("cancun");

export const metadata: Metadata = {
  title: cancun.copy.metaTitle,
  description: cancun.copy.metaDescription,
  openGraph: {
    title: cancun.copy.metaTitle,
    description: `${cancun.trip.destination} · ${cancun.trip.datesLabel}`,
    images: [{ url: cancun.heroImage }],
  },
};

export default async function CancunPage() {
  const availability = await getAvailabilityFor(cfg);
  return <TripPage content={cancun} cfg={cfg} availability={availability} />;
}
