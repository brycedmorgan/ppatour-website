import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HANDBOOK, HANDBOOK_EDITION, HANDBOOK_PDF, type HandbookNode, type HandbookTable } from "@/lib/player-handbook";

/**
 * Player Handbook — the PPA Tournament Handbook, rendered in full.
 *
 * ⚠ The content lives in lib/player-handbook.ts and is the handbook verbatim.
 * The page this replaced was invented placeholder copy; don't summarise the
 * rules here, and don't add anything the handbook doesn't say.
 *
 * Clause labels are generated from depth so the page matches the handbook's
 * own cross-references ("Section 2(E)(iii)", "5(E)(xii)"), and every clause
 * has an anchor (#2-e-iii) so a referee or player can link the exact rule.
 */

export const metadata: Metadata = {
  title: "Player Handbook",
  description:
    "The PPA Tournament Handbook: rankings and points, entries, seeding, wild cards and qualifying, withdrawals, paddle testing, on-court rules, prize money, the Code of Conduct and the sports betting policy.",
};

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv"];

/** Label for the clause at `depth` (0 = lettered clause) and position `i`. */
function label(depth: number, i: number): { mark: string; key: string } {
  switch (depth) {
    case 0: {
      const l = String.fromCharCode(65 + i);
      return { mark: `${l})`, key: l.toLowerCase() };
    }
    case 1:
      return { mark: `${ROMAN[i]})`, key: ROMAN[i] };
    case 2:
      return { mark: `(${i + 1})`, key: String(i + 1) };
    case 3: {
      const l = String.fromCharCode(97 + i);
      return { mark: `(${l})`, key: l };
    }
    case 4:
      return { mark: `(${ROMAN[i]})`, key: ROMAN[i] };
    default:
      return { mark: `${i + 1}.`, key: String(i + 1) };
  }
}

/** Emails and full URLs in the handbook text become links; nothing else does. */
function linkify(text: string): ReactNode[] {
  return text.split(/(https?:\/\/[^\s]+?(?=[.,;]?(?:\s|$))|[\w.+-]+@[\w-]+\.[\w.]+\w)/g).map((part, i) => {
    if (i % 2 === 0) return part;
    const href = part.includes("@") ? `mailto:${part}` : part;
    return (
      <a key={i} href={href} className="font-medium text-ppa-blue underline underline-offset-2 hover:text-ppa-blue-deep">
        {part}
      </a>
    );
  });
}

function Table({ table }: { table: HandbookTable }) {
  return (
    <div className="mt-3 overflow-x-auto border border-ppa-line">
      <table className="w-full border-collapse text-left text-xs">
        <caption className="sr-only">{table.caption}</caption>
        <thead className="bg-ppa-navy text-white">
          <tr>
            {table.head.map((c, i) => (
              <th key={i} scope="col" className="whitespace-nowrap px-3 py-2 font-bold uppercase tracking-[0.08em]">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r} className="border-t border-ppa-line odd:bg-white even:bg-ppa-paper">
              {row.map((c, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="whitespace-nowrap px-3 py-2 font-bold text-ppa-navy">
                    {c}
                  </th>
                ) : (
                  <td key={i} className="whitespace-nowrap px-3 py-2 tabular-nums text-ppa-navy/75">
                    {c}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Clause({ node, depth, index, path }: { node: HandbookNode; depth: number; index: number; path: string }) {
  const { mark, key } = label(depth, index);
  const id = `${path}-${key}`;
  const lettered = depth === 0;

  return (
    <li id={id} className={lettered ? "scroll-mt-28 border-t border-ppa-line pt-6 first:border-t-0 first:pt-0" : "scroll-mt-28"}>
      <div className="flex gap-2 sm:gap-3">
        <a
          href={`#${id}`}
          className={`shrink-0 tabular-nums text-ppa-navy/45 hover:text-ppa-blue ${lettered ? "font-display text-lg leading-tight" : "min-w-7 text-sm leading-relaxed font-bold"}`}
          aria-label={`Link to ${id.replace(/-/g, " ")}`}
        >
          {mark}
        </a>
        <div className="min-w-0 flex-1">
          {node.t &&
            (lettered ? (
              <h3 className="font-display text-lg uppercase leading-tight text-ppa-navy">{node.t}</h3>
            ) : !node.p ? (
              <h4 className="text-sm font-bold leading-relaxed text-ppa-navy">{node.t}</h4>
            ) : null)}
          {node.p && (
            <p className={`text-sm leading-relaxed text-ppa-navy/75 ${lettered && node.t ? "mt-2" : ""}`}>
              {node.t && !lettered && <strong className="font-bold text-ppa-navy">{node.t}: </strong>}
              {linkify(node.p)}
            </p>
          )}
          {node.table && <Table table={node.table} />}
          {node.c && node.c.length > 0 && (
            <ol className={`${lettered ? "mt-4" : "mt-2"} space-y-2.5`}>
              {node.c.map((child, i) => (
                <Clause key={i} node={child} depth={depth + 1} index={i} path={id} />
              ))}
            </ol>
          )}
        </div>
      </div>
    </li>
  );
}

export default function PlayerHandbookPage() {
  return (
    <>
      <section className="bg-ppa-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 bg-ppa-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">{HANDBOOK_EDITION}</p>
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-4xl">Player Handbook</h1>
          <p className="mt-3 max-w-2xl text-sm text-ppa-navy/55 sm:text-base">
            The guide for players, referees and line judges at officiated PPA Tour events, covering singles and doubles:
            rankings and points, entries and seeding, withdrawals, paddle testing, prize money, the Code of Conduct and
            the sports betting policy.
          </p>
          <div className="mt-5 flex gap-3">
            <a
              href={HANDBOOK_PDF}
              target="_blank"
              rel="noopener"
              className="inline-flex h-11 items-center bg-ppa-blue px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-transform hover:bg-ppa-blue-deep active:scale-[0.98]"
            >
              Handbook (PDF)
            </a>
          </div>
          <nav aria-label="Handbook sections" className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {HANDBOOK.map((s, i) => (
              <a
                key={s.id}
                href={`#${i + 1}`}
                className="group flex items-baseline gap-3 border border-ppa-line bg-white px-4 py-3 hover:border-ppa-blue"
              >
                <span className="font-display text-xl leading-none text-ppa-blue">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-ppa-navy group-hover:text-ppa-blue">
                  {s.title}
                </span>
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="max-w-3xl space-y-14">
            {HANDBOOK.map((s, i) => (
              <section key={s.id} id={String(i + 1)} aria-labelledby={`${s.id}-title`} className="scroll-mt-28">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">Section {i + 1}</p>
                <h2 id={`${s.id}-title`} className="mt-1 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
                  {s.title}
                </h2>
                <ol className="mt-6 space-y-6">
                  {s.c.map((node, j) => (
                    <Clause key={j} node={node} depth={0} index={j} path={String(i + 1)} />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
