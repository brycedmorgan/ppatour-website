import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";

export const metadata: Metadata = { title: "About" };

const STATS = [
  { n: "25", label: "Tour Stops" },
  { n: "$5.2M", label: "Prize Money" },
  { n: "12", label: "Countries" },
  { n: "150K+", label: "Fans In Arena" },
];

const LINKS = [
  {
    label: "Sponsors",
    href: "/about/sponsors",
    blurb: "Title partner, official partners, and the brands powering the tour.",
  },
  {
    label: "How It Works",
    href: "/about/how-it-works",
    blurb: "Ranking points, brackets, divisions, and the path to Nationals.",
  },
  {
    label: "What is Pickleball?",
    href: "/about/what-is-pickleball",
    blurb: "The fastest-growing sport in America, explained in 90 seconds.",
  },
  {
    label: "Careers",
    href: "/about/careers",
    blurb: "Help build the pro tour of pickleball.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Header / Mission */}
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
              About
            </p>
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-3xl uppercase leading-[1.02] sm:text-5xl">
            The Pro Tour of the Fastest-Growing Sport
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            The PPA Tour is the premier professional pickleball circuit —
            twenty-five main-tour stops a year, the best players in the world,
            sold-out arenas, and one points race. We exist to put the best
            content, the cleanest broadcast, and the most exciting matches in
            pickleball in front of the largest possible audience.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-ppa-navy-deep text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 px-4 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`px-2 py-7 ${
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

      {/* Mission / story */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                Our Story
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Built for the New Era of Pickleball
              </h2>
              <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                <p>
                  Pickleball is the fastest-growing sport in America for the
                  fifth year running. The PPA Tour was built to meet that
                  growth with a pro circuit that looks, feels, and runs like
                  the major sports: a real season, a real ranking, marquee
                  venues, national TV windows, and a unified place to follow
                  every match.
                </p>
                <p>
                  Twenty-five main-tour stops cover every region of the
                  country, plus a growing international footprint. Each stop
                  carries 1,000+ ranking points; Grand Slams pay double. The
                  season ends at the Veolia Pickleball National Championships
                  and the Toys&nbsp;&quot;R&quot;&nbsp;Us PPA Finals, where the
                  No.&nbsp;1 ranking is decided.
                </p>
                <p>
                  Off the court, the PPA Tour partners with FOX, FS1, and
                  YouTube to broadcast every main match; with Pickleball
                  Central for retail; with Pickleball.com for ecosystem
                  coverage; and with Carvana as our title partner across every
                  court and every broadcast.
                </p>
              </div>
            </div>

            <aside>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                Learn More
              </p>
              <div className="mt-3 flex flex-col gap-px border border-ppa-line bg-ppa-line">
                {LINKS.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="group flex flex-col gap-1 bg-white p-4 transition-colors hover:bg-ppa-paper"
                  >
                    <span className="font-display text-base uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                      {l.label}
                    </span>
                    <span className="text-xs text-ppa-navy/55">{l.blurb}</span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Email */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="fan" />
        </div>
      </section>
    </>
  );
}
