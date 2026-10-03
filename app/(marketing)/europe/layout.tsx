import Image from "next/image";
import Link from "next/link";
import { EuropeSocialLinks } from "@/components/europe/EuropeSocialLinks";
import { EUROPE_PARTNERS } from "@/lib/europe-partners";

/**
 * Europe-scoped chrome.
 *
 * ⚠ WHY THIS FILE EXISTS: Carvana is the US TITLE sponsor, and /europe is shown
 * to European sponsor prospects. The global header and footer both render the
 * Carvana lockup, and the footer prints Carvana's mark labelled "Title Partner"
 * linking to carvana.com — a rival's billing on the prospect's own pitch.
 * Chris Patrick flagged it 2026-09-14 ahead of a sponsor meeting.
 *
 * ⚠ THIS DOES NOT MAKE EUROPE A SEPARATE SITE. Europe is a REGION of
 * ppatour.com — Bryce's call 2026-08-24, see docs/EUROPE.md. This makes the
 * region look like its own site. Chris has twice asked for a genuinely
 * standalone site; that remains a different, unbuilt project.
 *
 * ⚠ HOW THE GLOBAL CHROME IS REMOVED: `data-region="europe"` below is
 * SERVER-RENDERED, and `app/globals.css` hides `.site-chrome` and
 * `.site-footer` via `html:has([data-region="europe"])`. It must stay
 * server-rendered. The two in-repo precedents for hiding global chrome —
 * `data-app-mode` (components/app/use-app-mode.ts) and `body[data-deck="usap"]`
 * (components/partners/UsapDeck.tsx:46) — both set their attribute in a
 * useEffect, i.e. AFTER hydration. Either would paint the Carvana header on
 * first load and swap it a beat later. UsapDeck survives that because its deck
 * is a fixed, opaque, full-screen overlay; this page has no such cover.
 *
 * ⚠ THE BUY BAR IS SUPPRESSED SEPARATELY, in StickyBuyBar itself — it is a
 * client component that returns null on this path. CSS could not have done it
 * honestly: the bar publishes `--buy-bar-visible-h` for other fixed chrome to
 * sit on, so hiding it visually would have left other elements reserving space
 * for a bar nobody can see.
 */

/**
 * ⚠ EUROPE-ONLY NAV (Payton, 10/2: add the Gallery page "to the menu"). Every
 * link points at a section of /europe or a /europe/* route, never a US page.
 * Historical note, kept because the rule still holds: Europe has no US routes. The global header's links (Events, Watch, Athletes,
 * Rankings, the Tour submenu, How It Works, Player Handbook) all lead to US
 * pages, which is precisely what Chris reported: "the links go to the wrong
 * place and there are lots that should not be on there." Inventing section
 * anchors here would risk linking to IDs that do not exist. A lockup that goes
 * nowhere wrong beats a nav that goes somewhere wrong.
 *
 * The page renders its own RegionSwitcher, so a visitor can still reach the
 * other regional tours.
 */
const EUROPE_NAV = [
  { label: "Schedule", href: "/europe#schedule", mobile: false },
  { label: "The Pros", href: "/europe#pros", mobile: false },
  { label: "Gallery", href: "/europe/gallery", mobile: true },
  { label: "Contact", href: "/europe#contact", mobile: false },
];

function EuropeHeader() {
  return (
    <header className="sticky top-0 z-50 bg-ppa-navy">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
        <Link
          href="/europe"
          aria-label="PPA Tour Europe — home"
          className="flex shrink-0 items-center gap-3"
        >
          {/* The shipped lockup cropped to drop the Carvana badge and wordmark.
              ⚠ width is 670, NOT 1408 — the crop's real intrinsic width. The
              global header hardcodes 1408 for the full lockup, so copying that
              number here would hand next/image a 9.45:1 ratio for 4.5:1
              artwork and render it stretched. */}
          <Image
            src="/ppa/logos/ppa-tour-horizontal-white.svg"
            alt="PPA Tour"
            width={670}
            height={149}
            priority
            className="h-6 w-auto"
          />
          <span className="border-l border-white/25 pl-3 text-[12px] font-bold uppercase tracking-[0.14em] text-white">
            Europe
          </span>
        </Link>
        <nav aria-label="PPA Tour Europe" className="ml-auto flex items-center gap-1">
          {EUROPE_NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-2.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/75 transition-colors hover:text-white ${l.mobile ? "" : "hidden md:block"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {/* Top right of the main menu, white (Albert + Payton, 10/2). */}
        <div className="border-l border-white/20 pl-1 sm:pl-2">
          <EuropeSocialLinks size="sm" />
        </div>
      </div>
    </header>
  );
}

/**
 * ⚠ EUROPE'S PARTNERS ONLY. The global footer renders ten US partner marks,
 * Carvana among them; none of those may appear here. The strip below is
 * Europe's own two (lib/europe-partners.ts), same tile style as ppatour.com.
 *
 * ⚠ NO US TOUR LINKS either — the global footer's Pro Tour column carries
 * Tixr tickets, How It Works and the Player Handbook, all US. Only the legal
 * pages are genuinely site-wide, so only they survive.
 *
 * ⚠ EUROPE'S OWN SOCIALS ONLY. The global footer links five @ppatour accounts,
 * which are the US tour's. These are the three @ppatoureurope accounts Payton
 * confirmed (lib/europe-socials.ts), added 10/1 after two asks (9/22, 9/23).
 */
function EuropeFooter() {
  return (
    <footer className="bg-ppa-navy text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="mb-10 border-b border-white/10 pb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">Our Sponsors</p>
          <ul className="mt-4 flex flex-wrap gap-3">
            {EUROPE_PARTNERS.map((p) => (
              <li key={p.name}>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  title={`${p.name} · ${p.role}`}
                  className="flex h-16 w-40 items-center justify-center bg-white px-4 transition-opacity hover:opacity-85 sm:h-[72px] sm:w-48"
                >
                  <Image src={p.logo} alt={`${p.name}, ${p.role}`} width={p.w} height={p.h} className="max-h-8 w-auto" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Image
            src="/ppa/logos/ppa-tour-horizontal-white.svg"
            alt="PPA Tour"
            width={670}
            height={149}
            className="h-7 w-auto"
          />
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href="/about/privacy"
              className="text-[12px] text-white/60 transition-colors hover:text-white"
            >
              Privacy
            </Link>
            <Link
              href="/about/terms"
              className="text-[12px] text-white/60 transition-colors hover:text-white"
            >
              Terms
            </Link>
          </nav>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
            Follow PPA Tour Europe
          </span>
          <EuropeSocialLinks />
        </div>
        <p className="mt-8 text-[12px] text-white/45">
          PPA Tour Europe. © {new Date().getFullYear()} Pickleball Inc.
        </p>
      </div>
    </footer>
  );
}

export default function EuropeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-region="europe">
      <EuropeHeader />
      {children}
      <EuropeFooter />
    </div>
  );
}
