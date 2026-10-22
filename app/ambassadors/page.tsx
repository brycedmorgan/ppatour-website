import { redirect } from "next/navigation";
import { SignIn } from "@/components/ambassadors/SignIn";
import { currentAmbassador } from "@/lib/ambassadors/auth";
import { previewEnabled } from "@/lib/ambassadors/config";
import { previewSignInOptions } from "@/lib/ambassadors/portal";

export const dynamic = "force-dynamic";

/** Sign-in screen. If already signed in, go straight to the dashboard. */
export default async function AmbassadorsSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  if (await currentAmbassador()) redirect("/ambassadors/dashboard");
  const { e } = await searchParams;
  const preview = previewEnabled();
  return (
    <SignIn
      preview={preview}
      demoOptions={preview ? await previewSignInOptions() : []}
      linkError={e === "link"}
    />
  );
}
