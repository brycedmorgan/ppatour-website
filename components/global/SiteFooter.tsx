import Image from "next/image";
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
      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            aria-label="Carvana PPA Tour — home"
            className="flex items-center"
          >
            <Image
              src="/ppa/logos/ppa-horizontal-white.svg"
              alt="Carvana PPA Tour"
              width={1408}
              height={149}
              className="h-8 w-auto"
            />
          </Link>
          <nav className="flex flex-wrap gap-x-8 gap-y-2">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13px] font-bold uppercase tracking-[0.12em] text-white/55 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="max-w-xl text-xs leading-relaxed text-white/35">
            © {new Date().getFullYear()} Professional Pickleball Association.
            The Pro Tour of Pickleball. Tickets via tixr · amateur registration
            via pickleballtournaments.com.
          </p>
        </div>
      </div>
    </footer>
  );
}
