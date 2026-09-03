"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useCompare } from "./compare-store";
import { compareHref, MAX_COMPARE } from "@/lib/paddle-lab-shared";

/**
 * The sticky bar at the bottom of every lab page once a paddle is added.
 * Hidden on the compare page itself, where the URL is the tray.
 */
export function CompareTray({ names }: { names: Record<string, string> }) {
  const { list, remove, clear } = useCompare();
  const pathname = usePathname();
  if (!list.length || pathname?.startsWith("/paddle-lab/compare")) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ppa-navy-soft bg-ppa-navy text-white shadow-[0_-8px_24px_rgba(0,0,0,0.25)]">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
        <p className="hidden shrink-0 text-[11px] font-bold uppercase tracking-[0.18em] text-white/60 sm:block">
          Compare {list.length}/{MAX_COMPARE}
        </p>
        <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {list.map((slug) => (
            <li
              key={slug}
              className="flex shrink-0 items-center gap-2 border border-white/20 bg-white/10 py-1.5 pl-3 pr-1.5 text-xs font-medium"
            >
              <span className="max-w-[10rem] truncate">{names[slug] ?? slug}</span>
              <button
                type="button"
                onClick={() => remove(slug)}
                aria-label={`Remove ${names[slug] ?? slug} from compare`}
                className="p-0.5 text-white/60 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={clear}
          className="hidden text-[11px] font-bold uppercase tracking-[0.14em] text-white/60 hover:text-white sm:block"
        >
          Clear
        </button>
        <Link
          href={compareHref(list)}
          className={`shrink-0 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
            list.length >= 2 ? "bg-ppa-blue text-white hover:bg-ppa-blue-deep" : "bg-white/15 text-white/70"
          }`}
        >
          {list.length >= 2 ? "Compare" : "Add one more"}
        </Link>
      </div>
    </div>
  );
}
