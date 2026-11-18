import type { Metadata } from "next";

import { ssoConfigured } from "@/lib/sso/oidc";
import { getSessionUser } from "@/lib/sso/session";
import { getSignedInProfile, type PublicProfile } from "@/lib/sso/user";

/**
 * /auth/ — HIDDEN test page for "Sign in with Pickleball" while it's built.
 * Linked from nowhere, noindex. Where Sign in lives on the real site (and what
 * it unlocks) is still open with Wesley + Maxwell.
 */
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  cancelled: "Sign-in was cancelled.",
  login_expired: "That sign-in took too long or was started in another browser. Try again.",
  state_mismatch: "That sign-in link wasn't valid. Try again.",
  not_configured: "Sign-in isn't set up in this environment.",
};

export default async function AuthTestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = ssoConfigured() ? await getSessionUser() : null;

  let profile: PublicProfile | null = null;
  let profileError = "";
  if (user) {
    try {
      profile = await getSignedInProfile();
    } catch (e) {
      profileError = e instanceof Error ? e.message : "Profile lookup failed.";
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Test page · not linked</p>
      <h1 className="mt-2 text-3xl font-bold">Sign in with Pickleball</h1>

      {error && (
        <p role="alert" className="mt-6 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {ERRORS[error] ?? `Sign-in failed (${error}).`}
        </p>
      )}

      {!ssoConfigured() ? (
        <p className="mt-6">SSO env vars aren&apos;t set here (SSO_ISSUER, SSO_CLIENT_ID, SSO_CLIENT_SECRET, SSO_SESSION_SECRET).</p>
      ) : user ? (
        <div className="mt-6 space-y-4">
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            <dt className="font-semibold">Email</dt>
            <dd>{user.email || "—"}</dd>
            <dt className="font-semibold">Pickleball ID</dt>
            <dd className="break-all font-mono">{user.sub}</dd>
            <dt className="font-semibold">Name</dt>
            <dd>{profile ? `${profile.firstName} ${profile.lastName}`.trim() || "—" : "—"}</dd>
            <dt className="font-semibold">Profile slug</dt>
            <dd>{profile?.slug || "—"}</dd>
          </dl>
          {profileError && (
            <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Signed in, but the user API call failed: {profileError}
            </p>
          )}
          <form method="post" action="/auth/logout/">
            <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-white">
              Sign out
            </button>
          </form>
        </div>
      ) : (
        // A plain <a> on purpose: /auth/login/ is a route handler that redirects
        // off-site, and <Link> would prefetch it (starting a login per prefetch).
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a
          href="/auth/login/?returnTo=/auth/"
          className="mt-6 inline-block rounded bg-neutral-900 px-4 py-2 text-white"
        >
          Sign in with Pickleball
        </a>
      )}
    </main>
  );
}
