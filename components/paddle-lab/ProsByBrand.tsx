import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prosByBrand, prosWithPaddle } from "@/lib/paddle-lab-pros";
import { browseHref } from "@/lib/paddle-lab-shared";

const BRANDS_SHOWN = 8;
const PROS_SHOWN = 4;

/**
 * "What the pros play" — the top brands on tour by number of pros on the
 * broadcast masterlist, each with its most-played models and a few names.
 * Counts are heads, not endorsements ranked by us; see lib/paddle-lab-pros.ts.
 */
export function ProsByBrand() {
  const brands = prosByBrand().slice(0, BRANDS_SHOWN);
  if (!brands.length) return null;

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-ppa-blue" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">On tour</p>
            </div>
            <h2 className="mt-2 font-display text-2xl uppercase leading-tight sm:text-3xl">What the pros play</h2>
            <p className="mt-2 max-w-2xl text-sm text-ppa-navy/60">
              The paddles in the bags of {prosWithPaddle} PPA Tour pros, by brand, from the broadcast
              equipment list. A head count, not a ranking.
            </p>
          </div>
          <Link
            href="/athletes"
            className="hidden items-center gap-1.5 border-b-2 border-ppa-blue pb-0.5 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:text-ppa-blue sm:inline-flex"
          >
            All athletes <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {brands.map((b, i) => (
            <li key={b.brand} className="flex flex-col border border-ppa-line bg-ppa-paper p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-xl uppercase leading-none text-ppa-navy">
                  <span className="mr-2 text-ppa-navy/30">{i + 1}</span>
                  {b.inLab ? (
                    <Link href={browseHref({ brand: b.brand })} className="hover:text-ppa-blue">
                      {b.brand}
                    </Link>
                  ) : (
                    b.brand
                  )}
                </p>
                <p className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/50">
                  {b.pros.length} pro{b.pros.length === 1 ? "" : "s"}
                </p>
              </div>

              <ul className="mt-4 space-y-1.5 border-t border-ppa-line pt-3">
                {b.models.slice(0, 3).map((m) => (
                  <li key={m.label} className="flex items-baseline justify-between gap-3 text-sm">
                    {m.lab ? (
                      <Link href={m.lab.href} className="min-w-0 truncate font-bold text-ppa-navy hover:text-ppa-blue">
                        {m.label}
                      </Link>
                    ) : (
                      <span className="min-w-0 truncate font-bold text-ppa-navy/80">{m.label}</span>
                    )}
                    <span className="shrink-0 text-[11px] tabular-nums text-ppa-navy/50">×{m.count}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-auto pt-4 text-[12px] leading-relaxed text-ppa-navy/60">
                {b.pros.slice(0, PROS_SHOWN).map((p, j) => (
                  <span key={p.slug}>
                    <Link href={`/athletes/${p.slug}`} className="font-medium text-ppa-navy hover:text-ppa-blue">
                      {p.name}
                    </Link>
                    {j < Math.min(b.pros.length, PROS_SHOWN) - 1 ? ", " : ""}
                  </span>
                ))}
                {b.pros.length > PROS_SHOWN && <span> +{b.pros.length - PROS_SHOWN} more</span>}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
