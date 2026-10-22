import type { Metadata } from "next";
import { TripPage } from "@/components/vacations/TripPage";
import { getAvailabilityFor } from "@/lib/vacations/capacity";
import { getTripConfig } from "@/lib/vacations/trip-config";
import { blackDesert } from "@/lib/vacations/trips/black-desert";

/**
 * Black Desert Resort — March 26–31, 2027, around the Greater Zion Cup, led by
 * Dave Fleming. On sale 2026-10-08. Same TripPage template and register →
 * checkout path as Cancún (`?trip=black-desert`); the one difference is a
 * pooled room block (15 King rooms, 1 or 2 guests) — see trip-config.ts.
 */
export const revalidate = 60;

const cfg = getTripConfig("black-desert");

export const metadata: Metadata = {
  title: blackDesert.copy.metaTitle,
  description: blackDesert.copy.metaDescription,
  openGraph: {
    title: blackDesert.copy.metaTitle,
    description: `${blackDesert.trip.destination} · ${blackDesert.trip.datesLabel}`,
    images: [{ url: blackDesert.heroImage }],
  },
};

export default async function BlackDesertPage() {
  const availability = await getAvailabilityFor(cfg);
  return <TripPage content={blackDesert} cfg={cfg} availability={availability} />;
}
