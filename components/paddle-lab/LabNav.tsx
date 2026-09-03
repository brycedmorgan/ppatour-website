"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LAB_PATH } from "@/lib/paddle-lab-shared";

const LINKS = [
  { href: LAB_PATH, label: "Paddle Lab", exact: true },
  { href: `${LAB_PATH}/paddles`, label: "Browse" },
  { href: `${LAB_PATH}/compare`, label: "Compare" },
  { href: `${LAB_PATH}/how-we-test`, label: "How We Test" },
];

/** The section strip under the site header on every lab page. */
export function LabNav() {
  const pathname = pathnameOrEmpty(usePathname());
  return (
    <nav aria-label="Paddle Lab" className="border-b border-ppa-line bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-1 overflow-x-auto px-4">
        {LINKS.map((l) => {
          const on = l.exact ? pathname.replace(/\/$/, "") === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={on ? "page" : undefined}
              className={`shrink-0 border-b-2 px-3 py-3 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                on ? "border-ppa-blue text-ppa-navy" : "border-transparent text-ppa-navy/55 hover:text-ppa-navy"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function pathnameOrEmpty(p: string | null): string {
  return p ?? "";
}
