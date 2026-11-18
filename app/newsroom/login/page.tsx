import { redirect } from "next/navigation";
import { getSession } from "@/lib/newsroom/auth";
import { newsroomBase, pickleballEditorIds } from "@/lib/newsroom/session";
import { ssoConfigured } from "@/lib/sso/oidc";
import { AuthShell } from "../_components/AuthShell";
import { LoginForm } from "../_components/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function NewsroomLoginPage() {
  if (await getSession()) redirect(`${newsroomBase()}/`);
  // Shown where Sign in with Pickleball is set up and at least one account is listed.
  const sso = ssoConfigured() && pickleballEditorIds().size > 0;
  return (
    <AuthShell title="Sign in">
      {sso && (
        <>
          {/* Plain <a>: /auth/login/ redirects off-site, and a <Link> prefetch
              would start a sign-in. This page sends no Referer (proxy.ts), so
              the Newsroom address never reaches Pickleball. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/auth/login/?returnTo=/auth/newsroom/"
            className="flex w-full items-center justify-center bg-ppa-navy px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-navy-soft"
          >
            Sign in with Pickleball.com
          </a>
          <p className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-ppa-navy/45">
            <span aria-hidden className="h-px flex-1 bg-ppa-line" />
            or with a password
            <span aria-hidden className="h-px flex-1 bg-ppa-line" />
          </p>
        </>
      )}
      <LoginForm />
      <p className="mt-4 text-xs text-ppa-navy/55">
        After signing in you&apos;ll confirm it&apos;s you with a passkey or an authenticator app.
        {sso ? " Pickleball.com sign-in works for listed editors only." : " Ask Wesley for a login."}
      </p>
    </AuthShell>
  );
}
