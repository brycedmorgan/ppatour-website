"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type SubLink = { label: string; href: string };
type NavItem = {
  label: string;
  href?: string;
  external?: boolean;
  submenu?: SubLink[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Watch", href: "/watch" },
  { label: "Play", href: "/play" },
  { label: "Athletes", href: "/athletes" },
  { label: "Rankings", href: "/rankings" },
  { label: "Events", href: "/events" },
  {
    label: "Tour",
    submenu: [
      { label: "Junior PPA", href: "/tour/junior" },
      { label: "Senior Open", href: "/tour/senior" },
      { label: "State Championships", href: "/tour/state-championships" },
      { label: "PPA Camps", href: "/tour/camps" },
      { label: "Travel", href: "/tour/travel" },
      { label: "Hospitality", href: "/tour/hospitality" },
    ],
  },
  {
    label: "About",
    submenu: [
      { label: "About the PPA Tour", href: "/about" },
      { label: "The Pro Tour", href: "/about/pro-tour" },
      { label: "Tournament History", href: "/about/history" },
      { label: "How It Works", href: "/about/how-it-works" },
      { label: "Sponsors", href: "/about/sponsors" },
      { label: "What is Pickleball?", href: "/about/what-is-pickleball" },
      { label: "Contact", href: "/about/contact" },
    ],
  },
  {
    label: "Shop",
    href: "https://pickleballcentral.com/apparel/ppa-tour-apparel/",
    external: true,
  },
];

/**
 * Site nav (§9.5). Logo + nav with dropdown submenus, Shop, and Search.
 * Mobile drawer expands submenus inline.
 */
export function Header() {
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  return (
    <header className="bg-ppa-navy text-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          aria-label="Carvana PPA Tour — home"
          className="flex shrink-0 items-center"
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

        <nav className="hidden items-center md:flex">
          {NAV_ITEMS.map((item) => {
            if (item.submenu) {
              return (
                <div key={item.label} className="group relative">
                  <button
                    type="button"
                    aria-haspopup="true"
                    className="flex items-center gap-1 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.12em] text-white/75 transition-colors hover:text-white"
                  >
                    {item.label}
                    <span aria-hidden className="text-[9px]">
                      ▾
                    </span>
                  </button>
                  <div className="invisible absolute right-0 top-full z-50 w-60 origin-top-right border border-ppa-line bg-white opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-ppa-blue" />
                    <ul className="py-2">
                      {item.submenu.map((s) => (
                        <li key={s.href}>
                          <Link
                            href={s.href}
                            className="block px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-ppa-navy transition-colors hover:bg-ppa-paper hover:text-ppa-blue"
                          >
                            {s.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href!}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="flex items-center gap-1 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.12em] text-white/75 transition-colors hover:text-white"
              >
                {item.label}
                {item.external && (
                  <span aria-hidden className="text-[10px] text-white/40">
                    ↗
                  </span>
                )}
              </Link>
            );
          })}

          <Link
            href="/search"
            aria-label="Search"
            className="ml-1 flex size-9 items-center justify-center text-white/75 transition-colors hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
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

      {/* Mobile drawer */}
      {open && (
        <nav className="border-t border-white/10 md:hidden">
          {NAV_ITEMS.map((item) => {
            if (item.submenu) {
              const expanded = mobileExpanded === item.label;
              return (
                <div
                  key={item.label}
                  className="border-b border-white/5"
                >
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() =>
                      setMobileExpanded(expanded ? null : item.label)
                    }
                    className="flex w-full items-center justify-between px-4 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white/80 transition-colors hover:bg-white/5"
                  >
                    {item.label}
                    <span
                      aria-hidden
                      className={`text-xs transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                    >
                      ▾
                    </span>
                  </button>
                  {expanded && (
                    <ul className="bg-white/5 pb-2">
                      {item.submenu.map((s) => (
                        <li key={s.href}>
                          <Link
                            href={s.href}
                            onClick={() => {
                              setOpen(false);
                              setMobileExpanded(null);
                            }}
                            className="block px-7 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white/65 hover:text-white"
                          >
                            {s.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href!}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-white/5 px-4 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white/75 transition-colors hover:bg-white/5 hover:text-white"
              >
                <span>{item.label}</span>
                {item.external && (
                  <span aria-hidden className="text-xs text-white/35">
                    ↗
                  </span>
                )}
              </Link>
            );
          })}
          <Link
            href="/search"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white/75 hover:bg-white/5 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            Search
          </Link>
        </nav>
      )}
    </header>
  );
}
