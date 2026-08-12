import { VacationsTrack } from "@/components/vacations/VacationsTrack";

/**
 * Vacations sits inside the tour site but keeps its own funnel telemetry —
 * the beacon is mounted here rather than in the root layout so ppatour.com's
 * general traffic never lands in the trip's conversion numbers.
 */
export default function VacationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <VacationsTrack />
      {children}
    </>
  );
}
