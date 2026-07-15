"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  formatDateRange,
  getMainTourEvents,
  getNextTournament,
  tierShort,
} from "@/lib/placeholder-data";
import { tourPrograms } from "@/lib/tour-programs";

type SubLink = { label: string; href: string };
type NavItem = {
  label: string;
  href?: string;
  external?: boolean;
  /** Desktop: opens a full-width mega panel. Mobile: inline submenu. */
  mega?: boolean;
  submenu?: SubLink[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Watch", href: "/watch" },
  { label: "Play", href: "/play" },
  { label: "Athletes", href: "/athletes" },
  { label: "Rankings", href: "/rankings" },
  { label: "Events", href: "/events", mega: true },
  {
    label: "Tour",
    mega: true,
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
    mega: true,
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
    href: "https://pickleballcentral.com/apparel/ppa-tour-apparel/?utm_source=ppatour&utm_medium=website&utm_campaign=sitewide&utm_content=header-shop",
    external: true,
  },
];

/* ── Mega-panel building blocks ─────────────────────────────── */

function PanelEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ppa-navy/40">
      <span className="h-1.5 w-1.5 bg-ppa-blue" />
      {children}
    </p>
  );
}

function BigLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group/big flex items-baseline gap-2 font-display text-xl uppercase leading-tight text-ppa-navy transition-colors hover:text-ppa-blue"
    >
      {label}
      <span
        aria-hidden
        className="text-sm text-ppa-blue opacity-0 transition-all duration-300 group-hover/big:translate-x-1 group-hover/big:opacity-100"
      >
        →
      </span>
    </Link>
  );
}

function SmallLink({
  href,
  label,
  detail,
  onNavigate,
}: {
  href: string;
  label: string;
  detail?: string;
  onNavigate: () => void;
}) {
  return (
    <Link href={href} onClick={onNavigate} className="group/small block">
      <span className="text-sm font-bold text-ppa-navy transition-colors group-hover/small:text-ppa-blue">
        {label}
      </span>
      {detail && (
        <span className="mt-0.5 block text-xs leading-snug text-ppa-navy/50">
          {detail}
        </span>
      )}
    </Link>
  );
}

function FeatureCard({
  href,
  image,
  eyebrow,
  title,
  meta,
  onNavigate,
}: {
  href: string;
  image: string;
  eyebrow: string;
  title: string;
  meta: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group/card relative isolate flex aspect-[4/3] flex-col justify-end overflow-hidden bg-ppa-navy"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="320px"
        className="will-change-transform object-cover transition-transform duration-700 group-hover/card:scale-105"
      />
      <div className="absolute inset-0 scrim-card" />
      <div className="relative p-4 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ppa-sky">
          {eyebrow}
        </p>
        <p className="mt-1 font-display text-lg uppercase leading-[1.05]">
          {title}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-white/70">{meta}</p>
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center bg-ppa-blue text-sm text-white transition-transform duration-300 group-hover/card:translate-x-1"
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

function MegaPanelContent({
  menu,
  onNavigate,
}: {
  menu: string;
  onNavigate: () => void;
}) {
  const delay = (i: number) => ({ animationDelay: `${i * 70}ms` });
  const col = "motion-safe:animate-rise";

  if (menu === "Events") {
    const next = getNextTournament();
    const upcoming = getMainTourEvents().slice(0, 5);
    return (
      <div className="grid grid-cols-[1fr_1.3fr_20rem] gap-10">
        <div className={col} style={delay(0)}>
          <PanelEyebrow>Explore</PanelEyebrow>
          <div className="mt-4 space-y-3">
            <BigLink href="/events" label="Full Schedule" onNavigate={onNavigate} />
            <BigLink href="/rankings" label="Rankings" onNavigate={onNavigate} />
            <BigLink href="/news" label="Latest News" onNavigate={onNavigate} />
          </div>
        </div>
        <div className={col} style={delay(1)}>
          <PanelEyebrow>Upcoming Stops</PanelEyebrow>
          <ul className="mt-4 space-y-3.5">
            {upcoming.map((t) => (
              <li key={t.slug}>
                <SmallLink
                  href={`/events/${t.slug}`}
                  label={t.shortName}
                  detail={`${tierShort(t)} · ${formatDateRange(t.startDate, t.endDate)} · ${t.city}`}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </div>
        <div className={col} style={delay(2)}>
          <PanelEyebrow>Next Event</PanelEyebrow>
          <div className="mt-4">
            <FeatureCard
              href={`/events/${next.slug}`}
              image={next.image}
              eyebrow={`${tierShort(next)} · ${next.city}, ${next.state}`}
              title={next.shortName}
              meta={`Tickets from $${next.ticketPriceFrom}`}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      </div>
    );
  }

  if (menu === "Tour") {
    return (
      <div className="grid grid-cols-[1.6fr_20rem] gap-10">
        <div className={col} style={delay(0)}>
          <PanelEyebrow>Beyond the Pro Draw</PanelEyebrow>
          <div className="mt-4 grid grid-cols-2 gap-x-10 gap-y-4">
            {tourPrograms.map((p) => (
              <SmallLink
                key={p.slug}
                href={`/tour/${p.slug}`}
                label={p.label}
                detail={p.eyebrow}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
        <div className={col} style={delay(1)}>
          <PanelEyebrow>Get On Court</PanelEyebrow>
          <div className="mt-4">
            <FeatureCard
              href="/play"
              image="/ppa/action-singles.jpg"
              eyebrow="For Players"
              title="Play a PPA Event"
              meta="Amateur brackets at every stop"
              onNavigate={onNavigate}
            />
          </div>
        </div>
      </div>
    );
  }

  // About
  return (
    <div className="grid grid-cols-[1fr_1fr_20rem] gap-10">
      <div className={col} style={delay(0)}>
        <PanelEyebrow>The Organization</PanelEyebrow>
        <div className="mt-4 space-y-3">
          <BigLink href="/about" label="About the Tour" onNavigate={onNavigate} />
          <BigLink href="/about/pro-tour" label="The Pro Tour" onNavigate={onNavigate} />
          <BigLink href="/about/history" label="History" onNavigate={onNavigate} />
        </div>
      </div>
      <div className={col} style={delay(1)}>
        <PanelEyebrow>Learn More</PanelEyebrow>
        <ul className="mt-4 space-y-3.5">
          <li>
            <SmallLink href="/about/how-it-works" label="How It Works" detail="Season format, points, and divisions" onNavigate={onNavigate} />
          </li>
          <li>
            <SmallLink href="/about/sponsors" label="Sponsors" detail="Title and official partners" onNavigate={onNavigate} />
          </li>
          <li>
            <SmallLink href="/about/host-tournament" label="Host a Tournament" detail="Bring a PPA event to your venue" onNavigate={onNavigate} />
          </li>
          <li>
            <SmallLink href="/about/contact" label="Contact" detail="Reach the right PPA team" onNavigate={onNavigate} />
          </li>
        </ul>
      </div>
      <div className={col} style={delay(2)}>
        <PanelEyebrow>New Here?</PanelEyebrow>
        <div className="mt-4">
          <FeatureCard
            href="/about/what-is-pickleball"
            image="/ppa/action-mxd.jpg"
            eyebrow="New to the Sport"
            title="What is Pickleball?"
            meta="The basics, in two minutes"
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Site nav (§9.5). Logo + nav; Events / Tour / About open full-width mega
 * panels on desktop (hover or click, Esc closes, page dims behind). Mobile
 * keeps the drawer with inline submenus.
 */
export function Header() {
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [megaOpen, setMegaOpen] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);

  function cancelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }
  function openMega(label: string) {
    cancelClose();
    setMegaOpen(label);
  }
  function scheduleClose() {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setMegaOpen(null), 150);
  }
  function closeMega() {
    cancelClose();
    setMegaOpen(null);
  }

  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMegaOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [megaOpen]);

  // Warm the mega-panel featured images so the first open doesn't flash
  // a navy card while the photo lazy-loads.
  useEffect(() => {
    const paths = [
      getNextTournament().image,
      "/ppa/action-singles.jpg",
      "/ppa/action-mxd.jpg",
    ];
    for (const path of paths) {
      for (const w of [384, 640]) {
        const img = new window.Image();
        img.src = `/_next/image?url=${encodeURIComponent(path)}&w=${w}&q=75`;
      }
    }
  }, []);

  return (
    <header className="relative bg-ppa-navy text-white" onMouseLeave={scheduleClose}>
      {/* Dim the page while a mega panel is open. */}
      <div
        aria-hidden
        onClick={closeMega}
        onMouseEnter={scheduleClose}
        className={`fixed inset-0 -z-10 hidden bg-ppa-navy-deep/50 backdrop-blur-[2px] transition-opacity duration-300 md:block ${
          megaOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          onClick={() => {
            setOpen(false);
            closeMega();
          }}
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
            const active = megaOpen === item.label;
            const base = `relative flex items-center gap-1 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.12em] transition-colors ${
              active ? "text-white" : "text-white/75 hover:text-white"
            }`;
            const indicator = (
              <span
                aria-hidden
                className={`absolute inset-x-3 -bottom-[13px] h-0.5 bg-ppa-blue transition-all duration-300 ${
                  active ? "scale-x-100 opacity-100" : "scale-x-50 opacity-0"
                }`}
              />
            );

            if (item.mega && item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onMouseEnter={() => openMega(item.label)}
                  onClick={closeMega}
                  aria-expanded={active}
                  className={base}
                >
                  {item.label}
                  <span aria-hidden className={`text-[9px] transition-transform duration-300 ${active ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                  {indicator}
                </Link>
              );
            }
            if (item.mega) {
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={active}
                  onMouseEnter={() => openMega(item.label)}
                  onClick={() => (active ? closeMega() : openMega(item.label))}
                  className={base}
                >
                  {item.label}
                  <span aria-hidden className={`text-[9px] transition-transform duration-300 ${active ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                  {indicator}
                </button>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href!}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onMouseEnter={scheduleClose}
                className={base}
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
            onMouseEnter={scheduleClose}
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

      {/* Mega panel (desktop) — one shared panel, content keyed by menu. */}
      <div
        onMouseEnter={cancelClose}
        className={`absolute inset-x-0 top-full hidden origin-top border-b border-ppa-line bg-white text-ppa-navy shadow-[0_32px_56px_-16px_rgba(7,34,58,0.45)] transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] md:block ${
          megaOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <div className="h-0.5 bg-ppa-blue" />
        {megaOpen && (
          <div key={megaOpen} className="mx-auto w-full max-w-6xl px-4 py-8">
            <MegaPanelContent menu={megaOpen} onNavigate={closeMega} />
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="border-t border-white/10 md:hidden">
          {NAV_ITEMS.map((item) => {
            if (item.submenu) {
              const expanded = mobileExpanded === item.label;
              return (
                <div key={item.label} className="border-b border-white/5">
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
