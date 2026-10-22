import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import "../../ambassadors/ambassadors.css";
import { HqSignIn } from "@/components/hq/HqSignIn";
import { HQ_COOKIE, readStaffValue } from "@/lib/hq/staff";
import { previewEnabled } from "@/lib/ambassadors/config";

export const dynamic = "force-dynamic";

/** Staff sign-in for /hq. Signed-in staff go straight to the dashboard. */
export default async function HqSignInPage() {
  const jar = await cookies();
  if (readStaffValue(jar.get(HQ_COOKIE)?.value)) redirect("/hq");
  return (
    <div className="amb">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
      />
      <HqSignIn preview={previewEnabled()} />
    </div>
  );
}
