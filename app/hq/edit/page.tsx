import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import "../../ambassadors/ambassadors.css";
import { HqEditSignIn } from "@/components/hq/HqEditSignIn";
import { HQ_EDITOR_COOKIE, editorConfigured } from "@/lib/hq/editor";
import { readSessionValue } from "@/lib/ambassadors/session";

export const dynamic = "force-dynamic";

/** Unlock HQ graphics edit mode with the shared team password. */
export default async function HqEditPage() {
  const jar = await cookies();
  // Already in edit mode → straight to HQ.
  if (readSessionValue(jar.get(HQ_EDITOR_COOKIE)?.value)) redirect("/hq");
  // If no team password is configured, there is nothing to unlock.
  if (!editorConfigured()) redirect("/hq");
  return (
    <div className="amb">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
      />
      <HqEditSignIn />
    </div>
  );
}
