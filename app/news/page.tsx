import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { ecosystemNews } from "@/lib/home-content";
import { newsCategories, newsPage, type NewsCard } from "@/lib/news";

const PAGE_SIZE = 24;

type Search = { searchParams: Promise<{ page?: string; category?: string }> };

export async function generateMetadata({ searchParams }: Search): Promise<Metadata> {
  const { page } = await searchParams;
  const n = Number(page) || 1;
  return {
    title: n > 1 ? `Newsroom — Page ${n}` : "Newsroom",
    description:
      "PPA Tour news — results, analysis, rankings moves, and storylines from the pro pickleball tour.",
  };
}

/** Preserves the active category when paging. */
function pageHref(page: number, category: string | null): string {
  const q = new URLSearchParams();
  if (category) q.set("category", category);
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `/news?${s}` : "/news";
}

/**
 * 799 of the 811 migrated posts carry a featured image, so photography is the
 * normal case here and the missing-image state has to be deliberate rather
 * than a broken frame: the card keeps its navy field and the type simply sits
 * on it.
 */
function CardImage({
  card,
  sizes,
  priority = false,
  scrim = "scrim-card",
}: {
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

function Eyebrow({ card, tone = "sky" }: { card: NewsCard; tone?: "sky" | "blue" }) {
  return (
    <p
      className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
        tone === "sky" ? "text-ppa-sky" : "text-ppa-blue"
      }`}
    >
      {card.category} <span className="text-white/40">·</span> {card.displayDate}
    </p>
  );
}

export default async function NewsPage({ searchParams }: Search) {
  const sp = await searchParams;
  const categories = newsCategories();
  /**
   * The Race / Junior / Highlights each hold a single hand-written article, and
   * as chips they wrapped the filter row onto a second line for no browsing
   * value. Hidden from the row, still reachable by URL and still counted in the
   * feed — a one-story section isn't a section yet.
   */
  const chipCategories = categories.filter((c) => c.count >= 3);
  // Only honor a category that actually exists, so a junk query param falls
  // back to the full feed instead of rendering an empty archive.
  const active =
    categories.find((c) => c.category.toLowerCase() === (sp.category ?? "").toLowerCase())
      ?.category ?? null;

  const feed = newsPage({ page: Number(sp.page) || 1, pageSize: PAGE_SIZE, category: active });
  const onFirstPage = feed.page === 1;

  // The lead + two-up treatment marks the top of the feed; deeper pages are a
  // straight list so "lead story" keeps meaning "newest".
  const [lead, secondA, secondB, ...rest] = onFirstPage ? feed.items : [];
  const seconds = [secondA, secondB].filter(Boolean) as NewsCard[];
  const list = onFirstPage ? rest : feed.items;

  const from = (feed.page - 1) * feed.pageSize + 1;
  const to = Math.min(feed.page * feed.pageSize, feed.total);
  const total = newsPage({ pageSize: 1 }).total;

  return (
    <>
      {/* Masthead */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 pb-6 pt-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              Newsroom
            </p>
          </div>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
              {active ?? "The Latest from the PPA Tour"}
            </h1>
            <p className="max-w-sm text-sm text-ppa-navy/55 sm:text-right">
              Tournament recaps, analysis, player profiles, and the race to the
              PPA Finals — every storyline shaping the Carvana PPA Tour.
            </p>
          </div>

          {/* Section chips — plain links, so filtering needs no client JS. */}
          <div className="mt-6 flex flex-wrap items-center gap-1.5">
            <Link
              href="/news"
              className={`flex h-9 items-center border px-3 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                active
                  ? "border-ppa-line bg-white text-ppa-navy hover:border-ppa-blue hover:text-ppa-blue"
                  : "border-ppa-navy bg-ppa-navy text-white"
              }`}
            >
              All
              <span className={`ml-1.5 ${active ? "text-ppa-navy/35" : "text-white/50"}`}>
                {total.toLocaleString()}
              </span>
            </Link>
            {chipCategories.map((c) => {
              const on = active === c.category;
              return (
                <Link
                  key={c.category}
                  href={pageHref(1, c.category)}
                  className={`flex h-9 items-center border px-3 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                    on
                      ? "border-ppa-navy bg-ppa-navy text-white"
                      : "border-ppa-line bg-white text-ppa-navy hover:border-ppa-blue hover:text-ppa-blue"
                  }`}
                >
                  {c.category}
                  <span className={`ml-1.5 ${on ? "text-white/50" : "text-ppa-navy/35"}`}>
                    {c.count}
                  </span>
                </Link>
              );
            })}
            <span className="ml-auto text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/40">
              {feed.totalPages > 1
                ? `${from}–${to} of ${feed.total.toLocaleString()}`
                : `${feed.total.toLocaleString()} ${feed.total === 1 ? "Story" : "Stories"}`}
            </span>
          </div>
        </div>
      </section>

      {/* Lead + two-up */}
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
                <Eyebrow card={lead} />
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

            {seconds.length > 0 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {seconds.map((c, i) => (
                  <Link
                    key={`${c.source}-${c.slug}`}
                    href={c.href}
                    data-reveal
                    style={{ "--reveal-delay": `${(i + 1) * 80}ms` } as React.CSSProperties}
                    className="group relative isolate flex aspect-16/10 flex-col justify-end overflow-hidden bg-ppa-navy"
                  >
                    <CardImage card={c} sizes="(min-width: 640px) 50vw, 100vw" />
                    <div className="relative p-4 text-white sm:p-5">
                      <Eyebrow card={c} />
                      <h3 className="mt-1.5 font-display text-lg uppercase leading-[1.1] transition-colors group-hover:text-ppa-sky sm:text-xl">
                        {c.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* The rest of the feed + sidebar */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-10">
          <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 bg-ppa-blue" />
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/45">
                  {onFirstPage ? "More Coverage" : `Page ${feed.page} of ${feed.totalPages}`}
                </p>
              </div>

              <div className="mt-3 flex flex-col">
                {list.map((n, i) => (
                  <Link
                    key={`${n.source}-${n.slug}`}
                    href={n.href}
                    data-reveal
                    style={{ "--reveal-delay": `${Math.min(i, 6) * 50}ms` } as React.CSSProperties}
                    className="group flex items-start gap-4 border-t border-ppa-line py-4 last:border-b"
                  >
                    <span className="relative aspect-4/3 w-24 shrink-0 overflow-hidden bg-ppa-navy sm:w-32">
                      <CardImage card={n} sizes="(min-width: 640px) 128px, 96px" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-blue">
                        {n.category}
                        <span className="text-ppa-navy/30"> · </span>
                        <span className="text-ppa-navy/45">{n.displayDate}</span>
                      </span>
                      <span className="mt-1 block font-display text-base uppercase leading-[1.12] text-ppa-navy transition-colors group-hover:text-ppa-blue">
                        {n.title}
                      </span>
                      {n.dek && (
                        <span className="mt-1 line-clamp-2 hidden text-[13px] leading-relaxed text-ppa-navy/55 sm:block">
                          {n.dek}
                        </span>
                      )}
                      <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-ppa-navy/35">
                        {n.author}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>

              {list.length === 0 && (
                <p className="mt-6 border border-ppa-line bg-ppa-paper px-4 py-12 text-center text-sm text-ppa-navy/55">
                  Nothing else in this section yet.
                </p>
              )}

              {/* Pagination */}
              {feed.totalPages > 1 && (
                <nav
                  aria-label="Newsroom pagination"
                  className="mt-8 flex items-center justify-between gap-4"
                >
                  {feed.page > 1 ? (
                    <Link
                      href={pageHref(feed.page - 1, active)}
                      className="flex h-10 items-center border border-ppa-line px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy transition hover:border-ppa-blue hover:text-ppa-blue"
                    >
                      ← Newer
                    </Link>
                  ) : (
                    <span />
                  )}
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/40">
                    Page {feed.page} / {feed.totalPages}
                  </span>
                  {feed.page < feed.totalPages ? (
                    <Link
                      href={pageHref(feed.page + 1, active)}
                      className="flex h-10 items-center border border-ppa-line px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy transition hover:border-ppa-blue hover:text-ppa-blue"
                    >
                      Older →
                    </Link>
                  ) : (
                    <span />
                  )}
                </nav>
              )}
            </div>

            {/* Sidebar — sticky on wide screens (same pattern as the article
                page's players rail); a 24-story list otherwise leaves it
                stranded at the top of a very long column. */}
            <aside className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 bg-ppa-blue" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/45">
                    From Pickleball.com
                  </p>
                </div>
                <div className="mt-3 flex flex-col gap-px border border-ppa-line bg-ppa-line">
                  {ecosystemNews.map((e) => (
                    <a
                      key={e.title}
                      href={e.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2 bg-white p-4 transition-colors hover:bg-ppa-paper"
                    >
                      <span className="flex-1">
                        <span className="block text-sm font-semibold leading-snug text-ppa-navy transition-colors group-hover:text-ppa-blue">
                          {e.title}
                        </span>
                        <span className="mt-1 block text-[11px] uppercase tracking-[0.1em] text-ppa-navy/40">
                          {e.date}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className="text-ppa-navy/30 transition-colors group-hover:text-ppa-blue"
                      >
                        ↗
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              <div className="border border-ppa-line bg-ppa-paper p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/45">
                  The Archive
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ppa-navy/60">
                  Every recap, draw reveal, and feature the tour has published —{" "}
                  {total.toLocaleString()} stories going back to 2023.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {categories.slice(0, 4).map((c) => (
                    <Link
                      key={c.category}
                      href={pageHref(1, c.category)}
                      className="flex h-8 items-center border border-ppa-line bg-white px-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ppa-navy transition-colors hover:border-ppa-blue hover:text-ppa-blue"
                    >
                      {c.category}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Email capture */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="streaming" />
        </div>
      </section>
    </>
  );
}
