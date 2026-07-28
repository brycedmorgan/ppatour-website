import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tournament History",
  description:
    "Tournament history of the PPA Tour — past champions, memorable finals, and the growth of pro pickleball.",
};

type Champ = { year: number; ms: string; ws: string; md: string; wd: string; xd: string };

/** Recent National Championship winners. Update each year. */
const NATIONALS: Champ[] = [
  { year: 2025, ms: "Ben Johns", ws: "Anna Leigh Waters", md: "B. Johns / Gabe Tardio", wd: "Anna Leigh Waters / Anna Bright", xd: "Ben Johns / Anna Leigh Waters" },
  { year: 2024, ms: "Ben Johns", ws: "Anna Leigh Waters", md: "B. Johns / Collin Johns", wd: "Anna Leigh Waters / Catherine Parenteau", xd: "Ben Johns / Anna Leigh Waters" },
  { year: 2023, ms: "Ben Johns", ws: "Anna Leigh Waters", md: "B. Johns / Collin Johns", wd: "Anna Leigh Waters / Leigh Waters", xd: "Ben Johns / Anna Leigh Waters" },
  { year: 2022, ms: "Ben Johns", ws: "Anna Leigh Waters", md: "B. Johns / Matt Wright", wd: "Anna Leigh Waters / Leigh Waters", xd: "Ben Johns / Anna Leigh Waters" },
  { year: 2021, ms: "Ben Johns", ws: "Anna Leigh Waters", md: "B. Johns / Riley Newman", wd: "Anna Leigh Waters / Leigh Waters", xd: "JW Johnson / Jorja Johnson" },
];

/**
 * Tour milestones. Corrected 7/28 against Hannah's historical timeline (the doc
 * behind the Pickleball Central on-site superstore) — we had the founding year
 * and the Carvana deal wrong.
 */
const MILESTONES = [
  { year: "2019", note: "The PPA Tour is founded by Connor Pardoe." },
  { year: "2020", note: "The first PPA Tour event is held in Mesa, Arizona." },
  { year: "2021", note: "The tour signs the first exclusive pro player contracts in pickleball." },
  { year: "2022", note: "Tom Dundon unites the sport's top brands, and CBS airs live pickleball on national television for the first time." },
  { year: "2023", note: "Dallas draws 3,500 players and 50,000 spectators, the biggest pickleball event ever held. Carvana signs on as title partner." },
  { year: "2024", note: "PPA Tour and MLP merge to form the United Pickleball Association." },
  { year: "2025", note: "The tour goes global with its first international events across five continents." },
];

export default function TournamentHistoryPage() {
  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Tournament History</p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            Every Champion. Every Year.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55 sm:text-base">
            The full record of PPA Tour National Champions across every pro
            division, plus the milestones that shaped the sport.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">National Champions</p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">By Year, By Division</h2>
          <div className="mt-6 overflow-x-auto border border-ppa-line [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="bg-ppa-paper text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                  <th className="border-b border-ppa-line px-4 py-2.5">Year</th>
                  <th className="border-b border-ppa-line px-4 py-2.5">Men&apos;s Singles</th>
                  <th className="border-b border-ppa-line px-4 py-2.5">Women&apos;s Singles</th>
                  <th className="border-b border-ppa-line px-4 py-2.5">Men&apos;s Doubles</th>
                  <th className="border-b border-ppa-line px-4 py-2.5">Women&apos;s Doubles</th>
                  <th className="border-b border-ppa-line px-4 py-2.5">Mixed</th>
                </tr>
              </thead>
              <tbody>
                {NATIONALS.map((c) => (
                  <tr key={c.year} className="text-sm">
                    <td className="border-b border-ppa-line bg-ppa-paper px-4 py-3 font-display text-base text-ppa-blue">{c.year}</td>
                    <td className="border-b border-ppa-line px-4 py-3 font-semibold text-ppa-navy">{c.ms}</td>
                    <td className="border-b border-ppa-line px-4 py-3 font-semibold text-ppa-navy">{c.ws}</td>
                    <td className="border-b border-ppa-line px-4 py-3 font-semibold text-ppa-navy">{c.md}</td>
                    <td className="border-b border-ppa-line px-4 py-3 font-semibold text-ppa-navy">{c.wd}</td>
                    <td className="border-b border-ppa-line px-4 py-3 font-semibold text-ppa-navy">{c.xd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.1em] text-ppa-navy/35">
            Recent National Championships shown. Full archive — every stop, every champion — coming with the records database.
          </p>
        </div>
      </section>

      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Milestones</p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">A Brief Timeline</h2>
          <div className="mt-6 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2 lg:grid-cols-3">
            {MILESTONES.map((m) => (
              <div key={m.year} className="bg-white p-5">
                <p className="font-display text-3xl leading-none text-ppa-blue">{m.year}</p>
                <p className="mt-2 text-sm text-ppa-navy/70">{m.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Link href="/athletes" className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-ppa-blue-deep">
              Meet the Current Champions
            </Link>
            <Link href="/about/how-it-works" className="inline-flex h-11 items-center border border-ppa-line bg-white px-6 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:border-ppa-blue hover:text-ppa-blue">
              How the Race Works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
