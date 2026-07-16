import type { Metadata } from "next";
import Link from "next/link";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { ecosystemNews, news } from "@/lib/home-content";

export const metadata: Metadata = {
  title: "Newsroom",
  description:
    "PPA Tour news — results, analysis, rankings moves, and storylines from the pro pickleball tour.",
};

export default function NewsPage() {
  const [featured, second, ...rest] = news;

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
            The Latest from the PPA Tour
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ppa-navy/55">
            Recaps, analysis, athlete profiles, and the race report —
            every storyline shaping the 2026 season.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
            {/* Main column — featured + list */}
            <div>
              {/* Featured */}
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
                <p className="mt-3 text-[11px] uppercase tracking-[0.1em] text-ppa-navy/45">
                  PPA Tour · {featured.date}
                </p>
              </Link>

              {/* Secondary feature */}
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
                  PPA Tour · {second.date}
                </p>
              </Link>

              {/* List */}
              <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/45">
                More Coverage
              </p>
              <div className="mt-2 border-t border-ppa-line">
                {rest.map((n) => (
                  <Link
                    key={n.title}
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
                        PPA Tour · {n.date}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
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
                  {["Recap", "Analysis", "Feature", "Tour News", "Profile"].map(
                    (c) => (
                      <li key={c}>
                        <Link
                          href="/news"
                          className="text-sm font-semibold text-ppa-navy hover:text-ppa-blue"
                        >
                          {c}
                        </Link>
                      </li>
                    ),
                  )}
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
