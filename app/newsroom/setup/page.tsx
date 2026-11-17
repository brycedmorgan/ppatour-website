import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { requirePending } from "@/lib/newsroom/auth";
import { hasFactor, newTotpSecret, otpauthUri } from "@/lib/newsroom/mfa";
import { newsroomBase } from "@/lib/newsroom/session";
import { getMfa, putMfa } from "@/lib/newsroom/store";
import { AuthShell } from "../_components/AuthShell";
import { MfaSetup } from "../_components/MfaSetup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up sign-in" };

/** First sign-in: password done, choose a passkey or an authenticator app. */
export default async function MfaSetupPage() {
  const { sub } = await requirePending();
  let m = await getMfa(sub);
  if (hasFactor(m)) redirect(`${newsroomBase()}/verify/`);

  // One authenticator secret per setup, kept until it is confirmed.
  if (!m.pendingTotp) {
    m = { ...m, pendingTotp: newTotpSecret() };
    await putMfa(sub, m);
  }
  const secret = m.pendingTotp!;
  // Rendered on our server: the secret never goes to a third-party QR service.
  const qr = await QRCode.toDataURL(otpauthUri(secret, sub), { margin: 1, width: 220 });

  return (
    <AuthShell title="Secure your account">
      <MfaSetup email={sub} qr={qr} secret={secret} />
    </AuthShell>
  );
}
