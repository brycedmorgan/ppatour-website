"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { useFollows } from "@/components/app/follows";
import {
  disablePush,
  enablePush,
  permissionState,
  syncSubscription,
} from "@/components/app/push";

/**
 * "Your players" — the follow list, and the one place alerts are switched on.
 *
 * Asking for notification permission anywhere else would be a mistake: an
 * unprompted permission sheet is how an app earns a permanent Denied, and
 * Denied cannot be reversed from code on any platform. Here the fan has just
 * followed somebody, so the ask has an obvious reason.
 */
const ALERTS = [
  "Their draw is published",
  "They are on court now",
  "Their match is final",
  "A tour stop starts this week",
];

export function FollowingScreen() {
  const { follows, toggle } = useFollows();
  const [permission, setPermission] = useState<string>("default");
  const [busy, setBusy] = useState(false);
  /** null = still asking the server whether alerts can actually be delivered. */
  const [deliverable, setDeliverable] = useState<boolean | null>(null);

  useEffect(() => {
    setPermission(permissionState());
    fetch("/api/push/status")
      .then((r) => r.json())
      .then((d: { ready?: boolean }) => setDeliverable(Boolean(d.ready)))
      .catch(() => setDeliverable(false));
  }, []);

  const granted = permission === "granted";
  const denied = permission === "denied";
  const unsupported = permission === "unsupported";

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <h1 className="font-display text-3xl uppercase leading-none text-white">Your players</h1>
      <p className="mt-2 text-sm leading-relaxed text-white/55">
        Follow a pro and this app tells you when their pickleball happens.
      </p>

      {/* Alerts */}
      <div className="mt-6 border border-white/10 bg-white/5 p-4">
        <div className="flex items-start gap-3">
          {granted ? (
            <Bell className="mt-0.5 size-5 shrink-0 text-ppa-yellow" aria-hidden />
          ) : (
            <BellOff className="mt-0.5 size-5 shrink-0 text-white/40" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white">
              {granted ? "Alerts are on" : "Alerts are off"}
            </p>
            <ul className="mt-2 space-y-1 text-xs leading-relaxed text-white/50">
              {ALERTS.map((a) => (
                <li key={a}>· {a}</li>
              ))}
            </ul>

            {unsupported && (
              <p className="mt-3 text-xs text-white/50">
                This device cannot receive alerts. On iPhone, add the app to your home screen
                first.
              </p>
            )}
            {denied && (
              <p className="mt-3 text-xs text-white/50">
                Notifications are blocked for this app. Turn them back on in your device
                settings.
              </p>
            )}
            {!unsupported && !denied && deliverable === false && (
              <p className="mt-3 text-xs text-white/50">
                Alerts are not switched on for this build yet. Your follows are saved.
              </p>
            )}

            {!unsupported && !denied && deliverable === true && (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  if (granted) {
                    await disablePush();
                    setPermission("default");
                  } else {
                    setPermission(await enablePush());
                  }
                  setBusy(false);
                }}
                className={`mt-3 inline-flex h-9 items-center px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition active:scale-[0.97] disabled:opacity-50 ${
                  granted
                    ? "bg-white/10 text-white ring-1 ring-inset ring-white/25"
                    : "bg-ppa-blue text-white"
                }`}
              >
                {granted ? "Turn off" : "Turn on alerts"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* The list */}
      <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
        {follows.map((f) => (
          <li key={f.slug} className="flex items-center gap-3 py-3">
            <Link
              href={`/athletes/${f.slug}/`}
              className="min-w-0 flex-1 truncate text-sm font-bold uppercase tracking-[0.08em] text-white"
            >
              {f.name}
            </Link>
            <button
              type="button"
              aria-label={`Unfollow ${f.name}`}
              onClick={() => {
                toggle(f);
                void syncSubscription();
              }}
              className="flex size-8 shrink-0 items-center justify-center text-white/40 transition-colors hover:text-white"
            >
              <X className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      {follows.length === 0 && (
        <p className="py-8 text-sm text-white/50">
          Nobody yet.{" "}
          <Link href="/athletes/" className="text-ppa-sky underline underline-offset-4">
            Find a pro
          </Link>{" "}
          and tap Follow on their profile.
        </p>
      )}
    </div>
  );
}
