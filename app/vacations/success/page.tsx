import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getStripe } from "@/lib/vacations/stripe";
import { logo, trip } from "@/lib/vacations/content";

export const metadata: Metadata = {
  title: "You're In — Pickleball Vacations",
  description: "Your Pickleball Vacations reservation is confirmed.",
  robots: { index: false, follow: false },
};

/** The session id is per-guest — nothing about this page is cacheable. */
export const dynamic = "force-dynamic";

export default async function VacationsSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let email: string | null = null;
  let occupancy: string | null = null;
  /**
   * ⚠ The guest's ACTUAL trip lives in the session metadata (destination/dates,
   * stamped at checkout since day one) — never render the currently-featured
   * trip for a guest who booked an earlier one. Punta Cana guests still open
   * their original confirmation links, and this page told them they were going
   * to Turks & Caicos until it was fixed on 7/20. Same rule after the move to
   * ppatour.com: the session is the record.
   */
  let destination = trip.destination;
  let datesLabel = trip.datesLabel;
  if (session_id) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id);
      email = session.customer_details?.email ?? session.customer_email ?? null;
      occupancy = session.metadata?.occupancy ?? null;
      if (session.metadata?.destination)
        destination = session.metadata.destination;
      if (session.metadata?.dates) datesLabel = session.metadata.dates;
    } catch {
      // Keep a graceful, generic confirmation if retrieval isn't possible.
    }
  }

  const place = destination.includes("Punta Cana")
    ? "Punta Cana"
    : destination.includes("Turkoise")
      ? "Turks & Caicos"
      : destination.replace(/^Club Med\s+/i, "");

  return (
    <section className="flex min-h-[100svh] items-center justify-center bg-ppa-navy px-4 py-28 text-center text-white">
      <div className="mx-auto w-full max-w-xl">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-vac-teal">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-vac-teal">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.2em] text-vac-teal-pale">
          Reservation Confirmed
        </p>
        <h1 className="mt-4 font-display text-3xl uppercase leading-[1.02] sm:text-5xl">
          You&apos;re going to
          <span className="mt-1 block text-vac-teal-pale">{place}</span>
        </h1>

        <p className="mt-6 text-sm leading-relaxed text-white/75">
          Thank you for booking your Pickleball Vacation at {destination}.
          {email ? (
            <>
              {" "}
              A confirmation is on its way to{" "}
              <span className="font-bold text-white">{email}</span>.
            </>
          ) : (
            " A confirmation email is on its way."
          )}
        </p>

        <dl className="mx-auto mt-8 max-w-sm divide-y divide-white/12 border border-white/15 text-left text-sm">
          <div className="flex justify-between gap-4 px-5 py-3">
            <dt className="text-white/60">Destination</dt>
            <dd className="font-medium">{destination}</dd>
          </div>
          <div className="flex justify-between gap-4 px-5 py-3">
            <dt className="text-white/60">Dates</dt>
            <dd className="font-medium">{datesLabel}</dd>
          </div>
          {occupancy && (
            <div className="flex justify-between gap-4 px-5 py-3">
              <dt className="text-white/60">Room</dt>
              <dd className="font-medium">{occupancy}</dd>
            </div>
          )}
        </dl>

        <p className="mt-8 text-sm leading-relaxed text-white/60">
          Next step: our trip coordinator will reach out to collect your flight
          details so we can arrange your round-trip airport transfers.
          Questions?{" "}
          <a
            href={`mailto:${trip.contactEmail}`}
            className="font-bold text-vac-teal-pale hover:text-white"
          >
            {trip.contactEmail}
          </a>
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/vacations/"
            className="inline-flex h-11 items-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/10"
          >
            Back to the Trip
          </Link>
          <Link
            href="/events/"
            className="inline-flex h-11 items-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/10"
          >
            PPA Tour Schedule
          </Link>
        </div>

        <Image
          src={logo.white}
          alt="Pickleball Vacations"
          width={200}
          height={57}
          className="mx-auto mt-12 h-9 w-auto opacity-70"
        />
      </div>
    </section>
  );
}
