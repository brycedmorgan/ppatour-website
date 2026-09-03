import Link from "next/link";
import { PaddleTile } from "./PaddleTile";
import { CompareButton } from "./CompareButton";
import { formatPrice, TILT_LABEL, type PaddleSummary } from "@/lib/paddle-lab-shared";

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-ppa-navy/45">{label}</p>
      <p className="truncate text-xs font-bold tabular-nums text-ppa-navy">{value ?? "—"}</p>
    </div>
  );
}

/**
 * One paddle in a grid or rail. No hooks, so a server page and the client
 * browser can both render it; the only interactive bit is the compare button.
 */
export function PaddleCard({ p, compare = true }: { p: PaddleSummary; compare?: boolean }) {
  const price = formatPrice(p.price);
  return (
    <li className="group flex h-full flex-col border border-ppa-line bg-white transition-colors hover:border-ppa-blue">
      <Link href={p.href} className="block">
        <PaddleTile name={p.name} brand={p.brand} image={p.image} photo={p.photo} />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ppa-navy/45">{p.brand}</p>
        <Link href={p.href} className="mt-0.5 block">
          <h3 className="font-display text-sm uppercase leading-tight text-ppa-navy group-hover:text-ppa-blue">
            {p.model}
          </h3>
        </Link>
        <p className="mt-1 text-[11px] text-ppa-navy/55">
          {[p.shape, p.thicknessMm ? `${p.thicknessMm} mm` : null, p.tilt ? TILT_LABEL[p.tilt] : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-ppa-line pt-3">
          <Stat label="Power mph" value={p.powerMph != null ? p.powerMph.toFixed(1) : null} />
          <Stat label="Spin rpm" value={p.spinRpm != null ? String(p.spinRpm) : null} />
          <Stat label="Swing wt" value={p.swingWeight != null ? p.swingWeight.toFixed(0) : null} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <p className="text-sm font-bold tabular-nums text-ppa-navy">{price ?? ""}</p>
          {compare && <CompareButton slug={p.slug} compact />}
        </div>
      </div>
    </li>
  );
}
