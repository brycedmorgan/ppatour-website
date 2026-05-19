import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { PartnerSpotlight } from "@/components/home/PartnerSpotlight";
import {
  daysUntil,
  formatDateRange,
  getNextTournament,
  tournaments,
} from "@/lib/placeholder-data";
import {
  explainers,
  leadStory,
  partners,
  playersToWatch,
  pointsRace,
  storylines,
} from "@/lib/home-content";
import { withUtm } from "@/lib/utm";

/* Confirm tour-wide figures with Bryce (§10 lists 150K fans / 25 events / $5.2M). */
const STATS = [
  { n: "25", label: "Tour Stops" },
  { n: "$5.2M", label: "Prize Money" },
  { n: "12", label: "Countries" },
  { n: "150K+", label: "Fans In Arena" },
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
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 bg-ppa-blue" />
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
            dark ? "text-white/55" : "text-ppa-navy/50"
          }`}
        >
          {label}
        </p>
      </div>
      <h2
        className={`mt-2 font-display text-2xl uppercase leading-[1.02] sm:text-3xl ${
          dark ? "text-white" : "text-ppa-navy"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

/** Rank movement indicator for the points race. */
function Move({ n }: { n: number }) {
  if (n > 0) return <span className="text-ppa-yellow">▲ {n}</span>;
  if (n < 0) return <span className="text-white/35">▼ {Math.abs(n)}</span>;
  return <span className="text-white/25">—</span>;
}

export default function Home() {
  const next = getNextTournament();
  const countdown = daysUntil(next.startDate);

  return (
    <>
      {/* ── Hero (event lead) ───────────────────────────────── */}
      <section className="relative isolate flex min-h-[58svh] flex-col justify-end overflow-hidden bg-ppa-navy text-white">
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

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-9 pt-20">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.16em]">
            <span className="bg-ppa-blue px-2 py-0.5">Next Event</span>
            <span className="text-white/70">
              {next.city}, {next.state}
            </span>
            <span className="text-white/25">/</span>
            <span className="text-ppa-yellow">
              {countdown} {countdown === 1 ? "Day" : "Days"} Out
            </span>
          </div>

          <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(1.9rem,5.4vw,3.25rem)] uppercase leading-[0.98]">
            {next.shortName}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wide text-white/75">
            <span>{formatDateRange(next.startDate, next.endDate)}</span>
            <span className="text-white/25">|</span>
            <span>{next.venue}</span>
            <span className="text-white/25">|</span>
            <span className="text-ppa-yellow">
              {next.points.toLocaleString()} Ranking Points
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <a
              href={withUtm(next.ticketsUrl, {
                campaign: next.slug,
                content: "hero-buy-tickets",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-ppa-blue-deep"
            >
              Buy Tickets — from ${next.ticketPriceFrom}
            </a>
            <Link
              href="/watch"
              className="flex h-11 items-center justify-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm transition-colors hover:border-white hover:bg-white hover:text-ppa-navy"
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
              className={`px-2 py-6 ${
                i % 2 === 1 ? "border-l border-white/10" : ""
              } ${i >= 2 ? "border-t border-white/10 md:border-t-0" : ""} ${
                i === 2 ? "md:border-l" : ""
              }`}
            >
              <p className="font-display text-3xl leading-none text-white sm:text-4xl">
                {s.n}
              </p>
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Top Storylines ──────────────────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead label="The Storylines" title="What's Happening on Tour" />
            <Link
              href="/watch"
              className="text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
            >
              All Stories →
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            {/* Lead story */}
            <Link
              href="/watch"
              className="group relative isolate flex aspect-[16/11] flex-col justify-end overflow-hidden bg-ppa-navy lg:col-span-3 lg:aspect-auto lg:min-h-[25rem]"
            >
              <Image
                src={leadStory.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="will-change-transform object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 scrim-hero" />
              <span className="absolute left-4 top-4 bg-ppa-blue px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                {leadStory.kicker}
              </span>
              <div className="relative p-5 text-white sm:p-6">
                <h3 className="font-display text-2xl uppercase leading-[1.02] sm:text-4xl">
                  {leadStory.headline}
                </h3>
                <p className="mt-2 max-w-xl text-sm text-white/70">
                  {leadStory.dek}
                </p>
                <p className="mt-3 border-l-2 border-ppa-yellow pl-3 text-xs leading-relaxed text-white/85">
                  <span className="font-bold uppercase tracking-[0.1em] text-ppa-yellow">
                    Why it matters ·{" "}
                  </span>
                  {leadStory.whyItMatters}
                </p>
              </div>
            </Link>

            {/* Secondary storylines */}
            <div className="flex flex-col divide-y divide-ppa-line border border-ppa-line bg-white lg:col-span-2">
              {storylines.map((s) => (
                <Link
                  key={s.headline}
                  href="/watch"
                  className="group flex flex-1 gap-3 p-4 transition-colors hover:bg-ppa-paper"
                >
                  <div className="relative aspect-square w-20 shrink-0 overflow-hidden bg-ppa-navy">
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
                      {s.kicker}
                    </p>
                    <h4 className="mt-0.5 font-display text-sm uppercase leading-[1.1] text-ppa-navy">
                      {s.headline}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-ppa-navy/55">
                      <span className="font-bold text-ppa-navy/75">
                        Why it matters ·{" "}
                      </span>
                      {s.whyItMatters}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── The Points Race ─────────────────────────────────── */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead label="Standings" title="The Points Race" dark />
            <p className="max-w-xs text-sm text-white/55 sm:text-right">
              Every main-tour stop is worth 1,000+ points. Here&apos;s who is
              climbing toward Nationals.
            </p>
          </div>

          <div className="mt-6 border border-white/10">
            <div className="grid grid-cols-[2rem_1fr_5rem_3.5rem] items-center gap-3 border-b border-white/10 bg-ppa-navy-deep px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              <span>#</span>
              <span>Player</span>
              <span className="text-right">Points</span>
              <span className="text-right">Move</span>
            </div>
            {pointsRace.map((p) => (
              <div
                key={p.rank}
                className="grid grid-cols-[2rem_1fr_5rem_3.5rem] items-center gap-3 border-b border-white/5 px-4 py-3 text-white last:border-b-0"
              >
                <span className="font-display text-lg text-white/40">
                  {p.rank}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold uppercase tracking-wide">
                    {p.name}
                  </span>
                  <span className="block text-[11px] text-white/45">
                    {p.division}
                  </span>
                </span>
                <span className="text-right text-sm font-bold tabular-nums text-ppa-sky">
                  {p.points.toLocaleString()}
                </span>
                <span className="text-right text-xs font-bold">
                  <Move n={p.move} />
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/athletes"
            className="mt-6 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:text-ppa-sky"
          >
            Full Rankings →
          </Link>
        </div>
      </section>

      {/* ── The Main Tour / schedule ────────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead label="2026 Season" title="The Main Tour" />
            <p className="max-w-xs text-sm text-ppa-navy/55 sm:text-right">
              Every stop carries 1,000+ ranking points — the pros chase the
              title at all of them.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((t, i) => (
              <article
                key={t.slug}
                className="group relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden bg-ppa-navy"
              >
                <Image
                  src={t.image}
                  alt={t.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="will-change-transform object-cover grayscale-[30%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 scrim-card" />
                <span className="absolute left-3 top-2 font-display text-2xl leading-none text-white/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="absolute right-3 top-3 bg-ppa-yellow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ppa-navy">
                  {t.points.toLocaleString()} Pts
                </span>
                <div className="relative p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                    {t.tier}
                  </p>
                  <Link
                    href={`/events/${t.slug}`}
                    className="mt-0.5 block font-display text-lg uppercase leading-[1.05] text-white after:absolute after:inset-0"
                  >
                    {t.shortName}
                  </Link>
                  <p className="mt-1 text-xs text-white/60">
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
                    className="relative z-10 mt-3 inline-flex h-8 items-center bg-ppa-blue px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-ppa-blue-deep"
                  >
                    Buy Tickets
                  </a>
                </div>
              </article>
            ))}
          </div>

          <Link
            href="/events"
            className="mt-6 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
          >
            Full 2026 Schedule →
          </Link>
        </div>
      </section>

      {/* ── Players to Watch ────────────────────────────────── */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead label="The Athletes" title="Players to Watch" dark />
            <Link
              href="/athletes"
              className="text-xs font-bold uppercase tracking-[0.12em] text-ppa-yellow hover:text-white"
            >
              All Athletes →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {playersToWatch.map((p) => (
              <Link
                key={p.name}
                href="/athletes"
                className="group flex flex-col overflow-hidden border border-white/10 bg-ppa-navy"
              >
                <div className="relative aspect-[5/4] overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="will-change-transform object-cover object-top grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <span className="absolute left-3 top-3 bg-ppa-yellow px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ppa-navy">
                    No. {p.rank}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4 text-white">
                  <p className="font-display text-lg uppercase leading-none">
                    {p.name}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-sky">
                    {p.division}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">
                    {p.hook}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why It Matters (explainers) ─────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead label="New to the Tour" title="Why It Matters" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {explainers.map((e, i) => (
              <div
                key={e.q}
                className="flex flex-col border border-ppa-line bg-white p-5"
              >
                <span className="font-display text-2xl leading-none text-ppa-blue">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-base uppercase leading-[1.1] text-ppa-navy">
                  {e.q}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ppa-navy/60">
                  {e.a}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/watch"
            className="mt-6 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
          >
            Start Watching →
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
            className="group relative isolate flex min-h-[14rem] items-end overflow-hidden bg-ppa-navy"
          >
            <Image
              src={card.image}
              alt=""
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="will-change-transform object-cover grayscale-[25%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
            />
            <div className="absolute inset-0 scrim-hero" />
            <div className="relative w-full p-6 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-sky">
                {card.kicker}
              </p>
              <h3 className="mt-0.5 font-display text-3xl uppercase leading-none sm:text-4xl">
                {card.title}
              </h3>
              <p className="mt-1 text-sm text-white/65">{card.blurb}</p>
              <span className="mt-2 inline-block text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors group-hover:text-ppa-yellow">
                Enter →
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* ── Partners ────────────────────────────────────────── */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionHead label="Partners" title="Powering the Tour" dark />
            <Link
              href="/about"
              className="text-xs font-bold uppercase tracking-[0.12em] text-ppa-yellow hover:text-white"
            >
              Partnership Opportunities →
            </Link>
          </div>

          <div className="mt-6">
            <PartnerSpotlight />
          </div>

          <div
            className="group mt-4 overflow-hidden border-y border-white/10 py-3.5"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)",
            }}
          >
            <div className="flex w-max items-center gap-12 animate-marquee motion-reduce:animate-none group-hover:[animation-play-state:paused]">
              {[...partners, ...partners].map((p, idx) => (
                <span
                  key={idx}
                  className="flex items-baseline gap-2.5 whitespace-nowrap"
                >
                  <span className="font-display text-lg uppercase text-white/80">
                    {p.name}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                    {p.role}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Where to Watch ──────────────────────────────────── */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead label="Broadcast" title="Where to Watch" />
          <div className="mt-6 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-3">
            {BROADCAST.map((b) => (
              <div key={b.name} className="bg-ppa-paper p-5">
                <span className="text-sm text-ppa-blue">▶</span>
                <p className="mt-2 font-display text-lg uppercase leading-none text-ppa-navy">
                  {b.name}
                </p>
                <p className="mt-1.5 text-xs text-ppa-navy/55">{b.note}</p>
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
          className="will-change-transform object-cover object-center opacity-20"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="fan" />
        </div>
      </section>
    </>
  );
}
