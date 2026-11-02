import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoonTrip } from "@/components/vacations/ComingSoonTrip";
import { getAvailabilityFor } from "@/lib/vacations/capacity";
import { getComingSoonTrip, remoteTripConfig } from "@/lib/vacations/remote-trips";

/**
 * Every trip Lainey publishes in Jackalope (lib/vacations/remote-trips.ts):
 * Coming Soon, or bookable once Bryce approved the sale there.
 * Trips with their own folder here (cancun, black-desert, punta-cana) are file
 * routes and win over this one. Unknown or taken-down slugs 404.
 */
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getComingSoonTrip(slug);
  if (!trip) return {};
  const where = trip.resort || trip.name;
  const selling = trip.status === "on-sale" && !!trip.sale;
  return {
    title: `Pickleball Vacations — ${where}, ${selling ? "Now Booking" : "Coming Soon"}`,
    description: selling
      ? `Pickleball Vacations at ${where}, ${trip.datesLabel}. Rooms are limited. Reserve yours.`
      : `Pickleball Vacations heads to ${where}, ${trip.datesLabel}. Join the list to hear first when rooms open.`,
    openGraph: {
      title: `${where} · Pickleball Vacations`,
      description: [trip.resort, trip.datesLabel, trip.stay].filter(Boolean).join(" · "),
      ...(trip.hero ? { images: [trip.hero] } : {}),
    },
  };
}

export default async function ComingSoonTripPage({ params }: Props) {
  const { slug } = await params;
  const trip = await getComingSoonTrip(slug);
  if (!trip) notFound();
  // Bookable only with an approved sale from Jackalope (remote-trips.ts).
  const cfg = remoteTripConfig(trip);
  const booking = cfg ? { cfg, availability: await getAvailabilityFor(cfg) } : null;
  return <ComingSoonTrip trip={trip} booking={booking} />;
}
