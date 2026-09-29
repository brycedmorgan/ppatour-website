import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Transgender Participation and Competition Policy — the UPA policy document,
 * rendered in full. Laid out like /about/player-handbook: numbered section
 * cards up top, anchored sections below, so a clause can be linked directly.
 *
 * ⚠ VERBATIM from the UPA PDF Wesley supplied (9/29). This is a governing
 * policy; a paraphrase is a different policy. One edit on the way in: the
 * PDF's Contact line ends in a literal "[contact information]" placeholder,
 * which is not published — it points at /about/contact instead. Swap in the
 * real address the moment UPA supplies one.
 *
 * ⚠ The two References link to the domains the PDF prints (ncaa.org,
 * whitehouse.gov), not to guessed deep links.
 *
 * ⚠ The page also links the PDF itself (POLICY_PDF), self-hosted like the
 * handbook's so the link can't rot. A new version means replacing the PDF and
 * this page in the same commit. The PDF still carries the "[contact
 * information]" placeholder the page leaves out.
 */

const POLICY_PDF = "/ppa/policies/upa-transgender-policy.pdf";

export const metadata: Metadata = {
  title: "Transgender Participation and Competition Policy",
  description:
    "The United Pickleball Association's policy on transgender athlete participation in UPA, PPA and MLP events: eligibility for women's and men's divisions and mixed doubles.",
};

type Section = { id: string; title: string; body: ReactNode };

const link = "font-medium text-ppa-blue underline underline-offset-2 hover:text-ppa-blue-deep";
const para = "text-sm leading-relaxed text-ppa-navy/75";

const DEFINITIONS: [string, string][] = [
  ["Transgender Athlete", "An individual whose gender identity or gender expression is different from their sex assigned at birth."],
  ["Sex Assigned at Birth", "The male or female designation doctors assign to infants at birth, which is marked on their birth records."],
  ["Women's Division", "A competition category designated for athletes whose sex was assigned female at birth."],
  ["Men's Division", "A competition category designated for athletes whose sex was assigned male at birth."],
  ["Mixed Doubles Competition", "A format in which each team must consist of one male and one female player, based on their sex assigned at birth."],
  ["Gender Identity", "An individual's own internal sense of their gender (e.g., man, woman, nonbinary)."],
];

const ELIGIBILITY: { t: string; items: string[] }[] = [
  {
    t: "Eligibility for Women's Divisions",
    items: [
      "Athletes assigned female at birth are eligible to compete in women's divisions.",
      "Athletes assigned male at birth are not permitted to compete in women's divisions, regardless of gender identity or any medical treatments undertaken.",
    ],
  },
  { t: "Eligibility for Men's Divisions", items: ["Athletes assigned male at birth are eligible to compete in men's divisions."] },
  {
    t: "Mixed Doubles Competitions",
    items: [
      "In mixed doubles events, teams must consist of one male and one female player, as determined by the participants' sex assigned at birth.",
    ],
  },
];

function Numbered({ id, n, children }: { id: string; n: number; children: ReactNode }) {
  return (
    <li id={id} className="scroll-mt-28 border-t border-ppa-line pt-6 first:border-t-0 first:pt-0">
      <div className="flex gap-2 sm:gap-3">
        <a
          href={`#${id}`}
          className="shrink-0 font-display text-lg leading-tight tabular-nums text-ppa-navy/45 hover:text-ppa-blue"
          aria-label={`Link to ${id.replace(/-/g, " ")}`}
        >
          {n})
        </a>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </li>
  );
}

const SECTIONS: Section[] = [
  {
    id: "purpose",
    title: "Purpose",
    body: (
      <p className={para}>
        This policy aims to establish clear guidelines for the participation of transgender athletes in UPA, PPA, and
        MLP pickleball events, ensuring alignment with the National Collegiate Athletic Association (NCAA)
        Participation Policy for Transgender Student-Athletes and adherence to the Executive Order titled &ldquo;Keeping
        Men Out of Women&rsquo;s Sports&rdquo; issued on February 5, 2025.
      </p>
    ),
  },
  {
    id: "definitions",
    title: "Definitions",
    body: (
      <>
        <p className={para}>For the purposes of this policy, the following definitions apply:</p>
        <ol className="mt-6 space-y-6">
          {DEFINITIONS.map(([term, def], i) => (
            <Numbered key={term} id={`definitions-${i + 1}`} n={i + 1}>
              <h3 className="font-display text-lg uppercase leading-tight text-ppa-navy">{term}</h3>
              <p className={`mt-2 ${para}`}>{def}</p>
            </Numbered>
          ))}
        </ol>
      </>
    ),
  },
  {
    id: "policy",
    title: "Policy Statement",
    body: (
      <>
        <p className={para}>
          UPA is committed to providing a fair and competitive environment for all athletes. In alignment with the
          NCAA&rsquo;s updated policy and the aforementioned Executive Order, the following guidelines are established
          for transgender athlete participation in UPA, PPA, and MLP pickleball competitions:
        </p>
        <ol className="mt-6 space-y-6">
          {ELIGIBILITY.map((e, i) => (
            <Numbered key={e.t} id={`policy-${i + 1}`} n={i + 1}>
              <h3 className="font-display text-lg uppercase leading-tight text-ppa-navy">{e.t}</h3>
              <ul className="mt-3 space-y-2.5">
                {e.items.map((item) => (
                  <li key={item} className={`flex gap-3 ${para}`}>
                    <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 bg-ppa-blue" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Numbered>
          ))}
        </ol>
      </>
    ),
  },
  {
    id: "implementation",
    title: "Implementation",
    body: (
      <p className={para}>
        This policy is effective immediately and applies to all UPA, PPA, and MLP sanctioned events. All athletes are
        required to comply with these guidelines to ensure fair competition and adherence to federal directives.
      </p>
    ),
  },
  {
    id: "review",
    title: "Review and Amendments",
    body: (
      <p className={para}>
        UPA reserves the right to review and amend this policy as necessary to remain in compliance with governing
        bodies and federal regulations.
      </p>
    ),
  },
  {
    id: "references",
    title: "References",
    body: (
      <ul className="space-y-2.5">
        <li className={`flex gap-3 ${para}`}>
          <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 bg-ppa-blue" />
          <span>
            NCAA Participation Policy for Transgender Student-Athletes:{" "}
            <a href="https://www.ncaa.org" target="_blank" rel="noopener" className={link}>
              ncaa.org
            </a>
          </span>
        </li>
        <li className={`flex gap-3 ${para}`}>
          <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 bg-ppa-blue" />
          <span>
            Executive Order: Keeping Men Out of Women&rsquo;s Sports:{" "}
            <a href="https://www.whitehouse.gov" target="_blank" rel="noopener" className={link}>
              whitehouse.gov
            </a>
          </span>
        </li>
      </ul>
    ),
  },
  {
    id: "contact",
    title: "Contact Information",
    body: (
      <p className={para}>
        For questions or further clarification regarding this policy, please contact UPA&rsquo;s administration through
        our{" "}
        <Link href="/about/contact/" className={link}>
          contact page
        </Link>
        .
      </p>
    ),
  },
];

export default function TransgenderPolicyPage() {
  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              United Pickleball Association
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            Transgender Participation &amp; Competition Policy
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55 sm:text-base">
            The policy governing transgender athlete participation in UPA, PPA and MLP sanctioned events: eligibility for
            women&rsquo;s and men&rsquo;s divisions, and team composition in mixed doubles.
          </p>
          <div className="mt-5 flex gap-3">
            <a
              href={POLICY_PDF}
              target="_blank"
              rel="noopener"
              className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-transform hover:bg-ppa-blue-deep active:scale-[0.98]"
            >
              Policy (PDF)
            </a>
          </div>
          <nav aria-label="Policy sections" className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="group flex items-baseline gap-3 border border-ppa-line bg-white px-4 py-3 hover:border-ppa-blue"
              >
                <span className="font-display text-xl leading-none text-ppa-blue">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-ppa-navy group-hover:text-ppa-blue">
                  {s.title}
                </span>
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="max-w-3xl space-y-14">
            {SECTIONS.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-28">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Section {i + 1}</p>
                <h2
                  id={`${s.id}-title`}
                  className="mt-1 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl"
                >
                  {s.title}
                </h2>
                <div className="mt-6">{s.body}</div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
