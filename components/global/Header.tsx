"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Watch", href: "/watch" },
  { label: "Play", href: "/play" },
  { label: "Athletes", href: "/athletes" },
  { label: "Events", href: "/events" },
  { label: "About", href: "/about" },
];

/**
 * Site nav (§9.5). Logo · Watch · Play · Athletes · Events · About.
 * No header Buy Tickets / Register buttons (current 0.1% click rate).
 */
export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-ppa-navy text-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          aria-label="Carvana PPA Tour — home"
          className="flex items-center"
        >
          <Image
            src="/ppa/logos/ppa-horizontal-white.svg"
            alt="Carvana PPA Tour"
            width={1408}
            height={149}
            priority
            className="h-6 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13px] font-bold uppercase tracking-[0.12em] text-white/75 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex size-10 items-center justify-center text-white md:hidden"
        >
          <div className="space-y-1.5">
            <span
              className={`block h-0.5 w-6 bg-current transition-transform ${
                open ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-current transition-opacity ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-current transition-transform ${
                open ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 md:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-white/5 px-4 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white/75 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
