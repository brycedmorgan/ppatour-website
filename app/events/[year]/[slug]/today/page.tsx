import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ParkingDetails } from "@/components/events/ParkingDetails";
import { TodayPanel } from "@/components/events/TodayPanel";
import { getBroadcast } from "@/lib/broadcast";
import { getEventSchedule } from "@/lib/event-schedule";
import { getEvents } from "@/lib/events-api";
import { parkingFor } from "@/lib/event-guides";
import { onSiteFor } from "@/lib/onsite";
import { eventHref, formatDateRange, type Tournament } from "@/lib/placeholder-data";
import { resolveEvent } from "@/lib/resolve-event";
import { VENUE_LOCATIONS } from "@/lib/venue-locations";
import { withUtm } from "@/lib/utm";

/**
 * "Today at the event" — the screen for someone standing at the venue.
 *
 * ⚠ IT IS A WEBSITE ROUTE, NOT AN APP SCREEN (Bryce, 8/18: "should be on the
 * site too"). The app's Event tab points here, but so does the event page, and
 * so does a text message from somebody in the parking lot. One URL.
 *
 * ⚠ THE ORDER IS THE FEATURE. A website leads with the event; a person at the
 * gate needs the opposite. Courts first, then today's play, then how to get in,
 * then how to watch. Nothing above the fold is marketing.
 *
 * ⚠ EVERY BLOCK RENDERS ONLY IF ITS SOURCE HAS AN ANSWER. Parking comes from
 * the event team's verbatim copy, the schedule from the transcribed order of
 * play, courts from the live feed, and the remaining five facts from
 * `lib/onsite.ts` once a named owner supplies them. Nothing is templated,
 * because a plausible gate or lot is worse than a blank — see the 8/5 pass that
 * deleted invented parking from all 18 event pages.
 */
export const revalidate = 300;

type Params = { params: Promise<{ year: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { year, slug } = await params;
  const resolved = await resolveEvent(year, slug);
  if (!resolved || resolved.kind !== "internal") return {};
  const t = resolved.event;
  return {
    title: `At the event — ${t.name}`,
    description: `Courts, today's order of play, gates, parking and directions for ${t.name} at ${t.venue}, ${t.city}, ${t.state}.`,
  };
}

/** Google Maps directions to the venue — verified address when we have one. */
function directionsUrl(t: Tournament): string {
  const loc = VENUE_LOCATIONS[t.venue];
  const q = loc?.streetAddress
    ? `${loc.streetAddress}, ${loc.addressLocality}, ${loc.addressRegion} ${loc.postalCode ?? ""}`
    : `${t.venue}, ${t.city}, ${t.state}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q.trim())}`;
}

function Block({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">{heading}</h2>
      <div className="mt-3 text-sm leading-relaxed text-white/75">{children}</div>
    </section>
  );
}

export default async function TodayPage({ params }: Params) {
  const { year, slug } = await params;
  const resolved = await resolveEvent(year, slug);
  if (!resolved) notFound();
  // A stop that lives on someone else's site has no on-site screen of ours.
  if (resolved.kind !== "internal") redirect(resolved.href ?? "/events");

  const t = resolved.event;
  /**
   * ⚠ THE UUID USUALLY IS NOT ON THE RECORD WE JUST RESOLVED. `tournamentUuid`
   * is API-sourced only, and `resolveEvent` lets a CURATED record win — which
   * is every hand-authored stop, Nationals included. Without this fallback the
   * live-courts section would be permanently dark on exactly the events people
   * attend.
   *
   * Looked up here rather than added to `resolveEvent`'s overlay on purpose:
   * that record feeds results, brackets and the registered count on the event
   * page, and handing those a UUID they have never had is a behaviour change to
   * a live page, not a fix for this one.
   */
  const liveRecord = (await getEvents()).events.find((e) => e.slug === slug);
  const eventUuid = t.tournamentUuid ?? liveRecord?.tournamentUuid;
  const schedule = getEventSchedule(slug);
  const parking = parkingFor(slug);
  const onsite = onSiteFor(slug);
  const broadcast = getBroadcast(slug);
  const loc = VENUE_LOCATIONS[t.venue];
  const ticketsUrl = t.ticketsOnSale
    ? withUtm(t.ticketsUrl, { campaign: t.eventCode ?? t.slug, content: "on-site" })
    : null;

  return (
    <div className="min-h-screen bg-ppa-navy text-white">
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <Link
          href={eventHref(t)}
          className="text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-sky"
        >
          ← {t.name}
        </Link>
        <h1 className="mt-3 font-display text-3xl uppercase leading-none">At the event</h1>
        <p className="mt-2 text-sm text-white/55">
          {t.venue} · {t.city}, {t.state} · {formatDateRange(t.startDate, t.endDate)}
        </p>

        <div className="mt-8 space-y-8">
          {/* Courts + today's play. Client-side: see TodayPanel on why the
              device decides what "today" is. */}
          <TodayPanel proDays={schedule?.proDays ?? []} eventUuid={eventUuid} />

          {/* Getting in */}
          <Block heading="Getting here">
            <p className="font-bold text-white">{t.venue}</p>
            {loc?.streetAddress && (
              <p className="mt-1 whitespace-pre-line text-white/60">
                {loc.streetAddress}
                {"\n"}
                {loc.addressLocality}, {loc.addressRegion} {loc.postalCode ?? ""}
              </p>
            )}
            <a
              href={directionsUrl(t)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-10 items-center bg-ppa-blue px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white"
            >
              Directions
            </a>
          </Block>

          {onsite.venueMapUrl && (
            <Block heading="Venue map">
              <Image
                src={onsite.venueMapUrl}
                alt={`${t.venue} site map`}
                width={1600}
                height={1200}
                className="h-auto w-full border border-white/10 bg-white"
              />
            </Block>
          )}

          <Block heading="Parking">
            <ParkingDetails sections={parking} ticketsUrl={ticketsUrl} />
          </Block>

          {onsite.entry && <Block heading="Entry">{onsite.entry}</Block>}
          {onsite.bagPolicy && <Block heading="Bags">{onsite.bagPolicy}</Block>}
          {onsite.willCall && <Block heading="Will call">{onsite.willCall}</Block>}
          {onsite.food && <Block heading="Food & drink">{onsite.food}</Block>}
          {onsite.note && <Block heading="Know before you go">{onsite.note}</Block>}

          {broadcast.length > 0 && (
            <Block heading="Watching">
              <ul className="divide-y divide-white/10 border-y border-white/10">
                {broadcast.map((b, i) => (
                  <li key={`${b.day}-${i}`} className="flex items-baseline gap-3 py-2.5">
                    <span className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-[0.1em] text-white/45">
                      {b.day}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-white">
                      {b.round}
                      {b.type === "TAPE" && (
                        <span className="ml-1.5 text-[10px] uppercase tracking-[0.1em] text-white/40">
                          Replay
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-right text-[11px] text-white/45">
                      {[b.platform, b.secondary].filter(Boolean).join(" · ")}
                      <span className="block text-white/30">{b.window}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </div>
      </div>
    </div>
  );
}
