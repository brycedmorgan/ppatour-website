import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import {
  daysUntil,
  formatDateRange,
  getNextTournament,
  getUpcomingTournaments,
} from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

const STORIES = [
  {
    image: "/ppa/action-masters.jpg",
    tag: "Docuseries",
    title: "PARTNERS — the first reality series inside pro pickleball",
    blurb: "From partners to rivals, friends to foe. Streaming now on YouTube.",
  },
  {
    image: "/ppa/action-mxd.jpg",
    tag: "Highlights",
    title: "The Top 10 plays of the Veolia Atlanta Championships",
    blurb: "The shots that had the crowd on its feet in Peachtree Corners.",
  },
  {
    image: "/ppa/action-md-final.jpg",
    tag: "Match Report",
    title: "Championship Sunday: standout stats from the PPA Finals",
    blurb: "The numbers behind a record-breaking finals weekend.",
  },
];

const PROS = [
  { image: "/ppa/player-bricker.webp", name: "Austin Bricker", division: "Men's Doubles" },
  { image: "/ppa/player-safdar.webp", name: "Mehvish Safdar", division: "Women's Doubles" },
  { image: "/ppa/player-rau.webp", name: "Jade Rau", division: "Women's Singles" },
];

const BROADCAST = [
  { name: "FOX & FS1", note: "Marquee finals on national television" },
  { name: "PPA Tour on YouTube", note: "Every court, every match, streamed live" },
  { name: "MATCHDAY App", note: "Live scores, brackets, and match alerts" },
];

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="flex items-end gap-4">
      <div className="h-9 w-1.5 shrink-0 bg-ppa-red" />
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ppa-yellow">
          {kicker}
        </p>
        <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
      </div>
    </div>
  );
}

export default function Home() {
  const next = getNextTournament();
  const upcoming = getUpcomingTournaments(3);
  const countdown = daysUntil(next.startDate);

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden">
        <Image
          src="/ppa/hero-action.jpg"
          alt="PPA Tour pro doubles action"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[60%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ppa-ink via-ppa-ink/65 to-ppa-ink/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-ppa-ink/85 via-ppa-ink/30 to-transparent" />

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-14 pt-28 sm:pb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-ppa-ink/60 px-3 py-1.5 backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-ppa-red" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/90">
              Next Stop
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-ppa-yellow">
              {countdown} {countdown === 1 ? "day" : "days"} out
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.5rem,11vw,7rem)] font-bold uppercase leading-[0.92] tracking-tight">
            {next.shortName}
          </h1>
          <p className="mt-4 text-lg font-medium text-white/75 sm:text-xl">
            {formatDateRange(next.startDate, next.endDate)} · {next.venue} ·{" "}
            {next.city}, {next.state}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={withUtm(next.ticketsUrl, {
                campaign: next.slug,
                content: "hero-buy-tickets",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 items-center justify-center bg-ppa-red px-8 font-display text-base font-bold uppercase tracking-wide transition-colors hover:bg-ppa-red-dark"
            >
              Buy Tickets · from ${next.ticketPriceFrom}
            </a>
            <Link
              href="/watch"
              className="flex h-14 items-center justify-center border border-white/30 bg-white/5 px-8 font-display text-base font-bold uppercase tracking-wide backdrop-blur transition-colors hover:border-ppa-yellow hover:text-ppa-yellow"
            >
              ▶ Watch Live
            </Link>
          </div>
        </div>
      </section>

      {/* ── Two-path fork ───────────────────────────────────── */}
      <section className="grid sm:grid-cols-2">
        {[
          {
            href: "/watch",
            image: "/ppa/action-champ-sunday.jpg",
            kicker: "For Fans",
            title: "Watch",
            blurb: "Live streams, brackets, and the pros.",
          },
          {
            href: "/play",
            image: "/ppa/action-singles.jpg",
            kicker: "For Players",
            title: "Play",
            blurb: "Register for an amateur event and start competing.",
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative isolate flex min-h-[20rem] items-end overflow-hidden"
          >
            <Image
              src={card.image}
              alt=""
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ppa-ink via-ppa-ink/55 to-ppa-ink/10" />
            <div className="relative w-full p-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ppa-yellow">
                {card.kicker}
              </p>
              <h3 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">
                {card.title}
              </h3>
              <p className="mt-2 text-white/70">{card.blurb}</p>
              <span className="mt-3 inline-block font-display text-sm font-bold uppercase tracking-wide text-ppa-red transition-colors group-hover:text-ppa-yellow">
                Enter →
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* ── Next Stop rail ──────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <SectionHeading kicker="2026 Season" title="Next Stop on Tour" />
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {upcoming.map((t) => (
            <div
              key={t.slug}
              className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden"
            >
              <Image
                src={t.image}
                alt={t.name}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ppa-ink via-ppa-ink/55 to-transparent" />
              <div className="relative p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-yellow">
                  {t.tier}
                </p>
                <Link
                  href={`/events/${t.slug}`}
                  className="font-display text-2xl font-bold uppercase leading-tight tracking-tight after:absolute after:inset-0"
                >
                  {t.shortName}
                </Link>
                <p className="mt-1 text-sm text-white/65">
                  {formatDateRange(t.startDate, t.endDate)} · {t.city},{" "}
                  {t.state}
                </p>
                <a
                  href={withUtm(t.ticketsUrl, {
                    campaign: t.slug,
                    content: "next-stop-buy-tickets",
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 mt-3 inline-flex h-10 items-center bg-ppa-red px-4 font-display text-xs font-bold uppercase tracking-wide transition-colors hover:bg-ppa-red-dark"
                >
                  Buy Tickets
                </a>
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/events"
          className="mt-6 inline-block font-display text-sm font-bold uppercase tracking-wide text-ppa-yellow hover:underline"
        >
          Full 2026 Schedule →
        </Link>
      </section>

      {/* ── Inside the Tour ─────────────────────────────────── */}
      <section className="border-t border-white/10 bg-black/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <SectionHeading kicker="Stories" title="Inside the Tour" />
          <div className="mt-7 grid gap-6 md:grid-cols-3">
            {STORIES.map((s) => (
              <article key={s.title} className="group">
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={s.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 bg-ppa-red px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
                    {s.tag}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold uppercase leading-tight tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-white/60">{s.blurb}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Meet the Pros ───────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <SectionHeading kicker="The Athletes" title="Meet the Pros" />
        <div className="mt-7 grid grid-cols-3 gap-4 sm:gap-6">
          {PROS.map((p) => (
            <div
              key={p.name}
              className="group relative isolate flex aspect-square flex-col justify-end overflow-hidden bg-ppa-navy"
            >
              <Image
                src={p.image}
                alt={p.name}
                fill
                sizes="(min-width: 640px) 33vw, 33vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ppa-ink via-transparent to-transparent" />
              <div className="relative p-3 sm:p-4">
                <p className="font-display text-base font-bold uppercase leading-none tracking-tight sm:text-xl">
                  {p.name}
                </p>
                <p className="text-[11px] uppercase tracking-wide text-ppa-yellow sm:text-xs">
                  {p.division}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/athletes"
          className="mt-6 inline-block font-display text-sm font-bold uppercase tracking-wide text-ppa-yellow hover:underline"
        >
          All Athletes →
        </Link>
      </section>

      {/* ── Where to Watch ──────────────────────────────────── */}
      <section className="border-t border-white/10 bg-black/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <SectionHeading kicker="Broadcast" title="Where to Watch" />
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {BROADCAST.map((b) => (
              <div
                key={b.name}
                className="border border-white/10 bg-ppa-navy/40 p-6"
              >
                <p className="font-display text-xl font-bold uppercase tracking-tight text-white">
                  {b.name}
                </p>
                <p className="mt-1 text-sm text-white/55">{b.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Email capture ───────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-t border-white/10">
        <Image
          src="/ppa/action-waters-bright.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-ppa-ink/85" />
        <div className="relative mx-auto w-full max-w-3xl px-4 py-16">
          <LeadMagnetCapture variant="fan" />
        </div>
      </section>
    </>
  );
}
