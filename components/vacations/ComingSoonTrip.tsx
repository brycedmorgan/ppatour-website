import Image from "next/image";
import Link from "next/link";
import { logo } from "@/lib/vacations/content";
import type { ComingSoonTrip as Trip } from "@/lib/vacations/remote-trips";

/**
 * The Coming Soon trip page. Started as the St. Lucia placeholder (Lainey,
 * 10/30); since 11/2 every coming-soon trip renders here from Jackalope, where
 * Lainey writes it (lib/vacations/remote-trips.ts).
 *
 * ⚠ A coming-soon trip has no contract-backed price. Nothing on this page may
 * take a card: no price, no room block, no /register link. The only conversion
 * is the email form the vacations layout mounts at the foot of the page, which
 * VacationsLeadCapture tags with the trip's slug, so Lainey can pull each
 * waitlist. A trip goes on sale by moving to TripPage like Cancún.
 */
export function ComingSoonTrip({ trip }: { trip: Trip }) {
  const facts = [
    ["Where", trip.location],
    ["When", trip.datesLabel],
    ["Stay", trip.stay],
  ].filter(([, v]) => v);
  // Once pros are announced, a "Pro lineup" TBA row would contradict the section below it.
  const tba = trip.pros.length ? trip.tba.filter((t) => !/\bpro/i.test(t)) : trip.tba;
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
            <span className="bg-ppa-yellow px-3 py-1.5 text-ppa-navy">Coming Soon</span>
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
