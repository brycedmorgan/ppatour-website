import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Host a PPA Tour Tournament",
  description:
    "Bring a PPA Tour event to your city — venue requirements, formats, and how to host a professional pickleball tournament.",
};

const STEPS = [
  { n: "01", title: "Submit Your Bid", body: "Send venue, dates, and city info via the inquiry form. We'll reach out within five business days." },
  { n: "02", title: "Site Visit", body: "Our operations team walks the venue with you to confirm courts, broadcast logistics, and fan flow." },
  { n: "03", title: "Sanction & Launch", body: "Sign the host agreement, lock the date on the schedule, and start the marketing build." },
];

const WHAT_YOU_GET = [
  "Full-week broadcast on PickleballTV and select Tennis Channel windows",
  "On-site production crew, scoring, and brackets management",
  "Title and presenting sponsor activations turn-key",
  "National marketing push — email, social, and partner channels",
  "Amateur & junior brackets that fill mid-week hotel nights",
];

export default function HostTournamentPage() {
  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">For Venues & Cities</p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">Host a PPA Tour Tournament</h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55 sm:text-base">
            Bring the pros to your city. The PPA Tour partners with venues, resorts, and CVBs nationwide to deliver six-day, broadcast-quality main-tour events that fill rooms and pack courts.
          </p>
          <div className="mt-5">
            <a href="mailto:tournaments@ppatour.com" className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-ppa-blue-deep">
              Submit a Bid →
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">How It Works</p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">Three Steps to a Tour Stop</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-col border border-ppa-line bg-ppa-paper p-5">
                <span className="font-display text-3xl leading-none text-ppa-blue">{s.n}</span>
                <h3 className="mt-3 font-display text-lg uppercase leading-[1.1] text-ppa-navy">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ppa-navy/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">What&apos;s Included</p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">A Turn-Key Pro Stop</h2>
              <ul className="mt-5 grid gap-px border border-ppa-line bg-ppa-line">
                {WHAT_YOU_GET.map((b) => (
                  <li key={b} className="flex items-start gap-3 bg-white p-4 text-sm text-ppa-navy/75">
                    <span className="mt-2 size-1.5 shrink-0 bg-ppa-blue" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <aside className="border border-ppa-line bg-white p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Contact</p>
              <h3 className="mt-2 font-display text-xl uppercase text-ppa-navy">Tour Operations</h3>
              <p className="mt-3 text-sm text-ppa-navy/65">For venue bids, host-city inquiries, and broadcast partnerships:</p>
              <a href="mailto:tournaments@ppatour.com" className="mt-3 inline-block text-sm font-bold text-ppa-blue hover:text-ppa-navy">tournaments@ppatour.com</a>
              <p className="mt-5 text-[11px] uppercase tracking-[0.1em] text-ppa-navy/35">Bids reviewed weekly. Sites typically lock 9–12 months ahead.</p>
              <Link href="/about/private-events" className="mt-5 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue">Or host a private event →</Link>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
