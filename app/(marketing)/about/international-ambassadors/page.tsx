import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "International Ambassadors" };

const REGIONS = [
  { name: "Europe", note: "Italy, Spain, France, Germany, UK, and the Nordics." },
  { name: "Asia-Pacific", note: "Singapore, Tokyo, Hong Kong, KL, Sydney, Auckland." },
  { name: "Americas", note: "Canada, Mexico, Brazil, Colombia, Argentina." },
  { name: "Middle East", note: "UAE, Saudi Arabia, Qatar." },
];

export default function InternationalAmbassadorsPage() {
  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Global Community</p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">International Ambassadors</h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55 sm:text-base">
            The growing global network of PPA Tour Ambassadors carrying professional pickleball into new markets. International ambassadors run camps, host viewing parties, and represent the tour at regional events.
          </p>
          <div className="mt-5">
            <a href="mailto:international@ppatour.com" className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-ppa-blue-deep">Apply →</a>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Regions</p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">Where We&apos;re Growing</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REGIONS.map((r) => (
              <div key={r.name} className="flex flex-col border border-ppa-line bg-ppa-paper p-5">
                <p className="font-display text-lg uppercase text-ppa-navy">{r.name}</p>
                <p className="mt-2 text-xs leading-relaxed text-ppa-navy/60">{r.note}</p>
              </div>
            ))}
          </div>
          <Link href="/about/ambassadors" className="mt-6 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue">U.S. Ambassador Program →</Link>
        </div>
      </section>
    </>
  );
}
