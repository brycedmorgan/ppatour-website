"use client";

import { Check, Plus } from "lucide-react";
import { useCompare } from "./compare-store";
import { MAX_COMPARE } from "@/lib/paddle-lab-shared";

/** "Add to compare" toggle. Sits next to the shop CTA on a paddle page and on cards. */
export function CompareButton({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const { list, toggle, full } = useCompare();
  const on = list.includes(slug);
  const disabled = !on && full;

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => toggle(slug)}
        disabled={disabled}
        aria-pressed={on}
        title={disabled ? `Compare holds ${MAX_COMPARE} paddles` : on ? "Remove from compare" : "Add to compare"}
        className={`inline-flex h-8 items-center gap-1.5 border px-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          on
            ? "border-ppa-blue bg-ppa-blue text-white"
            : "border-ppa-line bg-white text-ppa-navy hover:border-ppa-blue hover:text-ppa-blue"
        }`}
      >
        {on ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        {on ? "Added" : "Compare"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      disabled={disabled}
      aria-pressed={on}
      className={`inline-flex h-12 items-center justify-center gap-2 border px-5 text-xs font-bold uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        on
          ? "border-ppa-navy bg-ppa-navy text-white hover:bg-ppa-navy-deep"
          : "border-ppa-navy bg-white text-ppa-navy hover:bg-ppa-paper"
      }`}
    >
      {on ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {on ? "In Compare" : disabled ? `Compare is full (${MAX_COMPARE})` : "Add to Compare"}
    </button>
  );
}
