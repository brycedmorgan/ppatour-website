import type { Metadata } from "next";
import Link from "next/link";
import { eventHref, formatDateRange, type Tournament } from "@/lib/placeholder-data";
import { getEvents } from "@/lib/events-api";
import { europeRobots } from "@/lib/europe-launch";
import { EUROPE_EVENT_LINKS, EUROPE_GENERAL_LINKS, type EventLink } from "@/lib/europe-eventlinks";
import { SITE_URL } from "@/lib/site";

/**
 * /europe/eventlinks — the page behind the QR code on every PPA Tour Europe
 * credential. Also served at ppatoureurope.com/eventlinks (next.config.ts).
 *
 * Payton Pemberton, #ppa-tour-europe 2026-09-17: the Europe team wants a QR on
 * the credentials "so that we can keep an updated list of relevant links for
 * each tour stop (probably pickleball brackets, map, rulebook, etc.)". They
 * print tomorrow. Bryce's rule in the same thread: the printed code is fixed
 * forever, so it points at a page we control, and the page changes per stop.
 *
 * ⚠ READ ON A PHONE, AT A VENUE. Someone scans this standing at a check-in
 * desk. Big tap targets, the current stop first, nothing that needs a mouse.
 *
 * ⚠ NO CALENDAR OF ITS OWN. Stops come from the same feed as /europe
 * (`getEvents`, filtered to `country === "Europe"`), so a stop appears here the
 * moment it lands in PB Tournaments. Per-stop links live in
 * `lib/europe-eventlinks.ts`, keyed by slug, and only links the Europe team
 * gave us go there. The map link is derived from the venue and city the feed
 * already carries; it is not a guess.
 *
 * ⚠ Inherits the Europe layout: no Carvana, no US chrome. Unlisted until
 * `EUROPE_PUBLIC` flips, like the rest of the region.
 */

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "Event Links · PPA Tour Europe" },
  description: "Links for this PPA Tour Europe stop: event page, map, brackets and the tour's essentials.",
  alternates: { canonical: `${SITE_URL}/europe/eventlinks` },
  openGraph: {
    type: "website",
    siteName: "PPA Tour Europe",
    title: "Event Links · PPA Tour Europe",
    description: "Links for this PPA Tour Europe stop.",
    url: `${SITE_URL}/europe/eventlinks`,
  },
  twitter: { card: "summary", title: "Event Links · PPA Tour Europe" },
  robots: europeRobots,
};

/** Same rule as FeaturedEvents: no internal page yet means link out, never 404. */
function pageHref(t: Tournament): string {
  const internal = t.detailsComingSoon !== true && t.hasInternalPage !== false;
  return internal ? eventHref(t) : (t.externalUrl ?? t.registerUrl ?? t.ticketsUrl);
}

/** "Portoroz, Portoroz" when the feed's venue is just the town. */
function where(t: Tournament): string {
  return t.venue && t.venue !== t.city ? `${t.venue}, ${t.city}` : t.city;
}

function mapHref(venue: string, city: string, state: string) {
  const q = [venue, city, state].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function LinkRow({ link, external }: { link: EventLink; external?: boolean }) {
  const cls =
    "flex items-center justify-between gap-4 rounded-xl border border-ppa-line bg-white px-5 py-4 text-left transition-colors hover:border-ppa-navy/40 active:bg-ppa-paper";
  const body = (
    <>
      <span>
        <span className="block text-[16px] font-bold text-ppa-navy">{link.label}</span>
        {link.note ? <span className="mt-0.5 block text-[13px] text-ppa-navy/60">{link.note}</span> : null}
      </span>
      <span aria-hidden className="shrink-0 text-ppa-navy/40">
        {external ? "↗" : "→"}
      </span>
    </>
  );
  return external ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <Link href={link.href} className={cls}>
      {body}
    </Link>
  );
}

export default async function EuropeEventLinksPage() {
  const { events } = await getEvents();
  // ⚠ Filter on the END DATE as well as status. The feed left P125 Portorož
  // (Jul 22–26) as "upcoming" in September, and this page's whole job is to
  // put the CURRENT stop first — a finished event at the top of a credential
  // page is worse than none.
  const today = new Date().toISOString().slice(0, 10);
  const stops = events
    .filter((e) => e.country === "Europe" && e.status !== "completed" && e.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const [current, ...later] = stops;

  return (
    <main className="min-h-[70vh] bg-ppa-paper">
      <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-navy/55">PPA Tour Europe</p>
        <h1 className="mt-2 text-[28px] font-black leading-tight text-ppa-navy">Event links</h1>
        <p className="mt-2 text-[15px] text-ppa-navy/75">Everything for this stop in one place. Bookmark this page; it updates every event.</p>

        {current ? (
          <section className="mt-8">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-ppa-navy/55">
              {current.status === "live" ? "Happening now" : "Next stop"}
            </h2>
            <div className="mt-3 rounded-2xl bg-ppa-navy p-5 text-white">
              <p className="text-[20px] font-black leading-tight">{current.name}</p>
              <p className="mt-1 text-[14px] text-white/75">
                {formatDateRange(current.startDate, current.endDate, true)} · {where(current)}
              </p>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <LinkRow link={{ label: "Event page", href: pageHref(current), note: "Schedule, tickets and details" }} />
              <LinkRow
                external
                link={{ label: "Map & directions", href: mapHref(current.venue, current.city, current.state), note: current.venue }}
              />
              {(EUROPE_EVENT_LINKS[current.slug] ?? []).map((l) => (
                <LinkRow key={l.href} link={l} external={/^https?:/.test(l.href)} />
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-2xl border border-ppa-line bg-white p-5 text-[15px] text-ppa-navy/75">
            No upcoming Europe stop is on the calendar yet. The tour essentials are below.
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-ppa-navy/55">The tour</h2>
          <div className="mt-3 flex flex-col gap-2">
            {EUROPE_GENERAL_LINKS.map((l) => (
              <LinkRow key={l.href} link={l} />
            ))}
          </div>
        </section>

        {later.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-ppa-navy/55">Coming up</h2>
            <div className="mt-3 flex flex-col gap-2">
              {later.map((t) => (
                <LinkRow
                  key={t.slug}
                  link={{
                    label: t.name,
                    href: pageHref(t),
                    note: `${formatDateRange(t.startDate, t.endDate)} · ${t.city}`,
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
