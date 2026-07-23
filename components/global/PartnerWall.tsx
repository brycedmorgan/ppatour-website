import Image from "next/image";
import Link from "next/link";
import { partners, type Partner } from "@/lib/home-content";
import { withUtm } from "@/lib/utm";

/**
 * The official partner directory — every designated partner of the PPA Tour,
 * given equal, valuable billing. Each partner leads with the category it owns
 * ("Official {X} of the PPA Tour"), which is the value; the wordmark logo
 * shows above the name when we hold the brand-kit file. Used on the homepage
 * and (via `event`) on every event page so the full family appears everywhere.
 *
 * Click-through (Connor, 7/23): a partner card forwards to that partner's own
 * site (UTM-tagged) when we hold a confident `website` for them; otherwise it
 * falls back to /about/sponsors (never a wrong destination).
 *
 * `accentVar` lets event pages tint the directory in their brand accent;
 * defaults to PPA blue.
 */

/** Where a partner card should send a fan, and whether it leaves the site. */
function partnerLink(p: Partner): { href: string; external: boolean } {
  if (p.website) {
    return {
      href: withUtm(p.website, {
        campaign: "sponsor-directory",
        content: `partner-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      }),
      external: true,
    };
  }
  return { href: "/about/sponsors", external: false };
}

export function PartnerWall({
  accentVar = "#228be6",
  eventName,
}: {
  accentVar?: string;
  eventName?: string;
}) {
  const title = partners.find((p) => p.tier === "title");
  const officials = partners.filter((p) => p.tier !== "title");

  return (
    <div>
      {/* Title partner — top billing, forwards to their site */}
      {title &&
        (() => {
          const { href, external } = partnerLink(title);
          const cls =
            "group flex flex-col items-start gap-5 border border-ppa-line bg-white p-6 transition-colors hover:border-[var(--pw-accent)] sm:flex-row sm:items-center sm:gap-8 sm:p-8";
          const inner = (
            <>
              {title.logo && (
                <span className="flex h-16 w-52 shrink-0 items-center justify-center sm:h-20">
                  <Image
                    src={title.logo}
                    alt={title.name}
                    width={title.logoWidth!}
                    height={title.logoHeight!}
                    className="max-h-full w-auto max-w-[200px] object-contain object-left"
                  />
                </span>
              )}
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: accentVar }}
                >
                  Title Partner
                </p>
                <p className="mt-1 font-display text-2xl uppercase leading-none text-ppa-navy sm:text-3xl">
                  {title.name}
                </p>
                <p className="mt-2 max-w-xl text-sm text-ppa-navy/55">
                  {eventName
                    ? `The named partner of the tour — on court at ${eventName} and all 25 stops.`
                    : title.note}
                </p>
              </div>
            </>
          );
          return external ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cls}
              style={{ ["--pw-accent" as string]: accentVar }}
            >
              {inner}
            </a>
          ) : (
            <Link
              href={href}
              className={cls}
              style={{ ["--pw-accent" as string]: accentVar }}
            >
              {inner}
            </Link>
          );
        })()}

      {/* Official partner grid — every partner, equal billing */}
      <div className="mt-4 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2 lg:grid-cols-3">
        {officials.map((p) => (
          <PartnerCard key={p.name} p={p} accent={accentVar} />
        ))}
      </div>
    </div>
  );
}

function PartnerCard({ p, accent }: { p: Partner; accent: string }) {
  const { href, external } = partnerLink(p);
  const cls =
    "group flex min-h-[132px] flex-col justify-between bg-white p-5 transition-colors hover:bg-ppa-paper";
  const inner = (
    <>
      {p.logo ? (
        <span className="flex h-9 w-fit items-center">
          <Image
            src={p.logo}
            alt={p.name}
            width={p.logoWidth!}
            height={p.logoHeight!}
            className="max-h-9 w-auto max-w-[130px] object-contain object-left"
          />
        </span>
      ) : (
        <span
          aria-hidden
          className="h-2 w-8"
          style={{ backgroundColor: accent }}
        />
      )}
      <div className="mt-4">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: accent }}
        >
          {p.role}
        </p>
        <p className="mt-1 flex items-center gap-1.5 font-display text-lg uppercase leading-[1.05] text-ppa-navy">
          {p.name}
          {external && (
            <span
              aria-hidden
              className="text-xs opacity-0 transition-opacity group-hover:opacity-60"
            >
              ↗
            </span>
          )}
        </p>
      </div>
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
