"use client";

import { Bell, BellRing } from "lucide-react";
import { useFollows } from "@/components/app/follows";
import { syncSubscription } from "@/components/app/push";
import { useAppMode } from "@/components/app/use-app-mode";

/**
 * Follow / Following, on an athlete's profile.
 *
 * ⚠ App-mode only. On the website this button would promise alerts the browser
 * cannot deliver — iOS gives web push to installed apps and nothing else — and
 * a follow you cannot be notified about is a dead control. The website stays
 * exactly as it is.
 */
export function FollowButton({ slug, name }: { slug: string; name: string }) {
  const isApp = useAppMode();
  const { toggle, isFollowing } = useFollows();
  if (!isApp) return null;

  const following = isFollowing(slug);
  const Icon = following ? BellRing : Bell;

  return (
    <button
      type="button"
      onClick={() => {
        toggle({ slug, name });
        // Push the new list at the routing table straight away, so an alert
        // that fires in the next minute already knows about this change.
        void syncSubscription();
      }}
      aria-pressed={following}
      className={`mt-4 inline-flex h-10 items-center gap-2 px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition active:scale-[0.97] ${
        following
          ? "bg-ppa-yellow text-ppa-navy"
          : "bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/15"
      }`}
    >
      <Icon className="size-4" aria-hidden />
      {following ? "Following" : "Follow"}
    </button>
  );
}
