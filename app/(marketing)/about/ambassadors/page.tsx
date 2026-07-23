import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ambassador Program",
  description:
    "The PPA Tour Ambassador Program — represent the tour in your community and grow the game.",
};

const PERKS = [
  { title: "Exclusive Gear", note: "Tour-issued apparel and merch drops you can't buy retail." },
  { title: "Event Access", note: "Discounted or comped tickets to tour stops in your region." },
  { title: "Pro Connection", note: "Behind-the-scenes content, Q&As, and direct lines to tour staff." },
  { title: "Affiliate Earnings", note: "Tracked commission on tickets, merch, and event registrations." },
];

export default function AmbassadorPage() {
  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Community</p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">The PPA Tour Ambassador Program</h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55 sm:text-base">
            Pickleball creators, club owners, coaches, and community leaders who carry the tour into every market. Ambassadors get exclusive access, event perks, and an affiliate revenue share.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="mailto:ambassadors@ppatour.com" className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-ppa-blue-deep">Apply →</a>
            <Link href="/about/international-ambassadors" className="inline-flex h-11 items-center border border-ppa-line bg-white px-6 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:border-ppa-blue hover:text-ppa-blue">International Program</Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">What You Get</p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">Perks That Matter</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERKS.map((p, i) => (
              <div key={p.title} className="flex flex-col border border-ppa-line bg-ppa-paper p-5">
                <span className="font-display text-2xl leading-none text-ppa-blue">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-display text-base uppercase leading-[1.1] text-ppa-navy">{p.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ppa-navy/60">{p.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
