/**
 * Illustrative tournament-grounds map (§event-page "site map"). Generic PPA
 * layout rendered as brand-styled SVG; the final per-venue map is published
 * event week. Zones are numbered to match the legend below the graphic.
 */

const ZONES = [
  { n: 1, label: "Championship Court", note: "Stadium seating · ticketed sessions" },
  { n: 2, label: "Grandstand Court", note: "Featured matches all day" },
  { n: 3, label: "Match Courts 1–8", note: "Open seating with a grounds pass" },
  { n: 4, label: "Practice Courts", note: "Watch the pros warm up" },
  { n: 5, label: "Vendor Village", note: "Partners, demos, merch, food row" },
  { n: 6, label: "Main Gate & Box Office", note: "Tickets, will-call, bag check" },
  { n: 7, label: "Parking & Shuttle", note: "Lots open with the gates" },
  { n: 8, label: "First Aid & Guest Services", note: "Questions, lost & found, ADA" },
];

function Court({
  x,
  y,
  w,
  h,
  fill = "#15456c",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} />
      <rect
        x={x + w * 0.08}
        y={y + h * 0.1}
        width={w * 0.84}
        height={h * 0.8}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.5"
      />
      <line
        x1={x + w / 2}
        y1={y + h * 0.1}
        x2={x + w / 2}
        y2={y + h * 0.9}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.5"
      />
    </g>
  );
}

function Badge({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="11" fill="#e7e700" />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontSize="12"
        fontWeight="900"
        fill="#0c2b44"
      >
        {n}
      </text>
    </g>
  );
}

export function VenueMap({ venue }: { venue: string }) {
  return (
    <div>
      <div className="overflow-hidden border border-ppa-line bg-white">
        <svg
          viewBox="0 0 800 460"
          role="img"
          aria-label={`Illustrative grounds map of ${venue}`}
          className="block w-full"
        >
          {/* Grounds */}
          <rect width="800" height="460" fill="#f3f5f7" />
          <rect x="16" y="16" width="768" height="392" fill="#e6ebef" />

          {/* Walkway spine */}
          <rect x="16" y="228" width="768" height="34" fill="#f3f5f7" />

          {/* 1 · Championship Court (stadium) */}
          <rect x="60" y="52" width="240" height="150" fill="#0c2b44" />
          <Court x={112} y={78} w={136} h={98} fill="#228be6" />
          <text x="180" y="44" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0c2b44" letterSpacing="2">
            CHAMPIONSHIP COURT
          </text>
          <Badge x={70} y={62} n={1} />

          {/* 2 · Grandstand */}
          <rect x="330" y="64" width="150" height="126" fill="#0c2b44" />
          <Court x={358} y={86} w={94} h={82} fill="#228be6" />
          <text x="405" y="56" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0c2b44" letterSpacing="2">
            GRANDSTAND
          </text>
          <Badge x={340} y={74} n={2} />

          {/* 3 · Match courts grid */}
          {[0, 1, 2, 3].map((c) => (
            <Court key={`r1-${c}`} x={516 + c * 62} y={64} w={50} h={56} />
          ))}
          {[0, 1, 2, 3].map((c) => (
            <Court key={`r2-${c}`} x={516 + c * 62} y={134} w={50} h={56} />
          ))}
          <text x="640" y="56" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0c2b44" letterSpacing="2">
            MATCH COURTS 1–8
          </text>
          <Badge x={506} y={74} n={3} />

          {/* 4 · Practice courts */}
          {[0, 1, 2].map((c) => (
            <Court key={`p-${c}`} x={560 + c * 66} y={296} w={54} h={60} fill="#4b6b8a" />
          ))}
          <text x="655" y="288" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0c2b44" letterSpacing="2">
            PRACTICE COURTS
          </text>
          <Badge x={550} y={306} n={4} />

          {/* 5 · Vendor village + food row */}
          <rect x="140" y="296" width="360" height="72" fill="#228be6" opacity="0.16" />
          {[0, 1, 2, 3, 4, 5].map((v) => (
            <rect key={`v-${v}`} x={156 + v * 56} y={310} width="40" height="44" fill="#228be6" />
          ))}
          <text x="320" y="288" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0c2b44" letterSpacing="2">
            VENDOR VILLAGE · FOOD ROW
          </text>
          <Badge x={150} y={306} n={5} />

          {/* 6 · Main gate + box office */}
          <rect x="40" y="404" width="180" height="40" fill="#0c2b44" />
          <text x="130" y="428" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff" letterSpacing="2">
            MAIN GATE · BOX OFFICE
          </text>
          <Badge x={50} y={412} n={6} />
          <path d="M 130 404 L 118 388 L 142 388 Z" fill="#e7e700" />

          {/* 7 · Parking */}
          <rect x="40" y="296" width="80" height="88" fill="#d7dee4" />
          {[0, 1, 2].map((p) => (
            <rect key={`park-${p}`} x={50} y={306 + p * 26} width="60" height="16" fill="#ffffff" stroke="#b6c3cd" />
          ))}
          <text x="80" y="288" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0c2b44" letterSpacing="2">
            PARKING
          </text>
          <Badge x={50} y={306} n={7} />

          {/* 8 · First aid / guest services */}
          <rect x="330" y="404" width="150" height="40" fill="#ffffff" stroke="#d7dee4" />
          <text x="405" y="428" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0c2b44" letterSpacing="1.5">
            GUEST SERVICES
          </text>
          <Badge x={340} y={412} n={8} />
        </svg>
      </div>

      <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {ZONES.map((z) => (
          <li key={z.n} className="flex items-baseline gap-2.5 text-sm">
            <span className="flex size-5 shrink-0 translate-y-0.5 items-center justify-center rounded-full bg-ppa-yellow text-[11px] font-black text-ppa-navy">
              {z.n}
            </span>
            <span>
              <span className="font-bold text-ppa-navy">{z.label}</span>
              <span className="text-ppa-navy/55"> — {z.note}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] uppercase tracking-[0.08em] text-ppa-navy/40">
        Illustrative layout — the official {venue} grounds map is published
        event week.
      </p>
    </div>
  );
}
