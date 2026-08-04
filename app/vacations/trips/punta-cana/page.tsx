import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PhotoCarousel } from "@/components/vacations/PhotoCarousel";
import { logo } from "@/lib/vacations/content";
import { puntaCana as pc } from "@/lib/vacations/trips/punta-cana";

/**
 * ARCHIVED TRIP — Club Med Punta Cana (Sept 8–12, 2026). Sold out and kept
 * live so registered guests can still look up the resort, pros, itinerary and
 * travel details. No booking CTA anywhere on this page.
 */
export const metadata: Metadata = {
  title: `${pc.trip.destination} — Pickleball Vacations`,
  description: `Guest information for the inaugural Pickleball Vacations trip: ${pc.trip.destination}, ${pc.trip.datesLabel}.`,
  robots: { index: false, follow: true },
};

const SectionLabel = ({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) => (
  <div className="flex items-center gap-2.5">
    <span className="h-2 w-2 bg-vac-teal" />
    <p
      className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
        tone === "dark" ? "text-white/55" : "text-ppa-navy/50"
      }`}
    >
      {children}
    </p>
  </div>
);

export default function PuntaCanaArchivePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-[60svh] items-end overflow-hidden bg-ppa-navy text-white">
        <Image
          src={pc.heroImage}
          alt={pc.trip.destination}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 scrim-hero" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-28">
          <Link
            href="/vacations/"
            className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55 transition-colors hover:text-white"
          >
            ← All trips
          </Link>
          <Image
            src={logo.white}
            alt="Pickleball Vacations"
            width={240}
            height={69}
            className="mt-5 h-12 w-auto sm:h-14"
          />
          <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
            <span className="bg-white px-3 py-1.5 text-ppa-navy">Sold Out</span>
            <span className="border border-white/25 px-3 py-1.5 text-white/85">
              {pc.trip.datesLabel}
            </span>
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-[1.9rem] uppercase leading-[1.02] sm:text-5xl">
            {pc.trip.destination}
          </h1>
          <p className="mt-3 text-sm text-white/75">{pc.trip.location}</p>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.12em] text-vac-teal-pale">
            {pc.trip.lineup}
          </p>
        </div>
      </section>

      {/* Guest notice */}
      <section className="bg-vac-teal">
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-white">
            You&apos;re booked — this page is for you
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/90">
            Everything you need for the trip: the resort, your pros, the
            day-by-day schedule, and travel details. Questions any time at{" "}
            <a
              href={`mailto:${pc.trip.contactEmail}`}
              className="font-bold underline underline-offset-4"
            >
              {pc.trip.contactEmail}
            </a>
            .
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px bg-white/10 px-4 lg:grid-cols-4">
          {pc.highlights.map((h) => (
            <div key={h.label} className="bg-ppa-navy-deep px-2 py-8 text-center">
              <p className="font-display text-4xl text-vac-teal-bright">
                {h.stat}
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                {h.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Resort + play */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <SectionLabel>The Trip</SectionLabel>
          <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            {pc.trip.destination}
          </h2>
          <div className="mt-8 grid gap-px border border-ppa-line bg-ppa-line lg:grid-cols-3">
            {[
              { label: "The resort", body: pc.about.resort },
              { label: "The pickleball", body: pc.about.play },
              { label: "All levels", body: pc.about.levels },
            ].map((b) => (
              <div key={b.label} className="bg-white p-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-vac-teal-deep">
                  {b.label}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ppa-navy/70">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pros */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <SectionLabel>The Lineup</SectionLabel>
          <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Your pros
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pc.pros.map((pro) => (
              <div key={pro.name} className="border border-ppa-line">
                <div className="relative aspect-square overflow-hidden bg-ppa-navy">
                  <Image
                    src={pro.image}
                    alt={pro.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className="bg-white p-5">
                  <p className="font-display text-base uppercase leading-tight text-ppa-navy">
                    {pro.name}
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/50">
                    {pro.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section className="bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <SectionLabel tone="dark">Day by Day</SectionLabel>
          <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] sm:text-3xl">
            Your five days
          </h2>
          <ol className="mt-9 grid gap-px bg-white/10 lg:grid-cols-5">
            {pc.itinerary.map((day, i) => (
              <li key={day.day} className="flex flex-col bg-ppa-navy p-6">
                <p className="font-display text-4xl leading-none text-white/15">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-vac-teal-pale">
                  {day.day}
                </p>
                <p className="mt-1 font-display text-base uppercase leading-tight">
                  {day.title}
                </p>
                <ul className="mt-4 flex flex-col gap-3 border-t border-white/12 pt-4">
                  {day.events.map((ev, j) => (
                    <li key={j} className="text-xs leading-relaxed">
                      {ev.time && (
                        <span className="block font-bold uppercase tracking-[0.1em] text-white/45">
                          {ev.time}
                        </span>
                      )}
                      <span className="text-white/80">{ev.text}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Stay + inclusions */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <SectionLabel>The Stay</SectionLabel>
              <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Your room
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-ppa-navy/70">
                {pc.accommodations.body}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ppa-navy/70">
                {pc.accommodations.body2}
              </p>
              <div className="mt-7 grid grid-cols-3 gap-px border border-ppa-line bg-ppa-line">
                {pc.accommodations.features.map((f) => (
                  <div key={f.label} className="bg-white px-3 py-5 text-center">
                    <p className="font-display text-2xl text-vac-teal-deep">
                      {f.value}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase leading-tight tracking-[0.1em] text-ppa-navy/50">
                      {f.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <PhotoCarousel items={pc.roomImages} aspect="aspect-[4/3]" />
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <SectionLabel>Inclusions</SectionLabel>
              <ul className="mt-5 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2">
                {pc.included.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 bg-white p-4 text-sm leading-relaxed text-ppa-navy/75"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-vac-teal"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Not included
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {pc.notIncluded.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-sm leading-relaxed text-ppa-navy/55"
                  >
                    <span
                      aria-hidden
                      className="mt-2 h-px w-3 shrink-0 bg-ppa-navy/30"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Excursions */}
      {pc.excursions.length > 0 && (
        <section className="bg-ppa-paper">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
            <SectionLabel>Beyond the Courts</SectionLabel>
            <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
              Activities &amp; optional excursions
            </h2>
            <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {pc.excursions.map((ex) => (
                <article
                  key={ex.title}
                  className="w-[68vw] shrink-0 snap-start sm:w-[46vw] lg:w-[calc((100%-3rem)/4)]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-ppa-navy">
                    <Image
                      src={ex.image}
                      alt={ex.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 46vw, 68vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-2/3 scrim-card" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="font-display text-sm uppercase leading-tight text-white">
                        {ex.title}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-white/70">
                        {ex.caption}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Travel */}
      <section className="bg-ppa-navy-deep text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <SectionLabel tone="dark">Getting There</SectionLabel>
              <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] sm:text-3xl">
                Flights &amp; transfers
              </h2>
              <p className="mt-4 font-display text-5xl text-vac-teal-bright">
                {pc.trip.airportCode}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">
                {pc.trip.airportName}
              </p>
            </div>
            <div className="flex flex-col gap-4 text-sm leading-relaxed text-white/75">
              <p>{pc.transportation.body}</p>
              <p>{pc.transportation.body2}</p>
              <p className="pt-2">
                <a
                  href={`mailto:${pc.trip.contactEmail}?subject=${encodeURIComponent(
                    "Flight details — Punta Cana, Sept 8–12"
                  )}`}
                  className="inline-flex h-11 items-center bg-vac-teal px-7 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-vac-teal-deep"
                >
                  Send Your Flight Details →
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
