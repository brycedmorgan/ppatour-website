import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { getArticle, newsArticles } from "@/lib/news-articles";
import { athletes, type Athlete } from "@/lib/athletes";
import { getNextTournament } from "@/lib/placeholder-data";
import { withUtm } from "@/lib/utm";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return newsArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return { title: "News" };
  return {
    title: a.title,
    description: a.dek,
    openGraph: {
      title: a.title,
      description: a.dek,
      images: [a.image],
      type: "article",
    },
    twitter: { card: "summary_large_image", images: [a.image] },
  };
}

/** Wraps athlete full-name mentions in links to their bios. */
function linkifyPlayers(text: string, players: Athlete[]) {
  const inText = players.filter((p) => text.includes(p.name));
  if (inText.length === 0) return text;
  const pattern = new RegExp(
    `(${inText
      .map((p) => p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})`,
    "g",
  );
  return text.split(pattern).map((part, i) => {
    const athlete = inText.find((p) => p.name === part);
    return athlete ? (
      <Link
        key={i}
        href={`/athletes/${athlete.slug}`}
        className="font-semibold text-ppa-blue underline decoration-ppa-blue/30 underline-offset-2 transition-colors hover:decoration-ppa-blue"
      >
        {part}
      </Link>
    ) : (
      part
    );
  });
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();

  const related = newsArticles.filter((x) => x.slug !== a.slug).slice(0, 3);
  const next = getNextTournament();

  const mentioned = athletes.filter((p) =>
    [a.dek, ...a.body].some((t) => t.includes(p.name)),
  );
  const featured = [
    ...new Set([...(a.players ?? []), ...mentioned.map((p) => p.slug)]),
  ]
    .map((s) => athletes.find((p) => p.slug === s))
    .filter((p): p is Athlete => Boolean(p));

  return (
    <>
      {/* Article hero */}
      <section className="relative isolate flex min-h-[44svh] flex-col justify-end overflow-hidden bg-ppa-navy text-white">
        <Image
          src={a.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 scrim-hero" />
        <div className="relative mx-auto w-full max-w-3xl px-4 pb-9 pt-24">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.16em] motion-safe:animate-rise">
            <span className="bg-ppa-blue px-2 py-0.5">{a.category}</span>
            <span className="text-white/70">{a.date}, 2026</span>
            <span className="text-white/25">/</span>
            <span className="text-white/70">PPA Tour Staff</span>
          </div>
          <h1
            className="mt-3 font-display text-[clamp(1.6rem,4.4vw,2.6rem)] uppercase leading-[1.02] motion-safe:animate-rise"
            style={{ animationDelay: "120ms" }}
          >
            {a.title}
          </h1>
        </div>
        <div className="relative h-1 bg-ppa-blue" />
      </section>

      {/* Body + players rail */}
      <article className="bg-white">
        <div
          className={`mx-auto w-full px-4 py-10 ${
            featured.length > 0
              ? "grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]"
              : "max-w-3xl"
          }`}
        >
          <div className="min-w-0">
          <p className="text-lg leading-relaxed text-ppa-navy/80">
            {linkifyPlayers(a.dek, featured)}
          </p>

          <div className="mt-4 border-l-4 border-ppa-blue bg-ppa-paper p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppa-blue">
              Why It Matters
            </p>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-ppa-navy">
              {a.whyItMatters}
            </p>
          </div>

          <div className="mt-7 space-y-5">
            {a.body.map((p, i) => (
              <p key={i} className="text-[15px] leading-[1.75] text-ppa-navy/75">
                {linkifyPlayers(p, featured)}
              </p>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap gap-2.5 border-t border-ppa-line pt-6">
            <a
              href={withUtm(next.ticketsUrl, {
                campaign: next.slug,
                content: `article-${a.slug}`,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 items-center bg-ppa-blue px-5 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-ppa-blue-deep active:scale-[0.98]"
            >
              See It Live — {next.shortName} Tickets
            </a>
            <Link
              href="/watch/tv"
              className="flex h-10 items-center border border-ppa-line px-5 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy transition hover:border-ppa-blue hover:text-ppa-blue active:scale-[0.98]"
            >
              TV Schedule
            </Link>
          </div>
          </div>

          {featured.length > 0 && (
            <aside className="lg:pt-1">
              <div className="lg:sticky lg:top-24">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 bg-ppa-blue" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                    Players in This Story
                  </p>
                </div>
                <div className="mt-4 flex flex-col gap-px border border-ppa-line bg-ppa-line">
                  {featured.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/athletes/${p.slug}`}
                      className="group flex items-center gap-3 bg-white p-3 transition-colors hover:bg-ppa-paper"
                    >
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-ppa-navy-deep">
                        <Image
                          src={p.headshot}
                          alt={p.name}
                          fill
                          sizes="44px"
                          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-display text-sm uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-ppa-blue">
                          No. {p.bestRank} · {p.divisions[0]}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className="ml-auto text-xs text-ppa-blue opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                      >
                        →
                      </span>
                    </Link>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-ppa-navy/45">
                  Full bios, rankings, and match history →{" "}
                  <Link href="/athletes" className="font-bold text-ppa-blue hover:underline">
                    all athletes
                  </Link>
                </p>
              </div>
            </aside>
          )}
        </div>
      </article>

      {/* Related */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-ppa-blue" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
                More From the Tour
              </p>
            </div>
            <Link
              href="/news"
              className="group text-xs font-bold uppercase tracking-[0.12em] text-ppa-blue hover:text-ppa-navy"
            >
              All News{" "}
              <span
                aria-hidden
                className="inline-block transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {related.map((r, i) => (
              <Link
                key={r.slug}
                href={`/news/${r.slug}`}
                data-reveal
                style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}
                className="group relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden bg-ppa-navy"
              >
                <Image
                  src={r.image}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 scrim-card" />
                <div className="relative p-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-sky">
                    {r.category} · {r.date}
                  </p>
                  <p className="mt-1 font-display text-base uppercase leading-[1.1]">
                    {r.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
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
