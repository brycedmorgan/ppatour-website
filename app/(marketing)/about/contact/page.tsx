import type { Metadata } from "next";
import Link from "next/link";
import { InquiryForm } from "@/components/forms/InquiryForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the Carvana PPA Tour — tickets, events, partnerships, media, and player questions.",
};

const CONTACTS = [
  { area: "General", email: "info@ppatour.com", note: "Anything not covered below." },
  { area: "Partnerships", email: "partnerships@ppatour.com", note: "Title, presenting, and category partner inquiries." },
  { area: "Press & Media", email: "media@ppatour.com", note: "Credentials, interviews, and media-day requests." },
  { area: "Tickets", email: "ticketing@ppatour.com", note: "Group sales, corporate hospitality, and general ticketing questions." },
  { area: "Tournament Hosting", email: "tournaments@ppatour.com", note: "Venue bids and host-city inquiries." },
  { area: "Careers", email: "careers@ppatour.com", note: "Job openings and recruiting." },
  { area: "Player Relations", email: "players@ppatour.com", note: "Pros only — rankings, brackets, conduct." },
  { area: "Integrity Reporting", email: "integrity@ppatour.com", note: "Confidential — match conduct and integrity." },
];

export default function ContactPage() {
  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Contact</p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">Get in Touch</h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55 sm:text-base">
            The right address for every kind of inquiry. We read every email and respond within five business days.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2">
            {CONTACTS.map((c) => (
              <div key={c.area} className="bg-white p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-blue">{c.area}</p>
                <a href={`mailto:${c.email}`} className="mt-1 block font-display text-base uppercase text-ppa-navy hover:text-ppa-blue">{c.email}</a>
                <p className="mt-1.5 text-xs text-ppa-navy/55">{c.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link href="/about/integrity" className="text-ppa-blue hover:text-ppa-navy">Integrity Reporting →</Link>
            <Link href="/about/sponsors" className="text-ppa-blue hover:text-ppa-navy">Partner with the Tour →</Link>
            <Link href="/about/careers" className="text-ppa-blue hover:text-ppa-navy">Careers →</Link>
          </div>
        </div>
      </section>

      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Message Us</p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">Send Us a Message</h2>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55">
            Prefer a form? Pick the topic and we&apos;ll route it to the right team.
          </p>
          <div className="mt-6">
            <InquiryForm formType="contact" />
          </div>
        </div>
      </section>
    </>
  );
}
