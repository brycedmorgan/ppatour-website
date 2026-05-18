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
    <footer className="bg-ppa-navy text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-baseline gap-1.5 font-extrabold">
            <span className="text-xl">PPA</span>
            <span className="text-xl text-ppa-red">TOUR</span>
          </Link>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold uppercase tracking-wide text-white/70 hover:text-ppa-yellow"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 text-xs text-white/40">
          © {new Date().getFullYear()} Professional Pickleball Association.
          Tickets via tixr. Amateur registration via pickleballtournaments.com.
        </p>
      </div>
    </footer>
  );
}
