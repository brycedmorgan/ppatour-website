import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import {
  daysUntil,
  formatDateRange,
  getNextTournament,
  tournaments,
} from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

/* Confirm tour-wide figures with Bryce (§10 lists 150K fans / 25 events / $5.2M). */
const STATS = [
  { n: "25", label: "Tour Stops" },
  { n: "$5.2M", label: "Prize Money" },
  { n: "12", label: "Countries" },
  { n: "150K+", label: "Fans In Arena" },
];

const STORIES = [
  {
    image: "/ppa/action-masters.jpg",
    tag: "Docuseries",
    title: "PARTNERS",
    blurb:
      "The first reality series inside professional pickleball. From partners to rivals, friends to foe — streaming now on YouTube.",
  },
  {
    image: "/ppa/action-mxd.jpg",
    tag: "Highlights",
    title: "Top 10 Plays — Atlanta",
    blurb: "The shots that brought the crowd to its feet.",
  },
  {
    image: "/ppa/action-md-final.jpg",
    tag: "Match Report",
    title: "Championship Sunday Stats",
    blurb: "The numbers behind a record finals weekend.",
  },
];

const PROS = [
  { image: "/ppa/player-bricker.webp", name: "Austin Bricker", division: "Men's Doubles" },
  { image: "/ppa/player-safdar.webp", name: "Mehvish Safdar", division: "Women's Doubles" },
  { image: "/ppa/player-rau.webp", name: "Jade Rau", division: "Women's Singles" },
];

const BROADCAST = [
  { name: "FOX & FS1", note: "Marquee finals on national television" },
  { name: "PPA Tour · YouTube", note: "Every court, every match, streamed live" },
  { name: "MATCHDAY App", note: "Live scores, brackets, and match alerts" },
];

function SectionHead({
  label,
  title,
  dark = false,
}: {
  label: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 bg-ppa-blue" />
        <p
          className={`text-xs font-bold uppercase tracking-[0.22em] ${
            dark ? "text-white/60" : "text-ppa-navy/55"
          }`}
        >
          {label}
        </p>
      </div>
      <h2
        className={`mt-3 font-display text-5xl uppercase leading-[0.9] sm:text-7xl ${
          dark ? "text-white" : "text-ppa-navy"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

export default function Home() {
  const next = getNextTournament();
  const countdown = daysUntil(next.startDate);

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[92svh] flex-col justify-end overflow-hidden bg-ppa-navy text-white">
        <Image
          src="/ppa/hero-action.jpg"
          alt="PPA Tour pro action"
          fill
          priority
          sizes="100vw"
          className="will-change-transform object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 scrim-hero" />
        <div className="absolute inset-0 scrim-side" />

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-32">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-[0.18em]">
            <span className="bg-ppa-blue px-2.5 py-1">Next Event</span>
            <span className="text-white/70">
              {next.city}, {next.state}
            </span>
            <span className="text-white/30">/</span>
            <span className="text-ppa-yellow">
              {countdown} {countdown === 1 ? "Day" : "Days"} Out
            </span>
          </div>

          <h1 className="mt-6 max-w-[14ch] font-display text-[clamp(3rem,12.5vw,8.5rem)] uppercase leading-[0.86]">
            {next.shortName}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm font-semibold uppercase tracking-wide text-white/75">
            <span>{formatDateRange(next.startDate, next.endDate)}</span>
            <span className="text-white/25">|</span>
            <span>{next.venue}</span>
            <span className="text-white/25">|</span>
            <span className="text-ppa-yellow">
              {next.points.toLocaleString()} Ranking Points
            </span>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={withUtm(next.ticketsUrl, {
                campaign: next.slug,
                content: "hero-buy-tickets",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 items-center justify-center bg-ppa-blue px-9 text-sm font-bold uppercase tracking-[0.14em] transition-colors hover:bg-ppa-blue-deep"
            >
              Buy Tickets — from ${next.ticketPriceFrom}
            </a>
            <Link
              href="/watch"
              className="flex h-14 items-center justify-center border border-white/25 px-9 text-sm font-bold uppercase tracking-[0.14em] backdrop-blur-sm transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
            >
              ▶ Watch Live
            </Link>
          </div>
        </div>
        <div className="relative h-1 bg-ppa-blue" />
      </section>

      {/* ── Stat band ───────────────────────────────────────── */}
      <section className="bg-ppa-navy-deep text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 px-4 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`px-2 py-9 ${
                i % 2 === 1 ? "border-l border-white/10" : ""
              } ${i >= 2 ? "border-t border-white/10 md:border-t-0" : ""} ${
                i === 2 ? "md:border-l" : ""
              }`}
            >
              <p className="font-display text-5xl leading-none text-white sm:text-6xl">
                {s.n}
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The Main Tour / schedule ────────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead label="2026 Season" title="The Main Tour" />
            <p className="max-w-xs text-sm text-ppa-navy/55 sm:text-right">
              Every stop carries 1,000+ ranking points. The pros chase the
              title — and the climb — at all of them.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {tournaments.map((t, i) => (
              <article
                key={t.slug}
                className="group relative isolate flex aspect-[3/4] flex-col justify-end overflow-hidden bg-ppa-navy"
              >
                <Image
                  src={t.image}
                  alt={t.name}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="will-change-transform object-cover grayscale-[35%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 scrim-card" />
                <span className="absolute left-4 top-3 font-display text-6xl leading-none text-white/25">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="absolute right-4 top-5 bg-ppa-yellow px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ppa-navy">
                  {t.points.toLocaleString()} Pts
                </span>
                <div className="relative p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
                    {t.tier}
                  </p>
                  <Link
                    href={`/events/${t.slug}`}
                    className="mt-1 block font-display text-3xl uppercase leading-[0.9] text-white after:absolute after:inset-0"
                  >
                    {t.shortName}
                  </Link>
                  <p className="mt-2 text-sm text-white/60">
                    {formatDateRange(t.startDate, t.endDate)} · {t.city},{" "}
                    {t.state}
                  </p>
                  <a
                    href={withUtm(t.ticketsUrl, {
                      campaign: t.slug,
                      content: "schedule-buy-tickets",
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 mt-4 inline-flex h-10 items-center bg-ppa-blue px-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
                  >
                    Buy Tickets
                  </a>
                </div>
              </article>
            ))}
          </div>

          <Link
            href="/events"
            className="mt-9 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-1 text-sm font-bold uppercase tracking-[0.14em] text-ppa-navy hover:text-ppa-blue"
          >
            Full 2026 Schedule →
          </Link>
        </div>
      </section>

      {/* ── Watch / Play ────────────────────────────────────── */}
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
            blurb: "Register for an amateur event and compete.",
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative isolate flex min-h-[22rem] items-end overflow-hidden bg-ppa-navy"
          >
            <Image
              src={card.image}
              alt=""
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="will-change-transform object-cover grayscale-[30%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
            />
            <div className="absolute inset-0 scrim-hero" />
            <div className="relative w-full p-7 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-ppa-blue">
                {card.kicker}
              </p>
              <h3 className="mt-1 font-display text-6xl uppercase leading-none">
                {card.title}
              </h3>
              <p className="mt-2 text-white/65">{card.blurb}</p>
              <span className="mt-3 inline-block text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors group-hover:text-ppa-yellow">
                Enter →
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* ── Inside the Tour (editorial) ─────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-20">
          <SectionHead label="Stories" title="Inside the Tour" />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {/* Feature */}
            <Link
              href="/watch"
              className="group relative isolate flex aspect-[16/11] flex-col justify-end overflow-hidden bg-ppa-navy lg:row-span-2 lg:aspect-auto"
            >
              <Image
                src={STORIES[0].image}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="will-change-transform object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 scrim-soft" />
              <span className="absolute left-5 top-5 bg-ppa-blue px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                {STORIES[0].tag}
              </span>
              <div className="relative p-6 text-white">
                <h3 className="font-display text-5xl uppercase leading-[0.9] sm:text-7xl">
                  {STORIES[0].title}
                </h3>
                <p className="mt-3 max-w-md text-white/70">
                  {STORIES[0].blurb}
                </p>
              </div>
            </Link>

            {/* Secondary stories */}
            {STORIES.slice(1).map((s) => (
              <Link
                key={s.title}
                href="/watch"
                className="group flex gap-4 border border-ppa-line bg-white p-4"
              >
                <div className="relative aspect-square w-28 shrink-0 overflow-hidden bg-ppa-navy sm:w-40">
                  <Image
                    src={s.image}
                    alt=""
                    fill
                    sizes="160px"
                    className="will-change-transform object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-blue">
                    {s.tag}
                  </p>
                  <h3 className="mt-1 font-display text-2xl uppercase leading-[0.95] text-ppa-navy sm:text-3xl">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm text-ppa-navy/55">{s.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Pros ────────────────────────────────────────── */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead label="The Athletes" title="Meet the Pros" dark />
            <Link
              href="/athletes"
              className="text-sm font-bold uppercase tracking-[0.14em] text-ppa-yellow hover:text-white"
            >
              All Athletes →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-5">
            {PROS.map((p) => (
              <Link
                key={p.name}
                href="/athletes"
                className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden bg-ppa-navy-deep"
              >
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="(min-width: 640px) 33vw, 33vw"
                  className="will-change-transform object-cover object-top grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 scrim-soft" />
                <div className="relative p-3 sm:p-4">
                  <p className="font-display text-lg uppercase leading-[0.95] text-white sm:text-2xl">
                    {p.name}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-blue sm:text-xs">
                    {p.division}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Where to Watch ──────────────────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-20">
          <SectionHead label="Broadcast" title="Where to Watch" />
          <div className="mt-10 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-3">
            {BROADCAST.map((b) => (
              <div key={b.name} className="bg-ppa-paper p-7">
                <span className="font-display text-xl text-ppa-blue">▶</span>
                <p className="mt-3 font-display text-2xl uppercase leading-none text-ppa-navy">
                  {b.name}
                </p>
                <p className="mt-2 text-sm text-ppa-navy/55">{b.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Email capture ───────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-ppa-navy">
        <Image
          src="/ppa/action-waters-bright.jpg"
          alt=""
          fill
          sizes="100vw"
          className="will-change-transform object-cover object-center opacity-25"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-20">
          <LeadMagnetCapture variant="fan" />
        </div>
      </section>
    </>
  );
}
