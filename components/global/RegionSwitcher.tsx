import Link from "next/link";

/**
 * Region switcher.
 *
 * ⚠ REGION IS A PATH, LANGUAGE IS A PREFIX, AND THIS CONTROL ONLY SWITCHES THE
 * FIRST ONE. They are separate axes on purpose — Germans live in Spain. See
 * `docs/EUROPE.md`.
 *
 * ⚠ TWO OF THE FOUR REGIONS LEAVE THE SITE, AND THAT IS NOT A GAP WE CAN CLOSE.
 * Asia and Australia are run by licensed regional operators on their own
 * domains — `ppatour.com.au` is registered to Pacific Pickleball Pty Ltd, not to
 * us — so those entries are external links, marked as such, exactly as the
 * event cards for their stops already are. Europe is the last region we could
 * fold in, which is why it is a path here rather than a fifth host.
 *
 * ⚠ IT NEVER REDIRECTS ANYONE. A visitor picks a region; geo-IP may one day
 * suggest one, but the URL is never decided by an IP address — Googlebot crawls
 * from US datacenters, so a hard geo-redirect leaves every European page
 * unindexed and breaks every shared link.
 */
type Region = {
  label: string;
  href: string;
  external?: boolean;
};

const REGIONS: Region[] = [
  { label: "USA", href: "/" },
  { label: "Europe", href: "/europe" },
  { label: "Asia", href: "https://www.ppatour-asia.com", external: true },
  { label: "Australia", href: "https://ppatour.com.au", external: true },
];

export function RegionSwitcher({ active }: { active: string }) {
  return (
    <nav
      aria-label="Tour region"
      className="border-b border-white/10 bg-ppa-navy-deep text-white"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-1 gap-y-1.5 px-4 py-2">
        <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
          Region
        </span>
        {REGIONS.map((r) => {
          const isActive = r.label === active;
          const cls = `px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
            isActive
              ? "bg-white/10 text-white"
              : "text-white/55 hover:text-white"
          }`;
          if (r.external) {
            return (
              <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer" className={cls}>
                {r.label} ↗
              </a>
            );
          }
          return (
            <Link key={r.label} href={r.href} className={cls} aria-current={isActive ? "page" : undefined}>
              {r.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
