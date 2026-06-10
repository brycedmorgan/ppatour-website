import type { Metadata } from "next";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { PickleballIn90 } from "@/components/home/PickleballIn90";

export const metadata: Metadata = { title: "What is Pickleball?" };

const BASICS = [
  {
    q: "What is it?",
    a: "Pickleball is a paddle sport played on a small court with a plastic ball and a low net. Think tennis × table tennis × badminton.",
  },
  {
    q: "Where do you play?",
    a: "A 20 × 44 ft court — a quarter the size of a tennis court. Indoors or outdoors, singles or doubles.",
  },
  {
    q: "How does scoring work?",
    a: "Games to 11, win by 2. Only the serving side can score. Pro matches are best-of-three or best-of-five.",
  },
  {
    q: "Why is it everywhere?",
    a: "Low barrier, fast learning curve, social game. America's fastest-growing sport for five straight years.",
  },
];

const RULES = [
  "Serve underhand and diagonally; the ball must clear the no-volley zone.",
  "Both teams must let the first return after serve bounce (the two-bounce rule).",
  "The 7-ft no-volley zone (\"the kitchen\") at each end of the net — no volleys allowed in it.",
  "Points only score on your own serve; lose the rally, lose the serve.",
  "Pro matches: games to 11, win by 2, best-of-three (or best-of-five for finals).",
];

const GROWTH = [
  { n: "5x", label: "Years as America's fastest-growing sport" },
  { n: "36M+", label: "U.S. players (latest SFIA report)" },
  { n: "25", label: "PPA Tour main-tour stops a year" },
  { n: "150K+", label: "PPA Tour in-arena fans annually" },
];

export default function WhatIsPickleballPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              New Here
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            What is Pickleball?
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55">
            The fastest-growing sport in America, explained in two minutes —
            then everything you need to start watching the pro game.
          </p>
        </div>
      </section>

      {/* Pickleball in 90 seconds — swipeable explainer */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Pickleball in 90 Seconds
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Swipe Through the Whole Sport
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ppa-navy/55">
            Seven cards — the court, the net, the rules, scoring. Enough to
            follow any match on TV by the time you finish.
          </p>
          <div className="mt-6">
            <PickleballIn90 />
          </div>
        </div>
      </section>

      {/* Basics — Q&A */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            The Basics
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Four Questions, Four Answers
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BASICS.map((b, i) => (
              <div
                key={b.q}
                className="flex flex-col border border-ppa-line bg-ppa-paper p-5"
              >
                <span className="font-display text-2xl leading-none text-ppa-blue">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-base uppercase leading-[1.1] text-ppa-navy">
                  {b.q}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ppa-navy/60">
                  {b.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick rules */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Rules in 60 Seconds
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            What You Need to Know to Follow a Match
          </h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {RULES.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-3 border border-ppa-line bg-white p-4"
              >
                <span className="font-display text-xl leading-none text-ppa-blue">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-relaxed text-ppa-navy/75">
                  {r}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Growth stats */}
      <section className="bg-ppa-navy-deep text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 px-4 md:grid-cols-4">
          {GROWTH.map((s, i) => (
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

      {/* Where to go next */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Next Step
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            Watch a Match. Pick a Player.
          </h2>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/watch"
              className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
            >
              ▶ Watch Live
            </Link>
            <Link
              href="/athletes"
              className="inline-flex h-11 items-center border border-ppa-line bg-white px-6 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
            >
              Meet the Pros
            </Link>
            <Link
              href="/play"
              className="inline-flex h-11 items-center border border-ppa-line bg-white px-6 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
            >
              Play in a Tournament
            </Link>
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
