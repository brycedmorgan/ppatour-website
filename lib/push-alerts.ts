/**
 * Which alerts are switched on.
 *
 * ⚠ START SMALL (Bryce, 8/18). All four are built and tested, but only the
 * quiet one ships on day one. The reasoning is asymmetric: an alert nobody
 * receives costs us nothing, and an alert too many people receive costs us the
 * notification permission — permanently, on every device that switches it off.
 * You cannot ask twice.
 *
 * Ranked by how often they would buzz a phone:
 *   · `draw`  — a handful of times per event week. Rare, per-player, and it
 *               tells a fan something they cannot easily find out. Ships.
 *   · `week`  — once per tour stop, everyone. Cheap, but tour-wide, so it goes
 *               to people who never asked about a specific pro.
 *   · `final` — once per match. A fan following four pros through a
 *               quarterfinal gets four.
 *   · `live`  — once per match start, and the noisiest of the set.
 *
 * Turn one on by adding it to `PUSH_ALERTS` in Vercel — no deploy needed for
 * the sender, which reads this per run.
 */
export type AlertKind = "draw" | "live" | "final" | "week";

const ALL: AlertKind[] = ["draw", "live", "final", "week"];
const DEFAULT: AlertKind[] = ["draw"];

/** Human copy for the Following screen, so it can only ever promise what fires. */
export const ALERT_LABEL: Record<AlertKind, string> = {
  draw: "Their draw is published",
  live: "They are on court now",
  final: "Their match is final",
  week: "A tour stop starts this week",
};

export function enabledAlerts(): AlertKind[] {
  const raw = process.env.PUSH_ALERTS;
  if (!raw) return DEFAULT;
  const wanted = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is AlertKind => (ALL as string[]).includes(s));
  return wanted.length > 0 ? wanted : DEFAULT;
}

export function alertEnabled(kind: AlertKind): boolean {
  return enabledAlerts().includes(kind);
}
