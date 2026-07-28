import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadMagnetCapture } from "@/components/global/LeadMagnetCapture";
import { athletes, getAthlete } from "@/lib/athletes";
import {
  ageFromDob,
  getPublishedAthlete,
  publishedAthletes,
  turnedProYear,
} from "@/lib/published-athletes";
import { curatedSlugFor, getWprPlayerBySlug, getWprRoster } from "@/lib/rankings-api";
import { getAthleteStats } from "@/lib/athlete-stats";
import { getDivisionRanks } from "@/lib/division-rankings";
import { getAthleteVideoData } from "@/lib/athlete-videos";
import { AthleteVideos } from "@/components/athletes/AthleteVideos";
import { resolveGear } from "@/lib/athlete-gear";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const roster = await getWprRoster().catch(() => []);
  const slugs = new Set(athletes.map((a) => a.slug));
  // Every published profile gets a page (keyed by its canonical slug, unless we
  // have a curated shorthand that collapses to the same person).
  for (const p of publishedAthletes) slugs.add(curatedSlugFor(p.slug) ?? p.slug);
  for (const p of roster) slugs.add(curatedSlugFor(p.slug) ?? p.slug);
  return [...slugs].map((slug) => ({ slug }));
}

function genderFromDivisions(divisions: string[]): "male" | "female" | undefined {
  if (divisions.some((d) => d.startsWith("Women"))) return "female";
  if (divisions.some((d) => d.startsWith("Men"))) return "male";
  return undefined;
}

/**
 * Merge the live WPR record (rank/points/gender/headshot) with the published
 * profile (bio, quick facts, divisions) and, for top pros, our curated data
 * (local headshot + tagline). Any one source alone is enough to render a page.
 */
async function loadAthlete(slug: string) {
  const curated = getAthlete(slug);
  const published = getPublishedAthlete(slug);
  const api = await getWprPlayerBySlug(slug);
  if (!curated && !published && !api) return null;

  const name = curated?.name ?? published?.name ?? api!.name;
  const divisions = published?.divisions.length
    ? published.divisions
    : (curated?.divisions ?? []);
  const bio: string[] = published?.bio.length
    ? published.bio
    : [
        curated?.bio ??
          `${name} is a professional pickleball player ranked among the world's best in the Carvana PPA Tour's World Pickleball Rankings.`,
      ];

  return {
    slug,
    name,
    headshot: curated?.headshot ?? api?.headshot ?? "",
    country: published?.country || curated?.country || api?.country || "",
    countryCode: api?.countryCode || published?.countryCode || "",
    rank: api?.rank ?? curated?.bestRank ?? 0,
    points: api?.points ?? 0,
    gender: api?.gender ?? genderFromDivisions(divisions),
    divisions,
    tagline:
      curated?.tagline ??
      published?.headline ??
      "Professional pickleball player on the Carvana PPA Tour.",
    bio,
    quickInfo: published?.quickInfo ?? null,
    turnedPro: published ? turnedProYear(published) : null,
    age: published ? ageFromDob(published.quickInfo.dob) : null,
    sourceUrl: published?.sourceUrl ?? null,
  };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = await loadAthlete(slug);
  if (!a) return { title: "Athlete" };
  const description = `${a.tagline}${a.country ? ` · ${a.country}` : ""}.`;
  const images = a.headshot ? [a.headshot] : [];
  return {
    title: a.name,
    description,
    openGraph: {
      title: `${a.name} — Carvana PPA Tour`,
      description: a.tagline,
      images,
    },
    twitter: { card: "summary_large_image", images },
  };
}

export default async function AthletePage({ params }: Params) {
  const { slug } = await params;
  const a = await loadAthlete(slug);
  if (!a) notFound();

  // Live stats from the player API (DUPR ratings, career medals, bio facts) +
  // per-division World Pickleball rankings. Null/empty when the API is
  // unavailable — the stats section simply hides.
  const stats = await getAthleteStats(slug);
  const divRanks = await getDivisionRanks(
    slug,
    a.gender === "male" || a.gender === "female" ? a.gender : null,
  );
  const videoData = await getAthleteVideoData(slug);

  const boardLabel =
    a.gender === "female" ? "Women's" : a.gender === "male" ? "Men's" : null;
  const others = athletes.filter((x) => x.slug !== a.slug).slice(0, 4);
  const flag = a.countryCode
    ? `https://cdn.pickleball.com/circle-flags/${a.countryCode}.svg`
    : null;

  // Structured quick facts from the published profile (skip empty values).
  const qi = a.quickInfo;
  const ageVal = stats?.age ?? a.age;
  const quickFacts: { label: string; value: string }[] = [
    { label: "Resides", value: stats?.hometown ?? qi?.resides ?? "" },
    { label: "Age", value: ageVal != null ? String(ageVal) : "" },
    { label: "Height", value: stats?.height ?? qi?.height ?? "" },
    { label: "Plays", value: stats?.handed ? `${stats.handed}-handed` : qi?.plays ?? "" },
    { label: "Turned Pro", value: stats?.turnedPro ?? a.turnedPro ?? "" },
    { label: "Paddle", value: qi?.paddle ?? "" },
  ].filter((f) => f.value);

  // DUPR ratings for the stats section (present values only, 2-decimals).
  const ratings = [
    { label: "Singles", value: stats?.dupr.singles },
    { label: "Doubles", value: stats?.dupr.doubles },
  ].filter((r): r is { label: string; value: number } => r.value != null);
  // Per-division rankings — always show all three; "Unranked" where the athlete
  // isn't in that discipline's board.
  const divisionRanks = [
    { label: "Singles", data: divRanks.singles ?? null },
    { label: "Doubles", data: divRanks.doubles ?? null },
    { label: "Mixed", data: divRanks.mixed ?? null },
  ];
  const hasAnyDivRank = divisionRanks.some((r) => r.data);
  const medalRows = stats?.medals
    ? ([
        ["Singles", stats.medals.singles],
        ["Doubles", stats.medals.doubles],
        ["Mixed", stats.medals.mixed],
      ] as const).filter(([, m]) => m.gold + m.silver + m.bronze > 0)
    : [];

  // Player's paddle → official-partner gear link (Connor's "link to gear").
  const gear = resolveGear(a.quickInfo?.paddle ?? null);

  // Broadcast-style stat strip under the hero — the marquee numbers up front so
  // rank / DUPR / hardware read instantly (only render what we actually have).
  const topDupr = stats?.dupr.doubles ?? stats?.dupr.singles ?? null;
  const goldTotal = stats?.medals?.total.gold ?? null;
  const heroStats: { label: string; value: string }[] = [
    {
      label: boardLabel ? `${boardLabel} World Rank` : "World Rank",
      value: a.rank ? `No. ${a.rank}` : "—",
    },
    { label: "WPR Points", value: a.points > 0 ? a.points.toLocaleString() : "—" },
    ...(topDupr != null ? [{ label: "DUPR", value: topDupr.toFixed(2) }] : []),
    ...(goldTotal != null && goldTotal > 0
      ? [{ label: "Career Gold", value: String(goldTotal) }]
      : []),
  ];

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
            image: a.headshot,
            url: `${SITE_URL}/athletes/${a.slug}`,
            description: a.bio.join(" "),
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
        {/* soft brand glow behind the portrait for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 hidden size-[28rem] rounded-full bg-ppa-blue/20 blur-3xl sm:block"
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[auto_1fr] sm:items-end sm:py-16">
          <div className="relative size-44 shrink-0 overflow-hidden rounded-sm bg-ppa-navy-deep shadow-2xl ring-1 ring-white/15 sm:size-56">
            {a.headshot ? (
              <Image
                src={a.headshot}
                alt={a.name}
                fill
                priority
                sizes="224px"
                className="object-cover object-top"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-6xl text-white/60">
                {initials(a.name)}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-ppa-blue" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-bold uppercase tracking-[0.16em]">
              <span className="bg-ppa-blue px-2.5 py-1 text-white">
                World No. {a.rank || "—"}
              </span>
              {a.country && (
                <span className="flex items-center gap-1.5 text-white/70">
                  {flag && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={flag}
                      alt=""
                      className="size-4 rounded-full ring-1 ring-white/30"
                    />
                  )}
                  {a.country}
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-[clamp(2.25rem,6.5vw,4.25rem)] uppercase leading-[0.92]">
              {a.name}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ppa-yellow sm:text-base">
              {a.tagline}
            </p>
            {a.divisions.length > 0 && (
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
            )}
          </div>
        </div>

        {/* Broadcast-style stat strip — marquee numbers up front */}
        <div className="relative border-t border-white/10 bg-ppa-navy-deep">
          <dl
            className={`mx-auto grid w-full max-w-6xl grid-cols-2 divide-x divide-white/10 ${
              heroStats.length >= 4
                ? "sm:grid-cols-4"
                : heroStats.length === 3
                  ? "sm:grid-cols-3"
                  : "sm:grid-cols-2"
            }`}
          >
            {heroStats.map((s) => (
              <div key={s.label} className="px-4 py-5 sm:px-6 sm:py-6">
                <dd className="font-display text-3xl leading-none text-white sm:text-4xl">
                  {s.value}
                </dd>
                <dt className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative h-1 bg-ppa-blue" />
      </section>

      {/* Bio + WPR standing */}
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
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ppa-navy/70 sm:text-base">
                {a.bio.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                <Link
                  href="/watch"
                  className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
                >
                  ▶ Watch {a.name.split(" ")[0]} Live
                </Link>
                {a.sourceUrl && (
                  <a
                    href={a.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/45 hover:text-ppa-blue"
                  >
                    Official PPA Profile ↗
                  </a>
                )}
              </div>
            </div>

            <aside>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                Quick Info
              </p>
              {quickFacts.length > 0 ? (
                <dl className="mt-3 divide-y divide-ppa-line border border-ppa-line bg-white">
                  {quickFacts.map((f) => (
                    <div key={f.label} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                        {f.label}
                      </dt>
                      <dd className="text-right text-sm font-medium text-ppa-navy">
                        {f.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm text-ppa-navy/50">
                  Full profile details coming soon.
                </p>
              )}
              <Link
                href="/rankings"
                className="mt-4 inline-flex items-center gap-2 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue"
              >
                Full World Rankings →
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {/* By the Numbers — rankings, DUPR + career medals (live player API) */}
      {(stats?.hasStats || hasAnyDivRank) && (
        <section className="bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
              Career
            </p>
            <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
              By the Numbers
            </h2>

            {hasAnyDivRank && (
              <div className="mt-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                  Division Rankings
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {divisionRanks.map((r) => (
                    <div key={r.label} className="border border-ppa-line bg-ppa-paper px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                        {r.label}
                      </p>
                      {r.data ? (
                        <>
                          <p className="mt-1 font-display text-4xl leading-none text-ppa-blue">
                            No. {r.data.rank}
                          </p>
                          <p className="mt-1 text-xs text-ppa-navy/55">
                            {r.data.points.toLocaleString()} pts
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 font-display text-2xl leading-none text-ppa-navy/30">
                          Unranked
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats?.medals && (
              <div className="mt-6">
                <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
                  {(
                    [
                      ["Gold", stats.medals.total.gold, "text-ppa-navy", "bg-ppa-yellow"],
                      ["Silver", stats.medals.total.silver, "text-ppa-navy", "bg-ppa-line"],
                      ["Bronze", stats.medals.total.bronze, "text-white", "bg-[#c98a3c]"],
                    ] as const
                  ).map(([label, count, text, bar]) => (
                    <div key={label} className="overflow-hidden rounded-md border border-ppa-line bg-ppa-paper">
                      <div className={`h-1.5 ${bar}`} />
                      <div className="px-4 py-4">
                        <p className={`font-display text-4xl leading-none ${text === "text-white" ? "text-[#c98a3c]" : "text-ppa-navy"}`}>
                          {count}
                        </p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                          {label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {medalRows.length > 0 && (
                  <div className="mt-4 overflow-hidden rounded-md border border-ppa-line">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-ppa-navy text-white">
                          <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-[0.14em]">Division</th>
                          {["Gold", "Silver", "Bronze"].map((h) => (
                            <th key={h} className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-[0.14em]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {medalRows.map(([div, m]) => (
                          <tr key={div} className="border-t border-ppa-line">
                            <td className="px-4 py-2 font-semibold text-ppa-navy">{div}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-ppa-navy">{m.gold}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-ppa-navy/70">{m.silver}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-ppa-navy/70">{m.bronze}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {ratings.length > 0 && (
              <div className="mt-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                  DUPR
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
                  {ratings.map((r) => (
                    <div key={r.label} className="border border-ppa-line bg-ppa-paper px-4 py-4">
                      <p className="font-display text-3xl leading-none text-ppa-blue">
                        {r.value.toFixed(2)}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">
                        {r.label}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-ppa-navy/40">
                  DUPR = Dynamic Universal Pickleball Rating
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* In the Bag — the athlete's paddle + a shop link (official partners
          only; Connor's "link to gear"). */}
      {gear && (
        <section className="bg-ppa-navy text-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
              In the Bag
            </p>
            <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] sm:text-3xl">
              {a.name.split(" ")[0]}&apos;s Gear
            </h2>
            <div className="mt-6 flex flex-col gap-6 border border-white/12 bg-ppa-navy-deep p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                  Paddle
                </p>
                <p className="mt-1 font-display text-2xl uppercase leading-tight sm:text-3xl">
                  {gear.paddle}
                </p>
                {gear.brand && (
                  <p className="mt-2 text-xs font-medium text-ppa-sky">
                    Official Partner of the PPA Tour
                  </p>
                )}
              </div>
              {/* Conner Ogden 7/27: link the pro's paddle so a fan can buy the
                  same one. Official-partner brands lead with their own store;
                  Pickleball Central always sits alongside it. */}
              <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row sm:items-center">
                {gear.brand && (
                  <a
                    href={gear.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 shrink-0 items-center justify-center bg-ppa-blue px-7 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
                  >
                    Shop {gear.brand} ↗
                  </a>
                )}
                <a
                  href={gear.pbcHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex h-12 shrink-0 items-center justify-center px-7 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors ${
                    gear.brand
                      ? "border border-white/25 hover:border-ppa-blue hover:bg-ppa-blue"
                      : "bg-ppa-blue hover:bg-ppa-blue-deep"
                  }`}
                >
                  Buy This Paddle ↗
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Highlights — player video clips from the API */}
      {videoData && videoData.videos.length > 0 && (
        <section className="bg-ppa-paper">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
              Watch
            </p>
            <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
              {a.name.split(" ")[0]}&apos;s Highlights
            </h2>
            <div className="mt-6">
              <AthleteVideos
                slug={a.slug}
                tournaments={videoData.tournaments}
                initialUuid={videoData.tournamentUuid}
                initialVideos={videoData.videos}
              />
            </div>
          </div>
        </section>
      )}

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
