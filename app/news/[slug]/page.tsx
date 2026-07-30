import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { athletes, type Athlete } from "@/lib/athletes";
import {
  allNews,
  getNewsDetail,
  newsPlayersFor,
  relatedNews,
  type NewsPlayer,
} from "@/lib/news";
import { renderPostHtml, readingMinutes } from "@/lib/news-html";
import { playerInitials } from "@/lib/player-photos";
import { getNextTournament } from "@/lib/placeholder-data";
import { getRankingBySlug } from "@/lib/rankings-api";
import { withUtm } from "@/lib/utm";

type Params = { params: Promise<{ slug: string }> };

/**
 * All 826 posts (15 native + 811 migrated) are prerendered. `dynamicParams`
 * stays at its default so an unknown slug still 404s via notFound().
 */
export function generateStaticParams() {
  return allNews().map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const detail = getNewsDetail(slug);
  if (!detail) return { title: "News" };
  const { card } = detail;
  // Migrated posts carry their Yoast title/description, so search snippets
  // survive the move instead of being regenerated.
  const seo = detail.source === "wordpress" ? detail.post.seo : null;
  const title = seo?.title?.trim() || card.title;
  const description = seo?.description?.trim() || card.dek;
  return {
    title: card.title,
    description,
    openGraph: {
      title,
      description,
      images: card.image ? [card.image] : undefined,
      type: "article",
      publishedTime: card.publishedAt,
      authors: [card.author],
    },
    twitter: { card: "summary_large_image", images: card.image ? [card.image] : undefined },
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
  const detail = getNewsDetail(slug);
  if (!detail) notFound();

  const { card } = detail;
  const related = relatedNews(card.slug, card.category, 3);
  const next = getNextTournament();
  const featured: NewsPlayer[] = newsPlayersFor(detail);
  // Live WPR rank for the "Players in This Story" rail. Was `bestRank`, a
  // hand-maintained career-best that's stale for most of the roster — that's
  // how the same pro could read No. 3 here and No. 36 on their own profile
  // (Connor, 7/29: "rankings different on different pages").
  const liveRanks = await getRankingBySlug();

  // Native articles keep the React-node linkifier over their paragraph array;
  // migrated posts go through the HTML-safe path in lib/news-html.ts.
  const curatedForLinkify =
    detail.source === "native"
      ? athletes.filter((p) => featured.some((f) => f.slug === p.slug))
      : [];
  const bodyHtml =
    detail.source === "wordpress"
      ? renderPostHtml(
          detail.post.bodyHtml,
          featured.map((p) => ({ name: p.name, slug: p.slug })),
        )
      : "";
  const minutes = detail.source === "wordpress" ? readingMinutes(detail.post.bodyHtml) : null;
  const tags = detail.source === "wordpress" ? detail.post.tags : [];

  return (
    <>
      {/* Article hero */}
      <section className="relative isolate flex min-h-[44svh] flex-col justify-end overflow-hidden bg-ppa-navy text-white">
        {card.image && (
          <Image
            src={card.image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        )}
        <div className={`absolute inset-0 ${card.image ? "scrim-hero" : "bg-ppa-navy-deep"}`} />
        <div className="relative mx-auto w-full max-w-3xl px-4 pb-9 pt-24">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.16em] motion-safe:animate-rise">
            <span className="bg-ppa-blue px-2 py-0.5">{card.category}</span>
            <span className="text-white/70">{card.displayDate}</span>
            <span className="text-white/25">/</span>
            <span className="text-white/70">{card.author}</span>
            {minutes !== null && (
              <>
                <span className="text-white/25">/</span>
                <span className="text-white/70">{minutes} min read</span>
              </>
            )}
          </div>
          <h1
            className="mt-3 font-display text-[clamp(1.6rem,4.4vw,2.6rem)] uppercase leading-[1.02] motion-safe:animate-rise"
            style={{ animationDelay: "120ms" }}
          >
            {card.title}
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
            {card.dek && (
              <p className="text-lg leading-relaxed text-ppa-navy/80">
                {detail.source === "native"
                  ? linkifyPlayers(card.dek, curatedForLinkify)
                  : card.dek}
              </p>
            )}

            {detail.source === "native" && (
              <div className="mt-4 border-l-4 border-ppa-blue bg-ppa-paper p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppa-blue">
                  Why It Matters
                </p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-ppa-navy">
                  {detail.article.whyItMatters}
                </p>
              </div>
            )}

            {detail.source === "native" ? (
              <div className="mt-7 space-y-5">
                {detail.article.body.map((p, i) => (
                  <p key={i} className="text-[15px] leading-[1.75] text-ppa-navy/75">
                    {linkifyPlayers(p, curatedForLinkify)}
                  </p>
                ))}
              </div>
            ) : (
              /* Sanitized in lib/news-html.ts: tag/attribute allowlist, no
                 scripts or handlers, iframes restricted to known embed hosts. */
              <div
                className="mt-7 space-y-5 [&>*+*]:mt-5"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            )}

            {tags.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-ppa-line pt-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppa-navy/45">
                  Topics
                </span>
                {tags.map((t) => (
                  <span
                    key={t}
                    className="bg-ppa-paper px-2 py-1 text-[11px] font-semibold text-ppa-navy/70"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-9 flex flex-wrap gap-2.5 border-t border-ppa-line pt-6">
              <a
                href={withUtm(next.ticketsUrl, {
                  campaign: next.slug,
                  content: `article-${card.slug}`,
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
                      <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ppa-navy-deep">
                        {p.headshot ? (
                          <Image
                            src={p.headshot}
                            alt={p.name}
                            fill
                            sizes="44px"
                            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          /* The majority state below the curated roster — a
                             designed initials chip, not a broken image slot. */
                          <span className="font-display text-xs uppercase tracking-wide text-ppa-sky">
                            {playerInitials(p.name)}
                          </span>
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-display text-sm uppercase leading-tight text-ppa-navy transition-colors group-hover:text-ppa-blue">
                          {p.name}
                        </span>
                        {/* Rank comes from the live WPR board, never from
                            `bestRank` — see the note where liveRanks is built.
                            Falls back to the division alone when a player isn't
                            on the board (common for the archive's deeper names). */}
                        {(liveRanks[p.slug] || p.division) && (
                          <span className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-ppa-blue">
                            {liveRanks[p.slug] ? `No. ${liveRanks[p.slug].rank} · ` : ""}
                            {p.division}
                          </span>
                        )}
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
                href={r.href}
                data-reveal
                style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}
                className="group relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden bg-ppa-navy"
              >
                {r.image && (
                  <Image
                    src={r.image}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className={`absolute inset-0 ${r.image ? "scrim-card" : "bg-ppa-navy-deep"}`} />
                <div className="relative p-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-sky">
                    {r.category} · {r.displayDate}
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
