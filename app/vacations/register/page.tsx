import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { RegistrationForm } from "@/components/vacations/RegistrationForm";
import { getAvailabilityFor } from "@/lib/vacations/capacity";
import type { Occupancy } from "@/lib/vacations/pricing";
import { getTripConfig } from "@/lib/vacations/trip-config";
import { logo } from "@/lib/vacations/content";

export const metadata: Metadata = {
  title: "Reserve Your Spot — Pickleball Vacations",
  description: "Reserve your room for an upcoming Pickleball Vacations trip.",
  // A checkout form has nothing to offer search — and indexing it would
  // compete with /vacations for the same query.
  robots: { index: false, follow: true },
};

/**
 * Availability is read live from Stripe on every request. This page must never
 * be served from the CDN: a cached render could show an open form for a room
 * type that sold out minutes ago.
 */
export const dynamic = "force-dynamic";

export default async function VacationsRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ trip?: string }>;
}) {
  // `?trip=` selects the trip; absent means the active one, so every existing
  // /vacations/register link keeps working unchanged.
  const { trip: tripSlug } = await searchParams;
  const cfg = getTripConfig(tripSlug);
  const availability = await getAvailabilityFor(cfg);
  const soldOutOptions = (Object.keys(availability.options) as Occupancy[]).filter(
    (id) => availability.options[id].soldOut
  );
  // One source of truth for "can they book": Lainey's Jackalope switch + rooms.
  const closed = !availability.bookingOpen;
  const waitlist = cfg.waitlist;

  return (
    <>
      <section className="bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-24">
          <Link
            href="/vacations/"
            className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 transition-colors hover:text-white"
          >
            ← Back to the trip
          </Link>
          <Image
            src={logo.white}
            alt="Pickleball Vacations"
            width={220}
            height={63}
            priority
            className="mt-5 h-11 w-auto"
          />
          <h1 className="mt-5 font-display text-2xl uppercase leading-[1.02] sm:text-4xl">
            {closed ? waitlist.headline : "Reserve your spot"}
          </h1>
          <p className="mt-3 text-sm text-white/70">
            {cfg.destination} · {cfg.datesLabel} · {cfg.location}
          </p>
        </div>
      </section>

      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
          {closed ? (
            <div className="mx-auto max-w-xl border border-ppa-line bg-white p-10 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-vac-teal-deep">
                {waitlist.badge}
              </p>
              <h2 className="mt-3 font-display text-xl uppercase leading-tight text-ppa-navy">
                {waitlist.headline}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ppa-navy/65">
                {waitlist.message}
              </p>
              <a
                href={waitlist.mailto}
                className="mt-7 inline-flex h-12 items-center bg-vac-teal px-7 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-vac-teal-deep"
              >
                {waitlist.cta} →
              </a>
              <p className="mt-6">
                <Link
                  href="/vacations/"
                  className="text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy/50 hover:text-ppa-navy"
                >
                  ← Back to the trip
                </Link>
              </p>
            </div>
          ) : (
            // useSearchParams needs a Suspense boundary — without it the whole
            // route opts out of static rendering at build time.
            <Suspense
              fallback={
                <p className="text-sm text-ppa-navy/50">Loading the form…</p>
              }
            >
              <RegistrationForm
                soldOutOptions={soldOutOptions}
                tripSlug={cfg.slug}
                destination={cfg.destination}
                datesLabel={cfg.datesLabel}
                nights={cfg.nights}
                pricing={cfg.pricing}
              />
            </Suspense>
          )}
        </div>
      </section>
    </>
  );
}
