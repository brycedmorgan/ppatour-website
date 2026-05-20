import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { withUtm } from "@/lib/utm";

export const metadata: Metadata = { title: "Play" };

const REGISTER_URL = "https://www.pickleballtournaments.com/";

const STEPS = [
  {
    n: "01",
    title: "Pick a Stop",
    body: "Browse the 25-event main-tour schedule and pick an event near you (or far from you — we don't judge).",
  },
  {
    n: "02",
    title: "Register",
    body: "Registration runs on pickleballtournaments.com. Pick your division, your skill level, your partner.",
  },
  {
    n: "03",
    title: "Show Up & Play",
    body: "On-site check-in, brackets, and Sunday finals. Climb the amateur ranking with every stop you enter.",
  },
];

const CATEGORIES = [
  {
    label: "Junior PPA",
    href: "/tour/junior",
    blurb: "The amateur circuit for the next generation, 18 and under.",
  },
  {
    label: "Senior Open",
    href: "/tour/senior",
    blurb: "Brackets and championships for 50+ players.",
  },
  {
    label: "State Championships",
    href: "/tour/state-championships",
    blurb: "Your state's biggest amateur stage — qualifiers and finals.",
  },
  {
    label: "PPA Camps",
    href: "/tour/camps",
    blurb: "Multi-day camps with pros, coaches, and on-court instruction.",
  },
  {
    label: "Travel",
    href: "/tour/travel",
    blurb: "Hotel partners and travel rates for every main-tour stop.",
  },
  {
    label: "Hospitality",
    href: "/tour/hospitality",
    blurb: "Premium seating, suites, and player experiences at every event.",
  },
];

export default function PlayPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              For Players
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            Compete on the PPA Tour
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
            Amateur brackets run at every main-tour stop — Junior, Open,
            Senior, and Pro-Am. Register, show up, climb the rankings.
          </p>
          <div className="mt-5">
            <a
              href={withUtm(REGISTER_URL, {
                campaign: "play-page",
                content: "play-page-hero-register",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
            >
              Register to Play ↗
            </a>
          </div>
        </div>
      </section>

      {/* Three steps */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              How It Works
            </p>
          </div>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Three Steps Into the Tour
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="flex flex-col border border-ppa-line bg-ppa-paper p-5"
              >
                <span className="font-display text-3xl leading-none text-ppa-blue">
                  {s.n}
                </span>
                <h3 className="mt-3 font-display text-lg uppercase leading-[1.1] text-ppa-navy">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ppa-navy/60">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured action image + categories */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="relative isolate aspect-[4/5] overflow-hidden bg-ppa-navy">
              <Image
                src="/ppa/action-singles.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover grayscale-[15%]"
              />
              <div className="absolute inset-0 scrim-soft" />
              <div className="relative flex h-full flex-col justify-end p-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-yellow">
                  Where to Play
                </p>
                <p className="mt-1 font-display text-2xl uppercase leading-[1.02] sm:text-3xl">
                  Every Stop Has Amateur Brackets
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 bg-ppa-blue" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                  Categories
                </p>
              </div>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                Find Your Bracket
              </h2>
              <div className="mt-5 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.label}
                    href={c.href}
                    className="group flex flex-col gap-1 bg-white p-4 transition-colors hover:bg-ppa-paper"
                  >
                    <span className="font-display text-base uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                      {c.label}
                    </span>
                    <span className="text-xs text-ppa-navy/55">{c.blurb}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 bg-ppa-blue" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
                  Ready
                </p>
              </div>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
                Register for the Next Stop
              </h2>
              <p className="mt-2 max-w-xl text-sm text-white/65">
                Amateur registration runs on pickleballtournaments.com —
                division, level, partner, paid in minutes.
              </p>
            </div>
            <a
              href={withUtm(REGISTER_URL, {
                campaign: "play-page",
                content: "play-page-cta-register",
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center bg-ppa-blue px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
            >
              Register to Play ↗
            </a>
          </div>
        </div>
      </section>

      {/* Email */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="amateur" />
        </div>
      </section>
    </>
  );
}
