import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SeniorRankings } from "@/components/marketing/SeniorRankings";
import { partners } from "@/lib/home-content";
import { partnerLink } from "@/lib/partner-link";
import { getSeniorRankings } from "@/lib/senior-rankings";
import { withUtm } from "@/lib/utm";

/**
 * Humana Senior Open.
 *
 * ⚠ Ported to match ppatour.com/senior-open/ (Wesley, 8/4). A SPECIFIC route, so
 * it wins over the /tour/[slug] catch-all — same pattern as /tour/junior. The
 * `senior` entry stays in lib/tour-programs.ts because nav, site search, the
 * sitemap and the other programs' cross-links all read that list, and `senior`
 * is now in that route's HAS_OWN_ROUTE set so it doesn't prerender a dead copy.
 *
 * ⚠ THE PAGE IT REPLACED WAS INVENTED, NOT JUST THIN. The tour-programs entry
 * claimed age brackets "50+, 55+, 60+, 65+, 70+, 75+" and skill brackets
 * "3.5, 4.0, 4.5, 5.0", and it sent the season-ender to a "Senior Nationals ...
 * at the Pickleball World Championships in Dallas". The live page states none of
 * that: it says 50 and older, singles/doubles/mixed, and names no bracket list
 * and no season-ending event at all. It also does not call the circuit the
 * "Senior Open" — the program is the **Humana Senior Open**, which is the whole
 * reason it has a sponsor section. Don't reintroduce any of the old numbers.
 *
 * ⚠ ONE DELIBERATE DEPARTURE FROM THE LIVE COPY: it describes the points tiers
 * as "(Slam, Cup, Open)". Slam was retired in favour of Major on 7/23 and that
 * is a standing ruling, so this reads "(Major, Cup, Open)". Every number is the
 * live page's, unchanged. The table itself is labelled by points (PPA 2000 /
 * 1500 / 1000), which is what the live page does and is tier-name-neutral.
 *
 * ⚠ THE RANKINGS BOARD IS LIVE, off `bracket_level_id=3` on the same
 * partner_rankings endpoint the pro boards use (Wesley supplied the parameters,
 * 8/4). All six senior divisions, ~540 ranked players, refreshed daily by the
 * existing athletes cron. Read the header of lib/senior-rankings.ts before
 * touching it — the two "division" params mean different things, `age_limit`
 * must be EMPTY, and the 50-and-over floor is NOT enforced upstream.
 *
 * ⚠ Only "The Rank" (the 52-week rolling ranking) is shipped. The live page also
 * has a "The Race" tab, which is the same six calls with `race=true` — one
 * constant in the adapter, but it doubles the boards on the page and needs a
 * layout decision, so it is deliberately left off rather than half-built.
 */

/** PPA-sanctioned event search — where a senior actually registers. */
const REGISTER = withUtm(
  "https://www.pickleballtournaments.com/search?partner=sanction_ppa",
  { campaign: "senior-open", content: "register" },
);

/**
 * Points per finish by tournament tier. Verbatim from the live page's "How Are
 * Humana Senior Points Structured?" table.
 */
const FINISHES = [
  "1st Place",
  "2nd Place",
  "3rd Place",
  "4th Place",
  "Quarterfinalist",
  "Round of 16",
  "Round of 32",
];

const POINTS: { tier: string; points: number[] }[] = [
  { tier: "PPA 2000", points: [2000, 1600, 1200, 800, 400, 200, 100] },
  { tier: "PPA 1500", points: [1500, 1200, 900, 600, 300, 150, 75] },
  { tier: "PPA 1000", points: [1000, 800, 600, 400, 200, 100, 50] },
];

const REGISTER_STEPS = [
  {
    step: "Step 1",
    title: "Select your tournament",
    body: 'Go to pickleballtournaments.com, select "Find a Tournament," and click "National Tours" to pick the PPA tournaments you would like to play.',
  },
  {
    step: "Step 2",
    title: "Pick your events",
    body: 'Click "Register Now" and select your events on the registration site. Humana Senior Open competition includes singles, doubles and mixed doubles events.',
  },
  {
    step: "Step 3",
    title: "Check out",
    body: "Read and agree to the terms of service after completing the registration process, then confirm payment and submit to secure your spot in the draw.",
  },
];

/** The prize split, as the live page states it. */
const SPLIT = [
  { place: "1st", share: "55%" },
  { place: "2nd", share: "30%" },
  { place: "3rd", share: "15%" },
];

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "rankings", label: "Rankings" },
  { id: "register", label: "How to Register" },
  { id: "points", label: "Senior Points" },
  { id: "prize-money", label: "Prize Money" },
  { id: "sponsors", label: "Sponsors" },
];

/** Sponsor blurbs are the live page's own copy, one per partner. */
const SPONSOR_COPY: Record<string, string> = {
  Humana:
    "At Humana, our cultural foundation is aligned to helping members achieve their best health by delivering personalized, simplified, whole-person healthcare experiences. Recognizing healthcare needs continue to evolve for each person, for each family and for each community, Humana continuously creates innovative solutions and resources that help people live their healthiest lives on their terms — when and where they need it.",
  "Zimmer Biomet":
    "At Zimmer Biomet our mission is to alleviate pain and improve the quality of life for people around the world. Zimmer Biomet, a global leader in joint health, provides high quality products and cutting-edge technology with proven results. We are dedicated to transforming the patient experience through innovative products designed to help restore mobility and health.",
};

export const metadata: Metadata = {
  title: "Humana Senior Open",
  description:
    "The Humana Senior Open — amateur pickleball competition for players 50 and older at Carvana PPA Tour stops. Singles, doubles and mixed doubles, senior points by tier, prize money, and how to register.",
};

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 bg-ppa-blue" />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
          {eyebrow}
        </p>
      </div>
      <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
        {title}
      </h2>
    </>
  );
}

/**
 * ISR daily. The senior boards are recomputed on the tour's side well under
 * that, and the fetches behind them are tagged so the existing athletes cron
 * refreshes them on the same schedule as every other ranking on the site.
 *
 * ⚠ `force-static` IS LOAD-BEARING, NOT BELT-AND-BRACES. Adding the rankings
 * fetch flipped this route from ○ to ƒ in the build output. Same cause as
 * / and /rankings on 8/3: `lib/pb-fetch` retries a 429 with `cache: "no-store"`,
 * and one no-store fetch opts the whole route out of static generation — so
 * whether this page is CDN-cacheable came down to whether partner_rankings
 * happened to throttle us mid-build. It throttles readily; a plain loop over
 * these six boards 429s today. Nothing here reads cookies, headers or
 * searchParams, so nothing is lost by pinning it.
 */
export const revalidate = 86400;
export const dynamic = "force-static";

export default async function SeniorOpenPage() {
  const rankings = await getSeniorRankings();

  // Read the sponsors off the live roster rather than typing their names and
  // marks here: the roster already carries the artwork, the outbound URL and the
  // designation, and it is resynced when designations renew or lapse.
  const sponsors = partners.filter((p) => SPONSOR_COPY[p.name]);

  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section className="relative isolate overflow-hidden bg-ppa-navy text-white">
        <Image
          src="/ppa/action-md-final.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-25 will-change-transform"
        />
        <div className="absolute inset-0 scrim-hero" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              For Players 50 &amp; Over
            </p>
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-3xl uppercase leading-[1.02] sm:text-5xl">
            Humana Senior Open
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            The Humana Senior Open events bring together the best players aged 50
            and older, showcasing their skills and passion for the game. These
            competitions are held as part of the Carvana PPA Tour, adding an extra
            layer of action and camaraderie to the tour stops.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={REGISTER}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-transform hover:bg-ppa-blue-deep active:scale-[0.98]"
            >
              Register to Play ↗
            </a>
            <Link
              href="/events"
              className="inline-flex h-11 items-center border border-white/25 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-white"
            >
              See the Schedule
            </Link>
          </div>
        </div>
      </section>

      {/* Jump links */}
      <section className="border-b border-ppa-line bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-4">
          <nav aria-label="On this page" className="flex min-w-0 flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="border border-ppa-line bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* --------------------------------------------------------- About */}
      <section id="about" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead
            eyebrow="About"
            title="What Is the Humana Senior Open?"
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="min-w-0 border-l-2 border-ppa-blue bg-white p-6">
              <p className="text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                The Humana Senior Open is the Carvana PPA Tour&apos;s dedicated
                competition for players 50 and older. Brackets run at tour stops
                across the season, on the same grounds and in the same week as the
                pros, in singles, doubles and mixed doubles.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                Finishes earn Humana Senior Open points, which scale with the tier
                of the tournament, and every division pays prize money out of its
                own entry pool.
              </p>
            </div>
            <ul className="grid gap-px border border-ppa-line bg-ppa-line">
              {[
                { label: "Who", value: "Players 50 and older" },
                { label: "Events", value: "Singles, doubles, mixed doubles" },
                { label: "Where", value: "Carvana PPA Tour stops" },
                { label: "Prize money", value: "Paid in every division" },
              ].map((row) => (
                <li key={row.label} className="min-w-0 bg-white p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                    {row.label}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-ppa-navy">
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* -------------------------------------------------------- Rankings */}
      <section id="rankings" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Standings" title="Humana Senior Open Rankings" />
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55">
            The 52-week rolling ranking for players 50 and over, by division.
            Points come from Humana Senior Open finishes at Carvana PPA Tour
            stops.
          </p>
          {rankings.source === "live" ? (
            <SeniorRankings boards={rankings.boards} />
          ) : (
            /* Configured but the call failed, or no token. Say so — never print
               invented rows on a rankings surface (7/29). */
            <p className="mt-6 border border-ppa-line bg-ppa-paper px-4 py-10 text-center text-sm text-ppa-navy/55">
              Senior rankings are unavailable right now. Please check back
              shortly.
            </p>
          )}
        </div>
      </section>

      {/* --------------------------------------------------- How to register */}
      <section id="register" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Entry" title="How to Register" />
          <ol className="mt-6 grid gap-px border border-ppa-line bg-ppa-line lg:grid-cols-3">
            {REGISTER_STEPS.map((s) => (
              <li key={s.step} className="min-w-0 bg-white p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-blue">
                  {s.step}
                </p>
                <h3 className="mt-1.5 font-display text-base uppercase leading-tight text-ppa-navy">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
          <a
            href={REGISTER}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-transform hover:bg-ppa-blue-deep active:scale-[0.98]"
          >
            Register to Play ↗
          </a>
        </div>
      </section>

      {/* ------------------------------------------------- Senior points */}
      <section id="points" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead
            eyebrow="Humana Senior Points"
            title="How Senior Points Are Structured"
          />
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/60">
            Points are awarded for each division and scale with the tier of the
            tournament (Major, Cup, Open).
          </p>
          {/* Own scroll container so the page body never scrolls sideways. */}
          <div className="mt-6 overflow-x-auto border border-ppa-line">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-white text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                  <th className="border-b border-ppa-line px-4 py-2.5">Tier</th>
                  {FINISHES.map((f) => (
                    <th key={f} className="border-b border-ppa-line px-4 py-2.5">
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {POINTS.map((row) => (
                  <tr key={row.tier} className="bg-white text-sm">
                    <td className="whitespace-nowrap border-b border-ppa-line bg-ppa-paper px-4 py-3 font-display text-sm uppercase text-ppa-blue">
                      {row.tier}
                    </td>
                    {row.points.map((p, i) => (
                      <td
                        key={FINISHES[i]}
                        className="border-b border-ppa-line px-4 py-3 font-semibold text-ppa-navy"
                      >
                        {p.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- Prize money */}
      <section id="prize-money" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Prize Money" title="How Payouts Are Calculated" />
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="min-w-0 border-l-2 border-ppa-blue bg-ppa-paper p-6">
              <p className="text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                Humana Senior Open players receive compensation determined by the
                number of participants in each division. The payout is calculated
                by multiplying the total number of players in a division by the
                event fee, and{" "}
                <strong className="font-semibold text-ppa-navy">52.5%</strong> of
                that sum is the division&apos;s prize money.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                The bigger the division, the bigger the purse — the pool is a
                share of what the field itself puts in.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                Division prize pool splits
              </p>
              <ul className="mt-2 grid gap-px border border-ppa-line bg-ppa-line">
                {SPLIT.map((s) => (
                  <li
                    key={s.place}
                    className="flex items-baseline justify-between gap-3 bg-white px-4 py-3.5"
                  >
                    <span className="text-sm font-semibold text-ppa-navy">
                      {s.place}
                    </span>
                    <span className="font-display text-xl leading-none text-ppa-blue">
                      {s.share}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Sponsors */}
      <section id="sponsors" className="scroll-mt-24 bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Sponsors" title="Behind the Senior Open" />
          <div className="mt-6 grid gap-px border border-ppa-line bg-ppa-line lg:grid-cols-2">
            {sponsors.map((p) => {
              const link = partnerLink(p);
              return (
                <div key={p.name} className="flex min-w-0 flex-col bg-white p-6">
                  {p.logo && (
                    <Image
                      src={p.logo}
                      alt={p.name}
                      width={p.logoWidth}
                      height={p.logoHeight}
                      sizes="200px"
                      className="h-8 w-auto max-w-[200px] object-contain object-left"
                    />
                  )}
                  {p.role && (
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                      {p.role}
                    </p>
                  )}
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ppa-navy/65">
                    {SPONSOR_COPY[p.name]}
                  </p>
                  <a
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.1em] text-ppa-blue hover:text-ppa-blue-deep"
                  >
                    Learn more {link.external ? "↗" : "→"}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------------------------------- More ways in */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <SectionHead eyebrow="Explore the Tour" title="More Ways In" />
          <div className="mt-6 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/tour/junior", label: "Junior PPA Tour" },
              { href: "/tour/state-championships", label: "State Championships" },
              { href: "/tour/camps", label: "PPA Camps" },
              { href: "/tour/hospitality", label: "Hospitality" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group bg-white p-4 transition-colors hover:bg-ppa-paper"
              >
                <span className="font-display text-base uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                  {l.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
