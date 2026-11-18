import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { curatedSlugFor, getRankingBySlug } from "@/lib/rankings-api";
import { ssoConfigured } from "@/lib/sso/oidc";
import { getSessionUser } from "@/lib/sso/session";
import { demoProfile, getSignedInProfile, type PublicProfile } from "@/lib/sso/user";

/**
 * /account/ — the signed-in fan's profile (Sign in with Pickleball, lib/sso).
 * DEV ONLY for now: nothing links here but the header account button, and what
 * sign-in unlocks on the real site is still open (Wesley + Maxwell).
 *
 * Shows only what Bernad's guide gives us and the person may see about
 * themselves: name, email, their PPA board ranks (user API `ppaRanking`), and,
 * when they are a ranked pro, their WPR rank + our profile. Contact, address
 * and ratings stay on the server (no ratings shown, Connor 7/29). Accounts live
 * at Pickleball; password, passkeys and MFA are edited on the SSO.
 */
export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

/** Per-person page: never cached. */
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  cancelled: "Sign-in was cancelled.",
  login_expired: "That sign-in took too long or was started in another browser. Try again.",
  state_mismatch: "That sign-in link wasn't valid. Try again.",
  not_configured: "Sign-in isn't available here yet.",
  newsroom_denied: "This Pickleball.com account doesn't have Newsroom access.",
};

/** SSO account settings (password, passkeys, MFA): oidc.<host> → sso.<host>/settings. */
function securityUrl(): string | null {
  try {
    const u = new URL(process.env.SSO_ISSUER ?? "");
    u.hostname = u.hostname.replace(/^oidc\./, "sso.");
    u.pathname = "/settings";
    return u.toString();
  } catch {
    return null;
  }
}

function initials(name: string, email: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length) return parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
  return (email[0] ?? "?").toUpperCase();
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; demo?: string }>;
}) {
  const { error, demo } = await searchParams;
  const configured = ssoConfigured();

  // ?demo=<player-slug>: a pro's public data in place of a sign-in. Never on production.
  const demoData = demo && process.env.VERCEL_ENV !== "production" ? await demoProfile(demo) : null;
  const user = demoData
    ? { sub: demoData.pbUuid, email: "preview@example.com" }
    : configured
      ? await getSessionUser()
      : null;

  let profile: PublicProfile | null = demoData;
  let profileFailed = false;
  if (user && !demoData) {
    try {
      profile = await getSignedInProfile();
    } catch (e) {
      profileFailed = true;
      console.error("[account] user API:", e instanceof Error ? e.message : e);
    }
  }

  const wpr = profile?.slug ? (await getRankingBySlug())[profile.slug] : undefined;
  const proSlug = wpr && profile?.slug ? (curatedSlugFor(profile.slug) ?? profile.slug) : null;
  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : "";
  const display = profile?.nickname || profile?.firstName || "";
  const security = securityUrl();

  return (
    <main className="min-h-screen bg-ppa-paper">
      <section className="bg-ppa-navy text-white">
        <div className="mx-auto max-w-5xl px-4 pb-12 pt-14 sm:px-6 sm:pt-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ppa-sky">Your account</p>

          {user ? (
            <div className="mt-5 flex items-center gap-5">
              <div
                aria-hidden
                className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ppa-blue font-display text-2xl sm:size-20 sm:text-3xl"
              >
                {profile?.image ? (
                  <Image src={profile.image} alt="" fill sizes="80px" className="object-cover object-top" />
                ) : (
                  initials(fullName, user.email)
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-3xl uppercase leading-none tracking-wide sm:text-5xl">
                  {display ? `Hi, ${display}` : "Welcome"}
                </h1>
                {fullName && fullName !== display && <p className="mt-2 text-sm text-white/85">{fullName}</p>}
                <p className="mt-1 break-all text-sm text-white/60">{user.email}</p>
              </div>
            </div>
          ) : (
            <>
              <h1 className="mt-4 font-display text-4xl uppercase leading-none tracking-wide sm:text-6xl">
                Sign in to the PPA Tour
              </h1>
              <p className="mt-4 max-w-xl text-white/75">
                Use your Pickleball.com account, the same one you use on PickleballTournaments.com and
                PickleballBrackets.com.
              </p>
            </>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        {demoData && (
          <p className="border border-ppa-blue/30 bg-ppa-blue/10 p-4 text-sm text-ppa-navy">
            Preview: this page is showing {demoData.firstName} {demoData.lastName}&apos;s public Pickleball.com data,
            not a signed-in account. Only available off production.
          </p>
        )}
        {demo && !demoData && process.env.VERCEL_ENV !== "production" && (
          <p className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            No public player found for &ldquo;{demo}&rdquo;.
          </p>
        )}
        {error && configured && (
          <p role="alert" className="border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            {ERRORS[error] ?? `Sign-in didn't finish (${error}). Try again.`}
            {error === "newsroom_denied" && user && (
              <span className="mt-1 block">
                To get access, send your account ID to the Newsroom admin:{" "}
                <code className="break-all font-mono">{user.sub}</code>
              </span>
            )}
          </p>
        )}

        {!user ? (
          configured ? (
            // Plain <a>: /auth/login/ redirects off-site, and a <Link> prefetch would start a sign-in.
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a
              href="/auth/login/?returnTo=/account/"
              className="inline-flex items-center gap-2 bg-ppa-blue px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ppa-blue-deep"
            >
              Sign in with Pickleball.com
            </a>
          ) : (
            <p className="text-ppa-navy/75">Sign-in isn&apos;t available here yet.</p>
          )
        ) : (
          <>
            {profileFailed && (
              <p className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                You&apos;re signed in, but we couldn&apos;t load your Pickleball.com profile just now. Refresh to try
                again.
              </p>
            )}

            {wpr && proSlug && (
              <section className="flex flex-col gap-5 border-t-4 border-ppa-yellow bg-ppa-navy-deep p-6 text-white sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
                    World Pickleball Ranking · {wpr.gender === "men" ? "Men" : "Women"}
                  </p>
                  <p className="mt-1 font-display text-5xl leading-none">#{wpr.rank}</p>
                  <p className="mt-1 text-sm tabular-nums text-white/70">{wpr.points.toLocaleString()} points</p>
                </div>
                <Link
                  href={`/athletes/${proSlug}/`}
                  className="self-start bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-ppa-navy transition-colors hover:bg-ppa-yellow sm:self-auto"
                >
                  Your PPA Tour profile →
                </Link>
              </section>
            )}

            {profile && profile.ppaRanking.length > 0 && (
              <section>
                <h2 className="font-display text-2xl uppercase tracking-wide text-ppa-navy">Your PPA rankings</h2>
                <p className="mt-1 text-sm text-ppa-navy/60">Last 365 days.</p>
                <div className="mt-4 overflow-x-auto border border-ppa-line bg-white">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-ppa-navy text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
                        <th scope="col" className="px-3 py-3 sm:px-4">Division</th>
                        <th scope="col" className="px-3 py-3 sm:px-4 text-right">Rank</th>
                        <th scope="col" className="px-3 py-3 sm:px-4 text-right">Points</th>
                        <th scope="col" className="px-3 py-3 sm:px-4 text-right">Events</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.ppaRanking.map((r) => (
                        <tr key={r.board} className="border-t border-ppa-line">
                          <th scope="row" className="px-3 py-3 sm:px-4 font-semibold text-ppa-navy">{r.board}</th>
                          <td className="px-3 py-3 sm:px-4 text-right font-display text-lg tabular-nums text-ppa-navy">#{r.rank}</td>
                          <td className="px-3 py-3 sm:px-4 text-right tabular-nums text-ppa-navy/75">{r.points.toLocaleString()}</td>
                          <td className="px-3 py-3 sm:px-4 text-right tabular-nums text-ppa-navy/75">{r.played || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section>
              <h2 className="font-display text-2xl uppercase tracking-wide text-ppa-navy">Your account</h2>
              <ul className="mt-4 grid gap-px border border-ppa-line bg-ppa-line sm:grid-cols-2">
                <AccountLink href="/following/" title="Your players" body="The pros you follow, with their next matches." />
                {profile?.slug && (
                  <AccountLink
                    href={`https://pickleball.com/players/${profile.slug}`}
                    title="Pickleball.com profile"
                    body="Your player page, results and ratings."
                    external
                  />
                )}
                {security && (
                  <AccountLink
                    href={security}
                    title="Password & security"
                    body="Password, passkeys and sign-in settings, managed by Pickleball.com."
                    external
                  />
                )}
                <li className="bg-white">
                  <form method="post" action="/auth/logout/" className="h-full">
                    <button
                      type="submit"
                      className="flex h-full w-full flex-col items-start p-5 text-left transition-colors hover:bg-ppa-paper"
                    >
                      <span className="font-display text-lg uppercase tracking-wide text-ppa-navy">Sign out</span>
                      <span className="mt-1 text-sm text-ppa-navy/65">Signs you out of ppatour.com on this device.</span>
                    </button>
                  </form>
                </li>
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function AccountLink({ href, title, body, external }: { href: string; title: string; body: string; external?: boolean }) {
  const inner = (
    <>
      <span className="font-display text-lg uppercase tracking-wide text-ppa-navy">
        {title}
        {external && <span aria-hidden> ↗</span>}
      </span>
      <span className="mt-1 text-sm text-ppa-navy/65">{body}</span>
    </>
  );
  const cls = "flex h-full flex-col p-5 transition-colors hover:bg-ppa-paper";
  return (
    <li className="bg-white">
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
          {inner}
        </a>
      ) : (
        <Link href={href} className={cls}>
          {inner}
        </Link>
      )}
    </li>
  );
}
