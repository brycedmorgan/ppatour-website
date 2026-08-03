import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import {
  getPickleballNews,
  getPickleballNewsPage,
  pbArticleDate,
  type PbArticle,
} from "@/lib/pb-news";
import { newsCategories, newsPage, searchNews, type NewsCard } from "@/lib/news";

/**
 * ⚠ No ISR here, deliberately. This page reads `searchParams` (page, category,
 * q, source), which makes it dynamic no matter what `revalidate` says — a
 * revalidate export would just be a comment that lies. The individual article
 * pages ARE prerendered, and /api/search is CDN-cached, so the expensive parts
 * are covered.
 */
const PAGE_SIZE = 24;

type Search = {
  searchParams: Promise<{ page?: string; category?: string; q?: string; source?: string }>;
};

/** Value of ?source= that switches the feed to pickleball.com's PPA archive. */
const PB_SOURCE = "pickleball";

export async function generateMetadata({ searchParams }: Search): Promise<Metadata> {
  const { page, q } = await searchParams;
  const n = Number(page) || 1;
  const query = (q ?? "").trim();
  return {
    title: query
      ? `“${query}” — Newsroom Search`
      : n > 1
        ? `Newsroom — Page ${n}`
        : "Newsroom",
    description:
      "PPA Tour news — results, analysis, rankings moves, and storylines from the pro pickleball tour.",
    // Search result pages are thin, infinite in number, and duplicate content
    // that is already indexed at its own URL — keep crawlers on the articles.
    robots: query ? { index: false, follow: true } : undefined,
  };
}

/** Preserves the active category and query when paging or switching sections. */
function pageHref(page: number, category: string | null, query = "", source = ""): string {
  const p = new URLSearchParams();
  if (source) p.set("source", source);
  if (category) p.set("category", category);
  if (query) p.set("q", query);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
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

  /**
   * ?source=pickleball turns the feed into pickleball.com's PPA archive — all
   * 1,444 of their tour articles, paginated, instead of the four that interleave
   * into our own feed. Their bodies aren't ours to index, so this mode ignores a
   * search query rather than pretending to search them.
   */
  const pbMode = (sp.source ?? "") === PB_SOURCE;
  const pbFeed = pbMode ? await getPickleballNewsPage(Number(sp.page) || 1, PAGE_SIZE) : null;

  const query = (sp.q ?? "").trim();
  const feed = searchNews({
    query,
    page: Number(sp.page) || 1,
    pageSize: PAGE_SIZE,
    category: active,
  });
  const searching = query.length > 0 && !pbMode;
  // While searching, the lead + two-up are suppressed and the whole feed becomes
  // ranked results. Keeping them would hide the three best matches behind an
  // unrelated "newest story" treatment.
  // No lead treatment in pickleball.com mode — the hero slots are for our own
  // reporting, not a partner feed.
  const onFirstPage = feed.page === 1 && !searching && !pbMode;

  // The lead + two-up treatment marks the top of the feed; deeper pages are a
  // straight list so "lead story" keeps meaning "newest".
  const [lead, secondA, secondB, ...rest] = onFirstPage ? feed.items : [];
  const seconds = [secondA, secondB].filter(Boolean) as NewsCard[];
  const list = onFirstPage ? rest : feed.items;

  const from = (feed.page - 1) * feed.pageSize + 1;
  const to = Math.min(feed.page * feed.pageSize, feed.total);
  const total = newsPage({ pageSize: 1 }).total;

  /**
   * Live pickleball.com coverage. Interleaved into the feed AND given its own
   * rail, both clearly marked as another site and linking out. Returns an empty
   * list until the API grant lands, in which case nothing below renders — the
   * items this replaced were invented headlines.
   */
  const pbNews = await getPickleballNews(searching || pbMode ? 0 : 8);
  const external = pbNews.articles;
  /**
   * Whether to offer the filter at all — derived from the feed already fetched
   * rather than a second probe. A denied or unreachable feed simply has no chip
   * instead of one that leads to an empty page.
   */
  const pbAvailable = pbMode
    ? pbFeed?.source === "live" && (pbFeed?.total ?? 0) > 0
    : pbNews.source === "live" && external.length > 0;

  /**
   * Split so both surfaces get distinct articles rather than repeating four
   * headlines twice: the newest four interleave into the feed by date, the rest
   * fill the sidebar rail. Capped at four in the feed so external coverage never
   * outweighs our own reporting on our own newsroom.
   *
   * Excluded entirely while searching — /search and /news search our archive by
   * body text, and pickleball.com bodies aren't ours to index, so a query would
   * silently miss them and the results would be misleading.
   */
  /**
   * Drop pickleball.com articles that duplicate a story we already published.
   * They cover the PPA too, so the same press release lands on both sites — the
   * first live render put "Professional Pickleball Association Announces PPA
   * Spain" from pickleball.com directly above our own post on it.
   *
   * Significant-word overlap rather than exact match, because the two headlines
   * are rarely identical (ours ran with a longer subhead). Compared against the
   * whole current feed page, and only when the words genuinely coincide.
   */
  const significantWords = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3),
    );
  const ourTitleSets = list.map((c) => significantWords(c.title));
  const isDuplicateOfOurs = (title: string) => {
    const words = [...significantWords(title)];
    if (words.length < 3) return false;
    return ourTitleSets.some((ours) => {
      const shared = words.filter((w) => ours.has(w)).length;
      return shared / words.length >= 0.7;
    });
  };

  const deduped = external.filter((a) => !isDuplicateOfOurs(a.title));
  const feedExternal = deduped.slice(0, 4);
  const railExternal = deduped.slice(4, 8);

  type FeedRow =
    | { kind: "ppa"; card: NewsCard; at: string }
    | { kind: "external"; article: PbArticle; at: string };

  const merged: FeedRow[] = pbMode
    ? (pbFeed?.articles ?? []).map((article): FeedRow => ({
        kind: "external",
        article,
        at: article.publishedAt,
      }))
    : [
    ...list.map((card): FeedRow => ({ kind: "ppa", card, at: card.publishedAt })),
    ...feedExternal.map((article): FeedRow => ({ kind: "external", article, at: article.publishedAt })),
      ].sort((a, b) => {
        // Undated external rows sort last rather than jumping to the top.
        if (!a.at) return 1;
        if (!b.at) return -1;
        return b.at.localeCompare(a.at);
      });

  // Pagination + counts read from whichever feed is driving the page.
  const shownPage = pbMode ? (pbFeed?.page ?? 1) : feed.page;
  const shownTotalPages = pbMode ? (pbFeed?.totalPages ?? 1) : feed.totalPages;
  const shownTotal = pbMode ? (pbFeed?.total ?? 0) : feed.total;

  return (
    <>
      {/* Masthead */}
      <section className="relative isolate overflow-hidden bg-ppa-navy text-white">
        {/* Decorative only, so no alt text. quality={65} because the photo sits
            under a heavy scrim as texture — the detail is not perceivable and
            65/75 are the only qualities allowlisted in next.config. */}
        <Image
          src="/ppa/nationals-hero.jpg"
          alt=""
          fill
          priority
          quality={65}
          sizes="100vw"
          className="object-cover object-[center_60%]"
        />
        <div className="absolute inset-0 scrim-masthead" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-6 pt-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
              Newsroom
            </p>
          </div>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
              {pbMode ? "From Pickleball.com" : (active ?? "The Latest from the PPA Tour")}
            </h1>
            <p className="max-w-sm text-sm text-white/65 sm:text-right">
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
                  ? "border-white/25 bg-white/10 text-white hover:border-white/60 hover:bg-white/20"
                  : "border-white bg-white text-ppa-navy"
              }`}
            >
              All
              <span className={`ml-1.5 ${active ? "text-white/45" : "text-ppa-navy/40"}`}>
                {total.toLocaleString()}
              </span>
            </Link>
            {/* Their archive, as its own filter. Marked with the lockup so it
                never reads as our reporting; only shown once the feed answers. */}
            {pbAvailable && (
              <Link
                href={pageHref(1, null, "", PB_SOURCE)}
                className={`flex h-9 items-center gap-1.5 border px-3 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                  pbMode
                    ? "border-white bg-white text-ppa-navy"
                    : "border-white/25 bg-white/10 text-white hover:border-white/60 hover:bg-white/20"
                }`}
              >
                <Image
                  src={
                    pbMode
                      ? "/ppa/ecosystem/pickleball-com-mark.svg"
                      : "/ppa/ecosystem/pickleball-com-mark-white.svg"
                  }
                  alt=""
                  width={13}
                  height={9}
                />
                Pickleball.com
                {pbMode && pbFeed && (
                  <span className="text-ppa-navy/40">{pbFeed.total.toLocaleString()}</span>
                )}
              </Link>
            )}
            {chipCategories.map((c) => {
              const on = active === c.category;
              return (
                <Link
                  key={c.category}
                  href={pageHref(1, c.category, query)}
                  className={`flex h-9 items-center border px-3 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                    on
                      ? "border-white bg-white text-ppa-navy"
                      : "border-white/25 bg-white/10 text-white hover:border-white/60 hover:bg-white/20"
                  }`}
                >
                  {c.category}
                  <span className={`ml-1.5 ${on ? "text-ppa-navy/40" : "text-white/45"}`}>
                    {c.count}
                  </span>
                </Link>
              );
            })}
            <span className="ml-auto text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">
              {shownTotalPages > 1
                ? `${(shownPage - 1) * PAGE_SIZE + 1}–${Math.min(shownPage * PAGE_SIZE, shownTotal)} of ${shownTotal.toLocaleString()}`
                : `${shownTotal.toLocaleString()} ${shownTotal === 1 ? "Story" : "Stories"}`}
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 bg-ppa-blue" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/45">
                    {pbMode
                      ? "PPA Coverage on Pickleball.com"
                      : searching
                        ? "Search Results"
                        : onFirstPage
                          ? "More Coverage"
                          : `Page ${feed.page} of ${feed.totalPages}`}
                  </p>
                </div>

                {/* A plain GET form: the archive search is server-side, so it
                    costs no client JS and survives a shared or bookmarked URL.
                    The hidden field keeps a section filter applied while
                    searching within it. */}
                {!pbMode && (
                <form method="get" action="/news" role="search" className="flex items-center gap-1.5">
                  {active && <input type="hidden" name="category" value={active} />}
                  <label htmlFor="news-q" className="sr-only">
                    Search {active ?? "all"} coverage
                  </label>
                  <input
                    id="news-q"
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Search keywords, players, tags…"
                    className="h-9 w-full min-w-0 border border-ppa-line bg-white px-3 text-[13px] text-ppa-navy outline-none transition-colors placeholder:text-ppa-navy/35 focus:border-ppa-blue sm:w-60"
                  />
                  <button
                    type="submit"
                    className="flex h-9 shrink-0 items-center bg-ppa-navy px-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-ppa-blue"
                  >
                    Search
                  </button>
                </form>
                )}
              </div>

              {searching && (
                <p className="mt-3 text-[13px] text-ppa-navy/60">
                  <span className="font-bold text-ppa-navy">
                    {feed.total.toLocaleString()}
                  </span>{" "}
                  {feed.total === 1 ? "result" : "results"} for{" "}
                  <span className="font-bold text-ppa-navy">“{query}”</span>
                  {active && <> in {active}</>}
                  {" · "}
                  <Link
                    href={active ? pageHref(1, active) : "/news"}
                    className="font-bold text-ppa-blue hover:underline"
                  >
                    Clear search
                  </Link>
                </p>
              )}

              <div className="mt-3 flex flex-col">
                {merged.map((row, i) =>
                  row.kind === "ppa" ? (
                    <Link
                      key={`${row.card.source}-${row.card.slug}`}
                      href={row.card.href}
                      data-reveal
                      style={{ "--reveal-delay": `${Math.min(i, 6) * 50}ms` } as React.CSSProperties}
                      className="group flex items-start gap-4 border-t border-ppa-line py-4 last:border-b"
                    >
                      <span className="relative aspect-4/3 w-24 shrink-0 overflow-hidden bg-ppa-navy sm:w-32">
                        <CardImage card={row.card} sizes="(min-width: 640px) 128px, 96px" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-blue">
                          {row.card.category}
                          <span className="text-ppa-navy/30"> · </span>
                          <span className="text-ppa-navy/45">{row.card.displayDate}</span>
                        </span>
                        <span className="mt-1 block font-display text-base uppercase leading-[1.12] text-ppa-navy transition-colors group-hover:text-ppa-blue">
                          {row.card.title}
                        </span>
                        {row.card.dek && (
                          <span className="mt-1 line-clamp-2 hidden text-[13px] leading-relaxed text-ppa-navy/55 sm:block">
                            {row.card.dek}
                          </span>
                        )}
                        <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-ppa-navy/35">
                          {row.card.author}
                        </span>
                      </span>
                    </Link>
                  ) : (
                    /* pickleball.com article — a plain <a> to the original, on a
                       tinted row with the mark, so it never reads as our story. */
                    <a
                      key={`pb-${row.article.url}`}
                      href={row.article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-reveal
                      style={{ "--reveal-delay": `${Math.min(i, 6) * 50}ms` } as React.CSSProperties}
                      className="group flex items-start gap-4 border-t border-ppa-line bg-ppa-paper/60 py-4 pl-2 pr-2 transition-colors last:border-b hover:bg-ppa-paper"
                    >
                      <span className="relative aspect-4/3 w-24 shrink-0 overflow-hidden bg-ppa-navy sm:w-32">
                        {row.article.imageUrl ? (
                          <Image
                            src={row.article.imageUrl}
                            alt={row.article.imageAlt}
                            fill
                            sizes="(min-width: 640px) 128px, 96px"
                            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center bg-ppa-navy-deep p-3">
                            <Image
                              src="/ppa/ecosystem/pickleball-com-mark-white.svg"
                              alt=""
                              width={40}
                              height={28}
                              className="opacity-70"
                            />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          {/* Lockup + ".com" kept tight so the brand reads as one
                              word rather than "PICKLEBALL .COM". */}
                          <span className="flex shrink-0 items-baseline">
                            <Image
                              src="/ppa/ecosystem/pickleball-com-lockup.svg"
                              alt="Pickleball.com"
                              width={78}
                              height={15}
                            />
                            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-ppa-navy/45">
                              .com
                            </span>
                          </span>
                          {row.article.publishedAt && (
                            <>
                              <span className="text-ppa-navy/30">·</span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45">
                                {pbArticleDate(row.article.publishedAt)}
                              </span>
                            </>
                          )}
                        </span>
                        <span className="mt-1 block font-display text-base uppercase leading-[1.12] text-ppa-navy transition-colors group-hover:text-ppa-blue">
                          {row.article.title}
                          <span aria-hidden className="ml-1 text-ppa-navy/40">
                            ↗
                          </span>
                        </span>
                        {row.article.excerpt && (
                          <span className="mt-1 line-clamp-2 hidden text-[13px] leading-relaxed text-ppa-navy/55 sm:block">
                            {row.article.excerpt}
                          </span>
                        )}
                        <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-ppa-navy/35">
                          Reads on Pickleball.com
                        </span>
                      </span>
                    </a>
                  ),
                )}
              </div>

              {/* Tests the rendered array, not `list` — otherwise a page whose
                  only rows are pickleball.com articles would show "nothing
                  here" directly above them. */}
              {merged.length === 0 && (
                <div className="mt-6 border border-ppa-line bg-ppa-paper px-4 py-12 text-center">
                  {searching ? (
                    <>
                      <p className="text-sm font-semibold text-ppa-navy">
                        No stories match “{query}”{active && <> in {active}</>}.
                      </p>
                      <p className="mt-1.5 text-sm text-ppa-navy/55">
                        Try a player name, a venue, or a single keyword.
                        {active && (
                          <>
                            {" "}
                            <Link
                              href={pageHref(1, null, query)}
                              className="font-bold text-ppa-blue hover:underline"
                            >
                              Search all sections
                            </Link>
                            .
                          </>
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-ppa-navy/55">Nothing else in this section yet.</p>
                  )}
                </div>
              )}

              {/* Pagination */}
              {shownTotalPages > 1 && (
                <nav
                  aria-label="Newsroom pagination"
                  className="mt-8 flex items-center justify-between gap-4"
                >
                  {shownPage > 1 ? (
                    <Link
                      href={pageHref(shownPage - 1, active, query, pbMode ? PB_SOURCE : "")}
                      className="flex h-10 items-center border border-ppa-line px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy transition hover:border-ppa-blue hover:text-ppa-blue"
                    >
                      ← Newer
                    </Link>
                  ) : (
                    <span />
                  )}
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/40">
                    Page {shownPage} / {shownTotalPages}
                  </span>
                  {shownPage < shownTotalPages ? (
                    <Link
                      href={pageHref(shownPage + 1, active, query, pbMode ? PB_SOURCE : "")}
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
              {/* Live pickleball.com coverage, marked with their lockup and
                  linking out. Renders only when the feed answers — the four
                  items this replaced were invented headlines pointing at the
                  pickleball.com homepage, and an empty rail beats fake copy. */}
              {railExternal.length > 0 && (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-ppa-blue" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/45">
                      More From
                    </p>
                    <Image
                      src="/ppa/ecosystem/pickleball-com-lockup.svg"
                      alt="Pickleball.com"
                      width={86}
                      height={16}
                    />
                  </div>
                  <div className="mt-3 flex flex-col gap-px border border-ppa-line bg-ppa-line">
                    {railExternal.map((a) => (
                      <a
                        key={a.url}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-2 bg-white p-4 transition-colors hover:bg-ppa-paper"
                      >
                        <span className="flex-1">
                          <span className="block text-sm font-semibold leading-snug text-ppa-navy transition-colors group-hover:text-ppa-blue">
                            {a.title}
                          </span>
                          <span className="mt-1 block text-[11px] uppercase tracking-[0.1em] text-ppa-navy/40">
                            {pbArticleDate(a.publishedAt) || "Pickleball.com"}
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
              )}

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
                      href={pageHref(1, c.category, query)}
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
