"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * One grid on screen at a time (Connor, 11/16): Gold shows first, and the
 * selector sits AFTER the grid. Every panel is server-rendered and stays in the
 * HTML; the inactive ones are only `hidden`, so all four grids are published.
 * A hash (#standard, #futures, #legacy) picks the grid on load.
 */
export function GridSwitcher({
  tabs,
  children,
}: {
  tabs: { id: string; name: string }[];
  children: ReactNode;
}) {
  const [active, setActive] = useState(tabs[0].id);
  const top = useRef<HTMLDivElement>(null);
  const panels = Children.toArray(children);

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === id)) setActive(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  function pick(id: string) {
    setActive(id);
    history.replaceState(null, "", id === tabs[0].id ? window.location.pathname : `#${id}`);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div ref={top} className="scroll-mt-24">
      {panels.map((p, i) => (
        <div key={tabs[i].id} id={tabs[i].id} hidden={tabs[i].id !== active}>
          {p}
        </div>
      ))}

      <div className="mt-12 border-t border-ppa-line pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/50">
          Select a grid
        </p>
        <div role="tablist" aria-label="Prize money grids" className="mt-3 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === active}
              aria-controls={t.id}
              onClick={() => pick(t.id)}
              className={
                t.id === active
                  ? "bg-ppa-navy px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
                  : "border border-ppa-line bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ppa-navy/70 hover:text-ppa-navy"
              }
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
