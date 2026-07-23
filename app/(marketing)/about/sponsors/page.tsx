import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { partners } from "@/lib/home-content";
import { SponsorInquiryForm } from "@/components/marketing/SponsorInquiryForm";

export const metadata: Metadata = {
  title: "Sponsors & Partnerships",
  description:
    "Reach the hardest-to-reach affluent audience in sports. PPA Tour partnership tiers, audience reach, broadcast surfaces, and activation case studies.",
};

const REACH = [
  { n: "4M+", label: "Sessions / Quarter", note: "Owned web + app traffic" },
  { n: "1.2M+", label: "Social Followers", note: "Across PPA channels" },
  { n: "150K+", label: "Fans In-Arena", note: "Annual gate, all stops" },
  { n: "500+", label: "Broadcast Hours", note: "PBTV + national TV" },
];

const SURFACES = [
  {
    label: "TV & Streaming",
    items: [
      "PickleballTV — every match, every weekend, free streaming",
      "Tennis Channel — featured rounds and Championship Sundays",
      "FOX & FS1 — marquee finals on national television",
      "MATCHDAY App — live scores, brackets, push alerts",
    ],
  },
  {
    label: "In-Arena & On-Court",
    items: [
      "Title and presenting-partner court branding (every televised court)",
      "Premium hospitality suites and courtside boxes",
      "On-court signage and concourse activations",
      "150K+ fans in attendance across 18 stops",
    ],
  },
  {
    label: "Digital & Owned",
    items: [
      "4M+ web sessions per quarter (ppatour.com)",
      "Newsletter list with weekly editorial sends",
      "Athlete partnerships and creator-driven social",
      "Year-round content programming and series",
    ],
  },
];

const TIERS = [
  {
    name: "Title Partner",
    note: "One brand. Year-round category exclusivity across every stop, every broadcast, and every owned surface. The PPA Tour is the Carvana PPA Tour.",
    cta: "Limited availability — annual renewal",
  },
  {
    name: "Presenting Partner",
    note: "Premier branding at an individual tour stop — court, signage, segments, and the right to name the event (e.g. Veolia Cincinnati Cup).",
    cta: "Per-stop or season package",
  },
  {
    name: "Category-Exclusive",
    note: "Exclusive in a single category (paddles, hydration, health, automotive, etc.) across the full season. National rights, broadcast inclusion, athlete tie-ins.",
    cta: "Annual",
  },
  {
    name: "Official Partner",
    note: "Trusted brands integrated into the tour ecosystem — on-site activations, ticket integrations, and athlete programming without category exclusivity.",
    cta: "Annual",
  },
];

const AUDIENCE = [
  { stat: "Premium", note: "65% of the PPA Tour audience reports a household income above $100K." },
  { stat: "Engaged", note: "More than half attend or watch more than one pro stop per season." },
  { stat: "Balanced", note: "Roughly even split male/female — a rarity in pro sports media." },
  { stat: "Active", note: "Pickleball is the fastest-growing sport in America for five consecutive years (SFIA)." },
];

const CASE_STUDIES = [
  {
    partner: "Carvana",
    role: "Title Partner",
    note: "Primary court branding sees 2M+ broadcast impressions per finals weekend; a mobile activation visits every tour stop; co-branded social and segment integration across the season.",
  },
  {
    partner: "Veolia",
    role: "Presenting Partner",
    note: "Powering the tour sustainably — water, waste, and sustainability touchpoints at every Veolia-presenting stop, plus a featured branded segment integrated into every broadcast window.",
  },
  {
    partner: "Selkirk",
    role: "Official Equipment Partner",
    note: "Paddle of choice for a majority of the top-30 pros; on-site demo zones at every stop and the paddle-of-record marketing across the schedule.",
  },
];

export default function SponsorsPage() {
  const title = partners.find((p) => p.tier === "title")!;
  const officials = partners.filter((p) => p.tier === "official");

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ppa-navy text-white">
        <Image
          src="/ppa/action-champ-sunday.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 scrim-hero" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              For Brands
            </p>
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-3xl uppercase leading-[1.02] sm:text-5xl">
            Reach the Hardest-to-Reach Audience in Sports
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            The Carvana PPA Tour delivers what brand teams are chasing: an
            affluent, balanced, deeply engaged audience watching live every
            weekend — on national TV, on premium streaming, and in sold-out
            arenas across eighteen U.S. markets.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#inquire"
              className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
            >
              Partnership Inquiry →
            </a>
            <a
              href="mailto:partnerships@ppatour.com?subject=2026-27%20PPA%20Tour%20Media%20Kit"
              className="inline-flex h-11 items-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-ppa-navy"
            >
              Request the Media Kit
            </a>
          </div>
        </div>
      </section>

      {/* Reach */}
      <section className="bg-ppa-navy-deep text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 px-4 md:grid-cols-4">
          {REACH.map((r, i) => (
            <div
              key={r.label}
              className={`px-3 py-7 ${i % 2 === 1 ? "border-l border-white/10" : ""} ${i >= 2 ? "border-t border-white/10 md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}
            >
              <p className="font-display text-3xl leading-none text-ppa-yellow sm:text-4xl">
                {r.n}
              </p>
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                {r.label}
              </p>
              <p className="mt-1 text-[11px] text-white/45">{r.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Audience */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            The Audience
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Affluent. Balanced. Engaged.
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCE.map((a) => (
              <div
                key={a.stat}
                className="flex flex-col border border-ppa-line bg-ppa-paper p-5"
              >
                <p className="font-display text-2xl uppercase text-ppa-blue">
                  {a.stat}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                  {a.note}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.1em] text-ppa-navy/40">
            Full demographic and brand-affinity breakdowns in the 2026–27 media kit.
          </p>
        </div>
      </section>

      {/* Surfaces */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Where You&apos;re Seen
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Every Screen. Every Court.
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {SURFACES.map((s) => (
              <div
                key={s.label}
                className="flex flex-col border border-ppa-line bg-white"
              >
                <p className="border-b border-ppa-line px-5 py-4 font-display text-base uppercase text-ppa-navy">
                  {s.label}
                </p>
                <ul className="flex flex-col gap-2 p-5">
                  {s.items.map((i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-ppa-navy/75"
                    >
                      <span className="mt-2 size-1.5 shrink-0 bg-ppa-blue" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Partnership Tiers
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            How Brands Build with the Tour
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {TIERS.map((t, i) => (
              <div
                key={t.name}
                className={`flex flex-col border p-6 ${i === 0 ? "border-ppa-navy bg-ppa-navy text-white" : "border-ppa-line bg-ppa-paper"}`}
              >
                <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${i === 0 ? "text-ppa-yellow" : "text-ppa-blue"}`}>
                  Tier {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className={`mt-1 font-display text-2xl uppercase ${i === 0 ? "text-white" : "text-ppa-navy"}`}>
                  {t.name}
                </h3>
                <p className={`mt-3 text-sm leading-relaxed ${i === 0 ? "text-white/75" : "text-ppa-navy/70"}`}>
                  {t.note}
                </p>
                <p className={`mt-4 text-[11px] font-bold uppercase tracking-[0.14em] ${i === 0 ? "text-white/45" : "text-ppa-navy/45"}`}>
                  {t.cta}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Title partner spotlight */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-blue">
            Title Partner
          </p>
          <div className="relative isolate mt-3 overflow-hidden border border-ppa-line bg-white">
            <div className="absolute inset-x-0 top-0 h-1 bg-ppa-blue" />
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_1.4fr] lg:items-center">
              <div className="flex h-28 items-center justify-start sm:h-32">
                {title.logo && (
                  <Image
                    src={title.logo}
                    alt={title.name}
                    width={title.logoWidth!}
                    height={title.logoHeight!}
                    priority
                    className="max-h-full w-auto max-w-[320px] object-contain object-left sm:max-w-[400px]"
                  />
                )}
              </div>
              <div>
                <p className="font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                  {title.name}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/65 sm:text-base">
                  {title.note}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Official partners */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Official Partners
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Category Leaders
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {officials.map((p) => (
              <div
                key={p.name}
                className="flex flex-col overflow-hidden border border-ppa-line bg-white"
              >
                <div className="flex h-24 items-center justify-center border-b border-ppa-line bg-white p-5">
                  {p.logo ? (
                    <Image
                      src={p.logo}
                      alt={p.name}
                      width={p.logoWidth!}
                      height={p.logoHeight!}
                      className="max-h-full w-auto max-w-[180px] object-contain"
                    />
                  ) : (
                    <span className="font-display text-xl uppercase text-ppa-navy">
                      {p.name}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
                    {p.role}
                  </p>
                  <p className="mt-1 font-display text-lg uppercase leading-[1.1] text-ppa-navy">
                    {p.name}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ppa-navy/60">
                    {p.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case studies */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            How Partners Activate
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            What This Looks Like in Practice
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {CASE_STUDIES.map((c) => (
              <div
                key={c.partner}
                className="flex flex-col border border-ppa-line bg-white p-5"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
                  {c.role}
                </p>
                <p className="mt-1 font-display text-xl uppercase text-ppa-navy">
                  {c.partner}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ppa-navy/65">
                  {c.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership inquiry form — submissions land in the sales pipeline */}
      <section id="inquire" className="scroll-mt-[120px] bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-blue">
                Start Here
              </p>
              <h2 className="mt-2 font-display text-3xl uppercase leading-[1.02] text-ppa-navy sm:text-4xl">
                Tell Us About Your Brand
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ppa-navy/60">
                Two minutes, no commitment. Your inquiry goes straight to our
                partnerships team — we&apos;ll come back with a custom plan and
                the full 2026–27 media kit within five business days.
              </p>
              <p className="mt-4 text-sm text-ppa-navy/60">
                Prefer email?{" "}
                <a
                  href="mailto:partnerships@ppatour.com"
                  className="font-bold text-ppa-blue hover:text-ppa-navy"
                >
                  partnerships@ppatour.com
                </a>
              </p>
            </div>
            <SponsorInquiryForm />
          </div>
        </div>
      </section>

      {/* The Ask */}
      <section className="bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14">
          <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-yellow">
                Let&apos;s Talk
              </p>
              <h2 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
                Build the Next Chapter With Us
              </h2>
              <p className="mt-3 max-w-xl text-sm text-white/65">
                Title, presenting, category, or official — we&apos;ll come back
                with a custom plan and the full 2026–27 media kit within five
                business days.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href="#inquire"
                className="flex h-12 items-center justify-center bg-ppa-blue px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
              >
                Start a Partnership Inquiry →
              </a>
              <Link
                href="/about/host-tournament"
                className="flex h-12 items-center justify-center border border-white/25 px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-ppa-navy"
              >
                Or host a stop →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
