import type { Metadata } from "next";
import { InquiryForm } from "@/components/forms/InquiryForm";

export const metadata: Metadata = {
  title: "Join the PPA Tour",
  description:
    "Opt in to the PPA Tour — tell us how you play and we'll notify you about tournaments, tickets, and news near you.",
};

export default function OptInPage() {
  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Join the Family</p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">Stay in the Loop</h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55 sm:text-base">
            Tell us a little about how you play, and we&apos;ll notify you about tournaments near you, ticket presales, and the latest from the tour.
          </p>
          <div className="mt-8">
            <InquiryForm formType="opt-in" />
          </div>
        </div>
      </section>
    </>
  );
}
