import type { Metadata } from "next";

export const metadata: Metadata = { title: "Player Handbook" };

const SECTIONS = [
  { n: "01", title: "Registration & Eligibility", body: "Who can play, age and skill divisions, partner rules, and visa requirements for international competitors." },
  { n: "02", title: "Format & Scoring", body: "Games to 11 (win by 2), best-of-three for early rounds, best-of-five for select finals. Single elimination after the round-robin stage." },
  { n: "03", title: "Code of Conduct", body: "On-court behavior, dress code, social media, and unsportsmanlike conduct rules." },
  { n: "04", title: "Rankings & Points", body: "How tour ranking points are awarded by tier (Worlds, Slams, Cups, Opens) and how seedings are determined." },
  { n: "05", title: "Officiating", body: "Referee authority, line-calling, replay review, and the protest process." },
  { n: "06", title: "Equipment", body: "Approved paddle list, ball spec, attire and shoe requirements." },
];

export default function PlayerHandbookPage() {
  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">For Players</p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">Player Handbook</h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55 sm:text-base">
            The rules of the road for everyone who competes on the Carvana PPA Tour — pros, amateurs, juniors, and seniors. The full PDF is updated each season; this page is the quick reference.
          </p>
          <div className="mt-5 flex gap-3">
            <a href="mailto:players@ppatour.com" className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-ppa-blue-deep">Request the Full PDF</a>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Quick Reference</p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">What&apos;s Covered</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((s) => (
              <div key={s.n} className="flex flex-col border border-ppa-line bg-ppa-paper p-5">
                <span className="font-display text-3xl leading-none text-ppa-blue">{s.n}</span>
                <h3 className="mt-3 font-display text-lg uppercase leading-[1.1] text-ppa-navy">{s.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ppa-navy/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
