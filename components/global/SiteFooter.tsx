import Image from "next/image";
import { EUROPE_PUBLIC } from "@/lib/europe-launch";
import Link from "next/link";
import { footerPartners, showsDesignation } from "@/lib/home-content";
import { partnerLink } from "@/lib/partner-link";
import { withUtm } from "@/lib/utm";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { matchdayPrimary } from "@/lib/matchday";

type FooterLink = { label: string; href: string; external?: boolean };

const PRO_TOUR_LINKS: FooterLink[] = [
  { label: "Schedule", href: "/events" },
  { label: "Athletes", href: "/athletes" },
  { label: "Leaderboard", href: "/rankings" },
  { label: "Watch", href: "/watch" },
  {
    label: "Tickets",
    href: withUtm("https://www.tixr.com/groups/ppa", {
      campaign: "sitewide",
      content: "footer-tickets",
    }),
    external: true,
  },
  { label: "How It Works", href: "/about/how-it-works" },
  { label: "Player Handbook", href: "/about/player-handbook" },
  { label: "Tournament History", href: "/about/history" },
  /**
   * The PPA Blog — how to play, scoring, gear, terminology. Sits beside How It
   * Works because it answers the same beginner question one level down, and a
   * site-wide link is what gives 39 evergreen pages an internal path in from
   * every route rather than only from /news.
   */
  { label: "Pickleball Blog", href: "/blog" },
];

const PPA_LINKS: FooterLink[] = [
  // ⚠ Unlisted until EUROPE_PUBLIC flips — see lib/europe-launch.ts. The page is
  // live for anyone with the link; it just isn't advertised here yet.
  ...(EUROPE_PUBLIC
    ? [{ label: "PPA Tour Europe", href: "/europe" }]
    : []),
  { label: "About the PPA Tour", href: "/about" },
  { label: "Sponsors", href: "/about/sponsors" },
  { label: "Host a Tournament", href: "/about/host-tournament" },
  { label: "Host a Private Event", href: "/about/private-events" },
  { label: "Ambassador Program", href: "/about/ambassadors" },
  { label: "Careers", href: "/about/careers" },
  { label: "Contact", href: "/about/contact" },
  { label: "Integrity Reporting", href: "/about/integrity" },
];

const PICKLEBALL_INC_LINKS: FooterLink[] = [
  { label: "Pickleball.com", href: "https://www.pickleball.com", external: true },
  {
    label: "Pickleball Central",
    href: "https://www.pickleballcentral.com/?utm_source=ppatour&utm_medium=website&utm_campaign=sitewide&utm_content=footer-shop",
    external: true,
  },
  {
    label: "PickleballTV",
    href: "https://www.pickleballtv.com/?utm_source=ppatour&utm_medium=website&utm_campaign=sitewide&utm_content=footer-pbtv",
    external: true,
  },
  {
    label: "Pickleball Tournaments",
    href: withUtm("https://www.pickleballtournaments.com", {
      campaign: "sitewide",
      content: "footer-register",
    }),
    external: true,
  },
  { label: "Top Court", href: "https://www.topcourt.com", external: true },
  { label: "Just Courts", href: "https://www.justcourts.com", external: true },
  { label: "MATCHDAY App", href: matchdayPrimary("footer-matchday"), external: true },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: "Privacy Policy", href: "/about/privacy" },
  { label: "Terms of Use", href: "/about/terms" },
  { label: "Transgender Policy", href: "/about/transgender-policy" },
];

const SOCIAL = [
  {
    name: "Instagram",
    color: "url(#ig-gradient)",
    href: "https://www.instagram.com/ppatour",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  },
  {
    name: "X",
    color: "#FFFFFF",
    href: "https://x.com/ppatour",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    name: "YouTube",
    color: "#FF0000",
    href: "https://www.youtube.com/channel/UCSP6HlrMmRqogym2aHBPHpw",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    name: "TikTok",
    color: "#25F4EE",
    href: "https://www.tiktok.com/@officialppatour",
    path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  },
  {
    name: "Facebook",
    color: "#1877F2",
    href: "https://www.facebook.com/OfficialPPATour",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
];

function LinkGroup({
  heading,
  links,
}: {
  heading: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
        {heading}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1 text-[13px] text-white/70 transition-colors hover:text-white"
            >
              {l.label}
              {l.external && (
                <span aria-hidden className="text-[10px] text-white/30">
                  ↗
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer bg-ppa-navy text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        {/* Top row — logo + social */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
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
              className="h-7 w-auto sm:h-8"
            />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
              Follow the Tour
            </span>
            <div className="flex gap-2">
              {/* Instagram's mark is a gradient, not a flat color. */}
              <svg width="0" height="0" aria-hidden className="absolute">
                <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFD521" />
                  <stop offset="35%" stopColor="#F50000" />
                  <stop offset="70%" stopColor="#B900B4" />
                  <stop offset="100%" stopColor="#4F5BD5" />
                </linearGradient>
              </svg>
              {SOCIAL.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="flex size-9 items-center justify-center border border-white/15 transition-colors hover:border-white/40 hover:bg-white/10"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill={s.color}
                    aria-hidden
                  >
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* The tagline lockup — Jeff Watson, 7/31: "would be nice to be
            semi front-and-center." It sits directly under the tour logo so it
            reads as the brand sign-off rather than another footer widget.
            The reversed art is the one drawn for a navy field: white letters,
            yellow pickleball as the full stop. That ball IS the mark, so we
            use the two-colour reversed lockup and never the flat white one
            here. Vector, so it stays sharp at every size below. */}
        <div className="mt-7">
          <Image
            src="/ppa/logos/be-the-best-white.svg"
            alt="Be the Best"
            width={881}
            height={172}
            priority={false}
            className="h-11 w-auto sm:h-16 lg:h-20"
          />
        </div>

        {/* Newsletter signup (GF #2) */}
        <div className="mt-10 border-t border-white/10 pt-8">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="font-display text-lg uppercase text-white">Stay in the Know</p>
              <p className="mt-1 max-w-md text-[13px] leading-relaxed text-white/55">
                Be among the first to know about upcoming events, promotions, giveaways, news, and more.
              </p>
            </div>
            <div className="w-full sm:w-80">
              <InquiryForm formType="newsletter" />
            </div>
          </div>
        </div>

        {/* Our sponsors — strip + become-a-sponsor CTA (leads → /about/sponsors#inquire) */}
        <div className="mt-10 border-t border-white/10 pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
              Our Sponsors
            </p>
            <Link
              href="/about/sponsors#inquire"
              className="group inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-yellow transition-colors hover:text-white"
            >
              Become a Sponsor
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>
          {/* Title partner + Platinum only. Each mark forwards to the partner's
              own site like every other partner surface — these pointed at
              /about/sponsors until 8/3, which made the footer the one place a
              sponsor's logo didn't reach the sponsor. */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {footerPartners.map((p) => {
              const { href, external } = partnerLink(p);
              // Designation appended only when we hold one — otherwise this
              // read "Zimmer Biomet — undefined" on hover.
              const label = showsDesignation(p) ? `${p.name} — ${p.role}` : p.name;
              const inner = (
                <Image
                  src={p.logo!}
                  alt={p.name}
                  width={p.logoWidth!}
                  height={p.logoHeight!}
                  sizes="104px"
                  className="max-h-6 w-auto max-w-[104px] object-contain"
                />
              );
              const cls =
                "flex h-12 items-center justify-center bg-white px-4 transition-opacity hover:opacity-85";
              return external ? (
                <a
                  key={p.name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className={cls}
                >
                  {inner}
                </a>
              ) : (
                <Link key={p.name} href={href} title={label} className={cls}>
                  {inner}
                </Link>
              );
            })}
            {/* The strip now shows 9 of 29, so the rest need a way in. */}
            <Link
              href="/about/sponsors"
              className="flex h-12 items-center px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/55 transition-colors hover:text-white"
            >
              All Sponsors →
            </Link>
          </div>
        </div>

        {/* Link groups */}
        <div className="mt-10 grid gap-10 border-t border-white/10 pt-10 sm:grid-cols-3">
          <LinkGroup heading="Pro Tour" links={PRO_TOUR_LINKS} />
          <LinkGroup heading="PPA" links={PPA_LINKS} />
          <LinkGroup heading="Pickleball Inc." links={PICKLEBALL_INC_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-xs leading-relaxed text-white/35">
            © {new Date().getFullYear()} Professional Pickleball Association.
            The Pro Tour of Pickleball.
          </p>
          <nav className="flex flex-wrap gap-x-5 gap-y-1.5">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
