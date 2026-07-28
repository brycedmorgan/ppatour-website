import Image from "next/image";
import Link from "next/link";
import { PartnerWall } from "@/components/global/PartnerWall";
import { partners } from "@/lib/home-content";
import type { Tournament } from "@/lib/placeholder-data";

/**
 * Per-event sponsors section (Connor's spec, 7/20): every event page shows
 * who backs the event, closing on a "Want to be a sponsor?" CTA into the
 * partnership inquiry form (/about/sponsors#inquire → Jacob's Leads pipeline).
 *
 * Sponsor data note: there is no per-event sponsor feed yet, so this renders
 * the event's title/presenting partners (from the event record) on top of the
 * tour-wide partner roster — honestly labeled as tour partners. When a real
 * per-event sponsor list lands (Jackalope/SponsorCX export), thread it through
 * `Tournament` and swap the roster source here.
 */
export function EventSponsors({ event }: { event: Tournament }) {
  const accent = event.brand?.accent ?? "#228be6";
  // The named partners on this event's own marquee: a title sponsor embedded
  // in the event name (e.g. "Veolia …", "Rate …") plus the presenting partner.
  const titleSponsor = partners.find((p) =>
    event.name.toLowerCase().startsWith(p.name.split(" ")[0].toLowerCase()),
  );
  const marquee = [
    ...(titleSponsor ? [{ name: titleSponsor.name, role: `Title Partner · ${event.shortName}` }] : []),
    ...(event.presentedBy && event.presentedBy !== titleSponsor?.name
      ? [{ name: event.presentedBy, role: "Presenting Partner" }]
      : []),
  ];

  return (
    <section id="sponsors" className="scroll-mt-[120px] bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 bg-[var(--event-accent)]" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ppa-navy/50">
            Sponsors
          </p>
        </div>
        <h2 className="mt-2 font-display text-2xl uppercase leading-[1.02] text-ppa-navy sm:text-3xl">
          Powering {event.shortName}
        </h2>

        {/* Event marquee partners */}
        {marquee.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {marquee.map((m) => {
              const p = partners.find((x) => x.name === m.name);
              return (
                <div
                  key={m.name}
                  className="flex items-center gap-5 border border-ppa-line bg-ppa-paper p-5"
                >
                  {p?.logo ? (
                    <span className="flex h-14 w-36 shrink-0 items-center justify-center bg-white px-3">
                      <Image
                        src={p.logo}
                        alt={p.name}
                        width={p.logoWidth!}
                        height={p.logoHeight!}
                        sizes="120px"
                        className="max-h-10 w-auto max-w-[120px] object-contain"
                      />
                    </span>
                  ) : (
                    <span className="flex h-14 w-36 shrink-0 items-center justify-center bg-white px-3 font-display text-lg uppercase text-ppa-navy">
                      {m.name}
                    </span>
                  )}
                  {/* No partner name beside a logo (Bryce, 7/28) — the mark
                      says who it is; only the designation is typed. */}
                  <span>
                    {!p?.hideRole && (
                      <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--event-accent)]">
                        {m.role}
                      </span>
                    )}
                    {!p?.logo && (
                      <span className="mt-0.5 block font-display text-lg uppercase leading-tight text-ppa-navy">
                        {m.name}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Full official partner family — every designated partner */}
        <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.16em] text-ppa-navy/45">
          The Official Partners of the PPA Tour
        </p>
        <div className="mt-3">
          <PartnerWall accentVar={accent} eventName={event.shortName} />
        </div>

        {/* Become-a-sponsor CTA — the lead hook */}
        <div className="mt-8 flex flex-col items-start justify-between gap-4 bg-ppa-navy p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-xl uppercase leading-tight text-white">
              Want to be a sponsor?
            </p>
            <p className="mt-1 text-sm text-white/65">
              Put your brand courtside at {event.shortName} — and in front of
              the fastest-growing sport in America.
            </p>
          </div>
          <Link
            href="/about/sponsors#inquire"
            className="group inline-flex h-11 shrink-0 items-center gap-1.5 bg-[var(--event-accent)] px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:brightness-90 active:scale-[0.98]"
          >
            Start a Partnership Inquiry
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
