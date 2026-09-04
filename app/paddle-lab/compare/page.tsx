import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import { ComparePicker } from "@/components/paddle-lab/ComparePicker";
import { Hint } from "@/components/paddle-lab/Hint";
import { PaddleTile } from "@/components/paddle-lab/PaddleTile";
import {
  CERT_LABEL,
  compareHref,
  DATA_SOURCE,
  formatMetric,
  formatPrice,
  LAB_PATH,
  MAX_COMPARE,
  METRICS,
  paddleBySlug,
  summaries,
  TILT_LABEL,
  type MetricGroup,
  type Paddle,
} from "@/lib/paddle-lab";

type Search = { searchParams: Promise<{ p?: string; swap?: string }> };

/**
 * Two paddles' scaled scores this far apart is flagged as a notable gap in
 * the table. Kew's scores are 0–100 positions in the database, so 15 points
 * is roughly a sixth of the whole field between the two. A display threshold,
 * nothing more; it never changes a number.
 */
const NOTABLE_GAP = 15;

function parse(p: string | undefined): string[] {
  return Array.from(new Set((p ?? "").split(",").map((s) => s.trim()).filter(Boolean))).slice(0, MAX_COMPARE);
}

export async function generateMetadata({ searchParams }: Search): Promise<Metadata> {
  const { p } = await searchParams;
  const list = parse(p).map(paddleBySlug).filter(Boolean) as Paddle[];
  const names = list.map((x) => x.name);
  return {
    title: names.length >= 2 ? `${names.join(" vs ")} — Compare` : "Compare Paddles",
    description:
      names.length >= 2
        ? `${names.join(" vs ")}: power, pop, spin, swing weight, twist weight and specs side by side.`
        : "Compare up to four pickleball paddles side by side on measured test data and specs.",
    // A comparison is a reader's scratch page; every paddle in it is indexed at its own URL.
    robots: { index: false, follow: true },
  };
}

const GROUP_TITLES: Record<MetricGroup, string> = {
  performance: "Performance",
  handling: "Handling",
  physical: "Specs",
};

export default async function ComparePage({ searchParams }: Search) {
  const { p, swap } = await searchParams;
  const slugs = parse(p);
  const list = slugs.map(paddleBySlug).filter(Boolean) as Paddle[];
  const selected = list.map((x) => x.slug);
  const swapFor = swap && selected.includes(swap) ? swap : undefined;

  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">Paddle Lab</p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">Compare paddles</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ppa-navy/60">
            Up to {MAX_COMPARE} side by side. Search to add one, or add them from any paddle page. The
            highest value in a row is marked where higher means more of the thing; rows with a wide gap
            between paddles get a dot.
          </p>
          <div className="mt-6 max-w-xl">
            <ComparePicker items={summaries} selected={selected} swapFor={swapFor} />
            {swapFor && (
              <p className="mt-2 text-xs text-ppa-navy/55">
                Swapping <strong>{paddleBySlug(swapFor)?.name}</strong>.{" "}
                <Link href={compareHref(selected)} className="font-bold text-ppa-blue hover:underline">
                  Cancel
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          {list.length === 0 ? (
            <div className="border border-ppa-line bg-ppa-paper px-6 py-16 text-center">
              <p className="font-display text-xl uppercase text-ppa-navy">Nothing to compare yet</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ppa-navy/60">
                Search above, or browse the lab and use &ldquo;Compare&rdquo; on any card.
              </p>
              <Link
                href={`${LAB_PATH}/paddles`}
                className="mt-6 inline-block bg-ppa-blue px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
              >
                Browse paddles
              </Link>
            </div>
          ) : (
            <CompareTable list={list} />
          )}

          {list.length > 0 && (
            <p className="mt-6 text-[11px] text-ppa-navy/45">
              Test data:{" "}
              <a href={DATA_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ppa-blue">
                {DATA_SOURCE.name}
              </a>
              . Shown as published. Pickleball Central is part of Pickleball Inc, the PPA Tour&apos;s parent company.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

/** "A", "A and B", "A, B and C" — for a sentence, not a legend. */
function andList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function CompareTable({ list }: { list: Paddle[] }) {
  const slugs = list.map((p) => p.slug);
  const cols = `minmax(140px,1.2fr) repeat(${list.length}, minmax(150px,1fr))`;

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="min-w-[640px]">
        {/* Header cards */}
        <div className="grid gap-px bg-ppa-line" style={{ gridTemplateColumns: cols }}>
          <div className="bg-white" />
          {list.map((p) => (
            /* ⚠ THE CARD IS A FLEX COLUMN AND THE NAME HOLDS TWO LINES ON PURPOSE.
               Paddle names wrap unevenly — "Andre Agassi Pro 16mm" is one line,
               "Anna Bright Scorpeus Pro IV 14mm" is two — so a plain stack put the
               price and the Shop button at a different height in every column, on
               the one screen whose whole job is reading across. The name reserves
               two lines so the price lines up, and the buttons are pushed to the
               foot so they line up whatever the name does. */
            <div key={p.slug} className="relative flex h-full flex-col bg-white p-3">
              <div className="mx-auto w-24">
                <PaddleTile name={p.name} brand={p.brand} image={p.image?.cutout ? p.image.src : null} photo={p.photo} />
              </div>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-navy/45">{p.brand}</p>
              <Link
                href={p.href}
                className="block min-h-[2.5rem] font-display text-sm uppercase leading-tight text-ppa-navy hover:text-ppa-blue"
              >
                {p.model}
                {p.thicknessMm ? ` ${p.thicknessMm}mm` : ""}
              </Link>
              <p className="mt-1 text-sm font-bold tabular-nums text-ppa-navy">{formatPrice(p.displayPrice) ?? ""}</p>
              {!p.tested && (
                <p className="mt-2 inline-flex w-fit items-center border border-ppa-line bg-ppa-paper px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-ppa-navy/60">
                  Not tested yet
                </p>
              )}
              <div className="mt-auto flex flex-col gap-1.5 pt-3">
                <a
                  href={p.shopHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-1.5 bg-ppa-blue px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white hover:bg-ppa-blue-deep"
                >
                  Shop <ExternalLink className="h-3 w-3" />
                </a>
                <div className="flex gap-1.5">
                  <Link
                    href={`${compareHref(slugs)}&swap=${p.slug}`}
                    className="inline-flex h-8 flex-1 items-center justify-center border border-ppa-line text-[10px] font-bold uppercase tracking-[0.14em] text-ppa-navy hover:border-ppa-blue hover:text-ppa-blue"
                  >
                    Swap
                  </Link>
                  <Link
                    href={compareHref(slugs.filter((s) => s !== p.slug))}
                    aria-label={`Remove ${p.name}`}
                    className="inline-flex h-8 w-8 items-center justify-center border border-ppa-line text-ppa-navy hover:border-ppa-blue hover:text-ppa-blue"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ⚠ THE ANSWER TO "why are there no stats here?" GOES ABOVE THE TABLE, NOT IN IT.
            A paddle Pickleball Central sells but John Kew has never measured has a
            photo, a price and a buy button and nothing else, so every row below it
            reads "Unknown" or an em dash. Twenty blank cells read as a broken page;
            one sentence naming the paddles reads as the truth. */}
        {list.some((p) => !p.tested) && (
          <p className="border border-t-0 border-ppa-line bg-ppa-paper px-4 py-3 text-xs leading-relaxed text-ppa-navy/70">
            <span className="font-bold text-ppa-navy">
              {list.filter((p) => !p.tested).length === list.length
                ? "None of these have been tested yet."
                : `${andList(list.filter((p) => !p.tested).map((p) => p.name))} ${
                    list.filter((p) => !p.tested).length === 1 ? "has" : "have"
                  } not been tested yet.`}
            </span>{" "}
            {DATA_SOURCE.name} measures a paddle before it gets numbers, and these are in the
            Pickleball Central shop ahead of the lab — so every row below is blank for them.
            Swap one out for a tested paddle to fill the table.
          </p>
        )}

        {/* Identity rows */}
        <Section title="At a glance" cols={cols}>
          <TextRow label="Shape" cols={cols} values={list.map((p) => p.shape)} />
          <TextRow label="Play style" hint="John Kew's tilt band: whether ball speed leans to the full swing (power) or the punch volley (pop)." cols={cols} values={list.map((p) => (p.metrics.tilt ? TILT_LABEL[p.metrics.tilt] : null))} />
          <TextRow label="Spin category" hint="Spin RPM in bands: Elite, Good, Fair, Poor." cols={cols} values={list.map((p) => p.metrics.spinCategory)} />
          <TextRow label="Certification" cols={cols} values={list.map((p) => CERT_LABEL[p.certification])} />
        </Section>

        {(["performance", "handling", "physical"] as MetricGroup[]).map((g) => (
          <Section key={g} title={GROUP_TITLES[g]} cols={cols}>
            {METRICS.filter((m) => m.group === g).map((m) => {
              const values = list.map((p) => m.value(p));
              const nums = values.map((v) => (typeof v === "number" ? v : null));
              const present = nums.filter((v): v is number => v != null);
              const max = m.highlightMax && present.length >= 2 ? Math.max(...present) : null;
              const scores = m.score ? list.map((p) => m.score!(p)).filter((s): s is number => s != null) : [];
              const gap = scores.length >= 2 && Math.max(...scores) - Math.min(...scores) >= NOTABLE_GAP;
              return (
                <div key={m.key} className="grid gap-px bg-ppa-line" style={{ gridTemplateColumns: cols }}>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/60">
                    {gap && <span aria-label="Notable gap between paddles" title="Notable gap" className="h-1.5 w-1.5 shrink-0 bg-ppa-blue" />}
                    {m.short}
                    <Hint label={m.label} text={m.hint} align="left" />
                  </div>
                  {values.map((v, i) => {
                    const best = max != null && nums[i] === max;
                    const score = m.score ? m.score(list[i]) : null;
                    return (
                      <div key={list[i].slug} className={`bg-white px-3 py-2.5 ${best ? "bg-ppa-win" : ""}`}>
                        <p className={`text-sm tabular-nums ${best ? "font-bold text-ppa-navy" : "font-medium text-ppa-navy/85"}`}>
                          {formatMetric(m, v)}
                        </p>
                        {score != null && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1 flex-1 bg-ppa-line" aria-hidden>
                              <div className={`h-full ${m.highlightMax ? "bg-ppa-blue" : "bg-ppa-navy/50"}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
                            </div>
                            <span className="w-6 text-right text-[10px] font-bold tabular-nums text-ppa-navy/50">{Math.round(score)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </Section>
        ))}
      </div>
    </div>
  );
}

function Section({ title, cols, children }: { title: string; cols: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 border border-ppa-line">
      <div className="grid bg-ppa-navy" style={{ gridTemplateColumns: cols }}>
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">{title}</p>
      </div>
      <div className="flex flex-col gap-px bg-ppa-line">{children}</div>
    </div>
  );
}

function TextRow({ label, hint, cols, values }: { label: string; hint?: string; cols: string; values: (string | null)[] }) {
  return (
    <div className="grid gap-px bg-ppa-line" style={{ gridTemplateColumns: cols }}>
      <div className="flex items-center gap-1.5 bg-white px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/60">
        {label}
        {hint && <Hint label={label} text={hint} align="left" />}
      </div>
      {values.map((v, i) => (
        <div key={i} className="bg-white px-3 py-2.5 text-sm font-medium text-ppa-navy/85">
          {v ?? <span className="text-ppa-navy/35">—</span>}
        </div>
      ))}
    </div>
  );
}
