import { TravelMonetization } from "@/components/global/TravelMonetization";

/**
 * Wraps every individual tournament page (/events/[year]/[slug]). Mounts the
 * Travelpayouts Emerald monetization script here — NOT in the root layout — so
 * it runs on the tour-stop pages (where the Trip Builder's flights/hotels/cars
 * booking flow lives) but never on the pure sports pages. Bryce's call, 8/9:
 * Emerald on tournament pages + /vacations. The component is production- and
 * consent-gated; see its header. Nothing else about the event page changes.
 *
 * ⚠ The standalone /events/veolia-...-live/ preview route is a SEPARATE segment
 * and is not wrapped by this layout; it's noindex and not a real tournament
 * page, so it's left without Emerald for now.
 */
export default function TournamentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TravelMonetization />
      {children}
    </>
  );
}
