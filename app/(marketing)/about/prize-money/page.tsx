import type { Metadata } from "next";
import {
  FUTURES_GRID,
  GOLD_GRID,
  LEGACY_GRID,
  STANDARD_GRID,
  type PrizeGrid,
  type PrizeTable,
} from "@/lib/prize-grids";
import { OpenOnHash } from "./OpenOnHash";

/**
 * Prize Money Grids — all contract grids on one page.
 *
 * ⚠ DELIBERATELY UNLINKED (Connor, 11/16: "bury a place that shows all 4
 * grids", Gold most visible). Nothing in the nav, footer, sitemap or search
 * points here, and it is noindex. Don't link it from How It Works: that page
 * keeps Connor's 8/3 Gold-only ruling. The URL is sent directly (Chris Patrick).
 *
 * The eligibility note is Chris Patrick's text from his 10/30 email, verbatim.
 * Data and source: lib/prize-grids.ts.
 */

export const metadata: Metadata = {
  title: "Prize Money Grids",
  description: "PPA Tour and MLP prize money grids by player contract.",
  robots: { index: false, follow: false },
};

const GRIDS: PrizeGrid[] = [GOLD_GRID, STANDARD_GRID, FUTURES_GRID, ...(LEGACY_GRID ? [LEGACY_GRID] : [])];

function Table({ table }: { table: PrizeTable }) {
  const wide = table.head.length > 2;
  return (
    <div className="min-w-0">
      <h4 className="font-display text-sm uppercase tracking-wide text-ppa-navy">{table.title}</h4>
      <div className="mt-2 overflow-x-auto border border-ppa-line">
        <table className={`w-full border-collapse text-left ${wide ? "min-w-176" : ""}`}>
          <thead>
            <tr className="bg-ppa-navy text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
              <th scope="col" className="px-4 py-3 font-bold">
                <span className="sr-only">Finish</span>
              </th>
              {table.head.map((h) => (
                <th key={h} scope="col" className="px-4 py-3 text-right font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r) => (
              <tr key={r.label} className="border-t border-ppa-line bg-white">
                <th
                  scope="row"
                  className="whitespace-nowrap px-4 py-3 font-display text-sm font-normal uppercase tracking-wide text-ppa-navy"
                >
                  {r.label}
                </th>
                {r.cells.map((c, i) => (
                  <td
                    key={table.head[i]}
                    className="px-4 py-3 text-right text-sm tabular-nums text-ppa-navy/75"
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.note && (
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-ppa-navy/60">{table.note}</p>
      )}
    </div>
  );
}

function GridBody({ grid }: { grid: PrizeGrid }) {
  return (
    <div className="mt-6 grid gap-8">
      <p className="text-xs text-ppa-navy/60">
        Doubles and mixed doubles prize money is listed per team.
      </p>
      {grid.tables.map((t) => (
        <Table key={t.title} table={t} />
      ))}
    </div>
  );
}

export default function PrizeMoneyPage() {
  const [gold, ...others] = GRIDS;
  return (
    <>
      <OpenOnHash />
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
              Players
            </p>
          </div>
          <h1 className="mt-2 font-display text-4xl uppercase leading-[1.02] text-ppa-navy sm:text-5xl">
            Prize Money Grids
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ppa-navy/70">
            Prize money at PPA Tour and Major League Pickleball events, by player contract.
          </p>
          <nav aria-label="Grids" className="mt-6 flex flex-wrap gap-2">
            {GRIDS.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className={
                  g.id === "gold"
                    ? "bg-ppa-navy px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
                    : "border border-ppa-line bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ppa-navy/70"
                }
              >
                {g.name}
              </a>
            ))}
            <a
              href="#eligibility"
              className="border border-ppa-line bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ppa-navy/70"
            >
              Eligibility
            </a>
          </nav>
        </div>
      </section>

      {/* Gold: open, first, full width. */}
      <section id="gold" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-blue">Grid 1</p>
          <h2 className="mt-2 font-display text-3xl uppercase leading-[1.02] text-ppa-navy">
            {gold.name} Prize Money Grid
          </h2>
          <GridBody grid={gold} />
        </div>
      </section>

      {/* The rest: present in full, collapsed by default. */}
      <section className="bg-ppa-paper">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-12">
          {others.map((g, i) => (
            <details key={g.id} id={g.id} className="scroll-mt-24 border border-ppa-line bg-white p-5">
              <summary className="cursor-pointer list-none">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
                  Grid {i + 2}
                </span>
                <span className="mt-1 block font-display text-xl uppercase text-ppa-navy">
                  {g.name} Prize Money Grid <span className="text-ppa-blue">+</span>
                </span>
              </summary>
              <GridBody grid={g} />
            </details>
          ))}
        </div>
      </section>

      {/* Chris Patrick's note, verbatim (email 10/30/2026). */}
      <section id="eligibility" className="scroll-mt-24 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <h2 className="font-display text-2xl uppercase leading-[1.02] text-ppa-navy">
            Prize Money Eligibility
          </h2>
          <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-ppa-navy/75">
            <p>
              For contracted players, entitlement to prize money is governed by their player
              agreements. The applicable grid is determined as follows:
            </p>
            <ul className="list-disc space-y-3 pl-5">
              <li>
                <strong className="font-semibold text-ppa-navy">Legacy Grid:</strong> Applies to
                players whose agreements provide for tournament prize money without expressly
                specifying the Gold, Standard, or Futures Contract grid. Players who signed before
                these newer grids were introduced are grandfathered into the Legacy grid unless
                their agreements expressly provide for a different grid.
              </li>
              <li>
                <strong className="font-semibold text-ppa-navy">
                  Gold, Standard, or Futures Contract Grid:
                </strong>{" "}
                Applies to players whose agreements expressly identify the applicable grid. Those
                players are eligible to earn prize money under the grid specified in their
                agreements.
              </li>
              <li>
                <strong className="font-semibold text-ppa-navy">Non-Contracted Players:</strong>{" "}
                Are eligible to earn 50% of the applicable prize money amounts shown in the Futures
                Contract grid.
              </li>
            </ul>
            <p>
              Publication of these grids does not change the prize money terms of any existing
              player agreement.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
