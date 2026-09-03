import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, FlaskConical } from "lucide-react";
import { LabSearch } from "@/components/paddle-lab/LabSearch";
import { PaddleCard } from "@/components/paddle-lab/PaddleCard";
import { ProsByBrand } from "@/components/paddle-lab/ProsByBrand";
import {
  browseHref,
  brandList,
  DATA_SOURCE,
  LAB_PATH,
  METRICS,
  paddleCount,
  paddles,
  reviewedCount,
  summarize,
  trendingPaddles,
  withSkill,
} from "@/lib/paddle-lab";
import { withUtm } from "@/lib/utm";

export const metadata: Metadata = {
  title: "Paddle Lab — Find the Right Pickleball Paddle With Real Test Data",
  description:
    "Search, filter and compare hundreds of pickleball paddles on measured power, pop, spin, swing weight and twist weight. Professional test data, plain-English explanations, and a direct line to buy.",
};

/** Pickleball Central's own quiz, for the reader who wants to be asked questions instead of reading charts. */
const PBC_FINDER = withUtm("https://pickleballcentral.com/paddles/paddle-finder/", {
  campaign: "paddle-lab",
  content: "paddle-finder-quiz",
});

function Tile({
  href,
  eyebrow,
  title,
  body,
  count,
}: {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  count: number | null;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex h-full flex-col border border-ppa-line bg-white p-5 transition-colors hover:border-ppa-blue"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ppa-navy/45">{eyebrow}</p>
        <h3 className="mt-2 font-display text-lg uppercase leading-tight text-ppa-navy group-hover:text-ppa-blue">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ppa-navy/60">{body}</p>
        <p className="mt-auto flex items-center gap-1.5 pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
          {count != null ? `${count} paddles` : "Open"} <ArrowRight className="h-3.5 w-3.5" />
        </p>
      </Link>
    </li>
  );
}

export default function PaddleLabPage() {
  const trending = trendingPaddles(10);
  const beginner = withSkill("beginner").length;
  const balanced = paddles.filter((p) => p.metrics.tilt === "balanced").length;
  const measured = METRICS.filter((m) => m.group !== "physical").length;

  return (
    <>
      {/* Hero + search.
          ⚠ THE PHOTO IS NOT DECORATION AND IT IS NOT AN ATHLETE PORTRAIT. It is the
          moment of contact — the ball on the face of the paddle — which is the one
          thing this whole section measures. Nobody is named here and no paddle is
          credited: naming a player off a frame is how the wrong athlete ends up on a
          page, and crediting a brand on the hero of a lab whose own method page says
          "nobody pays to be here" would undercut the claim. See .scrim-hero-lab in
          globals.css for why this hero needs its own scrim. */}
      <section className="relative isolate overflow-hidden bg-ppa-navy text-white">
        <Image
          src="/ppa/action-champ-sunday.jpg"
          alt=""
          fill
          priority
          quality={65}
          sizes="100vw"
          className="animate-kenburns object-cover object-[50%_38%] will-change-transform"
        />
        <div aria-hidden className="scrim-hero-lab absolute inset-0" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-sky" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">PPA Tour Paddle Lab</p>
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-4xl uppercase leading-[0.98] sm:text-5xl lg:text-6xl">
            Use professional data to find the perfect paddle
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">
            {paddleCount} paddles from {brandList.length} brands, measured the same way. Power, pop, spin,
            swing weight, twist weight and more, with the acronyms explained. Then buy the one you picked.
          </p>

          <div className="mt-8">
            <LabSearch
              items={paddles.map((p) => ({
                slug: p.slug,
                name: p.name,
                brand: p.brand,
                href: p.href,
                sub: [p.thicknessMm ? `${p.thicknessMm} mm` : null, p.shape].filter(Boolean).join(" · "),
              }))}
              brands={brandList}
            />
          </div>

          <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/15 pt-6">
            {[
              [paddleCount, "paddles tested"],
              [brandList.length, "brands"],
              [measured, "measured metrics"],
            ].map(([n, label]) => (
              <div key={label}>
                <dd className="font-display text-3xl tabular-nums text-white">{n}</dd>
                <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Featured sections */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile
              href={browseHref()}
              eyebrow="Everything"
              title="Browse All Paddles"
              body="Filter by brand, price, shape, play style, spin, thickness and weight."
              count={paddleCount}
            />
            <Tile
              href={browseHref({ skill: "beginner" })}
              eyebrow="Editors' picks"
              title="Best Beginner Paddles"
              body={
                beginner
                  ? "Forgiving, controllable and priced to start with. Chosen by our editors."
                  : "Our editors are picking these now. Until then, filter for balanced play style and a lighter swing weight."
              }
              count={beginner || null}
            />
            <Tile
              href={browseHref({ tilt: "balanced" })}
              eyebrow="Play style"
              title="Best All-Around Paddles"
              body="Paddles John Kew's tilt test puts in the balanced band: neither power- nor pop-leaning."
              count={balanced}
            />
            <Tile
              href={browseHref({ sort: "newest" })}
              eyebrow={reviewedCount ? "Fresh" : "Just in"}
              title={reviewedCount ? "New Paddle Reviews" : "Newly Tested"}
              body={
                reviewedCount
                  ? "The latest paddles our editors have played and written up."
                  : "The most recent additions to the database, newest first."
              }
              count={null}
            />
          </ul>
        </div>
      </section>

      {/* Trending / newly tested rail */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 bg-ppa-blue" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                  {trending.curated ? "Trending" : "Newly tested"}
                </p>
              </div>
              <h2 className="mt-2 font-display text-2xl uppercase leading-tight sm:text-3xl">
                {trending.curated ? "What people are looking at" : "Latest into the lab"}
              </h2>
            </div>
            <Link
              href={browseHref({ sort: "newest" })}
              className="hidden items-center gap-1.5 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue sm:inline-flex"
            >
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
            {trending.list.map((p) => (
              <li key={p.slug} className="w-[68vw] shrink-0 snap-start sm:w-64">
                <ul className="h-full">
                  <PaddleCard p={summarize(p)} />
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ProsByBrand />

      {/* How we test + PBC quiz */}
      <section className="bg-ppa-paper">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 lg:grid-cols-2">
          <div className="border border-ppa-line bg-white p-6 sm:p-8">
            <FlaskConical className="h-6 w-6 text-ppa-blue" />
            <h2 className="mt-3 font-display text-2xl uppercase leading-tight">How we test</h2>
            <p className="mt-3 text-sm leading-relaxed text-ppa-navy/65">
              Every number in the lab is a measurement from {DATA_SOURCE.name}&apos;s independent paddle
              database, copied through unchanged. Our editors add the words: what the metric means, how
              the paddle plays, and who it suits. Nobody pays to be here, and no score is ever edited.
            </p>
            <Link
              href={`${LAB_PATH}/how-we-test`}
              className="mt-5 inline-flex items-center gap-2 bg-ppa-navy px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-navy-deep"
            >
              Read the method <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="border border-ppa-line bg-white p-6 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/45">Prefer to be asked?</p>
            <h2 className="mt-3 font-display text-2xl uppercase leading-tight">Take the paddle finder quiz</h2>
            <p className="mt-3 text-sm leading-relaxed text-ppa-navy/65">
              Pickleball Central&apos;s quiz asks about your game and hands you a shortlist. Bring the
              names back here to see how they measured.
            </p>
            <a
              href={PBC_FINDER}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 border border-ppa-navy px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:bg-ppa-paper"
            >
              Open the quiz <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
