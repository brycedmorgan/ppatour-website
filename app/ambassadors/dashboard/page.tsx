import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { currentAmbassador } from "@/lib/ambassadors/auth";
import { Dashboard } from "@/components/ambassadors/Dashboard";
import type { MeData } from "@/components/ambassadors/types";
import { HQ_EDITOR_COOKIE } from "@/lib/hq/editor";
import { readSessionValue } from "@/lib/ambassadors/session";

export const dynamic = "force-dynamic";

/** The signed-in dashboard. Server-guards on the session + live roster. */
export default async function DashboardPage() {
  const data = await currentAmbassador();
  if (!data) redirect("/ambassadors");
  // Team edit mode: the same shared editor cookie that unlocks HQ graphics also
  // turns on the upload/manage controls here. Regular ambassadors never have it.
  const jar = await cookies();
  const canUpload = !!readSessionValue(jar.get(HQ_EDITOR_COOKIE)?.value);
  // Server payload and client view type describe the same JSON; the client type
  // is the stricter of the two.
  return <Dashboard data={data as unknown as MeData} canUpload={canUpload} />;
}
