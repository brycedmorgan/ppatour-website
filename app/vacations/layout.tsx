import { TripNav } from "@/components/vacations/TripNav";
import { VacationsTrack } from "@/components/vacations/VacationsTrack";

/**
 * Vacations sits inside the tour site but keeps its own funnel telemetry —
 * the beacon is mounted here rather than in the root layout so ppatour.com's
 * general traffic never lands in the trip's conversion numbers.
 *
 * TripNav is the sticky "which trips exist" bar under the header (Bryce, 9/22).
 */
export default function VacationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <VacationsTrack />
      <TripNav />
      {children}
    </>
  );
}
