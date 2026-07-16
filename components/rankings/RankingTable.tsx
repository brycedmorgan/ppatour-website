import Image from "next/image";
import Link from "next/link";
import type { RankingEntry } from "@/lib/rankings-api";

/** Shared standings table (dark section). Presentational — no state. */

function flagUrl(cc: string): string | null {
  return cc ? `https://cdn.pickleball.com/circle-flags/${cc}.svg` : null;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function fmtPoints(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function fmtPrize(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function Avatar({ entry, size }: { entry: RankingEntry; size: number }) {
  const flag = flagUrl(entry.countryCode);
  return (
    <span
      className="relative shrink-0 overflow-hidden rounded-full bg-ppa-navy-deep"
      style={{ width: size, height: size }}
    >
      {entry.headshot ? (
        <Image
          src={entry.headshot}
          alt={entry.name}
          fill
          sizes={`${size}px`}
          className="object-cover object-top"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white/70">
          {initials(entry.name)}
        </span>
      )}
      {flag && (
        // Circle-flag SVGs from the PB CDN — plain img avoids remote-SVG config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={flag}
          alt=""
          className="absolute bottom-0 right-0 size-4 rounded-full ring-1 ring-ppa-navy"
        />
      )}
    </span>
  );
}

function RankBadge({ rank, tied }: { rank: number; tied: boolean }) {
  const medal =
    rank === 1
      ? "bg-ppa-yellow text-ppa-navy"
      : rank === 2
        ? "bg-white/85 text-ppa-navy"
        : rank === 3
          ? "bg-[#E8B27D] text-ppa-navy"
          : "bg-white/10 text-white/55";
  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center px-1.5 font-display text-sm tabular-nums ${medal}`}
    >
      {tied ? `T${rank}` : rank}
    </span>
  );
}

export function RankingTable({ entries }: { entries: RankingEntry[] }) {
  // Prize shows only when the feed carries it (currently $0 across the board).
  const showPrize = entries.some((e) => e.prizeMoney > 0);
  const gridTemplate = ["2.5rem", "1fr", "5rem", showPrize ? "5.5rem" : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="border border-white/10">
      <div
        className="grid items-center gap-3 border-b border-white/10 bg-ppa-navy-deep px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Points</span>
        {showPrize && <span className="text-right">Prize</span>}
      </div>
      {entries.map((e) => (
        <Link
          key={`${e.rank}-${e.slug}`}
          href={e.profileUrl}
          target={e.hasLocalProfile ? undefined : "_blank"}
          rel={e.hasLocalProfile ? undefined : "noopener noreferrer"}
          className="group grid items-center gap-3 border-b border-white/5 px-4 py-2.5 text-white transition-colors last:border-b-0 hover:bg-white/5"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <span>
            <RankBadge rank={e.rank} tied={e.isTied} />
          </span>
          <span className="flex min-w-0 items-center gap-3">
            <Avatar entry={e} size={38} />
            <span className="min-w-0 truncate text-sm font-bold uppercase tracking-wide transition-colors group-hover:text-ppa-sky">
              {e.name}
            </span>
          </span>
          <span className="text-right text-sm font-bold tabular-nums text-ppa-sky">
            {fmtPoints(e.points)}
          </span>
          {showPrize && (
            <span className="text-right text-xs tabular-nums text-white/55">
              {e.prizeMoney > 0 ? fmtPrize(e.prizeMoney) : "—"}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
