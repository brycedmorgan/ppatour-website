import type { Metadata } from "next";
import Image from "next/image";
import { logo } from "@/lib/vacations/content";
import { tripsCalendar, tripStatusLabel } from "@/lib/vacations/trips";

/**
 * Stolen Time St. Lucia — April 20–24, 2027, all-inclusive. Coming-soon
 * placeholder (Lainey, 10/30), up for Stolen Time to share at Worlds.
 *
 * ⚠ THE CONTRACT IS UNSIGNED. Nothing on this page may take a card: no price,
 * no room block, no pros, no TripConfig entry, no /register link. The only
 * conversion is the email form the vacations layout mounts at the foot of the
 * page, which VacationsLeadCapture tags `website_lead_region: st-lucia` — that
 * is how Lainey pulls the waitlist. When the trip goes on sale it moves to
 * TripPage like Cancún and Black Desert.
 *
 * No resort photos exist yet, so the hero is the Vacations mark on navy rather
 * than another resort's beach under this resort's name.
 */
export const revalidate = 60;

const entry = tripsCalendar.find((t) => t.slug === "st-lucia")!;

const TBA = ["Pricing", "Room types", "Pro lineup", "Itinerary", "Booking date"];

export const metadata: Metadata = {
  title: "Pickleball Vacations — Stolen Time St. Lucia, Coming Soon",
  description:
    "Pickleball Vacations heads to Stolen Time St. Lucia, April 20–24, 2027 — all-inclusive. Join the list to hear first when rooms open.",
  openGraph: {
    title: "Stolen Time St. Lucia · Pickleball Vacations",
    description: `${entry.resort} · ${entry.datesLabel} · All-inclusive`,
  },
};

export default function StLuciaPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[64svh] items-end overflow-hidden bg-ppa-navy-deep text-white">
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-14 pt-28">
          <Image
            src={logo.white}
            alt="Pickleball Vacations"
            width={300}
            height={86}
            priority
            className="h-16 w-auto sm:h-20"
          />

          <h1 className="mt-7 max-w-4xl font-display text-[2rem] uppercase leading-[1.02] sm:text-5xl lg:text-6xl">
            Stolen Time
            <br />
            St. Lucia
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-bold uppercase tracking-[0.14em]">
            <span className="bg-ppa-yellow px-3 py-1.5 text-ppa-navy">
              {tripStatusLabel(entry)}
            </span>
            <span className="bg-vac-teal px-3 py-1.5 text-white">
              {entry.datesLabel}
            </span>
            <span className="border border-white/25 px-3 py-1.5 text-white/85">
              All-Inclusive
            </span>
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Pickleball Vacations is headed to St. Lucia. Details are still being
            finalized — join the list below and you&apos;ll hear first when rooms open.
          </p>

          <div className="mt-7">
            <a
              href="#vacations-list"
              className="inline-flex h-12 items-center bg-vac-teal px-7 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-vac-teal-deep"
            >
              Get First Word →
            </a>
          </div>
        </div>
      </section>

      {/* ── The trip so far ──────────────────────────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-2">
          <div className="border border-ppa-line bg-white">
            <div className="border-b border-ppa-line px-6 py-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                The Trip
              </p>
              <p className="mt-1 font-display text-lg uppercase leading-tight text-ppa-navy">
                {entry.resort}
              </p>
            </div>
            <dl className="divide-y divide-ppa-line text-sm">
              {[
                ["Where", entry.location],
                ["When", entry.datesLabel],
                ["Stay", "All-inclusive"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-4 px-6 py-3.5">
                  <dt className="w-24 shrink-0 font-bold uppercase tracking-[0.1em] text-ppa-navy/50">
                    {k}
                  </dt>
                  <dd className="text-ppa-navy">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-vac-teal" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/60">
                Still to Be Announced
              </p>
            </div>
            <ul className="mt-5 space-y-3">
              {TBA.map((item) => (
                <li
                  key={item}
                  className="flex items-center justify-between border-b border-ppa-line pb-3 text-sm text-ppa-navy"
                >
                  <span className="font-bold uppercase tracking-[0.1em]">{item}</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                    Coming soon
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
