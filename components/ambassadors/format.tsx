import type { Ev, EventStatus } from "@/components/ambassadors/types";
import { Logo } from "@/components/ambassadors/Logo";

export const money = (n: number): string => "$" + Math.round(n || 0).toLocaleString("en-US");
export const money2 = (n: number): string =>
  "$" + (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const int = (n: number): string => (n || 0).toLocaleString("en-US");
export const pct = (p: number): string => Math.round((p || 0) * 100) + "%";

export function fmtDate(s: string): string {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STATUS: Record<EventStatus, [string, string]> = {
  "on-sale": ["On sale", "p-good"],
  "reg-closed": ["Registration closed", "p-amber"],
  live: ["Live now", "p-blue"],
  final: ["Final", "p-dim"],
};

export function statusPill(s: EventStatus) {
  const [label, cls] = STATUS[s] ?? ["", "p-dim"];
  return <span className={`pill ${cls}`}>{label}</span>;
}

/** Event logo, or an initials placeholder when there's no logo file / it fails. */
export function logoBox(ev: Ev, size = 44) {
  return <Logo ev={ev} size={size} />;
}
