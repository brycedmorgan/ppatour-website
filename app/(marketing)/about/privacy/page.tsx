import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <section className="bg-ppa-paper">
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Privacy Policy</p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">How We Handle Your Data</h1>
        <p className="mt-3 text-xs uppercase tracking-wide text-ppa-navy/45">Last updated: May 22, 2026</p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ppa-navy/75 sm:text-base">
          <p>
            This summary explains what data the Carvana PPA Tour collects, why we collect it, and how to opt out. The full legal policy lives in the document accessible from the footer; this page is the plain-English version.
          </p>

          <h2 className="font-display text-xl uppercase text-ppa-navy">What we collect</h2>
          <ul className="flex flex-col gap-2 pl-5 [&>li]:list-disc">
            <li>Account info you give us (email, name) when you sign up for newsletters or alerts.</li>
            <li>Usage analytics (pages visited, device, country) to improve the site.</li>
            <li>Purchase data passed through to our partners (tixr for tickets, pickleballtournaments.com for registration).</li>
          </ul>

          <h2 className="font-display text-xl uppercase text-ppa-navy">What we don&apos;t do</h2>
          <ul className="flex flex-col gap-2 pl-5 [&>li]:list-disc">
            <li>We don&apos;t sell your personal data.</li>
            <li>We don&apos;t share your email with third parties for their marketing.</li>
            <li>We don&apos;t store credit-card details — payments are handled by our partners.</li>
          </ul>

          <h2 className="font-display text-xl uppercase text-ppa-navy">Your choices</h2>
          <p>
            You can unsubscribe from any email with one click, opt out of analytics in the cookie banner, and request deletion of your account data by writing to <a href="mailto:privacy@ppatour.com" className="text-ppa-blue underline">privacy@ppatour.com</a>.
          </p>

          <h2 className="font-display text-xl uppercase text-ppa-navy">Contact</h2>
          <p>
            For any privacy question — including data-subject requests under GDPR or CCPA — email <a href="mailto:privacy@ppatour.com" className="text-ppa-blue underline">privacy@ppatour.com</a>.
          </p>

          <p className="mt-2">
            <Link href="/about/terms" className="text-ppa-blue underline">Terms of Use →</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
