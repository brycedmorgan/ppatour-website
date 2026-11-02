import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoonTrip } from "@/components/vacations/ComingSoonTrip";
import { getComingSoonTrip } from "@/lib/vacations/remote-trips";

/**
 * Every Coming Soon trip Lainey publishes in Jackalope (lib/vacations/remote-trips.ts).
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
  return {
    title: `Pickleball Vacations — ${where}, Coming Soon`,
    description: `Pickleball Vacations heads to ${where}, ${trip.datesLabel}. Join the list to hear first when rooms open.`,
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
  return <ComingSoonTrip trip={trip} />;
}
