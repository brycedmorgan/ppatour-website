import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ComingSoon } from "@/components/global/ComingSoon";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { getTourProgram, tourPrograms } from "@/lib/tour-programs";

// Tour-program slugs that carry a form (matches lib/forms/schema.ts keys).
const PROGRAM_FORM: Record<string, "hospitality" | "newsletter-junior"> = {
  hospitality: "hospitality",
  junior: "newsletter-junior",
};

type Params = { params: Promise<{ slug: string }> };

function titleFromSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * ⚠ `junior` is excluded: it has its own route at /tour/junior, which is far
 * richer than this template can express and which wins at request time anyway.
 * Leaving it here just prerendered a second, dead copy of the page. The entry
 * STAYS in lib/tour-programs.ts — nav, sitemap, site search and the other five
 * programs' cross-links all read that list.
 */
const HAS_OWN_ROUTE = new Set(["junior"]);

export function generateStaticParams() {
  return tourPrograms
    .filter((p) => !HAS_OWN_ROUTE.has(p.slug))
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const program = getTourProgram(slug);
  return { title: program?.label ?? titleFromSlug(slug) };
}

export default async function TourProgramPage({ params }: Params) {
  const { slug } = await params;
  const program = getTourProgram(slug);

  if (!program) {
    return (
      <ComingSoon
        title={titleFromSlug(slug)}
        blurb="Coming soon — this page is part of the rebuild."
      />
    );
  }

  const others = tourPrograms.filter((p) => p.slug !== program.slug);
  const formType = PROGRAM_FORM[program.slug];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ppa-navy text-white">
        <Image
          src={program.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 scrim-hero" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              {program.eyebrow}
            </p>
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-3xl uppercase leading-[1.02] sm:text-5xl">
            {program.headline}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            {program.body[0]}
          </p>
          <div className="mt-5">
            <a
              href={program.cta.href}
              target={program.cta.external ? "_blank" : undefined}
              rel={program.cta.external ? "noopener noreferrer" : undefined}
              className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
            >
              {program.cta.label} {program.cta.external ? "↗" : "→"}
            </a>
          </div>
        </div>
      </section>

      {/* Body + bullets */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                About {program.label}
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                {program.sectionHeadline ?? program.headline}
              </h2>
              <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                {/* When a distinct section heading is set, body[0] already leads
                    the hero — don't repeat it here. */}
                {program.body
                  .slice(program.sectionHeadline ? 1 : 0)
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>
            </div>
            <aside>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                What&apos;s Included
              </p>
              <ul className="mt-3 flex flex-col gap-px border border-ppa-line bg-ppa-line">
                {program.bullets.map((b) => (
                  <li
                    key={b.title}
                    className="flex flex-col gap-1 bg-white p-4"
                  >
                    <span className="font-display text-sm uppercase tracking-wide text-ppa-navy">
                      {b.title}
                    </span>
                    <span className="text-xs leading-relaxed text-ppa-navy/60">
                      {b.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* Program form (hospitality booking / junior newsletter) */}
      {formType && (
        <section className="bg-white">
          <div className="mx-auto w-full max-w-3xl px-4 py-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
              {formType === "hospitality" ? "Book Hospitality" : "Stay in the Know"}
            </p>
            <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
              {formType === "hospitality" ? "Request Hospitality" : "Junior PPA Tour Newsletter"}
            </h2>
            <div className="mt-6">
              <InquiryForm formType={formType} />
            </div>
          </div>
        </section>
      )}

      {/* Cross-link to other programs */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
            Explore the Tour
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
            More Ways In
          </h2>
          <div className="mt-6 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2 lg:grid-cols-3">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/tour/${o.slug}`}
                className="group flex flex-col gap-1 bg-white p-4 transition-colors hover:bg-ppa-paper"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
                  {o.eyebrow}
                </span>
                <span className="font-display text-base uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                  {o.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Email */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="amateur" />
        </div>
      </section>
    </>
  );
}
