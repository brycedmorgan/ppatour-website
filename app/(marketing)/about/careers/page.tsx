import type { Metadata } from "next";
import { InquiryForm } from "@/components/forms/InquiryForm";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Careers at the Carvana PPA Tour — join the team behind the pro pickleball tour.",
};

const TEAMS = [
  { name: "Tour Operations", note: "Run the twenty-stop calendar — logistics, sanctioning, on-site." },
  { name: "Broadcast & Production", note: "PBTV streaming, Tennis Channel and FOX windows, on-site truck." },
  { name: "Marketing & Brand", note: "Owned media, partner activations, social, ticketing." },
  { name: "Player Relations", note: "The pros, rankings, brackets, and the rules of competition." },
  { name: "Engineering & Product", note: "The web, the MATCHDAY app, scoring infrastructure." },
  { name: "Partnerships", note: "Title, presenting, and category partner deals across the season." },
];

export default function CareersPage() {
  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Careers</p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">Help Build the Pro Tour of Pickleball</h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55 sm:text-base">
            The PPA Tour is hiring across operations, broadcast, marketing, engineering, and player relations as professional pickleball scales. If you want to build something foundational in the fastest-growing sport in America, get in touch.
          </p>
          <div className="mt-5">
            <a href="mailto:careers@ppatour.com" className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-ppa-blue-deep">careers@ppatour.com</a>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Teams</p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">Where We&apos;re Hiring</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEAMS.map((t) => (
              <div key={t.name} className="flex flex-col border border-ppa-line bg-ppa-paper p-5">
                <p className="font-display text-lg uppercase text-ppa-navy">{t.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-ppa-navy/65">{t.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-ppa-navy/60">
            Don&apos;t see the right fit? Send a note about your background and what you want to build. We read every email.
          </p>
        </div>
      </section>

      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Get in Touch</p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">Introduce Yourself</h2>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55">
            Tell us about your background and what you want to build — link your resume or portfolio and we&apos;ll follow up.
          </p>
          <div className="mt-6">
            <InquiryForm formType="careers" />
          </div>
        </div>
      </section>
    </>
  );
}
