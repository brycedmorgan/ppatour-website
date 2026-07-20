import { getRegisteredCount } from "@/lib/registrations";

/**
 * "X Players Registered" stat for event pages (Connor, 7/20). Server
 * component: shows the live PT.com number when the API is wired, and an
 * honest "registration count coming" state until Jason's creds land
 * (docs/DATA-ASKS.md). Same markup either way, so nothing shifts when the
 * data lights up.
 */
export async function RegisteredCount({
  tournamentUuid,
  accent = false,
}: {
  tournamentUuid?: string;
  accent?: boolean;
}) {
  const reg = await getRegisteredCount(tournamentUuid);

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] ${
        accent ? "bg-white/10 text-white" : "border border-ppa-line bg-white text-ppa-navy/70"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${reg ? "bg-ppa-yellow" : accent ? "bg-white/30" : "bg-ppa-navy/20"}`}
      />
      {reg ? (
        <>
          {reg.count.toLocaleString()} Players Registered
          <span className={accent ? "font-medium normal-case tracking-normal text-white/50" : "font-medium normal-case tracking-normal text-ppa-navy/45"}>
            via pickleballtournaments.com
          </span>
        </>
      ) : (
        <>
          Registration Count Coming
          <span className={accent ? "font-medium normal-case tracking-normal text-white/50" : "font-medium normal-case tracking-normal text-ppa-navy/45"}>
            syncs live from pickleballtournaments.com
          </span>
        </>
      )}
    </span>
  );
}
