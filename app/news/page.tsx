import type { Metadata } from "next";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { ecosystemNews } from "@/lib/home-content";
import { newsCategories, newsPage } from "@/lib/news";

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

export default async function NewsPage({ searchParams }: Search) {
  const sp = await searchParams;
  const categories = newsCategories();
  // Only honor a category that actually exists, so a junk query param falls
  // back to the full feed instead of rendering an empty archive.
  const active =
    categories.find((c) => c.category.toLowerCase() === (sp.category ?? "").toLowerCase())
      ?.category ?? null;

  const feed = newsPage({ page: Number(sp.page) || 1, pageSize: PAGE_SIZE, category: active });
  const onFirstPage = feed.page === 1;

  // The lead treatment only makes sense at the top of the feed; deeper pages
  // are a straight list.
  const [featured, second, ...rest] = onFirstPage ? feed.items : [];
  const list = onFirstPage ? rest : feed.items;

  const from = (feed.page - 1) * feed.pageSize + 1;
  const to = Math.min(feed.page * feed.pageSize, feed.total);

  return (
    <>
      {/* Header */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              Newsroom
            </p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
            {active ?? "The Latest from the PPA Tour"}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
            Tournament recaps, analysis, player profiles, and the race to the
            PPA Finals — every storyline shaping the Carvana PPA Tour.
          </p>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/40">
            {feed.total.toLocaleString()} {active ? `${active} stories` : "stories"}
            {feed.totalPages > 1 && ` · showing ${from}–${to}`}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
            {/* Main column — featured + list */}
            <div>
              {featured && (
                <Link
                  href={featured.href}
                  className="group block border border-ppa-line bg-ppa-paper p-6 transition-colors hover:bg-white sm:p-8"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-blue">
                    {featured.category} · Featured
                  </p>
                  <h2 className="mt-2 font-display text-2xl uppercase leading-[1.05] text-ppa-navy transition-colors group-hover:text-ppa-blue sm:text-3xl">
                    {featured.title}
                  </h2>
                  {featured.dek && (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ppa-navy/60">
                      {featured.dek}
                    </p>
                  )}
                  <p className="mt-3 text-[11px] uppercase tracking-[0.1em] text-ppa-navy/45">
                    {featured.author} · {featured.displayDate}
                  </p>
                </Link>
              )}

              {second && (
                <Link
                  href={second.href}
                  className="group mt-4 block border border-ppa-line bg-white p-5 transition-colors hover:bg-ppa-paper"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-blue">
                    {second.category}
                  </p>
                  <h3 className="mt-1 font-display text-lg uppercase leading-[1.1] text-ppa-navy transition-colors group-hover:text-ppa-blue sm:text-xl">
                    {second.title}
                  </h3>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-ppa-navy/45">
                    {second.author} · {second.displayDate}
                  </p>
                </Link>
              )}

              <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/45">
                {onFirstPage ? "More Coverage" : `Page ${feed.page} of ${feed.totalPages}`}
              </p>
              <div className="mt-2 border-t border-ppa-line">
                {list.map((n) => (
                  <Link
                    key={`${n.source}-${n.slug}`}
                    href={n.href}
                    className="group flex items-start gap-4 border-b border-ppa-line py-4"
                  >
                    <span className="w-20 shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-blue sm:w-24">
                      {n.category}
                    </span>
                    <span className="flex-1">
                      <span className="block font-display text-base uppercase leading-[1.12] text-ppa-navy transition-colors group-hover:text-ppa-blue">
                        {n.title}
                      </span>
                      <span className="mt-1 block text-[11px] uppercase tracking-[0.1em] text-ppa-navy/40">
                        {n.author} · {n.displayDate}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>

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

            {/* Sidebar */}
            <aside className="flex flex-col gap-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/45">
                  From Pickleball.com
                </p>
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
                  Sections
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  <li>
                    <Link
                      href="/news"
                      className={`text-sm font-semibold hover:text-ppa-blue ${
                        active ? "text-ppa-navy" : "text-ppa-blue"
                      }`}
                    >
                      All Coverage
                      <span className="ml-1.5 text-[11px] font-bold text-ppa-navy/35">
                        {newsPage({ pageSize: 1 }).total.toLocaleString()}
                      </span>
                    </Link>
                  </li>
                  {categories.map((c) => (
                    <li key={c.category}>
                      <Link
                        href={pageHref(1, c.category)}
                        className={`text-sm font-semibold hover:text-ppa-blue ${
                          active === c.category ? "text-ppa-blue" : "text-ppa-navy"
                        }`}
                      >
                        {c.category}
                        <span className="ml-1.5 text-[11px] font-bold text-ppa-navy/35">
                          {c.count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
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
