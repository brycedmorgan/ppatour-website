import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { breadcrumbJsonLd } from "@/lib/breadcrumbs";
import {
  brandList,
  browseHref,
  CERT_LABEL,
  DATA_SOURCE,
  LAB_PATH,
  METRICS,
  paddleCount,
  TILT_LABEL,
  type MetricGroup,
} from "@/lib/paddle-lab";

export const metadata: Metadata = {
  title: "How We Test",
  description:
    "Where the Paddle Lab's numbers come from, what each metric means, how our editors review paddles, and what we will never do with the data.",
};

const GROUPS: { key: MetricGroup; title: string; lead: string }[] = [
  {
    key: "performance",
    title: "Performance",
    lead: "What the paddle does to the ball.",
  },
  {
    key: "handling",
    title: "Handling",
    lead: "How the paddle feels in your hand and through the swing.",
  },
  {
    key: "physical",
    title: "Physical specs",
    lead: "The tape-measure and scale numbers.",
  },
];

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 font-display text-2xl uppercase leading-tight first:mt-0 sm:text-3xl">{children}</h2>;
}

export default function HowWeTestPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Paddle Lab", path: `${LAB_PATH}/` },
              { name: "How We Test", path: `${LAB_PATH}/how-we-test/` },
            ]),
          ),
        }}
      />

      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Paddle Lab</p>
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-3xl uppercase leading-[1.02] sm:text-4xl lg:text-5xl">
            How we test
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ppa-navy/65">
            The Paddle Lab has one job: put real measurements in front of you, explain them in plain
            English, and stay out of the way. Here is where the numbers come from and what we do with
            them.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <H2>What the Paddle Lab is</H2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-ppa-navy/80">
            <p>
              The Paddle Lab is a research tool from the PPA Tour and Major League Pickleball. Both are
              properties of Pickleball Inc, as is Pickleball Central, the retailer the shop buttons on
              this site link to. We say that up front because it matters: the store and the lab share a
              parent, and the lab&apos;s job is to be useful anyway.
            </p>
            <p>
              Nothing in the data changes because of who sells a paddle. A brand cannot pay to be
              included, to be excluded, or to move. A paddle that measures poorly says so.
            </p>
          </div>

          <H2 >Where the data comes from</H2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-ppa-navy/80">
            <p>
              Every measurement in the lab comes from the{" "}
              <a href={DATA_SOURCE.url} target="_blank" rel="noopener noreferrer" className="font-bold text-ppa-blue hover:underline">
                {DATA_SOURCE.name} paddle database
              </a>
              , an independent testing program that has measured {paddleCount} paddles from{" "}
              {brandList.length} brands on the same rigs, the same way. Swing weight, twist weight and
              balance point come from a physical pendulum and balance test. Spin is measured in RPM on a
              controlled strike. Power and pop are ball speeds off a full swing and a punch volley.
            </p>
            <p>
              We copy those numbers through exactly as published. We do not average them with other
              sources, re-scale them, or fill gaps with estimates. When a paddle has not been through a
              given test, the page says &ldquo;Not measured&rdquo; rather than showing a guess. That is
              why power and pop appear on some paddles and not others: the ball-speed test is newer than
              the handling tests, and it has not caught up with the whole database yet.
            </p>
            <p>
              The 0–100 bars are John Kew&apos;s scaled scores: where a paddle sits relative to every
              other paddle he has measured. A 50 is the middle of the pack, not a grade.
            </p>
          </div>

          <H2>Our editorial review</H2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-ppa-navy/80">
            <p>
              The numbers say what a paddle does. Our editors say what that feels like. Reviews on paddle
              pages are written by the Pickleball Inc editorial team after playing with the paddle, and
              they cover the things a rig cannot: how it feels off-center, how the grip wears, who it
              suits. Where a review names a skill level, that is an editor&apos;s judgement, labelled as
              such, and it is the only place opinion enters the lab.
            </p>
            <p>
              Editors never edit a measurement. If a number looks wrong to us we raise it with the tester
              and show the published figure until it changes at the source.
            </p>
          </div>

          <H2>Play style and spin categories</H2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-ppa-navy/80">
            <p>
              <strong>Play style</strong> is John Kew&apos;s tilt band: whether a paddle&apos;s ball speed
              leans toward the full swing ({TILT_LABEL.power}), toward the punch volley ({TILT_LABEL.pop}),
              or sits between ({TILT_LABEL.balanced}). It is only shown for paddles that have been
              through the ball-speed test.
            </p>
            <p>
              <strong>Spin category</strong> (Elite, Good, Fair, Poor) is the spin RPM in bands. It is the
              same measurement, just easier to filter on.
            </p>
          </div>

          <H2>Certification</H2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-ppa-navy/80">
            <p>
              A paddle needs approval to be legal in sanctioned play. USA Pickleball (USAP) certifies for
              its events; the UPA-A certifies for the PPA Tour and Major League Pickleball. Many paddles
              hold both. We show the status as recorded in the database, in the tester&apos;s words, and
              fold it into one of these for filtering:
            </p>
            <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
              {Object.entries(CERT_LABEL).map(([k, v]) => (
                <li key={k} className="border border-ppa-line bg-ppa-paper px-3 py-2">{v}</li>
              ))}
            </ul>
            <p className="text-sm text-ppa-navy/60">
              Certification changes. Check the governing body&apos;s current list before a tournament.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Glossary</p>
          </div>
          <H2>Testing categories</H2>
          <p className="mt-3 text-sm text-ppa-navy/60">
            Every metric on a paddle page, and what it means. The same text sits behind the info glyph
            next to each one.
          </p>

          {GROUPS.map((g) => (
            <div key={g.key} className="mt-10">
              <h3 className="font-display text-lg uppercase leading-tight">{g.title}</h3>
              <p className="mt-1 text-sm text-ppa-navy/55">{g.lead}</p>
              <dl className="mt-4 divide-y divide-ppa-line border border-ppa-line bg-white">
                {METRICS.filter((m) => m.group === g.key).map((m) => (
                  <div key={m.key} id={m.key} className="p-5">
                    <dt className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-display text-base uppercase text-ppa-navy">{m.label}</span>
                      {m.unit && m.unit !== "/100" && (
                        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">{m.unit}</span>
                      )}
                      {m.unit === "/100" && (
                        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">0–100 index</span>
                      )}
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-ppa-navy/75">{m.explain}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <H2>What we will not do</H2>
          <ul className="mt-4 space-y-3 text-base leading-relaxed text-ppa-navy/80">
            <li>Sell placement. There is no sponsored slot in the lab, and there will not be one.</li>
            <li>Invent a score. If a number is not a measurement or a labelled editor&apos;s opinion, it is not on the page.</li>
            <li>Hide a bad result because of who makes the paddle or who sells it.</li>
            <li>Change a measurement. Corrections happen at the source and flow through.</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={browseHref()}
              className="inline-flex items-center gap-2 bg-ppa-blue px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
            >
              Browse the paddles <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`${LAB_PATH}/compare`}
              className="inline-flex items-center gap-2 border border-ppa-navy px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:bg-ppa-paper"
            >
              Compare paddles
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
