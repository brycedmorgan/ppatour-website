/**
 * "Pro Qualifiers" — the label a board or a draw wears while it is showing the
 * Pro Qualifier bracket instead of the Pro Main Draw.
 *
 * ⚠ WITHOUT IT THE SURFACE MISREPRESENTS WHAT IS ON IT. A qualifier division
 * and its main draw carry the SAME NAME — both are "Men's Doubles" — so the
 * pills, the rounds and every card read exactly as the pro draw's will, and a
 * fan has no way to tell a qualifier result from a main-draw one.
 *
 * Shared by ScoresBoard and BracketPanel deliberately: the two surfaces switch
 * on different rules and at different moments, so if they ever say it in
 * different words the difference reads as a bug rather than as timing.
 *
 * Nothing renders for the main draw — that is the normal state, and labelling
 * it would put a badge on every bracket on the site every day of the year.
 */
export function StageBadge({ light = false }: { light?: boolean }) {
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
        light
          ? "border-ppa-blue/30 bg-ppa-blue/10 text-ppa-blue"
          : "border-white/20 bg-white/10 text-white"
      }`}
    >
      Pro Qualifiers
    </p>
  );
}
