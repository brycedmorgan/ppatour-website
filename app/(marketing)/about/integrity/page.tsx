import type { Metadata } from "next";
import { InquiryForm } from "@/components/forms/InquiryForm";

export const metadata: Metadata = { title: "Integrity Reporting" };

const PRINCIPLES = [
  { title: "Confidential", note: "Reports are reviewed by a small integrity team. Your name is never shared without consent." },
  { title: "Anonymous Option", note: "You can file without identifying yourself. We still investigate every credible report." },
  { title: "No Retaliation", note: "Good-faith reporting is protected — players, staff, fans, and partners alike." },
];

export default function IntegrityPage() {
  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Integrity</p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">Report a Concern</h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55 sm:text-base">
            The PPA Tour maintains a confidential channel for reporting match-conduct, betting, harassment, or any other integrity concern. Reports are investigated by an independent team.
          </p>
          <div className="mt-5">
            <a href="mailto:integrity@ppatour.com" className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-ppa-blue-deep">integrity@ppatour.com</a>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">How It Works</p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">Principles</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <div key={p.title} className="flex flex-col border border-ppa-line bg-ppa-paper p-5">
                <span className="font-display text-2xl leading-none text-ppa-blue">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-display text-base uppercase leading-[1.1] text-ppa-navy">{p.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ppa-navy/60">{p.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-ppa-navy/60">
            For urgent concerns during an event, alert any tour official on-site — they are trained to escalate immediately.
          </p>
        </div>
      </section>

      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Confidential Channel</p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">File a Report</h2>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55">
            Reviewed confidentially by the integrity team. To file anonymously, leave your name and email blank.
          </p>
          <div className="mt-6">
            <InquiryForm formType="reporting" />
          </div>
        </div>
      </section>
    </>
  );
}
