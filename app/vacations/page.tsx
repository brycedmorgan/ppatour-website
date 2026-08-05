import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PhotoCarousel } from "@/components/vacations/PhotoCarousel";
import { getAvailability } from "@/lib/vacations/capacity";
import { PRICING, formatUSD, type Occupancy } from "@/lib/vacations/pricing";
import { tripsCalendar, tripStatus, STATUS_META } from "@/lib/vacations/trips";
import {
  about,
  accommodations,
  bandImage,
  excursions,
  heroImage,
  highlights,
  included,
  itinerary,
  logo,
  notIncluded,
  pros,
  prosAnnounced,
  prosMoreComing,
  roomImages,
  scarcityThreshold,
  soldOut,
  transportation,
  trip,
} from "@/lib/vacations/content";

/**
 * Rooms left is read from Stripe at request time, so a pricing card can never
 * invite a booking the resort block can't absorb. 60s ISR keeps the page on
 * the CDN — the checkout route re-reads live and is the real gate.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Pickleball Vacations — Play the Islands With the Pros",
  description: `${trip.destination}, ${trip.location} · ${trip.datesLabel}. An adults-only, all-inclusive week of clinics with PPA pros, ten permanent courts, and Grace Bay. ${trip.adultsOnly}.`,
  // Held noindex until Stripe keys land on this project (STRIPE_SECRET_KEY /
  // STRIPE_WEBHOOK_SECRET). Until then the page renders but Register → checkout
  // 503s, so we keep it out of Google rather than surface a dead funnel; real
  // bookings still run on the intact vacations.ppatour.com. Revert (drop this
  // line + re-add to app/sitemap.ts) the moment Stripe is configured.
  robots: { index: false, follow: true },
  openGraph: {
    title: "Pickleball Vacations — Play the Islands With the Pros",
    description: `${trip.destination} · ${trip.datesLabel}`,
    images: [{ url: heroImage }],
  },
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

export default async function VacationsPage() {
  const availability = await getAvailability();
  const options: Occupancy[] = ["single", "double"];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden bg-ppa-navy text-white">
        <Image
          src={heroImage}
          alt="Aerial view of Grace Bay and Club Med Turkoise, Turks & Caicos"
          fill
          priority
          quality={75}
          sizes="100vw"
          className="animate-kenburns object-cover will-change-transform"
        />
        <div className="absolute inset-0 scrim-hero" />

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
            Play the islands
            <br />
            with the pros
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            {trip.tagline}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-bold uppercase tracking-[0.14em]">
            <span className="bg-vac-teal px-3 py-1.5 text-white">
              {trip.datesLabel}
            </span>
            <span className="border border-white/25 px-3 py-1.5 text-white/85">
              {trip.destination}
            </span>
            <span className="border border-white/25 px-3 py-1.5 text-white/85">
              {trip.location}
            </span>
            {/* No adults-only chip here — `trip.lineup` on the very next line
                already ends in "Adults-only (18+)", and the two sat side by
                side saying the same thing twice. */}
          </div>

          <p className="mt-5 text-sm font-bold uppercase tracking-[0.12em] text-vac-teal-pale">
            {soldOut.active ? soldOut.nextTrip : trip.lineup}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {soldOut.active ? (
              <a
                href={soldOut.mailto}
                className="inline-flex h-12 items-center bg-vac-teal px-7 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-vac-teal-deep"
              >
                {soldOut.cta} →
              </a>
            ) : (
              <Link
                href="/vacations/register/"
                className="inline-flex h-12 items-center bg-vac-teal px-7 text-xs font-bold uppercase tracking-[0.14em] text-white transition-transform hover:bg-vac-teal-deep active:scale-[0.98]"
              >
                Reserve Your Spot →
              </Link>
            )}
            <a
              href="#the-trip"
              className="inline-flex h-12 items-center border border-white/30 px-7 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/10"
            >
              Explore the Trip
            </a>
          </div>
        </div>
      </section>

      {/* ── Stat band ────────────────────────────────────────────────── */}
      <section className="bg-ppa-navy-deep">
        {/* Padding lives on the wrapper, not the grid: `gap-px bg-white/10`
            paints the grid's own background, so horizontal padding on the grid
            itself showed as a pale strip down both outer edges. */}
        <div className="mx-auto w-full max-w-6xl px-4">
          <div
            className="grid grid-cols-2 gap-px bg-white/10 lg:grid-cols-4"
            data-reveal
            data-reveal-group
          >
            {highlights.map((h, i) => (
              <div
                key={h.label}
                className="bg-ppa-navy-deep px-2 py-8 text-center"
                style={
                  { "--reveal-delay": `${i * 70}ms` } as React.CSSProperties
                }
              >
                <p className="font-display text-4xl text-vac-teal-bright sm:text-5xl">
                  {h.stat}
                </p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
                  {h.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Welcome ──────────────────────────────────────────────────── */}
      <section id="the-trip" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
            <div data-reveal>
              <SectionLabel>Welcome</SectionLabel>
              <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-4xl">
                More than a vacation
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                {trip.intro}
              </p>
              <p className="mt-4 border-l-2 border-vac-teal pl-5 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                {trip.inauguralNote}
              </p>
            </div>

            <aside data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
              <div className="border border-ppa-line bg-white">
                <div className="border-b border-ppa-line px-6 py-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                    The Trip
                  </p>
                  <p className="mt-1 font-display text-lg uppercase leading-tight text-ppa-navy">
                    {trip.destination}
                  </p>
                </div>
                <dl className="divide-y divide-ppa-line text-sm">
                  {[
                    ["Where", trip.location],
                    ["When", trip.datesLabel],
                    ["Nights", `${trip.nights} nights, all-inclusive`],
                    ["Fly into", `${trip.airportName} (${trip.airportCode})`],
                    ["Who", trip.adultsOnly],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-4 px-6 py-3.5">
                      <dt className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45">
                        {k}
                      </dt>
                      <dd className="text-ppa-navy/80">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="border-t border-ppa-line px-6 py-4">
                  <a
                    href={trip.clubMedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold uppercase tracking-[0.12em] text-vac-teal-deep transition-colors hover:text-ppa-navy"
                  >
                    See the resort ↗
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Image band ───────────────────────────────────────────────── */}
      <section className="relative isolate h-[42svh] min-h-[280px] overflow-hidden bg-ppa-navy">
        <Image
          src={bandImage}
          alt="Pickleball courts at Club Med Turkoise"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 scrim-feature" />
        <div className="relative mx-auto flex h-full w-full max-w-6xl items-end px-4 pb-10">
          <div data-reveal>
            <SectionLabel tone="dark">On Court</SectionLabel>
            <p className="mt-3 max-w-xl font-display text-xl uppercase leading-tight text-white sm:text-3xl">
              Ten permanent courts. Mornings with the pros. Afternoons are
              yours.
            </p>
          </div>
        </div>
      </section>

      {/* ── The experience ───────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <div data-reveal>
            <SectionLabel>The Experience</SectionLabel>
            <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-4xl">
              Competition, connection, relaxation
            </h2>
          </div>

          <div className="mt-9 grid gap-px border border-ppa-line bg-ppa-line lg:grid-cols-3" data-reveal data-reveal-group>
            {[
              { label: "The resort", body: about.resort },
              { label: "The pickleball", body: about.play },
              { label: "All levels", body: about.levels },
            ].map((block, i) => (
              <div
                key={block.label}
                className="bg-white p-7"
                style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-vac-teal-deep">
                  {block.label}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ppa-navy/70">
                  {block.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's included ──────────────────────────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <div data-reveal>
            <SectionLabel>Inclusions</SectionLabel>
            <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-4xl">
              What&apos;s included
            </h2>
          </div>

          <div className="mt-9 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <ul className="grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2" data-reveal>
              {included.map((item) => (
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

            <div data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Not included
              </p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {notIncluded.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-sm leading-relaxed text-ppa-navy/55"
                  >
                    <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-ppa-navy/30" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Itinerary ────────────────────────────────────────────────── */}
      <section className="bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <div data-reveal>
            <SectionLabel tone="dark">Day by Day</SectionLabel>
            <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] sm:text-4xl">
              Your five days
            </h2>
          </div>

          <ol className="mt-10 grid gap-px bg-white/10 lg:grid-cols-5" data-reveal data-reveal-group>
            {itinerary.map((day, i) => (
              <li
                key={day.day}
                className="flex flex-col bg-ppa-navy p-6"
                style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
              >
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

      {/* ── The stay ─────────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div data-reveal>
              <SectionLabel>The Stay</SectionLabel>
              <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-4xl">
                Superior rooms on Grace Bay
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                {accommodations.body}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                {accommodations.body2}
              </p>

              <div className="mt-7 grid grid-cols-3 gap-px border border-ppa-line bg-ppa-line">
                {accommodations.features.map((f) => (
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

            <div data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
              <PhotoCarousel items={roomImages} aspect="aspect-[4/3]" />
            </div>
          </div>

          {/* Excursions rail */}
          <div className="mt-14" data-reveal>
            <SectionLabel>Beyond the Courts</SectionLabel>
            <h3 className="mt-3 font-display text-xl uppercase leading-[1.02] text-ppa-navy sm:text-2xl">
              Activities &amp; optional excursions
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-ppa-navy/60">
              Included resort activities plus optional off-site experiences you
              can add once you&apos;re there.
            </p>
          </div>

          {/* Cards sit at 68vw below sm so the next one always peeks — that
              peek is the only affordance saying "swipe". */}
          <div
            className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            data-reveal
          data-reveal-group
          >
            {excursions.map((ex, i) => (
              <article
                key={ex.title}
                className="w-[68vw] shrink-0 snap-start sm:w-[46vw] lg:w-[calc((100%-3rem)/4)]"
                style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties}
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

      {/* ── The pros ─────────────────────────────────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <div data-reveal>
            <SectionLabel>The Lineup</SectionLabel>
            <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-4xl">
              Who you&apos;re playing with
            </h2>
          </div>

          {prosAnnounced && pros.length > 0 ? (
            <>
              <div
                className={`mt-9 grid gap-6 ${
                  pros.length === 1
                    ? "max-w-xs"
                    : pros.length === 2
                      ? "max-w-3xl sm:grid-cols-2"
                      : "sm:grid-cols-2 lg:grid-cols-4"
                }`}
                data-reveal
          data-reveal-group
              >
                {pros.map((pro, i) => {
                  const card = (
                    <>
                      <div className="relative aspect-square overflow-hidden bg-ppa-navy">
                        <Image
                          src={pro.image}
                          alt={pro.name}
                          fill
                          sizes="(min-width: 640px) 320px, 100vw"
                          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        {pro.leading && (
                          <span className="absolute left-0 top-4 bg-vac-teal px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                            Leading the Trip
                          </span>
                        )}
                      </div>
                      <div className="bg-white p-5">
                        <p className="font-display text-base uppercase leading-tight text-ppa-navy transition-colors group-hover:text-vac-teal-deep">
                          {pro.name}
                        </p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/50">
                          {pro.role}
                        </p>
                      </div>
                    </>
                  );
                  const style = {
                    "--reveal-delay": `${i * 80}ms`,
                  } as React.CSSProperties;

                  // Link through to the tour profile when the pro has one —
                  // the whole point of Vacations living on ppatour.com.
                  return pro.slug ? (
                    <Link
                      key={pro.name}
                      href={`/athletes/${pro.slug}/`}
                      className="group block border border-ppa-line"
                      style={style}
                    >
                      {card}
                    </Link>
                  ) : (
                    <div
                      key={pro.name}
                      className="group block border border-ppa-line"
                      style={style}
                    >
                      {card}
                    </div>
                  );
                })}
              </div>
              {prosMoreComing && (
                <p className="mt-6 text-sm text-ppa-navy/60" data-reveal>
                  More pros to come — additional PPA &amp; MLP pros join as they
                  confirm.
                </p>
              )}
            </>
          ) : (
            <div className="mt-9 border border-ppa-line bg-white p-10 text-center" data-reveal>
              <p className="font-display text-lg uppercase text-ppa-navy">
                Lineup to be announced soon
              </p>
              <p className="mt-2 text-sm text-ppa-navy/60">
                PPA &amp; MLP pros are being confirmed now.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section id="rooms" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:py-20">
          <div data-reveal>
            <SectionLabel>{soldOut.active ? soldOut.badge : "Reserve"}</SectionLabel>
            <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-4xl">
              {soldOut.active ? soldOut.headline : "Choose your room"}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ppa-navy/65 sm:text-base">
              {soldOut.active ? (
                soldOut.message
              ) : (
                <>
                  {trip.destination} · {trip.datesLabel}. {trip.adultsOnly}.
                  Rooms are held under a fixed resort block — when they&apos;re
                  gone, they&apos;re gone.
                </>
              )}
            </p>
            {soldOut.active && (
              <a
                href={soldOut.mailto}
                className="mt-6 inline-flex h-12 items-center bg-vac-teal px-7 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-vac-teal-deep"
              >
                {soldOut.cta} →
              </a>
            )}
          </div>

          <div className="mt-9 grid gap-6 md:grid-cols-2" data-reveal data-reveal-group>
            {options.map((id, i) => {
              const opt = PRICING[id];
              const rooms = availability.options[id];
              // Two independent ways an option closes: the manual flag in
              // pricing.ts, or the contracted rooms actually running out.
              const isSoldOut = !!opt.soldOut || rooms.soldOut;
              const showScarcity =
                availability.known &&
                !isSoldOut &&
                rooms.left > 0 &&
                rooms.left <= scarcityThreshold;
              const featured = id === "double";

              return (
                <div
                  key={id}
                  style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
                  className={`relative flex flex-col p-8 ${
                    featured
                      ? "bg-ppa-navy text-white"
                      : "border border-ppa-line bg-white text-ppa-navy"
                  } ${isSoldOut ? "opacity-75" : ""}`}
                >
                  {featured && !isSoldOut && (
                    <span className="absolute right-6 top-6 bg-vac-teal px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                      Best Value
                    </span>
                  )}
                  {isSoldOut && (
                    <span
                      className={`absolute right-6 top-6 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                        featured ? "bg-white text-ppa-navy" : "bg-ppa-navy text-white"
                      }`}
                    >
                      Sold Out
                    </span>
                  )}

                  <h3 className="font-display text-lg uppercase leading-tight">
                    {opt.label}
                  </h3>
                  <p
                    className={`mt-2 text-sm ${
                      featured ? "text-white/65" : "text-ppa-navy/60"
                    }`}
                  >
                    {opt.blurb}
                  </p>

                  <div className="mt-7 flex flex-wrap items-baseline gap-x-3">
                    <span
                      className={`font-display text-4xl sm:text-5xl ${
                        featured ? "text-vac-teal-pale" : "text-ppa-navy"
                      }`}
                    >
                      {formatUSD(opt.total)}
                    </span>
                    {opt.perPersonNote && (
                      <span
                        className={`text-sm ${
                          featured ? "text-white/60" : "text-ppa-navy/55"
                        }`}
                      >
                        {opt.perPersonNote}
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] ${
                      featured ? "text-white/45" : "text-ppa-navy/45"
                    }`}
                  >
                    {opt.travelers === 1 ? "1 traveler" : "2 travelers"} ·{" "}
                    {trip.nights} nights
                  </p>

                  {showScarcity && (
                    <p
                      className={`mt-4 text-sm font-bold ${
                        featured ? "text-vac-teal-pale" : "text-vac-teal-deep"
                      }`}
                    >
                      Only {rooms.left} of {rooms.total}{" "}
                      {rooms.left === 1 ? "room" : "rooms"} left
                    </p>
                  )}

                  <div className="mt-auto pt-8">
                    {isSoldOut ? (
                      <span
                        aria-disabled="true"
                        className={`block cursor-not-allowed border px-7 py-3.5 text-center text-xs font-bold uppercase tracking-[0.14em] ${
                          featured
                            ? "border-white/20 text-white/50"
                            : "border-ppa-line text-ppa-navy/40"
                        }`}
                      >
                        Sold Out
                      </span>
                    ) : (
                      <Link
                        href={`/vacations/register/?occupancy=${id}`}
                        className={`block px-7 py-3.5 text-center text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
                          featured
                            ? "bg-vac-teal text-white hover:bg-vac-teal-deep"
                            : "bg-ppa-navy text-white hover:bg-ppa-navy-deep"
                        }`}
                      >
                        Select {opt.label}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-sm text-ppa-navy/60" data-reveal>
            Questions before you book?{" "}
            <a
              href={`mailto:${trip.contactEmail}`}
              className="font-bold text-vac-teal-deep underline-offset-4 hover:underline"
            >
              {trip.contactEmail}
            </a>
          </p>
        </div>
      </section>

      {/* ── Getting there ────────────────────────────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div data-reveal>
              <SectionLabel>Getting There</SectionLabel>
              <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Flights &amp; transfers
              </h2>
              <p className="mt-4 font-display text-5xl text-vac-teal-deep">
                {trip.airportCode}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/50">
                {trip.airportName}
              </p>
            </div>
            <div
              className="flex flex-col gap-4 text-sm leading-relaxed text-ppa-navy/70 sm:text-base"
              data-reveal
              style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
            >
              <p>{transportation.body}</p>
              <p>{transportation.body2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trip calendar ────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <div data-reveal>
            <SectionLabel>The Calendar</SectionLabel>
            <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-4xl">
              Every trip
            </h2>
          </div>

          <div className="mt-9 grid gap-6 sm:grid-cols-2" data-reveal data-reveal-group>
            {tripsCalendar.map((t, i) => {
              const status = tripStatus(t);
              const meta = STATUS_META[status];
              return (
                <Link
                  key={t.slug}
                  href={t.href}
                  className="group block border border-ppa-line"
                  style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-ppa-navy">
                    <Image
                      src={t.image}
                      alt={t.resort}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <span
                      className={`absolute left-0 top-4 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${meta.classes}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-vac-teal-deep">
                      {t.datesLabel}
                    </p>
                    <p className="mt-1.5 font-display text-lg uppercase leading-tight text-ppa-navy transition-colors group-hover:text-vac-teal-deep">
                      {t.resort}
                    </p>
                    <p className="mt-1 text-sm text-ppa-navy/60">{t.location}</p>
                    {t.lineup && (
                      <p className="mt-3 text-xs text-ppa-navy/55">{t.lineup}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-ppa-navy-deep text-white">
        <Image
          src={heroImage}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-20"
        />
        <div className="relative mx-auto w-full max-w-3xl px-4 py-16 text-center sm:py-20">
          <Image
            src={logo.white}
            alt="Pickleball Vacations"
            width={240}
            height={69}
            className="mx-auto h-12 w-auto"
          />
          <h2 className="mt-7 font-display text-2xl uppercase leading-[1.02] sm:text-4xl">
            {soldOut.active ? soldOut.headline : "Four nights. Ten courts. One island."}
          </h2>
          <p className="mt-4 text-sm text-white/70 sm:text-base">
            {trip.destination} · {trip.datesLabel} · {trip.location}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {soldOut.active ? (
              <a
                href={soldOut.mailto}
                className="inline-flex h-12 items-center bg-vac-teal px-8 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-vac-teal-deep"
              >
                {soldOut.cta} →
              </a>
            ) : (
              <Link
                href="/vacations/register/"
                className="inline-flex h-12 items-center bg-vac-teal px-8 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-vac-teal-deep"
              >
                Reserve Your Spot →
              </Link>
            )}
            <a
              href={`mailto:${trip.contactEmail}`}
              className="inline-flex h-12 items-center border border-white/30 px-8 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/10"
            >
              Ask a Question
            </a>
          </div>
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
            {trip.poweredBy}
          </p>
        </div>
      </section>
    </>
  );
}
