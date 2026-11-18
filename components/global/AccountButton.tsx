"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Header "Sign in" / account control (Sign in with Pickleball, lib/sso).
 * DEV ONLY for now (Wesley, 11/18: "so people can see it"); where it lives on
 * the real site is still open with Maxwell.
 *
 * Asks /api/me/ once per page load. Until it answers it shows "Sign in", never
 * a name, so a signed-out visitor is never shown someone else's state.
 * ⚠ /api/me/ calls the Pickleball user API for a signed-in user on every load;
 * cache the first name in the session before this goes to production.
 */
type Me = { signedIn: boolean; email?: string; profile?: { firstName?: string; nickname?: string } | null };

let mePromise: Promise<Me> | null = null;
function loadMe(): Promise<Me> {
  mePromise ??= fetch("/api/me/", { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<Me>) : { signedIn: false }))
    .catch(() => ({ signedIn: false }));
  return mePromise;
}

function PersonIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function AccountButton({ variant, onNavigate }: { variant: "desktop" | "mobile"; onNavigate?: () => void }) {
  const pathname = usePathname() || "/";
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let live = true;
    loadMe().then((m) => live && setMe(m));
    return () => {
      live = false;
    };
  }, []);

  const name = me?.signedIn ? me.profile?.nickname || me.profile?.firstName || "Account" : null;
  const returnTo = pathname.startsWith("/auth") ? "/" : pathname;
  // Plain <a>, not <Link>: /auth/login/ is a route handler that redirects
  // off-site, and a <Link> prefetch would start a sign-in.
  const href = name ? "/auth/" : `/auth/login/?returnTo=${encodeURIComponent(returnTo)}`;
  const label = name ?? "Sign in";

  if (variant === "mobile") {
    return (
      <a
        href={href}
        onClick={onNavigate}
        aria-label={name ? `Account: ${name}` : "Sign in"}
        className="flex size-10 items-center justify-center text-white/85 transition-colors hover:text-white lg:hidden"
      >
        <PersonIcon className="size-5" />
      </a>
    );
  }

  return (
    // The nav fills a 1024px screen, so below xl the control is the icon alone.
    <a
      href={href}
      aria-label={name ? `Account: ${name}` : "Sign in"}
      className="ml-1 flex size-9 shrink-0 items-center justify-center gap-2 rounded-full border border-white/25 text-[12px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-white/60 hover:bg-white/10 xl:w-auto xl:px-3.5"
    >
      <PersonIcon className="size-4" />
      <span className="hidden max-w-[10rem] truncate xl:inline">{label}</span>
    </a>
  );
}
