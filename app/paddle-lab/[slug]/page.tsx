import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { CompareButton } from "@/components/paddle-lab/CompareButton";
import { PaddleCard } from "@/components/paddle-lab/PaddleCard";
import { PaddleTile } from "@/components/paddle-lab/PaddleTile";
import { ScoreBar } from "@/components/paddle-lab/ScoreBar";
import { breadcrumbJsonLd } from "@/lib/breadcrumbs";
import {
  browseHref,
  CERT_LABEL,
  DATA_SOURCE,
  formatMetric,
  formatPrice,
  LAB_PATH,
  METRICS,
  paddleBySlug,
  paddles,
  similarPaddles,
  SKILL_LABEL,
  summarize,
  TILT_LABEL,
  type MetricGroup,
} from "@/lib/paddle-lab";
import { SITE_URL } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

/** Every paddle is a static page; the grid is a committed file. */
export function generateStaticParams() {
  return paddles.map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = paddleBySlug(slug);
  if (!p) return {};
  const bits = [
    p.metrics.serveSpeedMph != null ? `power ${p.metrics.serveSpeedMph.toFixed(1)} mph` : null,
    p.metrics.spinRpm != null ? `spin ${p.metrics.spinRpm} rpm` : null,
    p.metrics.swingWeight != null ? `swing weight ${p.metrics.swingWeight.toFixed(0)}` : null,
  ].filter(Boolean);
  return {
    title: `${p.name}${p.thicknessMm ? ` ${p.thicknessMm}mm` : ""} — Test Data, Specs & Review`,
    description:
      p.editorial.summary ??
      `${p.name} measured: ${bits.join(", ")}. ${p.shape} shape${p.thicknessMm ? `, ${p.thicknessMm} mm core` : ""}. Full lab data, specs and where to buy.`,
    alternates: { canonical: `${SITE_URL}${p.href}/` },
  };
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-ppa-line py-2.5 text-sm last:border-b-0">
      <dt className="text-ppa-navy/55">{label}</dt>
      <dd className="text-right font-medium text-ppa-navy">{value}</dd>
    </div>
  );
}

function MetricGroupBlock({ title, group, p }: { title: string; group: MetricGroup; p: NonNullable<ReturnType<typeof paddleBySlug>> }) {
  const defs = METRICS.filter((m) => m.group === group);
  return (
    <div className="border border-ppa-line bg-white p-5 sm:p-6">
      <h2 className="font-display text-lg uppercase leading-tight">{title}</h2>
      <div className="mt-2">
        {defs.map((d) => (
          <ScoreBar
            key={d.key}
            label={d.label}
            value={formatMetric(d, d.value(p))}
            score={d.score ? d.score(p) : null}
            hint={d.hint}
            highlightMax={d.highlightMax}
          />
        ))}
      </div>
    </div>
  );
}

export default async function PaddlePage({ params }: Params) {
  const { slug } = await params;
  const p = paddleBySlug(slug);
  if (!p) notFound();

  const price = formatPrice(p.displayPrice);
  const ed = p.editorial;
  const similar = similarPaddles(p, 3);
  const chips = [
    p.shape,
    p.thicknessMm ? `${p.thicknessMm} mm core` : null,
    p.specs.staticWeightOz ? `${p.specs.staticWeightOz.toFixed(1)} oz` : null,
    p.metrics.tilt ? TILT_LABEL[p.metrics.tilt] : null,
    p.metrics.spinCategory ? `${p.metrics.spinCategory} spin` : null,
  ].filter(Boolean) as string[];

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    brand: { "@type": "Brand", name: p.brand },
    category: "Pickleball Paddle",
    url: `${SITE_URL}${p.href}/`,
    ...(ed.summary ? { description: ed.summary } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            productLd,
            breadcrumbJsonLd([
              { name: "Paddle Lab", path: `${LAB_PATH}/` },
              { name: "Paddles", path: `${LAB_PATH}/paddles/` },
              { name: p.name, path: `${p.href}/` },
            ]),
          ]),
        }}
      />

      {/* Header */}
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <nav aria-label="Breadcrumb" className="text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/45">
            <Link href={LAB_PATH} className="hover:text-ppa-blue">Paddle Lab</Link>
            <span className="mx-2">/</span>
            <Link href={browseHref({ brand: p.brand })} className="hover:text-ppa-blue">{p.brand}</Link>
          </nav>

          <div className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr]">
            <div className="mx-auto w-full max-w-xs lg:mx-0">
              <PaddleTile name={p.name} brand={p.brand} image={p.image?.cutout ? p.image.src : null} photo={p.photo} size="hero" />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">{p.brand}</p>
              <h1 className="mt-1 font-display text-3xl uppercase leading-[1.02] sm:text-4xl lg:text-5xl">
                {p.model}
                {p.thicknessMm ? <span className="text-ppa-navy/45"> {p.thicknessMm}mm</span> : null}
              </h1>
              <ul className="mt-4 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <li key={c} className="border border-ppa-line bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/70">
                    {c}
                  </li>
                ))}
                {ed.skill?.map((s) => (
                  <li key={s} className="bg-ppa-navy px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                    {SKILL_LABEL[s]}
                  </li>
                ))}
              </ul>

              {ed.summary ? (
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-ppa-navy/75">{ed.summary}</p>
              ) : (
                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ppa-navy/55">
                  Lab data below. Our editors&apos; write-up for this paddle is on the way.
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {price && <p className="font-display text-2xl tabular-nums text-ppa-navy">{price}</p>}
                <a
                  href={p.shopHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
                >
                  Shop at Pickleball Central <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <CompareButton slug={p.slug} />
              </div>
              <p className="mt-3 text-[11px] text-ppa-navy/45">
                {price
                  ? p.livePrice
                    ? "Price at Pickleball Central when we last checked; "
                    : "Price is the manufacturer's list price as recorded in the lab; "
                  : ""}
                Pickleball Central is part of Pickleball Inc, the PPA Tour&apos;s parent company.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Lab data</p>
          </div>
          <h2 className="mt-2 font-display text-2xl uppercase leading-tight sm:text-3xl">How it measured</h2>
          <p className="mt-2 max-w-2xl text-sm text-ppa-navy/60">
            Bars are the paddle&apos;s position, 0 to 100, against every paddle in the database. A blue bar
            means more is more of that thing; a grey bar is a characteristic with no right answer.{" "}
            <Link href={`${LAB_PATH}/how-we-test`} className="font-bold text-ppa-blue hover:underline">
              How we test
            </Link>
            .
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <MetricGroupBlock title="Performance" group="performance" p={p} />
            <MetricGroupBlock title="Handling" group="handling" p={p} />
            <div className="border border-ppa-line bg-ppa-paper p-5 sm:p-6">
              <h2 className="font-display text-lg uppercase leading-tight">Specs &amp; build</h2>
              <dl className="mt-2">
                {METRICS.filter((m) => m.group === "physical").map((d) => (
                  <Row key={d.key} label={d.label} value={formatMetric(d, d.value(p))} />
                ))}
                <Row label="Certification" value={p.certificationRaw ?? CERT_LABEL[p.certification]} />
                <Row label="Build generation" value={p.build} />
                <Row label="Construction" value={p.process} />
                <Row label="Surface texture" value={p.surfaceTexture} />
                <Row label="Face layup" value={p.surfaceLayup} />
                <Row label="Core" value={p.coreType} />
                <Row label="Warranty" value={p.warranty} />
                {p.condition && p.condition !== "New" && <Row label="Tested condition" value={p.condition} />}
                {p.dateEntered && <Row label="Entered the lab" value={p.dateEntered} />}
              </dl>
            </div>
          </div>

          <p className="mt-6 text-[11px] text-ppa-navy/45">
            Test data: <a href={DATA_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ppa-blue">{DATA_SOURCE.name}</a>. Measurements are shown as published and never edited.
          </p>
        </div>
      </section>

      {/* Editorial */}
      {(ed.review || ed.pros?.length || ed.cons?.length) && (
        <section className="bg-ppa-paper">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-ppa-blue" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Our take</p>
            </div>
            <h2 className="mt-2 font-display text-2xl uppercase leading-tight sm:text-3xl">How it plays</h2>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
              {ed.review && (
                <div className="max-w-2xl space-y-4 text-base leading-relaxed text-ppa-navy/80">
                  {ed.review.split(/\n\s*\n/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                  {ed.reviewedBy && (
                    <p className="text-xs text-ppa-navy/50">
                      {ed.reviewedBy}
                      {ed.reviewedOn ? `, ${ed.reviewedOn}` : ""}
                    </p>
                  )}
                </div>
              )}
              {(ed.pros?.length || ed.cons?.length) && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {ed.pros?.length ? (
                    <div className="border border-ppa-line bg-white p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-blue">Likes</p>
                      <ul className="mt-2 space-y-1.5 text-sm text-ppa-navy/80">
                        {ed.pros.map((x) => <li key={x}>{x}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {ed.cons?.length ? (
                    <div className="border border-ppa-line bg-white p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Watch for</p>
                      <ul className="mt-2 space-y-1.5 text-sm text-ppa-navy/80">
                        {ed.cons.map((x) => <li key={x}>{x}</li>)}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Similar */}
      {similar.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 bg-ppa-blue" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Weigh it against</p>
                </div>
                <h2 className="mt-2 font-display text-2xl uppercase leading-tight">
                  Same shape{p.metrics.tilt ? ", same play style" : ""}, nearest in price
                </h2>
              </div>
              <Link
                href={browseHref({ shape: p.shape })}
                className="hidden items-center gap-1.5 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue sm:inline-flex"
              >
                All {p.shape.toLowerCase()} paddles <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {similar.map((s) => (
                <PaddleCard key={s.slug} p={summarize(s)} />
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
