"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { eventMatcher } from "@/lib/event-search";
import { withUtm } from "@/lib/utm";
import {
  formatDateRange,
  tierPoints,
  eventTierShort,
  tierBadgeClass,
  type Tournament,
  eventHref,
} from "@/lib/placeholder-data";

/** The card's bottom-right ticket chip — one class for all four states. */
const CHIP = "text-[11px] font-bold uppercase tracking-[0.1em] text-ppa-yellow";

type TimeKey = "upcoming" | "past";
type TypeKey = "all" | "main" | "challengers" | "international";
type TierKey = "all" | "slam" | "cup" | "open" | "500" | "250" | "125";
type CountryKey = "all" | "USA" | "Asia" | "Australia" | "Europe" | "Canada";
type SeasonKey = "all" | "2025-2026" | "2025" | "2024" | "2023" | "2022";

// "PPA Tour" includes EVERYTHING the tour runs (Connor's spec) — main draw,
// Challengers, and the international series. Narrow with the other options.
const TYPE_OPTIONS: { value: TypeKey; label: string }[] = [
  { value: "all", label: "PPA Tour — All Events" },
  { value: "main", label: "The Tour · 1,000+ Pts" },
  { value: "challengers", label: "Challengers" },
  { value: "international", label: "International" },
];
// Points, all the way down to the 125s — the under-1,000 stops no longer have
// their own band on the page, so this is how you get to them (Connor, 7/31).
const TIER_OPTIONS: { value: TierKey; label: string }[] = [
  { value: "all", label: "All Points" },
  { value: "slam", label: "Major · 2,000+" },
  { value: "cup", label: "Cup · 1,500" },
  { value: "open", label: "Open · 1,000" },
  { value: "500", label: "500" },
  { value: "250", label: "250" },
  { value: "125", label: "125" },
];
// Region is its own filter dimension (always visible) so international stops
// are reachable without hunting through types. Connor's order, 7/31: USA,
// Asia, Australia, Europe, Canada.
const COUNTRY_OPTIONS: { value: CountryKey; label: string }[] = [
  { value: "all", label: "All Regions" },
  { value: "USA", label: "USA" },
  { value: "Asia", label: "Asia" },
  { value: "Australia", label: "Australia" },
  { value: "Europe", label: "Europe" },
  { value: "Canada", label: "Canada" },
];
const SEASON_OPTIONS: { value: SeasonKey; label: string }[] = [
  { value: "all", label: "All Seasons" },
  { value: "2025-2026", label: "2025–2026" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
];

function FilterSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-9 border border-ppa-line bg-white px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-ppa-navy outline-none focus:border-ppa-blue"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Events grid — every tour stop (past + upcoming) from the API, with a search
 * box, an Upcoming/Past toggle, and dropdown filters: Type, Points (Major down
 * to 125), Region, and Season (Past only). This is the ONLY place the
 * under-1,000 stops appear on /events — Connor cut their separate band on 7/31,
 * so the points filter has to reach them.
 *
 * Cards link to our internal `/events/[slug]` page when the event has one
 * (US "Pro Pickleball Association" stops + curated events); international
 * sister-tour stops link out to their pickleballtournaments.com page.
 */
export function ScheduleGrid({ events }: { events: Tournament[] }) {
  const [query, setQuery] = useState("");
  const [time, setTime] = useState<TimeKey>("upcoming");
  const [type, setType] = useState<TypeKey>("all");
  const [tier, setTier] = useState<TierKey>("all");
  const [country, setCountry] = useState<CountryKey>("all");
  const [season, setSeason] = useState<SeasonKey>("all");

  function onTimeChange(v: TimeKey) {
    setTime(v);
    if (v !== "past") setSeason("all");
  }

  // The query lags the input by a frame under load so typing stays responsive
  // against the full past+upcoming board — same treatment /rankings gives its
  // 2,000-row search box.
  const deferredQuery = useDeferredValue(query);

  const shown = useMemo(() => {
    // Parsed once per query, not once per event — the matcher closes over the
    // terms and only the haystack build runs per row.
    const matches = eventMatcher(deferredQuery.trim());
    const list = events.filter((t) => {
      const inTime = time === "past" ? t.status === "completed" : t.status !== "completed";
      if (!inTime) return false;

      // Type — "all" is the whole PPA Tour (main draw + Challengers + international).
      //
      // ⚠ "main" tests POINTS, not just the tier key. The dropdown is labelled
      // "The Tour · 1,000+ Pts", and app/events/page.tsx defines The Tour as
      // `tierKey !== "challenger" && tierPoints(e) >= 1000` for the Next Six
      // band. This filter previously checked only region + tierKey, so the two
      // could disagree about the same event and the label was a claim the code
      // didn't enforce. Same predicate in both places now.
      if (type === "main" && (t.tierKey === "challenger" || tierPoints(t) < 1000)) return false;
      if (type === "challengers" && t.tierKey !== "challenger") return false;
      if (type === "international" && t.region !== "international") return false;

      // Points — an independent dimension now that the under-1,000 stops live
      // in this grid instead of their own band.
      if (tier !== "all") {
        const pts = tierPoints(t);
        if (tier === "slam" && pts < 2000) return false;
        if (tier === "cup" && pts !== 1500) return false;
        if (tier === "open" && pts !== 1000) return false;
        if (/^\d+$/.test(tier) && pts !== Number(tier)) return false;
      }

      // Region — independent dimension. "USA" = the domestic tour.
      if (country === "USA" && t.region === "international") return false;
      if (country !== "all" && country !== "USA" && t.country !== country) return false;

      // Season (Past only)
      if (time === "past" && season !== "all" && t.season !== season) return false;

      return matches(t);
    });
    return time === "past" ? list.reverse() : list;
  }, [events, deferredQuery, time, type, tier, country, season]);

  return (
    <>
      {/* Search + time toggle */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ppa-navy/40"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by event, city, state, venue, month…"
            className="h-10 w-full border border-ppa-line bg-white pl-9 pr-3 text-sm text-ppa-navy outline-none placeholder:text-ppa-navy/35 focus:border-ppa-blue"
          />
        </div>
        <div className="inline-flex shrink-0 border border-ppa-line bg-white p-1">
          {(
            [
              ["upcoming", "Upcoming"],
              ["past", "Past"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onTimeChange(key)}
              aria-pressed={time === key}
              className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                time === key ? "bg-ppa-navy text-white" : "text-ppa-navy/55 hover:text-ppa-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdown filters (dependent) */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterSelect value={type} onChange={setType} options={TYPE_OPTIONS} />
        <FilterSelect value={tier} onChange={setTier} options={TIER_OPTIONS} />
        <FilterSelect value={country} onChange={setCountry} options={COUNTRY_OPTIONS} />
        {time === "past" && (
          <FilterSelect value={season} onChange={setSeason} options={SEASON_OPTIONS} />
        )}
        <span className="ml-auto text-[11px] font-bold uppercase tracking-[0.12em] text-ppa-navy/40">
          {shown.length} {shown.length === 1 ? "Event" : "Events"}
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 border border-ppa-line bg-white px-4 py-12 text-center text-sm text-ppa-navy/55">
          No events match your filters. Try a different term or filter.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t, i) => {
            const completed = t.status === "completed";
            // ⚠ Checked FIRST, and it is a THIRD state. An announced stop with
            // no page yet has nowhere to go at all — unlike a link-out, which
            // goes to the tour that runs it. Folded into the `internal` pair
            // below it would render an <a> with an undefined href: a card that
            // looks clickable and does nothing.
            const comingSoon = t.detailsComingSoon === true;
            const internal = !comingSoon && t.hasInternalPage !== false;
            // Link-out events must never fall back to eventHref — that route
            // 404s for anything without an internal page (Conner Ogden's
            // broken-link report, 7/27).
            const href = internal
              ? eventHref(t)
              : t.externalUrl ?? t.registerUrl ?? t.ticketsUrl;
            return (
              <article
                /**
                 * ⚠ KEY MUST INCLUDE THE YEAR — `slug` alone is NOT unique.
                 *
                 * Ten slugs carry more than one record because they are annual
                 * editions of the same event: carvana-mesa-cup exists for 2025,
                 * 2026 AND 2027, pickleball-world-championships for 2025 and
                 * 2026, ppa-finals for 2026 and 2027, and so on. The data is
                 * right — an event's identity is year + slug, which is exactly
                 * what `eventHref` builds (/events/[year]/[slug]).
                 *
                 * With duplicate keys React cannot reconcile the list, so cards
                 * from the PREVIOUS filter state survive the re-render. That is
                 * the whole of the three filter faults reported on 8/3:
                 *   - Past + "The Tour 1,000+" showed three Challenger · 500
                 *     cards (counter said 74, the DOM held 77)
                 *   - Past + "Challengers" showed Veolia Atlanta Pickleball
                 *     Championships and Mesa Cup (counter 47, DOM 54)
                 *   - and it only misbehaved on some filter sequences, which is
                 *     why it read as "filters break when you change them
                 *     several times".
                 * The counter was always right; the DOM was stale.
                 */
                key={`${t.startDate.slice(0, 4)}-${t.slug}`}
                className="group relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden bg-ppa-navy transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
              >
                <Image
                  src={t.image}
                  alt={t.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover grayscale-[30%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 scrim-card" />
                {t.brand?.icon ? (
                  <span className="absolute left-3 top-3 block h-20 w-[42px] overflow-hidden rounded drop-shadow-md transition-transform duration-500 group-hover:scale-105">
                    <Image
                      src={t.brand.icon}
                      alt={`${t.name} badge`}
                      fill
                      sizes="42px"
                      className="object-contain"
                    />
                  </span>
                ) : (
                  <span className="absolute left-3 top-2 font-display text-2xl leading-none text-white/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
                <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
                  <span className={`${tierBadgeClass(t)} px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] whitespace-nowrap`}>
                    {eventTierShort(t)} · {tierPoints(t).toLocaleString()}
                  </span>
                  {t.region === "international" && (
                    <span className="bg-ppa-blue px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white">
                      {t.country ?? "International"}
                    </span>
                  )}
                </div>
                <div className="relative p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                    {t.presentedBy ? `Presented by ${t.presentedBy}` : "PPA Tour"}
                  </p>
                  {comingSoon ? (
                    // No anchor at all — not a disabled one. The card is a
                    // billboard until this event has somewhere to send people.
                    <p className="mt-0.5 block font-display text-lg uppercase leading-[1.05] text-white">
                      {t.name}
                    </p>
                  ) : internal ? (
                    <Link
                      href={href}
                      className="mt-0.5 block font-display text-lg uppercase leading-[1.05] text-white after:absolute after:inset-0"
                    >
                      {t.name}
                    </Link>
                  ) : (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block font-display text-lg uppercase leading-[1.05] text-white after:absolute after:inset-0"
                    >
                      {t.name}
                    </a>
                  )}
                  <p className="mt-1 text-xs text-white/60">
                    {formatDateRange(t.startDate, t.endDate, true)} ·{" "}
                    {/* A city of "TBD" reads as a typo next to real ones; say
                        what is actually true instead. */}
                    {comingSoon && t.city === "TBD" ? (
                      "Location TBD"
                    ) : (
                      <>
                        {t.city}
                        {t.state ? `, ${t.state}` : ""}
                      </>
                    )}
                  </p>
                  <span className="mt-3 flex items-center justify-between gap-3">
                    <span
                      style={t.brand ? { backgroundColor: t.brand.accent } : undefined}
                      className={`inline-flex h-8 items-center gap-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-all ${
                        t.brand ? "group-hover:brightness-90" : "bg-ppa-blue group-hover:bg-ppa-blue-deep"
                      }`}
                    >
                      {comingSoon
                        ? "Details Coming Soon"
                        : internal
                          ? completed
                            ? "View Event"
                            : "Event Guide"
                          : "Details"}
                      {/* No arrow when there is nowhere to go — the arrow is
                          the affordance that says this card is a link. */}
                      {!comingSoon && (
                        <span
                          aria-hidden
                          className="transition-transform duration-300 group-hover:translate-x-0.5"
                        >
                          {internal ? "→" : "↗"}
                        </span>
                      )}
                    </span>
                    {/* Suppressed while details are pending: "Tickets soon"
                        beside "Details Coming Soon" says the same thing twice,
                        and tickets are the smaller of the two unknowns. */}
                    {!comingSoon &&
                      (completed ? (
                        <span className={CHIP}>Completed</span>
                      ) : t.ticketNote === "free" ? (
                        /* Deliberately NOT a link — there is nothing to buy.
                           Free admission is a fact about the event, and the
                           previous "Tickets soon" promised tickets that are
                           never coming (Wesley, 9/1: Barcelona is free entry). */
                        <span className={CHIP}>Free Admission</span>
                      ) : t.ticketsOnSale && !internal && t.ticketsUrl ? (
                        /* ⚠ LINKED ONLY ON LINK-OUT STOPS, AND THAT IS ON PURPOSE.
                           A US stop's card already goes to its own event page,
                           where tickets are sold — the standing "drive to the
                           event page" decision (5/21). A sister-tour stop has no
                           such page, so without this the chip states tickets are
                           on sale and gives no way to reach them.

                           ⚠ `relative z-10` is load-bearing: the event title's
                           `after:inset-0` covers the whole card, so a link
                           without its own stacking context is unclickable —
                           every click lands on the card behind it. */
                        <a
                          href={withUtm(t.ticketsUrl, {
                            campaign: t.eventCode ?? t.slug,
                            content: "events-grid-tickets",
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${CHIP} relative z-10 underline-offset-2 hover:underline`}
                        >
                          {/* No price is printed unless somebody gave us one —
                              `ticketPriceFrom` is a tier-table fallback on these
                              records, i.e. a number nobody quoted. */}
                          {t.ticketNote === "no-price"
                            ? "Tickets"
                            : `From $${t.ticketPriceFrom}`}{" "}
                          ↗
                        </a>
                      ) : t.ticketsOnSale ? (
                        /* An internal stop on sale: unchanged from before this
                           file grew the states above it — plain text, because
                           the card itself goes to the event page that sells the
                           ticket. Do NOT fold this into the link branch. */
                        <span className={CHIP}>From ${t.ticketPriceFrom}</span>
                      ) : (
                        <span className={CHIP}>Tickets soon</span>
                      ))}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
