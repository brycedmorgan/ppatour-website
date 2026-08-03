import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { partnersByTier, titlePartner } from "@/lib/home-content";
import { partnerLink } from "@/lib/partner-link";
import { SponsorInquiryForm } from "@/components/marketing/SponsorInquiryForm";

export const metadata: Metadata = {
  title: "Sponsors & Partnerships",
  description:
    "The most valuable audience in sports. PPA Tour partner roster, ways to partner, broadcast and in-arena reach, and how to start a partnership conversation.",
};

/**
 * PAGE ORDER IS SPECIFIED, not incidental (marketing, "New Sponsors Page
 * Updates", 8/4): hero → stat row → Carvana → partner roster → Ways to Partner
 * → Where You're Seen → Business & Partnership News → inquiry. Two sections
 * moved to get here — Carvana up from below the tiers, and Where You're Seen
 * down from near the top — so if a section looks out of place, check the doc
 * before shuffling it back.
 */

/**
 * The four stats, replacing the old reach row wholesale.
 *
 * ⚠ These are business claims we now publish on the page brands read, all four
 * supplied by marketing on 8/4: $120K+ average fan household income, five years
 * as America's fastest-growing sport, $10M+ sponsor media value "for several
 * tour partners", 15K+ average attendance per event. Nothing here is derived
 * from anything in this repo, so it can't be re-verified in code — the numbers
 * that left with them (4M+ matches, 1.2M+ social followers, 150K+ annual gate,
 * 500+ broadcast hours) are in git history if any of these needs sourcing.
 *
 * No third line: the doc gives a figure and a label for each, so a "note" here
 * would be invented supporting detail on a sponsorship claim.
 */
const REACH = [
  { n: "$120K+", label: "Average Fan Household Income" },
  { n: "5 Years", label: "America's Fastest-Growing Sport" },
  { n: "$10M+", label: "Sponsor Media Value for Several Tour Partners" },
  { n: "15K+", label: "Average Attendance Per Event" },
];

/**
 * Ways to Partner — the eight buys, replacing the old "Partnership Tiers"
 * ladder (Tier 01 Title → Tier 04 Official Partner). That ladder is what made
 * this page contradict itself: a four-rung sales hierarchy sat directly above
 * the Platinum/Gold/Tour roster, so the page described two different tier
 * systems at once. It's gone, and these eight are what a brand actually buys.
 *
 * Per the brief: image tile plus the category name, nothing else, for launch —
 * "each tile only needs the category name". Copy for each one is a sales claim
 * and belongs to the partnerships team.
 *
 * ⚠ IMAGERY IS APPROVED PPA PHOTOGRAPHY BUT NOT CATEGORY-SPECIFIC. Every file
 * below already ships on this site, so nothing here is unlicensed or invented.
 * But we hold no photograph of merchandise, of a licensed brand execution, or
 * of a clinic, so Retail / IP Rights / Digital are the loosest fits and read as
 * generic tour photography rather than as the thing named. Swapping in real
 * category art is a one-line change per tile.
 *
 * ⚠ CHECK A REPLACEMENT PHOTO FOR THE SIGNAGE IN IT before swapping. These are
 * courtside shots, so they carry brand marks, and this is the page that sells
 * category exclusivity — two candidates were rejected on that basis alone:
 *   - `action-waters-bright.jpg` (first pick for Digital) crops with a SELKIRK
 *     banner front and centre. Selkirk came off the roster on 8/3, so it would
 *     have given a lapsed partner prime placement on the sponsors page.
 *   - `nationals-action-2.jpg` leads with FRANKLIN apparel and a Franklin
 *     paddle. Franklin isn't a partner at all, and three brands (JOOLA, Proton,
 *     Six Zero) are each sold an "Official Paddle Partner" designation here.
 * What ships shows Carvana, Veolia, Proton and Storm — all current — plus PBTV
 * on the Broadcast tile. The Digital tile carries Storm's older "Reign Storm"
 * lockup because that's the branding that was on court when it was shot; same
 * partner, and historical marks in photography are facts (the 8/3 ruling on
 * past event names). Swap if marketing would rather show only current lockups.
 */
const WAYS_TO_PARTNER = [
  { label: "IP Rights", image: "/ppa/nationals-crowd-branded.jpg" },
  { label: "Experiential", image: "/ppa/nationals-crowd-fans.jpg" },
  { label: "Digital", image: "/ppa/action-mxd.jpg" },
  { label: "Hospitality", image: "/ppa/nationals-crowd-stadium.jpg" },
  { label: "Retail", image: "/ppa/nationals-crowd-1.jpg" },
  { label: "On-Site", image: "/ppa/sponsor-carvana-boards.jpg" },
  { label: "Broadcast", image: "/ppa/watch-broadcast-desk.jpg" },
  { label: "Pro Clinics", image: "/ppa/play-amateur-court.jpg" },
];

/**
 * Where You're Seen. TV & Streaming and In-Arena were rewritten on 8/4; Digital
 * & Owned is carried over verbatim by instruction ("leave this section
 * unchanged").
 *
 * `lead` renders as the bolded label the doc uses on the broadcast rows
 * ("CBS & FOX Windows: 1 million+ viewers on CBS in 2026"). The other two
 * columns are plain statements and carry no lead.
 *
 * ⚠ The CBS/FOX row publishes a viewership figure (1 million+ on CBS in 2026)
 * that isn't derived from anything here — supplied by marketing. Note this is a
 * NETWORK claim, distinct from the Nielsen ratings workbook parsed on 7/26,
 * which is confidential and deliberately lives outside this repo.
 */
const SURFACES: {
  label: string;
  items: { lead?: string; text: string }[];
}[] = [
  {
    label: "TV & Streaming",
    items: [
      { lead: "CBS & FOX Windows", text: "1 million+ viewers on CBS in 2026" },
      {
        lead: "Tennis Channel",
        text: "Featured rounds and Championship Sundays",
      },
      {
        lead: "PickleballTV",
        text: "Constant coverage of the sport and events on a dedicated channel featured on Prime, YouTube TV and other platforms",
      },
      { lead: "MATCHDAY App", text: "Live scores, brackets and push alerts" },
    ],
  },
  {
    label: "In-Arena & On-Court",
    items: [
      {
        text: "Title and presenting-partner court branding on every televised court",
      },
      { text: "Premium hospitality suites and courtside boxes" },
      { text: "On-court signage and concourse activations" },
      { text: "15K+ average fan attendance per event" },
    ],
  },
  {
    label: "Digital & Owned",
    items: [
      { text: "4M+ web sessions per quarter (ppatour.com)" },
      { text: "Newsletter list with weekly editorial sends" },
      { text: "Athlete partnerships and creator-driven social" },
      { text: "Year-round content programming and series" },
    ],
  },
];

/** The official PPA Tour company page — the destination for business updates. */
const LINKEDIN_URL = "https://www.linkedin.com/company/ppatour";

export default function SponsorsPage() {
  const title = titlePartner!;
  // Grouped, not a flat `tier === "official"` filter — that predicate used to
  // mean "everyone but Carvana" and would now match nobody at all.
  const groups = partnersByTier();

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
            The Most Valuable Audience in Sports
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            America&apos;s fastest-growing participation sport has become the
            premier platform for premium brands, connecting them with an
            affluent, highly engaged community of consumers with exceptional
            purchasing power.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            More than media. We build partnerships that drive customers, create
            content and grow businesses.
          </p>
          {/* One CTA. The "Request the Media Kit" mailto was removed on 8/4 —
              the inquiry form already promises the media kit as the follow-up,
              so the second button was a competing path to the same thing. */}
          <div className="mt-6">
            <a
              href="#inquire"
              className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
            >
              Partnership Inquiry →
            </a>
          </div>
        </div>
      </section>

      {/* Stat row */}
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
            </div>
          ))}
        </div>
      </section>

      {/* Title partner spotlight — moved directly under the stat row (8/4).
          Carvana stays out of the alphabetical Platinum block entirely: title
          partner is its own billing, and the whole point of the placement is
          that it reads before the roster, not inside it. */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-blue">
            Title Partner
          </p>
          {/* Forwards to the title partner's own site like every other card —
              this block was the one logo on the page still not clickable after
              the roster grid was linked up. */}
          <a
            href={partnerLink(title).href}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative isolate mt-3 block overflow-hidden border border-ppa-line bg-white transition-colors hover:border-ppa-blue"
          >
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
                  The named title partner of the tour — on every court, every
                  broadcast, all tournaments.
                </p>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* Partner roster */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Official Partners
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Category Leaders
          </h2>
          {/* One block per tier, alphabetical within each (8/4). This is the page
              brands themselves open, so the tier a partner sits in is the product
              being described — it can't be flattened into one undifferentiated
              grid here. Silver is gone as of 8/4; `partnersByTier()` supplies the
              surviving tiers and the ordering. */}
          {groups.map((g) => (
            <div key={g.key} className="mt-8">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-blue">
                {g.label}
              </h3>
              <div
                className={`mt-3 grid gap-4 sm:grid-cols-2 ${
                  g.key === "tour" ? "lg:grid-cols-4" : "lg:grid-cols-3"
                }`}
              >
                {g.items.map((p) => {
                  const { href, external } = partnerLink(p);
                  const showsRole = Boolean(p.role) && !p.hideRole;
                  // Every card forwards to the partner's own site (UTM-tagged).
                  // These were plain divs until 8/3 — the sponsors page showed
                  // 29 logos and not one of them was clickable.
                  const Card = external ? "a" : Link;
                  return (
                    <Card
                      key={p.name}
                      href={href}
                      {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="group flex flex-col overflow-hidden border border-ppa-line bg-white transition-colors hover:border-ppa-blue"
                    >
                      {/* The divider belongs to the footer, not the logo box — a
                          card with nothing to say underneath was drawing a rule
                          across itself and then dead space. */}
                      <>
                          <div
                            className={`flex h-24 items-center justify-center bg-white p-5 ${
                              showsRole ? "border-b border-ppa-line" : ""
                            }`}
                          >
                            {p.logo ? (
                              <Image
                                src={p.logo}
                                alt={p.name}
                                width={p.logoWidth!}
                                height={p.logoHeight!}
                                sizes="180px"
                                className="max-h-full w-auto max-w-[180px] object-contain"
                              />
                            ) : (
                              // No mark — the name IS the card's mark here, so it
                              // must NOT be repeated in the footer below. Three
                              // partners are in this state as of 8/4 (MOJO, The
                              // Picklr, Zyia); their art never arrived.
                              <span className="font-display text-xl uppercase text-ppa-navy">
                                {p.name}
                              </span>
                            )}
                          </div>
                          {/* Roster cards show only the logo + the
                              "Official ___ Partner" designation — no descriptive
                              copy (Tyler, sponsors reformat). Collapses entirely
                              for a logo-only partner (Bryce 7/28: the logo IS
                              the card) and for hideRole partners. */}
                          {showsRole && (
                            <div className="flex flex-1 flex-col p-5">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
                                {p.role}
                              </p>
                            </div>
                          )}
                      </>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ways to Partner */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          {/* The doc names this section "Ways to Partner", so that is the
              heading. No eyebrow + invented headline pair here: the earlier draft
              read "Ways to Partner / Eight Ways In", and the second line was mine,
              not marketing's. */}
          <h2 className="font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Ways to Partner
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {WAYS_TO_PARTNER.map((w) => (
              <div
                key={w.label}
                className="group relative isolate aspect-[4/5] overflow-hidden border border-ppa-line bg-ppa-navy"
              >
                <Image
                  src={w.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                {/* Plain-rgba scrim class, not a Tailwind gradient — same reason
                    every other image card uses one (the oklab gradients were
                    unreliable). `scrim-card` rather than `scrim-hero`: these are
                    quarter-width tiles carrying one short word at the bottom, so
                    the darkening only has to hold there and the photograph — the
                    whole point of the tile — stays visible above it. */}
                <div className="absolute inset-0 scrim-card" />
                <p className="absolute inset-x-0 bottom-0 p-4 font-display text-base uppercase leading-[1.05] text-white sm:text-lg">
                  {w.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Where You're Seen — moved below Ways to Partner (8/4) */}
      <section className="bg-white">
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
                className="flex flex-col border border-ppa-line bg-ppa-paper"
              >
                <p className="border-b border-ppa-line px-5 py-4 font-display text-base uppercase text-ppa-navy">
                  {s.label}
                </p>
                <ul className="flex flex-col gap-2 p-5">
                  {s.items.map((i) => (
                    <li
                      key={i.text}
                      className="flex items-start gap-3 text-sm text-ppa-navy/75"
                    >
                      <span className="mt-2 size-1.5 shrink-0 bg-ppa-blue" />
                      <span>
                        {i.lead && (
                          <strong className="font-bold text-ppa-navy">
                            {i.lead}:{" "}
                          </strong>
                        )}
                        {i.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business & Partnership News — replaces the old "How Partners Activate"
          case-study grid (8/4).

          ⚠ SHIPPING PHASE ONE ON PURPOSE: intro + LinkedIn button, no embedded
          feed. The brief allows a feed or up to three selected posts "only if it
          can be done without custom development" — LinkedIn has no public
          embed for a company feed (their badge renders a profile card, not
          posts; anything else needs the Marketing API with an approved app and
          an OAuth server route), so a feed here is custom development by
          definition. That makes it phase two, which the brief anticipates. */}
      <section className="bg-ppa-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          {/* Doc-specified section title, as the heading — "The Business of the
              Tour" was an invented headline and is gone. */}
          <h2 className="max-w-3xl font-display text-2xl uppercase leading-[1.02] sm:text-3xl">
            Business &amp; Partnership News
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            Company, investment, partnership, media and commercial-growth
            updates from the PPA Tour — the news brand and agency teams ask us
            for, published as it happens.
          </p>
          <div className="mt-6">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
            >
              View Business Updates on LinkedIn →
            </a>
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
                IP rights, experiential, broadcast, retail — we&apos;ll come
                back with a custom plan and the full 2026–27 media kit within
                five business days.
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
