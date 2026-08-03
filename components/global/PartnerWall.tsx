import Image from "next/image";
import Link from "next/link";
import {
  partnersByTier,
  titlePartner,
  type Partner,
  type PartnerTier,
} from "@/lib/home-content";
import { partnerLink } from "@/lib/partner-link";

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

/**
 * Per-tier presentation. Tiers exist to sell differentiated billing, so they
 * have to LOOK different — a flat grid with headings over it would be labelling
 * a hierarchy without honouring it. Platinum runs three-up with the tallest
 * logo box; Tour Sponsors run four-up and smaller.
 */
const TIER_STYLE: Record<PartnerTier, { cols: string; logo: string; box: string }> = {
  title: { cols: "", logo: "", box: "" },
  platinum: { cols: "sm:grid-cols-2 lg:grid-cols-3", logo: "max-h-14", box: "min-h-[148px]" },
  gold: { cols: "sm:grid-cols-2 lg:grid-cols-3", logo: "max-h-12", box: "min-h-[132px]" },
  tour: { cols: "sm:grid-cols-2 lg:grid-cols-4", logo: "max-h-10", box: "min-h-[116px]" },
  official: { cols: "sm:grid-cols-2 lg:grid-cols-3", logo: "max-h-12", box: "min-h-[132px]" },
};

export function PartnerWall({
  accentVar = "#228be6",
  eventName,
}: {
  accentVar?: string;
  eventName?: string;
}) {
  const title = titlePartner;
  const groups = partnersByTier();

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
                    sizes="200px"
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
                {/* Name printed only when we have no mark to show (Bryce 7/28). */}
                {!title.logo && (
                  <p className="mt-1 font-display text-2xl uppercase leading-none text-ppa-navy sm:text-3xl">
                    {title.name}
                  </p>
                )}
                <p className="mt-2 max-w-xl text-sm text-ppa-navy/55">
                  {eventName
                    ? `The named partner of the tour — on court at ${eventName} and all twenty stops.`
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

      {/* Tiered partner grid — Platinum, Gold, Tour Sponsors, then any partner
          whose tier isn't confirmed. Within a tier every partner is billed
          identically; across tiers the card and logo sizes differ. */}
      {groups.map((g) => {
        const style = TIER_STYLE[g.key];
        return (
          <section key={g.key} className="mt-8 first:mt-4">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-2 w-2"
                style={{ backgroundColor: accentVar }}
              />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/55">
                {g.label}
              </h3>
            </div>
            {/* Hairlines come from the CARDS, not from a `bg-ppa-line` container
                showing through 1px gaps. With the container painting the lines,
                any row that doesn't divide evenly rendered its leftover cells as
                solid grey blocks — one tier of nine in a four-up grid left three
                grey holes beside PlaySight, and Selkirk sat next to two more. */}
            <div
              className={`mt-3 grid border-b border-r border-ppa-line ${style.cols}`}
            >
              {g.items.map((p) => (
                <PartnerCard
                  key={p.name}
                  p={p}
                  accent={accentVar}
                  logoClass={style.logo}
                  boxClass={style.box}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function PartnerCard({
  p,
  accent,
  logoClass = "max-h-12",
  boxClass = "min-h-[132px]",
}: {
  p: Partner;
  accent: string;
  logoClass?: string;
  boxClass?: string;
}) {
  const { href, external } = partnerLink(p);
  // `border-l border-t` on every card + `border-r border-b` on the grid gives a
  // complete table rule with no empty-cell artifacts (see the grid comment).
  const cls = `group flex ${boxClass} flex-col justify-between border-l border-t border-ppa-line bg-white p-5 transition-colors hover:bg-ppa-paper`;
  // Bryce 7/28: where we hold the mark, the mark IS the card — the logo runs
  // bigger and the partner's name is never typed beside it. The designation
  // line stays (it's the value we sell) unless `hideRole` says otherwise.
  // Partners with no mark yet keep the wordmark card so nobody drops off the
  // directory while we chase their logo file.
  const inner = (
    <>
      {p.logo ? (
        // The box is sized by HEIGHT, with width free: the drop includes
        // vertical lockups (Holland America) and stacked marks (Park Place)
        // beside 8:1 wordmarks, and capping height is the only way they sit as
        // equals instead of the tall ones dwarfing the wide ones.
        <span className={`flex w-fit items-center ${logoClass}`}>
          <Image
            src={p.logo}
            alt={p.name}
            width={p.logoWidth!}
            height={p.logoHeight!}
            sizes="170px"
            className={`${logoClass} w-auto max-w-[170px] object-contain object-left`}
          />
        </span>
      ) : (
        <span
          aria-hidden
          className="h-2 w-8"
          style={{ backgroundColor: accent }}
        />
      )}
      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          {p.role && !p.hideRole && (
            <p
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: accent }}
            >
              {p.role}
            </p>
          )}
          {/* Name prints ONLY when we have no mark to show. A partner with a
              mark but no confirmed designation gets a logo-only card — same
              treatment Veolia and Humana already get via `hideRole`, because
              the standing ruling (Bryce, 7/28) is that the logo IS the card and
              we never type a partner's name beside their own mark. The image
              `alt` carries the name for assistive tech. */}
          {!p.logo && (
            <p className="mt-1 font-display text-lg uppercase leading-[1.05] text-ppa-navy">
              {p.name}
            </p>
          )}
        </div>
        {external && (
          <span
            aria-hidden
            className="text-xs text-ppa-navy/60 opacity-0 transition-opacity group-hover:opacity-100"
          >
            ↗
          </span>
        )}
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
