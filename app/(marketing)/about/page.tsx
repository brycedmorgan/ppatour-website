import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";

export const metadata: Metadata = {
  title: "About",
  description:
    "About the Carvana PPA Tour — the premier professional pickleball tour — 18 stops a year and the best players in the world, all chasing one points race.",
};

/**
 * Stat band rebuilt with Tyler's figures (7/30). The prior band was pulled
 * (Connor, 7/29) because the purse/stops weren't owned numbers; these come from
 * Tyler and still want a final confirm — total stop count is TBD (18 shown
 * provisionally), attendance intentionally omitted.
 */
const STATS = [
  { n: "18", label: "Tour Stops", note: "Each worth 1,000+ ranking points" },
  { n: "$30M+", label: "Prize Money", note: "Across the season" },
  { n: "12", label: "Countries", note: "A growing international footprint" },
];

const LINKS = [
  { label: "The Pro Tour", href: "/about/pro-tour", blurb: "The full tour calendar, the tier system, and how a season runs." },
  { label: "How It Works", href: "/about/how-it-works", blurb: "Ranking points, brackets, divisions, and the path to Nationals." },
  { label: "Tournament History", href: "/about/history", blurb: "National Champions year-by-year and the tour's milestones." },
  { label: "What is Pickleball?", href: "/about/what-is-pickleball", blurb: "The fastest-growing sport in America, explained in 90 seconds." },
  { label: "Sponsors", href: "/about/sponsors", blurb: "Title partner, official partners, and the brands powering the tour." },
  { label: "Player Handbook", href: "/about/player-handbook", blurb: "Rules, format, code of conduct, and equipment." },
  { label: "Ambassadors", href: "/about/ambassadors", blurb: "The community program — creators, club owners, coaches." },
  { label: "International Ambassadors", href: "/about/international-ambassadors", blurb: "The growing global PPA Tour Ambassador network." },
  { label: "Host a Tournament", href: "/about/host-tournament", blurb: "For venues and cities — bid for a tour stop." },
  { label: "Private Events", href: "/about/private-events", blurb: "For brands — pro-ams, hospitality suites, and activations." },
  { label: "Careers", href: "/about/careers", blurb: "Help build the pro tour of pickleball." },
  { label: "Contact", href: "/about/contact", blurb: "The right email for every kind of inquiry." },
  { label: "Integrity Reporting", href: "/about/integrity", blurb: "Confidential channel for match-conduct and integrity concerns." },
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
            The Pro Tour of America&apos;s Fastest-Growing Sport
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            The Carvana PPA Tour is the professional pickleball circuit — 18
            tour stops per year, the best players in the world, sold-out venues,
            and the greatest community in sports. The Carvana PPA Tour engages
            and amplifies fans, partners and pickleball communities worldwide by
            showcasing the best pickleball players competing for the sport&apos;s
            largest purses and crucial World Pickleball Ranking points.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-ppa-navy-deep text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 px-4 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`px-3 py-7 ${i > 0 ? "border-t border-white/10 sm:border-l sm:border-t-0" : ""}`}
            >
              <p className="font-display text-3xl leading-none text-ppa-yellow sm:text-4xl">
                {s.n}
              </p>
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                {s.label}
              </p>
              <p className="mt-1 text-[11px] text-white/45">{s.note}</p>
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
                  fifth year running. The Carvana PPA Tour was built to meet
                  that growth with a professional tour that looks, feels, and
                  runs like the major sports: a real season, a real ranking,
                  marquee venues, national TV windows, and a unified place to
                  follow every match.
                </p>
                <p>
                  18 tour stops cover every region of the country, plus a
                  growing international footprint. Each tournament carries 1,000+
                  ranking points; the majors pay double. The season begins in
                  August with the Veolia Pickleball National Championships and
                  ends in May with the PPA Finals, where all season
                  championships are decided.
                </p>
                <p>
                  Off the court, the Carvana PPA Tour is a part of Pickleball
                  Inc., the largest singularly-operated pickleball ecosystem in
                  existence, integrating professional and amateur pickleball
                  with leading technology, retail, and infrastructure platforms.
                  In addition to the Carvana PPA Tour, Pickleball Inc. owns and
                  operates Major League Pickleball (MLP presented by DoorDash)
                  plus other business verticals including Pickleball Central,
                  Pickleball Play Solutions, Just Courts, Pickleball.com, and
                  PickleballTV.
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
