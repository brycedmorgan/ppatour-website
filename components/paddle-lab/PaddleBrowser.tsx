"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { PaddleCard } from "./PaddleCard";
import {
  browseHref,
  matchesQuery,
  PRICE_BANDS,
  SHAPES,
  SKILL_LABEL,
  SKILLS,
  SPIN_CATEGORIES,
  THICKNESS_BANDS,
  TILT_LABEL,
  TILTS,
  WEIGHT_BANDS,
  type PaddleSummary,
} from "@/lib/paddle-lab-shared";

/**
 * Browse + filter every paddle in the lab. Filter state lives in the URL so a
 * filtered view is a link (the landing-page tiles are exactly that), and the
 * page renders on the server with the right subset for a shared link.
 *
 * The whole summary list arrives as a prop (468 × ~20 fields) and filtering is
 * in-memory. That is the right size for this; a search index would be a
 * solution looking for a problem.
 */

const SORTS = [
  { key: "name", label: "Name A–Z" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "power", label: "Power: highest" },
  { key: "spin", label: "Spin: highest" },
  { key: "twist", label: "Twist weight: highest" },
  { key: "swing-asc", label: "Swing weight: lightest" },
  { key: "newest", label: "Newest tested" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

const PAGE = 48;

type Filters = {
  q: string;
  brand: string;
  price: string;
  shape: string;
  tilt: string;
  spin: string;
  thickness: string;
  weight: string;
  skill: string;
  sort: SortKey;
};

const DEFAULTS: Filters = {
  q: "",
  brand: "",
  price: "",
  shape: "",
  tilt: "",
  spin: "",
  thickness: "",
  weight: "",
  skill: "",
  sort: "name",
};

function fromParams(sp: URLSearchParams): Filters {
  const sort = sp.get("sort") ?? "";
  return {
    q: sp.get("q") ?? "",
    brand: sp.get("brand") ?? "",
    price: sp.get("price") ?? "",
    shape: sp.get("shape") ?? "",
    tilt: sp.get("tilt") ?? "",
    spin: sp.get("spin") ?? "",
    thickness: sp.get("thickness") ?? "",
    weight: sp.get("weight") ?? "",
    skill: sp.get("skill") ?? "",
    sort: (SORTS.some((s) => s.key === sort) ? sort : "name") as SortKey,
  };
}

function apply(list: PaddleSummary[], f: Filters): PaddleSummary[] {
  const price = PRICE_BANDS.find((b) => b.key === f.price);
  const weight = WEIGHT_BANDS.find((b) => b.key === f.weight);
  const thick = THICKNESS_BANDS.find((b) => b.key === f.thickness);
  const out = list.filter(
    (p) =>
      matchesQuery(p, f.q) &&
      (!f.brand || p.brand === f.brand) &&
      (!price || (p.price != null && price.test(p.price))) &&
      (!f.shape || p.shape === f.shape) &&
      (!f.tilt || p.tilt === f.tilt) &&
      (!f.spin || p.spinCategory === f.spin) &&
      (!thick || (p.thicknessMm != null && thick.test(p.thicknessMm))) &&
      (!weight || (p.weightOz != null && weight.test(p.weightOz))) &&
      (!f.skill || p.skill.includes(f.skill as PaddleSummary["skill"][number])),
  );
  // Nulls sink to the bottom on every numeric sort, whichever direction.
  const num = (v: number | null, dir: 1 | -1) => (v == null ? Infinity : v * dir);
  switch (f.sort) {
    case "price-asc":
      return out.sort((a, b) => num(a.price, 1) - num(b.price, 1));
    case "price-desc":
      return out.sort((a, b) => num(a.price, -1) - num(b.price, -1));
    case "power":
      return out.sort((a, b) => num(a.powerMph, -1) - num(b.powerMph, -1));
    case "spin":
      return out.sort((a, b) => num(a.spinRpm, -1) - num(b.spinRpm, -1));
    case "twist":
      return out.sort((a, b) => num(a.twistWeight, -1) - num(b.twistWeight, -1));
    case "swing-asc":
      return out.sort((a, b) => num(a.swingWeight, 1) - num(b.swingWeight, 1));
    case "newest":
      return out.sort((a, b) => (b.dateEntered ?? "").localeCompare(a.dateEntered ?? ""));
    default:
      return out.sort((a, b) => a.name.localeCompare(b.name));
  }
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Any",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-navy/50">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block h-10 w-full border border-ppa-line bg-white px-2.5 text-sm text-ppa-navy focus:border-ppa-blue focus:outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PaddleBrowser({ items, brands }: { items: PaddleSummary[]; brands: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const filters = useMemo(() => fromParams(new URLSearchParams(sp.toString())), [sp]);
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState(false);

  const set = useCallback(
    (patch: Partial<Filters>) => {
      const next = { ...filters, ...patch };
      const params: Record<string, string> = {};
      for (const [k, v] of Object.entries(next)) {
        if (v && v !== DEFAULTS[k as keyof Filters]) params[k] = v;
      }
      setShown(PAGE);
      router.replace(browseHref(params), { scroll: false });
    },
    [filters, router],
  );

  const results = useMemo(() => apply(items, filters), [items, filters]);
  const hasSkillTags = useMemo(() => items.some((p) => p.skill.length), [items]);
  const active = Object.entries(filters).filter(([k, v]) => v && v !== DEFAULTS[k as keyof Filters] && k !== "sort" && k !== "q").length;

  const panel = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      <Select
        label="Brand"
        value={filters.brand}
        onChange={(brand) => set({ brand })}
        options={brands.map((b) => ({ value: b, label: b }))}
        placeholder="All brands"
      />
      <Select
        label="Price"
        value={filters.price}
        onChange={(price) => set({ price })}
        options={PRICE_BANDS.map((b) => ({ value: b.key, label: b.label }))}
      />
      <Select
        label="Shape"
        value={filters.shape}
        onChange={(shape) => set({ shape })}
        options={SHAPES.map((s) => ({ value: s, label: s }))}
      />
      <Select
        label="Play style"
        value={filters.tilt}
        onChange={(tilt) => set({ tilt })}
        options={TILTS.map((t) => ({ value: t, label: TILT_LABEL[t] }))}
      />
      <Select
        label="Spin"
        value={filters.spin}
        onChange={(spin) => set({ spin })}
        options={SPIN_CATEGORIES.map((s) => ({ value: s, label: s }))}
      />
      <Select
        label="Core thickness"
        value={filters.thickness}
        onChange={(thickness) => set({ thickness })}
        options={THICKNESS_BANDS.map((b) => ({ value: b.key, label: b.label }))}
      />
      <Select
        label="Weight"
        value={filters.weight}
        onChange={(weight) => set({ weight })}
        options={WEIGHT_BANDS.map((b) => ({ value: b.key, label: b.label }))}
      />
      {hasSkillTags && (
        <Select
          label="Skill level"
          value={filters.skill}
          onChange={(skill) => set({ skill })}
          options={SKILLS.map((s) => ({ value: s, label: SKILL_LABEL[s] }))}
        />
      )}
      {active > 0 && (
        <button
          type="button"
          onClick={() => set({ ...DEFAULTS, q: filters.q, sort: filters.sort })}
          className="inline-flex h-10 items-center justify-center gap-1.5 border border-ppa-navy text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy hover:bg-ppa-paper"
        >
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex h-10 items-center gap-2 border border-ppa-navy px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters{active ? ` (${active})` : ""}
          </button>
        </div>
        <div className={`${open ? "mt-4 block" : "hidden"} lg:block`}>{panel}</div>
      </aside>

      <div className="mt-6 lg:mt-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ppa-navy/40" />
            <input
              type="search"
              value={filters.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Search by brand or paddle name"
              aria-label="Search paddles"
              className="h-11 w-full border border-ppa-line bg-white pl-10 pr-3 text-sm text-ppa-navy placeholder:text-ppa-navy/40 focus:border-ppa-blue focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/50">
            Sort
            <select
              value={filters.sort}
              onChange={(e) => set({ sort: e.target.value as SortKey })}
              className="h-11 border border-ppa-line bg-white px-2.5 text-sm font-medium normal-case tracking-normal text-ppa-navy focus:border-ppa-blue focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-4 text-xs text-ppa-navy/55" aria-live="polite">
          {results.length === items.length
            ? `${items.length} paddles`
            : `${results.length} of ${items.length} paddles`}
        </p>

        {results.length ? (
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {results.slice(0, shown).map((p) => (
              <PaddleCard key={p.slug} p={p} />
            ))}
          </ul>
        ) : (
          <div className="mt-4 border border-ppa-line bg-ppa-paper px-6 py-16 text-center">
            <p className="font-display text-lg uppercase text-ppa-navy">No paddles match</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ppa-navy/60">
              Loosen a filter or clear the search. Every paddle in the lab is a real one; we don&apos;t pad the list.
            </p>
          </div>
        )}

        {results.length > shown && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShown((s) => s + PAGE)}
              className="inline-flex h-11 items-center border border-ppa-navy px-6 text-xs font-bold uppercase tracking-[0.12em] text-ppa-navy hover:bg-ppa-paper"
            >
              Show more ({results.length - shown} left)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
