import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Host a Private Event",
  description:
    "Host a private event with the PPA Tour — corporate outings, clinics, and custom pickleball experiences.",
};

const FORMATS = [
  { name: "Corporate Pro-Am", note: "Half-day clinic + bracket with PPA Tour pros. 16–48 guests." },
  { name: "Executive Retreat", note: "Two-day private camp at a tour-grade venue. Catering, swag, brand activation." },
  { name: "Hospitality Suites", note: "Premium boxes at any main-tour stop. Catered, branded, client-ready." },
  { name: "Brand Activation", note: "On-site partner experiences during a tour weekend — sampling, demos, suites." },
];

export default function PrivateEventsPage() {
  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">For Brands & Companies</p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">Host a PPA-Sponsored Private Event</h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55 sm:text-base">
            From corporate pro-ams to client hospitality at a main-tour stop, the PPA produces premium private events featuring tour pros, broadcast-grade production, and full activation support.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="mailto:events@ppatour.com" className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-ppa-blue-deep">Inquire →</a>
            <Link href="/tour/hospitality" className="inline-flex h-11 items-center border border-ppa-line bg-white px-6 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:border-ppa-blue hover:text-ppa-blue">Or browse on-site hospitality</Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Formats</p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">Built Around You</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {FORMATS.map((f) => (
              <div key={f.name} className="flex flex-col border border-ppa-line bg-ppa-paper p-5">
                <p className="font-display text-lg uppercase text-ppa-navy">{f.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">{f.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 text-white">
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">Ready</p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] sm:text-3xl">Tell Us About Your Event</h2>
              <p className="mt-2 max-w-xl text-sm text-white/65">Share your dates, headcount, and goals and we&apos;ll come back with a tailored plan and a quote within five business days.</p>
            </div>
            <a href="mailto:events@ppatour.com" className="flex h-12 items-center justify-center bg-ppa-blue px-8 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-ppa-blue-deep">events@ppatour.com</a>
          </div>
        </div>
      </section>
    </>
  );
}
