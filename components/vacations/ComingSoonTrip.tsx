import Image from "next/image";
import Link from "next/link";
import type { Availability } from "@/lib/vacations/capacity";
import { logo, scarcityThreshold } from "@/lib/vacations/content";
import { formatUSD, type Occupancy } from "@/lib/vacations/pricing";
import type { ComingSoonTrip as Trip } from "@/lib/vacations/remote-trips";
import type { TripConfig } from "@/lib/vacations/trip-config";

/**
 * The Coming Soon trip page. Started as the St. Lucia placeholder (Lainey,
 * 10/30); since 11/2 every coming-soon trip renders here from Jackalope, where
 * Lainey writes it (lib/vacations/remote-trips.ts).
 *
 * ⚠ A coming-soon trip has no contract-backed price. Nothing on this page may
 * take a card: no price, no room block, no /register link. The only conversion
 * is the email form the vacations layout mounts at the foot of the page, which
 * VacationsLeadCapture tags with the trip's slug, so Lainey can pull each
 * waitlist.
 *
 * Price and approve (11/2): once Bryce approves a sale in Jackalope, the page
 * gets `booking` (the approved TripConfig + live rooms) and shows room cards.
 * Without `booking` it stays Coming Soon, whatever the trip's status says.
 */
export function ComingSoonTrip({
  trip,
  booking,
}: {
  trip: Trip;
  booking?: { cfg: TripConfig; availability: Availability } | null;
}) {
  const selling = !!booking;
  const closed = selling && (trip.status === "sold-out" || !booking.availability.bookingOpen);
  const facts = [
    ["Where", trip.location],
    ["When", trip.datesLabel],
    ["Stay", trip.stay],
  ].filter(([, v]) => v);
  // Once pros are announced, a "Pro lineup" TBA row would contradict the section below it.
  const tba = (trip.pros.length ? trip.tba.filter((t) => !/\bpro/i.test(t)) : trip.tba).filter(
    // Once it sells, "Pricing / Room types / Booking date" are answered by the cards.
    (t) => !(booking && /pric|room|book/i.test(t))
  );
  const pros = [...trip.pros].sort((a, b) => Number(b.lead) - Number(a.lead));

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[64svh] items-end overflow-hidden bg-ppa-navy-deep text-white">
        {trip.hero && (
          <>
            <Image
              src={trip.hero}
              alt={trip.photos.find((p) => p.url === trip.hero)?.alt || `${trip.resort}`}
              fill
              priority
              quality={75}
              sizes="100vw"
              className="animate-kenburns object-cover will-change-transform"
            />
            <div className="absolute inset-0 scrim-hero" />
          </>
        )}

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
            {trip.resort || trip.name}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-bold uppercase tracking-[0.14em]">
            <span className="bg-ppa-yellow px-3 py-1.5 text-ppa-navy">
              {!selling ? "Coming Soon" : closed ? "Sold Out" : "Now Booking"}
            </span>
            <span className="bg-vac-teal px-3 py-1.5 text-white">{trip.datesLabel}</span>
            {trip.stay && (
              <span className="border border-white/25 px-3 py-1.5 text-white/85">{trip.stay}</span>
            )}
          </div>

          {trip.intro && (
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              {trip.intro}
            </p>
          )}

          <div className="mt-7">
            <a
              href={selling && !closed ? "#rooms" : "#vacations-list"}
              className="inline-flex h-12 items-center bg-vac-teal px-7 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-vac-teal-deep"
            >
              {selling && !closed ? "Choose Your Room →" : "Get First Word →"}
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
                {trip.resort || trip.name}
              </p>
            </div>
            <dl className="divide-y divide-ppa-line text-sm">
              {facts.map(([k, v]) => (
                <div key={k} className="flex gap-4 px-6 py-3.5">
                  <dt className="w-24 shrink-0 font-bold uppercase tracking-[0.1em] text-ppa-navy/50">
                    {k}
                  </dt>
                  <dd className="text-ppa-navy">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {tba.length > 0 && (
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 bg-vac-teal" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/60">
                  Still to Be Announced
                </p>
              </div>
              <ul className="mt-5 space-y-3">
                {tba.map((item) => (
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
          )}
        </div>
      </section>

      {/* ── The pros (only once Lainey marks them signed in Jackalope) ── */}
      {pros.length > 0 && (
        <section className="bg-ppa-paper">
          <div className="mx-auto w-full max-w-6xl px-4 pb-14 sm:pb-20">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/60">The Lineup</p>
            <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-4xl">
              Who you&apos;re playing with
            </h2>
            <div
              className={`mt-9 grid gap-6 ${
                pros.length === 1 ? "max-w-xs" : pros.length === 2 ? "max-w-3xl sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {pros.map((pro) => {
                const card = (
                  <>
                    <div className="relative aspect-square overflow-hidden bg-ppa-navy">
                      {pro.image ? (
                        <Image
                          src={pro.image}
                          alt={pro.name}
                          fill
                          sizes="(min-width: 640px) 320px, 100vw"
                          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center font-display text-5xl text-white/80">
                          {pro.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      {pro.lead && (
                        <span className="absolute left-0 top-4 bg-vac-teal px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                          Leading the Trip
                        </span>
                      )}
                    </div>
                    <div className="bg-white p-5">
                      <p className="font-display text-base uppercase leading-tight text-ppa-navy transition-colors group-hover:text-vac-teal-deep">
                        {pro.name}
                      </p>
                    </div>
                  </>
                );
                return pro.slug ? (
                  <Link key={pro.name} href={`/athletes/${pro.slug}/`} className="group block border border-ppa-line">
                    {card}
                  </Link>
                ) : (
                  <div key={pro.name} className="group block border border-ppa-line">
                    {card}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {booking && <RoomCards trip={trip} cfg={booking.cfg} availability={booking.availability} closed={closed} />}

      {/* ── Photos ───────────────────────────────────────────────────── */}
      {trip.photos.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-14 sm:grid-cols-3 sm:py-20">
            {trip.photos.map((p) => (
              <div key={p.url} className="relative aspect-[4/3] overflow-hidden bg-ppa-paper">
                <Image
                  src={p.url}
                  alt={p.alt || trip.resort}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/** The approved offer as bookable room cards. Prices come from the approved copy only. */
function RoomCards({
  trip,
  cfg,
  availability,
  closed,
}: {
  trip: Trip;
  cfg: TripConfig;
  availability: Availability;
  closed: boolean;
}) {
  // Occupancies the approved offer has a price for. Sold-out ones still show, greyed.
  const options = (["single", "double"] as Occupancy[]).filter((id) => cfg.pricing[id].amountCents > 0);
  return (
    <section id="rooms" className="scroll-mt-24 bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:py-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/60">
          {closed ? cfg.waitlist.badge : "Reserve"}
        </p>
        <h2 className="mt-3 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-4xl">
          {closed ? cfg.waitlist.headline : "Choose your room"}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ppa-navy/65 sm:text-base">
          {closed
            ? cfg.waitlist.message
            : `${trip.resort || trip.name} · ${trip.datesLabel}. Rooms are held under a fixed resort block. When they're gone, they're gone.`}
        </p>
        {closed && (
          <a
            href={cfg.waitlist.mailto}
            className="mt-6 inline-flex h-12 items-center bg-vac-teal px-7 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-vac-teal-deep"
          >
            {cfg.waitlist.cta} →
          </a>
        )}
        <div className={`mt-9 grid gap-6 ${options.length > 1 ? "md:grid-cols-2" : "max-w-md"}`}>
          {options.map((id) => {
            const opt = cfg.pricing[id];
            const rooms = availability.options[id];
            const isSoldOut = closed || rooms.soldOut || !!opt.soldOut;
            const scarce = availability.known && !isSoldOut && rooms.left > 0 && rooms.left <= scarcityThreshold;
            const featured = id === "double" && options.length > 1;
            return (
              <div
                key={id}
                className={`relative flex flex-col p-8 ${
                  featured ? "bg-ppa-navy text-white" : "border border-ppa-line bg-white text-ppa-navy"
                } ${isSoldOut ? "opacity-75" : ""}`}
              >
                <h3 className="font-display text-lg uppercase leading-tight">{opt.label}</h3>
                <p className={`mt-2 text-sm ${featured ? "text-white/65" : "text-ppa-navy/60"}`}>{opt.blurb}</p>
                <div className="mt-7 flex flex-wrap items-baseline gap-x-3">
                  <span className={`font-display text-4xl sm:text-5xl ${featured ? "text-vac-teal-pale" : "text-ppa-navy"}`}>
                    {formatUSD(opt.total)}
                  </span>
                  {opt.perPersonNote && (
                    <span className={`text-sm ${featured ? "text-white/60" : "text-ppa-navy/55"}`}>{opt.perPersonNote}</span>
                  )}
                </div>
                <p className={`mt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] ${featured ? "text-white/45" : "text-ppa-navy/45"}`}>
                  {opt.travelers === 1 ? "1 traveler" : "2 travelers"} · {cfg.nights} nights
                </p>
                {scarce && (
                  <p className={`mt-4 text-sm font-bold ${featured ? "text-vac-teal-pale" : "text-vac-teal-deep"}`}>
                    Only {rooms.left} of {rooms.total} {rooms.left === 1 ? "room" : "rooms"} left
                  </p>
                )}
                <div className="mt-auto pt-8">
                  {isSoldOut ? (
                    <span
                      aria-disabled="true"
                      className={`block cursor-not-allowed border px-7 py-3.5 text-center text-xs font-bold uppercase tracking-[0.14em] ${
                        featured ? "border-white/20 text-white/50" : "border-ppa-line text-ppa-navy/40"
                      }`}
                    >
                      Sold Out
                    </span>
                  ) : (
                    <Link
                      href={`/vacations/register/?trip=${cfg.slug}&occupancy=${id}`}
                      className={`block px-7 py-3.5 text-center text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
                        featured ? "bg-vac-teal text-white hover:bg-vac-teal-deep" : "bg-ppa-navy text-white hover:bg-ppa-navy-deep"
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
        <p className="mt-8 text-center text-sm text-ppa-navy/60">
          Questions before you book?{" "}
          <a href={`mailto:${cfg.contactEmail}`} className="font-bold text-vac-teal-deep underline-offset-4 hover:underline">
            {cfg.contactEmail}
          </a>
        </p>
      </div>
    </section>
  );
}
