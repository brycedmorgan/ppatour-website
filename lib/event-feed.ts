/**
 * The public event feeds: /events.ics (calendar subscribe) and /events.xml (RSS).
 *
 * Why these exist (Bryce + Jeff, 10/14): free community calendars — CVBs, local
 * papers, TV stations, "things to do in Dallas" sites — take a feed URL or a
 * one-time submission. We had neither, so every stop was invisible to them.
 * Nathan hands these URLs out; the per-site submissions and proof screenshots
 * are tracked in Jackalope (PR tab → Calendar listings).
 *
 * Same event set as the sitemap (events with a real page) and upcoming only —
 * a calendar that lists last month's stop is a calendar that gets unsubscribed.
 * One builder, so the two feeds can't drift.
 */
import { eventHref, tournaments, type Tournament } from "@/lib/placeholder-data";
import { SITE_URL } from "@/lib/site";
import { VENUE_LOCATIONS } from "@/lib/venue-locations";
import { ticketsOnSale } from "@/lib/tixr-prices";

export type FeedEvent = {
  uid: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  address: string;
  city: string;
  url: string;
  ticketsUrl: string | null;
  image: string;
  description: string;
};

const pageUrl = (t: Tournament) => `${SITE_URL}${eventHref(t)}/`;

function fullAddress(t: Tournament): string {
  const v = t.venue ? VENUE_LOCATIONS[t.venue] : undefined;
  if (v) {
    return [v.streetAddress, v.addressLocality, [v.addressRegion, v.postalCode].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ");
  }
  return [t.city, t.state].filter((x) => x && !/^(TBD|TBA)$/.test(x)).join(", ");
}

/** Plain prose a calendar editor can paste as-is. No prices: they change, and a
 *  listing quoting a stale one is worse than one that says "tickets". */
/** Some records carry the city as the venue ("Virginia Beach"); don't say it twice. */
const realVenue = (t: Tournament) => (t.venue && t.venue !== t.city && !/^(TBD|TBA)$/.test(t.venue) ? t.venue : "");

function describe(t: Tournament, onSale: boolean): string {
  const where = t.state ? `${t.city}, ${t.state}` : t.city;
  const venue = realVenue(t);
  return [
    `${t.name} brings the world's best pro pickleball players to ${where}${venue ? ` at ${venue}` : ""}.`,
    `Watch live pro matches, with ${t.prizeMoney} in prize money on the line.`,
    onSale ? `Tickets: ${t.ticketsUrl}` : "Tickets coming soon.",
    `Schedule, players and how to watch: ${pageUrl(t)}`,
  ].join(" ");
}

export function feedEvents(now = new Date()): FeedEvent[] {
  // Yesterday in UTC, so a stop stays listed through its final day in every US zone.
  const today = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  return tournaments
    .filter(
      (t) =>
        t.tierKey !== "challenger" &&
        t.region !== "international" &&
        !t.detailsComingSoon &&
        // A stop with no city yet ("PPA Open", TBD) is not listable anywhere.
        !!t.city && !/^(TBD|TBA)$/.test(t.city) &&
        t.endDate >= today,
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((t) => {
      const onSale = ticketsOnSale(t.ticketsUrl);
      return {
        uid: `${t.startDate.slice(0, 4)}-${t.slug}@ppatour.com`,
        name: t.name,
        startDate: t.startDate,
        endDate: t.endDate,
        venue: realVenue(t),
        address: fullAddress(t),
        city: t.state ? `${t.city}, ${t.state}` : t.city,
        url: pageUrl(t),
        ticketsUrl: onSale ? t.ticketsUrl : null,
        image: t.image.startsWith("http") ? t.image : `${SITE_URL}${t.image}`,
        description: describe(t, onSale),
      };
    });
}

export const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** RFC 5545 text escaping + 75-octet line folding. */
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
function fold(line: string): string {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length;
    if (bytes + b > 74) { out.push(cur); cur = " "; bytes = 1; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join("\r\n");
}
const ymd = (d: string) => d.replace(/-/g, "");
/** All-day DTEND is exclusive: the day AFTER the last day. */
function dayAfter(d: string): string {
  const x = new Date(`${d}T12:00:00Z`);
  x.setUTCDate(x.getUTCDate() + 1);
  return x.toISOString().slice(0, 10);
}

export function buildIcs(events: FeedEvent[], now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PPA Tour//Event Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Carvana PPA Tour",
    "X-WR-CALDESC:Every upcoming Carvana PPA Tour pro pickleball event",
    "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
    "X-PUBLISHED-TTL:PT12H",
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(e.startDate)}`,
      `DTEND;VALUE=DATE:${ymd(dayAfter(e.endDate))}`,
      `SUMMARY:${icsText(e.name)}`,
      `LOCATION:${icsText([e.venue, e.address].filter(Boolean).join(", "))}`,
      `DESCRIPTION:${icsText(e.description)}`,
      `URL:${e.url}`,
      "CATEGORIES:Sports,Pickleball",
      `IMAGE;VALUE=URI;DISPLAY=BADGE:${e.image}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function buildRss(events: FeedEvent[], now = new Date()): string {
  const items = events
    .map(
      (e) => `    <item>
      <title>${escapeXml(e.name)}</title>
      <link>${escapeXml(e.url)}</link>
      <guid isPermaLink="false">${escapeXml(e.uid)}</guid>
      <description>${escapeXml(e.description)}</description>
      <category>Sports</category>
      <ev:startdate>${e.startDate}</ev:startdate>
      <ev:enddate>${e.endDate}</ev:enddate>
      <ev:location>${escapeXml([e.venue, e.address].filter(Boolean).join(", "))}</ev:location>
      <ev:organizer>Carvana PPA Tour</ev:organizer>
      <ev:type>Sports</ev:type>
      <enclosure url="${escapeXml(e.image)}" type="${/\.png$/i.test(e.image) ? "image/png" : "image/jpeg"}" length="0"/>
      <media:content url="${escapeXml(e.image)}" medium="image"/>${e.ticketsUrl ? `
      <comments>${escapeXml(e.ticketsUrl)}</comments>` : ""}
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:ev="http://purl.org/rss/1.0/modules/event/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Carvana PPA Tour: Upcoming Events</title>
    <link>${SITE_URL}/events/</link>
    <atom:link href="${SITE_URL}/events.xml" rel="self" type="application/rss+xml"/>
    <description>Every upcoming Carvana PPA Tour pro pickleball event: dates, venue, tickets.</description>
    <language>en-us</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <ttl>720</ttl>
${items}
  </channel>
</rss>
`;
}
