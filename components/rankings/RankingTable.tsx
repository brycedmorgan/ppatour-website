import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import type { BoardEntry } from "@/lib/rankings-api";
import { FollowChip } from "@/components/app/FollowChip";

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

/**
 * Our own profile slug for a ranked player.
 *
 * ⚠ Only meaningful when `hasLocalProfile` is true. For the other ~1,850 ranked
 * pros `profileUrl` points off-site, and a follow whose slug we cannot open
 * would put a dead name in the fan's You tab.
 */
function profileSlug(e: BoardEntry): string {
  return e.profileUrl.replace(/\/$/, "").split("/").pop() || e.slug;
}

/**
 * Row avatar.
 *
 * ⚠ Both image choices here are payload decisions, not style ones — this table
 * renders the COMPLETE boards (Connor: "all the way", no cap), so every byte
 * and every request is multiplied by ~2,000 rows. Measured on the live page
 * before this change: 4.06 MB of HTML and 2,555 images.
 *
 *  - `width`/`height` instead of `fill`. A fixed-size square doesn't need a
 *    responsive srcset: `fill` + `sizes` emitted **8 candidate URLs** per
 *    avatar (~2 KB of markup each, 1,037 KB / 26% of the document). With
 *    intrinsic dimensions next/image emits 1x/2x only.
 *  - `loading="lazy"` on the flag. It was absent, so the browser fetched
 *    **all ~2,000 circle-flag SVGs eagerly** on first paint — the single
 *    biggest reason DOMContentLoaded was 14s.
 */
function Avatar({ entry, size }: { entry: BoardEntry; size: number }) {
  const flag = flagUrl(entry.countryCode);
  return (
    <span
      className="wpr-avatar"
      style={{ width: size, height: size }}
    >
      {entry.headshot ? (
        <Image
          src={entry.headshot}
          alt={entry.name}
          width={size}
          height={size}
          className="wpr-shot"
        />
      ) : (
        <span className="wpr-initials">
          {initials(entry.name)}
        </span>
      )}
      {flag && (
        // Circle-flag SVGs from the PB CDN — plain img avoids remote-SVG config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={flag}
          alt=""
          width={16}
          height={16}
          loading="lazy"
          decoding="async"
          className="wpr-flag"
        />
      )}
    </span>
  );
}

/**
 * Rank chip. Hannah 7/28: no medal terminology or gold/silver/bronze coloring
 * anywhere — we rank players, we don't hand out medals. The top five now stand
 * out as a block in tour yellow, with No. 1 carrying the solid fill.
 */
function RankBadge({ rank, tied }: { rank: number; tied: boolean }) {
  const style =
    rank === 1
      ? "is-1"
      : rank <= 5
        ? "is-top5"
        : "";
  return (
    <span
      className={`wpr-badge ${style}`}
    >
      {tied ? `T${rank}` : rank}
    </span>
  );
}

export function RankingTable({ entries }: { entries: BoardEntry[] }) {
  // Prize shows only when the feed carries it (currently $0 across the board).
  const showPrize = entries.some((e) => e.prizeMoney > 0);
  /**
   * ⚠ FOLLOW CHIPS ARE CAPPED, AND THE CAP IS A PAYLOAD DECISION, NOT A TASTE
   * ONE. `pageSize` is optional on RankingsBoard, so this table renders 10 rows
   * on /athletes, 50 a page on /rankings — and the COMPLETE ~2,035-row board
   * where paging is off. A client component per row is fine at 50 and reckless
   * at 2,035, on the page that was already measured at 4.06 MB of HTML. Self
   * -limiting here rather than threading a prop, so no future caller can
   * accidentally switch it on for the full board.
   */
  const showFollow = entries.length <= 100;
  const gridTemplate = ["2.5rem", "1fr", "5rem", showPrize ? "5.5rem" : null]
    .filter(Boolean)
    .join(" ");

  return (
    /* The column template is declared ONCE as a custom property on the
       container and inherited by `.wpr-row`. It used to be an inline
       `style="grid-template-columns:…"` repeated on the header and every row —
       2,035 copies, 89 KB. Same for the row class string: `.wpr-row` carries
       what was a ~120-char Tailwind repetition on every row. */
    <div
      className="border border-white/10"
      style={{ "--wpr-cols": gridTemplate } as CSSProperties}
    >
      <div className="wpr-row border-b border-white/10 bg-ppa-navy-deep text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
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
          className="wpr-row wpr-row-link group"
        >
          <span>
            <RankBadge rank={e.rank} tied={e.isTied} />
          </span>
          <span className="wpr-player">
            <Avatar entry={e} size={38} />
            <span className="wpr-name">
              {e.name}
            </span>
            {/* ⚠ Inside `.wpr-player`, not beside it. `.wpr-row` is a grid whose
                columns come from `--wpr-cols`; a fifth child would land in the
                points column and shift every number one place right. */}
            {showFollow && e.hasLocalProfile && (
              <FollowChip slug={profileSlug(e)} name={e.name} className="ml-auto size-7" />
            )}
          </span>
          <span className="wpr-pts">
            {fmtPoints(e.points)}
          </span>
          {showPrize && (
            <span className="wpr-prize">
              {e.prizeMoney > 0 ? fmtPrize(e.prizeMoney) : "—"}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
