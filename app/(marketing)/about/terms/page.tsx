import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <section className="bg-ppa-paper">
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Terms of Use</p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">Using the PPA Tour Site</h1>
        <p className="mt-3 text-xs uppercase tracking-wide text-ppa-navy/45">Last updated: May 22, 2026</p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ppa-navy/75 sm:text-base">
          <p>
            These terms govern your use of ppatour.com and related apps. The full legal document lives in the footer; this page is the plain-English summary.
          </p>

          <h2 className="font-display text-xl uppercase text-ppa-navy">Acceptable use</h2>
          <ul className="flex flex-col gap-2 pl-5 [&>li]:list-disc">
            <li>Don&apos;t scrape, mirror, or rebroadcast our content commercially without written permission.</li>
            <li>Don&apos;t bypass paywalls, ticket controls, or rate limits.</li>
            <li>Don&apos;t harass other users in any feature that allows interaction.</li>
          </ul>

          <h2 className="font-display text-xl uppercase text-ppa-navy">Content & broadcast rights</h2>
          <p>
            All match footage, brackets data, photography, and tour branding are property of the Carvana PPA Tour or our broadcast partners. Personal, non-commercial sharing on social media is welcome with credit; commercial use requires a license.
          </p>

          <h2 className="font-display text-xl uppercase text-ppa-navy">Off-site purchases</h2>
          <p>
            Tickets are sold through tixr; amateur tournament registration runs on pickleballtournaments.com; merchandise ships from Pickleball Central. Their terms apply for those transactions.
          </p>

          <h2 className="font-display text-xl uppercase text-ppa-navy">Contact</h2>
          <p>
            Legal questions: <a href="mailto:legal@ppatour.com" className="text-ppa-blue underline">legal@ppatour.com</a>.
          </p>

          <p className="mt-2">
            <Link href="/about/privacy" className="text-ppa-blue underline">Privacy Policy →</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
