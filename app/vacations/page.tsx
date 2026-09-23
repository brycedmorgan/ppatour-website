import type { Metadata } from "next";
import { TripPage } from "@/components/vacations/TripPage";
import { getAvailabilityFor } from "@/lib/vacations/capacity";
import { turkoise } from "@/lib/vacations/content";
import { getTripConfig } from "@/lib/vacations/trip-config";

/**
 * /vacations — the featured trip (Turks & Caicos, Dec 8–12, 2026) plus the
 * calendar of every trip. The page itself is `components/vacations/TripPage`,
 * shared with /vacations/trips/cancun; the content is `turkoise` in
 * lib/vacations/content.ts, which remains the ONLY home for that trip's facts.
 *
 * Rooms left is read from Stripe at request time, so a pricing card can never
 * invite a booking the resort block can't absorb. 60s ISR keeps the page on
 * the CDN — the checkout route re-reads live and is the real gate.
 */
export const revalidate = 60;

const cfg = getTripConfig("turkoise");

export const metadata: Metadata = {
  title: turkoise.copy.metaTitle,
  description: turkoise.copy.metaDescription,
  openGraph: {
    title: turkoise.copy.metaTitle,
    description: `${turkoise.trip.destination} · ${turkoise.trip.datesLabel}`,
    images: [{ url: turkoise.heroImage }],
  },
};

export default async function VacationsPage() {
  const availability = await getAvailabilityFor(cfg);
  return <TripPage content={turkoise} cfg={cfg} availability={availability} />;
}
