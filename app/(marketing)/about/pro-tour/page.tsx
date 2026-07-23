import type { Metadata } from "next";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";

export const metadata: Metadata = {
  title: "The Pro Tour",
  description:
    "How the pro tour works — tiers, ranking points, prize money, and the road to the season title on the Carvana PPA Tour.",
};

const STATS = [
  { n: "18", label: "Main-Tour Stops" },
  { n: "5", label: "Pro Divisions" },
  { n: "$5.2M+", label: "Prize Money & Fees" },
  { n: "150K+", label: "Fans In-Arena" },
];

const TIERS = [
  { name: "Worlds", points: "3,000 pts", note: "The single biggest event of the season." },
  { name: "Major", points: "2,000 pts", note: "Marquee stops — Nationals, Masters, Atlanta, Finals." },
  { name: "Cup", points: "1,500 pts", note: "Premium destinations and longer broadcast windows." },
  { name: "Open", points: "1,000 pts", note: "The backbone of the tour — every city, every weekend." },
];

export default function ProTourPage() {
  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              The Pro Tour
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            The Premier Professional Pickleball Circuit
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55 sm:text-base">
            Eighteen tour stops a year, the best players in the world,
            five divisions every weekend, and one season-long points race —
            broadcast on PickleballTV, Tennis Channel, and FOX.
          </p>
        </div>
      </section>

      <section className="bg-ppa-navy-deep text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 px-4 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`px-2 py-7 ${i % 2 === 1 ? "border-l border-white/10" : ""} ${i >= 2 ? "border-t border-white/10 md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}
            >
              <p className="font-display text-3xl leading-none text-white sm:text-4xl">{s.n}</p>
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">The Season</p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                One Race. Eighteen Stops. Five Divisions.
              </h2>
              <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                <p>
                  The Carvana PPA Tour runs eighteen tour stops — Worlds, majors, cups, and opens — across every region of the country, ending at the PPA Finals. Each stop runs five pro divisions (Men&apos;s and Women&apos;s Singles, Doubles, and Mixed Doubles) plus a deep amateur and junior bracket. Every result moves a player up or down the season-long points race.
                </p>
                <p>
                  Off the court, the tour partners with <strong>PickleballTV</strong> for live streaming, <strong>Tennis Channel</strong> and <strong>FOX</strong> for national broadcast windows, and <strong>Carvana</strong> as title partner across every court and every broadcast. Tickets run through tixr; amateurs register on pickleballtournaments.com.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/events" className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-ppa-blue-deep">
                  Full Schedule →
                </Link>
                <Link href="/athletes" className="inline-flex h-11 items-center border border-ppa-line bg-white px-6 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:border-ppa-blue hover:text-ppa-blue">
                  Meet the Pros
                </Link>
              </div>
            </div>

            <aside>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Tier System</p>
              <div className="mt-3 border border-ppa-line">
                {TIERS.map((t) => (
                  <div key={t.name} className="grid grid-cols-[1fr_auto] gap-3 border-b border-ppa-line bg-white p-4 last:border-b-0">
                    <span>
                      <span className="block font-display text-base uppercase text-ppa-navy">{t.name}</span>
                      <span className="mt-0.5 block text-xs text-ppa-navy/55">{t.note}</span>
                    </span>
                    <span className="text-right font-display text-base text-ppa-blue tabular-nums">{t.points}</span>
                  </div>
                ))}
              </div>
              <Link href="/about/how-it-works" className="mt-5 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue">
                How It Works →
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="fan" />
        </div>
      </section>
    </>
  );
}
