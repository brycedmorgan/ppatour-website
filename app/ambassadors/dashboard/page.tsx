import { redirect } from "next/navigation";
import { currentAmbassador } from "@/lib/ambassadors/auth";
import { Dashboard } from "@/components/ambassadors/Dashboard";
import type { MeData } from "@/components/ambassadors/types";

export const dynamic = "force-dynamic";

/** The signed-in dashboard. Server-guards on the session + live roster. */
export default async function DashboardPage() {
  const data = await currentAmbassador();
  if (!data) redirect("/ambassadors");
  // Server payload and client view type describe the same JSON; the client type
  // is the stricter of the two.
  return <Dashboard data={data as unknown as MeData} />;
}
