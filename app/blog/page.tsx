import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import {
  blogPage,
  blogSectionLabel,
  blogSections,
  type NewsCard,
} from "@/lib/news";

/**
 * The PPA Blog index — the 39 evergreen instructional posts WordPress served
 * under `ppatour.com/blog/`.
 *
 * ⚠ THE ARTICLES LIVE AT `/ppa-blog/{slug}`, NOT `/blog/{slug}`. WordPress used
 * `/blog/` for this index and `/ppa-blog/` for the posts themselves, and both
 * are indexed exactly that way, so both are preserved rather than tidied into
 * one shape. `card.href` already carries the right path — never build it here.
 *
 * The whole archive fits on one page (39 posts), so there is no pagination and
 * no search box: /news owns archive search and indexes these bodies too.
 */

export const metadata: Metadata = {
  title: "Pickleball Blog — How to Play, Gear, Rules & Terminology",
  description:
    "How to play pickleball, scoring, rules, gear and terminology — evergreen guides from the Carvana PPA Tour.",
};

/** Evergreen content, no live data. Rebuilt on deploy. */
export const dynamic = "force-static";

type Search = { searchParams: Promise<{ section?: string }> };

function CardImage({ card, sizes, priority = false, scrim = "scrim-card" }: {
  card: NewsCard;
  sizes: string;
  priority?: boolean;
  scrim?: string;
}) {
  return (
    <>
      {card.image && (
        <Image
          src={card.image}
          alt={card.imageAlt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
      )}
      <div className={`absolute inset-0 ${card.image ? scrim : "bg-ppa-navy-deep"}`} />
    </>
  );
}

export default async function BlogPage({ searchParams }: Search) {
  const sp = await searchParams;
  const sections = blogSections();
  // Only honor a section that exists, so a junk query param falls back to the
  // whole archive instead of rendering an empty page.
  const active = sections.find((s) => s.slug === (sp.section ?? ""))?.slug ?? null;
  const posts = blogPage(active);
  const total = blogPage(null).length;

  const [lead, ...rest] = posts;

  return (
    <>
      {/* Masthead */}
      <section className="relative isolate overflow-hidden bg-ppa-navy text-white">
        {/* Decorative texture under a heavy scrim — quality 65 because the
            detail is not perceivable there, and 65/75 are the only qualities
            allowlisted in next.config. */}
        <Image
          src="/ppa/nationals-crowd-1.jpg"
          alt=""
          fill
          priority
          quality={65}
          sizes="100vw"
          className="object-cover object-[center_55%]"
        />
        <div className="absolute inset-0 scrim-masthead" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-6 pt-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              PPA Blog
            </p>
          </div>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
              {active ? blogSectionLabel(active) : "Learn the Game"}
            </h1>
            <p className="max-w-sm text-sm text-white/65 sm:text-right">
              How to play, how scoring works, what the kitchen is, which paddle
              to buy — the fundamentals, from the tour the pros play.
            </p>
          </div>

          {/* Section chips — plain links, so filtering needs no client JS. */}
          <div className="mt-6 flex flex-wrap items-center gap-1.5">
            <Link
              href="/blog"
              className={`flex h-9 items-center border px-3 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                active
                  ? "border-white/25 bg-white/10 text-white hover:border-white/60 hover:bg-white/20"
                  : "border-white bg-white text-ppa-navy"
              }`}
            >
              All
              <span className={`ml-1.5 ${active ? "text-white/45" : "text-ppa-navy/40"}`}>
                {total}
              </span>
            </Link>
            {sections.map((s) => {
              const on = active === s.slug;
              return (
                <Link
                  key={s.slug}
                  href={`/blog?section=${s.slug}`}
                  className={`flex h-9 items-center border px-3 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                    on
                      ? "border-white bg-white text-ppa-navy"
                      : "border-white/25 bg-white/10 text-white hover:border-white/60 hover:bg-white/20"
                  }`}
                >
                  {s.label}
                  <span className={`ml-1.5 ${on ? "text-ppa-navy/40" : "text-white/45"}`}>
                    {s.count}
                  </span>
                </Link>
              );
            })}
            {/* The archive is small enough to read end to end; search for it
                lives on /news, which indexes these bodies alongside everything
                else rather than running a second, weaker index here. */}
            <Link
              href="/news"
              className="flex h-9 items-center border border-white/25 bg-white/10 px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/20"
            >
              Tour News →
            </Link>
          </div>
        </div>
      </section>

      {/* Lead */}
      {lead && (
        <section className="bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 pt-8">
            <Link
              href={lead.href}
              data-reveal
              className="group relative isolate flex min-h-[19rem] flex-col justify-end overflow-hidden bg-ppa-navy sm:aspect-16/9 sm:min-h-0"
            >
              <CardImage
                card={lead}
                priority
                sizes="(min-width: 1152px) 1088px, 100vw"
                scrim="scrim-feature"
              />
              <div className="relative max-w-3xl p-5 text-white sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-sky">
                  {lead.series ? blogSectionLabel(lead.series) : "PPA Blog"}{" "}
                  <span className="text-white/40">·</span> {lead.displayDate}
                </p>
                <h2 className="mt-2 font-display text-[clamp(1.4rem,3.2vw,2.4rem)] uppercase leading-[1.05] transition-colors group-hover:text-ppa-sky">
                  {lead.title}
                </h2>
                {lead.dek && (
                  <p className="mt-2.5 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/75">
                    {lead.dek}
                  </p>
                )}
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/55">
                  {lead.author}
                </p>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* The rest of the archive */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-10">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/45">
              {active ? `${blogSectionLabel(active)} — ${posts.length} Articles` : "All Articles"}
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((c, i) => (
              <Link
                key={c.slug}
                href={c.href}
                data-reveal
                style={{ "--reveal-delay": `${Math.min(i, 6) * 60}ms` } as React.CSSProperties}
                className="group relative isolate flex aspect-16/10 flex-col justify-end overflow-hidden bg-ppa-navy"
              >
                <CardImage card={c} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                <div className="relative p-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-sky">
                    {c.series ? blogSectionLabel(c.series) : "PPA Blog"}{" "}
                    <span className="text-white/40">·</span> {c.displayDate}
                  </p>
                  <h3 className="mt-1.5 font-display text-lg uppercase leading-[1.1] transition-colors group-hover:text-ppa-sky">
                    {c.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          {posts.length === 0 && (
            <p className="mt-6 text-sm text-ppa-navy/60">
              Nothing in this section yet —{" "}
              <Link href="/blog" className="font-bold text-ppa-blue hover:underline">
                see every article
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="streaming" />
        </div>
      </section>
    </>
  );
}
