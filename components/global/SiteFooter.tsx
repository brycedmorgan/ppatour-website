import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Watch", href: "/watch" },
  { label: "Play", href: "/play" },
  { label: "Athletes", href: "/athletes" },
  { label: "Events", href: "/events" },
  { label: "About", href: "/about" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-ppa-ink">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="font-display text-2xl font-bold uppercase tracking-tight"
          >
            <span className="text-white">PPA</span>
            <span className="text-ppa-red"> Tour</span>
          </Link>
          <nav className="flex flex-wrap gap-x-7 gap-y-2">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-display text-sm font-semibold uppercase tracking-wide text-white/60 hover:text-ppa-yellow"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-10 max-w-xl text-xs leading-relaxed text-white/35">
          © {new Date().getFullYear()} Professional Pickleball Association. The
          Pro Tour of Pickleball. Tickets via tixr · amateur registration via
          pickleballtournaments.com.
        </p>
      </div>
    </footer>
  );
}
