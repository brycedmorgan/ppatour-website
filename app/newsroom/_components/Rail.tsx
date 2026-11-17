"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, House, LayoutDashboard, LogOut, Newspaper } from "lucide-react";
import { NEWSROOM_PATH } from "@/lib/newsroom/session";
import { logout } from "../actions";

const LINKS = [
  { href: `${NEWSROOM_PATH}/`, label: "Overview", icon: LayoutDashboard, exact: true },
  { href: `${NEWSROOM_PATH}/posts/`, label: "Posts", icon: Newspaper },
  { href: `${NEWSROOM_PATH}/home-picks/`, label: "Home page", icon: House },
];

const item =
  "group relative flex size-11 items-center justify-center text-white/70 transition-colors hover:bg-white/10 hover:text-white";

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-full z-10 ml-2 whitespace-nowrap bg-ppa-navy-deep px-2 py-1 text-xs font-semibold text-white opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-md:hidden"
    >
      {children}
    </span>
  );
}

/** The icon rail: left on desktop, bottom bar on phones. Labels as tooltips. */
export function Rail({ editor }: { editor: string }) {
  const pathname = usePathname() || "";
  return (
    <aside className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around bg-ppa-navy px-2 py-1 md:inset-y-0 md:left-0 md:right-auto md:w-16 md:flex-col md:justify-start md:gap-1 md:py-4">
      <Link
        href={`${NEWSROOM_PATH}/`}
        aria-label="Newsroom home"
        className="mb-4 hidden size-11 items-center justify-center bg-ppa-blue font-display text-xs text-white md:flex"
      >
        PPA
      </Link>
      <nav aria-label="Newsroom" className="flex gap-1 md:flex-col">
        {LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href || `${pathname}/` === href : pathname.startsWith(href.replace(/\/$/, ""));
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`${item} ${active ? "bg-ppa-blue! text-white!" : ""}`}
            >
              <Icon className="size-5" aria-hidden />
              <Tip>{label}</Tip>
            </Link>
          );
        })}
      </nav>
      <div className="flex gap-1 md:mt-auto md:flex-col">
        <a href="/news/" target="_blank" rel="noopener noreferrer" aria-label="View the site" className={item}>
          <ExternalLink className="size-5" aria-hidden />
          <Tip>View the site</Tip>
        </a>
        <form action={logout}>
          <button type="submit" aria-label={`Sign out ${editor}`} className={item}>
            <LogOut className="size-5" aria-hidden />
            <Tip>Sign out</Tip>
          </button>
        </form>
      </div>
    </aside>
  );
}
