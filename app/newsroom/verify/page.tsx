import { redirect } from "next/navigation";
import { requirePending } from "@/lib/newsroom/auth";
import { hasFactor, relyingParty } from "@/lib/newsroom/mfa";
import { newsroomBase } from "@/lib/newsroom/session";
import { getMfa } from "@/lib/newsroom/store";
import { AuthShell } from "../_components/AuthShell";
import { MfaVerify } from "../_components/MfaVerify";

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirm it's you" };

/** Every sign-in after the first: password done, now the second step. */
export default async function MfaVerifyPage() {
  const { sub } = await requirePending();
  const m = await getMfa(sub);
  if (!hasFactor(m)) redirect(`${newsroomBase()}/setup/`);
  const { rpID } = await relyingParty();
  const passkeyHere = m.passkeys.some((p) => p.rpID === rpID);
  const passkeyElsewhere = !passkeyHere && m.passkeys.length > 0;

  return (
    <AuthShell title="Confirm it's you">
      <MfaVerify
        email={sub}
        passkey={passkeyHere}
        totp={Boolean(m.totp)}
        passkeyElsewhere={passkeyElsewhere}
      />
    </AuthShell>
  );
}
