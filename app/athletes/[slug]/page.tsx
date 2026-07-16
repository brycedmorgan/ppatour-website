import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { athletes, getAthlete } from "@/lib/athletes";
import { divisionRankings } from "@/lib/home-content";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return athletes.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = getAthlete(slug);
  if (!a) return { title: "Athlete" };
  const description = `${a.tagline}. ${a.divisions.join(" · ")} · ${a.country}.`;
  return {
    title: a.name,
    description,
    openGraph: {
      title: `${a.name} — Carvana PPA Tour`,
      description: a.tagline,
      images: [a.headshot],
    },
    twitter: { card: "summary_large_image", images: [a.headshot] },
  };
}

export default async function AthletePage({ params }: Params) {
  const { slug } = await params;
  const a = getAthlete(slug);
  if (!a) notFound();

  // Where this athlete sits in the points race, by division.
  const standings = divisionRankings
    .map((d) => {
      const entry = d.entries.find((e) => e.slug === a.slug);
      return entry ? { division: d.label, rank: entry.rank, points: entry.points } : null;
    })
    .filter((x): x is { division: string; rank: number; points: number } => x !== null);

  const others = athletes.filter((x) => x.slug !== a.slug).slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: a.name,
            jobTitle: "Professional Pickleball Player",
            nationality: a.country,
            image: `${SITE_URL}${a.headshot}`,
            url: `${SITE_URL}/athletes/${a.slug}`,
            description: a.bio,
            memberOf: {
              "@type": "Organization",
              name: "Carvana PPA Tour",
              url: SITE_URL,
            },
          }),
        }}
      />
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ppa-navy text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[auto_1fr] sm:items-end sm:py-14">
          <div className="relative size-40 shrink-0 overflow-hidden border border-white/15 bg-ppa-navy-deep sm:size-48">
            <Image
              src={a.headshot}
              alt={a.name}
              fill
              priority
              sizes="192px"
              className="object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-ppa-blue" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.16em]">
              <span className="bg-ppa-blue px-2 py-0.5">No. {a.bestRank}</span>
              <span className="text-white/70">{a.country}</span>
            </div>
            <h1 className="mt-3 font-display text-[clamp(2rem,6vw,3.75rem)] uppercase leading-[0.95]">
              {a.name}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ppa-yellow sm:text-base">
              {a.tagline}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {a.divisions.map((d) => (
                <span
                  key={d}
                  className="border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/75"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="relative h-1 bg-ppa-blue" />
      </section>

      {/* Bio + standings */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Profile
              </p>
              <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                About {a.name}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                {a.bio}
              </p>
              <Link
                href="/watch"
                className="mt-6 inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
              >
                ▶ Watch {a.name.split(" ")[0]} Live
              </Link>
            </div>

            <aside>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                In the Points Race
              </p>
              <div className="mt-3 border border-ppa-line">
                <div className="grid grid-cols-[1fr_auto_5rem] gap-3 border-b border-ppa-line bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                  <span>Division</span>
                  <span className="text-right">Rank</span>
                  <span className="text-right">Points</span>
                </div>
                {standings.map((s) => (
                  <div
                    key={s.division}
                    className="grid grid-cols-[1fr_auto_5rem] items-center gap-3 border-b border-ppa-line bg-white px-4 py-3 last:border-b-0"
                  >
                    <span className="text-sm font-semibold text-ppa-navy">
                      {s.division}
                    </span>
                    <span className="text-right font-display text-lg text-ppa-blue">
                      {s.rank}
                    </span>
                    <span className="text-right text-sm font-bold tabular-nums text-ppa-navy/70">
                      {s.points.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/athletes"
                className="mt-4 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
              >
                ← All Athletes
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {/* More pros */}
      <section className="bg-ppa-navy-deep">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
            More Pros
          </p>
          <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-white sm:text-3xl">
            Follow the Field
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/athletes/${o.slug}`}
                className="group flex flex-col overflow-hidden border border-white/10 bg-ppa-navy"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={o.headshot}
                    alt={o.name}
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3 text-white">
                  <p className="font-display text-sm uppercase leading-tight transition-colors group-hover:text-ppa-sky">
                    {o.name}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ppa-sky">
                    No. {o.bestRank}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Email */}
      <section className="bg-ppa-navy">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <LeadMagnetCapture variant="fan" />
        </div>
      </section>
    </>
  );
}
