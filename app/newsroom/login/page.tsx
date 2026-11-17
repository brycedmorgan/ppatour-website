import { redirect } from "next/navigation";
import { getSession } from "@/lib/newsroom/auth";
import { newsroomBase } from "@/lib/newsroom/session";
import { AuthShell } from "../_components/AuthShell";
import { LoginForm } from "../_components/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function NewsroomLoginPage() {
  if (await getSession()) redirect(`${newsroomBase()}/`);
  return (
    <AuthShell title="Sign in">
      <LoginForm />
      <p className="mt-4 text-xs text-ppa-navy/55">
        After your password you&apos;ll confirm it&apos;s you with a passkey or an authenticator
        app. Sign-in with your pickleball.com account is coming. Ask Wesley for a login until then.
      </p>
    </AuthShell>
  );
}
